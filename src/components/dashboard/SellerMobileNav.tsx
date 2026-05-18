import React from 'react';
import { LayoutDashboard, Tag, ShoppingBag, Settings, Plus } from 'lucide-react';
import { SellerTab } from '../../views/SellerDashboard';

interface SellerMobileNavProps {
  activeTab: SellerTab;
  setActiveTab: (tab: SellerTab) => void;
  requestsCount: number;
  settings: any;
  onNavigate: (view: any) => void;
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

export default function SellerMobileNav({
  activeTab,
  setActiveTab,
  requestsCount,
  settings,
  onNavigate
}: SellerMobileNavProps) {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
    { id: 'flock', icon: Tag, label: 'إعلاناتي' },
    { id: 'add', icon: Plus, label: 'إضافة', isAction: true },
    { id: 'buyer-requests', icon: SheepIcon, label: 'طلبات', badge: requestsCount, visible: settings.auctionSystemEnabled },
    { id: 'settings', icon: Settings, label: 'الإعدادات' },
  ].filter(item => item.visible !== false);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-outline-variant/10 flex items-center justify-between px-4 pb-safe pt-3 z-40 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}>
      {items.map(item => (
        <button 
          key={item.id}
          onClick={() => { 
            if (item.isAction) {
              onNavigate('add-listing');
            } else {
              setActiveTab(item.id as SellerTab); 
              window.scrollTo(0, 0); 
            }
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 p-2 rounded-[10px] transition-all duration-300 ${activeTab === item.id ? 'text-[#115E2C] scale-110' : 'text-[#757575] hover:text-[#115E2C]'}`}
        >
          <div className="relative">
            {item.id === 'add' ? (
              <div className="bg-[#115E2C] text-white p-2 rounded-full shadow-lg -mt-8 mb-1 border-4 border-white">
                <item.icon className="w-6 h-6" />
              </div>
            ) : (
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            )}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black border-2 border-white shadow-sm animate-bounce">
                {item.badge}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-black tracking-tight ${activeTab === item.id ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
