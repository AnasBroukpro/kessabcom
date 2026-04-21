import React, { useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { useSettings } from '../hooks/useSettings';

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '1rem',
};

const defaultCenter = {
  lat: 33.5731,
  lng: -7.5898, // Default to a location in Morocco
};

interface Props {
  lat?: number;
  lng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

export default function LocationMap({ lat, lng, onLocationSelect }: Props) {
  const { settings, loading } = useSettings();
  const apiKey = settings?.googleMapsApiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const center = (lat && lng) ? { lat, lng } : defaultCenter;

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      onLocationSelect(e.latLng.lat(), e.latLng.lng());
    }
  }, [onLocationSelect]);

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={10}
      onClick={onMapClick}
    >
      {(lat && lng) && (
        <MarkerF 
          position={{ lat, lng }} 
          draggable={true}
          onDragEnd={(e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              onLocationSelect(e.latLng.lat(), e.latLng.lng());
            }
          }}
        />
      )}
    </GoogleMap>
  ) : <div className="w-full h-[300px] bg-surface-container-high rounded-2xl flex items-center justify-center text-on-surface-variant">تحميل الخريطة...</div>;
}
