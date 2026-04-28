import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, MessageSquare, Send } from 'lucide-react';
import { ViewType } from '../App';
import SearchHeader from '../components/SearchHeader';

interface Props {
  onNavigate: (view: ViewType) => void;
}

export default function ContactPage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-[#FDFCF8] antialiased" dir="rtl">
      <SearchHeader onNavigate={onNavigate} />
      
      <div className="max-w-5xl mx-auto py-12 px-6">


        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A] font-headline mb-4">اتصل بنا</h1>
          <p className="text-[#4A4A4A] text-lg max-w-2xl mx-auto">
            عندك سؤال؟ بغيتي مساعدة؟ حنا هنا باش نسمعو ليك. تواصل معانا وغادي نجاوبوك فدقيقة.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-outline-variant/10">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-8">معلومات التواصل</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-[#4A4A4A] font-medium mb-1">الهاتف</p>
                    <p className="text-lg font-bold text-[#1A1A1A] dir-ltr inline-block">+212 600 000 000</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-[#4A4A4A] font-medium mb-1">البريد الإلكتروني</p>
                    <p className="text-lg font-bold text-[#1A1A1A]">contact@kessabcom.ma</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-[#4A4A4A] font-medium mb-1">المقر</p>
                    <p className="text-lg font-bold text-[#1A1A1A]">الدار البيضاء، المغرب</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#2E7D32] p-8 rounded-[32px] text-white overflow-hidden relative">
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              <h3 className="text-xl font-bold mb-4 relative z-10">الدعم عبر الواتساب</h3>
              <p className="opacity-90 mb-6 relative z-10">تواصل معانا مباشرة عبر الواتساب للحصول على رد سريع.</p>
              <button className="bg-white text-[#2E7D32] px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition-colors border border-transparent hover:bg-transparent hover:text-white hover:border-white relative z-10">
                <MessageSquare className="w-5 h-5" />
                مراسلة الآن
              </button>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <form className="bg-white p-8 rounded-[32px] shadow-sm border border-outline-variant/10 space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#4A4A4A] mr-2">الاسم الكامل</label>
                  <input 
                    type="text" 
                    placeholder="سميتك الكاملة"
                    className="w-full h-14 px-4 bg-[#F9F9F6] border-none rounded-2xl focus:ring-2 focus:ring-[#2E7D32] transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#4A4A4A] mr-2">رقم الهاتف</label>
                  <input 
                    type="tel" 
                    placeholder="06 XX XX XX XX"
                    className="w-full h-14 px-4 bg-[#F9F9F6] border-none rounded-2xl focus:ring-2 focus:ring-[#2E7D32] transition-all text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#4A4A4A] mr-2">الموضوع</label>
                <div className="relative">
                  <select 
                    className="w-full h-14 px-4 bg-[#F9F9F6] border-none rounded-2xl focus:ring-2 focus:ring-[#2E7D32] transition-all appearance-none cursor-pointer text-[#1A1A1A] font-medium"
                    defaultValue=""
                  >
                    <option value="" disabled>اختار الموضوع...</option>
                    <option value="password_reset">إعادة تعيين كلمة المرور</option>
                    <option value="certified_badge">طلب الحصول على شارة معتمد (ONSSA)</option>
                    <option value="home_page">الصفحة الرئيسية</option>
                    <option value="banner">إعلانات البانر (Banner)</option>
                    <option value="other">موضوع آخر</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-[#4A4A4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#4A4A4A] mr-2">رسالتك</label>
                <textarea 
                  rows={4}
                  placeholder="كتب الرسالة ديالك هنا..."
                  className="w-full p-4 bg-[#F9F9F6] border-none rounded-2xl focus:ring-2 focus:ring-[#2E7D32] transition-all resize-none"
                />
              </div>

              <button className="w-full h-16 bg-[#2E7D32] text-white rounded-2xl font-black text-lg shadow-lg shadow-green-900/20 transition-colors border border-transparent hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32] flex items-center justify-center gap-3">
                إرسال الرسالة
                <Send className="w-5 h-5 rotate-180" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
