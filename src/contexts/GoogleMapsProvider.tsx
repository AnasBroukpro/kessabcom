import React, { createContext, useContext, ReactNode } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useSettings } from '../hooks/useSettings';
import { Loader2, MapPin } from 'lucide-react';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
  apiKey: string;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
};

export const GoogleMapsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings, loading } = useSettings();

  // Try to get key from Firebase settings first, then from env variables
  // We prioritize VITE_GOOGLE_MAPS_API_KEY from env to avoid "Demo Key" overrides from DB.
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || settings?.googleMapsApiKey || '';
  const hasKey = Boolean(apiKey && apiKey.trim().length > 10);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: hasKey ? apiKey : 'INVALID_KEY', // Prevents unauthorized loading if empty
  });

  if (loading) {
    return null; // Wait for settings to load
  }

  // If there's no key at all, we can still render children but any map component will show the error
  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError, apiKey }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};
