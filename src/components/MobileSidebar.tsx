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
  BarChart3,
  Heart,
  Home,
  Search,
  MessageSquare,
  HelpCircle,
  Shield,
  FileText,
  Scale,
  User as UserIcon,
  LogIn
} from 'lucide-react';
import { ViewType } from '../App';
import { useAuth } from '../contexts/AuthContext';
import logoV2 from '../assets/marketing/branding/logo v2.png';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
  onShowTutorial?: () => void;
}

export default function MobileSidebar({ isOpen, onClose, onNavigate }: Props) {
  const { user, profile, signOut } = useAuth();
  const role = profile?.role || 'buyer';
  const displayName = (role === 'seller' && profile?.pseudo) 
    ? profile.pseudo 
    : (profile?.fullName || profile?.displayName || (role === 'admin' ? 'المشرف' : role === 'seller' ? 'الكساب' : 'المشتري'));

  const menuItems = [
    { icon: <Home size={20} />, label: 'الرئيسية', view: 'home' as ViewType },
    { icon: <Search size={20} />, label: 'البحث', view: 'search-results' as ViewType },
  ];

  const usefulLinks = [
    { icon: <HelpCircle size={20} />, label: 'نصائح وإرشادات', view: 'tips' as ViewType },
    { icon: <MessageSquare size={20} />, label: 'اتصل بنا', view: 'contact' as ViewType },
    { icon: <Shield size={20} />, label: 'شروط الاستخدام', view: 'terms' as ViewType },
    { icon: <FileText size={20} />, label: 'سياسة الخصوصية', view: 'privacy' as ViewType },
    { icon: <Scale size={20} />, label: 'سياسة استرداد الأموال', view: 'refund-policy' as ViewType },
  ];

  const currentRoleMenu = menuItems;

  const handleLinkClick = (view: ViewType, subView?: string) => {
    onNavigate(view, undefined, undefined, undefined, subView);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('auth');
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
                <div className="flex items-center gap-2">
                  <img src={logoV2} alt="Logo" className="h-8 w-auto object-contain" />
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 bg-gray-50 rounded-full transition-colors border border-transparent hover:bg-transparent hover:border-gray-300"
                >
                  <X size={24} className="text-[#1A1A1A]" />
                </button>
            </div>

            {/* Profile Summary / Login Prompt */}
            <div className="px-5 py-6 bg-[#FAFAF5]">
              {user ? (
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
                    <p className="text-xs font-bold text-[#757575] uppercase tracking-wider">{role === 'buyer' ? 'مشتري' : role === 'seller' ? 'كساب' : 'مشرف'}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-black text-[#1A1A1A]">مرحبا بك في كسابكوم</h3>
                  <p className="text-xs font-bold text-[#757575]">سجل الدخول باش تستافد من كاع الميزات</p>
                  <button 
                    onClick={() => handleLinkClick('auth')}
                    className="mt-2 w-full py-3 bg-[#2E7D32] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#2E7D32]/20 active:scale-95 transition-transform animate-shake"
                  >
                    <LogIn size={18} />
                    <span>تسجيل الدخول</span>
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="px-5 space-y-8">
                 {/* Main Navigation */}
                 <nav className="space-y-1">
                    {currentRoleMenu.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleLinkClick(item.view, item.subView)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl text-[#4A4A4A] font-bold transition-colors border border-transparent hover:bg-[#2E7D32]/10 hover:text-[#2E7D32]"
                      >
                        <div className="text-[#2E7D32]">{item.icon}</div>
                        <span>{item.label}</span>
                      </button>
                    ))}
                 </nav>

                 {/* Useful Links Section */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-[#757575] uppercase tracking-[0.2em] px-4">روابط مفيدة</h4>
                    <nav className="space-y-1">
                      {usefulLinks.map((link, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleLinkClick(link.view)}
                          className="w-full flex items-center gap-4 p-4 rounded-xl text-[#757575] font-bold transition-colors border border-transparent hover:bg-gray-100"
                        >
                          <div>{link.icon}</div>
                          <span>{link.label}</span>
                        </button>
                      ))}
                    </nav>
                 </div>
              </div>
            </div>

            {/* Logout Action (Only if logged in) */}
            {user && (
              <div className="p-5 border-t border-gray-100">
                <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-red-50 text-red-600 font-bold transition-colors border border-transparent hover:bg-transparent hover:text-red-700 hover:border-red-600"
                  >
                    <LogOut size={20} />
                    <span>تسجيل الخروج</span>
                  </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
