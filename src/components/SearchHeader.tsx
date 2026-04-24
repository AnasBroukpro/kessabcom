import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Navigation, Bell, User, LogOut, LayoutDashboard, ShoppingBag, PlusCircle, Settings, Users, List, ChevronDown, Menu, X, LocateFixed, Target, Route } from 'lucide-react';
import { motion } from 'motion/react';
import { ViewType } from '../App';
import { useAuth } from '../contexts/AuthContext';
import MobileSidebar from './MobileSidebar';
import { firestoreService } from '../services/firestoreService';
import { cityCoords, getClosestCity } from '../constants/cityMapping';
import logoV2 from '../assets/marketing/branding/logo v2.png';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string, breed?: string) => void;
  initialCity?: string;
  initialRadius?: string;
}

const moroccanCities = Object.keys(cityCoords).sort();

export default function SearchHeader({ onNavigate, initialCity = '', initialRadius = '10' }: Props) {
  const { user, profile, signOut } = useAuth();
  const [citySearch, setCitySearch] = useState(initialCity);
  const [isLocating, setIsLocating] = useState(false);
  const [radiusSearch, setRadiusSearch] = useState(initialRadius);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isOpenCity, setIsOpenCity] = useState(false);
  const [isOpenRadius, setIsOpenRadius] = useState(false);
  
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
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

  const filteredCities = moroccanCities.filter(city => city.includes(citySearch));

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

  const renderNotifications = () => {
    const safeNotifications = Array.isArray(notifications) ? notifications : [];
    const unreadCount = safeNotifications.filter(n => !n.read).length;
    return (
      <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between">
          <h3 className="font-bold text-[#1A1A1A]">التنبيهات</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] bg-[#2E7D32] text-white px-2 py-0.5 rounded-full">{unreadCount} جديد</span>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {safeNotifications.length > 0 ? (
            safeNotifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => handleMarkNotifAsRead(notif.id)}
                className={`p-4 border-b border-outline-variant/5 hover:bg-[#F9F9F6] transition-colors cursor-pointer ${!notif.read ? 'bg-primary/5' : ''}`}
              >
                <p className="text-sm font-bold text-[#1A1A1A] mb-1">{notif.title}</p>
                <p className="text-xs text-[#757575]">{notif.message}</p>
                <p className="text-[10px] text-[#2E7D32] mt-2">
                  {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleTimeString('ar-MA') : 'دابا'}
                </p>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-on-surface-variant italic text-sm">
              ما عندك حتى تنبيه حالياً
            </div>
          )}
        </div>
        <button className="w-full p-3 text-sm font-bold text-[#2E7D32] transition-colors border-t border-outline-variant/10 hover:bg-[#2E7D32] hover:text-white">
          مشاهدة الكل
        </button>
      </div>
    );
  };

  return (
    <>
      <MobileSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={onNavigate} 
      />
      <header className="bg-white/90 backdrop-blur-md border-b border-outline-variant/30 sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-6 py-3 md:py-0 md:h-20 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-8">
        
        {/* Top Mobile Row: Actions (Right) + Logo (Left) */}
        <div className="flex items-center justify-between md:hidden w-full">
          {/* Actions (Right in RTL) */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* 1. Animated Hamburger Button (Right-most) */}
                <button 
                  onClick={() => {
                    setShowNotifications(false);
                    setShowProfileMenu(false);
                    setIsSidebarOpen(!isSidebarOpen);
                  }}
                  className="w-9 h-9 flex flex-col items-center justify-center gap-1 bg-[#F9F9F6] rounded-lg border border-outline-variant/10 relative z-[105]"
                >
                  <motion.span 
                    animate={isSidebarOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                    className="w-4 h-0.5 bg-[#2E7D32] rounded-full"
                  />
                  <motion.span 
                    animate={isSidebarOpen ? { opacity: 0 } : { opacity: 1 }}
                    className="w-4 h-0.5 bg-[#2E7D32] rounded-full"
                  />
                  <motion.span 
                    animate={isSidebarOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                    className="w-4 h-0.5 bg-[#2E7D32] rounded-full"
                  />
                </button>

                {/* 2. Profile Image (To the right of Notification) */}
                <button 
                  onClick={() => onNavigate(profile?.role === 'seller' ? 'seller' : 'buyer')}
                  className="w-9 h-9 rounded-full bg-[#F9F9F6] border border-outline-variant/10 overflow-hidden flex items-center justify-center"
                >
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-[#2E7D32]" />
                  )}
                </button>

                {/* 3. Notification */}
                <div className="relative" ref={notificationsRef}>
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 rounded-lg transition-colors border ${showNotifications ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]' : 'bg-[#F9F9F6] text-[#757575] border-transparent hover:border-[#757575]'}`}
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {(Array.isArray(notifications) ? notifications : []).some(n => !n.read) && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                    )}
                  </button>
                  {showNotifications && renderNotifications()}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="w-9 h-9 flex flex-col items-center justify-center gap-1 bg-[#F9F9F6] rounded-lg border border-outline-variant/10 transition-colors hover:border-[#2E7D32]"
                >
                  <span className="w-4 h-0.5 bg-[#2E7D32] rounded-full"></span>
                  <span className="w-4 h-0.5 bg-[#2E7D32] rounded-full"></span>
                  <span className="w-4 h-0.5 bg-[#2E7D32] rounded-full"></span>
                </button>
                <button onClick={() => onNavigate('auth')} className="bg-[#2E7D32] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm">
                  دخول
                </button>
              </div>
            )}
          </div>

          {/* Logo (Left in RTL) */}
          <button onClick={() => onNavigate('home')} className="flex items-center">
            <img src={logoV2} alt="منصة kessabcom.ma" className="h-7 w-auto object-contain" />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-6 shrink-0">
          <button onClick={() => onNavigate('home')} className="flex items-center group">
            <img 
              src={logoV2} 
              alt="منصة kessabcom.ma" 
              className="h-8 md:h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </button>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('home')} className="text-on-surface-variant hover:text-[#2E7D32] transition-colors font-medium text-sm">الرئيسية</button>
            <button onClick={() => onNavigate('search-results')} className="text-[#2E7D32] border-b-2 border-[#2E7D32] font-bold py-1 transition-colors text-sm">البحث</button>
          </div>
        </div>

        {/* Modern Expert Search Bar - Copied from Dashboard for consistency */}
        <div ref={searchBarRef} className="lg:max-w-xl flex flex-row items-center gap-1 sm:gap-2 bg-[#F9F9F6] border border-outline-variant/20 rounded-[10px] p-1 sm:p-1.5 shadow-sm hover:shadow-md transition-shadow relative z-[60] w-fit mx-auto">
          {/* City Selector */}
          <div 
            onClick={() => { setIsOpenCity(!isOpenCity); setIsOpenRadius(false); }}
            className="w-32 sm:w-48 flex items-center px-2 sm:px-3 py-1.5 relative group bg-white rounded-[10px] border border-outline-variant/10 shadow-sm transition-all hover:border-[#2E7D32]/30 cursor-pointer shrink-0"
          >
            <MapPin className="hidden sm:block w-4 h-4 text-[#2E7D32] shrink-0" />
            <div className="flex flex-col text-right sm:mr-3 flex-1 min-w-0">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpenCity(!isOpenCity); setIsOpenRadius(false); }}
                className="bg-transparent border-none outline-none w-full text-xs sm:text-sm font-bold text-[#1A1A1A] text-right flex items-center justify-between gap-1"
              >
                <span className="truncate">{citySearch || 'فين كتقلب؟'}</span>
              </button>
            </div>
            <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-[#757575] transition-transform ${isOpenCity ? 'rotate-180' : ''}`} />

            {isOpenCity && (
              <div className="absolute top-full mt-1.5 left-0 right-0 w-full bg-white rounded-[10px] shadow-2xl border border-outline-variant/10 z-[100] p-1 animate-in slide-in-from-top-2 duration-200">
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCitySearch(''); setIsOpenCity(false); onNavigate('search-results', undefined, '', radiusSearch); }}
                    className={`w-full text-right px-4 py-2 rounded-[10px] text-sm font-bold transition-colors ${!citySearch ? 'bg-[#2E7D32] text-white' : 'hover:bg-[#F9F9F6] text-[#4A4A4A]'}`}
                  >
                    الكل
                  </button>
                  {moroccanCities.map(city => (
                    <button 
                      key={city}
                      onClick={(e) => { e.stopPropagation(); setCitySearch(city); setIsOpenCity(false); onNavigate('search-results', undefined, city, radiusSearch); }}
                      className={`w-full text-right px-4 py-2 rounded-[10px] text-sm font-bold transition-colors ${citySearch === city ? 'bg-[#2E7D32] text-white' : 'hover:bg-[#F9F9F6] text-[#4A4A4A]'}`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); handleLocateMe(); }}
            disabled={isLocating}
            title="في مدينتي"
            className={`p-1.5 sm:p-2 rounded-[10px] hover:bg-[#E8F5E9] border border-outline-variant/10 bg-white shadow-sm transition-colors shrink-0 flex items-center justify-center ${isLocating ? 'animate-pulse text-[#2E7D32]' : 'text-[#2E7D32]'}`}
          >
            <LocateFixed className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLocating ? 'animate-pulse' : ''}`} />
          </button>

          {/* Distance Selector */}
          <div 
            onClick={() => { setIsOpenRadius(!isOpenRadius); setIsOpenCity(false); }}
            className="w-[85px] sm:w-[120px] flex items-center px-1.5 sm:px-3 py-1.5 relative group bg-white rounded-[10px] border border-outline-variant/10 shadow-sm transition-all hover:border-[#2E7D32]/30 cursor-pointer shrink-0"
          >
            <Navigation className="hidden sm:block w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
            <div className="flex flex-col text-right sm:mr-3 flex-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpenRadius(!isOpenRadius); setIsOpenCity(false); }}
                className="bg-transparent border-none outline-none w-full text-xs sm:text-sm font-bold text-[#1A1A1A] text-right flex items-center justify-between"
              >
                <span className="truncate">
                  {radiusSearch === '10' ? '10 كلم' : 
                   radiusSearch === '20' ? '20 كلم' : 
                   radiusSearch === '50' ? '50 كلم' : 
                   radiusSearch === 'all' ? 'الكل' : 'المسافة'}
                </span>
              </button>

              {isOpenRadius && (
                <div className="absolute top-full mt-2 left-0 right-0 w-full bg-white rounded-[10px] shadow-2xl border border-outline-variant/10 z-[100] p-1 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex flex-col gap-0.5">
                    {[
                      { val: '10', label: '10 كلم' },
                      { val: '20', label: '20 كلم' },
                      { val: '50', label: '50 كلم' },
                      { val: 'all', label: 'الكل' }
                    ].map(dist => (
                      <button 
                        key={dist.val}
                        onClick={(e) => { e.stopPropagation(); setRadiusSearch(dist.val); setIsOpenRadius(false); }}
                        className={`w-full text-right px-4 py-2 rounded-[10px] text-sm font-bold transition-colors ${radiusSearch === dist.val ? 'bg-[#2E7D32] text-white' : 'hover:bg-[#F9F9F6] text-[#4A4A4A]'}`}
                      >
                        {dist.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <ChevronDown className={`hidden sm:block w-3 h-3 text-[#757575] ml-1 transition-transform ${isOpenRadius ? 'rotate-180' : ''}`} />
          </div>
          
          <button onClick={() => {
            if (!citySearch && radiusSearch !== 'all') {
              alert("عافاك اختار المدينة فين كتقلب أولاً");
              return;
            }
            onNavigate('search-results', undefined, citySearch, radiusSearch);
          }} className="bg-[#2E7D32] text-white py-1.5 px-4 sm:px-6 rounded-[10px] border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-all shadow-sm flex items-center gap-2 justify-center shrink-0 group">
            <span className="text-xs sm:text-sm font-bold">بحث</span>
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Actions - Desktop only */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {user ? (
            <>
              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2.5 rounded-xl transition-colors border ${showNotifications ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]' : 'bg-[#F9F9F6] text-[#757575] border-transparent hover:border-[#757575]'}`}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                {showNotifications && renderNotifications()}
              </div>

              {/* Profile */}
              <div 
                className="relative" 
                ref={profileRef}
                onMouseEnter={() => setShowProfileMenu(true)}
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F9F9F6] border border-outline-variant/10 hover:bg-[#F0F0F0] transition-all overflow-hidden shadow-sm">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
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
            <button onClick={() => onNavigate('auth')} className="bg-[#2E7D32] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors border border-transparent hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32] shadow-sm">
              <span>دخول</span>
            </button>
          )}
        </div>
      </div>
    </header>
    </>
  );
}
