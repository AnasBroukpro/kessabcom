import React from 'react';
import { 
  Eye, MapPin, Phone, CheckCircle2, TrendingUp, PlusCircle, ArrowLeft, MessageCircle 
} from 'lucide-react';
import { getDisplayCity } from '../../constants/cityMapping';

import NewsTicker from '../NewsTicker';

interface DashboardHomeViewProps {
  profile: any;
  activeFilter: 'today' | 'week' | 'month';
  setActiveFilter: (filter: 'today' | 'week' | 'month') => void;
  stats: {
    totalViews: number;
    totalLocationRequests: number;
    totalCalls: number;
    activeCount: number;
    totalMessages: number;
  };
  announcements: any[];
  onNavigate: (view: any, listingId?: string) => void;
  setActiveTab: (tab: any) => void;
  settings: any;
  setListingToDelete: (id: string) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  renderStars: (rating: number) => React.ReactNode;
}

export default function DashboardHomeView({
  profile,
  activeFilter,
  setActiveFilter,
  stats,
  announcements,
  onNavigate,
  setActiveTab,
  settings,
  setListingToDelete,
  setShowDeleteConfirm,
  renderStars
}: DashboardHomeViewProps) {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-on-surface font-headline">لوحة تحكم الكساب</h2>
          <p className="text-on-surface-variant text-sm font-medium">
            مرحبا بك {(() => {
              const name = profile?.fullName || profile?.displayName;
              if (!name || name.toLowerCase() === 'user') return 'سي محمد';
              return name;
            })()}، هاهي نظرة عامة على النشاط ديالك
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-high p-1.5 rounded-2xl shadow-sm">
          {[
            { id: 'today', label: 'اليوم' },
            { id: 'week', label: 'هاد السيمانة' },
            { id: 'month', label: 'هاد الشهر' }
          ].map((f) => (
            <button 
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${activeFilter === f.id ? 'bg-[#0a5c1a] text-white shadow-md' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards (Buyer Style) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[
          { 
            label: 'إجمالي المشاهدات', 
            value: stats.totalViews, 
            unit: 'مشاهدة', 
            icon: Eye, 
            color: 'text-blue-600', 
            bg: 'bg-blue-50' 
          },
          { 
            label: 'زبناء حددو الموقع ديالك', 
            value: stats.totalLocationRequests, 
            unit: 'زبناء', 
            icon: MapPin, 
            color: 'text-green-600', 
            bg: 'bg-green-50' 
          },
          { 
            label: 'عدد الزبناء اللي اتصلوا بيك', 
            value: stats.totalCalls, 
            unit: 'شخص', 
            icon: Phone, 
            color: 'text-orange-600', 
            bg: 'bg-orange-50' 
          },
          { 
            label: 'الإعلانات النشطة', 
            value: stats.activeCount, 
            unit: 'إعلان', 
            icon: CheckCircle2, 
            color: 'text-purple-600', 
            bg: 'bg-purple-50' 
          },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 flex items-center justify-between shadow-sm border border-outline-variant/10 group hover:shadow-md transition-all">
            <div className="text-right">
              <p className="text-[10px] font-black text-on-surface-variant mb-1 leading-tight">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-black text-on-surface">{stat.value || 0}</p>
                <p className="text-[10px] font-bold text-on-surface-variant">{stat.unit}</p>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* ── News Band (White Background) ── */}
      <div className="mb-10">
        <NewsTicker className="!bg-white !border !border-outline-variant/10 !shadow-sm !rounded-2xl !p-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-8">
        {/* Right Column (2/3): My Flock */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-black text-on-surface font-headline">أحدث عروضك</h2>
            <button onClick={() => setActiveTab('flock')} className="text-[#0a5c1a] font-black text-sm flex items-center gap-1 hover:gap-2 transition-all">
              <span>شوف كلشي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.isArray(announcements) && announcements.slice(0, 2).map((announcement) => (
              <div key={announcement.id} className="bg-white rounded-[2rem] overflow-hidden border border-outline-variant/30 shadow-sm group hover:shadow-md transition-all">
                <div className="relative h-48 overflow-hidden">
                  <img alt={announcement.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={announcement.images?.[0] || "https://i.ytimg.com/vi/RrkkshRUttw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD92lI4Kxe5liKSwWZaJuLAFopNeA"} referrerPolicy="no-referrer" />
                  <div className="absolute top-4 right-4 bg-primary text-on-primary px-3 py-1 rounded-xl text-[10px] font-black shadow-lg">{announcement.status === 'active' ? 'نشط' : 'غير نشط'}</div>
                </div>
                <div className="p-6">
                  <h3 className="font-black text-on-surface text-base mb-1 truncate">{announcement.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-bold mb-4">
                    <MapPin className="w-3.5 h-3.5 text-[#0a5c1a]" />
                    <span>{getDisplayCity(announcement)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black">
                    <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg"><Eye className="w-3.5 h-3.5" /> {announcement.views || 0}</span>
                    <span className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-2 py-1 rounded-lg"><Phone className="w-3.5 h-3.5" /> {announcement.calls || 0}</span>
                  </div>
                </div>
              </div>
            ))}
            <div onClick={() => onNavigate('add-listing')} className="bg-surface-container-low rounded-[2rem] border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center h-full min-h-[180px] cursor-pointer hover:bg-white hover:border-primary/50 transition-all group">
               <PlusCircle className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
               <p className="font-black text-sm text-on-surface">إضافة عرض جديد</p>
               <ArrowLeft className="w-4 h-4 mt-2 text-on-surface-variant" />
            </div>
          </div>
        </div>

        {/* Left Column (1/3): Tips */}
        <div className="space-y-6">
          <div className="bg-[#F9F9F6] rounded-[2.5rem] p-8 border border-outline-variant/20 shadow-sm relative overflow-hidden h-full">
             <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
             <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 bg-[#0a5c1a] rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-primary/20">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <h3 className="font-black text-xl mb-3 leading-tight">نصائح للكساب</h3>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed mb-8 flex-1">
                  باش تبيع دغيا، صور الحولي فيديوهات واضحة فضو النهار. حاول تجاوب على مكالمات الزبناء فالحين، وكون شفاف فالثمن باش توفر عليك الوقت مع السمسارة.
                </p>
                <button 
                  onClick={() => onNavigate('tips')}
                  className="text-[#0a5c1a] font-black text-sm flex items-center gap-2 hover:gap-3 transition-all"
                >
                  <span>شوف كاع النصائح</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>
      </div>
    </>
  );
}
