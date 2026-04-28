import React, { useState } from 'react';
import { Star, MapPin, Heart } from 'lucide-react';
import { getDisplayCity } from '../../constants/cityMapping';
import ContactSellerModal from '../ContactSellerModal';

interface FavoritesViewProps {
  favorites: any[];
  announcements: any[];
  listings: any[];
  onNavigate: (view: any, id?: string) => void;
  handleToggleFavorite: (id: string) => void;
}

const FavoritesView = ({ favorites, announcements, listings, onNavigate, handleToggleFavorite }: FavoritesViewProps) => {
  const [contactData, setContactData] = useState<{ phone?: string, whatsapp?: string, listingId?: string } | null>(null);
  const allListings = [...listings, ...announcements];
  const favoriteListings = allListings.filter(l => favorites.some(f => f.listingId === (l.id || l.listingId)?.toString()));

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-outline-variant'}`} />
      ))}
    </div>
  );

  return (
    <div className="space-y-8 w-full" dir="rtl">
      {contactData && (
        <ContactSellerModal 
          isOpen={!!contactData} 
          onClose={() => setContactData(null)}
          sellerPhone={contactData.phone}
          sellerWhatsapp={contactData.whatsapp}
          listingId={contactData.listingId}
        />
      )}
      
      <div className="w-full">
        <h2 className="text-3xl font-black text-on-surface font-headline mb-2">المفضلة ديالك</h2>
        <p className="text-on-surface-variant mb-8 text-lg">هنا غاتلقى كاع الحوالا اللي عجبوك وبغيتي ترجع ليهم من بعد.</p>
        
        {favoriteListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {favoriteListings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={() => onNavigate('listing-details', listing.id || listing.listingId)}>
                <div className="relative h-64 overflow-hidden">
                  <img alt={listing.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={listing.images?.[0] || listing.imageUrl || listing.image || 'https://i.ytimg.com/vi/RrkkshRUttw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD92lI4Kxe5liKSwWZaJuLAFopNeA'} referrerPolicy="no-referrer" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-[#1A1A1A] px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    كيبدا من {listing.minPrice || listing.price || '0'} درهم
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-[#1A1A1A] px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 cursor-pointer hover:bg-white transition-colors" onClick={(e) => {
                    e.stopPropagation();
                    const url = listing.coordinates 
                      ? `https://www.google.com/maps/dir/?api=1&destination=${listing.coordinates.lat},${listing.coordinates.lng}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.location || listing.city || '')}`;
                    window.open(url, '_blank');
                  }}>
                    <MapPin className="w-3 h-3 text-[#2E7D32]" />
                    <span>
                      {(() => {
                        const dist = listing.calculatedDistance || listing.distance || 0;
                        const city = getDisplayCity(listing);
                        
                        if (dist === 0 || dist >= 999) return city;
                        if (dist < 5) return `${city} (قريب ليك)`;
                        if (dist < 25) return `${city} (${Math.round(dist)} كلم)`;
                        return city;
                      })()}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite((listing.id || listing.listingId).toString());
                    }}
                    className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur rounded-full text-error shadow-sm z-10 hover:bg-white transition-colors"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[#2E7D32] font-bold text-sm">ضيعة {listing.sellerName || 'كساب'}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#757575]">الحجم:</span>
                        <div className="flex gap-1 text-[10px] font-bold text-[#4A4A4A]">
                          {(Array.isArray(listing.sizes) ? listing.sizes : ['medium']).slice(0, 2).map((size: string, idx: number) => (
                            <span key={idx} className="bg-surface-container-high px-1.5 py-0.5 rounded text-[9px] font-bold text-on-surface">
                              {size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : size === 'large' ? 'كبير' : size === 'extra-large' ? 'كبير جداً' : size}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-on-surface text-sm truncate max-w-[150px]">{listing.title}</h3>
                      <div className="flex items-center gap-0.5">
                        {renderStars(listing.rating || 5)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 border-t border-outline-variant/10 pt-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setContactData({ 
                          phone: listing.sellerPhone || listing.phone, 
                          whatsapp: listing.sellerWhatsapp || listing.whatsapp,
                          listingId: listing.id || listing.listingId 
                        });
                      }}
                      className="py-2.5 bg-[#2E7D32] text-white font-bold rounded-lg hover:bg-[#1B5E20] transition-colors text-xs"
                    >
                      تواصل مع الكساب
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('listing-details', listing.id || listing.listingId);
                      }}
                      className="py-2.5 bg-[#F9F9F6] text-[#1A1A1A] font-bold rounded-lg hover:bg-white hover:border-[#2E7D32] border border-transparent transition-all text-xs"
                    >
                      شوف التفاصيل
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface rounded-3xl border-2 border-dashed border-outline-variant/30">
            <Heart className="w-16 h-16 text-on-surface-variant/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-on-surface">ما عندك حتى إعلان فالمفضلة</h3>
            <p className="text-on-surface-variant mt-2">قلب فالخريطة ولا فاللائحة وضيف الحوالا اللي عجبوك</p>
            <button 
              onClick={() => onNavigate('search-results')}
              className="mt-6 text-primary font-bold hover:underline"
            >
              بدا البحث من هنا
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesView;
