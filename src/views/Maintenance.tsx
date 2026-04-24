import React from 'react';
import { Settings, Clock, MapPin, Phone } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  activationDate: string | null;
  onNavigate: (view: any) => void;
}

export default function Maintenance({ activationDate, onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-center" dir="rtl">
      <div className="max-w-2xl w-full space-y-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary"
        >
          <Settings className="w-12 h-12 animate-spin-slow" />
        </motion.div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black text-on-surface font-headline">المنصة في وضع الصيانة</h1>
          <p className="text-lg text-on-surface-variant max-w-lg mx-auto">
            نحن نعمل حالياً على تحسين تجربتكم وتحديث المنصة. سنعود قريباً بأفضل حلة!
          </p>
        </div>

        {activationDate && (
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 space-y-4">
            <div className="flex items-center justify-center gap-3 text-primary">
              <Clock className="w-6 h-6" />
              <span className="text-xl font-bold">موعد العودة المتوقع:</span>
            </div>
            <div className="text-3xl font-black text-on-surface">
              {new Date(activationDate).toLocaleString('ar-MA', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8">
          <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20">
            <div className="w-10 h-10 bg-surface-variant rounded-full flex items-center justify-center text-on-surface-variant">
              <Phone className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">للتواصل</p>
              <p className="text-sm font-bold text-on-surface">+212 600 660066</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20">
            <div className="w-10 h-10 bg-surface-variant rounded-full flex items-center justify-center text-on-surface-variant">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">المقر</p>
              <p className="text-sm font-bold text-on-surface">الدار البيضاء، المغرب</p>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <p className="text-xs text-on-surface-variant">© 2026 منصة kessabcom.ma. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </div>
  );
}
