import React from 'react';

interface FooterProps {
  onNavigate: (view: any, listingId?: string, city?: string, radius?: string, subView?: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#1A1A1A] py-16 px-6 pb-24 lg:pb-16 text-center border-t border-outline-variant/20" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center mb-6">
          <img 
            src="https://i.ibb.co/Psdn5FfW/logo-removebg-preview.png" 
            alt="كسابكوم" 
            className="h-16 w-auto object-contain brightness-0 invert opacity-80"
            referrerPolicy="no-referrer"
          />
        </div>
        <p className="text-[#A0A0A0] max-w-md mx-auto mb-8 font-medium">أول منصة فالمغرب كاتقربك من الكساب وتخليك تختار أضحيتك فالضيعة بكل أمان.</p>
        <div className="flex justify-center gap-4 mb-12 text-sm font-bold flex-wrap">
          <button onClick={() => onNavigate('tips')} className="text-[#A0A0A0] hover:text-white px-3 py-1.5 rounded-lg border border-transparent hover:border-[#A0A0A0] transition-colors">نصائح وإرشادات</button>
          <button onClick={() => onNavigate('contact')} className="text-[#A0A0A0] hover:text-white px-3 py-1.5 rounded-lg border border-transparent hover:border-[#A0A0A0] transition-colors">اتصل بنا</button>
          <button onClick={() => onNavigate('terms')} className="text-[#A0A0A0] hover:text-white px-3 py-1.5 rounded-lg border border-transparent hover:border-[#A0A0A0] transition-colors">شروط الاستخدام</button>
          <button onClick={() => onNavigate('privacy')} className="text-[#A0A0A0] hover:text-white px-3 py-1.5 rounded-lg border border-transparent hover:border-[#A0A0A0] transition-colors">سياسة الخصوصية</button>
        </div>
        <p className="text-xs text-[#757575]">© 2026 كسابكوم. جميع الحقوق محفوظة لكسابة المغرب.</p>
      </div>
    </footer>
  );
}
