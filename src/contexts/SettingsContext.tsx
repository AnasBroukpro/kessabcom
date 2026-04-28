import React, { createContext, useContext, useState, useEffect } from 'react';
import { firestoreService } from '../services/firestoreService';

export interface AppSettings {
  solidarityDonationEnabled: boolean;
  maintenanceMode: boolean;
  activationDate: string | null;
  aidDate: string | null;
  aidNotificationEnabled: boolean;
  aidNotificationDaysBefore: number;
  autoAcceptSellers: boolean;
  paymentSystemEnabled: boolean;
  guestBuyerMode: boolean;
  googleMapsApiKey: string;
  auctionSystemEnabled: boolean;
  maxListingsPerFreeUser: number;
  maxHomeListings: number;
  stockMarket: {
    sheep: number;
    goats: number;
    sardi?: number;
    bergui?: number;
    imported?: number;
    news?: string[];
    breakingNews?: string;
  };
  monetization: {
    proMonthly: number;
    farmMonthly: number;
    boost3Days: number;
    boost7Days: number;
  };
  banners?: {
    banner1?: string;
    banner1Desc?: string;
    banner1Mobile?: string;
    banner1Url?: string;
    banner1Enabled?: boolean;
    banner1DesktopEnabled?: boolean;
    banner1MobileEnabled?: boolean;
    banner2?: string;
    banner2Desc?: string;
    banner2Mobile?: string;
    banner2Url?: string;
    banner2Enabled?: boolean;
    banner2DesktopEnabled?: boolean;
    banner2MobileEnabled?: boolean;
    banner3?: string;
    banner3Desc?: string;
    banner3Mobile?: string;
    banner3Url?: string;
    banner3Enabled?: boolean;
    banner3DesktopEnabled?: boolean;
    banner3MobileEnabled?: boolean;
  };
}

const defaultSettings: AppSettings = {
  solidarityDonationEnabled: true,
  maintenanceMode: false,
  activationDate: null,
  aidDate: null,
  aidNotificationEnabled: true,
  aidNotificationDaysBefore: 3,
  autoAcceptSellers: true,
  paymentSystemEnabled: true,
  guestBuyerMode: false,
  googleMapsApiKey: '',
  auctionSystemEnabled: true,
  maxListingsPerFreeUser: 5,
  maxHomeListings: 6,
  stockMarket: {
    sheep: 70,
    goats: 55,
    sardi: 75,
    bergui: 65,
    imported: 50,
    news: [],
    breakingNews: ''
  },
  monetization: {
    proMonthly: 199,
    farmMonthly: 499,
    boost3Days: 49,
    boost7Days: 99
  },
  banners: {}
};

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data) {
          const merged = { 
            ...defaultSettings, 
            ...(data.main || {}),
            banners: {
              ...(data.banner1 || {}),
              ...(data.banner2 || {}),
              ...(data.banner3 || {}),
            }
          };
          setSettings(merged);
        }
      } catch (error) {
        console.warn("Settings fetch issue:", error);
        // Fallback is already defaultSettings via useState initialization
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
    // Removed setInterval to prevent excessive Firestore reads
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const { banners, ...globalSettings } = newSettings;

      if (Object.keys(globalSettings).length > 0) {
        await firestoreService.adminUpdateSetting('global', globalSettings);
      }

      if (banners) {
        const b1: any = {};
        const b2: any = {};
        const b3: any = {};

        Object.entries(banners).forEach(([key, value]) => {
          if (key.startsWith('banner1')) b1[key] = value;
          else if (key.startsWith('banner2')) b2[key] = value;
          else if (key.startsWith('banner3')) b3[key] = value;
        });

        if (Object.keys(b1).length > 0) await firestoreService.adminUpdateSetting('banner1', b1);
        if (Object.keys(b2).length > 0) await firestoreService.adminUpdateSetting('banner2', b2);
        if (Object.keys(b3).length > 0) await firestoreService.adminUpdateSetting('banner3', b3);
      }
      
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
