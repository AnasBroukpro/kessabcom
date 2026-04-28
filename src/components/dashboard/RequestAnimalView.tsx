import React, { useState } from 'react';
import { ShoppingBag, MessageCircle, Calculator, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestoreService';

interface RequestAnimalViewProps {
  setActiveView: (view: any) => void;
}

export default function RequestAnimalView({ setActiveView }: RequestAnimalViewProps) {
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
    <div className="space-y-8 w-full" dir="rtl">
      <div className="w-full">
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
