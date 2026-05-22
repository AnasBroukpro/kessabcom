import React from 'react';
import { motion } from 'framer-motion';
import { Info, BadgeCheck, UserCheck, Shield, ArrowLeft } from 'lucide-react';
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
          <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A] font-headline mb-4">شروط وأحكام استخدام منصة kessabcom.ma 📋</h1>
          <p className="text-[#4A4A4A] text-lg">استخدامك للمنصة أو الدفع مقابل خدماتها يعني موافقتك الكاملة على الشروط التالية:</p>
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
              <h2 className="text-2xl font-bold text-[#1A1A1A]">💡 1. طبيعة الخدمة (إخلاء مسؤولية)</h2>
            </div>
            <ul className="text-[#4A4A4A] leading-relaxed space-y-2 list-disc pr-6">
              <li>المنصة هي وسيط رقمي معلوماتي فقط يربط بين الكساب والمشتري (توفير الهاتف وموقع GPS).</li>
              <li>المنصة ليست طرفاً في عمليات البيع، الشراء، تحديد الأسعار، أو التوصيل، ولا تتحمل مسؤولية جودة أو سلامة الأضاحي.</li>
            </ul>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-[32px] shadow-sm border border-outline-variant/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">👤 2. شروط خاصة بالمشترين</h2>
            </div>
            <ul className="text-[#4A4A4A] leading-relaxed space-y-3 list-disc pr-6">
              <li>تُستخدم أرقام الهواتف والمواقع لغرض شراء الأضحية فقط، ويُمنع استخدامها للإزعاج.</li>
              <li>الدفع يكون مقابل "الولوج للمعلومة"، والرسوم غير قابلة للاسترداد بمجرد ظهور البيانات (إلا في الحالات الاستثنائية المذكورة في سياسة الاسترداد).</li>
            </ul>
            <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-200">
              <p className="text-red-700 font-bold text-sm">⚠️ تنبيه هام: ننصح المشترين بشدة بعدم إرسال أي تسبيق مالي أو عربون للكساب قبل معاينة الأضحية على أرض الواقع.</p>
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-[32px] shadow-sm border border-outline-variant/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">👨‍🌾 3. شروط خاصة بالكسابة</h2>
            </div>
            <ul className="text-[#4A4A4A] leading-relaxed space-y-3 list-disc pr-6">
              <li>يتعهد الكساب بتقديم معلومات صحيحة وصادقة (رقم الهاتف، صور حقيقية، وموقع GPS الفعلي للمواشي).</li>
              <li>يُمنع منعاً باتاً وضع مواقع وهمية أو صور مضللة.</li>
              <li>يحق للكساب طلب استرجاع الاشتراك إلكترونياً عبر المنصة فقط، بشرط عدم تلقي أي اتصال، وقبل العيد بـ 24 ساعة على الأقل.</li>
            </ul>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-[32px] shadow-sm border border-outline-variant/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">🛡️ 4. مكافحة النصب والتعاون الأمني</h2>
            </div>
            <ul className="text-[#4A4A4A] leading-relaxed space-y-3 list-disc pr-6">
              <li>يحظر تماماً أي نشاط احتيالي، وسيتم حظر أي حساب يخالف ذلك نهائياً.</li>
              <li>في حال وقوع أي عملية نصب، تلتزم المنصة بتزويد المشتري المتضرر أو السلطات الأمنية والقضائية بكافة بيانات الكساب المسجلة لدينا لتقديم شكاية رسمية.</li>
            </ul>
          </motion.section>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-[#2E7D32] font-bold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة إلى الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}
