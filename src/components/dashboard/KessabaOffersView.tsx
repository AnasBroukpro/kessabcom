import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, ShoppingBag, PlusCircle, History, LogOut, ChevronRight, 
  Mic, Camera, Bell, CheckCircle2, Loader2, Clock, X 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestoreService';
import { checkPayloadSize } from '../../lib/imageUtils';

interface KessabaOffersViewProps {
  kessabaRequests: any[];
  setKessabaRequests: React.Dispatch<React.SetStateAction<any[]>>;
  showNewRequestForm: boolean;
  setShowNewRequestForm: React.Dispatch<React.SetStateAction<boolean>>;
  selectedKessabaRequest: any;
  setSelectedKessabaRequest: React.Dispatch<React.SetStateAction<any>>;
}

export default function KessabaOffersView({
  kessabaRequests,
  setKessabaRequests,
  showNewRequestForm,
  setShowNewRequestForm,
  selectedKessabaRequest,
  setSelectedKessabaRequest
}: KessabaOffersViewProps) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [breed, setBreed] = useState('سردي');
  const [description, setDescription] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('active');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // Create a file from blob for submission
        const file = new File([blob], "recording.webm", { type: 'audio/webm' });
        setAudioFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteRecording = () => {
    setAudioFile(null);
    setAudioUrl(null);
  };

  useEffect(() => {
    if (selectedKessabaRequest) {
      const unsubscribe = firestoreService.subscribeToOffersForRequest(selectedKessabaRequest.id, (newOffers) => {
        setOffers(newOffers);
      });
      return () => unsubscribe();
    }
  }, [selectedKessabaRequest]);

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
        'سطات': { lat: 33.0000, lng: -7.6167 },
        'برشيد': { lat: 33.2667, lng: -7.5833 },
        'خريبكة': { lat: 32.8833, lng: -6.9167 },
        'الدار البيضاء': { lat: 33.5883, lng: -7.6114 },
        'الرباط': { lat: 34.0209, lng: -6.8416 },
        'مراكش': { lat: 31.6295, lng: -7.9811 },
        'أزرو': { lat: 33.4333, lng: -5.2167 },
        'خنيفرة': { lat: 32.9333, lng: -5.6667 },
        'وجدة': { lat: 34.6833, lng: -1.9000 },
        'الراشيدية': { lat: 31.9333, lng: -4.4333 },
        'طنجة': { lat: 35.7595, lng: -5.8340 }
      };

      const coords = cityCoords[profile?.city || 'سطات'] || cityCoords['سطات'];
      
      const requestData = {
        buyerId: user.uid,
        buyerName: profile?.displayName || 'مشتري',
        title: title || `${breed} - ${budget} درهم`,
        description,
        budget: Number(budget),
        breed,
        category: breed,
        quantity: 1,
        location: profile?.location || 'غير محدد',
        lat: coords.lat,
        lng: coords.lng,
        hasAudio: !!audioFile || isRecording,
        hasImage: false,
        hasVideo: false,
        audioUrl,
      };

      if (!checkPayloadSize(requestData, 5000000)) {
        alert("حجم الملفات كبير بزاف. حاول تسجل مقطع صوتي أقصر.");
        setIsSubmitting(false);
        return;
      }

      if (selectedKessabaRequest?.id) {
        await firestoreService.updateOfferRequest(selectedKessabaRequest.id, requestData);
        setKessabaRequests(prev => prev.map(r => r.id === selectedKessabaRequest.id ? { ...r, ...requestData } : r));
        setSuccessMessage('تم تحديث طلبك بنجاح!');
      } else {
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
        setSuccessMessage('تم نشر طلبك بنجاح! غادي توصل بعروض من الكسابا قريبا.');
      }

      setShowNewRequestForm(false);
      setTitle('');
      setBudget('');
      setBreed('سردي');
      setDescription('');
      setAudioFile(null);
      setAudioUrl(null);
      setSelectedKessabaRequest(null);
      setTimeout(() => setSuccessMessage(null), 5000);
      
    } catch (error: any) {
      console.error("Failed to process request:", error);
      alert("فشل العملية: " + (error.message || "عطل تقني"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectOffer = async (requestId: string, offerId: string) => {
    try {
      await firestoreService.updateOfferStatus(offerId, 'accepted');
    } catch (error) {
      console.error("Failed to select offer:", error);
    }
  };

  if (selectedKessabaRequest) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setSelectedKessabaRequest(null)}
            className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>الرجوع للعروض</span>
          </button>

          <div className="bg-surface p-6 rounded-[10px] border border-outline-variant/30 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-on-surface font-headline">تفاصيل الطلب</h2>
                <p className="text-on-surface-variant mt-1">{selectedKessabaRequest.createdAt?.toDate?.()?.toLocaleDateString() || 'اليوم'}</p>
              </div>
              <div className={`px-4 py-1 rounded-full text-xs font-bold ${
                selectedKessabaRequest.status === 'Open' ? 'bg-green-100 text-green-700' :
                selectedKessabaRequest.status === 'Full' ? 'bg-orange-100 text-orange-700' :
                selectedKessabaRequest.status === 'Selected' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
              }`}>
                {selectedKessabaRequest.status === 'Open' ? 'مفتوح' : 
                 selectedKessabaRequest.status === 'Full' ? 'مكتمل' : 
                 selectedKessabaRequest.status === 'Selected' ? 'تم الاختيار' : 'مغلق'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-on-surface-variant mb-1">عنوان الطلب</p>
                  <p className="text-lg font-black text-primary">{selectedKessabaRequest.title}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant mb-1">الميزانية المقترحة</p>
                  <p className="text-lg font-black text-primary">{selectedKessabaRequest.budget} درهم</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant mb-1">الوصف</p>
                  <p className="text-on-surface leading-relaxed">{selectedKessabaRequest.description}</p>
                </div>
                
                <div className="flex flex-wrap gap-4 mt-4">
                  {selectedKessabaRequest.imageUrl && (
                    <div className="w-24 h-24 rounded-[10px] overflow-hidden border border-outline-variant/30">
                      <img src={selectedKessabaRequest.imageUrl} alt="Request" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  {selectedKessabaRequest.videoUrl && (
                    <div className="w-24 h-24 rounded-[10px] overflow-hidden border border-outline-variant/30 bg-black flex items-center justify-center">
                      <video src={selectedKessabaRequest.videoUrl} className="w-full h-full object-cover" />
                    </div>
                  )}
                  {selectedKessabaRequest.audioUrl && (
                    <div className="w-full p-3 bg-surface-container-high rounded-[10px] flex items-center gap-3">
                      <Mic className="w-5 h-5 text-primary" />
                      <audio src={selectedKessabaRequest.audioUrl} controls className="h-8 flex-1" />
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-surface-container-low p-4 rounded-[10px] border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <p className="font-bold text-on-surface">{selectedKessabaRequest.offersCount || 0} / 6</p>
                <p className="text-xs text-on-surface-variant">عروض متوصل بها</p>
              </div>
            </div>

            <h3 className="text-xl font-black text-on-surface mb-4 font-headline">العروض المتوصل بها</h3>
            <div className="grid grid-cols-1 gap-4">
              {Array.isArray(offers) && offers.length > 0 ? (
                offers.map((offer: any) => (
                  <div key={offer.id} className="bg-surface-container-low p-6 rounded-[10px] border border-outline-variant/20 hover:border-primary/30 transition-all">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-on-surface text-lg">{offer.sellerPseudo || offer.sellerName || 'كساب'}</h4>
                          </div>
                          {offer.status === 'accepted' && (
                            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>العرض المختار</span>
                            </div>
                          )}
                        </div>
                        <p className="text-on-surface-variant text-sm leading-relaxed">{offer.description}</p>
                        
                        <div className="flex flex-wrap gap-3 mt-2">
                          {offer.imageUrl && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-outline-variant/30">
                              <img src={offer.imageUrl} alt="Offer" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          {offer.videoUrl && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden border border-outline-variant/30 bg-black flex items-center justify-center">
                              <video src={offer.videoUrl} className="w-full h-full object-cover" />
                            </div>
                          )}
                          {offer.audioUrl && (
                            <div className="w-full p-2 bg-surface-container-high rounded-lg flex items-center gap-2">
                              <Mic className="w-4 h-4 text-primary" />
                              <audio src={offer.audioUrl} controls className="h-6 flex-1" />
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3">
                          {offer.hasVideo && (
                            <div className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-lg">
                              <Camera className="w-3 h-3" />
                              <span>فيديو متوفر</span>
                            </div>
                          )}
                          {offer.hasAudio && (
                            <div className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                              <Bell className="w-3 h-3" />
                              <span>تسجيل صوتي</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-2 justify-end">
                        <button 
                          onClick={() => {
                            if (offer.videoUrl) {
                              window.open(offer.videoUrl, '_blank');
                            }
                          }}
                          className="px-6 py-2 bg-surface-container-high text-on-surface font-bold rounded-[10px] hover:bg-surface-variant transition-all text-sm"
                        >
                          مشاهدة الفيديو
                        </button>
                        {offer.status !== 'accepted' && (
                          <button 
                            onClick={() => {
                              if (offer.sellerPhone) {
                                window.open(`https://wa.me/${offer.sellerPhone.replace(/\D/g, '')}`, '_blank');
                              } else {
                                handleSelectOffer(selectedKessabaRequest.id, offer.id);
                              }
                            }}
                            className="px-6 py-2 bg-primary text-on-primary font-bold rounded-[10px] hover:bg-primary/90 transition-all text-sm"
                          >
                            الاتصال بالكساب
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-surface-container-low rounded-[10px] border-2 border-dashed border-outline-variant/30">
                  <Clock className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
                  <p className="text-on-surface-variant font-bold">في انتظار العروض...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showNewRequestForm) {
    return (
      <div className="flex-1 overflow-y-auto p-0" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8 bg-white/80 backdrop-blur-md p-4 rounded-xl border border-outline-variant/10 sticky top-0 z-10">
            <button 
              onClick={() => setShowNewRequestForm(false)} 
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group"
            >
              <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
              <span className="font-black text-sm">الرجوع للعروض</span>
            </button>
            <h2 className="text-xl font-black text-on-surface font-headline">فتح المزاد</h2>
          </div>

          <div className="bg-surface p-8 rounded-[10px] border border-outline-variant/30 shadow-xl mx-4 md:mx-0">
            <form onSubmit={handleCreateRequest} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">عنوان الطلب</label>
                  <input 
                    type="text"
                    placeholder="مثلا: حولي سردي للعيد"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-4 bg-surface-container-low border border-outline-variant/20 rounded-[10px] focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">الميزانية (درهم)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      placeholder="مثلا: 1800"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full p-4 bg-surface-container-low border border-outline-variant/20 rounded-[10px] focus:ring-2 focus:ring-primary outline-none"
                      required
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">درهم</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-on-surface-variant">نوع السلالة</label>
                <div className="grid grid-cols-3 gap-3">
                  {['سردي', 'بركي', 'مستورد'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBreed(b)}
                      className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                        breed === b 
                          ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                          : 'border-outline-variant/10 hover:border-primary/30 text-on-surface-variant'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">وصف الطلب (كتابة)</label>
                <textarea 
                  placeholder="اكتب هنا المواصفات لي كتقلب عليها..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-4 bg-surface-container-low border border-outline-variant/20 rounded-[10px] focus:ring-2 focus:ring-primary outline-none min-h-[120px]"
                  required
                />
              </div>

              <div className="p-6 bg-primary/5 rounded-[10px] border border-primary/10 flex flex-col items-center gap-4">
                <p className="text-sm font-bold text-on-surface-variant">سجل وصفك بالصوت (اختياري)</p>
                <div className="flex flex-col items-center gap-4 w-full">
                  {!audioUrl ? (
                    <button 
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-error text-on-error animate-pulse' : 'bg-primary text-on-primary hover:scale-110'}`}
                    >
                      <Mic className="w-8 h-8" />
                    </button>
                  ) : (
                    <div className="w-full space-y-4">
                      <div className="flex items-center gap-3 bg-surface p-3 rounded-[10px] border border-outline-variant/20">
                        <audio src={audioUrl} controls className="h-8 flex-1" />
                        <button 
                          type="button"
                          onClick={deleteRecording}
                          className="p-1.5 bg-red-600 text-white rounded-full hover:scale-110 transition-transform shadow-lg flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-green-600 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تم التسجيل بنجاح</span>
                      </div>
                    </div>
                  )}
                  {!audioUrl && (
                    <p className="text-xs text-on-surface-variant">
                      {isRecording ? 'جاري التسجيل... اضغط للتوقف' : 'اضغط للبدء في التسجيل'}
                    </p>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-primary text-on-primary rounded-[10px] font-black text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'تأكيد ونشر'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const filteredRequests = (Array.isArray(kessabaRequests) ? kessabaRequests : []).filter(req => {
    if (filterStatus === 'active') return req.status !== 'Archived';
    if (filterStatus === 'archived') return req.status === 'Archived';
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {successMessage && (
          <div className="flex items-center gap-3 bg-green-500 text-white px-5 py-4 rounded-[10px] shadow-lg mb-6 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="font-bold text-sm flex-1">{successMessage}</p>
            <button onClick={() => setSuccessMessage(null)} className="opacity-70 hover:opacity-100 transition-opacity">✕</button>
          </div>
        )}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-on-surface font-headline">فتح المزاد</h2>
            <p className="text-on-surface-variant text-sm mt-1">طلباتك الخاصة والعروض اللي توصلتي بيها</p>
          </div>
          <button 
            onClick={() => setShowNewRequestForm(true)}
            className="bg-primary text-on-primary px-6 py-3 rounded-[10px] font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            <span>طلب جديد</span>
          </button>
        </div>

        <div className="flex gap-2 mb-6 bg-surface-container-high p-1 rounded-[10px] w-fit">
          <button 
            onClick={() => setFilterStatus('active')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === 'active' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
          >
            الطلبات النشطة ({filteredRequests.filter(r => r.status !== 'Archived').length})
          </button>
          <button 
            onClick={() => setFilterStatus('archived')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === 'archived' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
          >
            الأرشيف
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {filteredRequests.map((request) => (
            <div 
              key={request.id}
              onClick={() => setSelectedKessabaRequest(request)}
              className="bg-surface p-4 rounded-[10px] border border-outline-variant/20 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                        request.status === 'Open' ? 'bg-green-100 text-green-700' :
                        request.status === 'Full' ? 'bg-orange-100 text-orange-700' :
                        request.status === 'Selected' ? 'bg-blue-100 text-blue-700' :
                        request.status === 'Archived' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {request.status === 'Open' ? 'مفتوح' : 
                         request.status === 'Full' ? 'مكتمل' : 
                         request.status === 'Selected' ? 'تم الاختيار' : 
                         request.status === 'Archived' ? 'مؤرشف' : 'مغلق'}
                      </div>
                      <h3 className="text-sm font-black text-on-surface group-hover:text-primary transition-colors">{request.title}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-primary font-bold text-sm">{request.budget} درهم</p>
                      {request.status !== 'Archived' ? (
                        <div className="flex items-center gap-1 ml-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              firestoreService.archiveOfferRequest(request.id).then(() => {
                                setKessabaRequests(prev => prev.map(r => r.id === request.id ? {...r, status: 'Archived'} : r));
                              });
                            }}
                            className="p-1 text-on-surface-variant hover:text-primary transition-colors bg-surface-container-low rounded-full"
                          >
                            <History className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedKessabaRequest(request);
                              setShowNewRequestForm(true);
                            }}
                            className="p-1 text-on-surface-variant hover:text-primary transition-colors bg-surface-container-low rounded-full"
                          >
                            <PlusCircle className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('هل أنت متأكد من مسح هذا الطلب؟')) {
                                firestoreService.deleteOfferRequest(request.id).then(() => {
                                  setKessabaRequests(prev => prev.filter(r => r.id !== request.id));
                                });
                              }
                            }}
                            className="p-1 text-on-surface-variant hover:text-error transition-colors bg-surface-container-low rounded-full"
                          >
                            <LogOut className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 ml-2">
                          <span className="text-xs text-on-surface-variant italic">تمت الأرشفة</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="font-bold">{request.breed}</span>
                    <span className="w-1 h-1 bg-outline-variant/30 rounded-full"></span>
                    <span className="line-clamp-1 italic">"{request.description}"</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center px-4 border-r border-outline-variant/20">
                    <p className="text-xl font-black text-on-surface">{request.offersCount}</p>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">عروض</p>
                  </div>
                  <div className="w-10 h-10 rounded-[10px] bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12 bg-surface rounded-[10px] border-2 border-dashed border-outline-variant/20">
            <ShoppingBag className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-on-surface">
              {filterStatus === 'archived' ? 'ما عندك حتى طلب فالأرشيف' : 'ما عندك حتى مزاد على المشتري'}
            </h3>
            <p className="text-on-surface-variant mt-1 text-sm">بدا دابا وأنشئ أول طلب باش توصل بعروض من الكسّابة</p>
            <button 
              onClick={() => setShowNewRequestForm(true)}
              className="mt-4 text-primary font-bold hover:underline text-sm"
            >
              أنشئ طلبك الأول من هنا
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
