import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, CheckCircle2, Loader2, Mic, Camera, 
  Clock, MessageCircle, Phone, Navigation, Calculator, Bell,
  ShoppingBag, ChevronRight, ArrowRight, MapPin, Send, Trash2, Video, 
  Upload, X, History, LogOut, Play, Square, AlertTriangle, ZoomIn, MessageSquare, ChevronLeft, Star
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestoreService';
import { compressImage, checkPayloadSize } from '../../lib/imageUtils';
import * as audioUtils from '../../lib/audioUtils';
import LocationMap from '../LocationMap';

const SheepIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15.5 11c0 2.209-1.791 4-4 4s-4-1.791-4-4 1.791-4 4-4 4 1.791 4 4Z" />
    <path d="M11.5 15v3m-2-3v3m4-3v3" />
    <path d="M8.5 8.5c-1.5-1.5-3.5-1.5-4.5 0s-.5 3.5 1 4.5" />
    <path d="M14.5 8.5c1.5-1.5 3.5-1.5 4.5 0s.5 3.5-1 4.5" />
    <circle cx="10" cy="10.5" r=".5" />
    <circle cx="13" cy="10.5" r=".5" />
  </svg>
);

function BuyerRequestItem({ request, onSelect, onDetails, onReport, hasSubmitted }: { request: any, onSelect: () => void, onDetails: () => void, onReport: () => void, hasSubmitted?: boolean }) {
  const isFull = request.status === 'FULL';
  const isClosed = request.status === 'Closed' || request.status === 'Archived';
  const isDisabled = hasSubmitted || isFull || isClosed;

  let buttonText = 'تقديم عرض';
  if (isFull) buttonText = `مكتمل (${request.offersCount})`;
  else if (hasSubmitted) buttonText = 'تم الإرسال';
  else if (isClosed) buttonText = 'مغلق';

  const dateText = (() => {
    if (!request.createdAt) return 'اليوم';
    try {
      const date = request.createdAt.toDate ? request.createdAt.toDate() : 
                 (request.createdAt._seconds ? new Date(request.createdAt._seconds * 1000) : 
                 (request.createdAt.seconds ? new Date(request.createdAt.seconds * 1000) : 
                 new Date(request.createdAt)));
      
      if (isNaN(date.getTime())) return 'اليوم';

      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
      const timeStr = date.toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' });
      
      if (diffDays === 0) return `اليوم ${timeStr}`;
      if (diffDays === 1) return `البارحة ${timeStr}`;
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${timeStr}`;
    } catch (e) {
      return 'اليوم';
    }
  })();

  const breed = (request.breed || request.breeds || request.races || 'غير محدد').split(', ')[0];

  return (
    <div className="bg-white rounded-[10px] p-6 border border-outline-variant/10 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6 group">
      <div className="hidden md:flex w-16 h-16 rounded-[10px] bg-surface-container-high items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        <SheepIcon className="w-10 h-10 text-primary/60" />
      </div>
      
      <div className="flex-1 text-right w-full">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-lg font-black text-on-surface font-headline line-clamp-1">{request.title || 'طلب حولي'}</h3>
          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase">{breed}</span>
        </div>
        
        <p className="text-sm text-on-surface-variant font-medium line-clamp-1 mb-2">
          "{request.description || 'تواصل مع الكساب للحصول على مزيد من التفاصيل'}"
        </p>
        
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-on-surface-variant">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {dateText}
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {request.location || 'الدار البيضاء'}
          </div>
          <div className="flex items-center gap-1 text-[#0a5c1a] font-black bg-green-50 px-2 py-0.5 rounded-md">
            {request.budget || request.maxBudget || 0} درهم
          </div>
        </div>
      </div>

      <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
        <button 
          onClick={(e) => { e.stopPropagation(); if (!isDisabled) onSelect(); }}
          disabled={isDisabled}
          className={`flex-1 md:w-32 py-3 rounded-[10px] font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm ${
            isDisabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-[#0a5c1a] text-white hover:bg-[#0a5c1a]/90'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>{buttonText}</span>
        </button>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onDetails(); }}
          className="flex-1 md:w-32 py-3 bg-surface-container-high text-on-surface font-black rounded-[10px] text-xs hover:bg-surface-variant transition-all flex items-center justify-center gap-1.5"
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          <span>التفاصيل</span>
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onReport(); }}
          className="text-[10px] font-black text-red-600/60 hover:text-red-600 underline transition-colors mt-1"
        >
          تبليغ عن هذا الطلب
        </button>
      </div>
    </div>
  );
}

interface BuyerRequestsViewProps {
  requests: any[];
  announcements: any[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  dailyLeadsCount?: number;
  dailyLeadsLimit?: number;
  dailyOffersCount?: number;
  dailyOffersLimit?: number;
}

export function BuyerRequestsView({ 
  requests, 
  announcements = [],
  onLoadMore, 
  hasMore, 
  isLoadingMore,
  dailyLeadsCount = 0,
  dailyLeadsLimit = 6,
  dailyOffersCount = 0,
  dailyOffersLimit = 6
}: BuyerRequestsViewProps) {
  const { user, profile } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null); // Object = Details, String = Offer Form
  const [offerSent, setOfferSent] = useState(false);
  const [offerDesc, setOfferDesc] = useState('');
  
  // New Offer Form State
  const [images, setImages] = useState<(string | null)[]>([null, null, null]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSession, setRecordingSession] = useState<audioUtils.RecordingSession | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [offerLat, setOfferLat] = useState<number | null>(null);
  const [offerLng, setOfferLng] = useState<number | null>(null);
  const [offerLocation, setOfferLocation] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [existingOffer, setExistingOffer] = useState<any | null>(null);
  const [reportingRequest, setReportingRequest] = useState<any | null>(null);
  const [submittedRequestIds, setSubmittedRequestIds] = useState<Set<string>>(new Set());
  const [previewImages, setPreviewImages] = useState<string[] | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [archivingRequest, setArchivingRequest] = useState<any | null>(null);
  const [requestLimitReached, setRequestLimitReached] = useState(false);
  const [filterTab, setFilterTab] = useState<'open' | 'submitted'>('open');
  const [viewingRequest, setViewingRequest] = useState<any | null>(null);
  const [viewingSellerListings, setViewingSellerListings] = useState<string | null>(null);
  const [selectedListingForOffer, setSelectedListingForOffer] = useState<any | null>(null);

  // Load all offer requests this seller has already submitted to
  useEffect(() => {
    if (!user) return;
    firestoreService.getOffersForSeller(user.uid).then((offers: any[]) => {
      if (Array.isArray(offers)) {
        setSubmittedRequestIds(new Set(offers.map((o: any) => o.requestId).filter(Boolean)));
      }
    }).catch(() => {});

    // Check buyer request limit
    firestoreService.getUserOfferRequestsCount(user.uid).then((count: number) => {
      setRequestLimitReached(count >= 2);
    }).catch(() => {});
  }, [user]);

  // Audio Recording Logic
  const startRecording = async () => {
    try {
      const session = await audioUtils.startRecording();
      setRecordingSession(session);
      setIsRecording(true);
      setRecordingTime(0);

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
      alert("ما قدرناش نوصلو للميكروفون. تأكد بلي عطيتي الصلاحية للمتصفح.");
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (recordingSession) {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      const blob = await audioUtils.stopRecording(recordingSession);
      const file = new File([blob], 'offer-audio.webm', { type: 'audio/webm' });
      setAudioFile(file);
      setAudioPreview(URL.createObjectURL(blob));
      setRecordingSession(null);
      setIsRecording(false);
    }
  };



  // Fetch existing offer when a request is selected
  useEffect(() => {
    if (!user || !selectedRequest) return;
    const requestId = typeof selectedRequest === 'string' ? selectedRequest : selectedRequest.id;

    let isMounted = true;
    const fetchExistingOffer = async () => {
      try {
        const offersForReq = await firestoreService.getOffersForRequest(requestId);
        if (isMounted) {
          const myOffer = offersForReq?.find?.((o: any) => o.sellerId === user.uid);
          setExistingOffer(myOffer || null);
        }
      } catch (e) {
        console.warn('Error fetching own offer:', e);
      }
    };

    fetchExistingOffer();
    
    // Pre-fill form if a listing is selected
    if (selectedListingForOffer) {
      setOfferDesc(selectedListingForOffer.description || '');
      const listingImgs = selectedListingForOffer.images || [selectedListingForOffer.imageUrl];
      const newImgs = [null, null, null] as (string | null)[];
      listingImgs.slice(0, 3).forEach((img: string, i: number) => {
        newImgs[i] = img;
      });
      setImages(newImgs);
      if (selectedListingForOffer.lat) setOfferLat(selectedListingForOffer.lat);
      if (selectedListingForOffer.lng) setOfferLng(selectedListingForOffer.lng);
      if (selectedListingForOffer.location) setOfferLocation(selectedListingForOffer.location);
    } else {
      // Clear if no listing selected
      setOfferDesc('');
      setImages([null, null, null]);
    }

    return () => { isMounted = false; };
  }, [user, selectedRequest, selectedListingForOffer]);

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRequest || existingOffer) return;

    const requestId = typeof selectedRequest === 'string' ? selectedRequest : selectedRequest.id;
    const request = requests.find(r => r.id === requestId);

    const newErrors: { [key: string]: string } = {};
    
    // Validation: 1 image minimum
    const hasImage = images.some(img => img !== null);
    if (!hasImage) {
      newErrors.images = "عفاك دخل صورة وحدة على الأقل للحولي";
    }

    // Validation: Text or Audio mandatory
    if (!offerDesc.trim() && !audioFile) {
      newErrors.content = "عفاك دخل وصف مكتوب ولا رسالة صوتية";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      // Process images
      const compressedImages = await Promise.all(
        images.filter(img => img !== null).map(base64 => compressImage(base64!, 800, 800, 0.6))
      );

      // Convert audio blob to base64 if available
      let audioUrl: string | null = null;
      if (audioFile && audioPreview) {
        audioUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(audioFile);
        });
      }

      const offerData = {
        sellerId: user.uid,
        sellerName: profile?.fullName || profile?.displayName || 'كساب',
        sellerPseudo: profile?.pseudo || null,
        requestId: request.id,
        price: request.budget,
        description: offerDesc,
        buyerId: request.buyerId,
        hasAudio: !!audioFile,
        hasImage: compressedImages.length > 0,
        images: compressedImages,
        imageUrl: compressedImages[0],
        audioUrl,
        sellerPhone: profile?.phone || (user as any).phoneNumber || null,
        sellerCity: offerLocation || profile?.city || null,
        sellerLocation: offerLocation || profile?.location || null,
        locationLink: offerLat && offerLng ? `https://www.google.com/maps/search/?api=1&query=${offerLat},${offerLng}` : null,
        lat: offerLat,
        lng: offerLng
      };

      await firestoreService.createOffer(offerData);
      setSubmittedRequestIds(prev => new Set([...prev, request.id]));
      setOfferSent(true);
    } catch (error) {
      console.error("Failed to send offer:", error);
      alert("وقع مشكل فإرسال العرض. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImages = [...images];
        newImages[index] = reader.result as string;
        setImages(newImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  };

  // ── SUCCESS VIEW ──
  if (offerSent) {
    return (
      <div className="flex-1 flex items-center justify-center p-8" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-[10px] p-10 shadow-2xl text-center border border-primary/10">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-on-surface mb-4 font-headline">تم إرسال عرضك!</h2>
          <p className="text-on-surface-variant font-medium mb-8">المشتري غادي يتوصل بالعرض ديالك وغادي يتواصل معاك يلا بغى يكمل العملية.</p>
          <button 
            onClick={() => { setOfferSent(false); setSelectedRequest(null); }} 
            className="w-full bg-[#0d631b] text-white py-4 rounded-[10px] font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            الرجوع للطلبات
          </button>
        </div>
      </div>
    );
  }

  // ── SELLER LISTINGS GRID VIEW ──
  if (viewingSellerListings) {
    const requestId = viewingSellerListings;
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8 text-right" dir="rtl">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 bg-white/80 backdrop-blur-md p-4 rounded-xl border border-outline-variant/10 sticky top-0 z-10 gap-4">
          <button 
            onClick={() => setViewingSellerListings(null)}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group"
          >
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
            <span className="font-black text-sm">الرجوع للطلبات</span>
          </button>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            <h2 className="text-xl font-black text-on-surface font-headline ml-4">اختر الحولي أو قدم عرض جديد</h2>
            <button 
              onClick={() => {
                setSelectedListingForOffer(null);
                setSelectedRequest(requestId);
                setViewingSellerListings(null);
              }}
              className="px-6 py-3 bg-[#0a5c1a] text-white font-black rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-sm"
            >
              <Camera className="w-5 h-5" />
              <span>تقديم عرض جديد (صور جديدة)</span>
            </button>
          </div>
        </div>

        {announcements.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-outline-variant/20">
            <ShoppingBag className="w-16 h-16 text-outline-variant/30 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-[#1A1A1A] mb-2 font-headline">ماعندك حتى حولي فـ "القطيع" ديالك</h3>
            <p className="text-[#757575] font-medium mb-8">تقدر تقدم عرض دابا بـ صور جديدة ولا تمشي تزيد حولي جديد للقطيع.</p>
            <button 
              onClick={() => {
                setSelectedListingForOffer(null);
                setSelectedRequest(requestId);
                setViewingSellerListings(null);
              }}
              className="px-10 py-4 bg-[#0a5c1a] text-white font-black rounded-2xl shadow-xl hover:bg-[#0a5c1a]/90 transition-all flex items-center gap-2 mx-auto"
            >
              <Camera className="w-6 h-6" />
              <span>تقديم عرض بـ صور جديدة دابا</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map((listing) => (
            <div 
              key={listing.id} 
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 hover:shadow-xl transition-all duration-300 group cursor-pointer"
              onClick={() => {
                setSelectedListingForOffer(listing);
                setSelectedRequest(requestId);
                setViewingSellerListings(null);
              }}
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  alt={listing.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  src={listing.imageUrl || listing.images?.[0] || "https://firebasestorage.googleapis.com/v0/b/kessabcom-0004.firebasestorage.app/o/announcements%2Fimages%2FayPrqndAltc56JQs4fmE5QAyMsF2_1777197825886_0?alt=media&token=99ac7f0e-c45a-4d76-986e-5d76168bd165"} 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-[#1A1A1A] px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  كيبدا من {listing.price || listing.minPrice || 0} درهم
                </div>
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-[#1A1A1A] px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 cursor-pointer hover:bg-white transition-colors">
                  <MapPin className="w-3 h-3 text-[#2E7D32]" />
                  <span>{listing.city || 'الدار البيضاء'} (قريب ليك)</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[#2E7D32] font-bold truncate max-w-[150px]">{listing.sellerPseudo || profile?.pseudo || 'ضيعة'}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#757575]">الحجم:</span>
                      <div className="flex gap-1 text-[10px] font-bold text-[#4A4A4A]">
                        <span className="bg-[#F9F9F6] px-1.5 py-0.5 rounded border border-outline-variant/10">صغير</span>
                        <span className="bg-[#F9F9F6] px-1.5 py-0.5 rounded border border-outline-variant/10">متوسط</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[#757575] text-sm font-bold">
                      <span className="truncate max-w-[200px]">{listing.title}</span>
                    </div>
                    <div className="flex items-center gap-0.5" dir="ltr">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < (listing.rating || 5) ? 'fill-[#FFC107] text-[#FFC107]' : 'text-[#D1D1D1]'}`} />
                      ))}
                      <span className="text-[10px] text-on-surface-variant font-bold ml-1">(2)</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 border-t border-outline-variant/20 pt-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedListingForOffer(listing);
                        setSelectedRequest(requestId);
                        setViewingSellerListings(null);
                      }}
                      className="py-2.5 bg-[#2E7D32] text-white font-bold rounded-lg border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors text-sm text-center flex items-center justify-center"
                    >
                      تقديم عرض دابا
                    </button>
                    <button className="py-2.5 bg-[#F9F9F6] text-[#1A1A1A] font-bold rounded-lg border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors text-sm">شوف التفاصيل</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── OFFER FORM VIEW ──
  if (typeof selectedRequest === 'string') {
    const requestId = selectedRequest;
    const request = requests.find(r => r.id === requestId);
    
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8 text-right" dir="rtl">
        <div className="max-w-2xl mx-auto p-0 pb-20">
          {/* Sticky Header */}
          <div className="flex items-center justify-between mb-8 bg-white/80 backdrop-blur-md p-4 rounded-xl border border-outline-variant/10 sticky top-0 z-30">
            <button 
              onClick={() => { setSelectedRequest(null); setSelectedListingForOffer(null); }} 
              className="flex items-center gap-2 text-on-surface-variant hover:text-[#0d631b] transition-colors group"
            >
              <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
              <span className="font-black text-sm">الرجوع للطلبات</span>
            </button>
            <div className="flex flex-col items-end">
              <h2 className="text-xl font-black text-on-surface font-headline">تقديم عرض جديد</h2>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-outline-variant/20 mx-4 md:mx-0 space-y-8">
            <form onSubmit={handleSendOffer} className="space-y-8">
              {/* Image Upload Grid */}
              <div className="space-y-3">
                <label className="text-sm font-black text-[#1A1A1A] flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#0d631b]" />
                  صور الحولي (صورة وحدة على الأقل)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, index) => (
                    <div key={index} className="relative group aspect-square">
                      {img ? (
                        <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-[#0d631b]/20 shadow-sm relative">
                          <img src={img} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1.5 left-1.5 bg-red-600 text-white p-1 rounded-full shadow-lg z-20 hover:scale-110 transition-transform"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className={`w-full h-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${errors.images && index === 0 ? 'border-red-400 bg-red-50/30' : 'border-outline-variant/30 hover:border-[#0d631b]/50 hover:bg-[#0d631b]/5'}`}>
                          <Camera className={`w-6 h-6 ${errors.images && index === 0 ? 'text-red-400' : 'text-outline-variant/40'}`} />
                          <span className="text-[8px] font-black text-on-surface-variant uppercase">إضافة صورة</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => onImageChange(e, index)} />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
                {errors.images && <p className="text-red-500 text-[10px] font-black mr-1">{errors.images}</p>}
              </div>

              {/* Audio Section */}
              <div className="space-y-3">
                <label className="text-sm font-black text-[#1A1A1A] flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[#0d631b]" />
                  رسالة صوتية (إختيارية)
                </label>
                <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                  <button 
                    type="button"
                    onClick={() => setIsRecording(!isRecording)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-600 animate-pulse text-white shadow-lg shadow-red-200' : 'bg-[#0d631b] text-white shadow-lg shadow-[#0d631b]/20'}`}
                  >
                    {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <div className="flex-1">
                    <p className="text-xs font-black text-[#1A1A1A]">
                      {isRecording ? `جاري التسجيل... (${60 - recordingTime}ث)` : audioFile ? 'تم تسجيل الرسالة' : 'سجل رسالة صوتية للمشتري'}
                    </p>
                    {audioPreview && !isRecording && (
                      <audio src={audioPreview} controls className="h-8 mt-2 w-full" />
                    )}
                    {!audioPreview && <p className="text-[10px] text-[#757575] font-bold mt-1">بين الجودة ديالك بالصوت</p>}
                  </div>
                  {audioFile && (
                    <button type="button" onClick={() => { setAudioFile(null); setAudioPreview(null); }} className="text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Text Description */}
              <div className="space-y-3">
                <label className="text-sm font-black text-[#1A1A1A] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#0d631b]" />
                  وصف مكتوب للعرض
                </label>
                <textarea 
                  value={offerDesc}
                  onChange={(e) => setOfferDesc(e.target.value)}
                  placeholder="مثلا: عندي حوالا سردي ملاح، العمر 14 شهر، كسابيين مزيان..."
                  className={`w-full p-5 bg-surface-container-low border ${errors.content ? 'border-red-500' : 'border-outline-variant/20'} rounded-2xl focus:ring-2 focus:ring-[#0d631b]/20 outline-none min-h-[120px] font-medium text-sm`}
                />
                {errors.content && <p className="text-red-500 text-[10px] font-black mr-1">{errors.content}</p>}
              </div>

              {/* Location Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-black text-[#1A1A1A] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#0d631b]" />
                    تحديد موقع القطيع
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setOfferLat(position.coords.latitude);
                            setOfferLng(position.coords.longitude);
                          },
                          () => alert("تعذر تحديد موقعك. يرجى التأكد من تفعيل خدمة المواقع (GPS).")
                        );
                      } else {
                        alert("متصفحك لا يدعم تحديد الموقع.");
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-white text-[#0d631b] border-2 border-[#0d631b] rounded-xl text-xs font-black hover:bg-[#0d631b]/5 transition-all shadow-sm group"
                  >
                    <img src="/src/assets/marketing/features/map-point-svgrepo-com.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="location" />
                    <span>حدد موقعي تلقائيا</span>
                  </button>
                </div>
                <p className="text-xs text-[#757575] font-medium mb-2">باش يقدر المشتري يوصل لعندك للضيعة بسهولة</p>
                <div className="h-[250px] w-full rounded-2xl overflow-hidden border-2 border-outline-variant/20 relative">
                  <LocationMap 
                    lat={offerLat || undefined}
                    lng={offerLng || undefined}
                    isFullscreen={true}
                    sellerInfo={{ name: profile?.pseudo || profile?.displayName || 'ضيعة', rating: 5 }}
                    onLocationSelect={(lat, lng) => {
                      setOfferLat(lat);
                      setOfferLng(lng);
                    }}
                    onAddressFetched={(addr) => setOfferLocation(addr)}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || !!existingOffer}
                className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${isSubmitting ? 'bg-gray-100 text-gray-400' : 'bg-[#0d631b] text-white hover:scale-[1.02] active:scale-95 shadow-[#0d631b]/20'}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>جاري إرسال العرض...</span>
                  </>
                ) : existingOffer ? (
                  'صفتي عرض لهاد الطلب ديجا'
                ) : (
                  <>
                    <Send className="w-6 h-6" />
                    <span>تأكيد وإرسال العرض</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const filteredRequests = (Array.isArray(requests) ? requests : []).filter(req => {
    const status = (req.status || '').toLowerCase();
    const isOpen = status === 'open' || status === 'active' || !req.status;

    if (filterTab === 'submitted') {
      return submittedRequestIds.has(req.id);
    } else {
      return !submittedRequestIds.has(req.id) && isOpen;
    }
  });

  return (
    <div className="space-y-8 relative" dir="rtl">
      {/* Overlays & Modals */}
      {reportingRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-[#1A1A1A]">الإبلاغ عن الطلب</h3>
              <p className="text-sm text-[#757575] font-medium leading-relaxed">
                واش متأكد بلي هاد الطلب فيه شي مشكل ولا مخالف للقوانين؟ الإدارة غادي تراجع البلاغ ديالك.
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <button 
                onClick={async () => {
                  try {
                    await firestoreService.reportListing('offerRequest', reportingRequest.id, 'Inappropriate content');
                    setReportingRequest(null);
                    alert('شكراً، تم إرسال البلاغ وسوف تتم مراجعته.');
                  } catch (e) {
                    alert('وقع خطأ أثناء إرسال البلاغ.');
                  }
                }}
                className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-600/20"
              >
                تأكيد الإبلاغ
              </button>
              <button 
                onClick={() => setReportingRequest(null)}
                className="w-full py-4 bg-gray-50 text-[#1A1A1A] font-black rounded-2xl hover:bg-gray-100 active:scale-95 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {archivingRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
              <History className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-[#1A1A1A]">أرشفة الطلب؟</h3>
              <p className="text-sm text-[#757575] font-medium leading-relaxed">
                واش متأكد بلي تبغي تحط هاد الطلب فالأرشيف؟ ما غادي تفقد العروض اللي توصلت بيها.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  try { await firestoreService.archiveOfferRequest(archivingRequest.id); } catch (e) {}
                  setArchivingRequest(null);
                }}
                className="w-full py-4 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-700 active:scale-95 transition-all shadow-lg shadow-orange-600/20"
              >
                نعم، أرشفه
              </button>
              <button
                onClick={() => setArchivingRequest(null)}
                className="w-full py-4 bg-gray-50 text-[#1A1A1A] font-black rounded-2xl hover:bg-gray-100 active:scale-95 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImages && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
          <button 
            onClick={() => setPreviewImages(null)}
            className="absolute top-6 right-6 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-50"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center">
            {previewImages.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setPreviewIndex((previewIndex + 1) % previewImages.length); }}
                  className="absolute right-0 md:-right-8 p-4 text-white hover:bg-white/10 rounded-full transition-all z-50"
                >
                  <ChevronRight className="w-10 h-10" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setPreviewIndex((previewIndex - 1 + previewImages.length) % previewImages.length); }}
                  className="absolute left-0 md:-left-8 p-4 text-white hover:bg-white/10 rounded-full transition-all z-50"
                >
                  <ChevronLeft className="w-10 h-10" />
                </button>
              </>
            )}
            
            <img 
              src={previewImages[previewIndex]} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-500" 
              alt="Preview"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {viewingRequest ? (
        <div className="max-w-2xl mx-auto animate-in slide-in-from-left-4 duration-300">
          <button 
            onClick={() => setViewingRequest(null)}
            className="flex items-center gap-2 text-primary font-bold mb-6 hover:gap-3 transition-all group"
          >
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            <span>رجوع للطلبات</span>
          </button>

          <div className="bg-white rounded-[10px] p-8 border border-outline-variant/20 shadow-xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-on-surface font-headline">{viewingRequest.title || 'طلب حولي'}</h3>
                <p className="text-on-surface-variant">بواسطة: <span className="text-primary font-bold">{viewingRequest.buyerName || 'مشتري'}</span></p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                  {viewingRequest.offersCount || 0}/6 عروض
                </div>
                <button 
                  onClick={() => setReportingRequest(viewingRequest)}
                  className="text-[10px] font-black text-red-600 hover:underline flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>تبليغ عن هذا الطلب</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container-low rounded-[10px] border border-outline-variant/10 text-center">
                <p className="text-xs font-bold text-on-surface-variant mb-1">السلالة المطلوبة</p>
                <p className="font-black text-primary text-lg">{viewingRequest.breed || viewingRequest.breeds || viewingRequest.races || 'غير محدد'}</p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-[10px] border border-outline-variant/10 text-center">
                <p className="text-xs font-bold text-on-surface-variant mb-1">الميزانية</p>
                <p className="font-black text-[#0a5c1a] text-lg">{viewingRequest.budget || viewingRequest.maxBudget || 0} درهم</p>
              </div>
            </div>

            {viewingRequest.audioUrl && (
              <div className="p-4 bg-surface-container-low rounded-[10px] border border-outline-variant/10 flex items-center gap-3">
                <Mic className="w-5 h-5 text-primary shrink-0" />
                <audio src={viewingRequest.audioUrl} controls className="h-8 flex-1" />
              </div>
            )}

            <div className="p-6 bg-surface-container-low rounded-[10px] border border-outline-variant/10">
              <p className="text-xs font-black text-on-surface-variant mb-2">تفاصيل الطلب</p>
              <p className="text-on-surface font-medium leading-relaxed italic">
                "{viewingRequest.description || 'لا يوجد وصف إضافي'}"
              </p>
            </div>

            {viewingRequest.myOffer ? (
              <div className="space-y-6 border-t border-outline-variant/20 pt-6">
                <div className="bg-[#E8F5E9] p-6 rounded-3xl border border-[#2E7D32]/20">
                  <h4 className="text-lg font-black text-[#2E7D32] mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    عرضك اللي صفتي
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {(viewingRequest.myOffer.images || [viewingRequest.myOffer.imageUrl]).filter(Boolean).map((img: string, idx: number) => (
                        <div 
                          key={idx} 
                          onClick={() => {
                            const imgs = (viewingRequest.myOffer.images || [viewingRequest.myOffer.imageUrl]).filter(Boolean);
                            setPreviewImages(imgs);
                            setPreviewIndex(idx);
                          }}
                          className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform"
                        >
                          <img src={img} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>

                    <div className="bg-white/80 p-4 rounded-2xl text-sm font-medium text-[#4A4A4A]">
                      {viewingRequest.myOffer.description || 'بدون وصف'}
                    </div>

                    {viewingRequest.myOffer.audioUrl && (
                      <div className="flex items-center gap-2 bg-white/50 p-2 rounded-xl">
                        <Mic className="w-4 h-4 text-[#2E7D32]" />
                        <audio src={viewingRequest.myOffer.audioUrl} controls className="h-8 flex-1" />
                      </div>
                    )}

                    <div className="text-sm font-black text-[#2E7D32]">
                      الثمن المقترح: {viewingRequest.myOffer.price || viewingRequest.budget} درهم
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setSelectedRequest(viewingRequest.id);
                  setViewingRequest(null);
                }}
                className="w-full py-5 rounded-[10px] font-black text-lg border border-transparent transition-all flex items-center justify-center gap-2 bg-[#0a5c1a] text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20"
              >
                تقديم عرض دابا
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-2xl font-black text-on-surface font-headline tracking-tight">طلبات المشترين</h2>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-1">
              <p className="text-on-surface-variant text-sm font-medium">تواصل مع المشترين لي كايقلبو على حوالا فحال لي عندك</p>
              
              <div className="flex items-center gap-3">
                <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-[#757575] uppercase">طلبات اليوم</span>
                    <span className="text-sm font-black text-[#1A1A1A]">{dailyLeadsCount} / {dailyLeadsLimit}</span>
                  </div>
                  <div className="w-10 h-10 bg-[#0d631b]/5 rounded-full flex items-center justify-center">
                    <History className="w-5 h-5 text-[#0d631b]" />
                  </div>
                </div>

                <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-[#757575] uppercase">عروض اليوم</span>
                    <span className="text-sm font-black text-[#1A1A1A]">{dailyOffersCount} / {dailyOffersLimit}</span>
                  </div>
                  <div className="w-10 h-10 bg-[#0d631b]/5 rounded-full flex items-center justify-center">
                    <Send className="w-5 h-5 text-[#0d631b]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 bg-white p-1 rounded-2xl border border-gray-100 w-fit shadow-sm">
            <button 
              onClick={() => setFilterTab('open')}
              className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${filterTab === 'open' ? 'bg-[#0d631b] text-white shadow-md' : 'text-[#757575] hover:bg-gray-50'}`}
            >
              طلبات مفتوحة
            </button>
            <button 
              onClick={() => setFilterTab('submitted')}
              className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${filterTab === 'submitted' ? 'bg-[#0d631b] text-white shadow-md' : 'text-[#757575] hover:bg-gray-50'}`}
            >
              عروض تم إرسالها
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <BuyerRequestItem 
                  key={request.id} 
                  request={request} 
                  onSelect={() => setSelectedRequest(request.id)} 
                  onDetails={() => {
                    if (filterTab === 'submitted') {
                      firestoreService.getOffersForRequest(request.id).then(offers => {
                        const myOffer = offers?.find((o: any) => o.sellerId === user?.uid);
                        setViewingRequest({ ...request, myOffer });
                      });
                    } else {
                      setViewingRequest(request);
                    }
                  }}
                  onReport={() => setReportingRequest(request)}
                  hasSubmitted={submittedRequestIds.has(request.id)}
                />
              ))
            ) : (
              <div className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-outline-variant/20">
                <SheepIcon className="w-16 h-16 text-on-surface-variant/10 mx-auto mb-4" />
                <h3 className="text-xl font-black text-[#1A1A1A] font-headline">ماكاين حتى طلب دابا</h3>
                <p className="text-[#757575] font-medium">غير يظهر شي طلب جديد قريب ليك، غادي يبان هنا.</p>
              </div>
            )}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-12">
              <button 
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="px-10 py-4 bg-white border border-outline-variant/30 text-[#1A1A1A] font-black rounded-2xl hover:bg-gray-50 shadow-sm transition-all flex items-center gap-3"
              >
                {isLoadingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : 'مشاهدة المزيد من الطلبات'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
