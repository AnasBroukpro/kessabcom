import React, { useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, OverlayView, InfoWindowF } from '@react-google-maps/api';
import { MapPin, Star } from 'lucide-react';
import { cityMapping } from '../constants/cityMapping';

import { useSettings } from '../hooks/useSettings';

interface Listing {
  id: number;
  title: string;
  breed: string;
  location: string;
  weight: string;
  verified: boolean;
  rating: number;
  image: string;
  lat: number;
  lng: number;
}

interface Props {
  listings: Listing[];
  onListingClick: (listing: Listing) => void;
  hoveredListingId: number | null;
  setHoveredListingId: (id: number | null) => void;
}

interface MapContentProps extends Props {
  apiKey: string;
}

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

const MapContent: React.FC<MapContentProps> = ({ listings, onListingClick, hoveredListingId, setHoveredListingId, apiKey }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

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
      center={center}
      zoom={11}
      options={mapOptions}
    >
      {listings.map((listing) => (
        <React.Fragment key={listing.id}>
          <OverlayView
            position={{ lat: listing.lat, lng: listing.lng }}
            mapPaneName="overlayMouseTarget"
          >
            <div 
              className={`relative -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${hoveredListingId === listing.id ? 'scale-125 z-50' : 'scale-100 z-10'}`}
              onClick={() => onListingClick(listing)}
              onMouseEnter={() => setHoveredListingId(listing.id)}
              onMouseLeave={() => setHoveredListingId(null)}
            >
              <div className={`w-12 h-12 rounded-full border-4 shadow-lg overflow-hidden transition-colors ${hoveredListingId === listing.id ? 'border-primary' : 'border-white'}`}>
                <img src={listing.image} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              </div>
              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 shadow-lg transition-colors ${hoveredListingId === listing.id ? 'bg-primary' : 'bg-white'}`}></div>
            </div>
          </OverlayView>

          {hoveredListingId === listing.id && (
            <InfoWindowF
              position={{ lat: listing.lat, lng: listing.lng }}
              options={{ 
                pixelOffset: window.google ? new window.google.maps.Size(0, -40) : undefined 
              }}
            >
              <div className="w-48 bg-white rounded-xl overflow-hidden shadow-xl" dir="rtl">
                <img src={listing.image} className="w-full h-24 object-cover" alt={listing.title} referrerPolicy="no-referrer" />
                <div className="p-3 text-right">
                  <h4 className="font-bold text-xs text-gray-900 mb-1 truncate">{listing.title}</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <MapPin className="w-2 h-2" />
                      <span>
                        {(() => {
                          const rawCity = (listing.location || 'غير محدد').split(' ')[0];
                          return cityMapping[rawCity.toLowerCase()] || rawCity;
                        })()}
                      </span>
                    </div>
                    {renderStars(listing.rating)}
                  </div>
                </div>
              </div>
            </InfoWindowF>
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

  const apiKey = settings.googleMapsApiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-[#f8f9fa] flex items-center justify-center p-6 text-center">
        <div className="max-w-xs space-y-4">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">مفتاح الخريطة غير متوفر</h3>
          <p className="text-sm text-gray-600">يرجى إضافة مفتاح Google Maps API (VITE_GOOGLE_MAPS_API_KEY) في إعدادات التطبيق لتفعيل الخريطة.</p>
        </div>
      </div>
    );
  }

  return <MapContent {...props} apiKey={apiKey} />;
};

export default React.memo(GoogleMapComponent);
