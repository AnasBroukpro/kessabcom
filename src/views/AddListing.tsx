import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewType } from '../App';
import { ArrowLeft, ArrowRight, X, Video, Camera, Mic, CheckCircle2, MapPin, TrendingUp, AudioLines, Loader2, Award, Mountain, Globe, Trash2, Info, Scale, Calendar, Ruler, PlusCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { useSettings } from '../hooks/useSettings';
import { compressImage, checkPayloadSize, compressFileForUpload } from '../lib/imageUtils';
import * as audioUtils from '../lib/audioUtils';
import LocationMap from '../components/LocationMap';
import { cityCoords, getClosestCity, normalizeArabic } from '../constants/cityMapping';
import { ChevronDown } from 'lucide-react';
import mapMarkerSvg from '../assets/map-marker-001.svg';

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
  const [photoFiles, setPhotoFiles] = useState<(File | string | null)[]>([null, null, null, null, null]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSession, setRecordingSession] = useState<audioUtils.RecordingSession | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [compressionError, setCompressionError] = useState<string | null>(null);
  const [compressingIndex, setCompressingIndex] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [farmLocation, setFarmLocation] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [gpsDetermined, setGpsDetermined] = useState(false);
  const [isOpenCity, setIsOpenCity] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [mapBounds, setMapBounds] = useState<{top: number; left: number; width: number; height: number} | null>(null);
  const [dynamicAddress, setDynamicAddress] = useState<string>('');
  const [dynamicCity, setDynamicCity] = useState<string>('');
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [hasListings, setHasListings] = useState<boolean | null>(null);
  const miniMapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      firestoreService.hasUserListings(user.uid).then(setHasListings);
    }
  }, [user]);

  const openMap = useCallback(() => {
    if (miniMapRef.current) {
      const r = miniMapRef.current.getBoundingClientRect();
      setMapBounds({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
    // Reset address so bottom sheet shows loading state on each open
    setDynamicAddress('');
    setDynamicCity('');
    setIsMapFullscreen(true);
  }, []);

  const closeMap = useCallback(() => {
    setIsMapFullscreen(false);
  }, []);

  // Stable memoized callback — avoids LocationMap re-renders
  const handleAddressFetched = useCallback((addr: string, city: string, lat: number, lng: number) => {
    setDynamicAddress(addr);
    setDynamicCity(city);
    
    // Auto-select city in dropdown based on coordinates
    const closestCity = getClosestCity(lat, lng);
    
    // Map the raw city from geocoder if no closest city found locally
    const safeCity = city || '';
    const mappedCity = !closestCity ? (cityMapping[safeCity.toLowerCase()] || cityMapping[safeCity] || safeCity) : closestCity;
    
    setDynamicCity(mappedCity);
    
    if (mappedCity) {
      setAddress(mappedCity);
    }
  }, []);

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
              while (imgs.length < 5) imgs.push(null);
              setPhotoFiles(imgs);
            } else {
              setPhotoFiles([null, null, null, null, null]);
            }
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
    setPhotoFiles([null, null, null, null, null]);
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
        location: address || profile?.location || (coordinates ? 'موقع على الخريطة' : null),
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
    
    // Validate Step 3 mandatory fields
    if (!sheepCount || !startingPrice || selectedAges.length === 0 || selectedRaces.length === 0) {
      setShowErrors(true);
      setError("المرجو ملء جميع الحقول الإجبارية (عدد الرؤوس، الثمن، السن، والسلالة).");
      window.scrollTo(0, 0);
      return;
    }

    setIsSubmitting(true);
    try {
      let audioUrlFinal = audioUrl && !audioBlob ? audioUrl : null;
      if (audioBlob) {
        audioUrlFinal = await firestoreService.uploadImage(
          new File([audioBlob], `audio_${Date.now()}.ogg`, { type: 'audio/ogg' }),
          `announcements/audios/${user.uid}_${Date.now()}.ogg`
        );
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
        location: address || profile?.location || (coordinates ? 'موقع على الخريطة' : null),
        coordinates: coordinates || null,
        images: photoUrls.length > 0 ? (photoUrls as string[]) : ["https://i.ytimg.com/vi/RrkkshRUttw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD92lI4Kxe5liKSwWZaJuLAFopNeA"],
        sheepCount: parseInt(sheepCount),
        sizes: selectedSizes,
        races: selectedRaces,
        age: translatedAges.join(', '),
        audioUrl: audioUrlFinal,
        farmLocation: farmLocation,
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
      let errorMsg = error.message || "وقع خطأ أثناء حفظ القطيع. حاول مرة أخرى.";
      
      // More specific error guidance for system/firebase errors
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
      const session = await audioUtils.startRecording();
      setRecordingSession(session);
      setIsRecording(true);
      setRecordingTime(0);

      // Visual Timer & Auto-stop at 60s
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = async () => {
    if (recordingSession) {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      const blob = await audioUtils.stopRecording(recordingSession);
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      setRecordingSession(null);
      setIsRecording(false);
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
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoordinates({ lat, lng });
          const closest = getClosestCity(lat, lng);
          if (closest) {
            setAddress(closest);
          }
          setIsLocating(false);
          setGpsDetermined(true);
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
  const handlePhotoChange = async (index: number, file: File | string | null) => {
    if (!file || typeof file === 'string') {
      const newFiles = [...photoFiles];
      newFiles[index] = file;
      setPhotoFiles(newFiles);
      return;
    }
    setCompressionError(null);
    setCompressingIndex(index);
    try {
      const compressed = await compressFileForUpload(file, 1280, 1280, 0.78);
      const newFiles = [...photoFiles];
      newFiles[index] = compressed;
      setPhotoFiles(newFiles);
    } catch (err: any) {
      setCompressionError(err.message || 'فشل ضغط الصورة');
    } finally {
      setCompressingIndex(null);
    }
  };
    
  const renderLocationStep = () => (
    <section className="min-h-0 bg-surface-container-lowest p-6 rounded-[10px] border border-outline-variant/30 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs">1</span>
        تحديد موقع القطيع
      </h2>
      <div className="space-y-6">
        
        {/* 1 & 2. GPS Button and City Selector in one row for mobile */}
        <div className="grid grid-cols-2 gap-3">
          {/* GPS Button (Right in RTL) */}
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isLocating || gpsDetermined}
            className={`flex items-center justify-center gap-2 py-3 px-2 rounded-[10px] font-black text-sm shadow-lg transition-all border border-transparent ${gpsDetermined ? 'bg-green-600 text-white shadow-green-200' : 'bg-primary text-white shadow-primary/20 hover:scale-[1.02] active:scale-95'}`}
          >
            {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : gpsDetermined ? <CheckCircle2 className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
            <span className="whitespace-nowrap">{gpsDetermined ? 'تم تحديد الموقع' : 'موقعي (GPS)'}</span>
          </button>

          {/* City Selector (Expert Hero Style) */}
          <div className="flex-1 flex items-center px-3 py-2 relative group bg-white rounded-[10px] border-2 border-outline-variant/30 hover:border-primary/50 shadow-sm">
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <div className="flex flex-col text-right mr-3 flex-1">
              <span className="text-[9px] font-black text-primary uppercase tracking-wider mb-0.5">المدينة</span>
              <input
                type="text"
                value={address}
                onChange={(e) => { 
                  const val = e.target.value;
                  setAddress(val); 
                  setIsOpenCity(true); 
                  setGpsDetermined(false);
                  if (cityCoords[val]) {
                    setCoordinates(cityCoords[val]);
                  }
                }}
                onFocus={() => setIsOpenCity(true)}
                placeholder="فين؟"
                className="bg-transparent border-none outline-none w-full text-sm font-black text-on-surface text-right placeholder:text-on-surface-variant/40"
              />

              {isOpenCity && (
                <div className="absolute top-full right-0 left-0 w-full bg-white rounded-xl shadow-2xl border border-outline-variant/20 max-h-60 overflow-y-auto z-[100] p-1 mt-2 animate-in fade-in slide-in-from-top-2">
                  <div className="flex flex-col gap-0.5">
                    {Object.keys(cityCoords).filter(city => {
                      const normSearch = normalizeArabic(address);
                      if (!normSearch) return true;
                      return normalizeArabic(city).includes(normSearch);
                    }).sort().map(city => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => { 
                          setAddress(city); 
                          setIsOpenCity(false); 
                          setGpsDetermined(false); 
                          setCoordinates(cityCoords[city]);
                        }}
                        className={`w-full text-right px-4 py-2 rounded-lg text-sm font-bold transition-colors ${address === city ? 'bg-primary text-white' : 'hover:bg-surface-container-low text-on-surface'}`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <ChevronDown
              onClick={(e) => { e.stopPropagation(); setIsOpenCity(!isOpenCity); }}
              className={`w-4 h-4 text-on-surface-variant ml-1 cursor-pointer transition-transform ${isOpenCity ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
        
        {/* Farm location text */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-on-surface-variant">موقع الضيعة بالتفصيل</label>
          <input 
            type="text"
            value={farmLocation}
            onChange={(e) => setFarmLocation(e.target.value)}
            placeholder="مثلا: طريق مديونة، قرب مسجد الرضوان"
            className="w-full h-14 px-4 bg-surface-container-high border-none rounded-[10px] text-on-surface focus:ring-2 focus:ring-primary transition-all text-right outline-none font-medium"
          />
        </div>

        {/* 3. The Map — Reveal Morph Transition */}
        {/* Static mini-map, never animates */}
        <div
          ref={miniMapRef}
          onClick={openMap}
          className="h-[250px] w-full rounded-[12px] overflow-hidden border border-outline-variant/30 shadow-inner cursor-pointer relative"
        >
          <LocationMap
            lat={coordinates?.lat || (address ? cityCoords[address]?.lat : undefined)}
            lng={coordinates?.lng || (address ? cityCoords[address]?.lng : undefined)}
            onLocationSelect={(lat, lng) => {
              setCoordinates({ lat, lng });
              const closest = getClosestCity(lat, lng);
              if (closest) setAddress(closest);
            }}
            onAddressFetched={handleAddressFetched}
          />
          {/* Tap hint — pin visual instead of text */}
          <div className="absolute inset-0 bg-black/[0.04] z-10 flex flex-col items-center justify-center pointer-events-none gap-0">
            {/* Frame + icon */}
            <div className="bg-white rounded-[14px] shadow-xl p-2 border border-black/5 flex items-center justify-center">
              <div className="w-9 h-9 rounded-[10px] bg-[#f0f0f0] flex items-center justify-center">
                <img src={mapMarkerSvg} className="w-5 h-5 opacity-80" alt="pin" />
              </div>
            </div>
            {/* Stick */}
            <div className="w-[5px] h-5 bg-[#1c1c1e] rounded-b-full shadow-sm" />
            {/* Shadow */}
            <div className="w-4 h-[5px] bg-black/20 rounded-full mt-[-2px]" />
          </div>
        </div>

        {/* Fullscreen reveal overlay — expands from mini-map bounds */}
        <AnimatePresence>
          {isMapFullscreen && mapBounds && (
            <motion.div
              initial={{
                top: mapBounds.top,
                left: mapBounds.left,
                width: mapBounds.width,
                height: mapBounds.height,
                borderRadius: 12,
              }}
              animate={{
                top: 0,
                left: 0,
                width: window.innerWidth,
                height: window.innerHeight,
                borderRadius: 0,
              }}
              exit={{
                top: mapBounds.top,
                left: mapBounds.left,
                width: mapBounds.width,
                height: mapBounds.height,
                borderRadius: 12,
              }}
              transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
              style={{ position: 'fixed', zIndex: 200, overflow: 'hidden' }}
              className="bg-white"
            >
              {/* Full map — fills container */}
              <div className="absolute inset-0">
                <LocationMap
                  isFullscreen
                  sellerInfo={{ name: profile?.pseudo || profile?.fullName || 'كساب', rating: 5 }}
                  lat={coordinates?.lat || (address ? cityCoords[address]?.lat : undefined)}
                  lng={coordinates?.lng || (address ? cityCoords[address]?.lng : undefined)}
                  onLocationSelect={(lat, lng) => {
                    setCoordinates({ lat, lng });
                    const closest = getClosestCity(lat, lng);
                    if (closest) setAddress(closest);
                  }}
                  onAddressFetched={handleAddressFetched}
                  retryTrigger={retryTrigger}
                />
              </div>

              {/* Back button — fades in after morph */}
              <motion.button
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ delay: 0.22, duration: 0.2 }}
                onClick={(e) => { e.stopPropagation(); closeMap(); }}
                className="absolute top-12 right-4 z-50 w-12 h-12 bg-[#115e2c] rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
              >
                <ArrowRight className="w-6 h-6 text-white" />
              </motion.button>

              {/* Bottom confirmation — slides up after morph */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ delay: 0.2, duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] shadow-[0_-12px_40px_rgba(0,0,0,0.12)] z-50 px-5 pt-4 pb-8"
              >
                <div className="w-10 h-1 bg-outline-variant/30 rounded-full mx-auto mb-6" />
                
                {/* Information Fiche */}
                <div className="mb-5 text-right" dir="rtl">
                  <h4 className="text-xs font-bold text-[#115e2c] tracking-widest uppercase mb-3">عنوان الوجهة</h4>

                  {dynamicAddress ? (
                    <div className="space-y-2">
                      <p className="text-sm font-black text-on-surface leading-snug line-clamp-2" dir="rtl">{dynamicAddress}</p>
                      {dynamicCity && (
                        <div className="inline-flex items-center gap-1.5 bg-[#115e2c]/8 rounded-full px-3 py-1">
                          <MapPin className="w-3 h-3 text-[#115e2c]" />
                          <span className="text-xs font-black text-[#115e2c]">المدينة : {dynamicCity}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2 text-on-surface-variant">
                      <span className="text-sm font-medium">جار البحث عن العنوان...</span>
                      <Loader2 className="w-4 h-4 animate-spin text-[#115e2c]" />
                    </div>
                  )}
                </div>

                <div className="flex justify-center w-full">
                  <button
                    onClick={(e) => { e.stopPropagation(); closeMap(); }}
                    className="w-full md:w-auto md:px-16 h-14 bg-[#115e2c] text-white rounded-2xl font-black text-base tracking-wide shadow-xl shadow-green-900/20 active:scale-[0.98] transition-transform"
                  >
                    تأكيد موقع ضيعتي
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. GPS Success & Tweak (Style matched to Hero Search) */}
        <div className="bg-surface-container-low border border-outline-variant/30 p-4 rounded-[10px] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="text-on-surface text-sm font-black shrink-0 whitespace-nowrap">إحداثيات الموقع</div>
            
            <div className="flex-1 grid grid-cols-2 gap-3">
              {/* Latitude Field */}
              <div className="flex items-center px-3 py-1.5 bg-white rounded-lg border border-outline-variant/20 shadow-sm transition-all focus-within:border-primary">
                <div className="flex flex-col text-right flex-1">
                  <span className="text-[8px] font-black text-primary uppercase tracking-wider mb-0.5">Latitude</span>
                  <input 
                    type="number" 
                    step="any"
                    value={coordinates?.lat || ''}
                    onChange={(e) => { setCoordinates({ lat: parseFloat(e.target.value) || 0, lng: coordinates?.lng || 0 }); setGpsDetermined(false); }}
                    className="bg-transparent border-none outline-none w-full text-xs font-black text-on-surface text-left"
                    placeholder="0.0000"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Longitude Field */}
              <div className="flex items-center px-3 py-1.5 bg-white rounded-lg border border-outline-variant/20 shadow-sm transition-all focus-within:border-primary">
                <div className="flex flex-col text-right flex-1">
                  <span className="text-[8px] font-black text-primary uppercase tracking-wider mb-0.5">Longitude</span>
                  <input 
                    type="number" 
                    step="any"
                    value={coordinates?.lng || ''}
                    onChange={(e) => { setCoordinates({ lat: coordinates?.lat || 0, lng: parseFloat(e.target.value) || 0 }); setGpsDetermined(false); }}
                    className="bg-transparent border-none outline-none w-full text-xs font-black text-on-surface text-left"
                    placeholder="0.0000"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderMediaStep = () => (
    <section className="bg-surface-container-lowest p-6 rounded-[10px] border border-outline-variant/30 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-on-surface mb-2 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs">2</span>
        صور القطيع (مهم بزاف)
      </h2>
      <p className="text-sm text-on-surface-variant">الكليان كايبغي يشوف الحولي مزيان قبل ما يجي. ضروري تحط على الأقل صورة رئيسية للقطيع ديالك.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Main Photo (Required) */}
        <div className="col-span-2 row-span-2 relative bg-surface-container-low rounded-[10px] border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center aspect-square cursor-pointer hover:bg-surface-variant/50 transition-colors group overflow-hidden">
          {compressingIndex === 0 ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs font-bold text-on-surface-variant">جاري ضغط الصورة...</span>
            </div>
          ) : photoFiles[0] ? (
            <div className="absolute inset-0">
              <img 
                src={typeof photoFiles[0] === 'string' ? photoFiles[0] : URL.createObjectURL(photoFiles[0] as File)} 
                className="w-full h-full object-cover" 
                alt="Image principale" 
              />
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] font-black px-2 py-0.5 rounded-full">WebP ✔</div>
              <button 
                onClick={(e) => { e.stopPropagation(); handlePhotoChange(0, null); }}
                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg z-20 hover:scale-110 transition-transform flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                onChange={(e) => handlePhotoChange(0, e.target.files?.[0] || null)}
              />
              <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md">
                <Camera className="w-6 h-6" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-black text-on-surface text-sm text-center px-2">صورة رئيسية (إجبارية)</span>
                <span className="text-[10px] text-error font-bold mt-1 bg-red-50 px-2 py-0.5 rounded">مطلوب</span>
              </div>
            </>
          )}
        </div>
        
        {/* Secondary Photo Slots */}
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="relative bg-surface-container-low rounded-[10px] border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center aspect-square cursor-pointer hover:bg-surface-variant/50 transition-colors overflow-hidden group">
            {compressingIndex === index ? (
              <div className="flex flex-col items-center gap-1">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-[10px] font-bold text-on-surface-variant">ضغط...</span>
              </div>
            ) : photoFiles[index] ? (
              <div className="absolute inset-0">
                <img 
                  src={typeof photoFiles[index] === 'string' ? photoFiles[index] as string : URL.createObjectURL(photoFiles[index] as File)} 
                  className="w-full h-full object-cover" 
                  alt={`Photo ${index + 1}`} 
                />
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">WebP</div>
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
                <Camera className="w-6 h-6 text-on-surface-variant/50 mb-2 group-hover:text-primary transition-colors" />
                <span className="text-xs font-medium text-on-surface-variant">صورة {index + 1}</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Compression error banner */}
      {compressionError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <X className="w-5 h-5 shrink-0" />
          <p className="text-sm font-bold">{compressionError}</p>
          <button onClick={() => setCompressionError(null)} className="mr-auto text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* YouTube Link Field */}
      <div className="mt-6 space-y-2">
        <label className="block text-sm font-bold text-on-surface-variant flex items-center gap-2">
          رابط فيديو يوتيوب (اختياري)
          <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">YouTube</span>
        </label>
        <div className="relative">
          <input 
            className="w-full h-12 px-4 bg-surface-container-high border-none rounded-[10px] text-on-surface focus:ring-2 focus:ring-primary transition-all text-left font-medium" 
            placeholder="https://www.youtube.com/watch?v=..." 
            type="url" 
            dir="ltr"
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value)}
          />
        </div>
        <p className="text-[10px] text-on-surface-variant font-medium">إلا عندك فيديو ف يوتيوب، حط الرابط هنا باش يشوفوه الناس.</p>
      </div>
    </section>
  );

  const renderInfoStep = () => (
    <section className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xl space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-4">
        <h2 className="text-xl font-black text-on-surface flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm shadow-lg shadow-primary/20">3</div>
          معلومات القطيع
        </h2>
        <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">الخطوة الأخيرة</span>
      </div>
      
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 relative">
            <label className="block text-[11px] font-black text-on-surface-variant flex items-center gap-1.5 mr-1">
              <PlusCircle className="w-3.5 h-3.5 text-primary" />
              عدد الرؤوس
              {showErrors && !sheepCount && <span className="text-[8px] text-error animate-pulse bg-red-50 px-1 py-0.5 rounded">مطلوب</span>}
            </label>
            <div className="relative group">
              <input 
                className="w-full h-14 px-3 bg-surface-container-low border-2 border-transparent rounded-xl text-on-surface focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-right font-black text-xl shadow-sm" 
                placeholder="0" 
                type="number" 
                required
                value={sheepCount}
                onChange={(e) => setSheepCount(e.target.value)}
              />
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant font-black text-[10px] bg-surface-container-high px-2 py-0.5 rounded-md">
                رأس
              </div>
            </div>
          </div>

          <div className="space-y-2 relative">
            <label className="block text-[11px] font-black text-on-surface-variant flex items-center gap-1.5 mr-1">
              <Scale className="w-3.5 h-3.5 text-primary" />
              أقل ثمن
              {showErrors && !startingPrice && <span className="text-[8px] text-error animate-pulse bg-red-50 px-1 py-0.5 rounded">مطلوب</span>}
            </label>
            <div className="relative group">
              <input 
                className="w-full h-14 px-3 bg-surface-container-low border-2 border-transparent rounded-xl text-on-surface focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-right font-black text-xl shadow-sm" 
                placeholder="0" 
                type="number" 
                required
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
              />
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant font-black text-[10px] bg-surface-container-high px-2 py-0.5 rounded-md">
                درهم
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-black text-on-surface-variant flex items-center gap-2 mr-1">
            <Calendar className="w-4 h-4 text-primary" />
            السن (الأعمار المتوفرة)
            {showErrors && selectedAges.length === 0 && <span className="text-[10px] text-error animate-pulse bg-red-50 px-2 py-0.5 rounded">مطلوب</span>}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {ages.map((age) => {
              const isSelected = selectedAges.includes(age.id);
              return (
                <button
                  key={age.id}
                  type="button"
                  onClick={() => toggleAge(age.id)}
                  className={`px-3 py-4 font-black rounded-xl transition-all border-2 text-sm text-center flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'bg-white text-on-surface border-outline-variant/30 hover:border-primary/50'
                  }`}
                >
                  <span className={isSelected ? 'text-white' : 'text-primary/70'}>{age.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-black text-on-surface-variant flex items-center gap-2 mr-1">
            <Ruler className="w-4 h-4 text-primary" />
            حجم الحولي
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'small', label: 'صغير' },
              { id: 'medium', label: 'متوسط' },
              { id: 'large', label: 'كبير' },
              { id: 'extra-large', label: 'كبير جداً' }
            ].map((size) => {
              const isSelected = selectedSizes.includes(size.id);
              return (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => toggleSize(size.id)}
                  className={`px-4 py-4 font-black rounded-xl transition-all border-2 text-sm text-center flex items-center justify-center gap-2 ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'bg-white text-on-surface border-outline-variant/30 hover:border-primary/50'
                  }`}
                >
                  {size.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-black text-on-surface-variant flex items-center gap-2 mr-1">
            <Globe className="w-4 h-4 text-primary" />
            سلالة الغنم
            {showErrors && selectedRaces.length === 0 && <span className="text-[10px] text-error animate-pulse bg-red-50 px-2 py-0.5 rounded">مطلوب</span>}
          </label>
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
                  className={`px-4 py-5 font-black rounded-xl transition-all border-2 flex items-center justify-center gap-3 ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'bg-white text-on-surface border-outline-variant/30 hover:border-primary/50'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-primary'}`} />
                  <span className="text-base">{race.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <label className="block text-sm font-black text-on-surface-variant flex items-center gap-2 mr-1">
            <AudioLines className="w-4 h-4 text-primary" />
            وصف مسموع وكتابي
          </label>
          
          <div className={`p-5 rounded-2xl flex items-center justify-between border-2 shadow-sm transition-all duration-300 ${isRecording ? 'bg-red-50 border-red-200 ring-4 ring-red-100' : 'bg-green-50/50 border-green-100'}`}>
            <div className="flex-1 text-right">
              {audioUrl ? (
                  <div className="flex flex-col items-start gap-4 w-full">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 text-primary font-black">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>تم تسجيل الوصف الصوتي</span>
                      </div>
                      <button type="button" onClick={deleteAudio} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                        <span className="text-xs font-black">حذف</span>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <audio src={audioUrl} controls className="h-10 w-full" />
                  </div>
              ) : (
                <div className="space-y-1">
                  <h3 className={`font-black text-lg ${isRecording ? 'text-red-700' : 'text-green-900'}`}>
                    {isRecording ? `جاري تسجيل صوتك... (${60 - recordingTime}ث)` : 'إضافة وصف صوتي'}
                  </h3>
                  {isRecording && (
                    <div className="w-full bg-red-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(recordingTime / 60) * 100}%` }}
                        className="bg-red-600 h-full"
                      />
                    </div>
                  )}
                  <p className={`text-sm font-medium ${isRecording ? 'text-red-500' : 'text-green-800/60'}`}>
                    {isRecording ? 'تكلم دابا، كنسمعوك (الحد الأقصى دقيقة واحدة)...' : 'هضر لينا على المكلة، السن، والجودة'}
                  </p>
                </div>
              )}
            </div>

            {!audioUrl && (
              <button 
                type="button"
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all transform active:scale-95 ${isRecording ? 'bg-red-600 ring-8 ring-red-100 animate-pulse' : 'bg-primary hover:bg-primary-dark ring-8 ring-primary/10'}`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? <div className="w-5 h-5 bg-white rounded-sm" /> : <Mic className="w-8 h-8" />}
              </button>
            )}
          </div>

          <textarea 
            className="w-full p-5 bg-surface-container-low border-2 border-transparent rounded-2xl text-on-surface focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none h-40 font-bold text-lg shadow-inner" 
            placeholder="زيد شي معلومات خرى بغيتي الكليان يعرفها (مثلا: واش كاين النقل، واش الثمن قابل للتفاوض...)"
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
            {hasListings !== false && (
              <button 
                onClick={() => onNavigate(profile?.role === 'admin' ? 'admin' : 'seller')} 
                className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group"
              >
                <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                <span className="font-black text-sm">الرجوع للوحة التحكم</span>
              </button>
            )}
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
          {currentStep === 1 && (
            <div className="min-h-0 flex flex-col">
               {renderLocationStep()}
            </div>
          )}
          {currentStep === 2 && (
            <div className="md:min-h-0 min-h-[calc(100dvh-150px)] flex flex-col">
               {renderMediaStep()}
            </div>
          )}
          {currentStep === 3 && renderInfoStep()}
        </div>

        <div className="flex gap-4 pt-6">
          {currentStep > 1 && (
            <button onClick={() => setCurrentStep(prev => prev - 1)} className="flex-1 py-4 bg-surface-container-high rounded-[10px] font-bold transition-colors border border-transparent hover:bg-transparent hover:text-on-surface hover:border-outline-variant">رجوع</button>
          )}
          {currentStep < 3 ? (
            <button 
              onClick={() => {
                setError(null);
                if (currentStep === 1) {
                  // Validate Step 1
                  if (!address && !coordinates) {
                    setError("المرجو تحديد المدينة أو استعمال موقعي الحالي (GPS) باش المشترين يلقاو الغنم ديالك بسهولة.");
                    window.scrollTo(0, 0);
                    return;
                  }
                } else if (currentStep === 2) {
                  // Validate Step 2
                  if (!photoFiles[0]) {
                    setError("ضروري تحط على الأقل صورة رئيسية للقطيع ديالك.");
                    window.scrollTo(0, 0);
                    return;
                  }
                }
                setCurrentStep(prev => prev + 1);
              }} 
              className="flex-1 py-4 bg-primary text-on-primary rounded-[10px] font-bold transition-colors border border-transparent hover:bg-transparent hover:text-primary hover:border-primary"
            >
              التالي
            </button>
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
