import React from 'react';
import { 
  LayoutDashboard, Tag, ShoppingBag, BarChart3, CreditCard, 
  Settings, HeartHandshake, LogOut 
} from 'lucide-react';
import { SellerTab } from '../../views/SellerDashboard';
import logoV2 from '../../assets/marketing/branding/logo-v2.png';

interface SellerSidebarProps {
  activeTab: SellerTab;
  setActiveTab: (tab: SellerTab) => void;
  onNavigate: (view: any) => void;
  requestsCount: number;
  settings: any;
  signOut: () => void;
}

const SheepIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15.5 11c0 2.209-1.791 4-4 4s-4-1.791-4-4 1.791-4 4-4 4 1.791 4 4Z" />
    <path d="M11.5 15v3m-2-3v3m4-3v3" />
    <path d="M8.5 8.5c-1.5-1.5-3.5-1.5-4.5 0s-.5 3.5 1 4.5" />
    <path d="M14.5 8.5c1.5-1.5 3.5-1.5 4.5 0s.5 3.5-1 4.5" />
    <circle cx="10" cy="10.5" r=".5" />
    <circle cx="13" cy="10.5" r=".5" />
  </svg>
);

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
    { id: 'buyer-requests', icon: SheepIcon, label: 'طلبات المشترين', count: requestsCount, visible: settings.auctionSystemEnabled },
    { id: 'stats', icon: BarChart3, label: 'الإحصائيات' },
    { id: 'subscription', icon: CreditCard, label: 'الاشتراك', visible: settings.paymentSystemEnabled },
    { id: 'settings', icon: Settings, label: 'الإعدادات' },
  ].filter(item => item.visible !== false);

  return (
    <aside className="w-20 lg:w-64 bg-surface border-r border-outline-variant/10 flex flex-col justify-between hidden md:flex z-20">
      <div>
        <div className="h-24 flex flex-col items-center justify-center border-b border-outline-variant/10 gap-2 shrink-0">
          <button onClick={() => onNavigate('home')} className="flex items-center group">
            <img 
              src={logoV2} 
              alt="KESSABCOM" 
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as SellerTab)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[10px] font-black transition-all duration-300 ${activeTab === item.id ? 'bg-[#115E2C] text-white shadow-lg shadow-[#115E2C]/20' : 'text-[#757575] hover:bg-[#F5F5F0] hover:text-[#115E2C]'}`}
            >
              <item.icon className="w-6 h-6" />
              <span className="hidden lg:block">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`hidden lg:flex mr-auto text-[10px] w-5 h-5 items-center justify-center rounded-full font-black ${activeTab === item.id ? 'bg-white text-[#115E2C]' : 'bg-red-600 text-white'}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-outline-variant/10 space-y-2">
        {settings.solidarityDonationEnabled && (
          <button 
            onClick={() => setActiveTab('donations')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-[10px] font-black transition-all duration-300 ${activeTab === 'donations' ? 'bg-[#E8F5E9] text-[#115E2C]' : 'text-[#115E2C] hover:bg-[#F5F5F0]'}`}
          >
            <HeartHandshake className="w-5 h-5" />
            <span className="hidden lg:block">تبرع تضامني</span>
          </button>
        )}
        <button 
          onClick={() => { signOut(); onNavigate('auth'); }} 
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3.5 rounded-[10px] font-black hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:block">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
