import React, { useState, useEffect } from 'react';
import { ViewType } from '../App';
import { 
  LayoutDashboard, Tag, BarChart3, CreditCard, Settings, PlusCircle, 
  Bell, User, MapPin, Eye, MessageCircle, Phone, ArrowLeft, 
  TrendingUp, Star, ShieldCheck, LogOut, ChevronRight, CheckCircle2, AlertCircle,
  Clock, DollarSign, Users, ShoppingBag, Camera, Heart, Calculator, HeartHandshake, Mic, Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSettings } from '../hooks/useSettings';
import { compressImage, checkPayloadSize } from '../lib/imageUtils';
import DashboardHeader from '../components/DashboardHeader';
import { cityMapping, getDisplayCity } from '../constants/cityMapping';

const moroccanCities = [
  "الدار البيضاء", "الرباط", "فاس", "مراكش", "أكادير", "طنجة", "مكناس", "وجدة", "القنيطرة", "تطوان", "خريبكة", "بني ملال", "الجديدة", "آسفي", "سطات", "برشيد", "الخميسات", "الناظور", "تازة", "المحمدية"
];

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
  activeSubView?: string;
}

type SellerTab = 'dashboard' | 'flock' | 'stats' | 'subscription' | 'settings' | 'buyer-requests' | 'donations';

interface DonationsViewProps {
  onBack: () => void;
}

function DonationsView({ onBack }: DonationsViewProps) {
  const { user } = useAuth();
  const [sheepCount, setSheepCount] = useState('1');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      // For now, we'll store donations in a separate collection or as a special offer
      await firestoreService.createOffer({
        sellerId: user.uid,
        type: 'donation',
        sheepCount: parseInt(sheepCount),
        description,
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
          <p className="text-[#4A4A4A] font-medium mb-8">شكرا لك على كرمك يا كساب. التبرع ديالك غادي يوصل للناس لي محتاجين وغادي نتواصلو معاك لتنسيق عملية التسليم.</p>
          <button 
            onClick={() => { setSubmitted(false); onBack(); }} 
            className="w-full bg-[#2E7D32] text-white py-4 rounded-xl font-bold border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors"
          >
            الرجوع للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-on-surface font-headline">تبرع تضامني (Don Solidarité)</h2>
          <p className="text-on-surface-variant">ساهم في إدخال الفرحة على الأسر المعوزة. حدد عدد الأكباش لي بغيتي تبرع بيهم من القطيع ديالك.</p>
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
                  placeholder="مثلا: عندي أكباش واجدين للتبرع، بغيتهم يمشيو لدار الأيتام..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <MessageCircle className="absolute right-4 top-4 text-[#757575] w-5 h-5" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-16 bg-[#2E7D32] text-white font-black text-xl rounded-xl shadow-lg border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'تأكيد التبرع'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function BuyerRequestsView({ requests }: { requests: any[] }) {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [offerSent, setOfferSent] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellerLocation, setSellerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [displayRequests, setDisplayRequests] = useState<any[]>([]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      setSellerLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
    });
  }, []);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  useEffect(() => {
    if (sellerLocation) {
      setDisplayRequests(requests.filter(req => {
        if (!req.lat || !req.lng) return true; // Keep if location not set
        const distance = calculateDistance(sellerLocation.lat, sellerLocation.lng, req.lat, req.lng);
        return distance <= 100; // Expanded range for better visibility
      }));
    } else {
      setDisplayRequests(requests);
    }
  }, [requests, sellerLocation]);

  const [existingOffer, setExistingOffer] = useState<any | null>(null);

  useEffect(() => {
    if (!user || !selectedRequest) return;
    const requestId = typeof selectedRequest === 'string' ? selectedRequest : selectedRequest.id;

    let isMounted = true;
    const fetchExistingOffer = async () => {
      try {
        const offersForReq = await firestoreService.getOffersForRequest(requestId);
        if (isMounted) {
          const myOffer = offersForReq.find((o: any) => o.sellerId === user.uid);
          setExistingOffer(myOffer || null);
        }
      } catch (e) {
        console.warn('Error fetching own offer:', e);
      }
    };

    fetchExistingOffer();
    return () => { isMounted = false; };
  }, [user, selectedRequest]);

  const handleDeleteOffer = async () => {
    if (!existingOffer || !selectedRequest) return;
    const requestId = typeof selectedRequest === 'string' ? selectedRequest : selectedRequest.id;
    setIsSubmitting(true);
    try {
      await firestoreService.deleteOffer(existingOffer.id);
      setExistingOffer(null);
    } catch (error) {
      console.error("Failed to delete offer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRequest || existingOffer) return;

    // Validation
    const newErrors: { [key: string]: string } = {};
    if (!offerDesc || offerDesc.length < 10) {
      newErrors.description = "عفاك دخل وصف كافي (على الأقل 10 حروف)";
    }
    
    // Media validation
    if (imageFile && imageFile.size > 2 * 1024 * 1024) {
      newErrors.image = "الصورة كبيرة بزاف (أقصى حد 2MB)";
    }
    if (videoFile && videoFile.size > 3 * 1024 * 1024) {
      newErrors.video = "الفيديو كبير بزاف (أقصى حد 3MB)";
    }
    if (audioFile && audioFile.size > 1 * 1024 * 1024) {
      newErrors.audio = "الملف الصوتي كبير بزاف (أقصى حد 1MB)";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const request = typeof selectedRequest === 'string' ? requests.find(r => r.id === selectedRequest) : selectedRequest;
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

      if (videoFile) {
        videoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(videoFile);
        });
      }

      if (audioFile) {
        audioUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(audioFile);
        });
      }

      const offerData = {
        sellerId: user.uid,
        requestId: request.id,
        price: request.budget, // Use request budget as price
        description: offerDesc,
        buyerId: request.buyerId,
        hasAudio: !!audioFile || isRecording,
        hasImage: !!imageFile,
        hasVideo: !!videoFile,
        imageUrl,
        videoUrl,
        audioUrl,
      };

      if (!checkPayloadSize(offerData)) {
        alert("حجم الملفات (الصور أو الفيديو) كبير بزاف. حاول تنقص من الجودة أو تختار فيديوهات قصيرة.");
        setIsSubmitting(false);
        return;
      }

      await firestoreService.createOffer(offerData);
      setOfferSent(true);
    } catch (error) {
      console.error("Failed to send offer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (offerSent) {
    return (
      <div className="flex-1 flex items-center justify-center p-8" dir="rtl">
        <div className="max-w-md w-full bg-surface rounded-3xl p-10 shadow-xl text-center border border-primary/10">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl font-black text-on-surface mb-4 font-headline">تم إرسال عرضك!</h2>
          <p className="text-on-surface-variant font-medium mb-8">المشتري غادي يشوف العرض ديالك (الفيديو والصور) وغادي يتواصل معاك يلا عجبو الحال.</p>
          <button 
            onClick={() => { setOfferSent(false); setSelectedRequest(null); }} 
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold border border-transparent hover:bg-on-primary hover:text-primary hover:border-primary transition-colors"
          >
            الرجوع للطلبات
          </button>
        </div>
      </div>
    );
  }

  if (selectedRequest !== null && typeof selectedRequest === 'object') {
    const request = selectedRequest as any;
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setSelectedRequest(null)} className="flex items-center gap-2 text-primary font-bold mb-6 hover:gap-3 transition-all">
            <ArrowLeft className="w-5 h-5" />
            <span>رجوع للطلبات</span>
          </button>

          <div className="bg-surface rounded-3xl p-8 border border-outline-variant/20 shadow-xl space-y-6">
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
              <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                <p className="text-xs font-bold text-on-surface-variant mb-1">السلالة</p>
                <p className="font-black text-primary">{request.breed}</p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                <p className="text-xs font-bold text-on-surface-variant mb-1">الميزانية</p>
                <p className="font-black text-primary">{request.budget} درهم</p>
              </div>
            </div>

            <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/10">
              <p className="text-xs font-bold text-on-surface-variant mb-2">الوصف</p>
              <p className="text-on-surface leading-relaxed italic">"{request.description}"</p>
            </div>

            <div className="flex flex-wrap gap-4">
              {request.imageUrl && (
                <div className="w-full h-64 rounded-2xl overflow-hidden border border-outline-variant/20">
                  <img src={request.imageUrl} alt="Request" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
              {request.videoUrl && (
                <div className="w-full h-64 rounded-2xl overflow-hidden border border-outline-variant/20 bg-black">
                  <video src={request.videoUrl} controls className="w-full h-full" />
                </div>
              )}
              {request.audioUrl && (
                <div className="w-full p-3 bg-surface-container-high rounded-xl flex items-center gap-3">
                  <Mic className="w-5 h-5 text-primary" />
                  <audio src={request.audioUrl} controls className="h-8 flex-1" />
                </div>
              )}
            </div>

            <button 
              onClick={() => setSelectedRequest(request.id)}
              disabled={request.offersCount === 6}
              className={`w-full py-4 rounded-xl font-black text-lg border border-transparent transition-colors ${request.offersCount === 6 ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed' : 'bg-primary text-on-primary hover:bg-on-primary hover:text-primary hover:border-primary shadow-lg shadow-primary/20'}`}
            >
              {request.offersCount === 6 ? 'العروض مكتملة' : 'تقديم عرض دابا'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedRequest !== null && typeof selectedRequest === 'string') {
    const request = requests.find(r => r.id === selectedRequest);
    const isClosed = request?.offers === 6;

    if (isClosed) {
      return (
        <div className="flex-1 flex items-center justify-center p-8" dir="rtl">
          <div className="max-w-md w-full bg-surface rounded-3xl p-10 shadow-xl text-center border border-error/10">
            <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-12 h-12 text-error" />
            </div>
            <h2 className="text-3xl font-black text-on-surface mb-4 font-headline">الصفقة مغلقة!</h2>
            <p className="text-on-surface-variant font-medium mb-8">هاد الطلب وصل للحد الأقصى ديال العروض (6 عروض). تقدر تشوف طلبات أخرى.</p>
            <button 
              onClick={() => setSelectedRequest(null)} 
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold border border-transparent hover:bg-on-primary hover:text-primary hover:border-primary transition-colors"
            >
              الرجوع للطلبات
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setSelectedRequest(null)} className="flex items-center gap-2 text-primary font-bold mb-6 hover:gap-3 transition-all">
            <ArrowLeft className="w-5 h-5" />
            <span>رجوع للطلبات</span>
          </button>

          <div className="bg-surface rounded-3xl p-8 border border-outline-variant/20 shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-on-surface font-headline">تقديم عرض لـ {request?.buyerName || 'مشتري'}</h3>
                <p className="text-on-surface-variant">السلالة المطلوبة: <span className="text-primary font-bold">{request?.breed}</span></p>
              </div>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                {request?.offersCount || 0}/6 عروض
              </div>
            </div>

            {existingOffer ? (
              <div className="space-y-6">
                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20 text-center">
                  <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h4 className="text-xl font-black text-on-surface mb-2">لقد أرسلت عرضك بالفعل!</h4>
                  <p className="text-on-surface-variant text-sm mb-6">يمكنك مراجعة تفاصيل عرضك أسفله أو حذفه لإرسال عرض جديد.</p>
                  
                  <div className="text-right space-y-4 bg-surface p-4 rounded-xl border border-outline-variant/10">
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant">وصف العرض:</p>
                      <p className="text-sm italic">"{existingOffer.description}"</p>
                    </div>
                    <div className="flex gap-4">
                      {existingOffer.hasImage && <div className="px-2 py-1 bg-surface-container-high rounded text-[10px] font-bold">صورة متوفرة</div>}
                      {existingOffer.hasVideo && <div className="px-2 py-1 bg-surface-container-high rounded text-[10px] font-bold">فيديو متوفر</div>}
                      {existingOffer.hasAudio && <div className="px-2 py-1 bg-surface-container-high rounded text-[10px] font-bold">صوت متوفر</div>}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleDeleteOffer}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-error/10 text-error rounded-xl font-bold border border-transparent hover:bg-white hover:text-error hover:border-error transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <LogOut className="w-5 h-5" />
                      <span>حذف العرض وإرسال واحد جديد</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSendOffer}>
                <div className="p-4 bg-surface-container-low rounded-2xl mb-4 border border-outline-variant/20">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-on-surface-variant">ميزانية المشتري:</p>
                    <p className="text-lg font-black text-primary">{request?.budget} درهم</p>
                  </div>
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed italic">"{request?.description}"</p>
                  
                  <div className="flex flex-wrap gap-3 mt-4">
                    {request?.imageUrl && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-outline-variant/30">
                        <img src={request.imageUrl} alt="Request" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    {request?.videoUrl && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-outline-variant/30 bg-black flex items-center justify-center">
                        <video src={request.videoUrl} className="w-full h-full object-cover" />
                      </div>
                    )}
                    {request?.audioUrl && (
                      <div className="w-full p-2 bg-surface-container-high rounded-lg flex items-center gap-2">
                        <Mic className="w-4 h-4 text-primary" />
                        <audio src={request.audioUrl} controls className="h-6 flex-1" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-4">
                    {request?.hasVideo && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-lg">
                        <Camera className="w-3 h-3" />
                        <span>فيديو متوفر</span>
                      </div>
                    )}
                    {request?.hasAudio && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                        <Mic className="w-3 h-3" />
                        <span>تسجيل صوتي</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    <span>صورة الحولي</span>
                  </label>
                  <div className="relative group">
                    {imageFile ? (
                      <div className="relative p-4 rounded-2xl border-2 border-primary bg-primary/5 flex flex-col items-center justify-center gap-1">
                        <Camera className="w-6 h-6 text-primary" />
                        <span className="text-[10px] font-bold truncate max-w-full text-primary">
                          {imageFile.name}
                        </span>
                        <button 
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            if (errors.image) setErrors(prev => ({ ...prev, image: '' }));
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-20"
                        >
                          <LogOut className="w-3 h-3 rotate-45" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            setImageFile(e.target.files?.[0] || null);
                            if (errors.image) setErrors(prev => ({ ...prev, image: '' }));
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="p-4 rounded-2xl border-2 border-dashed border-outline-variant/30 bg-surface-container-low transition-all flex flex-col items-center justify-center gap-1 group-hover:border-primary/50">
                          <Camera className="w-6 h-6 text-on-surface-variant/40" />
                          <span className="text-[10px] font-bold text-on-surface-variant/60">إضافة صورة</span>
                        </div>
                      </>
                    )}
                  </div>
                  {errors.image && (
                    <p className="text-error text-[10px] font-bold flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-2 h-2" />
                      {errors.image}
                    </p>
                  )}
                </div>

                {/* Video Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>فيديو الحولي</span>
                  </label>
                  <div className="relative group">
                    {videoFile ? (
                      <div className="relative p-4 rounded-2xl border-2 border-primary bg-primary/5 flex flex-col items-center justify-center gap-1">
                        <PlusCircle className="w-6 h-6 text-primary" />
                        <span className="text-[10px] font-bold truncate max-w-full text-primary">
                          {videoFile.name}
                        </span>
                        <button 
                          type="button"
                          onClick={() => {
                            setVideoFile(null);
                            if (errors.video) setErrors(prev => ({ ...prev, video: '' }));
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-20"
                        >
                          <LogOut className="w-3 h-3 rotate-45" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input 
                          type="file" 
                          accept="video/*"
                          onChange={(e) => {
                            setVideoFile(e.target.files?.[0] || null);
                            if (errors.video) setErrors(prev => ({ ...prev, video: '' }));
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="p-4 rounded-2xl border-2 border-dashed border-outline-variant/30 bg-surface-container-low transition-all flex flex-col items-center justify-center gap-1 group-hover:border-primary/50">
                          <PlusCircle className="w-6 h-6 text-on-surface-variant/40" />
                          <span className="text-[10px] font-bold text-on-surface-variant/60">إضافة فيديو</span>
                        </div>
                      </>
                    )}
                  </div>
                  {errors.video && (
                    <p className="text-error text-[10px] font-bold flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-2 h-2" />
                      {errors.video}
                    </p>
                  )}
                </div>

                {/* Audio Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                    <Mic className="w-3 h-3" />
                    <span>تسجيل صوتي</span>
                  </label>
                  <div className="relative group">
                    {audioFile ? (
                      <div className="relative p-4 rounded-2xl border-2 border-primary bg-primary/5 flex flex-col items-center justify-center gap-1">
                        <Mic className="w-6 h-6 text-primary" />
                        <span className="text-[10px] font-bold truncate max-w-full text-primary">
                          {audioFile.name}
                        </span>
                        <button 
                          type="button"
                          onClick={() => {
                            setAudioFile(null);
                            if (errors.audio) setErrors(prev => ({ ...prev, audio: '' }));
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-20"
                        >
                          <LogOut className="w-3 h-3 rotate-45" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input 
                          type="file" 
                          accept="audio/*"
                          onChange={(e) => {
                            setAudioFile(e.target.files?.[0] || null);
                            if (errors.audio) setErrors(prev => ({ ...prev, audio: '' }));
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="p-4 rounded-2xl border-2 border-dashed border-outline-variant/30 bg-surface-container-low transition-all flex flex-col items-center justify-center gap-1 group-hover:border-primary/50">
                          <Mic className="w-6 h-6 text-on-surface-variant/40" />
                          <span className="text-[10px] font-bold text-on-surface-variant/60">إضافة صوت</span>
                        </div>
                      </>
                    )}
                  </div>
                  {errors.audio && (
                    <p className="text-error text-[10px] font-bold flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-2 h-2" />
                      {errors.audio}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface-variant mr-1">وصف العرض ديالك</label>
                <textarea 
                  className={`w-full p-4 bg-surface-container-low border ${errors.description ? 'border-error ring-1 ring-error' : 'border-outline-variant/20'} rounded-xl focus:ring-2 focus:ring-primary outline-none min-h-[100px]`} 
                  placeholder="مثلا: عندي ليك حولي سردي مليح، واكل مزيان، الثمن مناسب..." 
                  value={offerDesc}
                  onChange={(e) => {
                    setOfferDesc(e.target.value);
                    if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                  }}
                />
                {errors.description && (
                  <p className="text-error text-xs font-bold flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.description}
                  </p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-16 bg-primary text-on-primary font-black text-xl rounded-xl shadow-lg border border-transparent hover:bg-on-primary hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'إرسال العرض'}
              </button>
            </form>
          )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex justify-between items-center bg-primary/5 p-4 rounded-2xl border border-primary/10">
        <h2 className="text-2xl font-black text-on-surface font-headline">طلبات المشترين</h2>
        <div className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
          <ShoppingBag className="w-4 h-4" />
          <span>{displayRequests.length} طلبات قريبة</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayRequests.map((request) => (
          <div key={request.id} className="bg-surface rounded-3xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group border-b-4 border-b-primary/20">
            <div className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary-container/30 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-on-surface">{request.title || request.buyerName || 'مشتري مهتم'}</h3>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant font-bold mt-1">
                      <MapPin className="w-3 h-3 text-primary" />
                      {(() => {
                        const rawCity = (request.location || 'غير محدد').split(' ')[0];
                        return cityMapping[rawCity.toLowerCase()] || rawCity;
                      })()}
                      <span className="mx-1">•</span>
                      <Clock className="w-3 h-3" /> 
                      {request.createdAt?.toDate ? request.createdAt.toDate().toLocaleDateString('ar-MA') : 'اليوم'}
                    </div>
                  </div>
                </div>
                <div className="text-left bg-surface-container px-3 py-2 rounded-xl border border-outline-variant/20">
                  <p className="text-lg font-black text-primary leading-none mb-1">{request.budget} درهم</p>
                  <p className="text-[10px] font-black text-on-surface-variant tracking-wider uppercase">{request.breed}</p>
                </div>
              </div>

              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 relative">
                <p className="text-sm text-on-surface-variant italic leading-relaxed">"{request.description}"</p>
                <div className="flex gap-2 mt-3 justify-end">
                   {request.hasVideo && <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Camera className="w-3.5 h-3.5" /></div>}
                   {request.hasAudio && <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg"><Mic className="w-3.5 h-3.5" /></div>}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-surface-container-high/50 border-t border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 rtl:space-x-reverse">
                   {[...Array(Math.min(3, request.offersCount || 0))].map((_, i) => (
                     <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-surface-variant flex items-center justify-center text-[8px] font-bold">
                       👤
                     </div>
                   ))}
                </div>
                <p className="text-[10px] font-bold text-on-surface-variant">
                  {request.offersCount || 0} عروض مقدمة
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedRequest(request)}
                  className="px-5 py-2.5 bg-white text-on-surface font-bold rounded-xl border border-outline-variant/40 hover:bg-white hover:text-primary hover:border-primary transition-colors text-sm shadow-sm"
                >
                  التفاصيل
                </button>
                <button 
                  onClick={() => setSelectedRequest(request)}
                  className={`px-5 py-2.5 rounded-xl font-bold transition-colors shadow-md text-sm ${request.offersCount >= 6 ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed' : 'bg-primary text-on-primary border border-transparent hover:bg-on-primary hover:text-primary hover:border-primary'}`}
                >
                  {request.offersCount >= 6 ? 'مكتمل' : 'تقديم عرض'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {displayRequests.length === 0 && (
          <div className="col-span-full py-20 text-center bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/50">
             <ShoppingBag className="w-16 h-16 text-outline-variant mx-auto mb-4 opacity-50" />
             <h3 className="text-xl font-bold text-on-surface mb-2">ماكاينش طلبات قريبة حاليا</h3>
             <p className="text-on-surface-variant max-w-xs mx-auto">كون هاني يا كساب، غير كونو طلبات جداد غادي يوصلك تنبيه.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SellerDashboard({ onNavigate, activeSubView }: Props) {
  const { user, profile, signOut } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<SellerTab>('dashboard');

  useEffect(() => {
    if (activeSubView) {
      setActiveTab(activeSubView as SellerTab);
    }
  }, [activeSubView]);
  const [selectedStat, setSelectedStat] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'today' | 'month'>('today');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchRequests = async () => {
      try {
        const reqs = await firestoreService.getOfferRequests();
        setRequests(reqs.filter((r: any) => r.status === 'Open'));
      } catch (error) {
        console.error("OfferRequests fetch error:", error);
      }
    };

    fetchRequests();
    const interval = setInterval(fetchRequests, 60000); // Polling every minute
    return () => clearInterval(interval);
  }, [user]);

  // Settings states
  const activeCount = announcements.filter(a => a.status === 'active').length;
  const totalViews = announcements.reduce((sum, a) => sum + (a.views || 0), 0);
  const totalCalls = announcements.reduce((sum, a) => sum + (a.calls || 0), 0);
  const totalMessages = announcements.reduce((sum, a) => sum + (a.messages || 0), 0);
  const totalLocationRequests = announcements.reduce((sum, a) => sum + (a.locationRequests || 0), 0);

  const [settingsName, setSettingsName] = useState('');
  const [settingsCity, setSettingsCity] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsWhatsapp, setSettingsWhatsapp] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setSettingsName(profile.displayName || profile.fullName || '');
      setSettingsCity(profile.location || 'سطات');
      setSettingsPhone(profile.phoneNumber || '');
      setSettingsWhatsapp(profile.whatsappNumber || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      await firestoreService.updateProfile({
        displayName: settingsName,
        location: settingsCity,
        phoneNumber: settingsPhone,
        whatsappNumber: settingsWhatsapp
      });
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return `مرحبا بك، ${profile?.displayName || 'سي محمد'}`;
      case 'flock': return 'القطيع ديالي';
      case 'stats': return 'الإحصائيات';
      case 'subscription': return 'الاشتراك';
      case 'settings': return 'الإعدادات';
      case 'buyer-requests': return 'طلبات المشترين';
      case 'donations': return 'تبرع تضامني';
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

  useEffect(() => {
    if (user) {
      const fetchListings = async () => {
        try {
          const sellerAnns = await firestoreService.getSellerListings(user.uid);
          setAnnouncements(sellerAnns);
        } catch (error) {
          console.warn('Announcements fetch error:', error);
        }
      };
      
      fetchListings();
      const interval = setInterval(fetchListings, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-outline-variant'}`} />
        ))}
      </div>
    );
  };

  const renderDashboard = () => (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-on-surface font-headline">نظرة عامة</h2>
          <p className="text-on-surface-variant text-sm">تتبع أداء الإعلانات والنشاط ديالك</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-high p-1 rounded-xl">
          <button 
            onClick={() => setActiveFilter('today')}
            className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all ${activeFilter === 'today' ? 'bg-[#0a5c1a] text-white' : 'text-on-surface-variant hover:bg-surface-variant'}`}
          >
            اليوم
          </button>
          <button 
            onClick={() => setActiveFilter('month')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeFilter === 'month' ? 'bg-[#0a5c1a] text-white' : 'text-on-surface-variant hover:bg-surface-variant'}`}
          >
            هاد الشهر
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <section className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {[
            { label: 'المشاهدات', value: totalViews.toLocaleString(), icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'الموقع', value: totalLocationRequests.toLocaleString(), icon: MapPin, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'اتصلوا', value: totalCalls.toLocaleString(), icon: Phone, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'النشطة', value: activeCount.toString(), icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-surface p-4 md:p-6 rounded-2xl border border-outline-variant/30 shadow-sm relative overflow-hidden flex flex-col items-center text-center">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-2 md:mb-4 ${stat.color}`}>
                <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <p className="text-[10px] md:text-xs text-on-surface-variant font-bold mb-0.5">{stat.label}</p>
              <p className="text-xl md:text-2xl font-black text-on-surface">{stat.value}</p>
            </div>
          ))}
        </div>



        <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[
              { name: 'السبت', views: 4000 },
              { name: 'الأحد', views: 3000 },
              { name: 'الاثنين', views: 2000 },
              { name: 'الثلاثاء', views: 2780 },
              { name: 'الأربعاء', views: 1890 },
              { name: 'الخميس', views: 2390 },
              { name: 'الجمعة', views: 3490 },
            ]}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2E7D32" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E3DE" />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="views" stroke="#2E7D32" fillOpacity={1} fill="url(#colorViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Active Listings */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-black text-on-surface font-headline">القطيع ديالك</h2>
          <button onClick={() => setActiveTab('flock')} className="text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all text-sm">
            <span>شوف كلشي</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {announcements.slice(0, 2).map((announcement) => (
            <div key={announcement.id} className="bg-surface rounded-2xl overflow-hidden border border-outline-variant/30 shadow-sm group">
              <div className="relative h-48 overflow-hidden">
                <img alt={announcement.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={announcement.images?.[0] || "https://i.ytimg.com/vi/RrkkshRUttw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD92lI4Kxe5liKSwWZaJuLAFopNeA"} referrerPolicy="no-referrer" />
                <div className="absolute top-3 right-3 bg-primary text-on-primary px-2 py-1 rounded-md text-xs font-bold shadow-sm">{announcement.status === 'active' ? 'نشط' : 'غير نشط'}</div>
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-[#1A1A1A] px-2 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 cursor-pointer hover:bg-white transition-colors" onClick={(e) => {
                  e.stopPropagation();
                  const url = announcement.coordinates 
                    ? `https://www.google.com/maps/dir/?api=1&destination=${announcement.coordinates.lat},${announcement.coordinates.lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(announcement.location || '')}`;
                  window.open(url, '_blank');
                }}>
                  <MapPin className="w-3 h-3 text-[#2E7D32]" />
                  <span>{getDisplayCity(announcement)}</span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-on-surface text-lg">{announcement.title}</h3>
                  {renderStars(5)}
                </div>
                <div className="flex items-center gap-4 text-sm text-on-surface-variant mb-4">
                  <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {announcement.views || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {announcement.messages || 0}</span>
                  <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {announcement.calls || 0}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      console.log("SellerDashboard: Navigating to edit listing:", announcement.id);
                      onNavigate('add-listing', announcement.id);
                    }}
                    className="flex-1 py-2 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-variant transition-colors text-sm"
                  >
                    تعديل
                  </button>
                  {settings.paymentSystemEnabled && (
                    <button className="flex-[1.5] py-2 bg-[#0a5c1a] text-white font-bold rounded-xl hover:bg-[#0a5c1a]/90 transition-colors text-sm flex items-center justify-center gap-2">
                      <span>ترويج الإعلان</span>
                      <TrendingUp className="w-4 h-4" />
                    </button>
                  )}
                    <button 
                      onClick={() => {
                        setListingToDelete(announcement.id);
                        setShowDeleteConfirm(true);
                      }}
                      className="px-4 py-2 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-colors text-sm"
                    >
                      حذف
                    </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Card */}
          <div onClick={() => onNavigate('add-listing')} className="bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center h-full min-h-[300px] cursor-pointer hover:bg-surface-variant/30 hover:border-primary/50 transition-all group">
            <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-on-surface text-lg">إضافة قطيع جديد</h3>
            <p className="text-sm text-on-surface-variant mt-1">صور وسجل فيديو</p>
          </div>
        </div>
      </section>
    </>
  );

  const renderFlock = () => {
    return (
      <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-on-surface font-headline">القطيع ديالي</h2>
        <button onClick={() => onNavigate('add-listing')} className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
          <PlusCircle className="w-5 h-5" />
          <span>إضافة قطيع جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-surface rounded-2xl overflow-hidden border border-outline-variant/30 shadow-sm group cursor-pointer" onClick={() => onNavigate('listing-details', announcement.id)}>
            <div className="relative h-48 overflow-hidden">
              <img alt={announcement.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={announcement.images?.[0] || "https://i.ytimg.com/vi/RrkkshRUttw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD92lI4Kxe5liKSwWZaJuLAFopNeA"} referrerPolicy="no-referrer" />
              <div className="absolute top-3 right-3 bg-primary text-on-primary px-2 py-1 rounded-md text-xs font-bold shadow-sm">{announcement.status === 'active' ? 'نشط' : 'غير نشط'}</div>
              <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-[#1A1A1A] px-2 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 cursor-pointer hover:bg-white transition-colors" onClick={(e) => {
                e.stopPropagation();
                const url = announcement.coordinates 
                  ? `https://www.google.com/maps/dir/?api=1&destination=${announcement.coordinates.lat},${announcement.coordinates.lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(announcement.location || '')}`;
                window.open(url, '_blank');
              }}>
                <MapPin className="w-3 h-3 text-[#2E7D32]" />
                <span>{getDisplayCity(announcement)}</span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-on-surface text-lg">{announcement.title}</h3>
                {renderStars(5)}
              </div>
              <div className="flex items-center gap-4 text-sm text-on-surface-variant mb-4">
                <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {announcement.views || 0}</span>
                <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {announcement.calls || 0}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {announcement.messages || 0}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    console.log("SellerDashboard (Flock): Navigating to edit listing:", announcement.id);
                    onNavigate('add-listing', announcement.id);
                  }}
                  className="flex-1 py-2 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-variant transition-colors text-sm"
                >
                  تعديل
                </button>
                {settings.paymentSystemEnabled && (
                  <button className="flex-[1.5] py-2 bg-[#0a5c1a] text-white font-bold rounded-xl hover:bg-[#0a5c1a]/90 transition-colors text-sm flex items-center justify-center gap-2">
                    <span>ترويج الإعلان</span>
                    <TrendingUp className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => {
                    setListingToDelete(announcement.id);
                    setShowDeleteConfirm(true);
                  }}
                  className="px-4 py-2 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-colors text-sm"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-on-surface-variant mb-6">واش بصح بغيتي تمسح هاد الإعلان؟ هاد العملية ما يمكنش ترجع فيها.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setListingToDelete(null);
                }}
                className="flex-1 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-variant rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={async () => {
                  if (listingToDelete) {
                    await firestoreService.deleteAnnouncement(listingToDelete);
                    setShowDeleteConfirm(false);
                    setListingToDelete(null);
                  }
                }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; // Added closing brace

  const renderStats = () => {
    const stats = [
      { label: 'إجمالي المشاهدات', value: totalViews.toLocaleString(), icon: Eye, color: 'text-blue-600', data: [40, 65, 45, 90, 75, 55, Math.min(100, (totalViews / 100))] },
      { label: 'زبناء حددو الموقع ديالك', value: totalLocationRequests.toLocaleString(), icon: MapPin, color: 'text-green-600', data: [20, 35, 25, 50, 45, 30, Math.min(100, (totalLocationRequests / 10))] },
      { label: 'عدد الزبناء اللي اتصلوا بيك', value: totalCalls.toLocaleString(), icon: Phone, color: 'text-orange-600', data: [10, 15, 12, 25, 20, 15, Math.min(100, totalCalls)] },
      { label: 'الإعلانات النشطة', value: activeCount.toString(), icon: CheckCircle2, color: 'text-purple-600', data: [activeCount, activeCount, activeCount, activeCount, activeCount, activeCount, activeCount] },
    ];

    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-black text-on-surface font-headline">الإحصائيات</h2>
        
        {/* Mobile Stats Tabs */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-2 snap-x no-scrollbar">
          {stats.map((stat, i) => (
            <button
              key={i}
              onClick={() => setSelectedStat(i)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all snap-start border ${
                selectedStat === i 
                ? 'bg-primary text-white border-primary shadow-md shadow-primary/10' 
                : 'bg-white text-on-surface-variant border-outline-variant/30'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <stat.icon className={`w-3.5 h-3.5 ${selectedStat === i ? 'text-white' : stat.color}`} />
                <span>{stat.label.replace('إجمالي ', '')}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="hidden md:grid md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <button 
              key={i} 
              onClick={() => setSelectedStat(i)}
              className={`bg-surface p-6 rounded-2xl border transition-all text-right group ${selectedStat === i ? 'border-primary ring-2 ring-primary/10 shadow-md' : 'border-outline-variant/30 shadow-sm hover:border-primary/50'}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-xs text-on-surface-variant font-bold mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-on-surface">{stat.value}</p>
            </button>
          ))}
        </div>

        <div className="bg-surface rounded-3xl border border-outline-variant/30 p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-on-surface">تطور {stats[selectedStat].label}</h3>
            <div className={`px-3 py-1 rounded-full text-xs font-bold bg-surface-container-high ${stats[selectedStat].color}`}>
              {stats[selectedStat].value} إجمالي
            </div>
          </div>
          <div className="h-64 flex items-end gap-1.5 md:gap-2">
            {stats[selectedStat].data.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div 
                  className={`w-full rounded-t-lg transition-all relative ${selectedStat === 0 ? 'bg-blue-500/20 group-hover:bg-blue-500' : selectedStat === 1 ? 'bg-green-500/20 group-hover:bg-green-500' : selectedStat === 2 ? 'bg-orange-500/20 group-hover:bg-orange-500' : 'bg-purple-500/20 group-hover:bg-purple-500'}`}
                  style={{ height: `${(val / Math.max(...stats[selectedStat].data)) * 100}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {val}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant">يوم {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSubscription = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-black text-on-surface font-headline">الاشتراك</h2>

      <div className="bg-primary/5 rounded-3xl border border-primary/20 p-8 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="space-y-4 text-center md:text-right">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary text-on-primary rounded-full text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>حساب مفعل</span>
          </div>
          <h3 className="text-3xl font-black text-on-surface">باقة الكساب المحترف</h3>
          <p className="text-on-surface-variant">صالحة لغاية: 15 يونيو 2026</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-on-surface-variant font-bold">الاستهلاك</p>
          <div className="w-48 h-3 bg-surface-container-high rounded-full overflow-hidden">
            <div className="w-3/4 h-full bg-primary"></div>
          </div>
          <p className="text-xs font-bold text-on-surface">15 من أصل 20 إعلان</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: 'الباقة العادية', price: 'مجانية', features: ['5 إعلانات', 'صور فقط', 'دعم عادي'], isFree: true },
          { name: 'باقة المحترف', price: '199 درهم/شهر', features: ['20 إعلان', 'صور وفيديو', 'دعم سريع', 'إحصائيات متقدمة'], active: true },
          { name: 'باقة الضيعة الكبيرة', price: '499 درهم/شهر', features: ['إعلانات غير محدودة', 'ترويج الإعلان', 'مدير حساب خاص', 'تصوير احترافي'] },
        ].filter(plan => !settings.paymentSystemEnabled || !plan.isFree).map((plan, i) => (
          <div key={i} className={`bg-surface p-8 rounded-3xl border shadow-sm flex flex-col justify-between ${plan.active ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant/30'}`}>
            <div>
              <h4 className="text-xl font-black text-on-surface mb-2">{plan.name}</h4>
              <p className="text-2xl font-black text-primary mb-6">{plan.price}</p>
              <ul className="space-y-4 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-on-surface-variant">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button className={`w-full py-3 rounded-xl font-bold transition-all ${plan.active ? 'bg-surface-container-high text-on-surface cursor-default' : 'bg-primary text-on-primary hover:bg-primary/90'}`}>
              {plan.active ? 'باقتك الحالية' : 'ترقية الآن'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8">
      <h2 className="text-2xl font-black text-on-surface font-headline">الإعدادات</h2>

      <div className="bg-surface rounded-3xl border border-outline-variant/30 overflow-hidden">
        {/* Cover Image */}
        <div className="h-48 bg-surface-variant relative group">
          {profile?.coverURL ? (
            <img src={profile.coverURL} className="w-full h-full object-cover" alt="Cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
              <PlusCircle className="w-8 h-8 text-primary/40" />
            </div>
          )}
          <label className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-on-surface">
              <Camera className="w-4 h-4" />
              <span>تغيير غلاف الضيعة</span>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file && user) {
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    const compressed = await compressImage(reader.result as string, 1200, 400, 0.7);
                    await firestoreService.updateProfile({ coverURL: compressed });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        </div>

        <div className="p-8 border-b border-outline-variant/20 flex items-center gap-6 -mt-12 relative z-10">
          <div className="w-24 h-24 rounded-3xl bg-surface flex items-center justify-center overflow-hidden border-4 border-surface shadow-xl relative group">
            {profile?.photoURL ? (
              <img src={profile.photoURL} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-10 h-10 text-on-surface-variant" />
            )}
            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file && user) {
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
          <div className="pt-10">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-on-surface">{profile?.displayName || profile?.fullName || 'سي محمد'}</h3>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase">
                {profile?.role === 'admin' ? 'مدير' : profile?.role === 'seller' ? 'كساب' : 'مشتري'}
              </span>
            </div>
            <p className="text-on-surface-variant text-sm">{profile?.phoneNumber}</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">الاسم أو اللقب</label>
                <input 
                  type="text" 
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">المدينة</label>
                <select 
                  value={settingsCity}
                  onChange={(e) => setSettingsCity(e.target.value)}
                  className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                >
                  {moroccanCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">رقم الهاتف</label>
                <input 
                  type="tel" 
                  value={settingsPhone}
                  onChange={(e) => setSettingsPhone(e.target.value)}
                  className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
                  dir="ltr" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface-variant">واتساب</label>
                <input 
                  type="tel" 
                  value={settingsWhatsapp}
                  onChange={(e) => setSettingsWhatsapp(e.target.value)}
                  placeholder="مثلا: 0600880088"
                  className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl focus:ring-2 focus:ring-primary outline-none" 
                  dir="ltr" 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-outline-variant/20 flex flex-col md:flex-row gap-4">
              <button 
                type="submit"
                disabled={isUpdatingProfile}
                className="px-8 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2"
              >
                {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ التغييرات'}
                {updateSuccess && <CheckCircle2 className="w-4 h-4" />}
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (profile) {
                    setSettingsName(profile.displayName || profile.fullName || '');
                    setSettingsCity(profile.location || 'سطات');
                    setSettingsPhone(profile.phoneNumber || '');
                    setSettingsWhatsapp(profile.whatsappNumber || '');
                  }
                }}
                className="px-8 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold hover:bg-surface-variant transition-all"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-error/5 rounded-3xl border border-error/20 p-8">
        <h3 className="text-lg font-bold text-error mb-2">منطقة الخطر</h3>
        <p className="text-sm text-on-surface-variant mb-4">بمجرد حذف حسابك، سيتم مسح جميع بياناتك وإعلاناتك بشكل نهائي. هاد العملية مايمكنش ترجع فيها.</p>
        <button className="px-6 py-2 bg-error text-on-error rounded-lg font-bold text-sm hover:bg-error/90 transition-all">حذف الحساب نهائياً</button>
      </div>
    </div>
  );



  return (
    <div className="h-screen flex overflow-hidden bg-surface-container-low" dir="rtl">
      {/* Sidebar - Desktop */}
      <aside className="w-20 lg:w-64 bg-surface border-r border-outline-variant/20 flex flex-col justify-between hidden md:flex z-20">
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
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              <LayoutDashboard className="w-6 h-6" />
              <span className="hidden lg:block">لوحة القيادة</span>
            </button>
            <button 
              onClick={() => setActiveTab('flock')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'flock' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              <Tag className="w-6 h-6" />
              <span className="hidden lg:block">القطيع ديالي</span>
            </button>
            <button 
              onClick={() => setActiveTab('buyer-requests')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'buyer-requests' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              <ShoppingBag className="w-6 h-6" />
              <span className="hidden lg:block">طلبات المشترين</span>
              <span className="hidden lg:flex mr-auto bg-error text-white text-[10px] w-5 h-5 items-center justify-center rounded-full">10</span>
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'stats' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              <BarChart3 className="w-6 h-6" />
              <span className="hidden lg:block">الإحصائيات</span>
            </button>
            {settings.paymentSystemEnabled && (
              <button 
                onClick={() => setActiveTab('subscription')}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'subscription' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="hidden lg:block">الاشتراك</span>
              </button>
            )}
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              <Settings className="w-6 h-6" />
              <span className="hidden lg:block">الإعدادات</span>
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-outline-variant/20 space-y-2">
          {settings.solidarityDonationEnabled && (
            <button 
              onClick={() => setActiveTab('donations')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'donations' ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/5'}`}
            >
              <HeartHandshake className="w-5 h-5" />
              <span className="hidden lg:block">تبرع تضامني</span>
            </button>
          )}
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-error/10 text-error py-3 rounded-xl font-bold hover:bg-error/20 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-20 md:pb-0">
        {/* Top Header */}
        <DashboardHeader 
          title={getTitle()} 
          subtitle={activeTab === 'dashboard' ? (() => {
            const rawCity = (profile?.location || 'سطات').split(' ')[0];
            return cityMapping[rawCity.toLowerCase()] || rawCity;
          })() : undefined}
          location={activeTab === 'dashboard' ? (() => {
            const rawCity = (profile?.location || 'سطات').split(' ')[0];
            return cityMapping[rawCity.toLowerCase()] || rawCity;
          })() : undefined}
          showSearch={true}
          onSearch={(city, distance) => {
            onNavigate('search-results', undefined, city, distance);
          }}
          onNavigate={onNavigate}
        />

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'flock' && renderFlock()}
          {activeTab === 'stats' && renderStats()}
          {activeTab === 'subscription' && renderSubscription()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'buyer-requests' && <BuyerRequestsView requests={requests} />}
          {activeTab === 'donations' && settings.solidarityDonationEnabled && <DonationsView onBack={() => setActiveTab('dashboard')} />}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant/20 flex items-center justify-between px-2 pb-safe pt-2 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'text-primary' : 'text-on-surface-variant hover:text-primary/70'}`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' && 'fill-primary/20'}`} />
          <span className="text-[10px] font-bold">الرئيسية</span>
        </button>
        <button 
          onClick={() => setActiveTab('flock')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'flock' ? 'text-primary' : 'text-on-surface-variant hover:text-primary/70'}`}
        >
          <Tag className={`w-5 h-5 ${activeTab === 'flock' && 'fill-primary/20'}`} />
          <span className="text-[10px] font-bold">إعلاناتي</span>
        </button>
        <button 
          onClick={() => setActiveTab('buyer-requests')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors relative ${activeTab === 'buyer-requests' ? 'text-primary' : 'text-on-surface-variant hover:text-primary/70'}`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 ${activeTab === 'buyer-requests' && 'fill-primary/20'}`} />
            <span className="absolute -top-1 -right-1.5 bg-error text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">{requests.length}</span>
          </div>
          <span className="text-[10px] font-bold">طلبات</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors ${activeTab === 'settings' ? 'text-primary' : 'text-on-surface-variant hover:text-primary/70'}`}
        >
          <Settings className={`w-5 h-5 ${activeTab === 'settings' && 'fill-primary/20'}`} />
          <span className="text-[10px] font-bold">الإعدادات</span>
        </button>
      </nav>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-error/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            <h3 className="text-2xl font-black text-on-surface text-center mb-2 font-headline">تأكيد الحذف</h3>
            <p className="text-on-surface-variant text-center mb-8">واش متأكد بغيتي تمسح هاد الإعلان؟ هاد العملية مايمكنش ترجع فيها.</p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-variant transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={async () => {
                  if (listingToDelete) {
                    try {
                      await firestoreService.deleteAnnouncement(listingToDelete);
                      setShowDeleteConfirm(false);
                      setListingToDelete(null);
                    } catch (error) {
                      console.error("Error deleting listing:", error);
                    }
                  }
                }}
                className="flex-1 py-3 bg-error text-on-error font-bold rounded-xl hover:bg-error/90 transition-colors"
              >
                نعم، مسح
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
