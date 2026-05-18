import React, { useState, useRef, useEffect } from 'react';
import { ViewType } from '../App';
import { Search, MapPin, SlidersHorizontal, ArrowLeft, BadgeCheck, Scale, Heart, Bell, User, Map, LayoutDashboard, Compass, Star, LogOut, Settings, CreditCard, History, ChevronRight, Mic, ShieldCheck, Navigation, TrendingUp, ShoppingBag, Bookmark, Calculator, Truck, Info, Camera, MessageCircle, Eye, CheckCircle2, PlusCircle, HeartHandshake, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { useSettings } from '../hooks/useSettings';
import { compressImage, checkPayloadSize } from '../lib/imageUtils';
import DashboardHeader from '../components/DashboardHeader';
import NewsTicker from '../components/NewsTicker';
import logoV2 from '../assets/marketing/branding/logo v2.png';

import GoogleMapComponent from '../components/GoogleMap';
import { cityMapping, getDisplayCity, cityCoords, calculateDistance } from '../constants/cityMapping';

// New extracted components
import KessabaOffersView from '../components/dashboard/KessabaOffersView';
import RequestAnimalView from '../components/dashboard/RequestAnimalView';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import ToolsView from '../components/dashboard/ToolsView';
import AccountView from '../components/dashboard/AccountView';
import FavoritesView from '../components/dashboard/FavoritesView';
import SubscriptionView from '../components/dashboard/SubscriptionView';
import BuyerHomeView from "../components/dashboard/BuyerHomeView";
import Notifications from './Notifications';
import BuyerReviewsView from '../components/dashboard/BuyerReviewsView';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
  activeSubView?: string;
}

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

const cities = ["سطات", "برشيد", "خريبكة", "الدار البيضاء", "الرباط", "مراكش", "أزرو", "خنيفرة", "وجدة", "الراشيدية", "طنجة"];

type DashboardView = 'dashboard' | 'favorites' | 'tools' | 'subscription' | 'account' | 'request-animal' | 'kessaba-offers' | 'notifications' | 'reviews';


export default function BuyerDashboard({ onNavigate, activeSubView }: Props) {
  const { user, profile, signOut } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [activeView, setActiveView] = useState<DashboardView>('dashboard');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, [activeView]);

  useEffect(() => {
    if (activeSubView) {
      setActiveView(activeSubView as DashboardView);
    }
  }, [activeSubView]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('sub') !== activeView) {
      url.searchParams.set('sub', activeView);
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeView]);
  const [timeFilter, setTimeFilter] = useState<'day' | 'month'>('day');
  const [activeAccountTab, setActiveAccountTab] = useState<'profile' | 'notifications' | 'security' | 'settings' | 'payment'>('profile');
  const [kessabaRequests, setKessabaRequests] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const getTitle = () => {
    switch (activeView) {
      case 'dashboard': return `مرحبا بك، ${profile?.displayName || 'أحمد'}`;
      case 'favorites': return 'المفضلة';
      case 'tools': return 'الأدوات';
      case 'subscription': return 'الاشتراك';
      case 'account': return 'حسابي';
      case 'request-animal': return 'تبرع تضامني';
      case 'kessaba-offers': return 'فتح المزاد';
      case 'reviews': return 'تقييماتي';
      default: return 'لوحة التحكم';
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onNavigate('auth');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleToggleFavorite = async (listingId: string) => {
    if (!user) return;
    const isFavorite = Array.isArray(favorites) ? favorites.some(f => f.listingId === listingId) : false;
    try {
      await firestoreService.toggleFavorite(listingId, isFavorite);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };



  const [platformStats, setPlatformStats] = useState({ totalUsers: 0, activeListings: 0, totalRequests: 0, regionsCovered: 12 });

  useEffect(() => {
    if (user) {
      const unsubRequests = firestoreService.subscribeToUserRequests(user.uid, (requests) => {
        setKessabaRequests(requests);
      });
      const unsubFavorites = firestoreService.subscribeToFavorites(user.uid, (favs) => {
        setFavorites(favs);
      });
      
      // Fetch platform stats
      firestoreService.getPlatformStats().then(stats => {
        if (stats) setPlatformStats(stats);
      });

      // Fetch real announcements
      const fetchAnnouncements = async () => {
        try {
          const data = await firestoreService.getAnnouncements();
          if (data && data.data) {
            let allListings = data.data;
            
            // Sort by distance if possible
            const userCity = profile?.city || '';
            const userCoords = cityCoords[userCity];
            if (userCoords) {
              allListings = allListings.map((listing: any) => {
                const displayCity = getDisplayCity(listing);
                const listingCoords = cityCoords[displayCity];
                let dist = 999;
                if (listingCoords) {
                  dist = calculateDistance(userCoords.lat, userCoords.lng, listingCoords.lat, listingCoords.lng);
                }
                return { ...listing, calculatedDistance: dist };
              }).sort((a: any, b: any) => (a.calculatedDistance || 999) - (b.calculatedDistance || 999));
            }

            setAnnouncements(allListings);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des annonces:", error);
        }
      };
      fetchAnnouncements();

      return () => {
        unsubRequests();
        unsubFavorites();
      };
    }
  }, [user, profile?.city]);


  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);

  const [citySearch, setCitySearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filteredCities = cities.filter(city => 
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const listings: Listing[] = [
    {
      id: 1,
      title: "حولي سردي كسابي ممتاز",
      breed: "سردي",
      location: "مديونة (8 كلم)",
      weight: "~55kg",
      verified: true,
      rating: 5,
      image: "https://i.ytimg.com/vi/RrkkshRUttw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD92lI4Kxe5liKSwWZaJuLAFopNeA",
      lat: 33.4500,
      lng: -7.3833
    },
    {
      id: 2,
      title: "بركي مليح ديال العيد",
      breed: "بركي",
      location: "بوسكورة (12 كلم)",
      weight: "~48kg",
      verified: false,
      rating: 5,
      image: "https://i.ytimg.com/vi/LOP8amZRWhU/maxresdefault.jpg",
      lat: 33.4833,
      lng: -7.5833
    },
    {
      id: 3,
      title: "تيمحضيت حرش الأطلس",
      breed: "تيمحضيت",
      location: "المحمدية (18 كلم)",
      weight: "~65kg",
      verified: true,
      rating: 5,
      image: "https://i.ytimg.com/vi/wqBKddMCA5c/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAapMy6IcxARiCzDRMSG7s3Qw8EvA",
      lat: 33.6833,
      lng: -7.3833
    }
  ];








  return (
    <div className="h-screen flex overflow-hidden bg-surface-container-low" dir="rtl">
      {/* Sidebar - Desktop */}
      <aside className="w-20 lg:w-64 bg-surface border-l border-outline-variant/20 flex flex-col justify-between hidden md:flex z-20">
        <div>
          <div className="h-24 flex flex-col items-center justify-center border-b border-outline-variant/20 gap-2 shrink-0">
            <button onClick={() => onNavigate('home')} className="flex items-center group">
              <img 
                src={logoV2} 
                alt="منصة kessabcom.ma" 
                className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            <button 
              onClick={() => setActiveView('dashboard')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${activeView === 'dashboard' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              <LayoutDashboard className="w-6 h-6" />
              <span className="hidden lg:block">لوحة التحكم</span>
            </button>
            <button 
              onClick={() => setActiveView('kessaba-offers')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold border border-transparent transition-colors ${activeView === 'kessaba-offers' ? 'bg-primary-container text-on-primary-container border-primary' : 'text-on-surface-variant hover:bg-white hover:text-primary hover:border-primary'}`}
            >
              <ShoppingBag className="w-6 h-6" />
              <span className="hidden lg:block">فتح المزاد</span>
              <span className="hidden lg:flex mr-auto bg-primary text-on-primary text-[10px] w-5 h-5 items-center justify-center rounded-full">{kessabaRequests.filter(r => r.status !== 'Archived').length}</span>
            </button>
            <button 
              onClick={() => setActiveView('favorites')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold border border-transparent transition-colors ${activeView === 'favorites' ? 'bg-primary-container text-on-primary-container border-primary' : 'text-on-surface-variant hover:bg-white hover:text-primary hover:border-primary'}`}
            >
              <Heart className="w-6 h-6" />
              <span className="hidden lg:block">المفضلة</span>
              <span className="hidden lg:flex mr-auto bg-primary text-on-primary text-xs w-5 h-5 items-center justify-center rounded-full">{favorites.length}</span>
            </button>
            <button 
              onClick={() => setActiveView('reviews')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${activeView === 'reviews' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-variant'}`}
            >
              <Star className={`w-5 h-5 ${activeView === 'reviews' && 'fill-on-primary-container/20'}`} />
              <span className="lg:block hidden">تقييماتي</span>
            </button>
            <button 
              onClick={() => setActiveView('tools')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold border border-transparent transition-colors ${activeView === 'tools' ? 'bg-primary-container text-on-primary-container border-primary' : 'text-on-surface-variant hover:bg-white hover:text-primary hover:border-primary'}`}
            >
              <SlidersHorizontal className="w-6 h-6" />
              <span className="hidden lg:block">الأدوات</span>
            </button>
            {settings.paymentSystemEnabled && (
              <button 
                onClick={() => setActiveView('subscription')}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold border border-transparent transition-colors ${activeView === 'subscription' ? 'bg-primary-container text-on-primary-container border-primary' : 'text-on-surface-variant hover:bg-white hover:text-primary hover:border-primary'}`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="hidden lg:block">اشتراك</span>
              </button>
            )}
            <button 
              onClick={() => setActiveView('account')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold border border-transparent transition-colors ${activeView === 'account' ? 'bg-primary-container text-on-primary-container border-primary' : 'text-on-surface-variant hover:bg-white hover:text-primary hover:border-primary'}`}
            >
              <User className="w-6 h-6" />
              <span className="hidden lg:block">حسابي</span>
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-outline-variant/20 space-y-2">
          {settings.solidarityDonationEnabled && (
            <button 
              onClick={() => setActiveView('request-animal')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold border border-transparent transition-colors ${activeView === 'request-animal' ? 'bg-primary/10 text-primary border-primary' : 'text-primary hover:bg-white hover:border-primary'}`}
            >
              <HeartHandshake className="w-5 h-5" />
              <span className="hidden lg:block">تبرع تضامني</span>
            </button>
          )}
          <button onClick={handleLogout} className="w-full p-4 flex items-center gap-4 text-error font-bold border border-transparent hover:bg-white hover:border-error transition-colors rounded-2xl">
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden pb-20 md:pb-0">
        {/* Top Header */}
        <DashboardHeader 
          title={getTitle()} 
          subtitle={activeView === 'dashboard' ? (() => {
            const rawCity = (profile?.location || 'الدار البيضاء').split(' ')[0];
            return cityMapping[rawCity.toLowerCase()] || rawCity;
          })() : undefined}
          location={activeView === 'dashboard' ? (() => {
            const rawCity = (profile?.location || 'الدار البيضاء').split(' ')[0];
            return cityMapping[rawCity.toLowerCase()] || rawCity;
          })() : undefined}
          showSearch={true}
          onSearch={(city, distance) => {
            setCitySearch(city);
            onNavigate('search-results', undefined, city, distance);
          }}
          onNavigate={onNavigate}
        />

        {/* Dynamic Content Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pt-32 lg:pt-16">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8 text-right">
          {activeView === 'dashboard' && (
            <BuyerHomeView 
              profile={profile}
              platformStats={platformStats}
              announcements={announcements}
              favorites={favorites}
              kessabaRequests={kessabaRequests}
              listings={listings}
              onNavigate={onNavigate}
              setActiveView={setActiveView}
              handleToggleFavorite={handleToggleFavorite}
            />
          )}
          {activeView === 'kessaba-offers' && (
            <KessabaOffersView 
              kessabaRequests={kessabaRequests}
              setKessabaRequests={setKessabaRequests}
              showNewRequestForm={showNewRequestForm}
              setShowNewRequestForm={setShowNewRequestForm}
            />
          )}
          {activeView === 'favorites' && (
            <FavoritesView 
              favorites={favorites}
              announcements={announcements}
              listings={listings}
              onNavigate={onNavigate}
              handleToggleFavorite={handleToggleFavorite}
            />
          )}
          {activeView === 'tools' && (
            <ToolsView />
          )}
          {activeView === 'subscription' && (
            <SubscriptionView settings={settings} />
          )}
          {activeView === 'account' && (
            <AccountView 
              user={user}
              profile={profile}
              settings={settings}
              cities={cities}
            />
          )}
          {activeView === 'request-animal' && (
            <RequestAnimalView setActiveView={setActiveView} />
          )}
          {activeView === 'notifications' && (
            <Notifications onNavigate={onNavigate} hideHeader={true} />
          )}
          {activeView === 'reviews' && (
            <BuyerReviewsView onNavigate={onNavigate} />
          )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant/20 flex items-center justify-between px-2 pb-safe pt-2 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
        <button 
          onClick={() => setActiveView('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors border border-transparent ${activeView === 'dashboard' ? 'text-primary bg-primary/5 border-primary' : 'text-on-surface-variant hover:text-primary hover:border-primary'}`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeView === 'dashboard' && 'fill-primary/20'}`} />
          <span className="text-[10px] font-bold">الرئيسية</span>
        </button>
        {settings.auctionSystemEnabled && (
          <button 
            onClick={() => setActiveView('kessaba-offers')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors relative border border-transparent ${activeView === 'kessaba-offers' ? 'text-primary bg-primary/5 border-primary' : 'text-on-surface-variant hover:text-primary hover:border-primary'}`}
          >
            <div className="relative">
              <ShoppingBag className={`w-5 h-5 ${activeView === 'kessaba-offers' && 'fill-primary/20'}`} />
              {kessabaRequests.filter(r => r.status !== 'Archived').length > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-primary text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">
                  {kessabaRequests.filter(r => r.status !== 'Archived').length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">المزاد</span>
          </button>
        )}
        
        {/* Plus Button in Middle */}
        <button 
          onClick={() => onNavigate('add-listing')}
          className="flex-1 flex flex-col items-center justify-center gap-1 p-2"
        >
          <div className="bg-[#115E2C] text-white p-2.5 rounded-full shadow-lg -mt-10 mb-1 border-4 border-white">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-[#115E2C]">إضافة</span>
        </button>

        <button 
          onClick={() => setActiveView('favorites')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors relative border border-transparent ${activeView === 'favorites' ? 'text-primary bg-primary/5 border-primary' : 'text-on-surface-variant hover:text-primary hover:border-primary'}`}
        >
          <div className="relative">
             <Heart className={`w-5 h-5 ${activeView === 'favorites' && 'fill-primary/20'}`} />
             {favorites.length > 0 && (
               <span className="absolute -top-1 -right-1.5 bg-primary text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">
                 {favorites.length}
               </span>
             )}
          </div>
          <span className="text-[10px] font-bold">المفضلة</span>
        </button>
        <button 
          onClick={() => setActiveView('account')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors border border-transparent ${activeView === 'account' ? 'text-primary bg-primary/5 border-primary' : 'text-on-surface-variant hover:text-primary hover:border-primary'}`}
        >
          <User className={`w-5 h-5 ${activeView === 'account' && 'fill-primary/20'}`} />
          <span className="text-[10px] font-bold">حسابي</span>
        </button>
      </nav>
    </div>
  );
}
