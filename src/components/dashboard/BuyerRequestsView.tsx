import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle2, Loader2, Mic, Camera, 
  Clock, MessageCircle, Phone, Navigation, Calculator, Bell,
  ShoppingBag, ChevronRight, MapPin, Send, Trash2, Video, 
  Upload, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestoreService';
import { compressImage, checkPayloadSize } from '../../lib/imageUtils';

interface BuyerRequestsViewProps {
  requests: any[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export function BuyerRequestsView({ 
  requests, 
  onLoadMore, 
  hasMore, 
  isLoadingMore 
}: BuyerRequestsViewProps) {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null); // Object = Details, String = Offer Form
  const [offerSent, setOfferSent] = useState(false);
  const [offerDesc, setOfferDesc] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [existingOffer, setExistingOffer] = useState<any | null>(null);

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
    return () => { isMounted = false; };
  }, [user, selectedRequest]);

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRequest || existingOffer) return;

    const requestId = typeof selectedRequest === 'string' ? selectedRequest : selectedRequest.id;
    const request = requests.find(r => r.id === requestId);

    const newErrors: { [key: string]: string } = {};
    if (!offerDesc || offerDesc.length < 5) {
      newErrors.description = "عفاك دخل وصف كافي للعرض ديالك";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      let videoUrl = null;
      let audioUrl = null;

      if (imageFile) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
        imageUrl = await compressImage(base64, 800, 800, 0.6);
      }

      // Note: In real app, these should be uploaded to Firebase Storage
      // For now we use small Base64 for the proof of concept if needed, 
      // but firestoreService.createOffer handles the logic.

      const offerData = {
        sellerId: user.uid,
        requestId: request.id,
        price: request.budget,
        description: offerDesc,
        buyerId: request.buyerId,
        hasAudio: !!audioFile,
        hasImage: !!imageFile,
        hasVideo: !!videoFile,
        imageUrl,
        videoUrl: null, // Simplified for now
        audioUrl: null,
      };

      await firestoreService.createOffer(offerData);
      setOfferSent(true);
    } catch (error) {
      console.error("Failed to send offer:", error);
      alert("وقع مشكل فإرسال العرض. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ── SUCCESS VIEW ──
  if (offerSent) {
    return (
      <div className="flex-1 flex items-center justify-center p-8" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl text-center border border-primary/10">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-on-surface mb-4 font-headline">تم إرسال عرضك!</h2>
          <p className="text-on-surface-variant font-medium mb-8">المشتري غادي يتوصل بالعرض ديالك وغادي يتواصل معاك يلا بغى يكمل العملية.</p>
          <button 
            onClick={() => { setOfferSent(false); setSelectedRequest(null); }} 
            className="w-full bg-[#0a5c1a] text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            الرجوع للطلبات
          </button>
        </div>
      </div>
    );
  }

  // ── OFFER FORM VIEW ──
  if (typeof selectedRequest === 'string') {
    const requestId = selectedRequest;
    const request = requests.find(r => r.id === requestId);
    
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-8" dir="rtl">
        <button onClick={() => setSelectedRequest(request)} className="flex items-center gap-2 text-[#0a5c1a] font-black mb-6 hover:gap-3 transition-all">
          <ArrowLeft className="w-5 h-5" />
          <span>رجوع لتفاصيل الطلب</span>
        </button>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-outline-variant/20">
          <h2 className="text-2xl font-black text-on-surface mb-2 font-headline">تقديم عرض للمشتري</h2>
          <p className="text-on-surface-variant text-sm mb-8">جاوب على طلب <span className="font-bold text-primary">{request?.buyerName}</span> وبين ليه الجودة ديال الحوالا لي عندك.</p>

          <form onSubmit={handleSendOffer} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-on-surface-variant mr-1">وصف العرض ديالك</label>
              <textarea 
                value={offerDesc}
                onChange={(e) => setOfferDesc(e.target.value)}
                placeholder="مثلا: عندي حوالا سردي ملاح، العمر 14 شهر، كسابيين مزيان..."
                className={`w-full p-5 bg-surface-container-low border ${errors.description ? 'border-red-500' : 'border-outline-variant/30'} rounded-[1.5rem] focus:ring-2 focus:ring-primary outline-none min-h-[150px] font-medium`}
              />
              {errors.description && <p className="text-red-500 text-xs font-bold mt-1 mr-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-sm font-black text-on-surface-variant mr-1">صورة للحولي</label>
                 <div className="relative group">
                   {imagePreview ? (
                     <div className="relative h-32 rounded-2xl overflow-hidden border border-primary/20">
                       <img src={imagePreview} className="w-full h-full object-cover" />
                       <button 
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 left-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                       >
                         <X className="w-4 h-4" />
                       </button>
                     </div>
                   ) : (
                     <label className="h-32 rounded-2xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                       <Camera className="w-8 h-8 text-on-surface-variant/30" />
                       <span className="text-[10px] font-black text-on-surface-variant">إضافة صورة</span>
                       <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
                     </label>
                   )}
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-sm font-black text-on-surface-variant mr-1">فيديو (إختياري)</label>
                 <label className="h-32 rounded-2xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                   <Video className="w-8 h-8 text-on-surface-variant/30" />
                   <span className="text-[10px] font-black text-on-surface-variant">إضافة فيديو</span>
                   <input type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                 </label>
               </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || !!existingOffer}
              className={`w-full py-5 rounded-[1.5rem] font-black text-lg shadow-lg transition-all flex items-center justify-center gap-3 ${isSubmitting ? 'bg-surface-container-high text-on-surface-variant' : 'bg-[#0a5c1a] text-white hover:scale-[1.02] active:scale-95'}`}
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
    );
  }

  // ── DETAILS VIEW ──
  if (selectedRequest && typeof selectedRequest === 'object') {
    const request = selectedRequest;
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setSelectedRequest(null)} className="flex items-center gap-2 text-primary font-bold mb-6 hover:gap-3 transition-all">
            <ArrowLeft className="w-5 h-5" />
            <span>رجوع للطلبات</span>
          </button>

          <div className="bg-white rounded-[2.5rem] p-8 border border-outline-variant/20 shadow-xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-on-surface font-headline">{request.title || 'طلب مشتري'}</h3>
                <p className="text-on-surface-variant">بواسطة: <span className="text-primary font-bold">{request.buyerName || 'مشتري'}</span></p>
              </div>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                {request.offersCount || 0}/6 عروض
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 text-center">
                <p className="text-xs font-bold text-on-surface-variant mb-1">السلالة المطلوبة</p>
                <p className="font-black text-primary text-lg">{request.breed}</p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 text-center">
                <p className="text-xs font-bold text-on-surface-variant mb-1">الميزانية</p>
                <p className="font-black text-[#0a5c1a] text-lg">{request.budget} درهم</p>
              </div>
            </div>

            <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/10">
              <p className="text-xs font-black text-on-surface-variant mb-2">تفاصيل الطلب</p>
              <p className="text-on-surface font-medium leading-relaxed italic">"{request.description}"</p>
            </div>

            <button 
              onClick={() => setSelectedRequest(request.id)}
              disabled={request.offersCount >= 6 || !!existingOffer}
              className={`w-full py-5 rounded-2xl font-black text-lg border border-transparent transition-all flex items-center justify-center gap-2 ${request.offersCount >= 6 ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed' : 'bg-[#0a5c1a] text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20'}`}
            >
              {existingOffer ? 'تم تقديم عرضك سابقاً' : request.offersCount >= 6 ? 'العروض مكتملة' : 'تقديم عرض دابا'}
              {!existingOffer && request.offersCount < 6 && <ChevronRight className="w-5 h-5 rotate-180" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW (Optimized UX) ──
  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-on-surface font-headline">طلبات المشترين</h2>
          <p className="text-on-surface-variant text-sm font-medium mt-1">تواصل مع المشترين لي كايقلبو على حوالا فحال لي عندك</p>
        </div>
      </div>

      <div className="space-y-4">
        {requests.length > 0 ? (
          requests.map((request) => (
            <div 
              key={request.id} 
              className="bg-white rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6 group"
            >
              {/* Left Side: Category Icon */}
              <div className="hidden md:flex w-16 h-16 rounded-2xl bg-surface-container-high items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-8 h-8 text-primary/40" />
              </div>

              {/* Middle: Content */}
              <div className="flex-1 text-right md:text-right w-full">
                <div className="flex items-center gap-3 mb-1">
                   <h3 className="text-lg font-black text-on-surface font-headline line-clamp-1">{request.title || 'طلب حولي'}</h3>
                   <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase">{request.breed}</span>
                </div>
                <p className="text-sm text-on-surface-variant font-medium line-clamp-1 mb-2">"{request.description}"</p>
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-on-surface-variant">
                   <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {request.createdAt?.toDate?.()?.toLocaleDateString() || 'اليوم'}</div>
                   <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {request.location || 'قريب منك'}</div>
                   <div className="flex items-center gap-1 text-[#0a5c1a] font-black bg-green-50 px-2 py-0.5 rounded-md">{request.budget} درهم</div>
                </div>
              </div>

              {/* Right Side: Actions */}
              <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                <button 
                  onClick={() => setSelectedRequest(request.id)}
                  disabled={request.offersCount >= 6}
                  className={`flex-1 md:w-32 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${request.offersCount >= 6 ? 'bg-surface-container-high text-on-surface-variant' : 'bg-[#0a5c1a] text-white hover:bg-[#0a5c1a]/90 shadow-sm'}`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>تقديم عرض</span>
                </button>
                <button 
                  onClick={() => setSelectedRequest(request)}
                  className="flex-1 md:w-32 py-3 bg-surface-container-high text-on-surface font-black rounded-xl text-xs hover:bg-surface-variant transition-all flex items-center justify-center gap-1.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  <span>التفاصيل</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center bg-surface-container-low rounded-[3rem] border-2 border-dashed border-outline-variant/20">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-on-surface-variant/20" />
            </div>
            <h3 className="text-2xl font-black text-on-surface font-headline">ماكاين حتى طلب دابا</h3>
            <p className="text-on-surface-variant font-medium">غير يظهر شي طلب جديد قريب ليك، غادي يبان هنا.</p>
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-12">
          <button 
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-10 py-4 bg-white border border-outline-variant/30 text-on-surface font-black rounded-2xl hover:bg-surface-variant shadow-sm transition-all flex items-center gap-3"
          >
            {isLoadingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : 'مشاهدة المزيد من الطلبات'}
          </button>
        </div>
      )}
    </div>
  );
}
