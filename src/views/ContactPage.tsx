import React from 'react';
import { Mail, Phone, MapPin, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { ViewType } from '../App';

interface Props {
  onNavigate: (view: ViewType) => void;
}

export default function ContactPage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-[#FDFCF8] py-12 px-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
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
                <input 
                  type="text" 
                  placeholder="علاش بغيتي تواصل معانا؟"
                  className="w-full h-14 px-4 bg-[#F9F9F6] border-none rounded-2xl focus:ring-2 focus:ring-[#2E7D32] transition-all"
                />
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
