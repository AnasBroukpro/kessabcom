import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, OverlayView, Circle } from '@react-google-maps/api';
import { MapPin, Star, ChevronLeft } from 'lucide-react';
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
  
  // Track if we've initialized the center to avoid snapping back
  const hasInitializedCenter = useRef(false);

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

  // Effect to pan when external hover changes (e.g. from sidebar list)
  useEffect(() => {
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
      // Only pass center once to avoid snapping back on re-renders
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
        return (
          <React.Fragment key={listing.id}>
            <Circle
              center={{ lat: listing.lat, lng: listing.lng }}
              radius={2000}
              options={{
                fillColor: '#2E7D32',
                fillOpacity: isHovered ? 0.15 : 0.08,
                strokeColor: '#2E7D32',
                strokeOpacity: isHovered ? 0.3 : 0.15,
                strokeWeight: 1,
                clickable: false,
              }}
            />

            <OverlayView
              position={{ lat: listing.lat, lng: listing.lng }}
              mapPaneName="overlayMouseTarget"
            >
              <div
                style={{
                  transform: `translate(-50%, -50%) scale(${isHovered ? 1.12 : 1})`,
                  transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  zIndex: isHovered ? 100 : 10,
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onClick={() => onListingClick(listing)}
                onMouseEnter={() => { 
                  setLocalHoveredId(listing.id); 
                  setHoveredListingId(listing.id);
                  // Disabled movement on direct marker hover as requested
                }}
                onMouseLeave={() => { 
                  setLocalHoveredId(null); 
                  setHoveredListingId(null); 
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    border: isHovered ? '3px solid #2E7D32' : '3px solid white',
                    boxShadow: isHovered
                      ? '0 8px 24px rgba(0,0,0,0.2)'
                      : '0 4px 12px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
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
                      transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.5s ease',
                    }}
                  />
                </div>
              </div>
            </OverlayView>

            {/* Modern Tooltip */}
            {isHovered && (
              <OverlayView
                position={{ lat: listing.lat, lng: listing.lng }}
                mapPaneName="floatPane"
                getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -(height + 42) })}
              >
                <div
                  className="relative group cursor-pointer pointer-events-auto"
                  onClick={() => onListingClick(listing)}
                  onMouseEnter={() => { setLocalHoveredId(listing.id); setHoveredListingId(listing.id); }}
                  onMouseLeave={() => { setLocalHoveredId(null); setHoveredListingId(null); }}
                >
                  {/* Modern Sleek Card */}
                  <div className="w-[220px] bg-white rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-outline-variant/10 animate-in zoom-in-95 duration-300">
                    {/* Top Image Section */}
                    <div className="relative h-28 overflow-hidden">
                      <img
                        src={listing.image}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={listing.title}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-[#FFC107] text-[#FFC107]" />
                          <span className="text-[10px] font-black text-[#1A1A1A]">{(listing.rating || 5).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4" dir="rtl">
                      <h4 className="font-black text-sm text-[#1A1A1A] mb-1.5 leading-tight">
                         ضيعة {listing.title.includes('ضيعة') ? listing.title.split('ضيعة')[1].trim() : listing.title}
                      </h4>
                      
                      <div className="flex items-center gap-1.5 text-[#757575] mb-4">
                        <MapPin className="w-3.5 h-3.5 text-[#2E7D32]" />
                        <span className="text-[11px] font-bold truncate">{listing.location}</span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-outline-variant/5">
                        <span className="text-[10px] font-black text-[#2E7D32]">تواصل دابا</span>
                        <ChevronLeft className="w-3.5 h-3.5 text-[#2E7D32]" />
                      </div>
                    </div>
                  </div>

                  {/* Triangle Arrow */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '10px solid transparent',
                      borderRight: '10px solid transparent',
                      borderTop: '11px solid white',
                      filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.05))',
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
