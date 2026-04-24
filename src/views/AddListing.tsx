import React, { useState, useEffect } from 'react';
import { ViewType } from '../App';
import { ArrowLeft, ArrowRight, X, Video, Camera, Mic, CheckCircle2, MapPin, TrendingUp, AudioLines, Loader2, Award, Mountain, Globe, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { useSettings } from '../hooks/useSettings';
import { compressImage, checkPayloadSize } from '../lib/imageUtils';
import LocationMap from '../components/LocationMap';
import { cityCoords } from '../constants/cityMapping';
import { ChevronDown } from 'lucide-react';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
  listingId?: string;
}

export default function AddListing({ onNavigate, listingId: propListingId }: Props) {
  const { user, profile } = useAuth();
  const { settings } = useSettings();
  const [listingId, setListingId] = useState<string | null>(propListingId || null);

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedRaces, setSelectedRaces] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [sheepCount, setSheepCount] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [videoFile, setVideoFile] = useState<File | string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<(File | string | null)[]>([null, null, null, null]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [farmLocation, setFarmLocation] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  useEffect(() => {
    setMounted(true);

    if (listingId) {
      const fetchListing = async () => {
        try {
          const data = await firestoreService.getAnnouncement(listingId) as any;
          if (data) {
            setSheepCount(data.sheepCount?.toString() || '');
            setStartingPrice(data.price?.toString() || '');
            setDescription(data.description || '');
            setYoutubeLink(data.youtubeLink || '');
            setAddress(data.location || '');
            setCoordinates(data.coordinates || null);
            setSelectedSizes(data.sizes || []);
            setSelectedRaces(data.races || []);
            if (data.age) {
              const ageMap: Record<string, string> = {
                'سنان الحليب': 'milk',
                'ثني': 'thni',
                'رباعي': 'rba3i',
                'سداسي': 'sdassi',
                'جامع': 'jam3'
              };
              const ages = data.age.split(', ').map((a: string) => ageMap[a.trim()] || a.trim());
              setSelectedAges(ages.filter((a: string) => ['milk', 'thni', 'rba3i', 'sdassi', 'jam3'].includes(a)));
            }
            if (data.images) {
              const imgs = [...data.images];
              while (imgs.length < 4) imgs.push(null);
              setPhotoFiles(imgs);
            } else {
              setPhotoFiles([null, null, null, null]);
            }
            setVideoFile(data.videoUrl || null);
            setAudioUrl(data.audioUrl || null);
            setFarmLocation(data.farmLocation || '');
          }
        } catch (error) {
          console.error("Error fetching listing:", error);
          setError("تعذر تحميل بيانات الإعلان.");
        }
      };
      fetchListing();
    }
  }, [listingId]);

  const resetForm = () => {
    setFarmLocation('');
    setSelectedSizes([]);
    setSelectedRaces([]);
    setSelectedAges([]);
    setSheepCount('');
    setStartingPrice('');
    setDescription('');
    setYoutubeLink('');
    setAddress('');
    setCoordinates(null);
    setPhotoFiles([null, null, null, null]);
    setVideoFile(null);
    setAudioUrl(null);
  };

  const handleSaveAsDraft = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const translatedRaces = selectedRaces.map(r => 
        r === 'sardi' ? 'سردي' : r === 'bargui' ? 'بركي' : r === 'imported' ? 'مستورد' : r
      );
      const translatedAges = selectedAges.map(a => 
        a === 'milk' ? 'سنان الحليب' : a === 'thni' ? 'ثني' : a === 'rba3i' ? 'رباعي' : a === 'sdassi' ? 'سداسي' : a === 'jam3' ? 'جامع' : a
      );

      const announcementData = {
        sellerId: user.uid,
        sellerName: profile?.fullName || 'كساب',
        phone: profile?.phoneNumber || '',
        whatsapp: profile?.whatsappNumber || '',
        title: `${translatedRaces.join(', ')} - ${sheepCount} رأس`,
        description,
        price: parseInt(startingPrice) || 0,
        category: translatedRaces[0] || 'أغنام',
        location: address || profile?.location || 'سطات',
        coordinates: coordinates || null,
        sheepCount: parseInt(sheepCount),
        sizes: selectedSizes,
        races: selectedRaces,
        age: translatedAges.join(', '),
        farmLocation: farmLocation,
        youtubeLink,
        status: 'pending',
        rating: 5,
        ratingCount: 1
      };

      if (listingId) {
        await firestoreService.updateAnnouncement(listingId, announcementData);
      } else {
        await firestoreService.createAnnouncement(announcementData);
      }
      onNavigate('seller');
    } catch (error) {
      console.error("Failed to save draft:", error);
      setError("وقع خطأ أثناء حفظ المسودة. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      let audioUrlFinal = audioUrl && !audioBlob ? audioUrl : null;
      if (audioBlob) {
        audioUrlFinal = await firestoreService.uploadImage(
          new File([audioBlob], `audio_${Date.now()}.ogg`, { type: 'audio/ogg' }),
          `announcements/audios/${user.uid}_${Date.now()}.ogg`
        );
      }

      let videoUrlFinal = typeof videoFile === 'string' ? videoFile : null;
      if (videoFile && typeof videoFile !== 'string') {
        setIsUploading(true);
        videoUrlFinal = await firestoreService.uploadFileWithProgress(
          videoFile,
          `announcements/videos/${user.uid}_${Date.now()}_${videoFile.name}`,
          (p) => setUploadProgress(p)
        );
        setIsUploading(false);
      }

      setUploadProgress(0);
      const photoUrls = await Promise.all(
        photoFiles.filter(f => f !== null).map(async (file, idx) => {
          if (typeof file === 'string') return file;
          setIsUploading(true);
          const url = await firestoreService.uploadFileWithProgress(
            file!,
            `announcements/images/${user.uid}_${Date.now()}_${idx}`,
            (p) => setUploadProgress(p)
          );
          setIsUploading(false);
          return url;
        })
      );

      const translatedRaces = selectedRaces.map(r => 
        r === 'sardi' ? 'سردي' : r === 'bargui' ? 'بركي' : r === 'imported' ? 'مستورد' : r
      );
      const translatedAges = selectedAges.map(a => 
        a === 'milk' ? 'سنان الحليب' : a === 'thni' ? 'ثني' : a === 'rba3i' ? 'رباعي' : a === 'sdassi' ? 'سداسي' : a === 'jam3' ? 'جامع' : a
      );

      const announcementData = {
        sellerId: user.uid,
        sellerName: profile?.fullName || profile?.displayName || 'كساب',
        sellerPseudo: profile?.pseudo || null,
        phone: profile?.phoneNumber || '',
        whatsapp: profile?.whatsappNumber || '',
        title: `${translatedRaces.join(', ')} - ${sheepCount} رأس`,
        description,
        price: parseInt(startingPrice) || 0,
        category: translatedRaces[0] || 'أغنام',
        // Instead of defaulting to 'سطات', check if they provided coordinates. 
        // If they did but didn't provide address, store "موقع على الخريطة"
        location: address || profile?.location || (coordinates ? 'موقع على الخريطة' : 'سطات'),
        coordinates: coordinates || null,
        images: photoUrls.length > 0 ? (photoUrls as string[]) : ["https://i.ytimg.com/vi/RrkkshRUttw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD92lI4Kxe5liKSwWZaJuLAFopNeA"],
        sheepCount: parseInt(sheepCount),
        sizes: selectedSizes,
        races: selectedRaces,
        age: translatedAges.join(', '),
        audioUrl: audioUrlFinal,
        farmLocation: farmLocation,
        videoUrl: videoUrlFinal,
        youtubeLink,
        status: settings.autoAcceptSellers ? 'active' : 'pending',
        rating: 5,
        ratingCount: 1
      };

      // Payload size check removed as we are using Storage URLs now

      // Generate reCAPTCHA Enterprise token for server-side verification 
      let recaptchaToken = '';
      // Temporarily disabled to avoid blocking production submissions
      if (false && import.meta.env.PROD && typeof window !== 'undefined' && (window as any).grecaptcha?.enterprise) {
        try {
          const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
          if (siteKey) {
            console.log('🛡️ Generating reCAPTCHA Enterprise token...');
            recaptchaToken = await (window as any).grecaptcha.enterprise.execute(siteKey, { action: 'create_listing' });
          }
        } catch (err) {
          console.error("reCAPTCHA execution error:", err);
        }
      }

      const finalData = {
        ...announcementData,
        recaptchaToken
      };

      if (listingId) {
        await firestoreService.updateAnnouncement(listingId, finalData);
      } else {
        await firestoreService.createAnnouncement(finalData);
      }
      setShowSuccess(true);
    } catch (error: any) {
      console.error("Failed to save announcement:", error);
      let errorMsg = "وقع خطأ أثناء حفظ القطيع. حاول مرة أخرى.";
      
      // More specific error guidance
      if (error.code === 'storage/unauthorized') {
        errorMsg = "ماعندكش الصلاحية باش ترفع الملفات. تأكد بلي راك مسجل الدخول.";
      } else if (error.message?.includes('net::ERR_FAILED') || error.name === 'FirebaseError') {
        errorMsg = "مشكل في الاتصال بالسيرفر (CORS or Network). تأكد من الأنترنيت وجرب مرة أخرى.";
      } else if (error.message?.includes('Payload Too Large')) {
        errorMsg = "حجم البيانات كبير بزاف. جرب تنقص من حجم الصور.";
      }
      
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const deleteAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
  };
    
  const handleGetLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocating(false);
          setError(null);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
          setError("تعذر الحصول على الموقع. يرجى التأكد من تفعيل GPS.");
        }
      );
    } else {
      alert("متصفحك لا يدعم تحديد الموقع.");
      setIsLocating(false);
    }
  };

  const ages = [
    { id: 'milk', label: 'سنان الحليب' },
    { id: 'thni', label: 'ثني' },
    { id: 'rba3i', label: 'رباعي' },
    { id: 'sdassi', label: 'سداسي' },
    { id: 'jam3', label: 'جامع' }
  ];

  const toggleRace = (id: string) => setSelectedRaces(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  const toggleSize = (id: string) => setSelectedSizes(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const toggleAge = (id: string) => setSelectedAges(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  const handlePhotoChange = (index: number, file: File | string | null) => {
    const newFiles = [...photoFiles];
    newFiles[index] = file;
    setPhotoFiles(newFiles);
  };
    
  const renderLocationStep = () => (
    <section className="bg-surface-container-lowest p-6 rounded-[10px] border border-outline-variant/30 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs">1</span>
        تحديد موقع القطيع
      </h2>
      <div className="space-y-4">
        <label className="block text-sm font-bold text-on-surface-variant">موقع الضيعة</label>
        <input 
          type="text"
          value={farmLocation}
          onChange={(e) => setFarmLocation(e.target.value)}
          placeholder="مثلا: طريق مديونة، قرب مسجد الرضوان"
          className="w-full h-12 px-4 bg-surface-container-high border-none rounded-[10px] text-on-surface focus:ring-2 focus:ring-primary transition-all text-right outline-none font-medium"
        />
        
        <div className="h-[300px] w-full rounded-[10px] overflow-hidden border border-outline-variant/30">
          <LocationMap 
            lat={coordinates?.lat} 
            lng={coordinates?.lng} 
            onLocationSelect={(lat, lng) => setCoordinates({ lat, lng })}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isLocating}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-container text-on-primary-container py-3 px-4 rounded-[10px] font-bold transition-colors border border-transparent hover:bg-transparent hover:text-on-primary-container hover:border-on-primary-container"
          >
            {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
            استعمل موقعي الحالي (GPS)
          </button>
          <div className="flex-1 relative">
            <div className="relative group">
              <select 
                className="w-full h-12 px-4 bg-surface-container-high border-none rounded-[10px] text-on-surface focus:ring-2 focus:ring-primary transition-all text-right outline-none font-bold appearance-none cursor-pointer"
                value={address || profile?.location || ''}
                onChange={(e) => setAddress(e.target.value)}
              >
                <option value="" disabled>اختار المدينة...</option>
                {Object.keys(cityCoords).sort().map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
        {coordinates && (
          <div className="bg-green-50 text-green-800 p-3 rounded-[10px] text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            تم تحديد الموقع بنجاح: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </div>
        )}
      </div>
    </section>
  );

  const renderMediaStep = () => (
    <section className="bg-surface-container-lowest p-6 rounded-[10px] border border-outline-variant/30 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs">2</span>
        الصور والفيديو (مهم بزاف)
      </h2>
      <p className="text-sm text-on-surface-variant">الكليان كايبغي يشوف الحولي مزيان قبل ما يجي. صور من الجناب، القدام، وفيديو كايتحرك.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Main Video/Photo */}
        <div className="col-span-2 row-span-2 relative bg-surface-container-low rounded-[10px] border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center aspect-square cursor-pointer hover:bg-surface-variant/50 transition-colors group overflow-hidden">
          {videoFile ? (
            <div className="absolute inset-0">
              <video 
                src={typeof videoFile === 'string' ? videoFile : URL.createObjectURL(videoFile)} 
                className="w-full h-full object-cover" 
                controls={typeof videoFile === 'string'}
              />
              <button 
                onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}
                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg z-20 hover:scale-110 transition-transform flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <input 
                type="file" 
                accept="video/*" 
                capture="environment"
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  // 1. Check size (10MB = 10485760 bytes)
                  if (file.size > 10 * 1024 * 1024) {
                    setError("الفيديو كبير بزاف (أكثر من 10 ميغا). حاول تنقص من الجودة ديالو.");
                    e.target.value = '';
                    return;
                  }

                  // 2. Check duration
                  const video = document.createElement('video');
                  video.preload = 'metadata';
                  video.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(video.src);
                    if (video.duration > 20) {
                      setError("الفيديو طويل بزاف (أكثر من 20 ثانية). خاصو يكون فيديو قصير.");
                      setVideoFile(null);
                    } else {
                      setVideoFile(file);
                      setError(null);
                    }
                  };
                  video.onerror = () => {
                    setError("وقع مشكل في قراءة هاد الفيديو. جرب واحد آخر.");
                  };
                  video.src = URL.createObjectURL(file);
                }}
              />
              <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-on-surface text-sm text-center px-2">فيديو رئيسي (أقل من 20 ثانية)</span>
                <span className="text-[10px] text-primary font-black mt-1 uppercase">Max 10 MB</span>
              </div>
            </>
          )}
        </div>
        
        {/* Photo Slots */}
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="relative bg-surface-container-low rounded-[10px] border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center aspect-square cursor-pointer hover:bg-surface-variant/50 transition-colors overflow-hidden group">
            {photoFiles[index] ? (
              <div className="absolute inset-0">
                <img 
                  src={typeof photoFiles[index] === 'string' ? photoFiles[index] as string : URL.createObjectURL(photoFiles[index] as File)} 
                  className="w-full h-full object-cover" 
                  alt={`Photo ${index + 1}`} 
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePhotoChange(index, null); }}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow-lg z-20 hover:scale-110 transition-transform flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  onChange={(e) => handlePhotoChange(index, e.target.files?.[0] || null)}
                />
                <Camera className="w-6 h-6 text-on-surface-variant mb-2" />
                <span className="text-xs font-medium text-on-surface-variant">أضف صورة رقم {index + 1}</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* YouTube Link Field */}
      <div className="mt-6 space-y-2">
        <label className="block text-sm font-bold text-on-surface-variant flex items-center gap-2">
          رابط فيديو يوتيوب (اختياري)
          <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">YouTube</span>
        </label>
        <div className="relative">
          <input 
            className="w-full h-12 px-4 bg-surface-container-high border-none rounded-[10px] text-on-surface focus:ring-2 focus:ring-primary transition-all text-left" 
            placeholder="https://www.youtube.com/watch?v=..." 
            type="url" 
            dir="ltr"
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value)}
          />
        </div>
        <p className="text-[10px] text-on-surface-variant">إلا عندك فيديو ف يوتيوب، حط الرابط هنا باش يشوفوه الناس.</p>
      </div>
    </section>
  );

  const renderInfoStep = () => (
    <section className="bg-surface-container-lowest p-6 rounded-[10px] border border-outline-variant/30 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs">3</span>
        معلومات القطيع
      </h2>
      
      <div className="space-y-6">
        <div className="space-y-2 relative">
          <label className="block text-sm font-bold text-on-surface-variant">عدد رؤوس الغنم المتوفرة</label>
          <div className="relative">
            <input 
              className="w-full h-14 px-4 bg-surface-container-high border-none rounded-[10px] text-on-surface focus:ring-2 focus:ring-primary transition-all text-right font-medium text-lg" 
              placeholder="مثلا: 25" 
              type="number" 
              required
              value={sheepCount}
              onChange={(e) => setSheepCount(e.target.value)}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-bold">
              رأس
            </div>
          </div>
        </div>

        <div className="space-y-2 relative">
          <label className="block text-sm font-bold text-on-surface-variant">أقل ثمن كيبدا من</label>
          <div className="relative">
            <input 
              className="w-full h-14 px-4 bg-surface-container-high border-none rounded-[10px] text-on-surface focus:ring-2 focus:ring-primary transition-all text-right font-medium text-lg" 
              placeholder="مثلا: 1500" 
              type="number" 
              required
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-bold">
              درهم
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-on-surface-variant">السن (الأعمار)</label>
          <div className="flex flex-wrap gap-2">
            {ages.map((age) => (
              <button
                key={age.id}
                type="button"
                onClick={() => toggleAge(age.id)}
                className={`px-5 py-2.5 font-bold rounded-[10px] transition-colors border text-sm flex-1 sm:flex-none text-center ${
                  selectedAges.includes(age.id)
                    ? 'bg-primary text-on-primary border-primary shadow-md hover:bg-transparent hover:text-primary'
                    : 'bg-surface-container-high text-on-surface border-outline-variant/30 hover:border-primary'
                }`}
              >
                {age.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-on-surface-variant">حجم الحولي</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: 'small', label: 'صغير' },
              { id: 'medium', label: 'متوسط' },
              { id: 'large', label: 'كبير' },
              { id: 'extra-large', label: 'كبير جداً' }
            ].map((size) => (
              <button
                key={size.id}
                type="button"
                onClick={() => toggleSize(size.id)}
                className={`px-4 py-3 font-bold rounded-[10px] transition-colors border text-sm ${
                  selectedSizes.includes(size.id)
                    ? 'bg-primary text-on-primary border-primary shadow-md hover:bg-transparent hover:text-primary'
                    : 'bg-surface-container-high text-on-surface border-outline-variant/30 hover:border-primary'
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-on-surface-variant">سلالة الغنم</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { id: 'sardi', label: 'سردي', icon: Award },
              { id: 'bargui', label: 'بركي', icon: Mountain },
              { id: 'imported', label: 'مستورد', icon: Globe }
            ].map((race) => {
              const Icon = race.icon;
              const isSelected = selectedRaces.includes(race.id);
              return (
                <button
                  key={race.id}
                  type="button"
                  onClick={() => toggleRace(race.id)}
                  className={`px-4 py-3 font-bold rounded-[10px] transition-colors border flex items-center justify-center gap-2 ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary shadow-md hover:bg-transparent hover:text-primary'
                      : 'bg-surface-container-high text-on-surface border-outline-variant/30 hover:border-primary'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-on-primary group-hover:text-primary' : 'text-primary/70'}`} />
                  {race.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 relative">
          <label className="block text-sm font-bold text-on-surface-variant">وصف إضافي (اختياري)</label>
          <div className={`p-4 rounded-[10px] flex items-center justify-between border shadow-sm mb-4 transition-all ${isRecording ? 'bg-red-50 border-red-100 animate-pulse' : 'bg-[#e8f3e8] border-green-100'}`}>
            <div className="flex items-center gap-4">
              <div className={isRecording ? 'text-red-500' : 'text-green-800/40'}>
                <AudioLines className="w-10 h-10" />
              </div>
            </div>
            
            <div className="flex-1 text-right px-4">
              {audioUrl ? (
                <div className="flex flex-col items-end gap-1">
                  <p className="text-[#1a4d1a] font-bold text-sm">تم تسجيل الأوديو</p>
                  <div className="flex items-center gap-2">
                    <audio src={audioUrl} controls className="h-8 w-40" />
                    <button type="button" onClick={deleteAudio} className="text-error text-xs font-bold hover:underline">حذف</button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className={`font-bold text-lg ${isRecording ? 'text-red-800' : 'text-[#1a4d1a]'}`}>
                    {isRecording ? 'جاري التسجيل...' : 'إضافة أوديو لوصف القطيع'}
                  </h3>
                  <p className={`text-sm ${isRecording ? 'text-red-600' : 'text-[#1a4d1a]/60'}`}>
                    {isRecording ? 'كليكي باش تحبس' : 'هضر على السن، المكلة، والنوع'}
                  </p>
                </>
              )}
            </div>

            {!audioUrl && (
              <button 
                type="button"
                className={`w-16 h-16 rounded-[10px] flex items-center justify-center text-white shadow-lg transition-colors border border-transparent ${isRecording ? 'bg-red-600 hover:bg-transparent hover:text-red-600 hover:border-red-600' : 'bg-[#0a5c1a] hover:bg-transparent hover:text-[#0a5c1a] hover:border-[#0a5c1a]'}`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? <div className="w-4 h-4 bg-white rounded-sm" /> : <Mic className="w-8 h-8" />}
              </button>
            )}
          </div>

          <textarea 
            className="w-full p-4 bg-surface-container-high border-none rounded-[10px] text-on-surface focus:ring-2 focus:ring-primary transition-all resize-none h-32" 
            placeholder="كتب أي حاجة خرى بغيتي الكليان يعرفها على هاد الحولي..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
      </div>
    </section>
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-surface pb-20 md:pb-0" dir="rtl">
      <header className="bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate(profile?.role === 'admin' ? 'admin' : 'seller')} 
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group"
            >
              <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
              <span className="font-black text-sm">الرجوع للوحة التحكم</span>
            </button>
          </div>
          
          <h1 className="text-xl font-black text-on-surface font-headline">
            {listingId ? 'تعديل القطيع' : 'إضافة قطيع جديد'}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-[10px] font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <ArrowLeft className="w-5 h-5 rotate-45" />
            <p>{error}</p>
          </div>
        )}

        <div className="">
          {currentStep === 1 && renderLocationStep()}
          {currentStep === 2 && renderMediaStep()}
          {currentStep === 3 && renderInfoStep()}
        </div>

        <div className="flex gap-4 pt-6">
          {currentStep > 1 && (
            <button onClick={() => setCurrentStep(prev => prev - 1)} className="flex-1 py-4 bg-surface-container-high rounded-[10px] font-bold transition-colors border border-transparent hover:bg-transparent hover:text-on-surface hover:border-outline-variant">رجوع</button>
          )}
          {currentStep < 3 ? (
            <button onClick={() => setCurrentStep(prev => prev + 1)} className="flex-1 py-4 bg-primary text-on-primary rounded-[10px] font-bold transition-colors border border-transparent hover:bg-transparent hover:text-primary hover:border-primary">التالي</button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex-1 py-4 bg-primary text-on-primary rounded-[10px] font-bold transition-colors border border-transparent hover:bg-transparent hover:text-primary hover:border-primary flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري النشر...</span>
                </>
              ) : (
                <span>نشر الإعلان</span>
              )}
            </button>
          )}
        </div>
      </main>

      {showSuccess && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[10px] p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-[#1a1a1a] mb-2 font-headline">{listingId ? 'تم التعديل!' : 'مبروك!'}</h3>
            <p className="text-[#4a4a4a] font-bold leading-relaxed mb-8">
              {listingId ? 'تم تعديل معلومات القطيع بنجاح.' : 'صافي الغنم ديالك دخلات , دابا الناس غيلقاو الغنم ديالك'}
            </p>
            <button 
              onClick={() => onNavigate('seller')}
              className="w-full py-4 bg-[#2E7D32] text-white rounded-[10px] font-black shadow-lg shadow-green-900/20 transition-colors border border-transparent hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32]"
            >
              تم
            </button>
          </div>
        </div>
      )}

      {isSubmitting && !showSuccess && (
        <div className="fixed inset-0 bg-on-surface/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-surface rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div 
                className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" 
                style={{ animationDuration: '1.5s' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-on-surface mb-2 font-headline">جاري النشر...</h3>
              <p className="text-on-surface-variant text-sm font-medium">كنسجلو المعلومات ديالك، شوية د الصبر.</p>
            </div>
            
            {(isUploading || uploadProgress > 0) && (
              <div className="space-y-3">
                <div className="h-3 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/10">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                    {uploadProgress === 100 ? 'تم الرفع' : 'جاري رفع الملفات'}
                  </span>
                  <span className="text-sm font-black text-on-surface tabular-nums">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
