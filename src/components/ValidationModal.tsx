import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export default function ValidationModal({ isOpen, onClose, message }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 h-[100dvh] w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xs bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-outline-variant/10"
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-[#E8F5E9] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#2E7D32]">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#1A1A1A] mb-3">اختر المدينة</h3>
              <p className="text-[#4A4A4A] font-bold leading-relaxed mb-8">
                {message}
              </p>
              <button
                onClick={onClose}
                className="w-full py-4 bg-[#2E7D32] text-white rounded-xl font-black shadow-lg shadow-[#2E7D32]/20 hover:shadow-[#2E7D32]/30 active:scale-[0.98] transition-all"
              >
                فهمت
              </button>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center transition-all bg-[#fef2f2] border border-red-200 text-red-600 rounded-full hover:bg-red-500 hover:text-white z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
