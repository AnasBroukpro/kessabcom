import React, { useState, useEffect } from 'react';
import { ViewType } from '../App';
import { firestoreService } from '../services/firestoreService';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Lock, 
  Loader2, 
  Mail, 
  KeyRound, 
  UserPlus, 
  LogIn, 
  RefreshCcw,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onNavigate: (view: ViewType) => void;
}

type AuthStep = 'login' | 'reset';

export default function AdminAuth({ onNavigate }: Props) {
  const { profile, refreshProfile } = useAuth();
  const [email, setEmail] = useState('anas.brouk@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<AuthStep>('login');

  useEffect(() => {
    if (profile?.role === 'admin') {
      onNavigate('admin');
    }
  }, [profile, onNavigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('المرجو إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    if (email.trim() !== 'anas.brouk@gmail.com') {
      setError('هذا البريد الإلكتروني غير مصرح له بالدخول كمسؤول.');
      return;
    }

    setLoading(true);

    try {
      if (step === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        
        // After login, ensure profile is synced as admin
        try {
          await firestoreService.syncUser(userCredential.user.uid, email.trim(), 'Anas Brouk', 'admin');
        } catch (apiErr) {
          console.warn('API Sync failed, but continuing login:', apiErr);
          // If the backend is down, we still want to log in if the user is authentic
        }
        
        await refreshProfile();
        onNavigate('admin');
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('معلومات الدخول غير صحيحة.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('هذا البريد الإلكتروني مستخدم بالفعل.');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً.');
      } else {
        setError('فشل في عملية المصادقة. المرجو المحاولة لاحقاً.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('المرجو إدخال البريد الإلكتروني أولاً.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
    } catch (err: any) {
      setError('فشل في إرسال رابط إعادة التعيين.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-6 font-mono" dir="rtl">
      <div className="w-full max-w-md bg-[#1E1E1E] border border-[#333] rounded-sm p-8 shadow-2xl relative overflow-hidden">
        {/* Technical Grid Background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8 border-b border-[#333] pb-6">
            <div className="p-2 bg-primary/10 rounded-sm">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic">كسابكوم أدمن</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                {step === 'login' ? 'الدخول الآمن' : 'إعادة تعيين كلمة المرور'}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 text-red-400 text-xs font-bold rounded-sm flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-900/50 text-green-400 text-xs font-bold rounded-sm flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {step !== 'reset' ? (
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                      className="w-full h-14 pr-12 pl-4 bg-[#121212] border border-[#333] rounded-sm text-white font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-left" 
                      dir="ltr" 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="anas.brouk@gmail.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold">كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                      className="w-full h-14 pr-12 pl-12 bg-[#121212] border border-[#333] rounded-sm text-white font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-left" 
                      dir="ltr" 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px]">
                <button 
                  type="button"
                  onClick={() => setStep('reset')}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-primary text-on-primary font-black text-sm uppercase tracking-widest rounded-sm transition-colors border border-transparent hover:bg-transparent hover:text-primary hover:border-primary flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    تسجيل الدخول
                    <LogIn className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="p-6 bg-surface-container-high/5 border border-[#333] rounded-xl text-center space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <RefreshCcw className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-sm">استعادة كلمة المرور</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    أدخل بريدك الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold">البريد الإلكتروني</label>
                <input 
                  className="w-full h-14 px-4 bg-[#121212] border border-[#333] rounded-sm text-white font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-left" 
                  dir="ltr" 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-white text-black font-black text-sm uppercase tracking-widest rounded-sm transition-colors border border-white hover:bg-transparent hover:text-white flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    إرسال الرابط
                    <Mail className="w-4 h-4" />
                  </>
                )}
              </button>

              <button 
                type="button"
                onClick={() => setStep('login')}
                className="w-full text-xs text-gray-500 hover:text-white text-center"
              >
                العودة لتسجيل الدخول
              </button>
            </form>
          )}

          <div className="mt-12 pt-6 border-t border-[#333] flex justify-between items-center text-[9px] text-gray-600 uppercase tracking-tighter">
            <span>Firebase Security: Active</span>
            <button onClick={() => onNavigate('home')} className="hover:text-white px-2 py-1 rounded border border-transparent hover:border-gray-600 transition-colors">Back to Site</button>
          </div>
        </div>
      </div>
    </div>
  );
}
