/**
 * Compress a base64 image string and return a base64 JPEG string.
 * Used for images that are stored as base64 in Firestore (avatars, banners).
 */
export const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      console.error('Failed to load image for compression');
      resolve(base64Str); // Fallback to original if compression fails
    };
  });
};

/**
 * Compress a File object (from an <input type="file">) and return a new WebP File.
 * Used for images uploaded to Firebase Storage (listings, profile photos).
 * - Validates MIME type (must be image/*)
 * - Validates file size (default max 20 MB)
 * - Resizes proportionally to maxWidth / maxHeight
 * - Converts to WebP at given quality
 * - Falls back to JPEG if WebP is not supported by the browser
 */
export const compressFileForUpload = (
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.78,
  maxInputMB = 20
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // --- Validation ---
    if (!file.type.startsWith('image/')) {
      return reject(new Error('الملف ليس صورة صالحة (يجب أن يكون JPEG, PNG, HEIC...)'));
    }
    if (file.size > maxInputMB * 1024 * 1024) {
      return reject(new Error(`حجم الصورة يتجاوز ${maxInputMB} ميغابايت. الرجاء اختيار صورة أصغر.`));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Proportional resize — only downscale, never upscale
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas non disponible'));
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fall back to JPEG
        const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
        const outputMime = supportsWebP ? 'image/webp' : 'image/jpeg';
        const ext = supportsWebP ? 'webp' : 'jpg';

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('فشل ضغط الصورة'));
            const outputFileName = file.name.replace(/\.[^.]+$/, '') + `_compressed.${ext}`;
            resolve(new File([blob], outputFileName, { type: outputMime }));
          },
          outputMime,
          quality
        );
      };
      img.onerror = () => reject(new Error('تعذر تحميل الصورة للضغط'));
    };
    reader.onerror = () => reject(new Error('تعذر قراءة الملف'));
    reader.readAsDataURL(file);
  });
};

export const getBase64Size = (base64Str: string): number => {
  const padding = base64Str.endsWith('==') ? 2 : base64Str.endsWith('=') ? 1 : 0;
  return (base64Str.length * (3 / 4)) - padding;
};

export const checkPayloadSize = (data: any, limitBytes = 800000): boolean => {
  const json = JSON.stringify(data);
  // Use TextEncoder to get actual byte size (important for multi-byte Arabic characters)
  const sizeInBytes = new TextEncoder().encode(json).length;
  return sizeInBytes < limitBytes;
};
