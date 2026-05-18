import React from 'react';
import { Phone, AlertTriangle, X, Lock } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../contexts/AuthContext';
import { monetizationService } from '../services/monetizationService';
import { ViewType } from '../App';
import LoginRequiredModal from './LoginRequiredModal';

// Assets
import whatsappIcon from '../assets/marketing/features/whatsapp-svgrepo-com.svg';
import mapPointIcon from '../assets/marketing/features/map-point-svgrepo-com.svg';
import logoV2 from '../assets/marketing/branding/logo v2.png';

interface ContactSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerPhone?: string;
  sellerWhatsapp?: string;
  phones?: string[];
  whatsapps?: string[];
  listingId?: string;
  listingStatus?: string; // 'active' | 'paused_for_payment' | ...
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
}

const formatMoroccanPhone = (phone: string) => {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('212')) clean = clean.substring(3);
  if (clean.startsWith('0')) return clean;
  return '0' + clean;
};

export default function ContactSellerModal({ 
  isOpen, onClose, sellerPhone, sellerWhatsapp, phones = [], whatsapps = [], listingId, listingStatus, onNavigate 
}: ContactSellerModalProps) {
  const { settings } = useSettings();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'primary' | 'others'>('primary');

  if (!isOpen) return null;

  const handlePhoneClick = async () => {
    if (listingId) {
      try { await monetizationService.recordContact(listingId, 'phone'); }
      catch (e) { console.warn('Contact point deduction failed (non-blocking):', e); }
    }
  };

  const handleWhatsappClick = async () => {
    if (listingId) {
      try { await monetizationService.recordContact(listingId, 'whatsapp'); }
      catch (e) { console.warn('Contact point deduction failed (non-blocking):', e); }
    }
  };

  // Si l'annonce est bloquée pour paiement, bloquer tout contact
  if (isOpen && listingStatus === 'paused_for_payment') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" dir="rtl">
        <div className="w-full max-w-[360px] bg-white rounded-[28px] p-6 shadow-2xl text-center">
          <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full">
            <X className="w-4 h-4" />
          </button>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-black text-[#1A1A1A] mb-2">هذا الإعلان موقوف</h3>
          <p className="text-sm text-[#757575] leading-relaxed">
            كساب هذا الإعلان وصل للحد المجاني ديال التواصل.
            الإعلان سيرجع نشيط بعد الدفع.
          </p>
        </div>
      </div>
    );
  }

  // If guest buyer mode is disabled and user is not logged in
  if (!settings.guestBuyerMode && !profile) {
    return (
      <LoginRequiredModal 
        isOpen={isOpen}
        onClose={onClose}
        onNavigate={onNavigate}
        subtitle="خاصك تسجل الدخول باش تقدر تشوف معلومات التواصل مع الكساب."
      />
    );
  }

  // Ensure arrays have data
  const allPhones = phones.length > 0 ? phones : (sellerPhone ? [sellerPhone] : []);
  const allWhatsapps = whatsapps.length > 0 ? whatsapps : (sellerWhatsapp ? [sellerWhatsapp] : (sellerPhone ? [sellerPhone] : []));

  const primaryPhone = allPhones[0];
  const primaryWhatsapp = allWhatsapps[0];
  
  const otherPhones = allPhones.slice(1);
  const otherWhatsapps = allWhatsapps.slice(1);
  const hasMore = otherPhones.length > 0 || otherWhatsapps.length > 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-[420px] bg-white rounded-[32px] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-outline-variant/10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative" dir="rtl">
        <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center transition-all bg-[#fef2f2] border border-red-200 text-red-600 rounded-full hover:bg-red-500 hover:text-white z-10">
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-8">
          <div className="w-[160px] md:w-[180px] mx-auto mb-6 flex items-center justify-center">
            <img src={logoV2} alt="منصة kessabcom.ma" className="w-full h-auto" />
          </div>
          <h1 className="text-xl font-black text-[#1A1A1A] mb-1 font-headline">تواصل مع الكساب</h1>
          <p className="text-xs text-[#757575] font-medium leading-relaxed">اتصل بالكساب مباشرة باش تعرف التفاصيل</p>
        </div>

        {/* Tabs Navigation */}
        {hasMore && (
          <div className="flex bg-[#F9F9F6] p-1 rounded-2xl mb-6 border border-outline-variant/10">
            <button 
              onClick={() => setActiveTab('primary')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'primary' ? 'bg-white text-[#2E7D32] shadow-sm border border-outline-variant/10' : 'text-[#757575] hover:text-[#2E7D32]'}`}
            >
              تواصل رئيسي
            </button>
            <button 
              onClick={() => setActiveTab('others')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'others' ? 'bg-white text-[#2E7D32] shadow-sm border border-outline-variant/10' : 'text-[#757575] hover:text-[#2E7D32]'}`}
            >
              أرقام أخرى
            </button>
          </div>
        )}
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
          {activeTab === 'primary' && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div className="text-right">
                <h4 className="font-bold text-red-800 text-[10px] mb-0.5">رد البال!</h4>
                <p className="text-[10px] text-red-700 leading-tight font-medium">
                  ماتصيفطش الفلوس مسبقاً للكساب عبر التحويل البنكي ولا وكالات تحويل الأموال. ديما شوف السلعة عاد خلص.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {activeTab === 'primary' ? (
              <div className="space-y-3 animate-in fade-in duration-300">
                <p className="text-[9px] font-black text-[#757575] uppercase tracking-wider mr-2">التواصل الرئيسي</p>
                
                {/* Phone Button — icon LEFT, number centered */}
                <a 
                  href={primaryPhone ? `tel:${primaryPhone}` : '#'} 
                  onClick={(e) => {
                    if (!primaryPhone) e.preventDefault();
                    handlePhoneClick();
                  }}
                  className={`w-full flex flex-row-reverse items-center gap-3 px-6 py-4 text-white rounded-2xl font-black transition-all border-2 border-transparent shadow-lg ${primaryPhone ? 'bg-[#1A1A1A] hover:bg-[#2a2a2a] shadow-black/5' : 'bg-gray-400 cursor-not-allowed shadow-none'}`}
                >
                  <Phone className="w-5 h-5 text-white shrink-0" />
                  <span dir="ltr" className="flex-1 text-center font-black tracking-widest text-lg">{formatMoroccanPhone(primaryPhone) || 'الرقم غير متوفر'}</span>
                </a>

                {/* WhatsApp Button — icon LEFT, number centered */}
                <a 
                  href={primaryWhatsapp ? `https://wa.me/${primaryWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                    (profile?.fullName || profile?.displayName ? `السلام عليكم، أنا ${profile.fullName || profile.displayName}. ` : 'السلام عليكم. ') + 
                    `شفت هاد الإعلان ف منصة kessabcom.ma ومهتم نجي نشوف لكسيبة: ${listingId ? `https://kessabcom.ma/listing/${listingId}` : window.location.href}`
                  )}` : '#'} 
                  target={primaryWhatsapp ? "_blank" : undefined}
                  rel="noopener noreferrer" 
                  onClick={(e) => {
                    if (!primaryWhatsapp) e.preventDefault();
                    handleWhatsappClick();
                  }}
                  className={`w-full flex flex-row-reverse items-center gap-3 px-6 py-4 text-white rounded-2xl font-black transition-all border-2 border-transparent shadow-lg ${primaryWhatsapp ? 'bg-[#25D366] hover:bg-[#20c05e] shadow-[#25D366]/10' : 'bg-gray-400 cursor-not-allowed shadow-none'}`}
                >
                  <img src={whatsappIcon} alt="" className="w-5 h-5 shrink-0" style={{ filter: 'brightness(0) invert(1)' }} />
                  <span dir="ltr" className="flex-1 text-center font-black tracking-widest text-lg">{formatMoroccanPhone(primaryWhatsapp)}</span>
                </a>
              </div>
            ) : (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                {otherPhones.map((p, i) => (
                  <a key={i} href={`tel:${p}`} className="flex flex-row-reverse items-center gap-3 p-4 bg-[#F9F9F6] rounded-xl border border-outline-variant/10 hover:border-[#1A1A1A]/20 transition-colors">
                    <Phone className="w-4 h-4 text-[#1A1A1A] shrink-0" />
                    <span dir="ltr" className="flex-1 text-center font-black tracking-widest text-[#1A1A1A]">{formatMoroccanPhone(p)}</span>
                  </a>
                ))}
                {otherWhatsapps.map((w, i) => (
                  <a 
                    key={i} 
                    href={`https://wa.me/${w.replace(/\D/g, '')}?text=${encodeURIComponent(
                      (profile?.fullName || profile?.displayName ? `السلام عليكم، أنا ${profile.fullName || profile.displayName}. ` : 'السلام عليكم. ') + 
                      `شفت هاد الإعلان ف منصة kessabcom.ma ومهتم نجي نشوف لكسيبة: ${listingId ? `https://kessabcom.ma/listing/${listingId}` : window.location.href}`
                    )}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex flex-row-reverse items-center gap-3 p-4 bg-[#F9F9F6] rounded-xl border border-outline-variant/10 hover:border-[#25D366]/30 transition-colors"
                  >
                    <img src={whatsappIcon} alt="" className="w-5 h-5 shrink-0" />
                    <span dir="ltr" className="flex-1 text-center font-black tracking-widest text-[#25D366]">{formatMoroccanPhone(w)}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
