import React from 'react';
import { 
  LayoutDashboard, Tag, ShoppingBag, BarChart3, CreditCard, 
  Settings, HeartHandshake, LogOut 
} from 'lucide-react';
import { SellerTab } from '../../views/SellerDashboard';

interface SellerSidebarProps {
  activeTab: SellerTab;
  setActiveTab: (tab: SellerTab) => void;
  onNavigate: (view: any) => void;
  requestsCount: number;
  settings: any;
  signOut: () => void;
}

export default function SellerSidebar({
  activeTab,
  setActiveTab,
  onNavigate,
  requestsCount,
  settings,
  signOut
}: SellerSidebarProps) {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'لوحة القيادة' },
    { id: 'flock', icon: Tag, label: 'القطيع ديالي' },
    { id: 'buyer-requests', icon: ShoppingBag, label: 'طلبات المشترين', count: requestsCount },
    { id: 'stats', icon: BarChart3, label: 'الإحصائيات' },
    { id: 'subscription', icon: CreditCard, label: 'الاشتراك', visible: settings.paymentSystemEnabled },
    { id: 'settings', icon: Settings, label: 'الإعدادات' },
  ].filter(item => item.visible !== false);

  return (
    <aside className="w-20 lg:w-64 bg-surface border-r border-outline-variant/20 flex flex-col justify-between hidden md:flex z-20">
      <div>
        <div className="h-24 flex flex-col items-center justify-center border-b border-outline-variant/20 gap-2 shrink-0">
          <button onClick={() => onNavigate('home')} className="flex items-center group">
            <img 
              src="https://i.ibb.co/Psdn5FfW/logo-removebg-preview.png" 
              alt="كسابكوم" 
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105" 
              referrerPolicy="no-referrer" 
            />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as SellerTab)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === item.id ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              <item.icon className="w-6 h-6" />
              <span className="hidden lg:block">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="hidden lg:flex mr-auto bg-error text-white text-[10px] w-5 h-5 items-center justify-center rounded-full">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-outline-variant/20 space-y-2">
        {settings.solidarityDonationEnabled && (
          <button 
            onClick={() => setActiveTab('donations')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'donations' ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/5'}`}
          >
            <HeartHandshake className="w-5 h-5" />
            <span className="hidden lg:block">تبرع تضامني</span>
          </button>
        )}
        <button 
          onClick={() => { signOut(); onNavigate('auth'); }} 
          className="w-full flex items-center justify-center gap-2 bg-error/10 text-error py-3 rounded-xl font-bold hover:bg-error/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:block">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
