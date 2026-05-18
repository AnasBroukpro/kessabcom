import React, { useState, useEffect, useRef } from 'react';
import { ViewType } from '../App';
import { MapPin, Loader2, Eye, EyeOff, CheckCircle2, ArrowRight, Search, ChevronDown, Star, BarChart2, Navigation, Bell, Package, ShieldCheck, Users, Image, FileText, PhoneCall, BookOpen, X } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import {
  collection, query, where, limit, getDocs, doc, setDoc, serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { cityCoords, normalizeArabic } from '../constants/cityMapping';

// Import marketing images
import img1 from '../assets/marketing/branding/img1.webp';
import img2 from '../assets/marketing/branding/img2.webp';
import img3 from '../assets/marketing/branding/img3.webp';
import img4 from '../assets/marketing/branding/img4.webp';
import img5 from '../assets/marketing/branding/img5.webp';
import img6 from '../assets/marketing/branding/img6.webp';
import logoV2 from '../assets/marketing/branding/logo v2.png';

const marketingImages = [img1, img2, img3, img4, img5, img6];

// ─── City Search Input Component ─────────────────────────────────────────────
function CitySearchInput({ value, onChange, isDetecting, allCities }: {
  value: string;
  onChange: (city: string) => void;
  isDetecting: boolean;
  allCities: string[];
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync external value (e.g., from geolocation)
  useEffect(() => { setQuery(value); }, [value]);

  const filtered = query.trim().length === 0
    ? allCities.slice(0, 15) // Show more initial cities
    : allCities.filter(c => {
        const normSearch = normalizeArabic(query);
        return normalizeArabic(c).includes(normSearch) || c.toLowerCase().includes(query.toLowerCase());
      }).slice(0, 50); // Show up to 50 matches for better selection

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (city: string) => {
    setQuery(city);
    onChange(city);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative group">
      <div className={`flex items-center w-full h-14 bg-[#F9F9F6] border-2 rounded-2xl transition-all ${
        open ? 'border-[#2E7D32] bg-white shadow-lg shadow-[#2E7D32]/10' : 'border-outline-variant/20'
      }`}>
        {/* Dropdown Arrow (Visually "Outside" the interaction zone) */}
        <div 
          onClick={() => setOpen(o => !o)}
          className="h-full px-4 flex items-center justify-center border-r border-[#E0E0E0] cursor-pointer hover:bg-gray-100 transition-colors rounded-l-2xl"
        >
          <ChevronDown
            className={`w-5 h-5 text-[#2E7D32] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </div>

        {/* Input Area */}
        <div className="relative flex-1 h-full">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            {isDetecting ? (
              <Loader2 className="w-5 h-5 text-[#2E7D32] animate-spin shrink-0" />
            ) : (
              <MapPin className="w-5 h-5 text-[#2E7D32] shrink-0" />
            )}
          </div>
          
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); onChange(''); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={isDetecting ? 'جاري الكشف عن موقعك...' : 'اختر مدينتك...'}
            className="w-full h-full bg-transparent border-none outline-none text-base font-black text-[#1A1A1A] text-right pr-12 pl-4 placeholder:text-[#757575]/50"
            dir="rtl"
          />
        </div>
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 max-h-60 overflow-y-auto z-[200] p-1.5 animate-in slide-in-from-top-2 duration-200">
          {query.trim().length > 0 && !allCities.includes(query) && (
            <button
              type="button"
              onClick={() => select(query)}
              className="w-full text-right px-4 py-2.5 rounded-xl text-sm font-black text-[#2E7D32] bg-[#E8F5E9] hover:bg-[#C8E6C9] transition-colors mb-1"
            >
              ✏️ استخدم "{query}" مباشرة
            </button>
          )}
          {filtered.map(city => (
            <button
              key={city}
              type="button"
              onClick={() => select(city)}
              className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                city === value ? 'bg-[#2E7D32] text-white' : 'text-[#1A1A1A] hover:bg-[#F9F9F6]'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Onboarding Page Component ───────────────────────────────────────────────
function OnboardingModal({ role, name, onDone }: { role: 'seller' | 'buyer'; name: string; onDone: () => void }) {
  const isSeller = role === 'seller';
  const features = isSeller ? [
    { icon: MapPin, label: 'حدد موقع الضيعة ديالك بدقة على الخريطة' },
    { icon: Image, label: 'دخل تصاور القطيع ديالك' },
    { icon: FileText, label: 'دخل المعلومات ديال القطيع' },
    { icon: PhoneCall, label: 'صافي! راك واجد باش تستقبل طلبات المشترين' },
  ] : [
    { icon: Search, label: 'قلب على الحولي لي قراب منك بالمدينة والصنف' },
    { icon: Navigation, label: 'شوف موقع الضيعة على الخريطة قبل ما تتنقل' },
    { icon: Users, label: 'تواصل مع الكسابة ديريكت بلا وسيط' },
    { icon: ShieldCheck, label: 'سجل طلبك وسلم على الكسابة لي عندهم الحولي لي بغيتي' },
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-white overflow-y-auto" dir="rtl">
      <div className="w-full min-h-full flex flex-col bg-white animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] p-8 sm:p-10 text-center relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
          <div className="w-20 h-20 bg-white/15 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
            {isSeller ? '🐑' : '🛒'}
          </div>
          <h2 className="text-white font-black text-2xl sm:text-3xl mb-2 font-headline">
            مبروك عليك يا {name.split(' ')[0]}! 🎉
          </h2>
          <p className="text-[#A5D6A7] font-bold text-base sm:text-lg">
            {isSeller
              ? 'نجحت في إنشاء حساب كساب على منصة kessabcom.ma'
              : 'نجحت في إنشاء حسابك على منصة kessabcom.ma'}
          </p>
        </div>

        {/* Body */}
        <div className="p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-5 h-5 text-[#2E7D32] fill-[#2E7D32]" />
            <p className="text-[#1A1A1A] font-black text-lg">
              {isSeller ? 'باش تبدا تبيع، خاصك:' : 'باش تستافيد من كل شي، يمكنك:'}
            </p>
          </div>
          <div className="space-y-4 mb-10">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-[#F9F9F6] rounded-2xl border border-black/5 hover:bg-[#F3F4ED] transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] flex items-center justify-center shrink-0 shadow-sm">
                  <f.icon className="w-6 h-6 text-[#2E7D32]" />
                </div>
                <p className="text-base sm:text-lg font-bold text-[#4A4A4A] leading-snug">{f.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={onDone}
              className="w-full h-16 bg-[#2E7D32] text-white rounded-2xl font-black text-xl shadow-xl shadow-[#2E7D32]/30 hover:shadow-[#2E7D32]/40 active:scale-[0.98] hover:-translate-y-1 transition-all"
            >
              {isSeller ? '🚀 أنشئ أول إعلان دابا' : '🔍 قلب على حولي دابا'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
  intendedView?: { view: ViewType; listingId?: string } | null;
}

export default function Auth({ onNavigate, intendedView }: Props) {
  const { refreshProfile, updateProfileState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [phoneChecked, setPhoneChecked] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; password?: string; general?: string }>({});
  const [showSupportSuccess, setShowSupportSuccess] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{ view: ViewType } | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const allCities = Object.keys(cityCoords).sort();
  
  // 10-digit phone input logic
  const [phoneDigits, setPhoneDigits] = useState(['0', '', '', '', '', '', '', '', '', '']);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const fullPhone = phoneDigits.join('');
    setPhoneNumber(fullPhone);
  }, [phoneDigits]);

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

    // Auto-focus next
    if (value && index < 9) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !phoneDigits[index] && index > 1) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData) {
      const newDigits = [...phoneDigits];
      // Skip the first '0' if the pasted data already starts with 0 or just fill from index 1
      const startIdx = pastedData.startsWith('0') ? 0 : 1;
      const dataToFill = pastedData.startsWith('0') ? pastedData : pastedData;
      
      let dataIdx = 0;
      for (let i = startIdx; i < 10 && dataIdx < dataToFill.length; i++) {
        newDigits[i] = dataToFill[dataIdx];
        dataIdx++;
      }
      setPhoneDigits(newDigits);
    }
  };

  const getInternalEmail = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('212')) clean = clean.substring(3);
    if (clean.startsWith('0')) clean = clean.substring(1);
    return `${clean}@kessabcom.ma`;
  };

  const getFormattedPhone = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('212')) clean = clean.substring(3);
    if (clean.startsWith('0')) clean = clean.substring(1);
    return `+212${clean}`;
  };

  // ─── STEP 1: Login or detect new user ───────────────────────────────────────
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    
    // 1. Validate Moroccan Format
    const fullPhone = phoneDigits.join('');
    const moroccanRegex = /^0(5|6|7)\d{8}$/;
    
    if (!fullPhone || fullPhone.length < 10) {
      setFieldErrors({ phone: 'يرجى إدخال رقم الهاتف كاملاً' });
      return;
    }
    
    if (!moroccanRegex.test(fullPhone)) {
      setFieldErrors({ phone: 'رقم الهاتف غير صحيح. يجب أن يبدأ بـ 05 أو 06 أو 07' });
      return;
    }

    if (!password) {
      setFieldErrors({ password: 'يرجى إدخال كلمة المرور' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to sign in directly — avoids depending on check-phone endpoint entirely
      const result = await signInWithEmailAndPassword(
        auth,
        getInternalEmail(phoneNumber),
        password
      );

      // Force-refresh token then fetch profile
      await result.user.getIdToken(true);
      await refreshProfile();
      const profileData = await firestoreService.getUserProfile(result.user.uid);

      if (profileData?.role) {
        let targetView = profileData.role as ViewType;
        if (profileData.role === 'seller') {
          const hasListings = await firestoreService.hasUserListings(result.user.uid);
          targetView = hasListings ? 'seller' : 'add-listing';
        }
        let finalView = targetView;
        
        if (intendedView) {
          if (profileData.role === 'buyer' && (intendedView.view === 'seller' || intendedView.view === 'add-listing' || intendedView.view === 'admin')) {
            finalView = 'buyer';
          } else if (profileData.role === 'seller' && (intendedView.view === 'buyer' || intendedView.view === 'admin')) {
            finalView = targetView;
          } else {
            finalView = intendedView.view;
          }
        }
        
        onNavigate(
          finalView,
          intendedView?.listingId,
          undefined,
          undefined,
          finalView === 'buyer' ? 'dashboard' : undefined
        );
        return;
      } else {
        // Auth exists but no Firestore profile → let them complete registration
        setIsNewUser(true);
        setPhoneChecked(true);
      }
    } catch (loginErr: any) {
      const code: string = loginErr?.code || '';

      if (code === 'auth/wrong-password') {
        setFieldErrors({ password: 'كلمة المرور غير صحيحة.' });
      } else if (code === 'auth/invalid-credential') {
        // Firebase v10+ returns 'invalid-credential' for BOTH wrong password AND user not found.
        // We must check Firestore to distinguish.
        try {
          const { exists } = await firestoreService.checkPhoneExists(getFormattedPhone(phoneNumber));
          if (exists) {
            setFieldErrors({ password: 'كلمة المرور غير صحيحة.' });
          } else {
            setIsNewUser(true);
            setPhoneChecked(true);
          }
        } catch {
          // Fallback to registration if API fails
          setIsNewUser(true);
          setPhoneChecked(true);
        }
      } else if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        // Account doesn't exist in Auth → new user
        setIsNewUser(true);
        setPhoneChecked(true);
      } else if (code === 'auth/too-many-requests') {
        setError('تم حظر الحساب مؤقتاً بسبب كثرة المحاولات. حاول لاحقاً.');
      } else {
        // Fallback: check phone in Firestore
        try {
          const { exists } = await firestoreService.checkPhoneExists(getFormattedPhone(phoneNumber));
          if (!exists) {
            setIsNewUser(true);
            setPhoneChecked(true);
          } else {
            setError('وقع خطأ أثناء تسجيل الدخول. حاول مرة أخرى.');
          }
        } catch {
          setError('وقع خطأ. حاول مرة أخرى.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 2: Register new user ───────────────────────────────────────────────
  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFieldErrors({});
    
    if (!selectedRole) { 
      setFieldErrors({ general: 'يرجى اختيار نوع الحساب (كساب أو مشتري)' }); 
      return; 
    }
    if (!fullName.trim()) { setFieldErrors({ general: 'يرجى إدخال اسمك الكامل' }); return; }
    if (!city) { setFieldErrors({ general: 'يرجى اختيار مدينتك' }); return; }

    setLoading(true);
    setError(null);

    try {
      const email = getInternalEmail(phoneNumber);
      const formattedPhone = getFormattedPhone(phoneNumber);
      console.log('📝 Registering:', email, '| role:', selectedRole);

      // Prevent App.tsx from auto-redirecting us away while we show the onboarding modal
      sessionStorage.setItem('isRegistering', 'true');

      // 1. Create Firebase Auth user
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = result.user;

      // 2. Force-refresh token so subsequent API calls have a valid Bearer token
      const token = await result.user.getIdToken(true);
      console.log('✅ Auth user created:', uid);

      // 3. Write Firestore profile directly from the client (fail-safe)
      //    This guarantees data exists even if the server-side API call fails.
      const profileData = {
        uid,
        email,
        fullName: fullName.trim(),
        displayName: fullName.trim(),
        phoneNumber: formattedPhone,
        whatsappNumber: selectedRole === 'seller' ? formattedPhone : '',
        role: selectedRole,
        pseudo: selectedRole === 'seller' ? pseudo.trim() : '',
        city,
        location: city,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', uid), profileData, { merge: true });
      console.log('✅ Firestore profile written (client-side)');

      // 4. Best-effort server sync — does NOT block navigation on failure
      fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid,
          email,
          fullName: fullName.trim(),
          role: selectedRole,
          pseudo: selectedRole === 'seller' ? pseudo.trim() : '',
          phone: formattedPhone,
          city,
        }),
      }).catch((err) =>
        console.warn('⚠️ Server sync failed (profile already in Firestore):', err)
      );

      updateProfileState(profileData as any);

      // Show onboarding modal first, then navigate
      const targetView: ViewType = intendedView?.view || (selectedRole === 'seller' ? 'add-listing' : 'buyer');
      setPendingNavigation({ view: targetView });
      setShowOnboarding(true);
    } catch (err: any) {
      console.error('❌ Register error:', err.code, err.message);
      if (err.code === 'auth/operation-not-allowed') {
        setError('خدمة التسجيل غير مفعلة. يرجى التواصل مع المسؤول.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('هذا الرقم مسجل بالفعل. حاول تسجيل الدخول بكلمة المرور الصحيحة.');
        setIsNewUser(false);
        setPhoneChecked(false);
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة. يجب أن تكون 6 أحرف على الأقل.');
      } else {
        setError(`وقع خطأ أثناء إنشاء الحساب. (${err.code || 'unknown'})`);
      }
    } finally {
      setLoading(false);
    }
  };


  // Detect location for new users
  useEffect(() => {
    if (isNewUser && phoneChecked && 'geolocation' in navigator) {
      setIsDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
            );
            const data = await res.json();
            const detectedCity =
              data.address?.city || data.address?.town || data.address?.state || '';
            if (detectedCity) setCity(detectedCity);
          } catch { /* ignore */ } finally {
            setIsDetectingLocation(false);
          }
        },
        () => setIsDetectingLocation(false)
      );
    }
  }, [isNewUser, phoneChecked]);

  const handleOnboardingDone = () => {
    setShowOnboarding(false);
    sessionStorage.removeItem('isRegistering');
    if (pendingNavigation) {
      setTimeout(() => onNavigate(pendingNavigation.view), 50);
    }
  };

  return (
    <div className="h-screen w-full flex bg-white overflow-hidden" dir="rtl">
      {showOnboarding && selectedRole && (
        <OnboardingModal
          role={selectedRole}
          name={fullName || 'صاحبنا'}
          onDone={handleOnboardingDone}
        />
      )}
      {/* Background Decor (Only for form side) */}
      <div className="absolute inset-0 lg:w-1/2 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <button 
        onClick={() => onNavigate('home')}
        className="fixed top-6 right-6 z-50 flex flex-row-reverse items-center gap-2 bg-white px-5 py-2.5 rounded-full text-sm font-black shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-all transform hover:scale-105 active:scale-95 group text-[#1A1A1A]"
      >
        <span>الرئيسية</span>
        <ArrowRight className="w-4 h-4 text-[#2E7D32]" />
      </button>

      {/* LEFT: AUTH FORM (Displayed on the right in RTL) */}
      <div className="flex-[1.2] lg:flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative z-10 bg-[#FDFCF8]">
        <div className="w-full max-w-[440px] bg-white rounded-[32px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-outline-variant/10 animate-in fade-in slide-in-from-bottom-4 duration-700">

          <div className="text-center mb-8">
            <div className="w-[154px] md:w-[180px] mx-auto mb-6 flex items-center justify-center">
              <img 
                src={logoV2} 
                alt="منصة kessabcom.ma" 
                className="w-full h-auto"
              />
            </div>
            <h1 className="text-2xl font-black text-on-surface mb-1 font-headline">تسجيل الدخول</h1>
            <p className="text-on-surface-variant font-medium leading-relaxed mb-4">
              على سلامتك، توحشناك في السوق
            </p>
            <button 
              onClick={() => setShowTutorial(true)}
              className="inline-flex items-center gap-2 text-xs font-black text-[#2E7D32] bg-[#E8F5E9] px-4 py-2 rounded-full border border-[#2E7D32]/10 hover:bg-[#C8E6C9] transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>كيفاش نصوب حساب؟</span>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold text-center">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          <form
            onSubmit={
              phoneChecked
                ? isNewUser
                  ? handleRegister
                  : handleInitialSubmit
                : handleInitialSubmit
            }
            className="space-y-4"
          >
            {/* Phone & Password */}
            {/* Phone Input with Inline Error */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-black text-on-surface-variant mb-4 text-right">رقم الهاتف</label>
                <div className="flex flex-row justify-between gap-1 sm:gap-2" dir="ltr" onPaste={handlePaste}>
                  {phoneDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`digit-${idx}`}
                      ref={el => digitRefs.current[idx] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      readOnly={idx === 0}
                      disabled={phoneChecked}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      className={`w-full h-12 sm:h-14 text-center text-xl font-black rounded-xl border-2 transition-all outline-none ${
                        idx === 0 || digit ? 'text-[#2E7D32]' : 'text-[#1A1A1A]'
                      } ${
                        idx === 0 ? 'bg-[#E8F5E9] border-[#2E7D32]/20' :
                        fieldErrors.phone ? 'border-red-500 bg-red-50/30' :
                        'border-outline-variant/20 bg-[#F9F9F6] focus:border-primary focus:bg-white focus:shadow-lg focus:shadow-primary/10'
                      } ${phoneChecked ? 'opacity-50' : ''}`}
                    />
                  ))}
                </div>
                {fieldErrors.phone && (
                  <p className="text-right text-xs font-black text-red-500 pr-1 animate-in slide-in-from-top-1">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              {/* Password Input with Inline Error */}
              <div className="space-y-2 mt-4">
                <label className="block text-sm font-black text-on-surface-variant mb-4 text-right">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="كلمة المرور"
                    value={password}
                    disabled={phoneChecked && !isNewUser}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full h-14 bg-[#F9F9F6] border-2 rounded-2xl px-4 text-lg text-center font-black focus:border-primary focus:bg-white focus:shadow-lg focus:shadow-primary/10 transition-all placeholder:text-outline-variant/60
                      ${fieldErrors.password ? 'border-red-500 bg-red-50/30' : 'border-outline-variant/20'}
                      ${phoneChecked && !isNewUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-right text-xs font-black text-red-500 pr-1 animate-in slide-in-from-top-1">
                    {fieldErrors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Registration extra fields */}
            {phoneChecked && isNewUser && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('seller')}
                    className={`h-14 rounded-2xl text-base font-black border-2 transition-all ${selectedRole === 'seller' ? 'border-primary bg-primary text-on-primary shadow-lg shadow-primary/20' : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:border-primary/50'}`}
                  >
                    أنا كساب
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('buyer')}
                    className={`h-14 rounded-2xl text-base font-black border-2 transition-all ${selectedRole === 'buyer' ? 'border-primary bg-primary text-on-primary shadow-lg shadow-primary/20' : 'border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:border-primary/50'}`}
                  >
                    أنا مشتري
                  </button>
                </div>
                {fieldErrors.general && !selectedRole && (
                  <p className="text-center text-xs font-black text-red-500 animate-pulse">
                    {fieldErrors.general}
                  </p>
                )}
                <input
                  type="text"
                  placeholder="الاسم الكامل"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-14 bg-[#F9F9F6] border-2 border-outline-variant/20 rounded-2xl px-4 text-base text-center font-black focus:border-primary focus:bg-white transition-all"
                  required
                />
                {selectedRole === 'seller' && (
                  <input
                    type="text"
                    placeholder="اللقب (اختياري) - مثلا: الحاج التهامي"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    className="w-full h-14 bg-[#F9F9F6] border-2 border-outline-variant/20 rounded-2xl px-4 text-base text-center font-black focus:border-primary focus:bg-white transition-all"
                  />
                )}
                <CitySearchInput
                  value={city}
                  onChange={setCity}
                  isDetecting={isDetectingLocation}
                  allCities={allCities}
                />
              </div>
            )}

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
              ) : !phoneChecked ? (
                <span className="animate-shake">
                  <span className="text-swap-container">
                    <span className="text-swap-1">دخول</span>
                    <span className="text-swap-2">اضغط هنا</span>
                  </span>
                </span>
              ) : isNewUser ? (
                <span>إنشاء الحساب</span>
              ) : (
                <span className="animate-shake">
                  <span className="text-swap-container">
                    <span className="text-swap-1">دخول</span>
                    <span className="text-swap-2">اضغط هنا</span>
                  </span>
                </span>
              )}
            </button>

            {!phoneChecked && (
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="w-full text-center text-sm md:text-base text-[#115E2C] font-black hover:underline mt-6"
              >
                نسيت كلمة المرور؟
              </button>
            )}

            {phoneChecked && (
              <button
                type="button"
                onClick={() => { setPhoneChecked(false); setIsNewUser(false); setError(null); }}
                className="w-full text-center text-[10px] text-black/30 font-bold hover:text-black/60"
              >
                رجوع
              </button>
            )}
          </form>
        </div>
      </div>

      {/* RIGHT: VISUAL MARQUEE (DESKTOP) */}
      <div className="hidden lg:flex flex-1 bg-neutral-50 border-r border-black/5 relative overflow-hidden">
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-neutral-50 via-transparent to-neutral-50"></div>
        <div className="grid grid-cols-2 gap-8 w-full h-full p-8">
          <div className="flex flex-col gap-8 animate-marquee-up">
            {[...marketingImages, ...marketingImages].map((img, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-2 shadow-sm border border-black/5">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100">
                  <img
                    src={img}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-8 animate-marquee-down">
            {[...marketingImages, ...marketingImages].reverse().map((img, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-2 shadow-sm border border-black/5">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100">
                  <img
                    src={img}
                    className="w-full h-full object-cover grayscale-[0.2]"
                    alt=""
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee-up { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        @keyframes marquee-down { 0% { transform: translateY(-50%); } 100% { transform: translateY(0); } }
        .animate-marquee-up { animation: marquee-up 60s linear infinite; }
        .animate-marquee-down { animation: marquee-down 60s linear infinite; }
      `}} />
      {showTutorial && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowTutorial(false)}>
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowTutorial(false)}
              className="absolute top-6 right-6 z-10 bg-white/20 hover:bg-white/40 text-white p-2.5 rounded-full transition-colors backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>
            <iframe 
              src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
