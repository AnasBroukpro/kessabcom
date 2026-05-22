import React, { useState } from 'react';
import { Zap, Shield, Award, Flame, AlertCircle, X, Lock, Loader2, CheckCircle2, Phone, MessageCircle, MapPin, Image, ShieldCheck, Headphones, Megaphone, BadgeCheck } from 'lucide-react';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { firestoreService } from '../../services/firestoreService';

interface SubscriptionViewProps {
  settings: any;
  profile?: any;
  announcements?: any[];
}

const benefits = [
  { icon: Megaphone, label: '2 إعلان نشط' },
  { icon: Phone, label: 'استقبال المكالمات الهاتفية' },
  { icon: MessageCircle, label: 'استقبال رسائل واتساب' },
  { icon: MapPin, label: 'إظهار الموقع الجغرافي' },
  { icon: Image, label: 'صور وفيديوهات عالية الجودة' },
  { icon: ShieldCheck, label: 'حساب آمن ومؤمن' },
  { icon: BadgeCheck, label: 'شارة كساب موثوق' },
  { icon: Headphones, label: 'دعم فني عبر واتساب' },
];

const cancelReasons = [
  { value: 'no_need', label: 'لا أحتاج الخدمة' },
  { value: 'expensive', label: 'الخدمة مكلفة' },
  { value: 'technical', label: 'واجهت مشاكل تقنية' },
  { value: 'other_platform', label: 'سأستخدم منصة أخرى' },
  { value: 'other', label: 'أخرى' },
];

export default function SubscriptionView({ settings, profile, announcements = [] }: SubscriptionViewProps) {
  const userPlan = profile?.plan || 'مجاني';
  const listingsCount = Array.isArray(announcements) ? announcements.length : 0;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelStep, setCancelStep] = useState<'password' | 'reason'>('password');
  const [password, setPassword] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState('');

  const planLimits: Record<string, number> = {
    'مجاني': 2,
    'Free': 2,
    'باقة الانطلاق': 2,
    'احترافي': 20,
    'شركات': 50
  };

  const limit = planLimits[userPlan] || 2;
  const pct = Math.min(100, (listingsCount / limit) * 100);

  const planInfo = {
    'مجاني': {
      title: 'الباقة المجانية',
      desc: 'باقة البداية لإضافة قطيعك وتجربة المنصة',
      color: 'from-gray-600 to-slate-800',
      badgeBg: 'bg-slate-100 text-slate-800',
      limitText: '2 إعلانات كحد أقصى',
      icon: Zap
    },
    'Free': {
      title: 'الباقة المجانية',
      desc: 'باقة البداية لإضافة قطيعك وتجربة المنصة',
      color: 'from-gray-600 to-slate-800',
      badgeBg: 'bg-slate-100 text-slate-800',
      limitText: '2 إعلانات كحد أقصى',
      icon: Zap
    },
    'باقة الانطلاق': {
      title: 'باقة الانطلاق',
      desc: 'باقة الترحيب للمستخدمين الجدد — تفعيل الحساب',
      color: 'from-emerald-600 to-[#115E2C]',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      limitText: '2 إعلان',
      icon: Shield
    },
    'احترافي': {
      title: 'باقة الكساب المحترف',
      desc: 'الخيار الأفضل للكسابة المتوسطين لزيادة المبيعات',
      color: 'from-emerald-600 to-[#115E2C]',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      limitText: '20 إعلان',
      icon: Award
    },
    'شركات': {
      title: 'باقة الضيعة الكبيرة',
      desc: 'باقة احترافية متكاملة لأصحاب الضيعات الكبرى والشركات',
      color: 'from-blue-600 to-indigo-950',
      badgeBg: 'bg-blue-100 text-blue-800',
      limitText: '50 إعلان مع ترويج تلقائي',
      icon: Flame
    }
  };

  const currentPlan = planInfo[userPlan as keyof typeof planInfo] || planInfo['مجاني'];
  const PlanIcon = currentPlan.icon;

  const handlePasswordSubmit = async () => {
    if (!password) return;
    setIsVerifying(true);
    setCancelError('');

    try {
      const user = auth.currentUser;
      if (!user?.email) {
        throw new Error('البريد الإلكتروني مطلوب لتأكيد الهوية.');
      }

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      setCancelStep('reason');
      setPassword('');
    } catch (e: any) {
      if (e.code === 'auth/wrong-password') {
        setCancelError('كلمة المرور غير صحيحة.');
      } else {
        setCancelError(e.message || 'حدث خطأ، حاول مرة أخرى.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReasonSubmit = async () => {
    if (!cancelReason) return;
    setIsSubmitting(true);
    setCancelError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('المستخدم غير موجود.');

      const reasonLabel = cancelReasons.find(r => r.value === cancelReason)?.label || cancelReason;

      await firestoreService.createSupportRequest('cancel_subscription', {
        name: profile?.fullName || profile?.displayName || profile?.pseudo || 'غير معروف',
        phone: profile?.phoneNumber || profile?.phone || '',
        sellerId: user.uid,
        action: 'cancel_subscription',
        reason: cancelReason,
        reasonLabel,
        customMessage,
        details: `سبب الإلغاء: ${reasonLabel}\nرسالة إضافية: ${customMessage || '—'}`
      });

      setCancelSuccess('تم إرسال طلب إلغاء الاشتراك بنجاح! جاري تحويلك إلى واتساب...');

      const message = encodeURIComponent(
        `السلام عليكم، تأكيد طلب إلغاء الاشتراك:\n\nالاسم: ${profile?.fullName || profile?.pseudo || 'غير معروف'}\nالمعرف: ${user.uid}\nالسبب: ${reasonLabel}${customMessage ? `\nرسالتك: ${customMessage}` : ''}`
      );
      window.open(`https://wa.me/212700110711?text=${message}`, '_blank');

      setTimeout(() => {
        setShowCancelModal(false);
        setCancelStep('password');
        setPassword('');
        setCancelReason('');
        setCustomMessage('');
        setCancelError('');
        setCancelSuccess('');
      }, 3000);
    } catch (e: any) {
      setCancelError(e.message || 'حدث خطأ، حاول مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    if (isVerifying || isSubmitting) return;
    setShowCancelModal(false);
    setCancelStep('password');
    setPassword('');
    setCancelReason('');
    setCustomMessage('');
    setCancelError('');
    setCancelSuccess('');
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 text-right" dir="rtl">
      <div>
        <h2 className="text-2xl font-black text-[#1A1A1A] font-headline tracking-tight">اشتراكي الحالي</h2>
        <p className="text-[#757575] text-sm mt-1">تتبع استهلاك باقتك الحالية</p>
      </div>

      {/* Card principal de l'abonnement actuel */}
      <div className={`relative overflow-hidden rounded-3xl border border-outline-variant/10 shadow-2xl p-8 bg-gradient-to-br ${currentPlan.color} text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 group`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>

        <div className="space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-black">
            <PlanIcon className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
            <span>{currentPlan.title}</span>
          </div>

          <h3 className="text-3xl font-black font-headline tracking-tight">{currentPlan.title}</h3>
          <p className="text-white/80 font-medium max-w-md">{currentPlan.desc}</p>
          <p className="text-xs text-white/60 font-bold bg-black/20 inline-block px-3 py-1 rounded-lg">حسابك نشط ومؤمن بالكامل</p>
        </div>

        <div className="w-full lg:w-auto bg-white/10 backdrop-blur-xl rounded-[20px] p-6 border border-white/10 min-w-[280px] space-y-4 relative z-10">
          <div className="flex justify-between items-center text-sm font-black">
            <span>الإعلانات المنشأة</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs">
              {listingsCount} / {limit} إعلان منشأة
            </span>
          </div>

          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-300 rounded-full transition-all duration-1000 ease-out shadow-lg"
              style={{ width: `${pct}%` }}
            />
          </div>

          {userPlan === 'باقة الانطلاق' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full py-3 bg-red-500/80 hover:bg-red-600 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              <span>إلغاء الاشتراك</span>
            </button>
          )}
        </div>
      </div>

      {/* Benefits List */}
      {userPlan === 'باقة الانطلاق' && (
        <div className="bg-white rounded-3xl border border-[#115E2C]/10 shadow-md p-8">
          <h3 className="text-xl font-black text-[#1A1A1A] mb-6">مزايا باقة الانطلاق</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#F5F5F0] rounded-2xl p-4">
                <div className="w-10 h-10 bg-[#115E2C]/10 rounded-xl flex items-center justify-center shrink-0">
                  <b.icon className="w-5 h-5 text-[#115E2C]" />
                </div>
                <span className="font-bold text-sm text-[#1A1A1A]">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closeModal}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-black text-[#1A1A1A]">
                {cancelStep === 'password' ? 'تأكيد إلغاء الاشتراك' : 'لماذا تريد إلغاء الاشتراك؟'}
              </h3>
            </div>

            {cancelSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-sm font-bold text-green-700">{cancelSuccess}</p>
              </div>
            ) : (
              <>
                {cancelError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm font-bold text-red-700">
                    {cancelError}
                  </div>
                )}

                {/* Step 1: Password */}
                {cancelStep === 'password' && (
                  <>
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm font-bold text-red-700 leading-relaxed">
                          يرجى إدخال كلمة المرور لتأكيد هويتك قبل متابعة طلب إلغاء الاشتراك.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <label className="block text-sm font-black text-[#1A1A1A]">كلمة المرور</label>
                      <div className="relative">
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="أدخل كلمة المرور"
                          className="w-full pr-12 pl-4 py-3.5 border-2 border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-red-500 transition-colors"
                          onKeyDown={e => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={closeModal}
                        disabled={isVerifying}
                        className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={handlePasswordSubmit}
                        disabled={isVerifying || !password}
                        className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جاري التحقق...</span>
                          </>
                        ) : (
                          <span>تأكيد</span>
                        )}
                      </button>
                    </div>
                  </>
                )}

                {/* Step 2: Reason */}
                {cancelStep === 'reason' && (
                  <>
                    <div className="space-y-3 mb-6">
                      {cancelReasons.map(r => (
                        <label
                          key={r.value}
                          className={`flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                            cancelReason === r.value
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="cancelReason"
                            value={r.value}
                            checked={cancelReason === r.value}
                            onChange={e => setCancelReason(e.target.value)}
                            className="w-4 h-4 accent-red-600"
                          />
                          <span className="text-sm font-bold text-[#1A1A1A]">{r.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="space-y-2 mb-6">
                      <label className="block text-sm font-black text-[#1A1A1A]">رسالة إضافية (اختياري)</label>
                      <textarea
                        value={customMessage}
                        onChange={e => setCustomMessage(e.target.value)}
                        placeholder="اكتب رسالتك هنا..."
                        rows={4}
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-red-500 transition-colors resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => { setCancelStep('password'); setPassword(''); setCancelError(''); }}
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
                      >
                        رجوع
                      </button>
                      <button
                        onClick={handleReasonSubmit}
                        disabled={isSubmitting || !cancelReason}
                        className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جاري الإرسال...</span>
                          </>
                        ) : (
                          <span>إرسال الطلب</span>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
