import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Navigation, Bell, User, LogOut, LayoutDashboard, ShoppingBag, PlusCircle, Settings, Users, List, ChevronDown, Menu, X, LocateFixed, Target, Route } from 'lucide-react';
import { motion } from 'motion/react';
import { ViewType } from '../App';
import { useAuth } from '../contexts/AuthContext';
import MobileSidebar from './MobileSidebar';
import NotificationSidebar from './NotificationSidebar';
import { useSettings } from '../hooks/useSettings';
import { firestoreService } from '../services/firestoreService';
import { cityCoords, getClosestCity, normalizeArabic, cityMapping } from '../constants/cityMapping';
import logoV2 from '../assets/marketing/branding/logo-v2.png';
import ValidationModal from './ValidationModal';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string, breed?: string) => void;
  initialCity?: string;
  initialRadius?: string;
}

const moroccanCities = Object.keys(cityCoords).sort();

export default function SearchHeader({ onNavigate, initialCity = '', initialRadius = '10' }: Props) {
  const { user, profile, signOut } = useAuth();
  const { settings } = useSettings();
  const [citySearch, setCitySearch] = useState(initialCity);
  const [isLocating, setIsLocating] = useState(false);
  const [radiusSearch, setRadiusSearch] = useState(initialRadius);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  
  const [isOpenCity, setIsOpenCity] = useState(false);
  const [isOpenRadius, setIsOpenRadius] = useState(false);
  
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const unsub = firestoreService.subscribeToUserNotifications(user.uid, setNotifications);
    return () => unsub();
  }, [user]);

  const handleMarkNotifAsRead = async (id: string) => {
    if (user) await firestoreService.markNotificationAsRead(user.uid, id);
  };

  const filteredCities = moroccanCities.filter(city => {
    const normSearch = normalizeArabic(citySearch);
    if (!normSearch) return true;
    
    if (normalizeArabic(city).includes(normSearch)) return true;
    
    const mapped = cityMapping[citySearch.toLowerCase()] || cityMapping[citySearch];
    if (mapped && normalizeArabic(city).includes(normalizeArabic(mapped))) return true;
    
    return false;
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setIsOpenCity(false);
        setIsOpenRadius(false);
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
          const closest = getClosestCity(position.coords.latitude, position.coords.longitude);
          if (closest) {
            setCitySearch(closest);
          } else {
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md font-bold uppercase">Admin</span>;
      case 'seller': return <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-md font-bold uppercase">Kessab</span>;
      default: return <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md font-bold uppercase">Acheteur</span>;
    }
  };

  const renderProfileMenu = () => {
    const role = profile?.role || 'buyer';
    const displayName = profile?.fullName || profile?.displayName || (role === 'admin' ? 'المشرف' : role === 'seller' ? 'الكساب' : 'المشتري');
    
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
              <button onClick={() => { onNavigate('buyer', undefined, undefined, undefined, 'dashboard'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] transition-colors border border-transparent hover:bg-[#2E7D32] hover:text-white rounded-xl">
                <LayoutDashboard className="w-4 h-4" />
                <span>لوحة التحكم</span>
              </button>
              <button onClick={() => { onNavigate('buyer', undefined, undefined, undefined, 'kessaba-offers'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] transition-colors border border-transparent hover:bg-[#2E7D32] hover:text-white rounded-xl">
                <ShoppingBag className="w-4 h-4" />
                <span>طلباتي</span>
              </button>
            </>
          )}
          
          {role === 'seller' && (
            <>
              <button onClick={() => { onNavigate('seller', undefined, undefined, undefined, 'dashboard'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] transition-colors border border-transparent hover:bg-[#2E7D32] hover:text-white rounded-xl">
                <LayoutDashboard className="w-4 h-4" />
                <span>لوحة التحكم</span>
              </button>
              <button onClick={() => { onNavigate('seller', undefined, undefined, undefined, 'flock'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] transition-colors border border-transparent hover:bg-[#2E7D32] hover:text-white rounded-xl">
                <List className="w-4 h-4" />
                <span>إعلاناتي</span>
              </button>
              <button onClick={() => { onNavigate('add-listing'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] transition-colors border border-transparent hover:bg-[#2E7D32] hover:text-white rounded-xl">
                <PlusCircle className="w-4 h-4" />
                <span>إضافة إعلان</span>
              </button>
            </>
          )}
          
          {role === 'admin' && (
            <>
              <button onClick={() => { onNavigate('admin', undefined, undefined, undefined, 'overview'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] transition-colors border border-transparent hover:bg-[#2E7D32] hover:text-white rounded-xl">
                <LayoutDashboard className="w-4 h-4" />
                <span>لوحة التحكم</span>
              </button>
              <button onClick={() => { onNavigate('admin', undefined, undefined, undefined, 'users'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] transition-colors border border-transparent hover:bg-[#2E7D32] hover:text-white rounded-xl">
                <Users className="w-4 h-4" />
                <span>المستخدمين</span>
              </button>
              <button onClick={() => { onNavigate('admin', undefined, undefined, undefined, 'settings'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] transition-colors border border-transparent hover:bg-[#2E7D32] hover:text-white rounded-xl">
                <Settings className="w-4 h-4" />
                <span>الإعدادات</span>
              </button>
            </>
          )}
          
          <div className="h-px bg-outline-variant/10 my-2 mx-2"></div>
          
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 transition-colors border border-transparent hover:bg-transparent hover:text-red-700 hover:border-red-600 rounded-xl">
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </div>
    );
  };



  return (
    <>
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
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-outline-variant/30">
        {/* Row 1: Logo | Desktop Search | Actions — flex-row-reverse on mobile to match Home */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-2 md:gap-8 flex-row-reverse md:flex-row">
          
          {/* LEFT: Logo + desktop nav links */}
          <div className="flex items-center gap-2 md:gap-8 shrink-0">
            <button onClick={() => onNavigate('home')} className="flex items-center group">
              <img 
                src={logoV2} 
                alt="منصة kessabcom.ma" 
                className="h-[22px] md:h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </button>
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => onNavigate('home')} className="text-on-surface-variant hover:text-[#2E7D32] transition-colors font-medium text-sm">الرئيسية</button>
              <button onClick={() => onNavigate('search-results')} className="text-[#2E7D32] border-b-2 border-[#2E7D32] font-bold py-1 transition-colors text-sm">البحث</button>
            </div>
          </div>

          {/* CENTER: Desktop search bar */}
          <div ref={searchBarRef} className="hidden lg:flex items-center gap-1 sm:gap-2 bg-[#F9F9F6] border border-outline-variant/20 rounded-[10px] p-1 shadow-sm hover:shadow-md transition-shadow relative z-[60] shrink-0">
            <div className="w-32 sm:w-44 flex items-center px-2 sm:px-3 py-1 relative group bg-white rounded-[10px] border border-outline-variant/10 shadow-sm transition-all hover:border-[#2E7D32]/30 shrink-0">
              <MapPin className="hidden sm:block w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
              <input
                type="text"
                value={citySearch}
                onChange={(e) => { setCitySearch(e.target.value); setIsOpenCity(true); setIsOpenRadius(false); }}
                onFocus={() => { setIsOpenCity(true); setIsOpenRadius(false); }}
                placeholder="فين كتقلب؟"
                className="bg-transparent border-none outline-none w-full text-xs sm:text-sm font-bold text-[#1A1A1A] text-right sm:mr-2 placeholder:text-[#ABABAB]"
              />
              {citySearch && (
                <button onClick={(e) => { e.stopPropagation(); setCitySearch(''); setIsOpenCity(false); onNavigate('search-results', undefined, '', radiusSearch); }}>
                  <X className="w-3 h-3 text-[#ABABAB]" />
                </button>
              )}
              {isOpenCity && (
                <div className="absolute top-full mt-1.5 left-0 right-0 w-full bg-white rounded-[10px] shadow-2xl border border-outline-variant/10 z-[100] p-1" style={{minWidth: '180px'}}>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={(e) => { e.stopPropagation(); setCitySearch(''); setIsOpenCity(false); onNavigate('search-results', undefined, '', radiusSearch); }} className={`w-full text-right px-4 py-2 rounded-[10px] text-sm font-bold transition-colors ${!citySearch ? 'bg-[#2E7D32] text-white' : 'hover:bg-[#F9F9F6] text-[#4A4A4A]'}`}>الكل</button>
                      {filteredCities.map(city => (
                        <button key={city} onClick={(e) => { e.stopPropagation(); setCitySearch(city); setIsOpenCity(false); onNavigate('search-results', undefined, city, radiusSearch); }} className={`w-full text-right px-4 py-2 rounded-[10px] text-sm font-bold transition-colors ${citySearch === city ? 'bg-[#2E7D32] text-white' : 'hover:bg-[#F9F9F6] text-[#4A4A4A]'}`}>{city}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button onClick={handleLocateMe} disabled={isLocating} className="p-1.5 rounded-[10px] hover:bg-[#E8F5E9] border border-outline-variant/10 bg-white shadow-sm transition-colors text-[#2E7D32]">
              <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-pulse' : ''}`} />
            </button>
            {!settings.disableSearchRadius && (
              <div onClick={() => setIsOpenRadius(!isOpenRadius)} className="w-[85px] sm:w-[100px] flex items-center px-1.5 sm:px-2 py-1 relative bg-white rounded-[10px] border border-outline-variant/10 shadow-sm cursor-pointer shrink-0">
                <Navigation className="hidden sm:block w-3 h-3 text-[#2E7D32] shrink-0" />
                <span className="text-xs font-bold text-[#1A1A1A] text-right flex-1 truncate mr-1">{radiusSearch === 'all' ? 'الكل' : `${radiusSearch} كلم`}</span>
                {isOpenRadius && (
                  <div className="absolute top-full mt-2 left-0 right-0 w-full bg-white rounded-[10px] shadow-2xl border border-outline-variant/10 z-[100] p-1">
                    {['10', '20', '50', 'all'].map(v => (
                      <button key={v} onClick={(e) => { e.stopPropagation(); setRadiusSearch(v); setIsOpenRadius(false); }} className={`w-full text-right px-4 py-2 rounded-[10px] text-sm font-bold transition-colors ${radiusSearch === v ? 'bg-[#2E7D32] text-white' : 'hover:bg-[#F9F9F6] text-[#4A4A4A]'}`}>{v === 'all' ? 'الكل' : `${v} كلم`}</button>
                    ))}
                  </div>
                )}
                <ChevronDown className="hidden sm:block w-3 h-3 text-[#757575] ml-1" />
              </div>
            )}
            <button onClick={() => onNavigate('search-results', undefined, citySearch, radiusSearch)} className="bg-[#2E7D32] text-white py-1 px-3 sm:px-4 rounded-[10px] hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] border border-transparent transition-all shadow-sm flex items-center gap-2">
              <span className="text-xs font-bold">بحث</span>
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* RIGHT side (LTR) / LEFT side (mobile RTL): notification + profile + hamburger */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Hamburger — visible on mobile, before other icons in this flex group */}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 bg-[#F9F9F6] rounded-xl border border-outline-variant/10 transition-colors">
              <span className="w-4 h-0.5 bg-[#2E7D32] rounded-full"></span>
              <span className="w-4 h-0.5 bg-[#2E7D32] rounded-full"></span>
              <span className="w-4 h-0.5 bg-[#2E7D32] rounded-full"></span>
            </button>
            {user ? (
              <>
                <button onClick={() => setIsNotificationSidebarOpen(true)} className={`p-2 rounded-xl transition-colors relative ${isNotificationSidebarOpen ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F9F9F6] text-[#757575] hover:bg-white hover:text-[#2E7D32] border border-transparent hover:border-[#2E7D32]'}`}>
                  <Bell className="w-5 h-5" />
                  {(Array.isArray(notifications) ? notifications : []).some(n => !n.read) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>
                <div className="relative" ref={profileRef} onMouseEnter={() => setShowProfileMenu(true)} onMouseLeave={() => setShowProfileMenu(false)}>
                  <button onClick={() => { const role = profile?.role || 'buyer'; onNavigate(role === 'admin' ? 'admin' : role === 'seller' ? 'seller' : 'buyer', undefined, undefined, undefined, role === 'admin' ? 'overview' : 'dashboard'); }} className="flex items-center justify-center w-9 h-9 rounded-full bg-[#F9F9F6] border border-outline-variant/10 hover:bg-white hover:border-[#2E7D32] transition-colors overflow-hidden shadow-sm">
                    {profile?.photoURL ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" /> : <div className="w-full h-full bg-[#2E7D32] text-white flex items-center justify-center font-bold"><User className="w-5 h-5" /></div>}
                  </button>
                  {showProfileMenu && renderProfileMenu()}
                </div>
              </>
            ) : (
              <button onClick={() => onNavigate('auth')} className="bg-[#2E7D32] text-white px-4 md:px-6 py-2 rounded-xl text-sm font-bold transition-colors border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] shadow-sm animate-shake">
                دخول
              </button>
            )}
          </div>
        </div>

        {/* Row 2 — Mobile search bar */}
        <div className="lg:hidden px-4 pb-3 border-t border-outline-variant/10 pt-2 bg-white/50">
          <div className="flex flex-row items-center gap-1 bg-[#F9F9F6] border border-outline-variant/20 rounded-[10px] p-1 shadow-sm relative z-[60] w-full">
            <div className="flex-1 flex items-center px-2 py-1.5 relative bg-white rounded-[10px] border border-outline-variant/10 shadow-sm min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
              <input
                type="text"
                value={citySearch}
                onChange={(e) => { setCitySearch(e.target.value); setIsOpenCity(true); setIsOpenRadius(false); }}
                onFocus={() => { setIsOpenCity(true); setIsOpenRadius(false); }}
                placeholder="فين كتقلب؟"
                className="bg-transparent border-none outline-none w-full text-xs font-bold text-[#1A1A1A] text-right mr-2 placeholder:text-[#ABABAB]"
              />
            </div>
            
            <button onClick={handleLocateMe} className="p-1.5 rounded-[10px] bg-white border border-outline-variant/10 text-[#2E7D32] shrink-0">
              <LocateFixed className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Radius Selector */}
            <div 
              onClick={() => { setIsOpenRadius(!isOpenRadius); setIsOpenCity(false); }}
              className="w-[70px] flex items-center px-1 py-1.5 relative bg-white rounded-[10px] border border-outline-variant/10 shadow-sm cursor-pointer shrink-0"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpenRadius(!isOpenRadius); setIsOpenCity(false); }}
                className="bg-transparent border-none outline-none w-full text-[10px] font-bold text-[#1A1A1A] text-center"
              >
                {radiusSearch === '10' ? '10 كلم' : 
                 radiusSearch === '20' ? '20 كلم' : 
                 radiusSearch === '50' ? '50 كلم' : 
                 radiusSearch === 'all' ? 'الكل' : 'المسافة'}
              </button>
              {isOpenRadius && (
                <div className="absolute top-full mt-2 left-0 right-0 w-full bg-white rounded-[10px] shadow-2xl border border-outline-variant/10 z-[100] p-1">
                  {['10', '20', '50', 'all'].map(v => (
                    <button
                      key={v}
                      onClick={(e) => { e.stopPropagation(); setRadiusSearch(v); setIsOpenRadius(false); onNavigate('search-results', undefined, citySearch, v); }}
                      className={`w-full text-center px-2 py-2 rounded-[8px] text-[10px] font-bold transition-colors ${radiusSearch === v ? 'bg-[#2E7D32] text-white' : 'hover:bg-[#F9F9F6] text-[#4A4A4A]'}`}
                    >
                      {v === 'all' ? 'الكل' : `${v} كلم`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => onNavigate('search-results', undefined, citySearch, radiusSearch)} className="bg-[#2E7D32] text-white p-1.5 rounded-[10px] shrink-0">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showTutorial && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowTutorial(false)}>
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowTutorial(false)} className="absolute top-6 right-6 z-10 bg-white/20 hover:bg-white/40 text-white p-2.5 rounded-full transition-colors backdrop-blur-md"><X className="w-6 h-6" /></button>
              <iframe src={settings.tutorialUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </div>
        )}

        <ValidationModal isOpen={showValidationModal} onClose={() => { setShowValidationModal(false); setIsOpenCity(true); }} message="عافاك اختار المدينة فين كتقلب أولاً" />
      </header>
    </>
  );
}
