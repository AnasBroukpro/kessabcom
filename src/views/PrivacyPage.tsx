import React from 'react';
import { motion } from 'framer-motion';
import { Database, Eye, ShieldCheck, FileKey, ArrowLeft } from 'lucide-react';
import { ViewType } from '../App';
import SearchHeader from '../components/SearchHeader';

interface Props {
  onNavigate: (view: ViewType) => void;
}

export default function PrivacyPage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-[#FDFCF8] antialiased" dir="rtl">
      <SearchHeader onNavigate={onNavigate} />
      
      <div className="max-w-4xl mx-auto pt-28 pb-16 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A] font-headline mb-4">سياسة الخصوصية لمنصة kessabcom.ma 🔒</h1>
          <p className="text-[#4A4A4A] text-lg">نحن في منصة kessabcom.ma نلتزم بحماية خصوصية بياناتكم وأمنها. إليكم خلاصة كيفية التعامل مع معلوماتكم:</p>
        </motion.div>

        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-[32px] border border-outline-variant/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Database className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">📝 1. البيانات التي نجمعها</h2>
            </div>
            <div className="text-[#4A4A4A] leading-relaxed space-y-3">
              <p><strong>للكسابة:</strong> الاسم، رقم الهاتف، موقع الـ GPS للأضاحي، وصور المواشي.</p>
              <p><strong>للمشترين:</strong> الاسم، رقم الهاتف، ومعلومات الدفع (التي تُعالج بأمان عبر بوابات دفع معتمدة دون تخزين بيانات بطاقاتكم لدينا).</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-[32px] border border-outline-variant/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">⚙️ 2. كيف نستخدم بياناتكم؟</h2>
            </div>
            <ul className="text-[#4A4A4A] leading-relaxed space-y-2 list-disc pr-6">
              <li>لعرض مواقع الكسابة وأرقام هواتفهم للمشترين المستفيدين من الخدمة.</li>
              <li>لتسهيل عملية الربط والتواصل المباشر بين الطرفين.</li>
              <li>لتحسين جودة وأداء المنصة وحل أي مشاكل تقنية.</li>
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-[32px] border border-outline-variant/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">🛡️ 3. مشاركة البيانات والتعاون الأمني</h2>
            </div>
            <p className="text-[#4A4A4A] leading-relaxed mb-3">بياناتكم سرية تماماً ولا تُباع لأي جهة، لكن يتم مشاركتها في حالتين فقط:</p>
            <ul className="text-[#4A4A4A] leading-relaxed space-y-2 list-disc pr-6">
              <li>1️⃣ ظهور هاتف وموقع الكساب للمشتري بعد أدائه لرسوم الخدمة.</li>
              <li>2️⃣ في حال وجود شبهة نصب أو احتيال: تلتزم المنصة بتزويد المشتري المتضرر أو السلطات الأمنية والقضائية ببيانات الكساب المعني للمساعدة في التحقيقات القانونية.</li>
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-[32px] border border-outline-variant/10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                <FileKey className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">🛡️ 4. أمن البيانات وحقوقكم</h2>
            </div>
            <ul className="text-[#4A4A4A] leading-relaxed space-y-2 list-disc pr-6">
              <li>نستخدم أنظمة حماية متطورة لمنع أي اختراق أو تسريب لبياناتكم.</li>
              <li>يحق لكم في أي وقت تعديل معلوماتكم أو طلب حذف حسابكم وإعلاناتكم نهائياً بعد بيع الأضاحي.</li>
            </ul>
          </motion.div>
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
