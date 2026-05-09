import React, { useState, useRef, useEffect } from 'react';
import { ViewType } from '../App';
import { Search, MapPin, Navigation, ArrowLeft, BadgeCheck, Scale, User, Star, ShieldCheck, Heart, Camera, CheckCircle, Clock, HeartHandshake, TrendingUp, Bell, LogOut, LayoutDashboard, ShoppingBag, PlusCircle, Settings, Users, List, ChevronDown, Loader2, Target, Route } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { getCachedData, setCachedData } from '../lib/cache';
import { cityMapping, cityCoords, getDisplayCity, getClosestCity, normalizeArabic } from '../constants/cityMapping';
import barkiImage from '../assets/marketing/branding/حولي بركي..png';
import heroBackground from '../assets/marketing/branding/hero-background.webp';
import heroBackgroundMobile from '../assets/marketing/branding/hero-background-mobile.webp';

import { useSettings } from '../hooks/useSettings';
import ContactSellerModal from '../components/ContactSellerModal';
import LoginRequiredModal from '../components/LoginRequiredModal';
import NewsTicker from '../components/NewsTicker';
import logoV2 from '../assets/marketing/branding/logo v2.png';
import MobileSidebar from '../components/MobileSidebar';
import NotificationSidebar from '../components/NotificationSidebar';
import GoogleMapComponent from '../components/GoogleMap';
import ValidationModal from '../components/ValidationModal';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string, breed?: string) => void;
}

const moroccanCities = Object.keys(cityCoords);

const EidCountdown = () => {
  const calculateTimeLeft = () => {
    // Approximation for Eid 2026
    const eidDate = new Date('2026-05-26T00:00:00');
    const difference = +eidDate - +new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0) return null;

  return (
    <div className="bg-black/10 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-4 md:p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] inline-block">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-[#A5D6A7]" />
        <h2 className="text-sm md:text-base font-black text-white tracking-tight font-headline">باقي لعيد الأضحى المبارك</h2>
      </div>
      <div className="flex justify-center gap-2 md:gap-3" dir="ltr">
        {[
          { label: 'أيام', value: timeLeft.days },
          { label: 'ساعات', value: timeLeft.hours },
          { label: 'دقائق', value: timeLeft.minutes },
          { label: 'ثواني', value: timeLeft.seconds }
        ].map((unit, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className="bg-white/10 backdrop-blur-xl border border-white/30 rounded-xl p-2 md:p-3 min-w-[55px] md:min-w-[65px] shadow-xl relative overflow-hidden group">
              <div className="text-lg md:text-xl font-black text-white leading-none mb-1 drop-shadow-md">
                {unit.value}
              </div>
              <div className="text-[10px] md:text-xs font-black text-white uppercase tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mt-1">
                {unit.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Home({ onNavigate }: Props) {
  const { settings } = useSettings();
  const { user, profile, notifications, unreadCount, signOut } = useAuth();

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const [citySearch, setCitySearch] = useState('');
  const [radiusSearch, setRadiusSearch] = useState('10');
  const [favorites, setFavorites] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isOpenCity, setIsOpenCity] = useState(false);
  const [isOpenRadius, setIsOpenRadius] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Set initial city from user profile or IP geolocation
  useEffect(() => {
    const initLocation = async () => {
      if (profile?.city) {
        setCitySearch(profile.city);
      }
    };
    if (user !== undefined) {
      initLocation();
    }
  }, [profile, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setIsOpenCity(false);
        setIsOpenRadius(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpenCity || isOpenRadius) {
      const rect = searchBarRef.current?.getBoundingClientRect();
      if (rect) {
        const windowHeight = window.innerHeight;
        // On mobile, if the bar is in the bottom half, open upwards
        setOpenUpwards(rect.bottom > windowHeight * 0.6);
      }
    }
  }, [isOpenCity, isOpenRadius]);



  const handleMarkNotifAsRead = async (id: string) => {
    if (user) await firestoreService.markNotificationAsRead(user.uid, id);
  };

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedSellerPhone, setSelectedSellerPhone] = useState<string | undefined>();
  const [selectedSellerWhatsapp, setSelectedSellerWhatsapp] = useState<string | undefined>();
  const [selectedListingId, setSelectedListingId] = useState<string | undefined>();
  const [showValidationModal, setShowValidationModal] = useState(false);

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const filteredCities = moroccanCities.filter(city => {
    const normSearch = normalizeArabic(citySearch);
    if (!normSearch) return true;
    if (normalizeArabic(city).includes(normSearch)) return true;
    const mapped = cityMapping[citySearch.toLowerCase()] || cityMapping[citySearch];
    if (mapped && normalizeArabic(city).includes(normalizeArabic(mapped))) return true;
    return false;
  });

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const unsub = firestoreService.subscribeToFavorites(user.uid, setFavorites);
    return () => unsub();
  }, [user]);

  const getCityAnnouncements = (cityKey: string) => {
    return (announcements || [])
      .filter(a => a.location === cityKey && a.status === 'active')
      .sort((a, b) => {
        // First priority: Pinned listings
        if (a.isPinnedToHome && !b.isPinnedToHome) return -1;
        if (!a.isPinnedToHome && b.isPinnedToHome) return 1;
        
        // Second priority: Latest created
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, settings.maxHomeListings || 6);
  };

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const cached = getCachedData('home_announcements');
      if (cached) {
        setAnnouncements(cached);
        return; // IMPORTANT: Prevent redundant fetch if cache is valid
      }

      const response = await firestoreService.getAnnouncements();
      if (response && response.data) {
        setCachedData('home_announcements', response.data);
        setAnnouncements(response.data);
      }
    };
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    const detectIPCity = async () => {
      if (citySearch || profile?.city) return;
      try {
        const res = await fetch('https://freeipapi.com/api/json');
        const data = await res.json();
        if (data.cityName) {
          const closest = getClosestCity(data.latitude, data.longitude);
          if (closest) setCitySearch(closest);
        }
      } catch (e) {
        console.warn('IP Detection failed', e);
      }
    };
    detectIPCity();
  }, [profile, citySearch]);

  const [hoveredMapId, setHoveredMapId] = useState<string | null>(null);
  const regionalListings = React.useMemo(() => {
    const currentCity = citySearch || profile?.city || 'سطات';
    
    let filtered = announcements.filter(l => {
      if (!l.lat || !l.lng) return false;
      return l.location === currentCity;
    });
    
    return filtered.slice(0, 100);
  }, [citySearch, profile, announcements]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    onNavigate('auth');
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const closest = cityCoords ? getClosestCity(position.coords.latitude, position.coords.longitude) : null;
          if (closest) {
            setCitySearch(closest);
            sessionStorage.setItem('last_city', closest);
          } else {
            // Outside Morocco logic
            setCitySearch('');
            alert("نتوما خارج المغرب، خاصكم تختارو المدينة يدوياً من القائمة");
          }
          setIsLocating(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleSearchNearMe = async () => {
    if (!citySearch) {
      setShowValidationModal(true);
      return;
    }
    // Save city to sessionStorage for other views to use
    sessionStorage.setItem('last_city', citySearch);
    
    // Pass multiple breeds as a comma-separated string if selected
    const breedParam = selectedBreeds.length > 0 ? selectedBreeds.join(',') : undefined;
    onNavigate('search-results', undefined, citySearch, radiusSearch, undefined, breedParam);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md font-bold uppercase">Admin</span>;
      case 'seller': return <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-md font-bold uppercase">Kessab</span>;
      default: return <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md font-bold uppercase">Acheteur</span>;
    }
  };

  const renderProfileMenu = () => {
    const role = profile?.role || 'buyer';
    const displayName = profile?.fullName || (role === 'admin' ? 'المشرف' : role === 'seller' ? 'الكساب' : 'المشتري');

    return (
      <div className="absolute top-full left-0 pt-2 w-64 z-[60]">
        <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-outline-variant/10 bg-[#F9F9F6]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#2E7D32] text-white flex items-center justify-center font-bold overflow-hidden">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span>{displayName[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1A1A1A] truncate">{displayName}</p>
                {getRoleBadge(role)}
              </div>
            </div>
          </div>

          <div className="p-2">
            {role === 'buyer' && (
              <>
                <button onClick={() => { onNavigate('buyer', undefined, undefined, undefined, 'dashboard'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>لوحة التحكم</span>
                </button>
                <button onClick={() => { onNavigate('buyer', undefined, undefined, undefined, 'kessaba-offers'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
                  <ShoppingBag className="w-4 h-4" />
                  <span>طلباتي</span>
                </button>
              </>
            )}

            {role === 'seller' && (
              <>
                <button onClick={() => { onNavigate('seller', undefined, undefined, undefined, 'dashboard'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>لوحة التحكم</span>
                </button>
                <button onClick={() => { onNavigate('seller', undefined, undefined, undefined, 'flock'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
                  <List className="w-4 h-4" />
                  <span>إعلاناتي</span>
                </button>
                <button onClick={() => { onNavigate('add-listing'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
                  <PlusCircle className="w-4 h-4" />
                  <span>إضافة إعلان</span>
                </button>
              </>
            )}

            {role === 'admin' && (
              <>
                <button onClick={() => { onNavigate('admin', undefined, undefined, undefined, 'overview'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>لوحة التحكم</span>
                </button>
                <button onClick={() => { onNavigate('admin', undefined, undefined, undefined, 'users'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
                  <Users className="w-4 h-4" />
                  <span>المستخدمين</span>
                </button>
                <button onClick={() => { onNavigate('admin', undefined, undefined, undefined, 'settings'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
                  <Settings className="w-4 h-4" />
                  <span>الإعدادات</span>
                </button>
              </>
            )}

            <div className="h-px bg-outline-variant/10 my-2 mx-2"></div>

            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="antialiased" dir="rtl">
      {/* TopNavBar */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={onNavigate}
        onShowTutorial={() => setShowTutorial(true)}
      />
      <NotificationSidebar
        isOpen={isNotificationSidebarOpen}
        onClose={() => setIsNotificationSidebarOpen(false)}
        notifications={Array.isArray(notifications) ? notifications : []}
        onMarkNotificationAsRead={handleMarkNotifAsRead}
      />
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-outline-variant/30">
        <div className="flex justify-between items-center px-6 h-16 max-w-7xl mx-auto flex-row-reverse md:flex-row">
          <div className="flex items-center gap-8">
            <button onClick={() => onNavigate('home')} className="flex items-center group">
              <img
                src={logoV2}
                alt="KESSABCOM"
                className="h-[26px] md:h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </button>
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => onNavigate('home')} className="text-[#2E7D32] border-b-2 border-[#2E7D32] font-bold py-1 transition-colors">الرئيسية</button>
              <button onClick={() => onNavigate('search-results')} className="text-on-surface-variant hover:text-[#2E7D32] transition-colors font-medium">البحث</button>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Hamburger Button (Mobile Only) */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 bg-[#F9F9F6] rounded-xl border border-outline-variant/10 transition-colors hover:border-[#2E7D32]"
            >
              <span className="w-5 h-0.5 bg-[#2E7D32] rounded-full"></span>
              <span className="w-5 h-0.5 bg-[#2E7D32] rounded-full"></span>
              <span className="w-5 h-0.5 bg-[#2E7D32] rounded-full"></span>
            </button>

            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationSidebarOpen(true)}
                    className={`p-2 rounded-xl border border-transparent transition-colors relative ${isNotificationSidebarOpen ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]' : 'bg-[#F9F9F6] text-[#757575] hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32]'}`}
                  >
                    <Bell className="w-5 h-5" />
                    {(Array.isArray(notifications) ? notifications : []).some(n => !n.read) && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </button>
                </div>

                {/* Profile */}
                <div
                  className="relative"
                  ref={profileRef}
                  onMouseEnter={() => setShowProfileMenu(true)}
                  onMouseLeave={() => setShowProfileMenu(false)}
                >
                  <button 
                    onClick={() => {
                      const role = profile?.role || 'buyer';
                      onNavigate(role === 'admin' ? 'admin' : role === 'seller' ? 'seller' : 'buyer', undefined, undefined, undefined, role === 'admin' ? 'overview' : 'dashboard');
                    }}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F9F9F6] border border-outline-variant/10 hover:bg-white hover:border-[#2E7D32] transition-colors overflow-hidden shadow-sm"
                  >
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-[#2E7D32] text-white flex items-center justify-center font-bold">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </button>
                  {showProfileMenu && renderProfileMenu()}
                </div>
              </>
            ) : (
              <button onClick={() => onNavigate('auth')} className="bg-[#2E7D32] text-white px-6 py-2.5 rounded-xl font-black border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors shadow-md animate-shake">
                <span className="text-swap-container">
                  <span className="text-swap-1">دخول</span>
                  <span className="text-swap-2">اضغط هنا</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero & Search Section - 100vh with vertical centering */}
        <section className="relative min-h-[calc(100dvh-64px)] flex flex-col items-center justify-between bg-[#FDFCF8] px-4 py-8 md:py-20 z-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <picture className="w-full h-full">
              <source media="(max-width: 767px)" srcSet={heroBackgroundMobile} />
              <img 
                alt="مرعى أخضر في جبال الأطلس" 
                className="w-full h-full object-cover" 
                src={heroBackground} 
                fetchpriority="high" 
                referrerPolicy="no-referrer"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent"></div>
          </div>

          <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
          </div>

          {/* Mobile News Ticker attached to top */}
          <div className="absolute top-0 left-0 w-full z-[100] md:hidden">
            <NewsTicker isMobile={true} />
          </div>

          {/* TOP CONTENT: Countdown & Title */}
          <div className="relative z-10 max-w-5xl w-full text-center mt-16 md:mt-0">
            <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-1000 relative">
              <EidCountdown />
            </div>

            <div className="md:bg-transparent md:backdrop-blur-none md:p-0 md:rounded-none">
              <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tight font-headline leading-[1.1] drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] md:drop-shadow-lg text-center">
                حولي بلا <span className="text-[#2E7D32]" style={{ WebkitTextStroke: '2px white' }}>عذاب</span> <br /> مباشرة من عند الكساب
              </h1>
              <p className="hidden md:block text-base md:text-xl text-white/90 mb-14 max-w-2xl mx-auto font-medium leading-relaxed px-4 drop-shadow-md text-center">
                منصة kessabcom.ma كتقرب ليك جميع الكسابة بلاما تضرب تمارة قلب، اختار، تواصل مع كساب ووزورو فالضيعة
              </p>
            </div>
          </div>

          {/* BOTTOM CONTENT: Search UI */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="w-full max-w-fit mx-auto relative z-[200] mb-4 md:mb-0"
          >
              <div
                ref={searchBarRef}
                className="bg-white/95 backdrop-blur-xl p-2 md:p-3 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.3)] border border-white/20 z-[100] relative"
              >
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
                  <div className="flex flex-row items-stretch gap-2 w-full md:w-auto">
                    <div className="flex-1 md:w-[200px] flex items-center px-3 md:px-4 py-2 md:py-2 relative group bg-white rounded-xl border border-outline-variant/10 shadow-sm transition-all hover:border-[#2E7D32]/30">
                      <MapPin className="w-5 h-5 md:w-6 md:h-6 text-[#2E7D32] shrink-0" />
                      <div className="flex flex-col text-right mr-3 md:mr-4 flex-1">
                        <span className="text-[10px] font-black text-[#2E7D32] uppercase tracking-wider mb-0.5">المدينة</span>
                        <input
                          type="text"
                          value={citySearch}
                          onChange={(e) => { setCitySearch(e.target.value); setIsOpenCity(true); }}
                          onFocus={() => setIsOpenCity(true)}
                          placeholder="فين كتقلب؟"
                          className="bg-transparent border-none outline-none w-full text-lg md:text-xl font-black text-[#1A1A1A] text-right placeholder:text-[#757575]/40"
                        />

                        {isOpenCity && (
                          <div className={`absolute ${openUpwards ? 'bottom-full mb-4' : 'top-full mt-4'} right-0 left-0 w-full bg-white rounded-xl shadow-2xl border border-outline-variant/10 max-h-80 overflow-y-auto z-[100] p-1 animate-in ${openUpwards ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'} duration-200`}>
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => { setCitySearch(''); setIsOpenCity(false); }}
                                className={`w-full text-right px-4 py-2 rounded-lg text-lg font-bold transition-colors ${!citySearch ? 'bg-[#2E7D32] text-white' : 'hover:bg-[#F9F9F6] text-[#4A4A4A]'}`}
                              >
                                الكل
                              </button>
                              {moroccanCities.filter(city => {
                                const normSearch = normalizeArabic(citySearch);
                                if (!normSearch) return true;
                                if (normalizeArabic(city).includes(normSearch)) return true;
                                const mapped = cityMapping[citySearch.toLowerCase()] || cityMapping[citySearch];
                                if (mapped && normalizeArabic(city).includes(normalizeArabic(mapped))) return true;
                                return false;
                              }).sort().map(city => (
                                <button
                                  key={city}
                                  onClick={() => { setCitySearch(city); setIsOpenCity(false); }}
                                  className={`w-full text-right px-4 py-2 rounded-lg text-lg font-bold transition-colors ${citySearch === city ? 'bg-[#2E7D32] text-white' : 'hover:bg-[#F9F9F6] text-[#4A4A4A]'}`}
                                >
                                  {city}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <ChevronDown
                        onClick={(e) => { e.stopPropagation(); setIsOpenCity(!isOpenCity); }}
                        className={`w-5 h-5 text-[#757575] ml-2 cursor-pointer transition-transform ${isOpenCity ? 'rotate-180' : ''}`}
                      />
                    </div>

                    <div className="flex shrink-0">
                      <button
                        onClick={handleLocateMe}
                        disabled={isLocating}
                        className="flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-4 bg-[#F0F0F0] hover:bg-[#E5E5E5] text-[#1B5E20] rounded-xl border border-outline-variant/20 transition-all transform active:scale-95 shadow-sm group/loc"
                      >
                        <Target className={`w-4 h-4 md:w-5 md:h-5 group-hover/loc:scale-110 transition-transform ${isLocating ? 'animate-pulse' : ''}`} />
                        <span className="text-[11px] md:text-sm font-black whitespace-nowrap">في مدينتي</span>
                        {isLocating && <Loader2 className="w-4 h-4 animate-spin" />}
                      </button>
                    </div>
                  </div>

                  {!settings.disableSearchRadius && (
                    <div
                      onClick={() => { setIsOpenRadius(!isOpenRadius); setIsOpenCity(false); }}
                      className="w-full md:w-[180px] flex items-center px-3 md:px-4 py-2 md:py-2 relative group bg-white rounded-xl border border-outline-variant/10 shadow-sm transition-all hover:border-[#2E7D32]/30 cursor-pointer"
                    >
                      <Route className="w-6 h-6 text-[#2E7D32] shrink-0" />
                      <div className="flex flex-col text-right mr-4 flex-1">
                        <span className="text-[10px] font-black text-[#2E7D32] uppercase tracking-wider mb-0.5">المسافة</span>
                        <button
                          onClick={() => { setIsOpenRadius(!isOpenRadius); setIsOpenCity(false); }}
                          className="bg-transparent border-none outline-none w-full text-xl font-black text-[#1A1A1A] text-right flex items-center justify-between"
                        >
                          <span className="truncate">
                            {radiusSearch === '10' ? '10 كلم' :
                              radiusSearch === '20' ? '20 كلم' :
                                radiusSearch === '50' ? '50 كلم' : 'اختيار'}
                          </span>
                        </button>

                        {isOpenRadius && (
                          <div className={`absolute ${openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 right-0 w-full bg-white rounded-xl shadow-2xl border border-outline-variant/10 z-[100] p-1 animate-in ${openUpwards ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'} duration-200`}>
                            <div className="flex flex-col gap-0.5">
                              {[
                                { val: '10', label: '10 كلم دايرة بيك' },
                                { val: '20', label: '20 كلم دايرة بيك' },
                                { val: '50', label: '50 كلم دايرة بيك' }
                              ].map(dist => (
                                <button
                                  key={dist.val}
                                  onClick={() => { setRadiusSearch(dist.val); setIsOpenRadius(false); }}
                                  className={`w-full text-right px-4 py-2 rounded-lg text-lg font-bold transition-colors ${radiusSearch === dist.val ? 'bg-[#2E7D32] text-white' : 'hover:bg-[#F9F9F6] text-[#4A4A4A]'}`}
                                >
                                  {dist.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <ChevronDown className={`w-6 h-6 text-[#757575] mr-2 transition-transform ${isOpenRadius ? 'rotate-180' : ''}`} />
                    </div>
                  )}

                  <div className="md:pr-1">
                    <button
                      onClick={handleSearchNearMe}
                      className="w-full md:w-auto bg-[#2E7D32] text-white py-3 md:py-5 px-14 rounded-xl font-black text-lg md:text-xl flex items-center justify-center gap-3 md:gap-4 shadow-[0_10px_25px_rgba(46,125,50,0.4)] hover:shadow-[0_15px_35px_rgba(46,125,50,0.5)] transform hover:-translate-y-1 active:scale-95 transition-all duration-300 group animate-shake"
                    >
                      <Search className="w-5 h-5 md:w-7 md:h-7 group-hover:scale-110 transition-transform" />
                      <span className="text-swap-container">
                        <span className="text-swap-1">قلب دابا</span>
                        <span className="text-swap-2">توكل على الله.</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-row items-center justify-start md:justify-center gap-3 md:gap-6 mt-6 md:mt-12 overflow-x-auto pb-4 w-full max-w-full no-scrollbar">
                <div className="flex items-center gap-1.5 md:gap-3 text-white shrink-0">
                  <PlusCircle className="w-4 h-4 md:w-6 md:h-6 text-[#A5D6A7]" />
                  <span className="font-black text-sm md:text-xl whitespace-nowrap">اختر الصنف :</span>
                </div>
                <div className="flex flex-row items-center gap-2 md:gap-3 shrink-0">
                  {[
                    { id: 'سردي', label: 'السردي' },
                    { id: 'بركي', label: 'البركي' },
                    { id: 'مستورد', label: 'الأغنام المستوردة' }
                  ].map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setSelectedBreeds(prev =>
                          prev.includes(tag.id) ? prev.filter(b => b !== tag.id) : [...prev, tag.id]
                        );
                      }}
                      className={`px-3 py-1.5 md:px-6 md:py-3 rounded-xl text-xs md:text-sm font-black transition-all duration-300 border backdrop-blur-md shadow-lg whitespace-nowrap ${selectedBreeds.includes(tag.id) ? 'bg-[#A5D6A7] text-[#1B5E20] border-[#A5D6A7] scale-105 ring-4 ring-[#A5D6A7]/20' : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/40'}`}
                    >
                      #{tag.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
        </section>

        {/* News Ticker */}
        <section className="hidden md:block max-w-7xl mx-auto px-6 py-4">
          <NewsTicker className="shadow-none border-outline-variant/10 p-4" />
        </section>

        {/* Solidarity Section */}
        {settings.solidarityDonationEnabled && (
          <section className="max-w-7xl mx-auto px-6 py-20">
            <div className="bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] rounded-3xl p-8 md:p-16 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                <div className="w-full md:w-1/2 text-right order-2 md:order-1">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-6">
                    <HeartHandshake className="w-5 h-5" />
                    <span className="text-sm font-bold">فضاء التضامن</span>
                  </div>
                  <h2 className="text-4xl font-black mb-6 font-headline leading-tight">عيد مبارك للجميع <br /> <span className="text-[#A5D6A7]">تضامن معانا</span></h2>
                  <p className="text-[#E8F5E9] text-lg mb-10 font-medium">منصة kessabcom.ma كايفتح الباب للمحسنين لي بغاو يتبرعو بأضحية العيد، وللناس لي فوضعية صعبة وبغاو يستافدو من المبادرة.</p>
                  <div className="flex flex-wrap gap-4 justify-end">
                    <button onClick={() => onNavigate('solidarity-request')} className="bg-white text-[#1B5E20] px-8 py-4 rounded-xl font-bold border border-transparent hover:bg-transparent hover:text-white hover:border-white transition-colors shadow-xl">أنا محتاج مساعدة</button>
                    <button onClick={() => onNavigate('solidarity-donate')} className="bg-[#A5D6A7] text-[#1B5E20] px-8 py-4 rounded-xl font-bold border border-transparent hover:bg-transparent hover:text-[#A5D6A7] hover:border-[#A5D6A7] transition-colors shadow-xl">بغيت نتبرع</button>
                  </div>
                </div>
                <div className="w-full md:w-1/2 order-1 md:order-2">
                  <div className="relative">
                    <img src="https://images.unsplash.com/photo-1511117833895-4b473c0b85d6?auto=format&fit=crop&q=80&w=800" alt="Solidarity" className="rounded-2xl shadow-2xl border-4 border-white/20" />
                    <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl hidden md:block">
                      <p className="text-[#1B5E20] font-black text-2xl">124+</p>
                      <p className="text-[#4A4A4A] text-xs font-bold">أضحية تم التبرع بها</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Banner 1 */}
        {(settings.banners?.banner1DesktopEnabled !== false || settings.banners?.banner1MobileEnabled !== false) && (
          <div className={`max-w-7xl mx-auto px-6 py-10 ${settings.banners?.banner1DesktopEnabled === false ? 'md:hidden' : ''} ${settings.banners?.banner1MobileEnabled === false ? 'hidden md:block' : ''}`}>
            {settings.banners?.banner1 ? (
              <div
                onClick={() => settings.banners?.banner1Url && window.open(settings.banners.banner1Url, '_blank')}
                className={`relative rounded-3xl overflow-hidden shadow-md group cursor-pointer border border-outline-variant/10 ${settings.banners?.banner1Url ? 'hover:opacity-90 transition-opacity' : ''} ${settings.banners?.banner1Mobile ? 'aspect-square' : 'aspect-video'} md:aspect-[24/4.5]`}
              >
                <picture className="w-full h-full">
                  {settings.banners?.banner1Mobile && typeof settings.banners.banner1Mobile === 'string' && (
                    <source media="(max-width: 767px)" srcSet={settings.banners.banner1Mobile} />
                  )}
                  <img
                    src={typeof settings.banners?.banner1 === 'string' ? settings.banners.banner1 : ''}
                    alt="Ad Banner 1"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </picture>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-[#2E7D32] to-[#43A047] rounded-3xl p-8 text-white text-center shadow-md border border-outline-variant/10">
                <p className="opacity-90 font-medium mb-4">استفد من عروض خاصة بمناسبة عيد الأضحى</p>
                <a href="http://localhost:3000/contact" target="_blank" rel="noreferrer" className="inline-block bg-white text-[#2E7D32] px-6 py-2 rounded-xl font-bold hover:bg-opacity-90 transition-colors shadow-sm">اتصل بنا لحجز هذه المساحة</a>
              </div>
            )}
          </div>
        )}

        {/* Featured Listings Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="mb-12">
            <div className="text-right">
              <span className="text-[#2E7D32] font-bold text-sm tracking-widest uppercase mb-2 block">الضيعات لي قريبة ليك</span>
              <h2 className="text-3xl font-black text-[#1A1A1A] font-headline">الضيعات اللي كيزوروهم الناس بزاف</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(() => {
              const baseList = Array.isArray(announcements) ? announcements : [];
              const sorted = [...baseList].sort((a, b) => {
                // If user has a city search active or detected, sort by distance
                if (citySearch) {
                  const targetCoords = cityCoords[citySearch];
                  if (targetCoords) {
                    const getDist = (item: any) => {
                       const itemCity = cityMapping[(item.location || '').toLowerCase()] || item.location || '';
                       if (item.coordinates && item.coordinates.lat && item.coordinates.lng) {
                          return calculateDistance(targetCoords.lat, targetCoords.lng, item.coordinates.lat, item.coordinates.lng);
                       }
                       const mappedCoords = cityCoords[itemCity];
                       return mappedCoords ? calculateDistance(targetCoords.lat, targetCoords.lng, mappedCoords.lat, mappedCoords.lng) : 9999;
                    };
                    const distA = getDist(a);
                    const distB = getDist(b);
                    if (distA !== distB) return distA - distB;
                  } else {
                    const aCity = (a.location || '').toLowerCase();
                    const bCity = (b.location || '').toLowerCase();
                    const targetCity = citySearch.toLowerCase();
                    
                    const aMatches = aCity.includes(targetCity);
                    const bMatches = bCity.includes(targetCity);
                    
                    if (aMatches && !bMatches) return -1;
                    if (!aMatches && bMatches) return 1;
                  }
                }

                // Global Pin priority
                if (a.isPinnedToHome && !b.isPinnedToHome) return -1;
                if (!a.isPinnedToHome && b.isPinnedToHome) return 1;
                
                // Latest first
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                return dateB - dateA;
              });

              return sorted.slice(0, settings.maxHomeListings ?? 6).map((listing) => (


              <div key={listing.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={() => onNavigate('listing-details', listing.id)}>
                <div className="relative h-64 overflow-hidden">
                  <img alt={listing.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={listing.images?.[0] || 'https://i.ytimg.com/vi/RrkkshRUttw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD92lI4Kxe5liKSwWZaJuLAFopNeA'} referrerPolicy="no-referrer" />
                  {(listing.minPrice || listing.price) ? (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-[#1A1A1A] px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      كيبدا من {listing.minPrice || listing.price} درهم
                    </div>
                  ) : null}
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-[#1A1A1A] px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 cursor-pointer hover:bg-white transition-colors" onClick={(e) => {
                    e.stopPropagation();
                    const url = listing.coordinates
                      ? `https://www.google.com/maps/dir/?api=1&destination=${listing.coordinates.lat},${listing.coordinates.lng}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.location || '')}`;
                    window.open(url, '_blank');
                  }}>
                    <MapPin className="w-3 h-3 text-[#2E7D32]" />
                    <span>
                      {(() => {
                        const listingCity = cityMapping[(listing.location || '').toLowerCase()] || listing.location || '';

                        let dist = listing.distance || 0;
                        if (citySearch) {
                          const searchCoords = cityCoords[citySearch];
                          if (searchCoords) {
                            if (listing.coordinates && listing.coordinates.lat && listing.coordinates.lng) {
                              dist = calculateDistance(searchCoords.lat, searchCoords.lng, listing.coordinates.lat, listing.coordinates.lng);
                            } else {
                              const listingMappedCoords = cityCoords[listingCity];
                              if (listingMappedCoords) {
                                dist = calculateDistance(searchCoords.lat, searchCoords.lng, listingMappedCoords.lat, listingMappedCoords.lng);
                              } else {
                                dist = 999;
                              }
                            }
                          } else {
                            dist = 999;
                          }
                        }

                        const city = getDisplayCity(listing);
                        if (dist === 0 || dist >= 999 || settings.disableSearchRadius) return city;
                        if (dist < 5) return `${city} (قريب ليك)`;
                        if (dist < 25) return `${city} (على بعد ${Math.round(dist)} كلم)`;
                        if (dist < 80) return `${city} (بعيد شوية، ${Math.round(dist)} كلم)`;
                        return `${city} (بعيد)`;
                      })()}
                    </span>
                  </div>
                  {!settings.guestBuyerMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (user) {
                          const isFavorite = (Array.isArray(favorites) ? favorites : []).some(f => f.listingId === listing.id);
                          firestoreService.toggleFavorite(listing.id, isFavorite);
                        } else {
                          setLoginModalOpen(true);
                        }
                      }}
                      className={`absolute top-4 left-4 p-2 bg-white/90 backdrop-blur rounded-full transition-colors shadow-sm ${user && favorites.some(f => f.listingId === listing.id) ? 'text-red-500' : 'text-[#757575] hover:text-red-500'
                        }`}
                    >
                      <Heart className={`w-4 h-4 ${user && favorites.some(f => f.listingId === listing.id) ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[#2E7D32] font-bold truncate max-w-[150px]">ضيعة {listing.sellerPseudo || listing.sellerName || 'كساب'}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#757575]">الحجم:</span>
                        <div className="flex gap-1 text-[10px] font-bold text-[#4A4A4A]">
                          {(Array.isArray(listing.sizes) ? listing.sizes : []).slice(0, 3).map((size: string, idx: number) => (
                            <span key={idx} className="bg-[#F9F9F6] px-1.5 py-0.5 rounded border border-outline-variant/10">
                              {size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : size === 'large' ? 'كبير' : size === 'extra-large' ? 'كبير جداً' : size}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[#757575] text-sm font-bold">
                        <span className="truncate max-w-[200px]">{listing.farmLocation || 'موقع الضيعة غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-0.5" dir="ltr">
                        {[...Array(5)].map((_, i) => {
                          const avg = listing.ratingCount > 0 ? (listing.rating || 0) / listing.ratingCount : 5;
                          return (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(avg) ? 'fill-[#FFC107] text-[#FFC107]' : 'text-[#D1D1D1]'}`} />
                          );
                        })}
                        {listing.ratingCount > 0 && (
                          <span className="text-[10px] text-on-surface-variant font-bold ml-1">({listing.ratingCount})</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 border-t border-outline-variant/20 pt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSellerPhone(listing.phone);
                        setSelectedSellerWhatsapp(listing.whatsapp);
                        setSelectedListingId(listing.id);
                        setContactModalOpen(true);
                      }}
                      className="py-2.5 bg-[#2E7D32] text-white font-bold rounded-lg border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors text-sm"
                    >
                      تواصل مع الكساب
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!settings.guestBuyerMode && !profile) {
                          setLoginModalOpen(true);
                        } else {
                          onNavigate('listing-details', listing.id);
                        }
                      }}
                      className="py-2.5 bg-[#F9F9F6] text-[#1A1A1A] font-bold rounded-lg border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors text-sm"
                    >
                      شوف التفاصيل
                    </button>
                  </div>
                </div>
              </div>
            ))})()}
          </div>

          <div className="mt-12 flex justify-center">
            <button 
              onClick={() => onNavigate('search-results')} 
              className="bg-[#2E7D32] text-white px-8 py-3 rounded-xl font-black border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-all shadow-md animate-shake flex items-center gap-3 group"
            >
              <span>شوف كلشي</span>
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
            </button>
          </div>
        </section>

        {/* Banner 2 */}
        {(settings.banners?.banner2DesktopEnabled !== false || settings.banners?.banner2MobileEnabled !== false) && (
          <div className={`max-w-7xl mx-auto px-6 py-10 ${settings.banners?.banner2DesktopEnabled === false ? 'md:hidden' : ''} ${settings.banners?.banner2MobileEnabled === false ? 'hidden md:block' : ''}`}>
            {settings.banners?.banner2 ? (
              <div
                onClick={() => settings.banners?.banner2Url && window.open(settings.banners.banner2Url, '_blank')}
                className={`relative rounded-3xl overflow-hidden shadow-md group cursor-pointer border border-outline-variant/10 ${settings.banners?.banner2Url ? 'hover:opacity-90 transition-opacity' : ''} ${settings.banners?.banner2Mobile ? 'aspect-square' : 'aspect-video'} md:aspect-[24/4.5]`}
              >
                <picture className="w-full h-full">
                  {settings.banners?.banner2Mobile && typeof settings.banners.banner2Mobile === 'string' && (
                    <source media="(max-width: 767px)" srcSet={settings.banners.banner2Mobile} />
                  )}
                  <img
                    src={typeof settings.banners?.banner2 === 'string' ? settings.banners.banner2 : ''}
                    alt="Ad Banner 2"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </picture>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-[#FF9800] to-[#F57C00] rounded-3xl p-8 text-white text-center shadow-md border border-outline-variant/10">
                <p className="opacity-90 font-medium mb-4">اكتشف أفضل السلالات المغربية</p>
                <a href="http://localhost:3000/contact" target="_blank" rel="noreferrer" className="inline-block bg-white text-[#FF9800] px-6 py-2 rounded-xl font-bold hover:bg-opacity-90 transition-colors shadow-sm">اتصل بنا لحجز هذه المساحة</a>
              </div>
            )}
          </div>
        )}




        {/* Sales Phases Section */}
        <section className="bg-white py-20 border-y border-outline-variant/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-[#2E7D32] font-bold text-sm tracking-widest uppercase mb-2 block">كيفاش تبيع؟</span>
              <h2 className="text-3xl md:text-4xl font-black text-[#1A1A1A] font-headline">مراحل البيع فـ منصة kessabcom.ma</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connection Line (Desktop) */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#2E7D32]/20 to-transparent -translate-y-1/2 z-0"></div>

              <motion.div
                whileHover={{ y: -10 }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 bg-[#E8F5E9] rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-[#2E7D32] group-hover:text-white transition-all duration-300 transform group-hover:rotate-6">
                  <Camera className="w-10 h-10" />
                </div>
                <div className="bg-white px-4">
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">صور الحولي</h3>
                  <p className="text-[#757575] text-sm leading-relaxed">
                    خد تصاور واضحين للكسيبة ديالك من كاع الجوانب باش المشتري يشوف كولشي.
                  </p>
                </div>
                <div className="mt-4 w-8 h-8 rounded-full bg-[#2E7D32] text-white flex items-center justify-center font-bold text-sm">1</div>
              </motion.div>

              <motion.div
                whileHover={{ y: -10 }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 bg-[#E8F5E9] rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-[#2E7D32] group-hover:text-white transition-all duration-300 transform group-hover:-rotate-6">
                  <MapPin className="w-10 h-10" />
                </div>
                <div className="bg-white px-4">
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">حدد الموقع</h3>
                  <p className="text-[#757575] text-sm leading-relaxed">
                    حط مكان الضيعة ديالك على الخريطة باش الناس لي قراب ليك يلقاوك بسهولة.
                  </p>
                </div>
                <div className="mt-4 w-8 h-8 rounded-full bg-[#2E7D32] text-white flex items-center justify-center font-bold text-sm">2</div>
              </motion.div>

              <motion.div
                whileHover={{ y: -10 }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 bg-[#E8F5E9] rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-[#2E7D32] group-hover:text-white transition-all duration-300 transform group-hover:rotate-6">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div className="bg-white px-4">
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">ابدأ البيع</h3>
                  <p className="text-[#757575] text-sm leading-relaxed">
                    نشر الإعلان ديالك وبدا تستقبل المكالمات والزيارات للضيعة ديالك مباشرة.
                  </p>
                </div>
                <div className="mt-4 w-8 h-8 rounded-full bg-[#2E7D32] text-white flex items-center justify-center font-bold text-sm">3</div>
              </motion.div>
            </div>

            <div className="mt-16 text-center">
              <button onClick={() => onNavigate('auth')} className="bg-[#2E7D32] text-white px-10 py-4 rounded-xl font-bold border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors shadow-lg animate-shake">
                حط إعلانك دابا
              </button>
            </div>
          </div>
        </section>

        {/* Banner 3 */}
        {(settings.banners?.banner3DesktopEnabled !== false || settings.banners?.banner3MobileEnabled !== false) && (
          <div className={`max-w-7xl mx-auto px-6 py-10 ${settings.banners?.banner3DesktopEnabled === false ? 'md:hidden' : ''} ${settings.banners?.banner3MobileEnabled === false ? 'hidden md:block' : ''}`}>
            {settings.banners?.banner3 ? (
              <div
                onClick={() => settings.banners?.banner3Url && window.open(settings.banners.banner3Url, '_blank')}
                className={`relative rounded-3xl overflow-hidden shadow-md group cursor-pointer border border-outline-variant/10 ${settings.banners?.banner3Url ? 'hover:opacity-90 transition-opacity' : ''} ${settings.banners?.banner3Mobile ? 'aspect-square' : 'aspect-video'} md:aspect-[24/4.5]`}
              >
                <picture className="w-full h-full">
                  {settings.banners?.banner3Mobile && typeof settings.banners.banner3Mobile === 'string' && (
                    <source media="(max-width: 767px)" srcSet={settings.banners.banner3Mobile} />
                  )}
                  <img
                    src={typeof settings.banners?.banner3 === 'string' ? settings.banners.banner3 : ''}
                    alt="Ad Banner 3"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </picture>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-[#2196F3] to-[#1976D2] rounded-3xl p-8 text-white text-center shadow-md border border-outline-variant/10">
                <p className="opacity-90 font-medium mb-4">خدمات النقل متوفرة الآن</p>
                <a href="http://localhost:3000/contact" target="_blank" rel="noreferrer" className="inline-block bg-white text-[#2196F3] px-6 py-2 rounded-xl font-bold hover:bg-opacity-90 transition-colors shadow-sm">اتصل بنا لحجز هذه المساحة</a>
              </div>
            )}
          </div>
        )}

        {/* Seller CTA Section */}
        <section className="max-w-7xl mx-auto px-6 py-12 md:py-20">
          <div className="relative bg-[#2E7D32] overflow-hidden rounded-[2.5rem] p-8 md:p-20 flex flex-col md:flex-row items-center gap-8 md:gap-16 shadow-2xl">
            {/* Design Elements */}
            <div className="absolute top-0 right-0 w-full md:w-1/2 h-1/2 md:h-full bg-white/5 skew-x-0 md:skew-x-12 translate-y-0 md:translate-x-20 pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 w-full md:w-1/2 text-center md:text-right">
              <span className="inline-block bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black text-white mb-6 uppercase tracking-widest">مساحة الكساب</span>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6 font-headline leading-tight">
                عندك كسيبة وبغيتي <br />
                <span className="text-[#A5D6A7]">تجيب الناس للضيعة؟</span>
              </h2>
              <p className="text-[#E8F5E9] text-base md:text-xl mb-10 max-w-md mx-auto md:mr-0 md:ml-0 font-medium leading-relaxed">
                منصة kessabcom.ma كايسهل على المشتري يلقاك فخريطة المدينة. حط إعلانك وجيب الكليان حتى لدارك.
              </p>
              <button
                onClick={() => onNavigate('auth')}
                className="w-full md:w-auto bg-white text-[#2E7D32] px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 border-2 border-transparent hover:bg-transparent hover:text-white hover:border-white transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 animate-shake"
              >
                <PlusCircle className="w-6 h-6" />
                <span>زيد الضيعة ديالك دابا</span>
              </button>
            </div>

            <div className="relative z-10 w-full md:w-1/2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: MapPin, title: 'موقع محدد', desc: 'كايعرفو بلاصتك بالتدقيق' },
                  { icon: User, title: 'كليان حقيقي', desc: 'تواصل مباشر مع الشاري' },
                  { icon: BadgeCheck, title: 'ثقة ومصداقية', desc: 'حساب كساب موثق' },
                  { icon: TrendingUp, title: 'بيع أسرع', desc: 'وصل لأكبر عدد من الناس' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-right group hover:bg-white/20 transition-colors">
                    <item.icon className="text-[#A5D6A7] w-8 h-8 mb-4 ml-auto group-hover:scale-110 transition-transform" />
                    <p className="text-white font-black text-lg mb-1">{item.title}</p>
                    <p className="text-white/60 text-xs font-bold">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SEO Articles Section */}
        {/* Removed */}
      </main>

      <ValidationModal 
        isOpen={showValidationModal}
        onClose={() => {
          setShowValidationModal(false);
          setIsOpenCity(true);
        }}
        message="عافاك اختار المدينة فين كتقلب أولاً"
      />

      <ContactSellerModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        sellerPhone={selectedSellerPhone}
        sellerWhatsapp={selectedSellerWhatsapp}
        listingId={selectedListingId}
        onNavigate={onNavigate}
      />

      <LoginRequiredModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onNavigate={onNavigate}
      />

      {showTutorial && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowTutorial(false)}>
          <div className="relative w-full max-w-4xl aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowTutorial(false)}
              className="absolute top-6 right-6 z-10 bg-white/20 hover:bg-white/40 text-white p-2.5 rounded-full transition-colors backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>
            <iframe 
              src={settings.tutorialUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"} 
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

const Countdown = () => {
  const { settings } = useSettings();
  const [timeLeft, setTimeLeft] = useState<{
    days: number; hours: number; minutes: number; seconds: number;
    showGreeting: boolean;
  }>({
    days: 0, hours: 0, minutes: 0, seconds: 0,
    showGreeting: false
  });

  useEffect(() => {
    if (!settings.aidDate) return;

    // Target date: Date de l'Aid fixée par l'admin
    const targetDate = new Date(settings.aidDate).setHours(0, 0, 0, 0);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      // Check for greeting period (Aïd day + 3 days)
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      const showGreeting = distance < 0 && distance > -threeDaysInMs;

      setTimeLeft({
        days: Math.max(0, Math.floor(distance / (1000 * 60 * 60 * 24))),
        hours: Math.max(0, Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))),
        minutes: Math.max(0, Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))),
        seconds: Math.max(0, Math.floor((distance % (1000 * 60)) / 1000)),
        showGreeting
      });

      if (distance < -threeDaysInMs) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [settings.aidDate]);

  if (timeLeft.showGreeting) {
    return (
      <div className="text-4xl font-black text-[#2E7D32] my-8 animate-bounce text-center">
        مبروك العيد!
      </div>
    );
  }

  // Hide after greeting period is passed
  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0 && !timeLeft.showGreeting && new Date().getTime() > new Date(settings.aidDate || 0).getTime() + 3 * 24 * 60 * 60 * 1000) {
    return null;
  }

  return (
    <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
      <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-4 md:p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] inline-block">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-[#A5D6A7]" />
          <h2 className="text-sm md:text-base font-black text-white tracking-tight font-headline">
            باقي لعيد الأضحى المبارك
          </h2>
        </div>

        <div className="flex justify-center gap-2 md:gap-3" dir="ltr">
          {[
            { label: 'أيام', value: timeLeft.days },
            { label: 'ساعات', value: timeLeft.hours },
            { label: 'دقائق', value: timeLeft.minutes },
            { label: 'ثواني', value: timeLeft.seconds }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="bg-white/10 backdrop-blur-xl border border-white/30 rounded-xl p-2 md:p-3 min-w-[55px] md:min-w-[65px] shadow-xl relative overflow-hidden group">
                <div className="text-lg md:text-xl font-black text-white leading-none mb-1 drop-shadow-md">{item.value}</div>
                <div className="text-[10px] md:text-xs font-black text-white uppercase tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mt-1">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
