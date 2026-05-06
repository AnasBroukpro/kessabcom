import React from 'react';
import { PlusCircle, MapPin, Eye, Phone, MessageCircle, TrendingUp, Edit3, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';
import { getDisplayCity } from '../../constants/cityMapping';
import { firestoreService } from '../../services/firestoreService';

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
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 12;
  const totalPages = Math.ceil(announcements.length / pageSize);
  const currentAnnouncements = announcements.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#1A1A1A] font-headline tracking-tight">القطيع ديالي</h2>
          <div className="w-16 h-1 bg-[#115E2C] rounded-full mt-2"></div>
        </div>
        <button onClick={() => onNavigate('add-listing')} className="bg-[#115E2C] text-white px-8 py-4 rounded-[10px] font-black flex items-center gap-3 shadow-xl shadow-[#115E2C]/20 hover:scale-105 active:scale-95 transition-all">
          <PlusCircle className="w-6 h-6" />
          <span>إضافة قطيع جديد</span>
        </button>
      </div>

      {(!Array.isArray(announcements) || announcements.length === 0) ? (
        <div 
          onClick={() => onNavigate('add-listing')}
          className="border-2 border-dashed border-[#115E2C]/10 rounded-3xl p-16 flex flex-col items-center justify-center cursor-pointer bg-[#FDFCF8] hover:bg-white hover:border-[#115E2C]/30 hover:shadow-2xl transition-all group"
        >
          <div className="w-20 h-20 bg-[#115E2C] rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-[#115E2C]/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <PlusCircle className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-black text-[#1A1A1A] mb-2 font-headline">أضف حولي جديد</h3>
          <p className="text-[#757575] font-bold text-lg">صور وسجل فيديو</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Add New Listing Card (Inspired by User Image) */}
          <div 
            onClick={() => onNavigate('add-listing')}
            className="border-2 border-dashed border-[#115E2C]/15 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer bg-[#FDFCF8]/50 hover:bg-white hover:border-[#115E2C]/40 hover:shadow-xl transition-all duration-300 group min-h-[350px]"
          >
            <div className="w-20 h-20 bg-[#115E2C] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#115E2C]/20 group-hover:scale-110 transition-transform duration-500">
              <PlusCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-black text-[#1A1A1A] mb-2 font-headline">أضف حولي جديد</h3>
            <p className="text-[#757575] font-bold text-sm">صور وسجل فيديو</p>
          </div>

          {currentAnnouncements.map((announcement) => (
            <div 
              key={announcement.id} 
              onClick={() => onNavigate('listing-details', announcement.id)}
              className="bg-white rounded-[10px] overflow-hidden border border-outline-variant/5 shadow-sm group hover:shadow-2xl hover:border-[#115E2C]/10 transition-all duration-500 flex flex-col cursor-pointer"
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
                    <Edit3 className="w-4 h-4" />
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
                    <span>حذف</span>
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12 pb-10">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-2 rounded-xl bg-white border border-outline-variant/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${
                  currentPage === i + 1 
                    ? 'bg-[#115E2C] text-white shadow-lg' 
                    : 'bg-white text-[#757575] border border-outline-variant/10 hover:border-[#115E2C]/30'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-2 rounded-xl bg-white border border-outline-variant/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
