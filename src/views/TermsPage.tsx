import React from 'react';
import { motion } from 'framer-motion';
import { Info, BadgeCheck, Shield, Scale } from 'lucide-react';
import { ViewType } from '../App';
import SearchHeader from '../components/SearchHeader';

interface Props {
  onNavigate: (view: ViewType) => void;
}

export default function TermsPage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-[#FDFCF8] antialiased" dir="rtl">
      <SearchHeader onNavigate={onNavigate} />
      
      <div className="max-w-4xl mx-auto py-12 px-6">


        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A] font-headline mb-4">شروط الاستخدام</h1>
          <p className="text-[#4A4A4A] text-lg">آخر تحديث: 18 أبريل 2026</p>
        </motion.div>

        <div className="grid gap-8">
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-[32px] shadow-sm border border-outline-variant/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <Info className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">1. قبول الشروط</h2>
            </div>
            <p className="text-[#4A4A4A] leading-relaxed">
              باستخدامك لمنصة كسابكم، فإنك توافق على الالتزام بشروط الاستخدام هذه. إذا كنت لا توافق على أي جزء منها، يرجى عدم استخدام المنصة. نحن نحتفظ بالحق في تعديل هذه الشروط في أي وقت.
            </p>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-[32px] shadow-sm border border-outline-variant/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">2. مسؤولية المحتوى</h2>
            </div>
            <p className="text-[#4A4A4A] leading-relaxed mb-4">
              الكسابة مسؤولون بشكل كامل عن دقة المعلومات المنشورة في إعلاناتهم، بما في ذلك الصور، الأسعار، والحالة الصحية للأضاحي.
            </p>
            <ul className="list-disc pr-6 space-y-2 text-[#4A4A4A]">
              <li>يمنع نشر صور غير حقيقية أو مضللة.</li>
              <li>يمنع التلاعب بالأسعار في المنصة عن الواقع.</li>
              <li>المنصة لا تتحمل مسؤولية جودة الأضحية بعد اتمام عملية البيع خارجها.</li>
            </ul>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-[32px] shadow-sm border border-outline-variant/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">3. شروط البيع والشراء</h2>
            </div>
            <p className="text-[#4A4A4A] leading-relaxed text-right">
              كسابكم هي منصة للربط بين الشاري والكساب فقط. المعاملات المالية تتم بشكل مباشر بين الطرفين ولا تتدخل المنصة في عمليات الأداء أو التوصيل.
            </p>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-[32px] shadow-sm border border-outline-variant/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                <Scale className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">4. السلوك المحظور</h2>
            </div>
            <p className="text-[#4A4A4A] leading-relaxed">
              يُمنع استخدام المنصة لأي غرض غير قانوني، أو التحرش بالمستخدمين، أو محاولة اختراق أنظمة المنصة. سيتم حظر أي حساب يخالف هذه القواعد فوراً.
            </p>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
