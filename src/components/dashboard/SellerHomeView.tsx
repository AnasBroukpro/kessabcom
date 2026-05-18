import React from 'react';
import { 
  Eye, MapPin, Phone, CheckCircle2, TrendingUp, 
  ArrowLeft, PlusCircle, User, Settings, Trash2, MessageCircle
} from 'lucide-react';
import { getDisplayCity } from '../../constants/cityMapping';
import NewsTicker from '../NewsTicker';
import { firestoreService } from '../../services/firestoreService';

interface SellerHomeViewProps {
  profile: any;
  activeFilter: string;
  setActiveFilter: (filter: 'today' | 'week' | 'month') => void;
  stats: any;
  announcements: any[];
  onNavigate: (view: any, id?: string) => void;
  setActiveTab: (tab: any) => void;
  settings: any;
  setListingToDelete: (id: string) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  renderStars: (rating: number) => React.ReactNode;
}

export default function SellerHomeView({
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
}: SellerHomeViewProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Welcome Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="hidden md:flex w-16 h-16 bg-[#115E2C] rounded-[10px] items-center justify-center text-white shadow-xl shadow-[#115E2C]/10">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] font-headline tracking-tight truncate max-w-[280px] md:max-w-md" title={`مرحبا بك، ${profile?.pseudo || profile?.fullName || 'سي محمد'}`}>
              مرحبا بك، {profile?.pseudo || profile?.fullName || 'سي محمد'}
            </h1>
            <p className="text-[#757575] font-bold">هدا هو الوضع العام ديال القطيع ديالك اليوم</p>
          </div>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-[10px] shadow-sm border border-outline-variant/10">
          {['today', 'week', 'month'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as any)}
              className={`px-6 py-2.5 rounded-[10px] text-sm font-black transition-all ${activeFilter === filter ? 'bg-[#115E2C] text-white shadow-lg' : 'text-[#757575] hover:text-[#115E2C]'}`}
            >
              {filter === 'today' ? 'اليوم' : filter === 'week' ? 'هاد السيمانة' : 'هاد الشهر'}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {[
          { label: 'إجمالي المشاهدات', value: stats.totalViews, unit: 'مشاهدة', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50/50' },
          { label: 'زبناء حددو الموقع', value: stats.totalLocationRequests, unit: 'زبناء', icon: MapPin, color: 'text-[#115E2C]', bg: 'bg-[#E8F5E9]/50' },
          { label: 'اتصالات الزبناء', value: stats.totalCalls, unit: 'شخص', icon: Phone, color: 'text-orange-600', bg: 'bg-orange-50/50' },
          { label: 'إعلانات نشطة', value: stats.activeCount, unit: 'إعلان', icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50/50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[10px] p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-right shadow-sm border border-outline-variant/5 group hover:shadow-xl hover:border-[#115E2C]/10 transition-all duration-300">
            <div className="order-2 sm:order-1 mt-3 sm:mt-0">
              <p className="text-[9px] sm:text-[10px] font-black text-[#757575] mb-1 sm:mb-2 leading-tight uppercase tracking-wider">{stat.label}</p>
              <div className="flex items-baseline justify-center sm:justify-start gap-1 sm:gap-1.5">
                <p className="text-xl sm:text-3xl font-black text-[#1A1A1A]">{stat.value || 0}</p>
                <p className="text-[9px] sm:text-[10px] font-bold text-[#757575]">{stat.unit}</p>
              </div>
            </div>
            <div className={`order-1 sm:order-2 w-10 h-10 sm:w-14 sm:h-14 rounded-[10px] ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Market News Ticker Wrapper ── */}
      <div className="mb-12 bg-white rounded-[10px] border border-outline-variant/10 shadow-sm overflow-hidden">
        <NewsTicker className="!bg-transparent !border-none !shadow-none !p-4 !m-0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Right Column (2/3): Latest Offers */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className="text-2xl font-black text-[#1A1A1A] font-headline tracking-tight">أحدث عروضك</h2>
              <div className="w-12 h-1 bg-[#115E2C] rounded-full mt-2"></div>
            </div>
            <button onClick={() => setActiveTab('flock')} className="text-[#115E2C] font-black text-sm flex items-center gap-1.5 group hover:gap-2.5 transition-all">
              <span>شوف كلشي</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </button>
          </div>

          {/* Mobile Carousel / Desktop Grid */}
          <div className="flex md:grid md:grid-cols-2 gap-6 md:gap-8 overflow-x-auto md:overflow-x-visible pb-6 md:pb-0 snap-x no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {Array.isArray(announcements) && announcements.slice(0, 2).map((announcement) => (
              <div 
                key={announcement.id} 
                onClick={() => onNavigate('listing-details', announcement.id)}
                className="min-w-[280px] sm:min-w-[320px] md:min-w-0 bg-white rounded-[10px] overflow-hidden border border-outline-variant/5 shadow-sm group hover:shadow-2xl hover:border-[#115E2C]/10 transition-all duration-500 flex flex-col snap-center cursor-pointer"
              >
                <div className="relative h-56 overflow-hidden">
                  <img alt={announcement.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={announcement.images?.[0] || "https://i.ytimg.com/vi/RrkkshRUttw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD92lI4Kxe5liKSwWZaJuLAFopNeA"} referrerPolicy="no-referrer" />
                  <div className="absolute top-5 right-5 z-10" onClick={(e) => e.stopPropagation()}>
                    <label className="flex items-center gap-2 cursor-pointer bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-[10px] shadow-xl">
                      <span className={`text-[10px] font-black ${announcement.status === 'active' ? 'text-[#115E2C]' : 'text-red-600'}`}>
                        {announcement.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                      <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${announcement.status === 'active' ? 'bg-[#115E2C]' : 'bg-red-200'}`}>
                        <input 
                          type="checkbox" 
                          className="absolute w-full h-full opacity-0 cursor-pointer z-10 m-0" 
                          checked={announcement.status === 'active'}
                          onChange={async () => {
                            const newStatus = announcement.status === 'active' ? 'inactive' : 'active';
                            try {
                              await firestoreService.updateAnnouncement(announcement.id, { status: newStatus });
                            } catch (error) {
                              console.error("Error updating status:", error);
                            }
                          }}
                        />
                        <span className={`absolute h-3.5 w-3.5 rounded-full bg-white transition-all ${announcement.status === 'active' ? 'left-1' : 'right-1'}`} />
                      </div>
                    </label>
                  </div>
                  <div className="absolute bottom-5 right-5 bg-white/90 backdrop-blur-xl text-[#1A1A1A] px-4 py-2 rounded-[10px] text-[10px] font-black shadow-lg flex items-center gap-2 cursor-pointer hover:bg-[#115E2C] hover:text-white transition-all transition-colors" onClick={(e) => {
                    e.stopPropagation();
                    const url = announcement.coordinates 
                      ? `https://www.google.com/maps/dir/?api=1&destination=${announcement.coordinates.lat},${announcement.coordinates.lng}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(announcement.location || '')}`;
                    window.open(url, '_blank');
                  }}>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{getDisplayCity(announcement)}</span>
                  </div>
                </div>
                
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h3 className="font-black text-[#1A1A1A] text-sm sm:text-base truncate group-hover:text-[#115E2C] transition-colors">{announcement.title}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {renderStars(5)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-black mb-8">
                    <span className="flex items-center gap-2 bg-[#E8F5E9] text-[#115E2C] px-3 py-1.5 rounded-[10px]"><Eye className="w-4 h-4" /> {announcement.views || 0}</span>
                    <span className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-[10px]"><Phone className="w-4 h-4" /> {announcement.calls || 0}</span>
                    <span className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-[10px]"><MessageCircle className="w-4 h-4" /> {announcement.messages || 0}</span>
                  </div>

                  <div className="flex gap-3 mt-auto">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('add-listing', announcement.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#F5F5F0] text-[#1A1A1A] font-black rounded-[10px] hover:bg-[#115E2C] hover:text-white transition-all duration-300 text-sm"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>تعديل</span>
                    </button>
                    {settings.paymentSystemEnabled && (
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="flex-[1.5] py-3.5 bg-[#115E2C] text-white font-black rounded-[10px] hover:shadow-xl hover:shadow-[#115E2C]/20 transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>ترويج الإعلان</span>
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setListingToDelete(announcement.id);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-auto px-4 flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-[10px] hover:bg-red-600 hover:text-white transition-all duration-300 font-black text-sm"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Listing Block (Moved below carousel) */}
          <div 
            onClick={() => onNavigate('add-listing')} 
            className="bg-[#FDFCF8] rounded-[10px] border-2 border-dashed border-[#115E2C]/20 flex items-center justify-between p-6 cursor-pointer hover:bg-white hover:border-[#115E2C]/50 hover:shadow-xl transition-all duration-300 group w-full"
          >
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-[10px] bg-[#E8F5E9] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-6 h-6 text-[#115E2C]" />
               </div>
               <div>
                 <p className="font-black text-lg text-[#1A1A1A]">إضافة عرض جديد</p>
                 <p className="text-sm text-[#757575] font-bold">صور، سجل وبيع دغيا</p>
               </div>
             </div>
             <ArrowLeft className="w-6 h-6 text-[#115E2C] transition-transform group-hover:-translate-x-2" />
          </div>
        </div>

        {/* Left Column (1/3): Tips Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-[10px] p-8 border border-outline-variant/10 shadow-sm relative overflow-hidden h-full flex flex-col group hover:shadow-2xl transition-all duration-500">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#115E2C]/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#115E2C]/10 transition-colors"></div>
             <div className="relative z-10 flex flex-col h-full text-right">
                <div className="w-14 h-14 bg-[#115E2C] rounded-[10px] flex items-center justify-center text-white mb-6 shadow-xl shadow-[#115E2C]/20 group-hover:rotate-6 transition-transform">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h3 className="font-black text-2xl mb-4 leading-tight text-[#1A1A1A]">نصائح للكساب</h3>
                <p className="text-sm text-[#757575] font-medium leading-relaxed mb-8 flex-1">
                  باش تبيع دغيا، صور الحولي فيديوهات واضحة فضو النهار. حاول تجاوب على مكالمات الزبناء فالحين، وكون شفاف فالثمن باش توفر عليك الوقت مع السمسارة.
                </p>
                <button 
                  onClick={() => onNavigate('tips')}
                  className="w-full py-4 bg-[#F5F5F0] text-[#115E2C] rounded-[10px] font-black text-sm flex items-center justify-center gap-3 hover:bg-[#115E2C] hover:text-white transition-all duration-300"
                >
                  <span>شوف كاع النصائح</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
