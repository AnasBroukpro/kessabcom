import React from 'react';
import { PlusCircle, MapPin, Eye, Phone, MessageCircle, TrendingUp } from 'lucide-react';
import { getDisplayCity } from '../../constants/cityMapping';

interface FlockViewProps {
  announcements: any[];
  onNavigate: (view: any, listingId?: string) => void;
  settings: any;
  setListingToDelete: (id: string) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  renderStars: (rating: number) => React.ReactNode;
}

export default function FlockView({
  announcements,
  onNavigate,
  settings,
  setListingToDelete,
  setShowDeleteConfirm,
  renderStars
}: FlockViewProps) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-on-surface font-headline">القطيع ديالي</h2>
        <button onClick={() => onNavigate('add-listing')} className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
          <PlusCircle className="w-5 h-5" />
          <span>إضافة قطيع جديد</span>
        </button>
      </div>

      {(!Array.isArray(announcements) || announcements.length === 0) ? (
        <div 
          onClick={() => onNavigate('add-listing')}
          className="border-2 border-dashed border-primary/30 rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 hover:border-primary transition-all group"
        >
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-10 h-10 text-on-primary" />
          </div>
          <h3 className="text-2xl font-black text-on-surface mb-2 font-headline">إضافة قطيع جديد</h3>
          <p className="text-on-surface-variant font-medium">صور وسجل فيديو</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add New Listing Card (Bug #40 FIX: consistently show at start) */}
          <div 
            onClick={() => onNavigate('add-listing')}
            className="bg-white rounded-2xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 hover:border-primary transition-all group min-h-[300px]"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-primary text-primary group-hover:scale-110 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h3 className="font-black text-on-surface text-lg">إضافة عرض جديد</h3>
            <div className="mt-2 text-on-surface-variant">
              <PlusCircle className="w-4 h-4 rotate-45 opacity-20" />
            </div>
          </div>

          {announcements.map((announcement) => (
            <div key={announcement.id} className="bg-surface rounded-2xl overflow-hidden border border-outline-variant/30 shadow-sm group cursor-pointer" onClick={() => onNavigate('listing-details', announcement.id)}>
              <div className="relative h-48 overflow-hidden">
                <img alt={announcement.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={announcement.images?.[0] || "https://i.ytimg.com/vi/RrkkshRUttw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD92lI4Kxe5liKSwWZaJuLAFopNeA"} referrerPolicy="no-referrer" />
                <div className="absolute top-3 right-3 bg-primary text-on-primary px-2 py-1 rounded-md text-xs font-bold shadow-sm">{announcement.status === 'active' ? 'نشط' : 'غير نشط'}</div>
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur text-[#1A1A1A] px-2 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 cursor-pointer hover:bg-white transition-colors" onClick={(e) => {
                  e.stopPropagation();
                  const url = announcement.coordinates 
                    ? `https://www.google.com/maps/dir/?api=1&destination=${announcement.coordinates.lat},${announcement.coordinates.lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(announcement.location || '')}`;
                  window.open(url, '_blank');
                }}>
                  <MapPin className="w-3 h-3 text-[#2E7D32]" />
                  <span>{getDisplayCity(announcement)}</span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-on-surface text-lg">{announcement.title}</h3>
                  {renderStars(5)}
                </div>
                <div className="flex items-center gap-4 text-sm text-on-surface-variant mb-4">
                  <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {announcement.views || 0}</span>
                  <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {announcement.calls || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {announcement.messages || 0}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("SellerDashboard (Flock): Navigating to edit listing:", announcement.id);
                      onNavigate('add-listing', announcement.id);
                    }}
                    className="flex-1 py-2 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-variant transition-colors text-sm"
                  >
                    تعديل
                  </button>
                  {settings.paymentSystemEnabled && (
                    <button 
                      onClick={(e) => e.stopPropagation()}
                      className="flex-[1.5] py-2 bg-[#0a5c1a] text-white font-bold rounded-xl hover:bg-[#0a5c1a]/90 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <span>ترويج الإعلان</span>
                      <TrendingUp className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setListingToDelete(announcement.id);
                      setShowDeleteConfirm(true);
                    }}
                    className="px-4 py-2 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-colors text-sm"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
