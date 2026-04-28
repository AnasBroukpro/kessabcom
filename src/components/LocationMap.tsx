import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { useSettings } from '../hooks/useSettings';
import { useGoogleMaps } from '../contexts/GoogleMapsProvider';
import { Loader2 } from 'lucide-react';
import mapMarkerSvg from '../assets/map-marker-001.svg';

const defaultCenter = { lat: 33.5731, lng: -7.5898 };

interface Props {
  lat?: number;
  lng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  isFullscreen?: boolean;
  sellerInfo?: { name: string; rating: number };
  onAddressFetched?: (address: string, city: string, lat: number, lng: number) => void;
  retryTrigger?: number;
}

export default function LocationMap({
  lat, lng, onLocationSelect, isFullscreen, sellerInfo, onAddressFetched, retryTrigger
}: Props) {
  const { settings } = useSettings();
  const { isLoaded, loadError, apiKey } = useGoogleMaps();

  const mapRef   = useRef<google.maps.Map | null>(null);
  const geocoderRef     = useRef<google.maps.Geocoder | null>(null);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef   = useRef(false);

  // ── Stable refs for callbacks (avoids stale-closure issues with useCallback) ──
  const onLocationSelectRef = useRef(onLocationSelect);
  const onAddressFetchedRef = useRef(onAddressFetched);
  useEffect(() => { onLocationSelectRef.current = onLocationSelect; }, [onLocationSelect]);
  useEffect(() => { onAddressFetchedRef.current = onAddressFetched; }, [onAddressFetched]);

  // BUG 2: 3-state visual — dragging | loading | idle
  const [interactionState, setInteractionState] = useState<'dragging' | 'loading' | 'idle'>('idle');
  const [isGeocodingBlocked, setIsGeocodingBlocked] = useState(false);

  // Prevent loading if no key is found at all
  const hasKey = Boolean(apiKey && apiKey.trim().length > 10);

  // ── FIX BUG 2 (Drag block): Manage center locally & memoize map options ──
  const [mapCenter, setMapCenter] = useState((lat && lng) ? { lat, lng } : defaultCenter);
  
  useEffect(() => {
    if (!isDraggingRef.current) {
      setMapCenter((lat && lng) ? { lat, lng } : defaultCenter);
    }
  }, [lat, lng]);

  const mapOptions = React.useMemo(() => ({
    disableDefaultUI: true,
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    gestureHandling: 'greedy' as const,
  }), []);

  const containerStyle = React.useMemo(() => ({ width: '100%', height: '100%' }), []);

  // ── Geocode: uses Geocoder object (same session as Maps API → no referrer issues) ──
  const doGeocode = useCallback((gLat: number, gLng: number) => {
    if (!geocoderRef.current) return;
    const cb = onAddressFetchedRef.current;
    if (!cb) return;

    // Guaranteed reset to idle when geocoding finishes
    const handleResult = (formatted: string, city: string) => {
      cb(formatted, city, gLat, gLng);
      setTimeout(() => setInteractionState('idle'), 300);
    };

    const useNominatim = () => {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${gLat}&lon=${gLng}&format=jsonv2&accept-language=ar`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Kessabcom/1.0'
          }
        }
      )
        .then(r => r.json())
        .then(data => {
          if (data && data.display_name) {
            const formatted = data.name ? `${data.name}, ${data.display_name}` : data.display_name;
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
            handleResult(formatted, city);
          } else {
            handleResult('العنوان غير متاح', '');
          }
        })
        .catch(() => handleResult('العنوان غير متاح', ''));
    };

    if (isGeocodingBlocked || !geocoderRef.current) {
      useNominatim();
      return;
    }

    geocoderRef.current.geocode(
      { location: { lat: gLat, lng: gLng } },
      (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const formatted = results[0].formatted_address ?? '';
          let city = '';
          for (const comp of results[0].address_components ?? []) {
            if (comp.types.includes('locality')) { city = comp.long_name; break; }
            if (comp.types.includes('administrative_area_level_2') && !city) city = comp.long_name;
          }
          handleResult(formatted, city);
        } else {
          if (status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT' || status === 'UNKNOWN_ERROR') {
            console.warn(`Google Geocoding failed with status ${status}, falling back to Nominatim and blocking further Google requests.`);
            setIsGeocodingBlocked(true);
          }
          useNominatim();
        }
      },
    );
  }, [apiKey, isGeocodingBlocked]);

  // ── Map loaded: create Geocoder instance (Maps API guaranteed available here) ──
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
  }, []);

  // Mini-map: click to pick exact point
  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng && !isFullscreen) {
      onLocationSelectRef.current(e.latLng.lat(), e.latLng.lng());
    }
  }, [isFullscreen]);

  // Drag starts
  const onDragStart = useCallback(() => {
    isDraggingRef.current = true;
    if (isFullscreen) setInteractionState('dragging');
  }, [isFullscreen]);

  // ── onIdle: fires after load, pan, zoom, etc. ──
  const onIdle = useCallback(() => {
    if (!mapRef.current) return;
    const c = mapRef.current.getCenter();
    if (!c) return;
    const idleLat = c.lat();
    const idleLng = c.lng();

    const wasDragging = isDraggingRef.current;
    isDraggingRef.current = false;

    // ── BUG 1: mini-map → update coordinates from map CENTER after drag ──
    if (!isFullscreen) {
      if (wasDragging) onLocationSelectRef.current(idleLat, idleLng);
      return;
    }

    // ── Fullscreen path ──
    if (wasDragging) {
      onLocationSelectRef.current(idleLat, idleLng);
      setInteractionState('loading');
    }

    // ── BUG 3: ALWAYS geocode in fullscreen (initial open + after every drag) ──
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    geocodeTimerRef.current = setTimeout(() => {
      // Prevent infinite loop: only geocode if we aren't already loading 
      // or if we just finished dragging.
      doGeocode(idleLat, idleLng);
    }, 300);
  }, [isFullscreen, doGeocode]);

  useEffect(() => () => {
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
  }, []);

  // ── Manual retry geocoding when triggered from outside ──
  useEffect(() => {
    if (retryTrigger && retryTrigger > 0 && mapRef.current) {
      const c = mapRef.current.getCenter();
      if (c) doGeocode(c.lat(), c.lng());
    }
  }, [retryTrigger, doGeocode]);

  // ── Render ──
  if (!hasKey || loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500 p-4 text-center rounded-[12px]">
        <MapPin className="w-8 h-8 mb-2 opacity-50" />
        <span className="font-bold text-sm">عذرا، خريطة جوجل غير متاحة حاليا.</span>
        <span className="text-xs mt-1">المرجو التأكد من مفتاح API (Google Maps API Key).</span>
      </div>
    );
  }

  return isLoaded ? (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={14}
        onLoad={onLoad}
        onClick={onMapClick}
        onDragStart={onDragStart}
        onIdle={onIdle}
        options={mapOptions}
      />

      {/* ── Fullscreen: 3-state centered pin (pointer-events-none → gestures reach map) ── */}
      {isFullscreen && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10 pb-[15vh]">
          <div className="relative flex flex-col items-center">

            {/* Bubble frame */}
            <div
              className={`bg-white rounded-[16px] shadow-xl flex items-center border border-black/5 overflow-hidden transition-all duration-300 ${
                interactionState === 'idle' ? 'pr-4 pl-1.5 py-1.5' : 'p-2'
              }`}
              style={{
                transform: interactionState === 'dragging'
                  ? 'translateY(-14px) scale(1.05)'
                  : 'translateY(0) scale(1)',
                transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              {/* Icon square */}
              <div className="w-10 h-10 rounded-[12px] bg-[#f0f0f0] flex items-center justify-center shrink-0">
                {interactionState === 'loading' ? (
                  <Loader2 className="w-5 h-5 text-[#115e2c] animate-spin" />
                ) : (
                  <svg fill="#000000" className="w-5 h-5 opacity-90" viewBox="0 0 470.65 470.65">
                    <path d="M465.002,137.833c-23.877-24.105-58.897-33.549-82.07-39.798c-4.454-1.201-8.659-2.335-12.158-3.406 c-14.223-4.36-23.32-14.173-27.437-19.569c0.136-4.28-2.976-9.151-8.393-12.608l-5.772-3.685c-2.214-1.413-4.751-2.16-7.335-2.16 c-5.154,0-9.922,2.94-12.456,7.676l-75.116,134.402L162.782,64.86c-2.502-4.898-7.322-7.938-12.593-7.938 c-2.482,0-4.931,0.694-7.084,2.005l-5.838,3.558c-5.487,3.342-8.691,8.15-8.632,12.435c-4.216,5.302-13.483,14.903-27.771,18.948 c-3.517,0.995-7.742,2.037-12.216,3.14c-23.284,5.742-58.472,14.418-82.788,38c-7.127,6.914-6.469,12.624-4.66,16.197 l52.412,103.496c1.762,3.482,5.169,5.644,8.891,5.645c0,0,0,0,0,0c2.888,0,5.634-1.274,7.73-3.586 c5.012-5.527,23.381-23.859,49.349-27.69c21.019-3.102,45.715-8.478,69.513-24.838l0.281-0.194c0.575-0.398,2.03-1.405,2.766-1.57 c0.13,0.139,0.365,0.437,0.657,1.013l19.253,34.95l-81.089,145.091l-0.051,0.094c-3.779,7.127-1.493,16.345,5.094,20.549 l5.772,3.684c2.214,1.413,4.751,2.161,7.335,2.161c5.143,0,9.902-2.928,12.439-7.647l71.972-124.951l70.907,128.721 c2.506,4.88,7.317,7.908,12.578,7.908c2.481,0,4.931-0.693,7.085-2.005l5.836-3.557c6.671-4.063,9.129-13.234,5.48-20.444 l-79.682-149.172l21.037-36.521l0.082-0.149c0.296-0.558,0.531-0.848,0.663-0.984c0.739,0.184,2.173,1.221,2.74,1.632l0.279,0.201 c23.49,16.873,48.082,22.789,69.041,26.352c25.898,4.398,43.935,23.133,48.846,28.771c2.106,2.417,4.898,3.749,7.862,3.749 c0,0,0,0,0.001,0c3.639,0,7.009-2.093,8.796-5.462l54.283-102.329C471.232,150.59,471.997,144.897,465.002,137.833z"/>
                  </svg>
                )}
              </div>

              {/* Text hidden while dragging/loading, shown only when idle */}
              <div
                className={`flex flex-col items-start justify-center overflow-hidden transition-all duration-350 ease-in-out ${
                  interactionState === 'idle'
                    ? 'max-w-[200px] opacity-100 ml-3 mr-1'
                    : 'max-w-0 opacity-0 ml-0 mr-0'
                }`}
              >
                <span className="text-[10px] text-[#115e2c] font-black tracking-widest uppercase mb-0.5 whitespace-nowrap">
                  هنا موقع ضيعة
                </span>
                <span className="text-sm font-black text-on-surface whitespace-nowrap leading-none">
                  {sellerInfo?.name || 'موقعك'}
                </span>
              </div>
            </div>

            {/* Support stick */}
            <div
              className="w-[5px] bg-[#1c1c1e] rounded-b-full shadow-md"
              style={{
                height: '26px',
                transform: interactionState === 'dragging' ? 'translateY(-14px)' : 'translateY(0)',
                transition: 'transform 0.2s ease-out',
              }}
            />
          </div>

          {/* Ground shadow */}
          <div
            className="w-5 h-[7px] bg-black/20 rounded-full mt-[-3px] transition-all duration-200"
            style={{
              transform: interactionState === 'dragging' ? 'scale(1.6)' : 'scale(1)',
              opacity: interactionState === 'dragging' ? 0.2 : 0.5,
            }}
          />
        </div>
      )}
    </div>
  ) : (
    <div className="w-full h-full bg-[#f5f5f5] flex items-center justify-center text-on-surface-variant font-black">
      تحميل الخريطة...
    </div>
  );
}
