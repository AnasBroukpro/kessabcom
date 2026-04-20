import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  LayoutDashboard, 
  ShoppingBag, 
  List, 
  PlusCircle, 
  Users, 
  Settings, 
  LogOut, 
  BarChart3
} from 'lucide-react';
import { ViewType } from '../App';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
}

export default function MobileSidebar({ isOpen, onClose, onNavigate }: Props) {
  const { profile, signOut } = useAuth();
  const role = profile?.role || 'buyer';
  const displayName = profile?.fullName || profile?.displayName || (role === 'admin' ? 'المشرف' : role === 'seller' ? 'الكساب' : 'المشتري');

  const menuItems = [
    { 
      role: 'buyer', 
      items: [
        { icon: <LayoutDashboard size={20} />, label: 'لوحة التحكم', view: 'buyer' as ViewType, subView: 'dashboard' },
        { icon: <ShoppingBag size={20} />, label: 'طلباتي', view: 'buyer' as ViewType, subView: 'kessaba-offers' },
      ]
    },
    { 
      role: 'seller', 
      items: [
        { icon: <LayoutDashboard size={20} />, label: 'لوحة التحكم', view: 'seller' as ViewType, subView: 'dashboard' },
        { icon: <List size={20} />, label: 'القطيع', view: 'seller' as ViewType, subView: 'flock' },
        { icon: <PlusCircle size={20} />, label: 'إضافة إعلان', view: 'add-listing' as ViewType },
        { icon: <ShoppingBag size={20} />, label: 'طلبات', view: 'seller' as ViewType, subView: 'buyer-requests' },
        { icon: <BarChart3 size={20} />, label: 'الإحصائيات', view: 'seller' as ViewType, subView: 'stats' },
        { icon: <Settings size={20} />, label: 'الإعدادات', view: 'seller' as ViewType, subView: 'settings' },
      ]
    },
    { 
      role: 'admin', 
      items: [
        { icon: <LayoutDashboard size={20} />, label: 'لوحة التحكم', view: 'admin' as ViewType, subView: 'overview' },
        { icon: <Users size={20} />, label: 'المستخدمين', view: 'admin' as ViewType, subView: 'users' },
        { icon: <Settings size={20} />, label: 'الإعدادات', view: 'admin' as ViewType, subView: 'settings' },
      ]
    }
  ];

  const currentRoleMenu = menuItems.find(m => m.role === role)?.items || [];

  const handleLinkClick = (view: ViewType, subView?: string) => {
    onNavigate(view, undefined, undefined, undefined, subView);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-[100dvh] w-[85%] max-w-sm bg-white z-[99999] shadow-2xl flex flex-col"
            dir="rtl"
          >
            {/* Header Content */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="text-xl font-black text-[#1A1A1A]">القائمة</h2>
                <button 
                  onClick={onClose}
                  className="p-2 bg-gray-50 rounded-full transition-colors border border-transparent hover:bg-transparent hover:border-gray-300"
                >
                  <X size={24} className="text-[#1A1A1A]" />
                </button>
            </div>

            {/* Profile Summary */}
            <div className="px-5 py-6 bg-[#FAFAF5]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#2E7D32]/10 flex items-center justify-center font-black text-xl text-[#2E7D32] overflow-hidden border border-[#2E7D32]/20">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span>{displayName[0]}</span>
                    )}
                </div>
                <div>
                   <h3 className="text-lg font-black text-[#1A1A1A]">{displayName}</h3>
                   <p className="text-xs font-bold text-[#757575] uppercase tracking-wider">{role}</p>
                </div>
              </div>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="px-5 space-y-6">
                 {/* Main Navigation */}
                 <nav className="space-y-1">
                    {currentRoleMenu.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleLinkClick(item.view, item.subView)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl text-[#4A4A4A] font-bold transition-colors border border-transparent hover:bg-[#2E7D32] hover:text-white"
                      >
                        <div className="group-hover:text-white">{item.icon}</div>
                        <span>{item.label}</span>
                      </button>
                    ))}
                 </nav>
              </div>
            </div>

            {/* Logout Action */}
            <div className="p-5 border-t border-gray-100">
               <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-red-50 text-red-600 font-bold transition-colors border border-transparent hover:bg-transparent hover:text-red-700 hover:border-red-600"
                >
                  <LogOut size={20} />
                  <span>تسجيل الخروج</span>
                </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
