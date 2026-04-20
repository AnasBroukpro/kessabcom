import React, { useState, useEffect, useRef } from 'react';
import { ViewType } from '../App';
import { MapPin, User, BadgeCheck, ShieldCheck, ArrowLeft, Lock, Eye, UserPlus, Globe, Phone, MessageCircle, Loader2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
  intendedView?: {view: ViewType, listingId?: string} | null;
}

export default function Auth({ onNavigate, intendedView }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const [mode, setMode] = useState<'register' | 'login'>('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'phone' | 'confirm-register' | 'role' | 'otp' | 'details'>('phone');
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller'>('buyer');
  const [registrationData, setRegistrationData] = useState({
    fullName: '',
    city: '',
    termsAccepted: false
  });

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useEffect(() => {
    if (step === 'details') {
      if ('geolocation' in navigator) {
        setIsDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.state || '';
            if (city) {
              setRegistrationData(prev => ({ ...prev, city: city }));
            }
          } catch (error) {
            console.error("Error detecting city:", error);
          } finally {
            setIsDetectingLocation(false);
          }
        }, (error) => {
          console.error("Geolocation error:", error);
          setIsDetectingLocation(false);
        });
      }
    }
  }, [step]);

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          console.error('Error clearing recaptcha:', e);
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const initRecaptcha = () => {
    // Destroy previous instance
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch (e) {
        console.log('recaptcha clear error:', e);
      }
      (window as any).recaptchaVerifier = null;
    }
    // Clear the DOM element
    const container = document.getElementById('recaptcha-container');
    if (container) container.innerHTML = '';
    
    // Create fresh instance
    try {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          (window as any).recaptchaVerifier = null;
        }
      });
      return (window as any).recaptchaVerifier;
    } catch (err) {
      console.error('reCAPTCHA initialization error:', err);
      setError('حدث خطأ في التحقق. يرجى تحديث الصفحة والمحاولة مرة أخرى.');
      return null;
    }
  };

  
  const onSignInSubmit = async (e?: React.FormEvent, phoneToUse?: string) => {
    if (e) e.preventDefault();
    const phone = phoneToUse || phoneNumber;
    if (!phone) return false;

    setError(null);
    setLoading(true);

    try {
      const appVerifier = initRecaptcha();
      if (!appVerifier) {
        throw new Error('مشكل فإعداد نظام الحماية (reCAPTCHA). جرب تعاود تحميل الصفحة.');
      }
      
      // Explicitly render the verifier
      await appVerifier.render();
      
      // Small delay to ensure reCAPTCHA is fully ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Robust phone number formatting
      let cleanPhone = phone.replace(/\D/g, ''); // Remove all non-digits
      
      if (cleanPhone.startsWith('212')) {
        cleanPhone = cleanPhone.substring(3);
      } else if (cleanPhone.startsWith('06') || cleanPhone.startsWith('07')) {
        cleanPhone = cleanPhone.substring(1);
      }
      
      // Validation: Must be 9 digits after country code (e.g., 612345678)
      if (!/^[67]\d{8}$/.test(cleanPhone)) {
        throw new Error('رقم الهاتف غير صحيح. خاصو يكون فيه 10 دالأرقام ويبدا بـ 06 ولا 07');
      }
      
      const formattedPhone = `+212${cleanPhone}`;

      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('otp');
      return true;
    } catch (err: any) {
      console.error('Phone Sign-In Detailed Error:', err);
      
      // Handle specific error codes
      if (err.message?.includes('auth/error-code:-39')) {
        setError('رقم الهاتف غير مدعوم أو محظور. يرجى استخدام رقم آخر أو التواصل مع الدعم.');
      } else if (err.code === 'auth/internal-error') {
        setError('خطأ داخلي في Firebase. تأكد من إعدادات "Authorized Domains" و "SMS Region Policy" في واجهة مشغل البرمجيات.');
      } else if (err.message?.includes('503')) {
        setError('خدمة الرسائل القصيرة غير متاحة مؤقتاً. يرجى المحاولة لاحقاً.');
      } else if (err.code === 'auth/captcha-check-failed' || err.code === 'auth/invalid-app-credential') {
        setError('فشل التحقق من الحماية (reCAPTCHA). يرجى المحاولة مرة أخرى أو تحديث الصفحة. تأكد من أنك لست روبوت.');
      } else if (err.code === 'auth/operation-not-allowed') {
        if (err.message?.includes('SMS unable to be sent until this region enabled')) {
          setError('يجب تفعيل منطقة المغرب (+212) في إعدادات SMS في Firebase Console. اذهب إلى Authentication > Settings > SMS Region Policy.');
        } else {
          setError('خدمة الهاتف غير مفعلة في إعدادات Firebase. يرجى تفعيلها من لوحة التحكم.');
        }
      } else if (err.code === 'auth/billing-not-enabled') {
        setError('يجب تفعيل الدفع (Billing) في Firebase لاستخدام خدمة الرسائل النصية. اذهب إلى Firebase Console وقم بترقية المشروع إلى خطة Blaze.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('رقم الهاتف غير صحيح. تأكد من الرقم وعاود.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('بزاف ديال المحاولات. جرب من بعد شوية، أو استعمل رقم تجريبي (Test Number) فلوحة تحكم Firebase.');
      } else {
        setError(err.message || 'وقع مشكل فإرسال الكود. تأكد من الرقم وعاود.');
      }
      
      // Clear recaptcha on error to allow retry
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          console.error('Error clearing recaptcha:', e);
        }
        recaptchaVerifierRef.current = null;
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const onPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setLoading(true);
    setError(null);
    try {
      // Format phone number to match storage format (e.g., +2126...)
      let cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.startsWith('212')) {
        cleanPhone = cleanPhone.substring(3);
      } else if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
      }
      const formattedPhone = `+212${cleanPhone}`;
      const isTestKessab = formattedPhone === '+212600880088';
      const isTestAcheteur = formattedPhone === '+212700770077';

      // Check if phone exists via API
      const { exists } = await firestoreService.checkPhoneExists(formattedPhone);

      if (exists || isTestKessab || isTestAcheteur) {
        // User exists or is a test account, proceed to OTP and then login
        await onSignInSubmit(undefined, phoneNumber);
      } else {
        // User doesn't exist, proceed to confirmation
        setStep('confirm-register');
      }
    } catch (err) {
      console.error(err);
      setError('وقع مشكل فالتأكد من الحساب. عاود جرب.');
    } finally {
      setLoading(false);
    }
  };

  const onRoleSelect = (role: 'buyer' | 'seller') => {
    setSelectedRole(role);
    setStep('details');
  };

  const onRegisterSubmit = async (role: 'buyer' | 'seller', data: any) => {
    setSelectedRole(role);
    setRegistrationData({
      fullName: data.fullName,
      city: data.city,
      termsAccepted: true
    });
    setPhoneNumber(data.phone);
    await onSignInSubmit(undefined, data.phone); // ✅ await ajouté
  };

  const onVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setError(null);
    setLoading(true);

    try {
      const result = await confirmationResult.confirm(verificationCode);
      const user = result.user;

      const profileData = await firestoreService.getUserProfile(user.uid);

      const isTestKessab = user.phoneNumber === '+212600880088';
      const isTestAcheteur = user.phoneNumber === '+212700770077';

      if (profileData && profileData.fullName) {
        let role = profileData.role;
        let needsUpdate = false;

        if (isTestKessab && role !== 'seller') {
          role = 'seller';
          needsUpdate = true;
        } else if (isTestAcheteur && role !== 'buyer') {
          role = 'buyer';
          needsUpdate = true;
        }

        if (needsUpdate) {
          await firestoreService.updateProfile({ role });
          await refreshProfile();
        }

        if (intendedView) {
          onNavigate(intendedView.view, intendedView.listingId);
        } else if (role === 'seller') {
          onNavigate('seller');
        } else if (role === 'admin') {
          onNavigate('admin');
        } else {
          onNavigate('buyer');
        }
      } else {
        if (registrationData.fullName && registrationData.city) {
          // We already have the data from the register mode, submit it directly
          await onDetailsSubmit();
        } else if (isTestKessab || isTestAcheteur) {
          // Test accounts skip role selection and go straight to details
          setStep('details');
        } else {
          // New user from login mode, proceed to role selection
          setStep('role');
        }
      }
    } catch (err: any) {
      console.error('Verify Code Error:', err);
      if (err.message && (err.message.includes('Quota') || err.message.includes('quota'))) {
        setError('تم استهلاك حصة قاعدة البيانات لهذا اليوم. يرجى المحاولة غداً.');
      } else if (err.code === 'auth/invalid-verification-code') {
        setError('الكود لي دخلتي ماشي صحيح. عاود جرب.');
      } else {
        setError(err.message || 'وقع مشكل في التحقق. عاود جرب.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onDetailsSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!registrationData.fullName || !registrationData.city) return;
    
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not found');

      // Format phone number
      let cleanPhone = phoneNumber.replace(/\D/g, '');
      if (cleanPhone.startsWith('212')) {
        cleanPhone = cleanPhone.substring(3);
      } else if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.substring(1);
      }
      const formattedPhone = `+212${cleanPhone}`;

      const isTestKessab = formattedPhone === '+212600880088';
      const isTestAcheteur = formattedPhone === '+212700770077';
      const finalRole = isTestKessab ? 'seller' : (isTestAcheteur ? 'buyer' : selectedRole);

      await firestoreService.syncUser(
        user.uid,
        user.email || '',
        registrationData.fullName,
        finalRole
      );

      // Force profile update in context before navigating
      await refreshProfile();

      if (intendedView) {
        onNavigate(intendedView.view, intendedView.listingId);
      } else if (finalRole === 'admin') {
        onNavigate('admin');
      } else if (selectedRole === 'seller') {
        onNavigate('add-listing');
      } else {
        onNavigate('buyer');
      }
    } catch (err) {
      setError('وقع مشكل فإتمام التسجيل. عاود جرب.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Invisible Recaptcha Container - Must not be display:none for some browser versions */}
      <div id="recaptcha-container" className="fixed bottom-0 left-0 opacity-0 pointer-events-none z-[-1]"></div>
      
      {mode === 'login' ? (
        <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
          {/* Left Side: Login Form */}
          <div className="w-full md:w-[40%] min-h-screen relative flex items-center justify-center p-8 lg:p-12 overflow-hidden bg-gradient-to-br from-[#E8F5E9] via-[#C8E6C9] to-[#A5D6A7]">
            {/* Decorative blurred circles */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] rounded-full bg-primary/20 blur-[80px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] rounded-full bg-secondary/20 blur-[80px]"></div>
            
            <div className="w-full max-w-md z-10">
              <div className="mb-10 text-right">
                <button 
                  onClick={() => onNavigate('home')} 
                  className="text-3xl font-black text-[#1B5E20] tracking-tight font-headline mb-6 block border border-transparent hover:border-[#1B5E20] px-2 py-1 rounded-lg transition-colors"
                >
                  Kessabcom
                </button>
                <h1 className="text-4xl font-black text-[#1B5E20] font-headline leading-tight mb-2">
                  {step === 'phone' ? 'تسجيل الدخول' : 'تأكيد الحساب'}
                </h1>
                <p className="text-[#2E7D32] text-lg font-medium">
                  {step === 'phone' ? 'على سلامتك، توحشناك في السوق' : 'دخل الكود لي وصلك فالميساج'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold">
                  {error}
                </div>
              )}

              {step === 'phone' && (
                <form className="space-y-8" onSubmit={onPhoneSubmit}>
                  <div className="space-y-2">
                    <div className="relative flex items-center">
                      <span className="absolute left-4 font-bold text-[#1B5E20] border-r border-[#1B5E20]/20 pr-3">+212</span>
                      <input 
                        className="w-full h-16 pl-20 pr-4 bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl text-[#1B5E20] font-bold focus:ring-2 focus:ring-[#2E7D32] focus:bg-white/60 transition-all text-left" 
                        dir="ltr" 
                        placeholder="6 00 00 00 00" 
                        required 
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full h-16 bg-[#1B5E20] text-white font-black text-xl rounded-2xl shadow-xl shadow-[#1B5E20]/30 border border-transparent hover:bg-transparent hover:text-[#1B5E20] hover:border-[#1B5E20] transition-colors flex items-center justify-center gap-4 group"
                  >
                    دخول
                    <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                  </button>
                </form>
              )}

              {step === 'confirm-register' && (
                <div className="space-y-6">
                  <div className="text-right">
                    <p className="text-[#1B5E20] text-lg font-bold mb-6">
                      هاد الرقم ما مسجلش عندنا. واش بغيتي تفتح حساب جديد؟
                    </p>
                  </div>
                  <div className="space-y-4">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        onSignInSubmit(undefined, phoneNumber);
                      }} 
                      className="w-full h-16 bg-[#1B5E20] text-white font-black text-xl rounded-2xl shadow-xl shadow-[#1B5E20]/30 border border-transparent hover:bg-transparent hover:text-[#1B5E20] hover:border-[#1B5E20] transition-colors flex items-center justify-center gap-4 group"
                    >
                      نعم، بغيت نسجل
                    </button>
                    <button 
                      onClick={() => setStep('phone')} 
                      className="w-full h-16 bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl text-[#1B5E20] font-bold text-xl hover:bg-transparent hover:text-[#1B5E20] hover:border-[#1B5E20] transition-colors"
                    >
                      لا، نرجع نتأكد من الرقم
                    </button>
                  </div>
                </div>
              )}

              {step === 'role' && (
                <div className="space-y-4">
                  <button onClick={() => onRoleSelect('buyer')} className="w-full p-6 bg-white rounded-2xl border-2 border-[#1B5E20] text-[#1B5E20] font-bold text-xl transition-colors hover:bg-[#1B5E20] hover:text-white">أنا مشتري</button>
                  <button onClick={() => onRoleSelect('seller')} className="w-full p-6 bg-white rounded-2xl border-2 border-[#1B5E20] text-[#1B5E20] font-bold text-xl transition-colors hover:bg-[#1B5E20] hover:text-white">أنا كساب</button>
                </div>
              )}

              {step === 'otp' && (
                <form className="space-y-8" onSubmit={onVerifyCodeSubmit}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-bold text-[#1B5E20] mr-1">كود التأكيد</label>
                      <button 
                        type="button" 
                        onClick={() => setStep('phone')} 
                        className="text-sm text-primary font-bold hover:underline"
                      >
                        تغيير الرقم؟
                      </button>
                    </div>
                    <input 
                      className="w-full h-16 px-4 bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl text-[#1B5E20] font-bold text-center text-2xl tracking-[1em] focus:ring-2 focus:ring-[#2E7D32] focus:bg-white/60 transition-all" 
                      placeholder="000000" 
                      required 
                      maxLength={6}
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-16 bg-[#1B5E20] text-white font-black text-xl rounded-2xl shadow-xl shadow-[#1B5E20]/30 border border-transparent hover:bg-transparent hover:text-[#1B5E20] hover:border-[#1B5E20] transition-colors flex items-center justify-center gap-4 group disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                        تأكيد
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {step === 'details' && (
                <form className="space-y-8" onSubmit={onDetailsSubmit}>
                  <div className="space-y-4">
                    <input 
                      className="w-full h-16 px-4 bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl text-[#1B5E20] font-bold focus:ring-2 focus:ring-[#2E7D32] focus:bg-white/60 transition-all" 
                      placeholder="الاسم الكامل" 
                      required 
                      type="text"
                      value={registrationData.fullName}
                      onChange={(e) => setRegistrationData({...registrationData, fullName: e.target.value})}
                    />
                    
                    <div className="relative">
                      <select
                        required
                        value={registrationData.city}
                        onChange={(e) => setRegistrationData({...registrationData, city: e.target.value})}
                        className="w-full h-16 px-4 bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl text-[#1B5E20] font-bold focus:ring-2 focus:ring-[#2E7D32] focus:bg-white/60 transition-all appearance-none"
                      >
                        <option value="">اختر المدينة...</option>
                        {['الدار البيضاء', 'الرباط', 'فاس', 'مراكش', 'أكادير', 'طنجة', 'مكناس', 'وجدة', 'القنيطرة', 'تطوان', 'خريبكة', 'بني ملال', 'الجديدة', 'آسفي', 'سطات', 'برشيد', 'الخميسات', 'الناظور', 'تازة', 'المحمدية', 'سلا', 'تمارة', 'العرائش', 'كلميم', 'بركان', 'الفقيه بن صالح', 'تاوريرت', 'بوسكورة', 'ورزازات', 'العيون', 'الداخلة', 'تارودانت', 'قلعة السراغنة', 'سيدي سليمان', 'سيدي قاسم', 'تيزنيت', 'طانطان', 'شفشاون', 'الحسيمة', 'تيفلت', 'وزان', 'جرسيف', 'المضيق', 'الفنيدق', 'سوق الأربعاء', 'بوجدور', 'تنغير', 'زاكورة', 'ميدلت', 'اليوسفية', 'بن جرير'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                        {registrationData.city && !['الدار البيضاء', 'الرباط', 'فاس', 'مراكش', 'أكادير', 'طنجة', 'مكناس', 'وجدة', 'القنيطرة', 'تطوان', 'خريبكة', 'بني ملال', 'الجديدة', 'آسفي', 'سطات', 'برشيد', 'الخميسات', 'الناظور', 'تازة', 'المحمدية', 'سلا', 'تمارة', 'العرائش', 'كلميم', 'بركان', 'الفقيه بن صالح', 'تاوريرت', 'بوسكورة', 'ورزازات', 'العيون', 'الداخلة', 'تارودانت', 'قلعة السراغنة', 'سيدي سليمان', 'سيدي قاسم', 'تيزنيت', 'طانطان', 'شفشاون', 'الحسيمة', 'تيفلت', 'وزان', 'جرسيف', 'المضيق', 'الفنيدق', 'سوق الأربعاء', 'بوجدور', 'تنغير', 'زاكورة', 'ميدلت', 'اليوسفية', 'بن جرير'].includes(registrationData.city) && (
                          <option value={registrationData.city}>{registrationData.city}</option>
                        )}
                      </select>
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1B5E20] w-6 h-6" />
                      {isDetectingLocation && (
                        <Loader2 className="absolute left-12 top-1/2 -translate-y-1/2 text-[#1B5E20] w-5 h-5 animate-spin" />
                      )}
                    </div>

                    {selectedRole === 'buyer' && (
                      <div className="flex items-center gap-3 py-2">
                        <input 
                          className="w-5 h-5 rounded text-primary border-outline-variant focus:ring-primary" 
                          id="terms" 
                          type="checkbox"
                          checked={registrationData.termsAccepted}
                          onChange={(e) => setRegistrationData({...registrationData, termsAccepted: e.target.checked})}
                          required
                        />
                        <label className="text-sm text-[#1B5E20] font-bold" htmlFor="terms">أنا موافق على الشروط والأحكام</label>
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-16 bg-[#1B5E20] text-white font-black text-xl rounded-2xl shadow-xl shadow-[#1B5E20]/30 border border-transparent hover:bg-transparent hover:text-[#1B5E20] hover:border-[#1B5E20] transition-colors flex items-center justify-center gap-4 group disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      selectedRole === 'seller' ? 'أضف قطيع جديد' : 'تسجيل'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Side: Hero Image */}
          <div className="hidden md:block flex-1 relative">
            <img 
              src="https://i.ibb.co/hxCgrSY7/generated-image.jpg" 
              alt="خروف في جبال الأطلس" 
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black/20 via-transparent to-transparent"></div>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12 text-center">
              <h2 className="text-7xl lg:text-8xl font-black tracking-tighter mb-4 drop-shadow-2xl uppercase">سوق كسابكوم</h2>
              <p className="text-2xl lg:text-3xl font-bold max-w-xl leading-snug drop-shadow-lg">
                تميز المنتجات المغربية الأصيلة، <br /> من الكساب حتى لعندك للدار.
              </p>
              
              <div className="mt-12 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl flex items-center gap-4 shadow-2xl">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <BadgeCheck className="w-8 h-8 text-[#1B5E20]" />
                </div>
                <div className="text-right">
                  <p className="font-black text-xl">تربية مضمونة</p>
                  <p className="text-sm opacity-80">أصالة وجودة عالية</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header / Logo Area */}
          <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md px-6 py-4 flex justify-between items-center">
              <button onClick={() => onNavigate('home')} className="text-2xl font-black text-primary tracking-tight font-headline transition-colors border border-transparent hover:border-primary px-2 py-1 rounded-lg">
                Kessabcom
              </button>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setMode('login')}
                className="text-primary font-bold hover:underline"
              >
                تسجيل الدخول
              </button>
              <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <span className="font-medium">العربية</span>
              </button>
            </div>
          </header>

          <main className="flex-grow flex flex-col md:flex-row pt-16">
            {/* Left Side: Kessaba (Sellers) */}
            <section className="w-full md:w-1/2 min-h-[600px] flex items-center justify-center p-8 lg:p-16 relative overflow-hidden bg-surface-container-low">
              {/* Subtle Decorative Elements */}
              <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl"></div>
              <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-secondary/5 blur-3xl"></div>
              
              <div className="w-full max-w-md z-10">
                <div className="mb-10 text-center md:text-right">
                  <span className="bg-primary-fixed text-on-primary-fixed px-4 py-1.5 rounded-full text-xs font-bold mb-4 inline-block">
                    انضم للمجتمع ديالنا
                  </span>
                  <h1 className="text-4xl font-black text-on-surface font-headline leading-tight mb-4">
                    حساب الكساب
                  </h1>
                  <p className="text-on-surface-variant text-lg leading-relaxed">
                    انضم لأكبر تجمع للكسابة فالمغرب وبدا تبيع الغنم ديالك اليوم.
                  </p>
                  <div className="mt-6 p-4 bg-primary-fixed/20 rounded-xl border border-primary/10 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                       <BadgeCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-primary">2 إعلانات فابور</p>
                      <p className="text-sm text-on-surface-variant">بدا تجربتك بلا ما تخلص والو فاللول</p>
                    </div>
                  </div>
                </div>

                <form className="space-y-6" onSubmit={(e) => { 
                  e.preventDefault(); 
                  const formData = new FormData(e.currentTarget);
                  onRegisterSubmit('seller', {
                    fullName: formData.get('fullName'),
                    city: formData.get('city'),
                    phone: formData.get('phone')
                  });
                }}>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-surface-variant mr-1">الاسم الكامل</label>
                    <input name="fullName" className="w-full h-14 px-4 bg-surface-container-highest border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary transition-all" placeholder="كتب سميتك الكاملة" required type="text" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-surface-variant mr-1">المدينة</label>
                    <select name="city" className="w-full h-14 px-4 bg-surface-container-highest border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary transition-all" required>
                      <option value="">ختار المدينة ديالك</option>
                      <option>سطات</option>
                      <option>برشيد</option>
                      <option>خريبكة</option>
                      <option>بني ملال</option>
                      <option>فاس</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-surface-variant mr-1">رقم الهاتف</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-[10px] font-bold text-on-surface-variant border-r border-outline-variant pr-2">+212</span>
                      <input name="phone" className="w-full h-14 pl-12 pr-4 bg-surface-container-highest border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary transition-all text-left text-sm" dir="ltr" placeholder="6 XX XX XX XX" required type="tel" />
                    </div>
                  </div>

                  <button type="submit" className="w-full h-14 hero-gradient text-on-primary font-bold text-lg rounded-xl shadow-lg shadow-primary/20 border border-transparent hover:bg-transparent hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-3">
                    سجل دابا <ArrowLeft className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </section>

            {/* Right Side: Buyer (Mouchtari) */}
            <section className="w-full md:w-1/2 min-h-[600px] flex items-center justify-center p-8 lg:p-16 bg-surface-container-lowest border-r border-outline-variant/10">
              <div className="w-full max-w-md">
                <div className="mb-10 text-center md:text-right">
                  <h2 className="text-4xl font-black text-on-surface font-headline leading-tight mb-4">
                    حساب المشتري
                  </h2>
                  <p className="text-on-surface-variant text-lg">
                    قلب على أحسن السلالات المغربية واشري الأضحية ديالك بكل سهولة وأمان.
                  </p>
                </div>
                
                <form className="space-y-6" onSubmit={(e) => { 
                  e.preventDefault(); 
                  const formData = new FormData(e.currentTarget);
                  onRegisterSubmit('buyer', {
                    fullName: formData.get('fullName'),
                    phone: formData.get('phone'),
                    city: formData.get('city')
                  });
                }}>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-surface-variant mr-1">الاسم الكامل</label>
                    <input name="fullName" className="w-full h-14 px-4 bg-surface-container-low border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary transition-all" placeholder="كتب سميتك الكاملة" required type="text" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-surface-variant mr-1">رقم الهاتف</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 font-bold text-on-surface-variant border-r border-outline-variant pr-3">+212</span>
                      <input name="phone" className="w-full h-14 pl-20 pr-4 bg-surface-container-low border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary transition-all text-left" dir="ltr" placeholder="6 XX XX XX XX" required type="tel" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-on-surface-variant mr-1">المدينة</label>
                    <select name="city" className="w-full h-14 px-4 bg-surface-container-low border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary transition-all" required>
                      <option value="">ختار المدينة ديالك</option>
                      <option>سطات</option>
                      <option>برشيد</option>
                      <option>خريبكة</option>
                      <option>بني ملال</option>
                      <option>فاس</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 py-2">
                    <input className="w-5 h-5 rounded text-primary border-outline-variant focus:ring-primary" id="terms" type="checkbox" />
                    <label className="text-sm text-on-surface-variant" htmlFor="terms">أنا موافق على <a className="text-primary font-bold underline" href="#">الشروط والأحكام</a> و <a className="text-primary font-bold underline" href="#">سياسة الخصوصية</a> ديالنا.</label>
                  </div>
                  <button type="submit" className="w-full h-14 bg-surface-container-highest text-on-surface font-bold text-lg rounded-xl border border-transparent hover:bg-transparent hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-3">
                    سجل دابا
                    <UserPlus className="w-5 h-5" />
                  </button>
                  <div className="text-center pt-4">
                    <p className="text-on-surface-variant">عندك حساب؟ <button onClick={() => setMode('login')} className="text-primary font-bold hover:underline">تسجيل الدخول</button></p>
                  </div>
                </form>
              </div>
            </section>
          </main>
        </>
      )}
    </div>
  );
}
