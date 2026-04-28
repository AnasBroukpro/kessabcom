import React, { useState } from 'react';
import { User, Star, MessageCircle, Heart, MapPin, ArrowLeft, ShieldCheck } from 'lucide-react';
import NewsTicker from '../NewsTicker';
import ActivityFeed from './ActivityFeed';
import { getDisplayCity } from '../../constants/cityMapping';

interface HomeViewProps {
  profile: any;
  platformStats: {
    totalUsers: number;
    activeListings: number;
    totalRequests: number;
    regionsCovered: number;
  };
  announcements: any[];
  favorites: any[];
  kessabaRequests: any[];
  listings: any[]; // Dummy listings for fallback
  onNavigate: (view: string, id?: any) => void;
  setActiveView: (view: any) => void;
  handleToggleFavorite: (listingId: string) => void;
}

const HomeView = ({
  profile,
  platformStats,
  announcements,
  favorites,
  kessabaRequests,
  listings,
  onNavigate,
  setActiveView,
  handleToggleFavorite
}: HomeViewProps) => {
  const [timeFilter, setTimeFilter] = useState<'day' | 'month'>('day');

  const stats = [
    { label: 'عدد المستخدمين', value: `${platformStats.totalUsers} مستخدم`, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'إعلانات مباشرة', value: `${platformStats.activeListings} إعلان`, icon: Star, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'طلبات العروض', value: `${platformStats.totalRequests} طلب`, icon: MessageCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'المفضلة عندي', value: `${favorites.length} طلب`, icon: Heart, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const breedClicks: Record<string, number> = {};
  let totalAllClicks = 0;

  if (Array.isArray(announcements)) {
    announcements.forEach(ann => {
      if (ann.category && ann.totalClicks) {
        breedClicks[ann.category] = (breedClicks[ann.category] || 0) + ann.totalClicks;
        totalAllClicks += ann.totalClicks;
      }
    });
  }

  const colors = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-blue-500', 'bg-purple-500'];
  
  const calculatedBreedPopularity = Object.entries(breedClicks)
    .map(([breed, clicks], index) => ({
      breed,
      percentage: totalAllClicks > 0 ? Math.round((clicks / totalAllClicks) * 100) : 0,
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);

  const breedPopularity = calculatedBreedPopularity.length > 0 ? calculatedBreedPopularity : [
    { breed: 'سردي', percentage: 0, color: 'bg-primary' },
    { breed: 'بركي', percentage: 0, color: 'bg-secondary' },
    { breed: 'تيمحضيت', percentage: 0, color: 'bg-tertiary' },
  ];

  const displayListings = (Array.isArray(announcements) && announcements.length > 0) ? announcements.slice(0, 3) : listings;

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-outline-variant'}`} />
      ))}
    </div>
  );

  return (
    <div className="space-y-8 w-full" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-on-surface font-headline">لوحة تحكم المشتري</h2>
          <p className="text-on-surface-variant">مرحبا بك {profile?.displayName || 'أحمد'}، هاهي نظرة عامة على النشاط ديالك</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-high p-1 rounded-xl">
          <button 
            onClick={() => setTimeFilter('day')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeFilter === 'day' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
          >
            اليوم
          </button>
          <button 
            onClick={() => setTimeFilter('month')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeFilter === 'month' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-variant'}`}
          >
            هاد الشهر
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((kpi, i) => (
          <div key={i} className="bg-surface p-6 rounded-3xl border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center mb-4`}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <p className="text-xs text-on-surface-variant mb-1 font-bold">{kpi.label}</p>
            <p className="text-xl font-black text-on-surface">
              {timeFilter === 'day' ? (i % 2 === 0 ? '0' : '1') : kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <NewsTicker className="shadow-none border border-outline-variant/10 p-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-on-surface font-headline">الإعلانات الأقرب إليك</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayListings.map((listing: any) => {
              const isFavorite = favorites.some(f => f.listingId === (listing.id || listing.listingId)?.toString());
              const listingImage = listing.images?.[0] || listing.imageUrl || listing.image || "https://i.ytimg.com/vi/RrkkshRUttw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD92lI4Kxe5liKSwWZaJuLAFopNeA";
              
              return (
                <div key={listing.id} className="bg-surface rounded-2xl p-3 flex gap-4 border border-outline-variant/30 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden" onClick={() => onNavigate('listing-details', listing.id || listing.listingId)}>
                  <div className="w-28 h-28 rounded-xl overflow-hidden relative shrink-0">
                    <img alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={listingImage} referrerPolicy="no-referrer" />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-primary px-2 py-0.5 rounded-lg text-[9px] font-black shadow-sm">
                      {listing.minPrice || listing.price || '0'} درهم
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h4 className="font-bold text-on-surface text-sm mb-1 line-clamp-1">{listing.title}</h4>
                      <div className="flex items-center gap-1 text-on-surface-variant text-[10px] font-bold">
                        <MapPin className="w-3 h-3 text-primary" />
                        <span className="truncate">
                          {(() => {
                            const dist = listing.distance || listing.calculatedDistance || 0;
                            const city = getDisplayCity(listing);
                            if (dist === 0 && !listing.distance) return city;
                            if (dist < 5) return `${city} (قريب ليك)`;
                            if (dist < 25) return `${city} (${Math.round(dist)} كلم)`;
                            return city;
                          })()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-primary/70 uppercase">السلالة</span>
                        <span className="text-xs font-bold text-on-surface">{listing.breed || listing.category || 'سردي'}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        {renderStars(listing.rating || 5)}
                        <span className="text-[8px] text-on-surface-variant font-bold mt-0.5">تقييم الكساب</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite((listing.id || listing.listingId).toString());
                    }}
                    className={`absolute top-3 left-3 p-1.5 rounded-full backdrop-blur-md transition-all z-10 ${isFavorite ? 'bg-error text-on-error shadow-lg shadow-error/20' : 'bg-white/80 text-on-surface-variant hover:text-error border border-outline-variant/10'}`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
              );
            })}
            <div onClick={() => onNavigate('search-results')} className="bg-surface rounded-2xl p-3 flex items-center justify-center border border-outline-variant/30 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group h-[104px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="font-bold text-primary">شوف كولشي</span>
              </div>
            </div>
          </div>

          <ActivityFeed 
            favorites={favorites}
            announcements={announcements}
            kessabaRequests={kessabaRequests}
            onNavigate={onNavigate}
            setActiveView={setActiveView}
          />
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-black text-on-surface font-headline">نصائح ليك</h3>
          <div className="bg-primary/5 rounded-3xl border border-primary/10 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-on-surface">كيفاش تختار أحسن حولي؟</h4>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              ركز ديما على العينين يكونو صافيين، والصوف تكون نقية وماكاتطيحش. الحركة ديال الحولي فالضيعة حتى هي مهمة بزاف.
            </p>
            <button onClick={() => setActiveView('tools')} className="text-primary font-bold text-sm hover:underline">
              قرا المزيد من النصائح
            </button>
          </div>

          <div className="bg-surface rounded-3xl border border-outline-variant/20 p-6">
            <h4 className="font-bold text-on-surface mb-6">السلالات الأكثر طلباً</h4>
            <div className="space-y-6">
              {breedPopularity.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-on-surface">{item.breed}</span>
                    <span className="text-on-surface-variant font-medium">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
