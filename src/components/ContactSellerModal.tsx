import React from 'react';
import { Phone, MessageCircle, AlertTriangle, X } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { ViewType } from '../App';
import LoginRequiredModal from './LoginRequiredModal';

interface ContactSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerPhone?: string;
  sellerWhatsapp?: string;
  listingId?: string;
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
}

export default function ContactSellerModal({ isOpen, onClose, sellerPhone, sellerWhatsapp, listingId, onNavigate }: ContactSellerModalProps) {
  const { settings } = useSettings();
  const { profile } = useAuth();

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

  const whatsappNumber = sellerWhatsapp || sellerPhone;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300" dir="rtl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-[#1A1A1A]">تواصل مع الكساب</h3>
          <button onClick={onClose} className="p-2 transition-colors border border-transparent hover:border-gray-300 rounded-full">
            <X className="w-5 h-5 text-[#757575]" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <h4 className="font-bold text-red-800 text-sm mb-1">رد البال!</h4>
              <p className="text-xs text-red-700 leading-relaxed">
                ماتصيفطش الفلوس مسبقاً للكساب عبر التحويل البنكي ولا وكالات تحويل الأموال. ديما شوف السلعة عاد خلص.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <a 
              href={sellerPhone ? `tel:${sellerPhone}` : '#'} 
              onClick={(e) => {
                if (!sellerPhone) e.preventDefault();
                handlePhoneClick();
              }}
              className={`w-full flex items-center justify-center gap-3 text-white py-4 rounded-xl font-bold transition-colors border border-transparent shadow-lg ${sellerPhone ? 'bg-[#2E7D32] hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32] shadow-[#2E7D32]/20' : 'bg-gray-400 cursor-not-allowed shadow-none'}`}
            >
              <span dir="ltr">{sellerPhone || 'الرقم غير متوفر'}</span>
              <Phone className="w-5 h-5" />
            </a>
            <a 
              href={whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : '#'} 
              target={whatsappNumber ? "_blank" : undefined}
              rel="noopener noreferrer" 
              onClick={(e) => {
                if (!whatsappNumber) e.preventDefault();
                handleWhatsappClick();
              }}
              className={`w-full flex items-center justify-center gap-3 text-white py-4 rounded-xl font-bold transition-colors border border-transparent shadow-lg ${whatsappNumber ? 'bg-[#25D366] hover:bg-transparent hover:text-[#25D366] hover:border-[#25D366] shadow-[#25D366]/20' : 'bg-gray-400 cursor-not-allowed shadow-none'}`}
            >
              <span>رسالة واتساب</span>
              <MessageCircle className="w-5 h-5 fill-white" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
