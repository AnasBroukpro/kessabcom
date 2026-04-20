import React from 'react';
import { Eye, ShieldCheck, Database, FileKey, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { ViewType } from '../App';

interface Props {
  onNavigate: (view: ViewType) => void;
}

export default function PrivacyPage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-[#FDFCF8] py-12 px-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-[#2E7D32] font-bold mb-8 px-4 py-2 rounded-xl border border-transparent hover:bg-[#2E7D32] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 ml-1" />
          الرجوع للرئيسية
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A] font-headline mb-4">سياسة الخصوصية</h1>
          <p className="text-[#4A4A4A] text-lg">نحن نهتم بخصوصيتك ونلتزم بحمايتها.</p>
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
              <h2 className="text-2xl font-bold text-[#1A1A1A]">المعلومات التي نجمعها</h2>
            </div>
            <div className="text-[#4A4A4A] leading-relaxed space-y-4">
              <p>نحن نجمع فقط المعلومات الضرورية لتشغيل المنصة، وهي:</p>
              <ul className="list-disc pr-6 space-y-2">
                <li>الاسم ورقم الهاتف (للتواصل بين البائع والمشتري).</li>
                <li>الموقع الجغرافي (لتسهيل العثور على الأضاحي القريبة منك).</li>
                <li>الصور ومقاطع الفيديو التي ترفعها لإعلاناتك.</li>
              </ul>
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
              <h2 className="text-2xl font-bold text-[#1A1A1A]">كيف نستخدم معلوماتك</h2>
            </div>
            <p className="text-[#4A4A4A] leading-relaxed">
              تُستخدم معلوماتك فقط لتسهيل عمليات البيع والشراء داخل المنصة. لن نقوم ببيع أو مشاركة بياناتك الشخصية مع جهات خارجية لأغراض تسويقية دون موافقتك الصريحة.
            </p>
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
              <h2 className="text-2xl font-bold text-[#1A1A1A]">أمن البيانات</h2>
            </div>
            <p className="text-[#4A4A4A] leading-relaxed">
              نحن نستخدم تقنيات حديثة لحماية بياناتك من الوصول غير المصرح به. يتم تشفير جميع المعلومات الحساسة المخزنة في قواعد بياناتنا.
            </p>
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
              <h2 className="text-2xl font-bold text-[#1A1A1A]">حقوقك</h2>
            </div>
            <p className="text-[#4A4A4A] leading-relaxed">
              لديك الحق في الوصول إلى بياناتك الشخصية، أو تصحيحها، أو طلب حذفها في أي وقت من خلال إعدادات حسابك أو التواصل معنا مباشرة.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
