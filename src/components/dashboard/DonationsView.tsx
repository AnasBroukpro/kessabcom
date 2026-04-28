import React, { useState } from 'react';
import { 
  CheckCircle2, Loader2, MessageCircle, Calculator 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreService } from '../../services/firestoreService';

interface DonationsViewProps {
  onBack: () => void;
}

export function DonationsView({ onBack }: DonationsViewProps) {
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
        <div className="max-w-md w-full bg-white rounded-[10px] p-10 shadow-xl text-center border border-[#E8F5E9]">
          <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-[#2E7D32]" />
          </div>
          <h2 className="text-3xl font-black text-[#1A1A1A] mb-4 font-headline">تم إرسال تبرعك!</h2>
          <p className="text-[#4A4A4A] font-medium mb-8">شكرا لك على كرمك يا كساب. التبرع ديالك غادي يوصل للناس لي محتاجين وغادي نتواصلو معاك لتنسيق عملية التسليم.</p>
          <button 
            onClick={() => { setSubmitted(false); onBack(); }} 
            className="w-full bg-[#2E7D32] text-white py-4 rounded-[10px] font-bold border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors"
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
          <p className="text-on-surface-variant">ساهم في إدخال الفرحة على الأسر المعوزة. حدد عدد الأكباش لي بغيتي تبرع بيهم من القطيع ديالك.</p>
        </div>

        <div className="bg-white rounded-[10px] p-8 shadow-xl border border-outline-variant/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#4A4A4A] mr-1">عدد الأكباش للتبرع</label>
              <div className="relative">
                <input 
                  className="w-full h-14 px-4 pr-12 bg-[#F9F9F6] border border-transparent rounded-[10px] focus:ring-2 focus:ring-[#2E7D32] focus:bg-white transition-all outline-none text-left" 
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
                  className="w-full p-4 pr-12 bg-[#F9F9F6] border border-transparent rounded-[10px] focus:ring-2 focus:ring-[#2E7D32] focus:bg-white transition-all outline-none min-h-[150px]" 
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
              className="w-full h-16 bg-[#2E7D32] text-white font-black text-xl rounded-[10px] shadow-lg border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'تأكيد التبرع'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
