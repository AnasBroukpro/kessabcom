/**
 * Optimized Audio Recording Utility
 * - Limits duration to 60 seconds
 * - Uses low bitrate (OPUS) for high compression (voice quality)
 * - Returns a Blob compatible with modern browsers
 */

export const AUDIO_MAX_DURATION = 60000; // 60 seconds
export const AUDIO_BITRATE = 16000; // 16kbps is enough for clear voice

export interface RecordingSession {
  recorder: MediaRecorder;
  stream: MediaStream;
  chunks: Blob[];
}

/**
 * Starts a new optimized recording session
 */
export async function startRecording(): Promise<RecordingSession> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  // Choose mimeType (prefer opus)
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
    ? 'audio/webm;codecs=opus' 
    : 'audio/ogg;codecs=opus';

  const recorder = new MediaRecorder(stream, {
    mimeType,
    audioBitsPerSecond: AUDIO_BITRATE
  });

  const chunks: Blob[] = [];
  
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start(1000); // Capture in 1s chunks
  
  return { recorder, stream, chunks };
}

/**
 * Stops the recording and returns the optimized Blob
 */
export function stopRecording(session: RecordingSession): Promise<Blob> {
  return new Promise((resolve) => {
    session.recorder.onstop = () => {
      const blob = new Blob(session.chunks, { type: session.recorder.mimeType });
      session.stream.getTracks().forEach(track => track.stop());
      resolve(blob);
    };
    if (session.recorder.state !== 'inactive') {
      session.recorder.stop();
    }
  });
}
