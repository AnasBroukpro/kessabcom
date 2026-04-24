import React from 'react';
import { LayoutDashboard, Tag, ShoppingBag, Settings } from 'lucide-react';
import { SellerTab } from '../../views/SellerDashboard';

interface SellerMobileNavProps {
  activeTab: SellerTab;
  setActiveTab: (tab: SellerTab) => void;
  requestsCount: number;
}

export default function SellerMobileNav({
  activeTab,
  setActiveTab,
  requestsCount
}: SellerMobileNavProps) {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
    { id: 'flock', icon: Tag, label: 'إعلاناتي' },
    { id: 'buyer-requests', icon: ShoppingBag, label: 'طلبات', badge: requestsCount },
    { id: 'settings', icon: Settings, label: 'الإعدادات' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-outline-variant/10 flex items-center justify-between px-4 pb-safe pt-3 z-40 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}>
      {items.map(item => (
        <button 
          key={item.id}
          onClick={() => setActiveTab(item.id as SellerTab)}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 p-2 rounded-[10px] transition-all duration-300 ${activeTab === item.id ? 'text-[#115E2C] scale-110' : 'text-[#757575] hover:text-[#115E2C]'}`}
        >
          <div className="relative">
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
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
