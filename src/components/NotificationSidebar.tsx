import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications?: any[];
  onMarkNotificationAsRead?: (id: string) => void;
}

export default function NotificationSidebar({ isOpen, onClose, notifications = [], onMarkNotificationAsRead }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-[100dvh] w-[90%] max-w-sm bg-white z-[99999] shadow-2xl flex flex-col"
            dir="rtl"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-xl font-black text-[#1A1A1A] flex items-center gap-2">
                <Bell size={20} className="text-[#2E7D32]" />
                التنبيهات
              </h2>
              <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                <X size={24} className="text-[#1A1A1A]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div                
                    key={notif.id}
                    className={`px-4 py-3 border-b border-gray-50 transition-all cursor-pointer ${!notif.read ? 'bg-green-50/50 hover:bg-green-50' : 'hover:bg-gray-50'}`}
                    onClick={() => onMarkNotificationAsRead?.(notif.id)}
                  >
                    <p className="text-sm font-bold text-[#1A1A1A] mb-1 leading-tight">{notif.title}</p>
                    <p className="text-xs text-gray-500">{notif.message}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 font-bold">لا توجد تنبيهات حالياً</div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
