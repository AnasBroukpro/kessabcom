import React, { useState } from 'react';
import { ViewType } from '../App';
import { Heart, Phone, User, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import SearchHeader from '../components/SearchHeader';
import { firestoreService } from '../services/firestoreService';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
}

export default function SolidarityRequest({ onNavigate }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await firestoreService.submitDonation({
        fullName,
        phone,
        city,
        type: 'request'
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إرسال الطلب. المرجو المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FDFCF8]" dir="rtl">
        <SearchHeader onNavigate={onNavigate} />
        <div className="flex items-center justify-center p-6 py-20">
          <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl text-center border border-[#E8F5E9]">
            <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-[#2E7D32]" />
            </div>
            <h2 className="text-3xl font-black text-[#1A1A1A] mb-4 font-headline">تم تسجيل طلبك بنجاح</h2>
            <p className="text-[#4A4A4A] font-medium mb-8">غادي نتصلو بيك فـ أقرب وقت ممكن باش نكملو الإجراءات. عيد مبارك سعيد!</p>
            <button 
              onClick={() => onNavigate('home')} 
              className="w-full bg-[#2E7D32] text-white py-4 rounded-xl font-bold transition-colors border border-transparent hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32]"
            >
              الرجوع للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8]" dir="rtl">
      <SearchHeader onNavigate={onNavigate} />
      
      <div className="max-w-2xl mx-auto py-20 px-6">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-[#2E7D32]/10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-[#E8F5E9] rounded-2xl flex items-center justify-center">
              <Heart className="w-8 h-8 text-[#2E7D32]" />
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black text-[#1A1A1A] font-headline">طلب استفادة من أضحية</h1>
              <p className="text-[#757575] font-medium">هاد الفضاء مخصص للناس لي فوضعية صعبة وبغاو يستافدو من التبرعات.</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#4A4A4A] mr-1">الاسم الكامل</label>
              <div className="relative">
                <input 
                  className="w-full h-14 px-4 pr-12 bg-[#F9F9F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:bg-white transition-all outline-none" 
                  placeholder="كتب سميتك الكاملة" 
                  required 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <User className="absolute right-4 top-1/2 -translate-y-1/2 text-[#757575] w-5 h-5" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#4A4A4A] mr-1">رقم الهاتف</label>
              <div className="relative">
                <input 
                  className="w-full h-14 px-4 pr-12 bg-[#F9F9F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:bg-white transition-all outline-none text-left" 
                  placeholder="06 XX XX XX XX" 
                  required 
                  type="tel" 
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-[#757575] w-5 h-5" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#4A4A4A] mr-1">المدينة</label>
              <div className="relative">
                <input 
                  className="w-full h-14 px-4 pr-12 bg-[#F9F9F6] border border-transparent rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:bg-white transition-all outline-none" 
                  placeholder="المدينة فين ساكن" 
                  required 
                  type="text" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-[#757575] w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-[#FFF9C4] rounded-xl border border-[#FBC02D]/20">
              <p className="text-sm text-[#827717] font-medium leading-relaxed">
                * المعلومات ديالك غادي تبقى سرية، وغادي نتاصلو بيك باش نتحققو من الطلب ونرتبو عملية التسليم.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-16 bg-[#2E7D32] text-white font-black text-xl rounded-xl shadow-lg shadow-[#2E7D32]/20 transition-all border border-transparent hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'إرسال الطلب'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
