import React from 'react';
import { useSettings } from '../hooks/useSettings';
import { TrendingUp, Info, Zap } from 'lucide-react';

interface NewsTickerProps {
  className?: string;
  isMobile?: boolean; // Determines sizing
}

export default function NewsTicker({ className = "", isMobile = false }: NewsTickerProps) {
  const { settings } = useSettings();
  const market = settings.stockMarket || {};
  
  const breakingNews = market.breakingNews;

  const prices = [
    { label: "سردي", price: market.sardi || 85, color: "bg-green-100 text-green-800 border-green-200" },
    { label: "بركي", price: market.bergui || 75, color: "bg-orange-100 text-orange-800 border-orange-200" },
    { label: "مستورد", price: market.imported || 65, color: "bg-blue-100 text-blue-800 border-blue-200" },
    { label: "الماعز", price: market.goats || 70, color: "bg-purple-100 text-purple-800 border-purple-200" }
  ];

  const newsItems: string[] = market.news || [
    "الفوج الأول من الخرفان الإسبانية دخل للسوق",
    "توقعات بارتفاع الطلب مع اقتراب العيد"
  ];

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-xl p-3 overflow-hidden border border-outline-variant/10 flex items-center gap-3 shadow-sm ${className}`}>
      <div className={`font-black text-primary whitespace-nowrap bg-white/90 z-20 pr-2 ${isMobile ? 'text-xs' : 'text-sm'} border-l border-outline-variant/20 ml-2`}>خبار السوق:</div>
      
      {/* Breaking News - Static Fixed Position for Maximum Impact */}
      {breakingNews && (
        <div className="relative z-20 shrink-0">
          <div className={`px-4 py-1.5 rounded-full bg-error text-on-error shadow-md flex items-center gap-2 ring-2 ring-error/30 animate-pulse ${isMobile ? 'text-[9px]' : 'text-xs'}`}>
            <Zap className={isMobile ? "w-3.5 h-3.5 fill-current" : "w-4 h-4 fill-current"} />
            <span className="font-black whitespace-nowrap">عاجل: {breakingNews}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-white absolute -top-0.5 -right-0.5 animate-ping opacity-75"></div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative border-r border-outline-variant/10 pr-2">
        <div className={`flex items-center animate-marquee whitespace-nowrap ${isMobile ? 'text-[10px]' : 'text-sm'} font-bold text-on-surface`}>
          {[...Array(3)].map((_, i) => (
            <React.Fragment key={i}>
              {/* Render Prices (Highlighted) */}
              {prices.map((item, idx) => (
                <div key={`param-${idx}`} className="flex items-center">
                  <span className={`mx-2 px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5 ${item.color}`}>
                    <TrendingUp className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
                    <span>{item.label}: <span className="font-black">{item.price}</span> درهم/كلغ</span>
                  </span>
                  <span className="mx-2 text-outline-variant">•</span>
                </div>
              ))}
              
              {/* Render Static News */}
              {newsItems.map((news, idx) => (
                <div key={`news-${idx}`} className="flex items-center">
                  <span className="mx-2 flex items-center gap-1.5 text-on-surface">
                    <Info className={`text-primary ${isMobile ? "w-3 h-3" : "w-4 h-4"}`} />
                    <span>{news}</span>
                  </span>
                  <span className="mx-2 text-outline-variant">•</span>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
