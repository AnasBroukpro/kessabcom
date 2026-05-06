import React, { useMemo, useState, useCallback } from 'react';
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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  // Local hover state to make individual marker hover reliable
  const [localHoveredId, setLocalHoveredId] = useState<string | null>(null);

  const activeId = localHoveredId || hoveredListingId;

  const mapCenter = useMemo(() => {
    if (listings.length > 0) {
      const lat = listings.reduce((sum, l) => sum + l.lat, 0) / listings.length;
      const lng = listings.reduce((sum, l) => sum + l.lng, 0) / listings.length;
      return { lat, lng };
    }
    return center;
  }, [listings]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  React.useEffect(() => {
    if (map && hoveredListingId) {
      const listing = listings.find(l => l.id === hoveredListingId);
      if (listing) {
        map.panTo({ lat: listing.lat, lng: listing.lng });
      }
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
      center={mapCenter}
      onLoad={onMapLoad}
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
      {listings.map((listing) => {
        const isHovered = activeId === listing.id;
        return (
          <React.Fragment key={listing.id}>
            {/* Hotspot Circle with Pulse Effect */}
            <Circle
              center={{ lat: listing.lat, lng: listing.lng }}
              radius={3000}
              options={{
                fillColor: '#2E7D32',
                fillOpacity: isHovered ? 0.20 : 0.12,
                strokeColor: '#2E7D32',
                strokeOpacity: isHovered ? 0.35 : 0.2,
                strokeWeight: 1.5,
                clickable: false,
              }}
            />

            {/* Marker: circle image */}
            <OverlayView
              position={{ lat: listing.lat, lng: listing.lng }}
              mapPaneName="overlayMouseTarget"
            >
              <div
                style={{
                  transform: `translate(-50%, -50%) scale(${isHovered ? 1.15 : 1})`,
                  transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  zIndex: isHovered ? 100 : 10,
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onClick={() => onListingClick(listing)}
                onMouseEnter={() => { 
                  setLocalHoveredId(listing.id); 
                  setHoveredListingId(listing.id);
                  if (map) {
                    map.panTo({ lat: listing.lat, lng: listing.lng });
                  }
                }}
                onMouseLeave={() => { setLocalHoveredId(null); setHoveredListingId(null); }}
              >
                {/* Glow ring */}
                <div
                  style={{
                    position: 'absolute',
                    inset: '-6px',
                    borderRadius: '50%',
                    background: '#2E7D32',
                    opacity: isHovered ? 0.25 : 0,
                    filter: 'blur(8px)',
                    transition: 'opacity 0.3s ease',
                    pointerEvents: 'none',
                  }}
                />

                {/* Circle image */}
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    border: isHovered ? '3px solid #2E7D32' : '3px solid white',
                    boxShadow: isHovered
                      ? '0 0 0 4px rgba(46,125,50,0.15), 0 8px 24px rgba(0,0,0,0.25)'
                      : '0 4px 12px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    position: 'relative',
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
                      // Smooth pan/focus: shift image position on hover
                      objectPosition: isHovered ? '55% 45%' : '50% 50%',
                      transform: isHovered ? 'scale(1.18)' : 'scale(1)',
                      transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), object-position 0.6s ease',
                    }}
                  />
                  {/* Verified Badge */}
                  {listing.verified && (
                    <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'white', borderRadius: '50%', padding: '2px' }}>
                      <div style={{ background: '#2E7D32', borderRadius: '50%', padding: '2px' }}>
                        <Star style={{ width: '8px', height: '8px', color: 'white', fill: 'white' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </OverlayView>

            {/* Tooltip — shown on hover */}
            {isHovered && (
              <OverlayView
                position={{ lat: listing.lat, lng: listing.lng }}
                mapPaneName="floatPane"
                getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -(height + 45) })}
              >
                <div
                  style={{ position: 'relative', cursor: 'pointer', pointerEvents: 'auto' }}
                  onClick={() => onListingClick(listing)}
                  onMouseEnter={() => { setLocalHoveredId(listing.id); setHoveredListingId(listing.id); }}
                  onMouseLeave={() => { setLocalHoveredId(null); setHoveredListingId(null); }}
                >
                  {/* Card */}
                  <div
                    className="w-48 bg-white rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/10 animate-in zoom-in-95 duration-200"
                    dir="rtl"
                  >
                    <div className="relative h-24 overflow-hidden">
                      <img
                        src={listing.image}
                        className="w-full h-full object-cover"
                        alt={listing.title}
                        referrerPolicy="no-referrer"
                        style={{
                          transform: 'scale(1.05)',
                          transition: 'transform 0.4s ease',
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="font-black text-xs text-[#1A1A1A] mb-1">
                        ضيعة {listing.title.includes('ضيعة') ? listing.title.split('ضيعة')[1].trim() : listing.title}
                      </h4>
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

                  {/* Triangle pointer (Pointe / Flèche) */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '10px solid transparent',
                      borderRight: '10px solid transparent',
                      borderTop: '10px solid white',
                      filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.1))',
                    }}
                  />
                </div>
              </OverlayView>
            )}
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
