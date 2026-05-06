import React from 'react';
import { Phone, AlertTriangle, X } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
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
  isOpen, onClose, sellerPhone, sellerWhatsapp, phones = [], whatsapps = [], listingId, onNavigate 
}: ContactSellerModalProps) {
  const { settings } = useSettings();
  const { profile } = useAuth();
  const [showAllNumbers, setShowAllNumbers] = React.useState(false);

  if (!isOpen) return null;

  const handlePhoneClick = () => {
    if (listingId) {
      firestoreService.incrementContactClick(listingId, 'phone');
    }
  };

  const handleWhatsappClick = () => {
    if (listingId) {
      firestoreService.incrementContactClick(listingId, 'whatsapp');
    }
  };

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
      <div className="w-full max-w-[440px] bg-white rounded-[32px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-outline-variant/10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative" dir="rtl">
        <button onClick={onClose} className="absolute top-6 left-6 p-2 transition-colors border border-transparent hover:bg-gray-100 rounded-full z-10">
          <X className="w-5 h-5 text-[#757575]" />
        </button>

        <div className="text-center mb-8">
          <div className="w-[154px] md:w-[180px] mx-auto mb-6 flex items-center justify-center">
            <img src={logoV2} alt="منصة kessabcom.ma" className="w-full h-auto" />
          </div>
          <h1 className="text-2xl font-black text-[#1A1A1A] mb-3 font-headline">تواصل مع الكساب</h1>
          <p className="text-[#757575] font-medium leading-relaxed">اتصل بالكساب مباشرة باش تعرف التفاصيل</p>
        </div>
        
        <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
          <div className="bg-red-50 border border-red-100 p-5 rounded-3xl flex gap-4">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
            <div className="text-right">
              <h4 className="font-bold text-red-800 text-sm mb-1">رد البال!</h4>
              <p className="text-xs text-red-700 leading-relaxed font-medium">
                ماتصيفطش الفلوس مسبقاً للكساب عبر التحويل البنكي ولا وكالات تحويل الأموال. ديما شوف السلعة عاد خلص.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Primary Contacts */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-[#757575] uppercase tracking-wider mr-2">التواصل الرئيسي</p>
              
              {/* Phone Button */}
              <a 
                href={primaryPhone ? `tel:${primaryPhone}` : '#'} 
                onClick={(e) => {
                  if (!primaryPhone) e.preventDefault();
                  handlePhoneClick();
                }}
                className={`w-full flex flex-row-reverse items-center gap-4 px-8 py-5 text-white rounded-2xl font-black transition-all border-2 border-transparent shadow-xl ${primaryPhone ? 'bg-[#1A1A1A] hover:bg-transparent hover:text-[#1A1A1A] hover:border-[#1A1A1A] shadow-black/10' : 'bg-gray-400 cursor-not-allowed shadow-none'}`}
              >
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <span dir="ltr" className="text-xl flex-1 text-right font-black tracking-widest">{formatMoroccanPhone(primaryPhone) || 'الرقم غير متوفر'}</span>
              </a>

              {/* WhatsApp Button */}
              <a 
                href={primaryWhatsapp ? `https://wa.me/${primaryWhatsapp.replace(/\D/g, '')}` : '#'} 
                target={primaryWhatsapp ? "_blank" : undefined}
                rel="noopener noreferrer" 
                onClick={(e) => {
                  if (!primaryWhatsapp) e.preventDefault();
                  handleWhatsappClick();
                }}
                className={`w-full flex flex-row-reverse items-center gap-4 px-8 py-5 text-white rounded-2xl font-black transition-all border-2 border-transparent shadow-xl ${primaryWhatsapp ? 'bg-[#25D366] hover:bg-transparent hover:text-[#25D366] hover:border-[#25D366] shadow-[#25D366]/20' : 'bg-gray-400 cursor-not-allowed shadow-none'}`}
              >
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <img src={whatsappIcon} alt="" className="w-7 h-7" style={{ filter: 'brightness(0) invert(1)' }} />
                </div>
                <span dir="ltr" className="text-xl flex-1 text-right font-black tracking-widest">{formatMoroccanPhone(primaryWhatsapp)}</span>
              </a>
            </div>

            {/* Other Numbers Toggle */}
            {hasMore && (
              <div className="pt-4">
                <button 
                  onClick={() => setShowAllNumbers(!showAllNumbers)}
                  className="w-full py-3 text-sm font-black text-[#2E7D32] border-2 border-[#2E7D32]/20 rounded-2xl hover:bg-[#2E7D32]/5 transition-all flex items-center justify-center gap-2"
                >
                  {showAllNumbers ? 'إخفاء الأرقام الأخرى' : 'عرض أرقام أخرى'}
                </button>

                {showAllNumbers && (
                  <div className="mt-4 space-y-6 animate-in slide-in-from-top-2 duration-300">
                    {otherPhones.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-[#757575] uppercase tracking-wider mr-2">أرقام هاتف إضافية</p>
                        {otherPhones.map((p, i) => (
                          <a key={i} href={`tel:${p}`} className="flex items-center gap-4 p-4 bg-[#F9F9F6] rounded-xl font-black text-[#1A1A1A] border border-outline-variant/10">
                            <Phone className="w-4 h-4 text-[#757575]" />
                            <span dir="ltr" className="flex-1 text-center font-black tracking-widest">{formatMoroccanPhone(p)}</span>
                          </a>
                        ))}
                      </div>
                    )}
                    {otherWhatsapps.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-[#757575] uppercase tracking-wider mr-2">أرقام واتساب إضافية</p>
                        {otherWhatsapps.map((w, i) => (
                          <a key={i} href={`https://wa.me/${w.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-[#F9F9F6] rounded-xl font-black text-[#25D366] border border-outline-variant/10">
                            <img src={whatsappIcon} alt="" className="w-5 h-5" />
                            <span dir="ltr" className="flex-1 text-center font-black tracking-widest">{formatMoroccanPhone(w)}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
