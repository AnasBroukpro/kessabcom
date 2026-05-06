import React, { useMemo } from 'react';
import { GoogleMap, OverlayView, Circle } from '@react-google-maps/api';
import { MapPin, Star } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useGoogleMaps } from '../contexts/GoogleMapsProvider';

interface Listing {
  id: string;
  title: string;
  breed: string;
  location: string;
  weight: string;
  verified: boolean;
  rating: number;
  image: string;
  lat: number;
  lng: number;
  phone?: string;
  whatsapp?: string;
}

interface Props {
  listings: Listing[];
  onListingClick: (listing: Listing) => void;
  onContactClick?: (listing: Listing) => void;
  hoveredListingId: string | null;
  setHoveredListingId: (id: string | null) => void;
  zoom?: number;
  interactive?: boolean;
}

interface MapContentProps extends Props {}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 33.5731,
  lng: -7.5898,
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

const MapContent: React.FC<MapContentProps> = ({ listings, onListingClick, hoveredListingId, setHoveredListingId, zoom, interactive }) => {
  const { isLoaded, loadError } = useGoogleMaps();

  const mapCenter = useMemo(() => {
    if (listings.length > 0) {
      // Calculate average center
      const lat = listings.reduce((sum, l) => sum + l.lat, 0) / listings.length;
      const lng = listings.reduce((sum, l) => sum + l.lng, 0) / listings.length;
      return { lat, lng };
    }
    return center;
  }, [listings]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-2 h-2 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
        ))}
      </div>
    );
  };

  if (loadError) {
    return (
      <div className="w-full h-full bg-[#fff5f5] flex items-center justify-center p-6 text-center">
        <div className="max-w-xs space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-red-900">خطأ في تحميل الخريطة</h3>
          <p className="text-sm text-red-600">المفتاح المستخدم قد يكون غير صالح (InvalidKeyMapError). يرجى التأكد من صلاحية المفتاح في إعدادات التطبيق.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-[#e5e3df] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant font-bold">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={zoom || (listings.length > 0 ? 10 : 6)}
      options={{
        ...mapOptions,
        gestureHandling: interactive === false ? 'none' : 'cooperative',
        zoomControl: interactive !== false,
        scrollwheel: interactive !== false,
        disableDoubleClickZoom: interactive === false,
        draggable: interactive !== false,
      }}
    >
      {listings.map((listing) => (
        <React.Fragment key={listing.id}>
          {/* Hotspot Circle with Pulse Effect */}
          <Circle
            center={{ lat: listing.lat, lng: listing.lng }}
            radius={3000}
            options={{
              fillColor: '#2E7D32',
              fillOpacity: 0.12,
              strokeColor: '#2E7D32',
              strokeOpacity: 0.2,
              strokeWeight: 1.5,
              clickable: false,
            }}
          />
          
          <OverlayView
            position={{ lat: listing.lat, lng: listing.lng }}
            mapPaneName="overlayMouseTarget"
          >
            <div 
              className={`relative -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 ${hoveredListingId === listing.id ? 'scale-110 z-[100]' : 'scale-100 z-10'}`}
              onClick={() => onListingClick(listing)}
              onMouseEnter={() => setHoveredListingId(listing.id)}
              onMouseLeave={() => setHoveredListingId(null)}
            >
              {/* Marker Container */}
              <div className="relative group">
                {/* Glow Background */}
                <div className={`absolute inset-0 rounded-full blur-md transition-all duration-500 ${hoveredListingId === listing.id ? 'bg-[#2E7D32]/40 scale-125' : 'bg-black/10'}`}></div>
                
                {/* Image Circle */}
                <div className={`relative w-14 h-14 rounded-full border-[3px] shadow-2xl overflow-hidden transition-all duration-300 ${hoveredListingId === listing.id ? 'border-[#2E7D32] ring-4 ring-[#2E7D32]/10' : 'border-white hover:border-[#2E7D32]/50'}`}>
                  <img 
                    src={listing.image} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    alt="" 
                    referrerPolicy="no-referrer" 
                  />
                  {/* Verified Badge Mini */}
                  {listing.verified && (
                    <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-md">
                      <div className="bg-[#2E7D32] rounded-full p-0.5">
                        <Star className="w-2 h-2 text-white fill-white" />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Pointing Triangle */}
                <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 shadow-xl transition-colors duration-300 ${hoveredListingId === listing.id ? 'bg-[#2E7D32]' : 'bg-white'}`}></div>
              </div>
            </div>
          </OverlayView>

          {(hoveredListingId === listing.id || (window as any).activeListingId === listing.id) && (
            <OverlayView
              position={{ lat: listing.lat, lng: listing.lng }}
              mapPaneName="floatPane"
              getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -(height + 45) })}
            >
              <div 
                className="w-48 bg-white rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/10 cursor-pointer transition-transform hover:scale-105 pointer-events-auto" 
                dir="rtl"
                onClick={() => onListingClick(listing)}
              >
                <div className="relative h-24">
                  <img src={listing.image} className="w-full h-full object-cover" alt={listing.title} referrerPolicy="no-referrer" />
                </div>
                <div className="p-3">
                  <h4 className="font-black text-xs text-[#1A1A1A] mb-1">ضيعة {listing.title.includes('ضيعة') ? listing.title.split('ضيعة')[1].trim() : listing.title}</h4>
                  
                  <div className="flex items-center gap-1 text-[9px] text-[#757575] font-bold mb-2">
                    <MapPin className="w-2.5 h-2.5 text-[#2E7D32]" />
                    <span className="truncate">موقع الضيعة: {listing.location}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#FFC107] text-[#FFC107]" />
                    <span className="text-[10px] font-black text-[#1A1A1A]">{(listing.rating || 5).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </OverlayView>
          )}
        </React.Fragment>
      ))}
    </GoogleMap>
  );
};

const GoogleMapComponent: React.FC<Props> = (props) => {
  const { settings, loading } = useSettings();

  if (loading) {
    return (
      <div className="w-full h-full bg-[#e5e3df] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { apiKey } = useGoogleMaps();

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-[#f8f9fa] flex items-center justify-center p-6 text-center">
        <div className="max-w-xs space-y-4">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">مفتاح الخريطة غير متوفر</h3>
          <p className="text-sm text-gray-600">يرجى إضافة مفتاح Google Maps API في إعدادات التطبيق لتفعيل الخريطة.</p>
        </div>
      </div>
    );
  }

  return <MapContent {...props} />;
};

export default React.memo(GoogleMapComponent);
