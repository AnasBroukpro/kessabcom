import React from 'react';
import { useSettings } from '../hooks/useSettings';
import { TrendingUp, Info, Zap } from 'lucide-react';

interface NewsTickerProps {
  className?: string;
  isMobile?: boolean;
}

export default function NewsTicker({ className = "", isMobile = false }: NewsTickerProps) {
  const { settings } = useSettings();
  const market = settings.stockMarket || {};

  const breakingNews = market.breakingNews;

  const prices = [
    { label: "سردي",    price: market.sardi    || 85, color: "bg-green-100 text-green-800 border-green-200" },
    { label: "بركي",    price: market.bergui   || 75, color: "bg-orange-100 text-orange-800 border-orange-200" },
    { label: "مستورد",  price: market.imported || 65, color: "bg-blue-100 text-blue-800 border-blue-200" },
    { label: "الماعز",  price: market.goats    || 70, color: "bg-purple-100 text-purple-800 border-purple-200" },
  ];

  const newsItems: string[] = Array.isArray(market.news) && market.news.length > 0
    ? market.news
    : ["الفوج الأول من الخرفان الإسبانية دخل للسوق", "توقعات بارتفاع الطلب مع اقتراب العيد"];

  /** Renders one full set of items (prices + news). Duplicated twice for seamless loop. */
  const renderSet = (keyPrefix: string, small: boolean) => (
    <div key={keyPrefix} className={`flex items-center shrink-0 ${small ? 'gap-0' : 'gap-0'}`}>
      {prices.map((item, idx) => (
        <div key={`${keyPrefix}-p-${idx}`} className="flex items-center">
          <span className={`mx-2 px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5 ${item.color} ${small ? 'text-[10px]' : 'text-sm'}`}>
            <TrendingUp className={small ? 'w-3 h-3' : 'w-4 h-4'} />
            <span>{item.label}: <span className="font-black">{item.price}</span> درهم/كلغ</span>
          </span>
          <span className="mx-1 text-outline-variant">•</span>
        </div>
      ))}
      {breakingNews && (
        <div className="flex items-center">
          <div className={`mx-2 px-3 py-1 rounded-full bg-error text-on-error shadow-sm flex items-center gap-2 ring-2 ring-error/20 ${small ? 'text-[10px]' : 'text-xs'}`}>
            <Zap className={`fill-current ${small ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <span className="font-black">عاجل: {breakingNews}</span>
          </div>
          <span className="mx-1 text-outline-variant">•</span>
        </div>
      )}
      {newsItems.map((news, idx) => (
        <div key={`${keyPrefix}-n-${idx}`} className="flex items-center">
          <span className={`mx-2 flex items-center gap-1.5 text-on-surface ${small ? 'text-[10px]' : 'text-sm'}`}>
            <Info className={`text-primary ${small ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <span>{news}</span>
          </span>
          <span className="mx-2 text-outline-variant">•</span>
        </div>
      ))}
    </div>
  );

  /* ── MOBILE ── */
  if (isMobile) {
    return (
      <div className={`w-full ${className}`}>
        {/* Breaking news standalone banner (mobile only) */}
        {breakingNews && (
          <div className="bg-error text-white p-2.5 w-full shadow-sm overflow-hidden">
            <div className="animate-marquee-fast">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-2 mx-8 shrink-0">
                  <Zap className="w-4 h-4 fill-current shrink-0" />
                  <span className="font-black text-xs whitespace-nowrap">عاجل: {breakingNews}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prices + news ticker */}
        <div className="bg-white/95 backdrop-blur-sm p-3 border-b border-outline-variant/10 flex items-center gap-3 shadow-sm overflow-hidden">
          <div className="font-black text-primary whitespace-nowrap bg-white/95 z-20 pr-1 text-xs border-l border-outline-variant/20 pl-2 shrink-0">
            خبار السوق:
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee">
              {renderSet('a', true)}
              {renderSet('b', true)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── DESKTOP ── */
  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-xl p-3 border border-outline-variant/10 flex items-center gap-3 shadow-sm overflow-hidden ${className}`}>
      <div className="font-black text-primary whitespace-nowrap bg-white/90 z-20 pr-2 text-sm border-l border-outline-variant/20 ml-2 shrink-0">
        خبار السوق:
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="animate-marquee">
          {renderSet('a', false)}
          {renderSet('b', false)}
        </div>
      </div>
    </div>
  );
}
