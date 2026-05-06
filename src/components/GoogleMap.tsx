import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
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

const defaultCenter = {
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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [localHoveredId, setLocalHoveredId] = useState<string | null>(null);
  const [scaledId, setScaledId] = useState<string | null>(null);
  const hasInitializedCenter = useRef(false);

  // activeId determines things like z-index and border color
  const activeId = localHoveredId || hoveredListingId;

  const initialCenter = useMemo(() => {
    if (listings.length > 0) {
      const lat = listings.reduce((sum, l) => sum + l.lat, 0) / listings.length;
      const lng = listings.reduce((sum, l) => sum + l.lng, 0) / listings.length;
      return { lat, lng };
    }
    return defaultCenter;
  }, [listings]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  // Pan to center whenever the *external* active listing changes
  useEffect(() => {
    if (map && hoveredListingId) {
      const listing = listings.find(l => l.id === hoveredListingId);
      if (listing) {
        map.panTo({ lat: listing.lat, lng: listing.lng });
      }
      
      // Delay the scale animation until map is likely centered (~800ms)
      const timer = setTimeout(() => {
        setScaledId(hoveredListingId);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setScaledId(null);
    }
  }, [map, hoveredListingId, listings]);

  if (loadError) {
    return (
      <div className="w-full h-full bg-[#fff5f5] flex items-center justify-center p-6 text-center">
        <div className="max-w-xs space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-red-900">خطأ في تحميل الخريطة</h3>
          <p className="text-sm text-red-600">المفتاح المستخدم قد يكون غير صالح. يرجى التأكد من صلاحية المفتاح في إعدادات التطبيق.</p>
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
      center={!hasInitializedCenter.current ? initialCenter : undefined}
      onTilesLoaded={() => { hasInitializedCenter.current = true; }}
      zoom={zoom || (listings.length > 0 ? 10 : 6)}
      options={{
        ...mapOptions,
        gestureHandling: interactive === false ? 'none' : 'cooperative',
        zoomControl: interactive !== false,
        scrollwheel: interactive !== false,
        disableDoubleClickZoom: interactive === false,
        draggable: interactive !== false,
      }}
      onLoad={onMapLoad}
    >
      {listings.map((listing) => {
        const isHovered = activeId === listing.id;
        // Scale instantly for local hover, or delayed for external list hover
        const isScaled = (scaledId === listing.id) || (localHoveredId === listing.id);
        
        return (
          <React.Fragment key={listing.id}>
            <Circle
              center={{ lat: listing.lat, lng: listing.lng }}
              radius={1000}
              options={{
                fillColor: '#2E7D32',
                fillOpacity: isHovered ? 0.1 : 0.05,
                strokeColor: '#2E7D32',
                strokeOpacity: 0,
                strokeWeight: 0,
                clickable: false,
              }}
            />

            <OverlayView
              position={{ lat: listing.lat, lng: listing.lng }}
              mapPaneName="overlayMouseTarget"
            >
              <div
                style={{
                  transform: 'translate(-50%, -50%)',
                  zIndex: isHovered ? 100 : 10,
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onClick={() => onListingClick(listing)}
                onMouseEnter={() => { 
                  setLocalHoveredId(listing.id); 
                }}
                onMouseLeave={() => { 
                  setLocalHoveredId(null); 
                }}
              >
                {/* 3x Scale Circle Image */}
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    border: isHovered ? '3px solid #2E7D32' : '3px solid white',
                    boxShadow: isHovered
                      ? '0 20px 50px rgba(0,0,0,0.4), 0 0 0 10px rgba(46,125,50,0.1)'
                      : '0 4px 12px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                    transform: isScaled ? 'scale(3)' : 'scale(1)',
                    transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s ease, box-shadow 0.6s ease',
                    position: 'relative',
                    backgroundColor: 'white',
                  }}
                >
                  <img
                    src={listing.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  
                  {/* Overlay content inside circle (visible when scaled) */}
                  {isScaled && (
                    <div className="absolute inset-0 flex flex-col items-center animate-in fade-in duration-500 overflow-hidden">
                      {/* Top: Rating Pill (Even smaller, closer to top border) */}
                      <div className="absolute top-1 bg-white rounded-full px-1 py-0.5 flex items-center gap-0.5 shadow-md border border-black/5 z-10">
                        <span className="text-[3.5px] font-black text-[#1A1A1A] leading-none mt-[0.5px]">
                          {(listing.rating || 5.0).toFixed(1)}
                        </span>
                        <Star 
                          className="w-[3.5px] h-[3.5px] fill-[#FFC107] text-[#FFC107]" 
                        />
                      </div>
                      
                      {/* Bottom: Farm Name with GRADIENT overlay (Even smaller, closer to bottom border) */}
                      <div className="absolute bottom-0 w-full text-center py-1.5 bg-gradient-to-t from-black/95 via-black/40 to-transparent px-1">
                        <p className="text-[3.8px] font-black text-white leading-tight drop-shadow-sm" dir="rtl">
                          ضيعة {listing.title.includes('ضيعة') ? listing.title.split('ضيعة')[1].trim() : listing.title.split(' - ')[0].trim()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </OverlayView>
          </React.Fragment>
        );
      })}
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
