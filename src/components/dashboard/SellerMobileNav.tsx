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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant/20 flex items-center justify-between px-2 pb-safe pt-2 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
      {items.map(item => (
        <button 
          key={item.id}
          onClick={() => setActiveTab(item.id as SellerTab)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors ${activeTab === item.id ? 'text-primary' : 'text-on-surface-variant hover:text-primary/70'}`}
        >
          <div className="relative">
            <item.icon className={`w-5 h-5 ${activeTab === item.id && 'fill-primary/20'}`} />
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-error text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">
                {item.badge}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
