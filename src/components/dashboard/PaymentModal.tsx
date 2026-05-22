import React, { useState } from 'react';
import { X, CreditCard, RefreshCw, CheckCircle, Clock, Copy, Check, FlaskConical } from 'lucide-react';
import { monetizationService } from '../../services/monetizationService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerName: string;
  onActivated: () => void;
}

type ModalStep = 'intro' | 'generating' | 'waiting' | 'checking' | 'success' | 'error';

export default function PaymentModal({
  isOpen,
  onClose,
  sellerName,
  onActivated,
}: PaymentModalProps) {
  const [step, setStep] = useState<ModalStep>('intro');
  const [paymentData, setPaymentData] = useState<{
    paymentId: string;
    token: string;
    amount: number;
    dateExpiration: string;
    instructions: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePayment = async () => {
    setStep('generating');
    setErrorMsg('');
    try {
      const result = await monetizationService.initiateAccountActivation();
      setPaymentData(result);
      setStep('waiting');
    } catch (e: any) {
      setErrorMsg(e.message || 'حدث خطأ. حاول مرة أخرى.');
      setStep('error');
    }
  };

  const handleCheckPayment = async () => {
    if (!paymentData) return;
    setStep('checking');
    try {
      const result = await monetizationService.checkPaymentStatus(paymentData.paymentId);
      if (result.listingReactivated || (result as any).accountActivated) {
        setStep('success');
        setTimeout(() => {
          onActivated();
          onClose();
        }, 2500);
      } else if (result.status === 'expired') {
        setErrorMsg('الكود انتهت مدته. اضغط "ابدأ من جديد" باش تولد كود جديد.');
        setStep('error');
      } else {
        setStep('waiting');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'حدث خطأ. حاول مرة أخرى.');
      setStep('error');
    }
  };

  const handleCopyToken = () => {
    if (!paymentData?.token) return;
    navigator.clipboard.writeText(paymentData.token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" dir="rtl">
      <div className="w-full max-w-[420px] bg-white rounded-[28px] shadow-2xl border border-outline-variant/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header */}
        <div className="bg-gradient-to-l from-amber-500 to-amber-700 p-6 relative">
          <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full text-white transition-all">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">تفعيل الحساب</h2>
              <p className="text-white/80 text-sm font-medium">خلص 500 درهم مرة وحدة باش الحساب ينشط</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">

          {/* ── STEP: INTRO ──────────────────────────────────── */}
          {step === 'intro' && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-right">
                <p className="font-black text-amber-900 text-sm mb-1">مرحبا {sellerName}</p>
                <p className="text-amber-700 text-sm leading-relaxed">
                  خلص <strong>500 درهم</strong> مرة وحدة باش حسابك يتفعل وتقدر تنشر إعلاناتك ويبانو للمشترين.
                </p>
              </div>

              <div className="space-y-3">
                <p className="font-black text-[#1A1A1A] text-base">الخطوات ديال الدفع:</p>
                {[
                  { n: '1', text: 'دوزنا نولدو ليك كود CashPlus' },
                  { n: '2', text: 'مشي لأي وكالة Cash Plus وأعطي الكود للموظف' },
                  { n: '3', text: 'خلص 500 درهم وحسابك غيتفعل تلقائياً' },
                ].map(item => (
                  <div key={item.n} className="flex items-center gap-3 bg-[#F9F9F6] rounded-xl p-3">
                    <div className="w-8 h-8 bg-[#2E7D32] text-white rounded-full flex items-center justify-center font-black text-sm shrink-0">
                      {item.n}
                    </div>
                    <span className="text-sm font-medium text-[#1A1A1A]">{item.text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleGeneratePayment}
                className="w-full bg-[#2E7D32] text-white py-4 rounded-2xl font-black text-base hover:bg-[#1B5E20] active:scale-95 transition-all shadow-lg shadow-[#2E7D32]/20"
              >
                ولد كود الدفع — 500 درهم
              </button>
            </div>
          )}

          {/* ── STEP: GENERATING ─────────────────────────────── */}
          {step === 'generating' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#E8F5E9] rounded-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-[#2E7D32] animate-spin" />
              </div>
              <p className="font-black text-[#1A1A1A] text-lg mb-2">كنولدو الكود...</p>
              <p className="text-[#757575] text-sm">صبر شوية</p>
            </div>
          )}

          {/* ── STEP: WAITING (token displayed) ──────────────── */}
          {step === 'waiting' && paymentData && (
            <div className="space-y-5">
              <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-2xl p-5 text-center">
                <p className="text-sm font-bold text-[#2E7D32] mb-2">كودك CashPlus</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-black text-[#1B5E20] tracking-widest">{paymentData.token}</span>
                  <button
                    onClick={handleCopyToken}
                    className="w-10 h-10 bg-[#2E7D32] text-white rounded-xl flex items-center justify-center hover:bg-[#1B5E20] transition-colors active:scale-90"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {paymentData.dateExpiration && (
                  <p className="text-xs text-[#4A4A4A] mt-2 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    ينتهي: {paymentData.dateExpiration}
                  </p>
                )}
              </div>

              <div className="bg-[#F9F9F6] rounded-xl p-4">
                <p className="text-xs text-[#757575] font-bold uppercase tracking-wider mb-2">كيفاش تدفع</p>
                <pre className="text-sm text-[#1A1A1A] whitespace-pre-wrap font-medium leading-relaxed">{paymentData.instructions}</pre>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleCheckPayment}
                  className="w-full bg-[#2E7D32] text-white py-4 rounded-2xl font-black text-base hover:bg-[#1B5E20] active:scale-95 transition-all shadow-lg"
                >
                  دفضت؟ تحقق من الدفع
                </button>
                {paymentData.token.startsWith('SIM_') && (
                  <button
                    onClick={async () => {
                      try {
                        setStep('checking');
                        const headers: any = { 'Content-Type': 'application/json' };
                        const user = (await import('../../lib/firebase')).auth.currentUser;
                        if (user) headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
                        const res = await fetch(`/api/payments/cashplus/simulate-payment/${paymentData.paymentId}`, { method: 'POST', headers });
                        const data = await res.json();
                        if (data.listingReactivated || data.accountActivated) {
                          setStep('success');
                          setTimeout(() => { onActivated(); onClose(); }, 2500);
                        } else {
                          setErrorMsg(data.error || 'خطأ في المحاكاة');
                          setStep('error');
                        }
                      } catch (e: any) {
                        setErrorMsg(e.message);
                        setStep('error');
                      }
                    }}
                    className="w-full py-3 rounded-2xl font-black text-sm border-2 border-dashed border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <FlaskConical className="w-4 h-4" />
                    محاكاة الدفع (تطوير)
                  </button>
                )}
                <p className="text-xs text-center text-[#757575]">
                  الحساب غيتفعل تلقائياً بعد الدفع
                </p>
              </div>
            </div>
          )}

          {/* ── STEP: CHECKING ────────────────────────────────── */}
          {step === 'checking' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <p className="font-black text-[#1A1A1A] text-lg mb-2">كنتحقق من الدفع...</p>
              <p className="text-[#757575] text-sm">غيكون جاهز ف ثواني</p>
            </div>
          )}

          {/* ── STEP: SUCCESS ─────────────────────────────────── */}
          {step === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-20 h-20 mx-auto bg-[#E8F5E9] rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                <CheckCircle className="w-10 h-10 text-[#2E7D32]" />
              </div>
              <div>
                <p className="font-black text-[#1A1A1A] text-xl mb-2">تم التفعيل!</p>
                <p className="text-[#4A4A4A] text-sm leading-relaxed">
                  حسابك دابا نشيط وتقدر تنشر إعلاناتك ويبانو للمشترين.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP: ERROR ───────────────────────────────────── */}
          {step === 'error' && (
            <div className="space-y-5">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                <p className="font-black text-red-800 mb-1">وقع مشكل</p>
                <p className="text-red-600 text-sm">{errorMsg}</p>
              </div>
              <button
                onClick={() => { setStep('intro'); setPaymentData(null); setErrorMsg(''); }}
                className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-black hover:bg-[#2E7D32] transition-colors"
              >
                ابدأ من جديد
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
