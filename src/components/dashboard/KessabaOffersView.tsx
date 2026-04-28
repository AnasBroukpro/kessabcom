import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, ShoppingBag, PlusCircle, History, LogOut, ChevronRight, ChevronLeft, AlertTriangle,
  Mic, Camera, Bell, CheckCircle2, Loader2, Clock, X, MapPin, Video, BadgeCheck, Phone, Eye, Trash2, MessageSquare, Star, Calculator
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ContactSellerModal from '../ContactSellerModal';
import SuggestedOffersGrid from './SuggestedOffersGrid';
import { firestoreService } from '../../services/firestoreService';
import { checkPayloadSize } from '../../lib/imageUtils';
import * as audioUtils from '../../lib/audioUtils';
import { cityCoords, calculateDistance } from '../../constants/cityMapping';

interface KessabaOffersViewProps {
  kessabaRequests: any[];
  setKessabaRequests: React.Dispatch<React.SetStateAction<any[]>>;
  showNewRequestForm: boolean;
  setShowNewRequestForm: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function KessabaOffersView({
  kessabaRequests,
  setKessabaRequests,
  showNewRequestForm,
  setShowNewRequestForm
}: KessabaOffersViewProps) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSession, setRecordingSession] = useState<audioUtils.RecordingSession | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'offers' | 'active' | 'archived'>('active');
  const [expandedRequests, setExpandedRequests] = useState<string[]>([]);
  const [lightboxData, setLightboxData] = useState<{images: string[], index: number} | null>(null);
  const [contactOfferData, setContactOfferData] = useState<{ phone?: string, whatsapp?: string, listingId?: string } | null>(null);
  const [acceptOfferData, setAcceptOfferData] = useState<{ requestId: string, offerId: string } | null>(null);
  const [viewingRequest, setViewingRequest] = useState<any | null>(null);
  const [viewingOffersGrid, setViewingOffersGrid] = useState<any | null>(null);
  const [offersForGrid, setOffersForGrid] = useState<any[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [showArchiveConfirmData, setShowArchiveConfirmData] = useState<any | null>(null);
  const [reportOfferData, setReportOfferData] = useState<{ id: string, type: 'offer' | 'offerRequest' } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);

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
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      const file = new File([blob], "recording.webm", { type: 'audio/webm' });
      setAudioFile(file);
      setRecordingSession(null);
      setIsRecording(false);
    }
  };

  const deleteRecording = () => {
    setAudioFile(null);
    setAudioUrl(null);
  };

  useEffect(() => {
    if (viewingOffersGrid) {
      setIsLoadingOffers(true);
      firestoreService.getOffersForRequest(viewingOffersGrid.id)
        .then(offers => {
          setOffersForGrid(offers || []);
          setIsLoadingOffers(false);
        })
        .catch(err => {
          console.error("Error fetching offers for grid:", err);
          setIsLoadingOffers(false);
        });
    }
  }, [viewingOffersGrid]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      let audioUrl = null;
      if (audioFile) {
        audioUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(audioFile);
        });
      }
      const cityCoords: Record<string, { lat: number, lng: number }> = {
        'سطات': { lat: 33.0, lng: -7.6167 }, 'برشيد': { lat: 33.2667, lng: -7.5833 },
        'خريبكة': { lat: 32.8833, lng: -6.9167 }, 'الدار البيضاء': { lat: 33.5883, lng: -7.6114 },
        'الرابط': { lat: 34.0209, lng: -6.8416 }, 'مراكش': { lat: 31.6295, lng: -7.9811 },
        'أزرو': { lat: 33.4333, lng: -5.2167 }, 'خنيفرة': { lat: 32.9333, lng: -5.6667 },
        'وجدة': { lat: 34.6833, lng: -1.9 }, 'الراشيدية': { lat: 31.9333, lng: -4.4333 },
        'طنجة': { lat: 35.7595, lng: -5.834 }
      };
      const coords = cityCoords[profile?.city || ''];
      const requestData = {
        buyerId: user.uid,
        buyerName: profile?.displayName || 'مشتري',
        title: title || `${selectedBreeds.join(' & ')} - ${budget} درهم`,
        description: description || '',
        budget: parseFloat(budget) || 0,
        breed: selectedBreeds.join(', '),
        category: selectedBreeds[0] || 'سردي',
        quantity: 1,
        location: profile?.location || 'غير محدد',
        lat: coords.lat, lng: coords.lng,
        hasAudio: !!audioFile || isRecording,
        hasImage: false, hasVideo: false,
        audioUrl,
      };
      if (!checkPayloadSize(requestData, 800000)) {
        alert("حجم المقطع الصوتي كبير بزاف.");
        setIsSubmitting(false);
        return;
      }
      const result = await firestoreService.createOfferRequest(requestData);
      if (result.error) throw new Error(result.error);
      const newRequest = {
        id: result.id || `temp-${Date.now()}`,
        ...requestData,
        status: 'Open',
        offersCount: 0,
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      };
      setKessabaRequests(prev => [newRequest, ...prev]);
      setSuccessMessage('تم نشر طلبك بنجاح!');
      setShowNewRequestForm(false);
      setTitle(''); setBudget(''); setSelectedBreeds([]); setDescription(''); setAudioFile(null); setAudioUrl(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      alert("فشل العملية: " + (error.message || "عطل تقني"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!showArchiveConfirmData) return;
    try {
      await firestoreService.archiveOfferRequest(showArchiveConfirmData.id);
      setKessabaRequests(prev => prev.map(r => r.id === showArchiveConfirmData.id ? { ...r, status: 'Archived' } : r));
      setShowArchiveConfirmData(null);
    } catch (error) {
      console.error("Error archiving:", error);
    }
  };

  // ── Sub-Components ──

  const OffersList = ({ requestId }: { requestId: string }) => {
    const [offers, setOffers] = useState<any[]>([]);
    const [loadingOffers, setLoadingOffers] = useState(true);
    const [offerListings, setOfferListings] = useState<Record<string, any>>({});

    useEffect(() => {
      let isSubscribed = true;
      const unsubscribe = firestoreService.subscribeToOffersForRequest(requestId, (data) => {
        if (!isSubscribed) return;
        setOffers(data || []);
        setLoadingOffers(false);
        data?.forEach(async (offer: any) => {
          if (offer.sellerId && !offerListings[offer.sellerId]) {
            try {
              const listings = await firestoreService.getSellerListings(offer.sellerId);
              if (listings && listings.length > 0 && isSubscribed) {
                setOfferListings(prev => ({ ...prev, [offer.sellerId]: listings[0] }));
              }
            } catch (err) { console.error(err); }
          }
        });
      });
      return () => { isSubscribed = false; unsubscribe(); };
    }, [requestId]);

    if (loadingOffers) return <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;
    if (offers.length === 0) return <div className="text-center py-10 text-on-surface-variant font-bold italic">لا توجد عروض بعد</div>;

    return (
      <div className="space-y-4">
        {offers.map((offer: any) => {
          const sellerName = offer.sellerPseudo || offer.sellerName || 'الكساب';
          const imgs = (offer.images || [offer.imageUrl]).filter(Boolean);
          return (
            <div key={offer.id} className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black">{sellerName[0]}</div>
                  <span className="font-black text-on-surface">{sellerName}</span>
                </div>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-black">{offer.price} درهم</div>
              </div>
              {imgs.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {imgs.slice(0, 3).map((img: string, idx: number) => (
                    <img key={idx} src={img} className="w-full aspect-square object-cover rounded-xl border border-outline-variant/5" referrerPolicy="no-referrer" onClick={() => setLightboxData({ images: imgs, index: idx })} />
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button 
                  onClick={() => setContactOfferData({ phone: offer.sellerPhone, whatsapp: offer.sellerWhatsapp, listingId: offer.id })}
                  className="flex-1 py-3 bg-[#0d631b] text-white rounded-xl font-black text-xs"
                >تواصل</button>
                <button 
                  onClick={() => setViewingRequest({...viewingOffersGrid, selectedOffer: offer})}
                  className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-xl font-black text-xs"
                >التفاصيل</button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const KessabaRequestCard = ({ request, isExpanded, toggleExpand }: { request: any, isExpanded: boolean, toggleExpand: () => void }) => {
    const breed = (request.breed || request.breeds || 'سردي').split(', ')[0];
    const isClosed = (request.status || '').toLowerCase() === 'closed' || (request.status || '').toLowerCase() === 'archived';
    const dateText = request.createdAt ? (request.createdAt.toDate ? request.createdAt.toDate() : new Date(request.createdAt.seconds * 1000)).toLocaleDateString('ar-MA') : 'اليوم';

    return (
      <div className={`bg-white rounded-2xl p-6 border transition-all ${isExpanded ? 'border-[#0d631b] shadow-xl' : 'border-outline-variant/10 shadow-sm hover:shadow-md'} relative group`}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="hidden md:flex w-16 h-16 rounded-2xl bg-surface-container-high items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-8 h-8 text-primary/40" />
          </div>
          <div className="flex-1 text-right w-full">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-black text-on-surface font-headline">{request.title || 'طلب حولي'}</h3>
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full">{breed}</span>
              {isClosed && <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black rounded-full">مغلق</span>}
              {request.status === 'FULL' && <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black rounded-full">مكتمل</span>}
            </div>
            <p className="text-sm text-on-surface-variant font-medium line-clamp-1 mb-2">"{request.description}"</p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold mt-4">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-600 rounded-lg border border-gray-100">
                <Clock className="w-3.5 h-3.5" />
                <span>{dateText}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0d631b]/5 text-[#0d631b] rounded-lg border border-[#0d631b]/10">
                <Calculator className="w-3.5 h-3.5" />
                <span>الميزانية: {request.budget} درهم</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{request.offersCount || 0} عروض</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
                <MapPin className="w-3.5 h-3.5" />
                <span>{request.location || 'الدار البيضاء'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
            <button 
              onClick={() => setViewingOffersGrid(request)}
              className="flex-1 md:w-32 py-3 bg-[#0d631b] text-white rounded-xl font-black text-xs shadow-sm hover:bg-[#0a4d15] transition-all"
            >شوف العروض</button>
            <button 
              onClick={(e) => { e.stopPropagation(); setViewingRequest(request); }}
              className="flex-1 md:w-32 py-3 bg-[#F9F9F6] text-[#1A1A1A] rounded-xl font-black text-xs border border-outline-variant/10 hover:bg-white transition-all"
            >التفاصيل</button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowArchiveConfirmData({ type: 'request', id: request.id });
              }}
              className="flex items-center justify-center gap-1 text-[10px] font-black text-gray-500 hover:text-red-600 hover:underline text-center mt-1 transition-colors"
            >
              <History className="w-3 h-3" />
              أرشيف الطلب
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-outline-variant/10 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">وصف الطلب الكامل</p>
                <p className="text-on-surface font-medium leading-relaxed italic bg-surface-container-low p-4 rounded-xl">"{request.description}"</p>
              </div>
              {request.audioUrl && (
                <div>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-2">الرسالة الصوتية</p>
                  <div className="bg-[#F9F9F6] p-3 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#0d631b] text-white rounded-full flex items-center justify-center shrink-0">
                      <Mic className="w-4 h-4" />
                    </div>
                    <audio src={request.audioUrl} controls className="h-8 flex-1" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Removed redundant archive icon from here */}
      </div>
    );
  };

  const Lightbox = () => {
    if (!lightboxData) return null;
    const { images, index } = lightboxData;
    return (
      <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightboxData(null)}>
        <button onClick={() => setLightboxData(null)} className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"><X className="w-6 h-6 text-white" /></button>
        <img src={images[index]} className="max-w-full max-h-full object-contain rounded-2xl" />
      </div>
    );
  };

  // ── Render Logic ──

  if (viewingOffersGrid) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 text-right" dir="rtl">
        <div className="flex items-center justify-between mb-8 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/10 sticky top-0 z-10">
          <button onClick={() => setViewingOffersGrid(null)} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group">
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
            <span className="font-black text-sm">الرجوع للطلبات</span>
          </button>
          <h2 className="text-xl font-black text-on-surface font-headline">العروض المتوصل بها</h2>
        </div>
        {isLoadingOffers ? (
          <div className="py-24 text-center"><Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" /><p className="text-on-surface-variant font-medium">جاري تحميل العروض...</p></div>
        ) : offersForGrid.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {offersForGrid.map((offer) => (
              <div key={offer.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={() => setViewingRequest({...viewingOffersGrid, selectedOffer: offer})}>
                <div className="relative h-64 overflow-hidden">
                  <img alt={offer.sellerName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={offer.imageUrl || offer.images?.[0] || "https://firebasestorage.googleapis.com/v0/b/kessabcom-0004.firebasestorage.app/o/announcements%2Fimages%2Fplaceholder.png"} referrerPolicy="no-referrer" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-[#1A1A1A] px-3 py-1 rounded-full text-xs font-bold shadow-sm">{offer.price || viewingOffersGrid.budget} درهم</div>
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-[#1A1A1A] px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 cursor-pointer hover:bg-white">
                    <MapPin className="w-3 h-3 text-[#2E7D32]" />
                    <span>
                      {(() => {
                        const sellerCity = offer.sellerCity || 'المغرب';
                        const userCity = profile?.city || '';
                        const userCoords = cityCoords[userCity];
                        const sCoords = cityCoords[sellerCity];
                        if (userCoords && sCoords) {
                          const dist = calculateDistance(userCoords.lat, userCoords.lng, sCoords.lat, sCoords.lng);
                          return `${sellerCity} (${Math.round(dist)} كلم)`;
                        }
                        return sellerCity;
                      })()}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[#2E7D32] font-bold truncate max-w-[150px]">{offer.sellerPseudo || offer.sellerName || 'الكساب'}</p>
                      <div className="flex items-center gap-0.5" dir="ltr">
                        {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < (offer.rating || 5) ? 'fill-[#FFC107] text-[#FFC107]' : 'text-[#D1D1D1]'}`} />)}
                        <span className="text-[10px] text-on-surface-variant font-bold ml-1">({offer.rating || 5})</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3 border-t border-outline-variant/10 pt-3">
                      <button onClick={(e) => { e.stopPropagation(); setContactOfferData({ phone: offer.sellerPhone, whatsapp: offer.sellerWhatsapp, listingId: offer.id }); }} className="py-2.5 bg-[#2E7D32] text-white font-bold rounded-lg hover:bg-[#1b5e20] transition-colors text-sm">تواصل</button>
                      <button onClick={(e) => { e.stopPropagation(); setViewingRequest({...viewingOffersGrid, selectedOffer: offer}); setViewingOffersGrid(null); }} className="py-2.5 bg-[#F9F9F6] text-[#1A1A1A] font-bold rounded-lg hover:bg-white hover:border-[#2E7D32] transition-colors text-sm border border-transparent">التفاصيل</button>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportOfferData({ id: offer.id, type: 'offer' });
                      }}
                      className="text-[10px] font-black text-red-600 hover:underline flex items-center justify-center gap-1 mt-2 w-full"
                    >
                      <AlertTriangle className="w-3 h-3"/> تبليغ عن هذا العرض
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-outline-variant/20">
            <ShoppingBag className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-4" />
            <h3 className="text-xl font-black text-[#1A1A1A]">ماكاين حتى عرض دابا</h3>
          </div>
        )}
      </div>
    );
  }

  if (showNewRequestForm) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-0 pb-20 text-right" dir="rtl">
        <div className="flex items-center justify-between mb-8 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/10 sticky top-0 z-10">
          <button onClick={() => setShowNewRequestForm(false)} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group">
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
            <span className="font-black text-sm">رجوع</span>
          </button>
          <h2 className="text-xl font-black text-on-surface font-headline">إضافة طلب جديد</h2>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-2xl">
          <form onSubmit={handleCreateRequest} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-black text-[#1A1A1A]">عنوان الطلب</label>
                <input type="text" placeholder="مثلا: حولي سردي للعيد" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-4 bg-surface-container-low border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-[#0d631b] outline-none font-bold" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-[#1A1A1A]">الميزانية (درهم)</label>
                <input type="number" placeholder="مثلا: 1800" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full p-4 bg-surface-container-low border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-[#0d631b] outline-none font-black" required />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-black text-[#1A1A1A]">نوع السلالة</label>
              <div className="grid grid-cols-3 gap-3">
                {['سردي', 'بركي', 'مستورد'].map((b) => (
                  <button key={b} type="button" onClick={() => setSelectedBreeds(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])} className={`py-4 rounded-xl text-xs font-black border-2 transition-all ${selectedBreeds.includes(b) ? 'bg-[#0d631b] text-white border-[#0d631b] shadow-lg' : 'border-[#F0F0F0] hover:border-[#0d631b]/30 bg-white'}`}>{b}</button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="text-sm font-black text-[#1A1A1A]">رسالة صوتية (اختياري)</label>
              {!audioUrl ? (
                <button
                  type="button"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={`w-full py-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${
                    isRecording 
                      ? 'bg-red-50 border-2 border-red-500 text-red-600 scale-95' 
                      : 'bg-surface-container-low border-2 border-dashed border-outline-variant/30 text-on-surface-variant hover:border-[#0d631b]/30 hover:bg-[#0d631b]/5 hover:text-[#0d631b]'
                  }`}
                >
                  <div className={`p-4 rounded-full ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-surface-container-high'}`}>
                    <Mic className="w-8 h-8" />
                  </div>
                  <span className="font-black">
                    {isRecording ? `جاري التسجيل... (${60 - recordingTime}ث) - طلق باش تحبس` : 'ورك وبقى مورك باش تسجل'}
                  </span>
                </button>
              ) : (
                <div className="bg-[#0d631b]/5 p-4 rounded-2xl border border-[#0d631b]/20 flex items-center gap-4">
                  <button type="button" onClick={deleteRecording} className="p-3 hover:bg-red-100 text-red-500 rounded-full transition-colors shrink-0" title="مسح التسجيل">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <audio src={audioUrl} controls className="w-full h-10" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-[#1A1A1A]">وصف الطلب</label>
              <textarea placeholder="اكتب هنا المواصفات..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-4 bg-surface-container-low border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-[#0d631b] outline-none min-h-[120px] font-bold" required />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-[#0d631b] text-white rounded-2xl font-black text-xl shadow-xl shadow-[#0d631b]/20 hover:scale-[1.02] active:scale-95 transition-all">
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'نشر الطلب'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (viewingRequest) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-0 pb-20 text-right" dir="rtl">
        <button onClick={() => setViewingRequest(null)} className="flex items-center gap-2 text-primary font-bold mb-6 hover:gap-3 transition-all group">
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          <span>رجوع للطلبات</span>
        </button>
        <div className="bg-white rounded-3xl p-8 border border-outline-variant/20 shadow-2xl space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-black text-on-surface font-headline">{viewingRequest.selectedOffer ? (viewingRequest.selectedOffer.sellerPseudo || viewingRequest.selectedOffer.sellerName || 'عرض كساب') : (viewingRequest.title || 'طلب حولي')}</h3>
              <p className="text-on-surface-variant">بواسطة: <span className="text-primary font-bold">{viewingRequest.selectedOffer ? (viewingRequest.selectedOffer.sellerPseudo || viewingRequest.selectedOffer.sellerName) : (profile?.pseudo || profile?.displayName || 'أنا')}</span></p>
            </div>
            <div className="flex items-center gap-4">
              {viewingRequest.selectedOffer && (
                <button 
                  onClick={() => setReportOfferData({ id: viewingRequest.selectedOffer.id, type: 'offer' })}
                  className="text-red-600 text-[11px] font-black hover:underline"
                >
                  تبليغ عن هذا العرض
                </button>
              )}
              <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold">
                {viewingRequest.selectedOffer ? 'تفاصيل العرض' : `${viewingRequest.offersCount || 0} عروض`}
              </div>
            </div>
          </div>
          
          {viewingRequest.selectedOffer && (
            <div className="space-y-6">
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-outline-variant/20">
                <img 
                  src={viewingRequest.selectedOffer.imageUrl || viewingRequest.selectedOffer.images?.[0] || "https://firebasestorage.googleapis.com/v0/b/kessabcom-0004.firebasestorage.app/o/announcements%2Fimages%2Fplaceholder.png"} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 text-center">
                  <p className="text-xs font-bold text-on-surface-variant mb-1">السعر</p>
                  <p className="font-black text-[#0d631b] text-lg">{viewingRequest.selectedOffer.price} درهم</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 text-center">
                  <p className="text-xs font-bold text-on-surface-variant mb-1">المدينة</p>
                  <p className="font-black text-primary text-lg">{viewingRequest.selectedOffer.sellerCity || 'غير محدد'}</p>
                </div>
              </div>
              <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                <p className="text-xs font-black text-on-surface-variant mb-2">وصف العرض</p>
                <p className="text-on-surface font-medium leading-relaxed italic">"{viewingRequest.selectedOffer.description || 'لا يوجد وصف'}"</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    if (viewingRequest.selectedOffer.locationLink) {
                      window.open(viewingRequest.selectedOffer.locationLink, '_blank');
                    } else if (viewingRequest.selectedOffer.lat && viewingRequest.selectedOffer.lng) {
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${viewingRequest.selectedOffer.lat},${viewingRequest.selectedOffer.lng}`, '_blank');
                    } else {
                      const loc = viewingRequest.selectedOffer.sellerLocation || viewingRequest.selectedOffer.sellerCity || 'Maroc';
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`, '_blank');
                    }
                  }}
                  className="flex-none w-14 py-4 bg-[#F9F9F6] text-[#1A1A1A] rounded-xl font-black flex items-center justify-center border border-outline-variant/20 hover:bg-white transition-colors"
                  title="طريق الضيعة (GPS)"
                >
                  <MapPin className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setReportOfferData({ id: viewingRequest.selectedOffer.id, type: 'offer' })}
                  className="flex-1 py-4 bg-red-50 text-red-600 rounded-xl font-black border border-red-100 hover:bg-red-100 transition-colors"
                >تبليغ عن العرض</button>
                <button 
                  onClick={() => setContactOfferData({ phone: viewingRequest.selectedOffer.sellerPhone, whatsapp: viewingRequest.selectedOffer.sellerWhatsapp, listingId: viewingRequest.selectedOffer.id })}
                  className="flex-1 py-4 bg-[#2E7D32] text-white rounded-xl font-black shadow-lg hover:bg-[#1b5e20] transition-colors"
                >تواصل مع الكساب</button>
              </div>
            </div>
          )}

          {!viewingRequest.selectedOffer && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 text-center">
                  <p className="text-xs font-bold text-on-surface-variant mb-1">السلالة</p>
                  <p className="font-black text-primary text-lg">{viewingRequest.breed || 'سردي'}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 text-center">
                  <p className="text-xs font-bold text-on-surface-variant mb-1">الميزانية</p>
                  <p className="font-black text-[#0d631b] text-lg">{viewingRequest.budget} درهم</p>
                </div>
              </div>
              <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                <p className="text-xs font-black text-on-surface-variant mb-2">تفاصيل الطلب</p>
                <p className="text-on-surface font-medium leading-relaxed italic">"{viewingRequest.description}"</p>
              </div>
              <div className="space-y-6 pt-6 border-t border-outline-variant/10">
                <h3 className="text-xl font-black text-on-surface font-headline">العروض المتوصل بها</h3>
                <OffersList requestId={viewingRequest.id} />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const filteredRequests = (Array.isArray(kessabaRequests) ? kessabaRequests : []).filter(req => {
    const status = (req.status || '').toLowerCase();
    if (filterStatus === 'active') return status === 'open' || status === 'active';
    if (filterStatus === 'archived') return status === 'archived' || status === 'closed';
    return true;
  });

  return (
    <div className="space-y-8 pb-20 relative text-right w-full" dir="rtl">
      {successMessage && <div className="bg-green-500 text-white p-4 rounded-xl shadow-lg mb-6 flex justify-between items-center"><p className="font-bold text-sm">{successMessage}</p><button onClick={() => setSuccessMessage(null)}>✕</button></div>}
      {showArchiveConfirmData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center space-y-6">
            <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto"><History className="w-10 h-10" /></div>
            <h3 className="text-2xl font-black text-[#1A1A1A]">أرشفة الطلب؟</h3>
            <div className="flex flex-col gap-3">
              <button onClick={handleArchive} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black shadow-lg">نعم، أرشفه</button>
              <button onClick={() => setShowArchiveConfirmData(null)} className="w-full py-4 bg-gray-50 text-[#1A1A1A] rounded-2xl font-black border border-gray-100">إلغاء</button>
            </div>
          </div>
        </div>
      )}
      <Lightbox />
      {contactOfferData && (
        <ContactSellerModal 
          isOpen={!!contactOfferData} 
          onClose={() => setContactOfferData(null)}
          sellerPhone={contactOfferData.phone}
          sellerWhatsapp={contactOfferData.whatsapp}
          listingId={contactOfferData.listingId}
          onNavigate={() => {}}
        />
      )}
      {reportOfferData && (
        <div className="fixed inset-0 bg-black/60 z-[250] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto"><AlertTriangle className="w-10 h-10" /></div>
            <h3 className="text-2xl font-black text-[#1A1A1A]">تبليغ عن المحتوى</h3>
            <p className="text-sm text-on-surface-variant font-medium">المرجو توضيح سبب التبليغ. سيتم مراجعة طلبك من قبل الإدارة.</p>
            <textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="اكتب سبب التبليغ هنا..."
              className="w-full h-32 p-4 border border-outline-variant/20 rounded-xl resize-none focus:outline-none focus:border-red-500 bg-surface-container-low font-medium"
            />
            <div className="flex flex-col gap-3">
              <button 
                disabled={isReporting || !reportReason.trim()}
                onClick={async () => {
                  setIsReporting(true);
                  try {
                    await firestoreService.createReport({
                      targetType: reportOfferData.type,
                      targetId: reportOfferData.id,
                      reason: reportReason.trim()
                    });
                    alert('تم إرسال التبليغ بنجاح.');
                    setReportOfferData(null);
                    setReportReason('');
                  } catch (e) {
                    alert('وقع خطأ أثناء الإرسال.');
                  } finally {
                    setIsReporting(false);
                  }
                }} 
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg disabled:opacity-50"
              >
                {isReporting ? 'جاري الإرسال...' : 'إرسال التبليغ'}
              </button>
              <button onClick={() => { setReportOfferData(null); setReportReason(''); }} className="w-full py-4 bg-gray-50 text-[#1A1A1A] rounded-2xl font-black border border-gray-100">إلغاء</button>
            </div>
          </div>
        </div>
      )}
      {acceptOfferData && (
        <div className="fixed inset-0 bg-black/60 z-[250] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] max-w-sm w-full text-center space-y-6">
            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 className="w-10 h-10" /></div>
            <h3 className="text-2xl font-black text-[#1A1A1A]">قبول هذا العرض؟</h3>
            <button onClick={async () => {
              await firestoreService.updateOfferStatus(acceptOfferData.offerId, 'accepted');
              setKessabaRequests(prev => prev.map(r => r.id === acceptOfferData.requestId ? {...r, status: 'Closed'} : r));
              setAcceptOfferData(null);
            }} className="w-full py-4 bg-[#0d631b] text-white rounded-2xl font-black shadow-lg">تأكيد القبول</button>
            <button onClick={() => setAcceptOfferData(null)} className="w-full py-4 bg-gray-50 text-[#1A1A1A] rounded-2xl font-black border border-gray-100">إلغاء</button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-black text-[#1A1A1A] font-headline tracking-tight mb-2">طلباتي</h2>
          <p className="text-[#757575] font-medium">تبع الطلبات ديالك وشوف العروض لي وصلاتك</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowNewRequestForm(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0d631b] text-white rounded-xl text-sm font-black shadow-lg hover:shadow-xl transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>طلب جديد</span>
          </button>
          <div className="flex bg-white p-1 rounded-2xl border border-outline-variant/10 shadow-sm">
            <button 
              onClick={() => setFilterStatus('offers')}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${filterStatus === 'offers' ? 'bg-[#0d631b] text-white shadow-md' : 'text-[#757575]'}`}
            >
              العروض المقترحة
            </button>
            <button 
              onClick={() => setFilterStatus('active')}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${filterStatus === 'active' ? 'bg-[#0d631b] text-white shadow-md' : 'text-[#757575]'}`}
            >
              نشطة
            </button>
            <button 
              onClick={() => setFilterStatus('archived')}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${filterStatus === 'archived' ? 'bg-[#0d631b] text-white shadow-md' : 'text-[#757575]'}`}
            >
              الأرشيف
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filterStatus === 'offers' ? (
          <SuggestedOffersGrid 
            kessabaRequests={kessabaRequests}
            setLightboxData={setLightboxData}
            setContactOfferData={setContactOfferData}
            setAcceptOfferData={setAcceptOfferData}
            profile={profile}
            setReportOfferData={setReportOfferData}
          />
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <KessabaRequestCard key={request.id} request={request} isExpanded={expandedRequests.includes(request.id)} toggleExpand={() => {
              setExpandedRequests(prev => prev.includes(request.id) ? prev.filter(id => id !== request.id) : [...prev, request.id]);
            }} />
          ))
        ) : (
          <div className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-outline-variant/20">
            <ShoppingBag className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-4" />
            <h3 className="text-xl font-black text-[#1A1A1A]">مازال ما حطيتي حتى طلب</h3>
            <button onClick={() => setShowNewRequestForm(true)} className="mt-6 bg-[#0d631b] text-white px-8 py-4 rounded-2xl font-black shadow-lg">إضافة طلب جديد</button>
          </div>
        )}
      </div>

      <button onClick={() => setShowNewRequestForm(true)} className="fixed bottom-24 left-6 z-50 md:hidden w-14 h-14 bg-[#0d631b] text-white rounded-full shadow-2xl flex items-center justify-center"><PlusCircle className="w-7 h-7" /></button>
    </div>
  );
}
