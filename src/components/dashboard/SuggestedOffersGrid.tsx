import React, { useState, useEffect } from 'react';
import { Loader2, MapPin, BadgeCheck, CheckCircle2, MessageSquare, Mic, Image as ImageIcon, Eye, X, Star, ArrowRight } from 'lucide-react';
import { firestoreService } from '../../services/firestoreService';
import { cityCoords, calculateDistance } from '../../constants/cityMapping';

interface SuggestedOffersGridProps {
  kessabaRequests: any[];
  setLightboxData: (data: any) => void;
  setContactOfferData: (data: any) => void;
  setAcceptOfferData: (data: any) => void;
  profile?: any;
  setReportOfferData: (data: any) => void;
}

export default function SuggestedOffersGrid({ kessabaRequests, setLightboxData, setContactOfferData, setAcceptOfferData, profile, setReportOfferData }: SuggestedOffersGridProps) {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offerListings, setOfferListings] = useState<Record<string, any>>({});
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOffers = async () => {
      setLoading(true);
      const activeRequests = kessabaRequests.filter(r => (r.status || '').toLowerCase() === 'open' || (r.status || '').toLowerCase() === 'active');
      if (activeRequests.length === 0) {
        if (isMounted) {
          setOffers([]);
          setLoading(false);
        }
        return;
      }

      try {
        const results = await Promise.all(activeRequests.map(r => firestoreService.getOffersForRequest(r.id)));
        
        // Handle both raw arrays and { data: [] } response structures
        const allOffers = results
          .map(res => Array.isArray(res) ? res : (res?.data || []))
          .flat()
          .sort((a, b) => {
            const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
            const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
            return tB - tA;
          });

        if (!isMounted) return;
        setOffers(allOffers);

        const uniqueSellers = [...new Set(allOffers.map(o => o.sellerId))].filter(Boolean);
        const listingsResults = await Promise.all(uniqueSellers.map(sid => firestoreService.getSellerListing(sid).then(listing => ({sid, listing}))));
        
        if (isMounted) {
          const listingsMap: Record<string, any> = {};
          listingsResults.forEach(l => { if(l.listing) listingsMap[l.sid] = l.listing; });
          setOfferListings(listingsMap);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching suggested offers:", error);
        if (isMounted) setLoading(false);
      }
    };

    fetchOffers();
    return () => { isMounted = false; };
  }, [kessabaRequests]);

  if (loading) {
    return <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#0d631b]" /></div>;
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 bg-surface rounded-[10px] border-2 border-dashed border-outline-variant/20">
        <BadgeCheck className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-on-surface">لا توجد عروض مقترحة حاليا</h3>
        <p className="text-on-surface-variant mt-1 text-sm">سيتم عرض جميع العروض التي تتلقاها هنا</p>
      </div>
    );
  }

  if (selectedOffer) {
    const listing = offerListings[selectedOffer.sellerId];
    const sellerName = selectedOffer.sellerPseudo || selectedOffer.sellerName || listing?.sellerPseudo || listing?.sellerName || listing?.name || 'كساب';
    const imgs = (selectedOffer.images || [selectedOffer.imageUrl]).filter(Boolean);
    const sellerCity = selectedOffer.sellerCity || listing?.city || 'المغرب';
    const sellerRating = listing?.rating || 5.0;

    return (
      <div className="flex-1 overflow-y-auto p-0" dir="rtl">
        <div className="max-w-2xl mx-auto pb-20">
          {/* Header Navigation */}
          <div className="flex items-center justify-between mb-8 bg-white/80 backdrop-blur-md p-4 rounded-xl border border-outline-variant/10 sticky top-0 z-10">
            <button 
              onClick={() => setSelectedOffer(null)}
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group"
            >
              <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
              <span className="font-black text-sm">الرجوع للعروض</span>
            </button>
            <h2 className="text-xl font-black text-on-surface font-headline">تفاصيل العرض</h2>
          </div>

          <div className="bg-white rounded-[10px] p-8 border border-outline-variant/20 shadow-xl space-y-8">
            {/* Seller Profile Header */}
            <div className="flex items-center gap-4 pb-6 border-b border-outline-variant/10">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center text-primary font-black text-3xl shadow-inner border border-primary/10">
                {sellerName[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-on-surface font-headline">{sellerName}</h3>
                    {listing?.isVerified && <BadgeCheck className="w-5 h-5 text-blue-500" />}
                  </div>
                  <button 
                    onClick={() => setReportOfferData({ id: selectedOffer.id, type: 'offer' })}
                    className="text-red-600 text-[11px] font-black hover:underline"
                  >
                    تبليغ عن هذا العرض
                  </button>
                </div>
                <div className="mt-1">
                  <p className="text-on-surface-variant font-medium text-sm">عرض مقترح من أفضل الكسابة</p>
                </div>
              </div>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-surface-container-low rounded-[10px] border border-outline-variant/10 text-center flex flex-col items-center justify-center group hover:border-primary/30 transition-colors">
                <p className="text-[10px] font-black text-on-surface-variant mb-1 uppercase tracking-wider">السعر المقترح</p>
                <p className="font-black text-[#0d631b] text-xl">{selectedOffer.price || 0} <span className="text-xs font-bold">درهم</span></p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-[10px] border border-outline-variant/10 text-center flex flex-col items-center justify-center group hover:border-primary/30 transition-colors">
                <p className="text-[10px] font-black text-on-surface-variant mb-1 uppercase tracking-wider">التقييم</p>
                <div className="flex items-center gap-1 font-black text-orange-500 text-xl">
                  {sellerRating} <Star className="w-4 h-4 fill-current" />
                </div>
              </div>
              <div className="p-4 bg-surface-container-low rounded-[10px] border border-outline-variant/10 text-center flex flex-col items-center justify-center group hover:border-primary/30 transition-colors">
                <p className="text-[10px] font-black text-on-surface-variant mb-1 uppercase tracking-wider">الموقع</p>
                <div className="flex items-center gap-1 font-black text-on-surface text-sm md:text-base line-clamp-1">
                  <MapPin className="w-4 h-4 text-primary shrink-0" /> {sellerCity}
                </div>
              </div>
            </div>

            {/* Images Grid */}
            {imgs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  <p className="font-black">صور العرض</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {imgs.map((img: string, idx: number) => (
                    <div
                      key={idx}
                      className="w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden border border-outline-variant/10 shadow-sm cursor-pointer relative group"
                      onClick={() => setLightboxData({ images: imgs, index: idx })}
                    >
                      <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                        <Eye className="w-6 h-6 text-white drop-shadow-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audio Message */}
            {selectedOffer.audioUrl && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Mic className="w-5 h-5 text-primary" />
                  <p className="font-black">رسالة صوتية من الكساب</p>
                </div>
                <div className="w-full p-4 bg-primary/5 rounded-[10px] flex items-center gap-4 border border-primary/10">
                  <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shrink-0 shadow-md">
                    <Mic className="w-5 h-5" />
                  </div>
                  <audio src={selectedOffer.audioUrl} controls className="h-8 flex-1 outline-none" />
                </div>
              </div>
            )}

            {/* Description */}
            {selectedOffer.description && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <p className="font-black">تفاصيل العرض</p>
                </div>
                <div className="p-6 bg-surface-container-low rounded-[10px] border border-outline-variant/10 relative">
                  <div className="absolute top-4 right-4 text-primary/10">
                    <MessageSquare className="w-8 h-8 rotate-180" />
                  </div>
                  <p className="text-on-surface font-medium leading-relaxed relative z-10 whitespace-pre-wrap">
                    {selectedOffer.description}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-6 border-t border-outline-variant/10">
              <button 
                onClick={() => {
                  setAcceptOfferData({ requestId: selectedOffer.requestId, offerId: selectedOffer.id });
                  setSelectedOffer(null);
                }}
                className="w-full py-4 bg-white text-[#0d631b] border-2 border-[#0d631b] font-black rounded-2xl hover:bg-[#0d631b] hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>قبول العرض</span>
              </button>

              <button 
                onClick={() => {
                  setContactOfferData({
                    phone: selectedOffer.sellerPhone || listing?.phone,
                    whatsapp: listing?.whatsapp || selectedOffer.sellerPhone || listing?.phone,
                    listingId: listing?.id
                  });
                }}
                className="w-full py-4 bg-[#0d631b] text-white font-black rounded-2xl hover:bg-[#0a4d15] transition-all flex flex-col items-center justify-center gap-1 shadow-lg shadow-[#0d631b]/20"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>تواصل مع الكساب</span>
                </div>
              </button>

              <button 
                onClick={() => {
                  if (selectedOffer.locationLink) {
                    window.open(selectedOffer.locationLink, '_blank');
                  } else if (selectedOffer.lat && selectedOffer.lng) {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedOffer.lat},${selectedOffer.lng}`, '_blank');
                  } else if (listing?.locationLink) {
                    window.open(listing.locationLink, '_blank');
                  } else if (listing?.lat && listing?.lng) {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${listing.lat},${listing.lng}`, '_blank');
                  } else {
                    const loc = selectedOffer.sellerLocation || selectedOffer.sellerCity || listing?.location || 'Maroc';
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`, '_blank');
                  }
                }}
                className="w-full py-4 bg-[#1A1A1A] text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5" />
                <span>طريق الضيعة (GPS)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {offers.map(offer => {
        const listing = offerListings[offer.sellerId];
        const sellerName = offer.sellerPseudo || offer.sellerName || listing?.sellerPseudo || listing?.sellerName || listing?.name || 'كساب';
        const sellerCity = offer.sellerCity || listing?.city || 'المغرب';
        const sellerRating = listing?.rating || 5.0;
        const price = offer.price || 0;
        const image = (offer.images && offer.images.length > 0) ? offer.images[0] : offer.imageUrl;
        const listingImage = image || "https://firebasestorage.googleapis.com/v0/b/kessabcom-0004.firebasestorage.app/o/announcements%2Fimages%2FayPrqndAltc56JQs4fmE5QAyMsF2_1777197825886_0?alt=media&token=99ac7f0e-c45a-4d76-986e-5d76168bd165";

        return (
          <div 
            key={offer.id} 
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 hover:shadow-xl transition-all duration-300 group cursor-pointer"
            onClick={() => setSelectedOffer(offer)}
          >
            <div className="relative h-64 overflow-hidden">
              <img 
                src={listingImage} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                referrerPolicy="no-referrer" 
                alt={sellerName}
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-[#1A1A1A] px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                {price} درهم
              </div>
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-[#1A1A1A] px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 cursor-pointer hover:bg-white transition-colors">
                <MapPin className="w-3 h-3 text-[#2E7D32]" />
                <span>
                  {(() => {
                    const userCity = profile?.city || '';
                    const userCoords = cityCoords[userCity];
                    const sellerCoords = cityCoords[sellerCity];
                    if (userCoords && sellerCoords) {
                      const dist = calculateDistance(userCoords.lat, userCoords.lng, sellerCoords.lat, sellerCoords.lng);
                      return `${sellerCity} (${Math.round(dist)} كلم)`;
                    }
                    return sellerCity;
                  })()}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[#2E7D32] font-bold truncate max-w-[150px]">{sellerName}</p>
                  <div className="flex items-center gap-0.5" dir="ltr">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3.5 h-3.5 ${i < Math.floor(sellerRating) ? 'fill-[#FFC107] text-[#FFC107]' : 'text-[#D1D1D1]'}`} 
                      />
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-1 border-t border-outline-variant/10 pt-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const l = offerListings[offer.sellerId];
                      setContactOfferData({
                        phone: offer.sellerPhone || l?.phone,
                        whatsapp: l?.whatsapp || offer.sellerPhone || l?.phone,
                        listingId: l?.id
                      });
                    }}
                    className="py-2.5 bg-[#2E7D32] text-white font-bold rounded-lg border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors text-sm text-center flex items-center justify-center"
                  >
                    تواصل مع الكساب
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOffer(offer);
                    }}
                    className="py-2.5 bg-[#F9F9F6] text-[#1A1A1A] font-bold rounded-lg border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors text-sm"
                  >
                    شوف التفاصيل
                  </button>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setReportOfferData({ id: offer.id, type: 'offer' });
                  }}
                  className="w-full text-center text-red-600 text-[10px] font-black hover:underline mt-1"
                >
                  تبليغ عن هذا العرض
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
