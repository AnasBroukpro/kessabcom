import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewType } from '../App';
import { Phone, ArrowRight, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import { firestoreService } from '../services/firestoreService';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import logoV2 from '../assets/marketing/branding/logo-v2.png';

interface Props {
  onNavigate: (view: ViewType) => void;
}

export default function ForgotPassword({ onNavigate }: Props) {
  const [phoneDigits, setPhoneDigits] = useState<string[]>(['0', '', '', '', '', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

    const handleDigitChange = (index: number, value: string) => {
    if (index === 0) return; // '0' is fixed
    if (!/^\d*$/.test(value)) return;
    
    // Moroccan prefixes validation for the second digit
    if (index === 1 && value && !['5', '6', '7'].includes(value.slice(-1))) {
      return;
    }

    const newDigits = [...phoneDigits];
    newDigits[index] = value.slice(-1);
    setPhoneDigits(newDigits);

    // Auto-focus next input
    if (value && index < 9) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !phoneDigits[index] && index > 1) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  const getFormattedPhone = (digits: string[]) => {
    const full = digits.join('');
    if (full.startsWith('0')) {
      return '+212' + full.substring(1);
    }
    return full;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = phoneDigits.join('');
    const moroccanRegex = /^0(5|6|7)\d{8}$/;

    if (!fullPhone || fullPhone.length < 10 || !moroccanRegex.test(fullPhone)) {
      setError('يرجى إدخال رقم هاتف مغربي صحيح (مثلاً: 0612345678)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formatted = getFormattedPhone(phoneDigits);
      
      await firestoreService.createSupportRequest('password_reset', {
        phone: formatted,
        name: 'غير معروف', // Backend can lookup if needed
      });
      
      setShowSuccess(true);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError('وقع خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-6 antialiased" dir="rtl">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img 
            src={logoV2} 
            alt="KESSABCOM" 
            className="h-12 w-auto cursor-pointer" 
            onClick={() => onNavigate('home')}
          />
        </div>

        <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-outline-variant/10">
          {!showSuccess ? (
            <>
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-black text-on-surface mb-3 font-headline">نسيت كلمة المرور؟</h1>
                <p className="text-on-surface-variant font-medium leading-relaxed">
                  دخل رقم الهاتف ديالك باش نصيفطو ليك كلمة مرور مؤقتة عبر الواتساب (WhatsApp)
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="block text-sm font-black text-on-surface-variant mb-4 text-right">رقم الهاتف</label>
                  <div className="flex flex-row justify-between gap-1 sm:gap-2" dir="ltr">
                    {phoneDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`digit-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        readOnly={idx === 0}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className={`w-full h-12 sm:h-14 text-center text-xl font-black rounded-xl border-2 transition-all outline-none ${
                          idx === 0 || digit ? 'text-[#2E7D32]' : 'text-[#1A1A1A]'
                        } ${
                          idx === 0 ? 'bg-[#E8F5E9] border-[#2E7D32]/20' :
                          error ? 'border-error/30 bg-error/5 focus:border-error' : 
                          'border-outline-variant/20 bg-[#F9F9F6] focus:border-primary focus:bg-white focus:shadow-lg focus:shadow-primary/10'
                        }`}
                        autoFocus={idx === 1}
                      />
                    ))}
                  </div>
                  <AnimatePresence>
                    {error && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-error text-xs font-bold mt-4 flex items-center gap-1.5 justify-end"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>جاري المعالجة...</span>
                    </>
                  ) : (
                    <span>إرسال كلمة المرور</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('auth')}
                  className="w-full py-2 text-on-surface-variant font-bold text-sm hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>الرجوع لتسجيل الدخول</span>
                </button>
              </form>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-black text-on-surface mb-4 font-headline">تم إرسال طلبك!</h2>
              <div className="bg-[#F9F9F6] rounded-2xl p-6 mb-8 border border-outline-variant/10">
                <p className="text-on-surface-variant font-bold mb-2">رقم الهاتف المسجل:</p>
                <p className="text-2xl font-black text-primary tracking-wider" dir="ltr">
                  {phoneDigits.join('')}
                </p>
              </div>
              <p className="text-on-surface-variant font-bold leading-relaxed mb-10">
                سيقوم فريق الدعم لدينا بالتواصل معك قريباً عبر الواتساب (WhatsApp) لإرسال كلمة مرور مؤقتة لك.
              </p>
              <button
                onClick={() => onNavigate('home')}
                className="w-full h-14 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all"
              >
                فهمت، شكراً
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
