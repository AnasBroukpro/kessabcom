import React from 'react';
import { Lock, X } from 'lucide-react';
import { ViewType } from '../App';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
  title?: string;
  subtitle?: string;
}

export default function LoginRequiredModal({ 
  isOpen, 
  onClose, 
  onNavigate, 
  title = "تسجيل الدخول مطلوب", 
  subtitle = "خاصك تسجل الدخول باش تقدر تشوف هاد المعلومات وتواصل مع الكساب." 
}: LoginRequiredModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 p-8 text-center" dir="rtl">
        <div className="flex justify-end -mt-4 -mr-4 mb-2">
          <button onClick={onClose} className="p-2 transition-colors border border-transparent hover:border-gray-300 rounded-full">
            <X className="w-5 h-5 text-[#757575]" />
          </button>
        </div>
        
        <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10" />
        </div>
        
        <h3 className="text-2xl font-black mb-3 text-[#1A1A1A] font-headline">{title}</h3>
        <p className="text-[#757575] mb-8 font-medium leading-relaxed">
          {subtitle}
        </p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => {
              onClose();
              onNavigate('auth');
            }}
            className="w-full py-4 bg-[#2E7D32] text-white rounded-xl font-bold transition-colors border border-transparent hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32] shadow-lg shadow-[#2E7D32]/20"
          >
            تسجيل الدخول / إنشاء حساب
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3 text-sm font-bold text-[#757575] transition-colors border border-transparent hover:border-gray-400 rounded-xl"
          >
            رجوع
          </button>
        </div>
      </div>
    </div>
  );
}
