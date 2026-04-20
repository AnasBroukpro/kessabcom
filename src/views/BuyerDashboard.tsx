import React, { useState, useRef, useEffect } from 'react';
import { ViewType } from '../App';
import { Search, MapPin, SlidersHorizontal, ArrowLeft, BadgeCheck, Scale, Heart, Bell, User, Map, LayoutDashboard, Compass, Star, LogOut, Settings, CreditCard, History, ChevronRight, Mic, ShieldCheck, Navigation, TrendingUp, ShoppingBag, Bookmark, Calculator, Truck, Info, Camera, MessageCircle, Eye, CheckCircle2, PlusCircle, HeartHandshake, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { useSettings } from '../hooks/useSettings';
import { compressImage, checkPayloadSize } from '../lib/imageUtils';
import DashboardHeader from '../components/DashboardHeader';
import NewsTicker from '../components/NewsTicker';

import GoogleMapComponent from '../components/GoogleMap';
import { cityMapping, getDisplayCity } from '../constants/cityMapping';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
  activeSubView?: string;
}

interface Listing {
  id: number;
  title: string;
  breed: string;
  location: string;
  weight: string;
  verified: boolean;
  rating: number;
  image: string;
  lat: number;
  lng: number;
}

const cities = ["سطات", "برشيد", "خريبكة", "الدار البيضاء", "الرباط", "مراكش", "أزرو", "خنيفرة", "وجدة", "الراشيدية", "طنجة"];

type DashboardView = 'dashboard' | 'favorites' | 'tools' | 'subscription' | 'account' | 'request-animal' | 'kessaba-offers';

interface KessabaOffersViewProps {
  kessabaRequests: any[];
  setKessabaRequests: React.Dispatch<React.SetStateAction<any[]>>;
  showNewRequestForm: boolean;
  setShowNewRequestForm: React.Dispatch<React.SetStateAction<boolean>>;
  selectedKessabaRequest: any;
  setSelectedKessabaRequest: React.Dispatch<React.SetStateAction<any>>;
}

function KessabaOffersView({
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
        audioUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(audioFile);
        });
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const requestData = {
        buyerId: user.uid,
        buyerName: profile?.displayName || 'مشتري',
        title,
        budget: Number(budget),
        breed,
        description,
        location: profile?.location || 'غير محدد',
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        hasAudio: !!audioFile || isRecording,
        hasImage: false,
        hasVideo: false,
        audioUrl,
      };

      if (!checkPayloadSize(requestData)) {
        alert("حجم الملفات (الصوت) كبير بزاف. حاول تسجل مقطع أقصر.");
        setIsSubmitting(false);
        return;
      }

      await firestoreService.createOfferRequest(requestData);
      setShowNewRequestForm(false);
      setTitle('');
      setBudget('');
      setBreed('سردي');
      setDescription('');
      setAudioFile(null);
    } catch (error) {
      console.error("Failed to create request:", error);
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

          <div className="bg-surface p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
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
                    <div className="w-24 h-24 rounded-xl overflow-hidden border border-outline-variant/30">
                      <img src={selectedKessabaRequest.imageUrl} alt="Request" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  {selectedKessabaRequest.videoUrl && (
                    <div className="w-24 h-24 rounded-xl overflow-hidden border border-outline-variant/30 bg-black flex items-center justify-center">
                      <video src={selectedKessabaRequest.videoUrl} className="w-full h-full object-cover" />
                    </div>
                  )}
                  {selectedKessabaRequest.audioUrl && (
                    <div className="w-full p-3 bg-surface-container-high rounded-xl flex items-center gap-3">
                      <Mic className="w-5 h-5 text-primary" />
                      <audio src={selectedKessabaRequest.audioUrl} controls className="h-8 flex-1" />
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <p className="font-bold text-on-surface">{selectedKessabaRequest.offersCount || 0} / 6</p>
                <p className="text-xs text-on-surface-variant">عروض متوصل بها</p>
              </div>
            </div>

            <h3 className="text-xl font-black text-on-surface mb-4 font-headline">العروض المتوصل بها</h3>
            <div className="grid grid-cols-1 gap-4">
              {offers.length > 0 ? (
                offers.map((offer: any) => (
                  <div key={offer.id} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-all">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-on-surface text-lg">{offer.sellerName || 'كساب'}</h4>
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
                          className="px-6 py-2 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-variant transition-all text-sm"
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
                            className="px-6 py-2 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-all text-sm"
                          >
                            الاتصال بالكساب
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant/30">
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
      <div className="flex-1 overflow-y-auto p-4 md:p-8" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => setShowNewRequestForm(false)}
            className="flex items-center gap-2 text-primary font-bold mb-6 hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>إلغاء الطلب</span>
          </button>

          <div className="bg-surface p-8 rounded-3xl border border-outline-variant/30 shadow-xl">
            <h2 className="text-2xl font-black text-on-surface mb-6 font-headline">فتح المزاد</h2>
            <form onSubmit={handleCreateRequest} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-on-surface-variant">عنوان الطلب</label>
                  <input 
                    type="text"
                    placeholder="مثلا: حولي سردي للعيد"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-primary outline-none"
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
                      className="w-full p-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-primary outline-none"
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
                  className="w-full p-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-primary outline-none min-h-[120px]"
                  required
                />
              </div>

              <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col items-center gap-4">
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
                      <div className="flex items-center gap-3 bg-surface p-3 rounded-xl border border-outline-variant/20">
                        <audio src={audioUrl} controls className="h-8 flex-1" />
                        <button 
                          type="button"
                          onClick={deleteRecording}
                          className="p-2 text-error hover:bg-error/10 rounded-full transition-colors"
                        >
                          <LogOut className="w-5 h-5 rotate-180" />
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
                className="w-full py-4 bg-primary text-on-primary rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'تأكيد ونشر'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const filteredRequests = kessabaRequests.filter(req => {
    if (filterStatus === 'active') return req.status !== 'Archived';
    if (filterStatus === 'archived') return req.status === 'Archived';
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-on-surface font-headline">فتح المزاد</h2>
            <p className="text-on-surface-variant text-sm mt-1">طلباتك الخاصة والعروض اللي توصلتي بيها</p>
          </div>
          <button 
            onClick={() => setShowNewRequestForm(true)}
            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            <span>طلب جديد</span>
          </button>
        </div>

        <div className="flex gap-2 mb-6 bg-surface-container-high p-1 rounded-xl w-fit">
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
              className="bg-surface p-4 rounded-2xl border border-outline-variant/20 shadow-sm hover:shadow-md transition-all cursor-pointer group"
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
                      {request.status !== 'Archived' && (
                        <div className="flex items-center gap-1 ml-2">
                          {request.offersCount > 0 ? (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                firestoreService.archiveOfferRequest(request.id).then(() => {
                                  setKessabaRequests(prev => prev.map(r => r.id === request.id ? {...r, status: 'Archived'} : r));
                                });
                              }}
                              className="p-1 text-on-surface-variant hover:text-primary transition-colors bg-surface-container-low rounded-full"
                              title="أرشفة الطلب"
                            >
                              <History className="w-3 h-3" />
                            </button>
                          ) : (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedKessabaRequest(request);
                                  setShowNewRequestForm(true);
                                }}
                                className="p-1 text-on-surface-variant hover:text-blue-500 transition-colors bg-surface-container-low rounded-full"
                                title="تعديل الطلب"
                              >
                                <Settings className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  firestoreService.deleteOfferRequest(request.id).then(() => {
                                    setKessabaRequests(prev => prev.filter(r => r.id !== request.id));
                                  });
                                }}
                                className="p-1 text-on-surface-variant hover:text-error transition-colors bg-surface-container-low rounded-full"
                                title="مسح الطلب"
                              >
                                <LogOut className="w-3 h-3" />
                              </button>
                            </>
                          )}
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
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12 bg-surface rounded-2xl border-2 border-dashed border-outline-variant/20">
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

interface RequestAnimalViewProps {
  setActiveView: React.Dispatch<React.SetStateAction<DashboardView>>;
}

function RequestAnimalView({ setActiveView }: RequestAnimalViewProps) {
  const { user, profile } = useAuth();
  const [sheepCount, setSheepCount] = useState('1');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await firestoreService.createDonation({
        donorId: user.uid,
        name: profile?.displayName || 'متبرع',
        city: profile?.location || 'غير محدد',
        phone: profile?.phoneNumber || '',
        sheepCount: parseInt(sheepCount),
        description,
        type: 'donor',
        status: 'pending'
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit donation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center p-8" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl text-center border border-[#E8F5E9]">
          <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-[#2E7D32]" />
          </div>
          <h2 className="text-3xl font-black text-[#1A1A1A] mb-4 font-headline">تم إرسال تبرعك!</h2>
          <p className="text-[#4A4A4A] font-medium mb-8">شكرا لك على كرمك. التبرع ديالك غادي يوصل للناس لي محتاجين وغادي نتواصلو معاك لتنسيق عملية التسليم.</p>
          <button 
            onClick={() => setActiveView('dashboard')} 
            className="w-full bg-[#2E7D32] text-white py-4 rounded-xl font-bold hover:bg-[#1B5E20] transition-all"
          >
            الرجوع للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-on-surface font-headline">تبرع تضامني (Don Solidarité)</h2>
          <p className="text-on-surface-variant">ساهم في إدخال الفرحة على الأسر المعوزة. حدد عدد الأكباش لي بغيتي تبرع بيهم.</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-outline-variant/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#4A4A4A] mr-1">عدد الأكباش للتبرع</label>
              <div className="relative">
                <input 
                  className="w-full h-14 px-4 pr-12 bg-[#F9F9F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:bg-white transition-all outline-none text-left" 
                  placeholder="مثلا: 1" 
                  required 
                  type="number" 
                  min="1"
                  dir="ltr"
                  value={sheepCount}
                  onChange={(e) => setSheepCount(e.target.value)}
                />
                <Calculator className="absolute right-4 top-1/2 -translate-y-1/2 text-[#757575] w-5 h-5" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#4A4A4A] mr-1">ملاحظات إضافية</label>
              <div className="relative">
                <textarea 
                  className="w-full p-4 pr-12 bg-[#F9F9F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:bg-white transition-all outline-none min-h-[150px]" 
                  placeholder="مثلا: بغيت التبرع يوصل لمدينة معينة، أو عندي شروط خاصة..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <MessageCircle className="absolute right-4 top-4 text-[#757575] w-5 h-5" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-16 bg-[#2E7D32] text-white font-black text-xl rounded-xl shadow-lg shadow-[#2E7D32]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'تأكيد التبرع'}
            </button>
          </form>
        </div>

        <div className="mt-8 p-6 bg-surface rounded-2xl border border-outline-variant/20">
          <h4 className="font-bold text-on-surface mb-4">كيفاش كايخدم هاد النظام؟</h4>
          <ul className="space-y-3">
            {[
              'الطلب ديالك كايوصل لكاع الكسابة لي فـ منطقتك.',
              'الكسابة كايصيفطو ليك فيديوهات وصور ديال الحوالا لي عندهم.',
              'عندك الحق تشوف حتى لـ 6 ديال العروض فقط.',
              'فاش كايوصلو 6 العروض، الطلب كايتغلق أوتوماتيكيا.',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-on-surface-variant">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">{i+1}</div>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function BuyerDashboard({ onNavigate, activeSubView }: Props) {
  const { user, profile, signOut } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [activeView, setActiveView] = useState<DashboardView>('dashboard');

  useEffect(() => {
    if (activeSubView) {
      setActiveView(activeSubView as DashboardView);
    }
  }, [activeSubView]);
  const [timeFilter, setTimeFilter] = useState<'day' | 'month'>('day');
  const [activeAccountTab, setActiveAccountTab] = useState<'profile' | 'notifications' | 'security' | 'settings' | 'payment'>('profile');
  const [kessabaRequests, setKessabaRequests] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [profileData, setProfileData] = useState({
    displayName: profile?.displayName || '',
    phoneNumber: profile?.phoneNumber || '',
    location: profile?.location || ''
  });

  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [calcWeight, setCalcWeight] = useState('50');
  const [calcBreed, setCalcBreed] = useState('سردي');
  const [transportDist, setTransportDist] = useState('50');
  const [breed, setBreed] = useState('سردي');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getEstimatedPrice = () => {
    const basePrice = breed === 'سردي' ? 65 : breed === 'بركي' ? 62 : 60;
    return 50 * basePrice; // Default weight 50 for estimation
  };

  const getTransportCost = () => {
    const dist = parseInt(transportDist);
    if (dist <= 20) return 150;
    if (dist <= 50) return 300;
    return 300 + (dist - 50) * 5;
  };

  const getTitle = () => {
    switch (activeView) {
      case 'dashboard': return `مرحبا بك، ${profile?.displayName || 'أحمد'}`;
      case 'favorites': return 'المفضلة';
      case 'tools': return 'الأدوات';
      case 'subscription': return 'الاشتراك';
      case 'account': return 'حسابي';
      case 'request-animal': return 'تبرع تضامني';
      case 'kessaba-offers': return 'فتح المزاد';
      default: return 'لوحة التحكم';
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onNavigate('auth');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleToggleFavorite = async (listingId: string) => {
    if (!user) return;
    const isFavorite = favorites.some(f => f.listingId === listingId);
    try {
      await firestoreService.toggleFavorite(listingId, isFavorite);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await firestoreService.updateProfile(profileData);
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  useEffect(() => {
    if (user) {
      const unsubRequests = firestoreService.subscribeToUserRequests(user.uid, (requests) => {
        setKessabaRequests(requests);
      });
      const unsubFavorites = firestoreService.subscribeToFavorites(user.uid, (favs) => {
        setFavorites(favs);
      });
      
      // Fetch real announcements
      const fetchAnnouncements = async () => {
        const data = await firestoreService.getAnnouncements();
        if (data) setAnnouncements(data);
      };
      fetchAnnouncements();

      return () => {
        unsubRequests();
        unsubFavorites();
      };
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setProfileData({
        displayName: profile.displayName || '',
        phoneNumber: profile.phoneNumber || '',
        location: profile.location || ''
      });
    }
  }, [profile]);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [selectedKessabaRequest, setSelectedKessabaRequest] = useState<any>(null);
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);

  const [citySearch, setCitySearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filteredCities = cities.filter(city => 
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const listings: Listing[] = [
    {
      id: 1,
      title: "حولي سردي كسابي ممتاز",
      breed: "سردي",
      location: "مديونة (8 كلم)",
      weight: "~55kg",
      verified: true,
      rating: 5,
      image: "https://i.ytimg.com/vi/RrkkshRUttw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD92lI4Kxe5liKSwWZaJuLAFopNeA",
      lat: 33.4500,
      lng: -7.3833
    },
    {
      id: 2,
      title: "بركي مليح ديال العيد",
      breed: "بركي",
      location: "بوسكورة (12 كلم)",
      weight: "~48kg",
      verified: false,
      rating: 5,
      image: "https://i.ytimg.com/vi/LOP8amZRWhU/maxresdefault.jpg",
      lat: 33.4833,
      lng: -7.5833
    },
    {
      id: 3,
      title: "تيمحضيت حرش الأطلس",
      breed: "تيمحضيت",
      location: "المحمدية (18 كلم)",
      weight: "~65kg",
      verified: true,
      rating: 5,
      image: "https://i.ytimg.com/vi/wqBKddMCA5c/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAapMy6IcxARiCzDRMSG7s3Qw8EvA",
      lat: 33.6833,
      lng: -7.3833
    }
  ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-outline-variant'}`} />
        ))}
      </div>
    );
  };

  const renderDashboard = () => {
    const stats = [
      { label: 'إعلانات شفتها', value: `${announcements.length * 3 + 4} إعلان`, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'مواقع حددتها ب (GPS)', value: `${Math.floor(announcements.length / 2) + 1} مواقع`, icon: Navigation, color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'الكسابة لي تاصلت بيهم', value: `${kessabaRequests.length + 2} شخص`, icon: MessageCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
      { label: 'الضياعات المفضلة', value: `${favorites.length} إعلان`, icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    // Calculate breed popularity based on total clicks
    const breedClicks: Record<string, number> = {};
    let totalAllClicks = 0;

    announcements.forEach(ann => {
      if (ann.category && ann.totalClicks) {
        breedClicks[ann.category] = (breedClicks[ann.category] || 0) + ann.totalClicks;
        totalAllClicks += ann.totalClicks;
      }
    });

    const colors = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-blue-500', 'bg-purple-500'];
    
    const calculatedBreedPopularity = Object.entries(breedClicks)
      .map(([breed, clicks], index) => ({
        breed,
        percentage: totalAllClicks > 0 ? Math.round((clicks / totalAllClicks) * 100) : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    // Fallback if no clicks yet
    const breedPopularity = calculatedBreedPopularity.length > 0 ? calculatedBreedPopularity : [
      { breed: 'سردي', percentage: 0, color: 'bg-primary' },
      { breed: 'بركي', percentage: 0, color: 'bg-secondary' },
      { breed: 'تيمحضيت', percentage: 0, color: 'bg-tertiary' },
    ];

    const displayListings = announcements.length > 0 ? announcements.slice(0, 3) : listings;

    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black text-on-surface font-headline">لوحة تحكم المشتري</h2>
              <p className="text-on-surface-variant">مرحبا بك {profile?.displayName || 'أحمد'}، هاهي نظرة عامة على النشاط ديالك</p>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-high p-1 rounded-xl">
              <button 
                onClick={() => setTimeFilter('day')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeFilter === 'day' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
              >
                اليوم
              </button>
              <button 
                onClick={() => setTimeFilter('month')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeFilter === 'month' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
              >
                هاد الشهر
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {stats.map((kpi, i) => (
              <div key={i} className="bg-surface p-6 rounded-3xl border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center mb-4`}>
                  <kpi.icon className="w-6 h-6" />
                </div>
                <p className="text-xs text-on-surface-variant mb-1 font-bold">{kpi.label}</p>
                <p className="text-xl font-black text-on-surface">
                  {timeFilter === 'day' ? (i % 2 === 0 ? '0' : '1') : kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* News Ticker */}
          <div className="mb-8">
            <NewsTicker className="shadow-none border border-outline-variant/10 p-4" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Announcements Closest to You */}
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-on-surface font-headline">الإعلانات الأقرب إليك</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayListings.map((listing: any) => {
                  const isFavorite = favorites.some(f => f.listingId === (listing.id || listing.listingId)?.toString());
                  return (
                    <div key={listing.id} className="bg-surface rounded-2xl p-3 flex gap-4 border border-outline-variant/30 hover:shadow-lg transition-shadow cursor-pointer group relative" onClick={() => onNavigate('listing-details', listing.id || listing.listingId)}>
                      <div className="w-24 h-24 rounded-xl overflow-hidden relative shrink-0">
                        <img alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={listing.image || listing.imageUrl || "https://picsum.photos/seed/sheep/200/200"} referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-bold text-on-surface text-sm mb-1 truncate">{listing.title}</h4>
                        <div className="flex items-center gap-1 text-on-surface-variant text-xs mb-1">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {(() => {
                              const dist = listing.distance || 0;
                              const city = getDisplayCity(listing);
                              
                              if (dist === 0 && !listing.distance) return city; // Handle mock data or missing distance
                              
                              if (dist < 5) return `${city} (قريب ليك)`;
                              if (dist < 25) return `${city} (على بعد ${Math.round(dist)} كلم)`;
                              if (dist < 80) return `${city} (بعيد شوية، ${Math.round(dist)} كلم)`;
                              return `${city} (بعيد)`;
                            })()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{listing.breed || 'سردي'}</span>
                          {renderStars(listing.rating || 5)}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite((listing.id || listing.listingId).toString());
                        }}
                        className={`absolute top-4 left-4 p-1.5 rounded-full backdrop-blur-md transition-all z-10 ${isFavorite ? 'bg-error text-on-error' : 'bg-surface/80 text-on-surface-variant hover:text-error'}`}
                      >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  );
                })}
                {/* See More Card */}
                <div 
                  onClick={() => setActiveView('map-search')}
                  className="bg-surface rounded-2xl p-3 flex items-center justify-center border border-outline-variant/30 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group h-[104px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ArrowLeft className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-primary">شوف كولشي</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-surface rounded-3xl border border-outline-variant/20 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-on-surface">النشاط الأخير</h3>
                  <button 
                    onClick={() => setActiveView('favorites')}
                    className="text-primary text-sm font-bold hover:underline"
                  >
                    عرض الكل
                  </button>
                </div>
                <div className="space-y-6">
                  {(() => {
                    const recentActivity = [];
                    
                    favorites.forEach(fav => {
                      const listing = announcements.find(a => (a.id || a.listingId)?.toString() === fav.listingId);
                      if (listing) {
                        recentActivity.push({
                          action: 'حفظت إعلان',
                          target: listing.title || 'إعلان',
                          time: fav.createdAt ? new Date(fav.createdAt.seconds * 1000).toLocaleDateString('ar-MA') : 'مؤخرا',
                          timestamp: fav.createdAt ? fav.createdAt.seconds : 0,
                          icon: Bookmark,
                          color: 'text-primary',
                          listingId: listing.id || listing.listingId
                        });
                      }
                    });

                    kessabaRequests.forEach(req => {
                      recentActivity.push({
                        action: 'فتحت مزاد',
                        target: req.title || 'طلب',
                        time: req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleDateString('ar-MA') : 'مؤخرا',
                        timestamp: req.createdAt ? req.createdAt.seconds : 0,
                        icon: PlusCircle,
                        color: 'text-blue-500',
                        view: 'kessaba-offers'
                      });
                    });

                    recentActivity.sort((a, b) => b.timestamp - a.timestamp);
                    const displayActivity = recentActivity.slice(0, 3);

                    if (displayActivity.length === 0) {
                      return <p className="text-center text-on-surface-variant">لا يوجد نشاط أخير</p>;
                    }

                    return displayActivity.map((item, i) => (
                      <button 
                        key={i} 
                        onClick={() => {
                          if (item.listingId) onNavigate('listing-details', item.listingId);
                          else if (item.view) setActiveView(item.view as DashboardView);
                        }}
                        className="w-full flex items-center gap-4 hover:bg-surface-container-low p-2 rounded-xl transition-colors text-right"
                      >
                        <div className={`w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center ${item.color}`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-on-surface">{item.action}: <span className="text-primary">{item.target}</span></p>
                          <p className="text-xs text-on-surface-variant">{item.time}</p>
                        </div>
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Tips & Recommendations */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-on-surface font-headline">نصائح ليك</h3>
              <div className="bg-primary/5 rounded-3xl border border-primary/10 p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-on-surface">كيفاش تختار أحسن حولي؟</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  ركز ديما على العينين يكونو صافيين، والصوف تكون نقية وماكاتطيحش. الحركة ديال الحولي فالضيعة حتى هي مهمة بزاف.
                </p>
                <button 
                  onClick={() => setActiveTool('guide')}
                  className="text-primary font-bold text-sm hover:underline"
                >
                  قرا المزيد من النصائح
                </button>
              </div>

              <div className="bg-surface rounded-3xl border border-outline-variant/20 p-6">
                <h4 className="font-bold text-on-surface mb-6">السلالات الأكثر طلباً</h4>
                <div className="space-y-6">
                  {breedPopularity.map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-on-surface">{item.breed}</span>
                        <span className="text-on-surface-variant font-medium">{item.percentage}%</span>
                      </div>
                      <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} transition-all duration-1000`} 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTools = () => (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-on-surface font-headline mb-2">أدوات المشتري</h2>
        <p className="text-on-surface-variant mb-8 text-lg">مجموعة من الأدوات باش تعاونك تختار وتشري أحسن حولي.</p>

        {activeTool === 'calculator' ? (
          <div className="bg-surface p-8 rounded-3xl border border-outline-variant/30 shadow-xl animate-in fade-in slide-in-from-top-4">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-primary font-bold mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>الرجوع للأدوات</span>
            </button>
            <h3 className="text-2xl font-black text-on-surface mb-6">حاسبة الأثمنة التقديرية</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">السلالة</label>
                <div className="grid grid-cols-3 gap-2">
                  {['سردي', 'بركي', 'مستورد'].map(b => (
                    <button 
                      key={b}
                      onClick={() => setCalcBreed(b)}
                      className={`py-3 rounded-xl font-bold border transition-all ${calcBreed === b ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low text-on-surface border-outline-variant/20'}`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-on-surface-variant">الوزن التقديري (كلغ)</label>
                  <span className="text-primary font-black">{calcWeight} كلغ</span>
                </div>
                <input 
                  type="range" min="30" max="100" value={calcWeight} 
                  onChange={(e) => setCalcWeight(e.target.value)}
                  className="w-full accent-primary"
                />
              </div>
              <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 text-center">
                <p className="text-sm text-on-surface-variant mb-1">الثمن التقديري</p>
                <p className="text-4xl font-black text-primary">{getEstimatedPrice()} درهم</p>
                <p className="text-[10px] text-on-surface-variant mt-2">* هاد الثمن تقديري فقط وكايتغير حسب الجودة والسوق</p>
              </div>
            </div>
          </div>
        ) : activeTool === 'transport' ? (
          <div className="bg-surface p-8 rounded-3xl border border-outline-variant/30 shadow-xl animate-in fade-in slide-in-from-top-4">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-primary font-bold mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>الرجوع للأدوات</span>
            </button>
            <h3 className="text-2xl font-black text-on-surface mb-6">تقدير تكلفة النقل</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-on-surface-variant">المسافة (كلم)</label>
                  <span className="text-primary font-black">{transportDist} كلم</span>
                </div>
                <input 
                  type="range" min="5" max="500" value={transportDist} 
                  onChange={(e) => setTransportDist(e.target.value)}
                  className="w-full accent-primary"
                />
              </div>
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                <p className="text-sm text-blue-700 mb-1">تكلفة النقل التقديرية</p>
                <p className="text-4xl font-black text-blue-800">{getTransportCost()} درهم</p>
                <p className="text-[10px] text-blue-600 mt-2">* التكلفة كاتشمل التوصيل حتى لباب الدار مع المساعدة فالتفريغ</p>
              </div>
            </div>
          </div>
        ) : activeTool === 'delivery' ? (
          <div className="bg-surface p-8 rounded-3xl border border-outline-variant/30 shadow-xl animate-in fade-in slide-in-from-top-4">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-primary font-bold mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>الرجوع للأدوات</span>
            </button>
            <h3 className="text-2xl font-black text-on-surface mb-6">تأكيد الاستلام والضمان</h3>
            <div className="space-y-6">
              <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                <h4 className="font-bold text-green-800 mb-2">كيفاش تأكد الطلب ديالك؟</h4>
                <p className="text-sm text-green-700 leading-relaxed">فاش يوصلك الحولي للدار، تأكد من الحالة ديالو ومن الأوراق (إلا كاينين). من بعد، دخل لهنا وكليكي على "تأكيد الاستلام" باش الكساب يتوصل بالخلاص ديالو.</p>
              </div>
              <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/20 text-center">
                <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="text-on-surface-variant font-bold mb-4">ما عندك حتى طلب حالياً فطور التوصيل</p>
                <button className="px-6 py-3 bg-primary/10 text-primary rounded-xl font-bold opacity-50 cursor-not-allowed">تأكيد الاستلام</button>
              </div>
            </div>
          </div>
        ) : activeTool === 'camera' ? (
          <div className="bg-surface p-8 rounded-3xl border border-outline-variant/30 shadow-xl animate-in fade-in slide-in-from-top-4">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-primary font-bold mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>الرجوع للأدوات</span>
            </button>
            <h3 className="text-2xl font-black text-on-surface mb-6">تقدير الوزن بالذكاء الاصطناعي</h3>
            <div className="space-y-6">
              <div className="aspect-video bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-variant/50 transition-all group">
                <Camera className="w-12 h-12 text-on-surface-variant mb-4 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-on-surface">صور الحولي من الجنب</p>
                <p className="text-xs text-on-surface-variant mt-1">غادي نعطيوك وزن تقريبي بناءً على الصورة</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-700 leading-relaxed">هاد الأداة كتعطي غير وزن تقديري. الوزن الحقيقي كيكون فالميزان فاش كيشري الواحد.</p>
              </div>
            </div>
          </div>
        ) : activeTool === 'guide' ? (
          <div className="bg-surface p-8 rounded-3xl border border-outline-variant/30 shadow-xl animate-in fade-in slide-in-from-top-4">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-primary font-bold mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>الرجوع للأدوات</span>
            </button>
            <h3 className="text-2xl font-black text-on-surface mb-6">كيفاش تختار أحسن حولي؟</h3>
            <div className="space-y-6 text-on-surface">
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-primary">1. الحالة الصحية العامة</h4>
                <p className="text-sm leading-relaxed">تأكد بلي الحولي كايتحرك مزيان، عينيه صافيين ومافيهمش دموع، ونيف ديالو ناشف ومافيهش سيلان.</p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-primary">2. الصوف والجلد</h4>
                <p className="text-sm leading-relaxed">الصوف خاصها تكون نقية وماكاتطيحش بسهولة. الجلد خاصو يكون خالي من الجروح أو الحبوب.</p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-primary">3. الأسنان (السن)</h4>
                <p className="text-sm leading-relaxed">قلب السنان باش تعرف السن ديال الحولي (ثني، رباعي، سداسي...). الثني هو المفضل للأضحية.</p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-lg text-primary">4. التغذية</h4>
                <p className="text-sm leading-relaxed">سول الكساب على العلف اللي كايعطي للحوالا. العلف الطبيعي (شعير، تبن، فصة) هو الأحسن للجودة ديال اللحم.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { id: 'calculator', title: 'حاسبة الأثمنة', desc: 'قارن الأثمنة حسب السلالة والوز', icon: Calculator, color: 'bg-orange-100 text-orange-700' },
              { id: 'transport', title: 'تقدير النقل', desc: 'حسب تكلفة توصيل الحولي لدارك', icon: Truck, color: 'bg-blue-100 text-blue-700' },
              { id: 'delivery', title: 'تأكيد الاستلام', desc: 'أكد بلي وصلك الحولي فالموعد', icon: BadgeCheck, color: 'bg-green-100 text-green-700' },
              { id: 'guide', title: 'دليل السلالات', desc: 'تعرف على مميزات كل سلالة مغربية', icon: Info, color: 'bg-purple-100 text-purple-700' },
              { id: 'camera', title: 'تقدير الوزن بالصورة', desc: 'صور الحولي ونعطيوك وزن تقريبي', icon: Camera, color: 'bg-pink-100 text-pink-700' },
            ].map((tool, i) => (
              <button 
                key={i} 
                onClick={() => setActiveTool(tool.id)}
                className="flex items-center gap-6 p-6 bg-surface rounded-3xl border border-outline-variant/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-right group shadow-sm"
              >
                <div className={`w-16 h-16 rounded-2xl ${tool.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <tool.icon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-lg font-bold text-on-surface mb-1">{tool.title}</p>
                  <p className="text-sm text-on-surface-variant">{tool.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSubscription = () => (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-on-surface font-headline mb-2">اشتراك المشتري</h2>
        <p className="text-on-surface-variant mb-8 text-lg">اختار الباقة اللي كتناسبك واستفد من مميزات حصرية.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: 'الباقة العادية', price: 'مجانية', features: ['تصفح الإعلانات', 'تواصل مع الكسابة', 'استخدام الأدوات الأساسية'], isFree: true },
            { name: 'باقة VIP', price: '29 درهم/شهر', features: ['أولوية مشاهدة الإعلانات الجديدة', 'دعم فني خاص 24/7', 'تخفيضات حصرية على خدمات النقل', 'تنبيهات فورية لأفضل العروض'], active: true },
          ].filter(plan => !settings.paymentSystemEnabled || !plan.isFree).map((plan, i) => (
            <div key={i} className={`bg-surface p-8 rounded-3xl border shadow-sm flex flex-col justify-between hover:border-primary/50 transition-all ${plan.active ? 'border-2 border-primary shadow-xl relative overflow-hidden group' : 'border-outline-variant/30'}`}>
              {plan.active && <div className="absolute top-0 right-0 bg-primary text-on-primary px-4 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-wider">الأكثر طلباً</div>}
              <div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${plan.active ? 'bg-primary/10 text-primary group-hover:scale-110 transition-transform' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  {plan.active ? <ShieldCheck className="w-6 h-6" /> : <User className="w-6 h-6" />}
                </div>
                <h4 className="text-xl font-black text-on-surface mb-2">{plan.name}</h4>
                <p className="text-3xl font-black text-primary mb-6">{plan.price}</p>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-on-surface-variant">
                      <BadgeCheck className="w-4 h-4 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button className={`w-full py-3 rounded-xl font-bold transition-all ${plan.active ? 'bg-primary text-on-primary font-black hover:bg-primary/90 shadow-lg shadow-primary/20' : 'bg-surface-container-high text-on-surface cursor-default'}`}>
                {plan.active ? 'اشترك دابا' : 'باقتك الحالية'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFavorites = () => {
    const allListings = [...listings, ...announcements];
    const favoriteListings = allListings.filter(l => favorites.some(f => f.listingId === (l.id || l.listingId)?.toString()));

    return (
      <div className="flex-1 overflow-y-auto p-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-on-surface font-headline mb-2">المفضلة ديالك</h2>
          <p className="text-on-surface-variant mb-8 text-lg">هنا غاتلقى كاع الحوالا اللي عجبوك وبغيتي ترجع ليهم من بعد.</p>
          
          {favoriteListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteListings.map((listing) => (
                <div key={listing.id} className="bg-surface rounded-3xl overflow-hidden border border-outline-variant/20 hover:shadow-xl transition-all group cursor-pointer" onClick={() => onNavigate('listing-details', listing.id || listing.listingId)}>
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img src={listing.image || listing.imageUrl || "https://picsum.photos/seed/sheep/400/300"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={listing.title} referrerPolicy="no-referrer" />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite((listing.id || listing.listingId).toString());
                      }}
                      className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-error shadow-lg z-10"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-[#1A1A1A] px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 cursor-pointer hover:bg-white transition-colors" onClick={(e) => {
                      e.stopPropagation();
                      const url = listing.coordinates 
                        ? `https://www.google.com/maps/dir/?api=1&destination=${listing.coordinates.lat},${listing.coordinates.lng}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.location || listing.city || '')}`;
                      window.open(url, '_blank');
                    }}>
                      <MapPin className="w-3 h-3 text-[#2E7D32]" />
                      <span>
                        {(() => {
                          const dist = listing.calculatedDistance || listing.distance || 0;
                          const city = getDisplayCity(listing);
                          
                          if (dist === 0 || dist >= 999) return city;
                          if (dist < 5) return `${city} (قريب ليك)`;
                          if (dist < 25) return `${city} (على بعد ${Math.round(dist)} كلم)`;
                          if (dist < 80) return `${city} (بعيد شوية، ${Math.round(dist)} كلم)`;
                          return `${city} (بعيد)`;
                        })()}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded-lg">{listing.breed || listing.category || (listing.races && listing.races[0]) || 'سردي'}</span>
                      {renderStars(listing.rating || 5)}
                    </div>
                    <h3 className="font-bold text-on-surface mb-2">{listing.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <MapPin className="w-4 h-4" />
                      <span>{listing.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface rounded-3xl border-2 border-dashed border-outline-variant/30">
              <Heart className="w-16 h-16 text-on-surface-variant/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-on-surface">ما عندك حتى إعلان فالمفضلة</h3>
              <p className="text-on-surface-variant mt-2">قلب فالخريطة ولا فاللائحة وضيف الحوالا اللي عجبوك</p>
              <button 
                onClick={() => setActiveView('map-search')}
                className="mt-6 text-primary font-bold hover:underline"
              >
                بدا البحث من هنا
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAccount = () => {
    const renderSettingsView = () => {
      switch (activeAccountTab) {
        case 'notifications':
          return (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
              <button onClick={() => setActiveAccountTab('profile')} className="flex items-center gap-2 text-primary font-bold mb-4">
                <ArrowLeft className="w-4 h-4" />
                <span>الرجوع</span>
              </button>
              <h3 className="text-xl font-black text-on-surface mb-6">إعدادات التنبيهات</h3>
              <div className="space-y-4">
                {[
                  { label: 'تنبيهات العروض الجديدة', desc: 'توصل بإشعار فاش شي كساب يصيفط ليك عرض' },
                  { label: 'تنبيهات الرسائل', desc: 'إشعارات فاش يجاوبك شي كساب' },
                  { label: 'تنبيهات التطبيق', desc: 'إشعارات حول التحديثات والعروض الخاصة' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                    <div>
                      <p className="font-bold text-on-surface">{item.label}</p>
                      <p className="text-xs text-on-surface-variant">{item.desc}</p>
                    </div>
                    <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-on-primary rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        case 'security':
          return (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
              <button onClick={() => setActiveAccountTab('profile')} className="flex items-center gap-2 text-primary font-bold mb-4">
                <ArrowLeft className="w-4 h-4" />
                <span>الرجوع</span>
              </button>
              <h3 className="text-xl font-black text-on-surface mb-6">الأمان والخصوصية</h3>
              <div className="space-y-4">
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 space-y-4">
                  <p className="font-bold text-on-surface">تغيير كلمة السر</p>
                  <input type="password" placeholder="كلمة السر الحالية" className="w-full p-3 bg-surface border border-outline-variant/20 rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                  <input type="password" placeholder="كلمة السر الجديدة" className="w-full p-3 bg-surface border border-outline-variant/20 rounded-xl outline-none focus:ring-2 focus:ring-primary" />
                  <button className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold">تحديث كلمة السر</button>
                </div>
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-on-surface">التحقق بخطوتين</p>
                    <p className="text-xs text-on-surface-variant">زيادة أمان حسابك</p>
                  </div>
                  <div className="w-12 h-6 bg-surface-container-high rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-on-surface-variant rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        case 'settings':
          return (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
              <button onClick={() => setActiveAccountTab('profile')} className="flex items-center gap-2 text-primary font-bold mb-4">
                <ArrowLeft className="w-4 h-4" />
                <span>الرجوع</span>
              </button>
              <h3 className="text-xl font-black text-on-surface mb-6">إعدادات التطبيق</h3>
              <div className="space-y-4">
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                  <p className="font-bold text-on-surface mb-3">اللغة</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="py-2 bg-primary text-on-primary rounded-lg font-bold">العربية</button>
                    <button className="py-2 bg-surface-container-high text-on-surface rounded-lg font-bold">Français</button>
                  </div>
                </div>
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                  <p className="font-bold text-on-surface mb-3">المظهر</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="py-2 bg-primary text-on-primary rounded-lg font-bold text-xs">فاتح</button>
                    <button className="py-2 bg-surface-container-high text-on-surface rounded-lg font-bold text-xs">داكن</button>
                    <button className="py-2 bg-surface-container-high text-on-surface rounded-lg font-bold text-xs">تلقائي</button>
                  </div>
                </div>
              </div>
            </div>
          );
        case 'payment':
          return (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
              <button onClick={() => setActiveAccountTab('profile')} className="flex items-center gap-2 text-primary font-bold mb-4">
                <ArrowLeft className="w-4 h-4" />
                <span>الرجوع</span>
              </button>
              <h3 className="text-xl font-black text-on-surface mb-6">طريقة الدفع</h3>
              <div className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant">رقم البطاقة</label>
                    <div className="relative">
                      <input type="text" placeholder="**** **** **** ****" className="w-full p-4 bg-surface border border-outline-variant/20 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-mono" />
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-on-surface-variant">تاريخ الانتهاء</label>
                      <input type="text" placeholder="MM/YY" className="w-full p-4 bg-surface border border-outline-variant/20 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-mono" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-on-surface-variant">CVV</label>
                      <input type="text" placeholder="***" className="w-full p-4 bg-surface border border-outline-variant/20 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-mono" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-on-surface-variant leading-relaxed">المعلومات ديالك محمية ومشفرة. هاد البطاقة غادي تستعمل للاشتراكات التلقائية.</p>
                </div>
                <button className="w-full py-4 bg-primary text-on-primary rounded-2xl font-black shadow-lg shadow-primary/20">حفظ البطاقة</button>
              </div>
            </div>
          );
        default:
          return (
            <>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black text-on-surface font-headline">{profile?.displayName || 'أحمد المشتري'}</h2>
                  <p className="text-on-surface-variant">عضو منذ مارس 2026</p>
                </div>
                <button 
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="px-6 py-2 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-variant transition-colors"
                >
                  {isEditingProfile ? 'إلغاء' : 'تعديل الحساب'}
                </button>
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6 animate-in fade-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-on-surface-variant">الاسم الكامل</label>
                      <input 
                        type="text" 
                        value={profileData.displayName}
                        onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                        className="w-full p-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-on-surface-variant">رقم الهاتف</label>
                      <input 
                        type="tel" 
                        value={profileData.phoneNumber}
                        onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                        className="w-full p-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-primary outline-none"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-on-surface-variant">المدينة</label>
                      <select 
                        value={profileData.location}
                        onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                        className="w-full p-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="">اختار المدينة</option>
                        {cities.map(city => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-primary text-on-primary rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                  >
                    حفظ التغييرات
                  </button>
                </form>
              ) : (
                <>
                  {settings.paymentSystemEnabled && (
                    <div className="grid grid-cols-1 gap-4 mb-8">
                      <button 
                        onClick={() => setActiveAccountTab('payment')}
                        className="p-4 bg-surface-container-low rounded-2xl flex items-center justify-between hover:bg-surface-container-high transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CreditCard className="w-6 h-6" />
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-on-surface-variant">طريقة الدفع</p>
                            <p className="font-bold">بطاقة بنكية (**** 4242)</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-outline-variant" />
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="font-bold text-on-surface mb-4">الإعدادات</h3>
                    {[
                      { icon: Bell, label: 'التنبيهات', desc: 'تحكم فاشنو كيوصلك', tab: 'notifications' },
                      { icon: ShieldCheck, label: 'الأمان والخصوصية', desc: 'كلمة السر والمعلومات الشخصية', tab: 'security' },
                      { icon: Settings, label: 'إعدادات التطبيق', desc: 'اللغة والمظهر', tab: 'settings' },
                    ].map((item, i) => (
                      <button 
                        key={i} 
                        onClick={() => setActiveAccountTab(item.tab as any)}
                        className="w-full p-4 flex items-center justify-between hover:bg-surface-container-low rounded-2xl transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-on-surface">{item.label}</p>
                            <p className="text-xs text-on-surface-variant">{item.desc}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-outline-variant" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          );
      }
    };

    return (
      <div className="flex-1 overflow-y-auto p-8" dir="rtl">
        <div className="max-w-3xl mx-auto">
          <div className="bg-surface rounded-[2rem] border border-outline-variant/20 overflow-hidden shadow-sm">
            <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 relative">
              <div className="absolute -bottom-12 right-8">
                <div className="w-24 h-24 rounded-3xl bg-surface border-4 border-surface shadow-xl overflow-hidden relative group">
                  <img src={profile?.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file && user) {
                          // In a real app, upload to storage. For now, use local URL or base64
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const compressed = await compressImage(reader.result as string, 400, 400, 0.7);
                            await firestoreService.updateProfile({ photoURL: compressed });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-16 p-8">
              {renderSettingsView()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex overflow-hidden bg-surface-container-low" dir="rtl">
      {/* Sidebar - Desktop */}
      <aside className="w-20 lg:w-64 bg-surface border-l border-outline-variant/20 flex flex-col justify-between hidden md:flex z-20">
        <div>
          <div className="h-24 flex flex-col items-center justify-center border-b border-outline-variant/20 gap-2 shrink-0">
            <button onClick={() => onNavigate('home')} className="flex items-center group">
              <img 
                src="https://i.ibb.co/Psdn5FfW/logo-removebg-preview.png" 
                alt="كسابكوم" 
                className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${activeView === 'dashboard' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              <LayoutDashboard className="w-6 h-6" />
              <span className="hidden lg:block">لوحة التحكم</span>
            </button>
            <button 
              onClick={() => setActiveView('kessaba-offers')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold border border-transparent transition-colors ${activeView === 'kessaba-offers' ? 'bg-primary-container text-on-primary-container border-primary' : 'text-on-surface-variant hover:bg-white hover:text-primary hover:border-primary'}`}
            >
              <ShoppingBag className="w-6 h-6" />
              <span className="hidden lg:block">فتح المزاد</span>
              <span className="hidden lg:flex mr-auto bg-primary text-on-primary text-[10px] w-5 h-5 items-center justify-center rounded-full">{kessabaRequests.filter(r => r.status !== 'Archived').length}</span>
            </button>
            <button 
              onClick={() => setActiveView('favorites')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold border border-transparent transition-colors ${activeView === 'favorites' ? 'bg-primary-container text-on-primary-container border-primary' : 'text-on-surface-variant hover:bg-white hover:text-primary hover:border-primary'}`}
            >
              <Heart className="w-6 h-6" />
              <span className="hidden lg:block">المفضلة</span>
              <span className="hidden lg:flex mr-auto bg-primary text-on-primary text-xs w-5 h-5 items-center justify-center rounded-full">{favorites.length}</span>
            </button>
            <button 
              onClick={() => setActiveView('tools')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold border border-transparent transition-colors ${activeView === 'tools' ? 'bg-primary-container text-on-primary-container border-primary' : 'text-on-surface-variant hover:bg-white hover:text-primary hover:border-primary'}`}
            >
              <SlidersHorizontal className="w-6 h-6" />
              <span className="hidden lg:block">الأدوات</span>
            </button>
            {settings.paymentSystemEnabled && (
              <button 
                onClick={() => setActiveView('subscription')}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold border border-transparent transition-colors ${activeView === 'subscription' ? 'bg-primary-container text-on-primary-container border-primary' : 'text-on-surface-variant hover:bg-white hover:text-primary hover:border-primary'}`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="hidden lg:block">اشتراك</span>
              </button>
            )}
            <button 
              onClick={() => setActiveView('account')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold border border-transparent transition-colors ${activeView === 'account' ? 'bg-primary-container text-on-primary-container border-primary' : 'text-on-surface-variant hover:bg-white hover:text-primary hover:border-primary'}`}
            >
              <User className="w-6 h-6" />
              <span className="hidden lg:block">حسابي</span>
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-outline-variant/20 space-y-2">
          {settings.solidarityDonationEnabled && (
            <button 
              onClick={() => setActiveView('request-animal')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold border border-transparent transition-colors ${activeView === 'request-animal' ? 'bg-primary/10 text-primary border-primary' : 'text-primary hover:bg-white hover:border-primary'}`}
            >
              <HeartHandshake className="w-5 h-5" />
              <span className="hidden lg:block">تبرع تضامني</span>
            </button>
          )}
          <button onClick={handleLogout} className="w-full p-4 flex items-center gap-4 text-error font-bold border border-transparent hover:bg-white hover:border-error transition-colors rounded-2xl">
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden pb-20 md:pb-0">
        {/* Top Header */}
        <DashboardHeader 
          title={getTitle()} 
          subtitle={activeView === 'dashboard' ? (() => {
            const rawCity = (profile?.location || 'الدار البيضاء').split(' ')[0];
            return cityMapping[rawCity.toLowerCase()] || rawCity;
          })() : undefined}
          location={activeView === 'dashboard' ? (() => {
            const rawCity = (profile?.location || 'الدار البيضاء').split(' ')[0];
            return cityMapping[rawCity.toLowerCase()] || rawCity;
          })() : undefined}
          showSearch={true}
          onSearch={(city, distance) => {
            setCitySearch(city);
            onNavigate('search-results', undefined, city, distance);
          }}
          onNavigate={onNavigate}
        />

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTool ? renderTools() : (
            <>
              {activeView === 'dashboard' && renderDashboard()}
              {activeView === 'kessaba-offers' && (
                <KessabaOffersView 
                  kessabaRequests={kessabaRequests}
                  setKessabaRequests={setKessabaRequests}
                  showNewRequestForm={showNewRequestForm}
                  setShowNewRequestForm={setShowNewRequestForm}
                  selectedKessabaRequest={selectedKessabaRequest}
                  setSelectedKessabaRequest={setSelectedKessabaRequest}
                />
              )}
              {activeView === 'favorites' && renderFavorites()}
              {activeView === 'tools' && renderTools()}
              {activeView === 'subscription' && renderSubscription()}
              {activeView === 'account' && renderAccount()}
              {activeView === 'request-animal' && (
                <RequestAnimalView setActiveView={setActiveView} />
              )}
            </>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant/20 flex items-center justify-between px-2 pb-safe pt-2 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
        <button 
          onClick={() => setActiveView('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors border border-transparent ${activeView === 'dashboard' ? 'text-primary bg-primary/5 border-primary' : 'text-on-surface-variant hover:text-primary hover:border-primary'}`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeView === 'dashboard' && 'fill-primary/20'}`} />
          <span className="text-[10px] font-bold">الرئيسية</span>
        </button>
        <button 
          onClick={() => setActiveView('kessaba-offers')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors relative border border-transparent ${activeView === 'kessaba-offers' ? 'text-primary bg-primary/5 border-primary' : 'text-on-surface-variant hover:text-primary hover:border-primary'}`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 ${activeView === 'kessaba-offers' && 'fill-primary/20'}`} />
            {kessabaRequests.filter(r => r.status !== 'Archived').length > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-primary text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">
                {kessabaRequests.filter(r => r.status !== 'Archived').length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">المزاد</span>
        </button>
        <button 
          onClick={() => setActiveView('favorites')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors relative border border-transparent ${activeView === 'favorites' ? 'text-primary bg-primary/5 border-primary' : 'text-on-surface-variant hover:text-primary hover:border-primary'}`}
        >
          <div className="relative">
             <Heart className={`w-5 h-5 ${activeView === 'favorites' && 'fill-primary/20'}`} />
             {favorites.length > 0 && (
               <span className="absolute -top-1 -right-1.5 bg-primary text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">
                 {favorites.length}
               </span>
             )}
          </div>
          <span className="text-[10px] font-bold">المفضلة</span>
        </button>
        <button 
          onClick={() => setActiveView('account')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors border border-transparent ${activeView === 'account' ? 'text-primary bg-primary/5 border-primary' : 'text-on-surface-variant hover:text-primary hover:border-primary'}`}
        >
          <User className={`w-5 h-5 ${activeView === 'account' && 'fill-primary/20'}`} />
          <span className="text-[10px] font-bold">حسابي</span>
        </button>
      </nav>
    </div>
  );
}
