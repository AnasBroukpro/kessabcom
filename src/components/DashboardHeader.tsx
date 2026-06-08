import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, MapPin, Search, Navigation, ChevronDown, LogOut, LayoutDashboard, ShoppingBag, List, PlusCircle, Users, Settings, ArrowLeft, Menu, X, LocateFixed, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { cityMapping, cityCoords, getClosestCity, normalizeArabic } from '../constants/cityMapping';
import MobileSidebar from './MobileSidebar';
import NotificationSidebar from './NotificationSidebar';
import logoV2 from '../assets/marketing/branding/logo-v2.png';

interface Props {
  title?: string;
  subtitle?: string;
  location?: string;
  showSearch?: boolean;
  onSearch?: (city: string, distance: string) => void;
  onNavigate?: (view: any, listingId?: string, city?: string, radius?: string, subView?: string, breed?: string) => void;
}

const cities = Object.keys(cityCoords).sort();

export default function DashboardHeader({ title, subtitle, location, showSearch = true, onSearch, onNavigate }: Props) {
  const { user, profile, notifications, unreadCount, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [distance, setDistance] = useState('10');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isOpenCity, setIsOpenCity] = useState(false);
  const [isOpenRadius, setIsOpenRadius] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const getMappedCity = (input: string) => {
    const normalizedInput = input.toLowerCase().trim();
    return cityMapping[normalizedInput] || input;
  };

  const filteredCities = cities.filter(city => {
    const normSearch = normalizeArabic(citySearch);
    if (!normSearch) return true;
    
    // Check Arabic name normalization
    if (normalizeArabic(city).includes(normSearch)) return true;
    
    // Check mapped city (from French/English)
    const mapped = getMappedCity(citySearch);
    if (mapped && normalizeArabic(city).includes(normalizeArabic(mapped))) return true;
    
    return false;
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setIsOpenCity(false);
        setIsOpenRadius(false);
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
    if (onNavigate) onNavigate('auth');
  };
  
  const handleLocateMe = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const closest = getClosestCity(position.coords.latitude, position.coords.longitude);
          if (closest) {
            setCitySearch(closest);
            onSearch?.(closest, distance);
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

  const handleMarkNotificationAsRead = async (id: string) => {
    if (user) await firestoreService.markNotificationAsRead(user.uid, id);
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
      <div className="hidden md:block absolute top-full left-0 pt-2 w-64 z-[60]">
        <div className="bg-white rounded-[10px] shadow-2xl border border-outline-variant/20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
                <p className="text-sm font-bold text-[#1A1A1A] truncate max-w-[120px]" title={displayName}>{displayName}</p>
                <div className="flex items-center gap-1.5">
                  {getRoleBadge(role)}
                  {role === 'seller' && (
                    <div className="flex items-center gap-0.5 text-[#FF9800]">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-bold">{(profile?.rating || 5).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        
        <div className="p-2">
          {role === 'buyer' && (
            <>
              <button onClick={() => { onNavigate?.('buyer', undefined, undefined, undefined, 'dashboard'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-[10px] transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                <span>لوحة التحكم</span>
              </button>
              <button onClick={() => { onNavigate?.('buyer', undefined, undefined, undefined, 'kessaba-offers'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-[10px] transition-colors">
                <ShoppingBag className="w-4 h-4" />
                <span>طلباتي</span>
              </button>
            </>
          )}
          
          {role === 'seller' && (
            <>
              <button onClick={() => { onNavigate?.('seller', undefined, undefined, undefined, 'dashboard'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-[10px] transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                <span>لوحة التحكم</span>
              </button>
              <button onClick={() => { onNavigate?.('seller', undefined, undefined, undefined, 'flock'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-[10px] transition-colors">
                <List className="w-4 h-4" />
                <span>إعلاناتي</span>
              </button>
              <button onClick={() => { onNavigate?.('add-listing'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-[10px] transition-colors">
                <PlusCircle className="w-4 h-4" />
                <span>إضافة إعلان</span>
              </button>
            </>
          )}
          
          {role === 'admin' && (
            <>
              <button onClick={() => { onNavigate?.('admin', undefined, undefined, undefined, 'overview'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-[10px] transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                <span>لوحة التحكم</span>
              </button>
              <button onClick={() => { onNavigate?.('admin', undefined, undefined, undefined, 'users'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-[10px] transition-colors">
                <Users className="w-4 h-4" />
                <span>المستخدمين</span>
              </button>
              <button onClick={() => { onNavigate?.('admin', undefined, undefined, undefined, 'settings'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-[10px] transition-colors">
                <Settings className="w-4 h-4" />
                <span>الإعدادات</span>
              </button>
              <button onClick={() => { onNavigate?.('admin', undefined, undefined, undefined, 'profile'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-[10px] transition-colors">
                <User className="w-4 h-4" />
                <span>ملفي الشخصي</span>
              </button>
            </>
          )}

          <button onClick={() => { onNavigate?.('home'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-[10px] transition-colors">
            <ArrowLeft className="w-4 h-4 rotate-180" />
            <span>الرجوع للرئيسية</span>
          </button>
          
          <div className="h-px bg-outline-variant/10 my-2 mx-2"></div>
          
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-[10px] transition-colors">
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
      <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-3 duration-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h3 className="font-black text-[#1A1A1A]">التنبيهات</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] bg-[#2E7D32] text-white px-2.5 py-1 rounded-full font-bold">{unreadCount} جديد</span>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {safeNotifications.length > 0 ? (
            safeNotifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`px-5 py-4 border-b border-gray-50 transition-all cursor-pointer ${!notif.read ? 'bg-green-50/50 hover:bg-green-50' : 'hover:bg-gray-50'}`}
                onClick={() => handleMarkNotificationAsRead(notif.id)}
              >
                <p className="text-sm font-bold text-[#1A1A1A] mb-1 leading-tight">{notif.title}</p>
                <p className="text-xs text-gray-500 mb-2 leading-relaxed">{notif.message}</p>
                <p className="text-[10px] text-gray-400 font-bold">
                  {notif.createdAt?.toDate?.()?.toLocaleDateString('ar-MA') || 'منذ وقت قصير'}
                </p>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400 font-bold">لا توجد تنبيهات حالياً</div>
          )}
        </div>
          <button 
            onClick={() => {
              const role = profile?.role;
              if (role === 'admin') onNavigate?.('admin', undefined, undefined, undefined, 'notifications');
              else if (role === 'seller') onNavigate?.('seller', undefined, undefined, undefined, 'notifications');
              else if (role === 'buyer') onNavigate?.('buyer', undefined, undefined, undefined, 'notifications');
              else onNavigate?.('notifications');
              setShowNotifications(false);
            }}
            className="w-full p-4 text-sm font-bold text-[#2E7D32] hover:bg-green-50 transition-colors border-t border-gray-50"
          >
            مشاهدة جميع التنبيهات
          </button>
      </div>
    );
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-outline-variant/30">
      <MobileSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={(view, lid, city, rad, sub) => onNavigate?.(view, lid, city, rad, sub)} 
      />
      <NotificationSidebar
        isOpen={isNotificationSidebarOpen}
        onClose={() => setIsNotificationSidebarOpen(false)}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
      />

      {/* Row 1: Logo | Desktop Search | Actions */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 w-full flex items-center justify-between gap-2 md:gap-8 flex-row-reverse md:flex-row">
        
        {/* LEFT: Logo (desktop also shows nav links) */}
        <div className="flex items-center gap-2 md:gap-8 shrink-0">
          <button onClick={() => onNavigate?.('home')} className="flex items-center group">
            <img 
              src={logoV2} 
              alt="منصة kessabcom.ma" 
              className="h-[22px] md:h-8 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </button>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => onNavigate?.('home')} className="text-on-surface-variant hover:text-[#2E7D32] transition-colors font-medium text-sm">الرئيسية</button>
            <button onClick={() => onNavigate?.('search-results')} className="text-on-surface-variant hover:text-[#2E7D32] transition-colors font-medium text-sm">البحث</button>
          </div>
        </div>

        {/* Modern Expert Search Bar - Desktop Centered */}
        {showSearch && (
          <div ref={searchBarRef} className="hidden lg:flex items-center gap-1 sm:gap-2 bg-[#F9F9F6] border border-outline-variant/20 rounded-[10px] p-1 shadow-sm hover:shadow-md transition-shadow relative z-[60] shrink-0">
            {/* City Selector */}
            <div 
              onClick={() => { setIsOpenCity(!isOpenCity); setIsOpenRadius(false); }}
              className="w-32 sm:w-44 flex items-center px-2 sm:px-3 py-1 relative group bg-white rounded-[10px] border border-outline-variant/10 shadow-sm transition-all hover:border-[#2E7D32]/30 cursor-pointer shrink-0"
            >
              <MapPin className="hidden sm:block w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
              <div className="flex flex-col text-right sm:mr-2 flex-1 min-w-0">
                <input 
                  type="text"
                  value={citySearch}
                  onChange={(e) => { 
                    setCitySearch(e.target.value); 
                    setIsOpenCity(true); 
                  }}
                  onFocus={() => setIsOpenCity(true)}
                  placeholder="فين كتقلب؟"
                  className="bg-transparent border-none outline-none w-full text-xs sm:text-sm font-bold text-[#1A1A1A] text-right placeholder:text-[#ABABAB]"
                />
              </div>
              <ChevronDown className={`hidden sm:block w-3 h-3 text-[#757575] transition-transform ${isOpenCity ? 'rotate-180' : ''}`} />

              {isOpenCity && (
                <div className="absolute top-full mt-1.5 left-0 right-0 w-full bg-white rounded-[10px] shadow-2xl border border-outline-variant/10 z-[100] p-1">
                  <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                    {filteredCities.length > 0 ? (
                      filteredCities.map(city => (
                        <button 
                          key={city}
                          onClick={(e) => { e.stopPropagation(); setCitySearch(city); setIsOpenCity(false); onSearch?.(city, distance); }}
                          className={`w-full text-right px-4 py-2 rounded-[10px] text-sm font-bold transition-colors ${citySearch === city ? 'bg-[#2E7D32] text-white' : 'hover:bg-[#F9F9F6] text-[#4A4A4A]'}`}
                        >
                          {city}
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-gray-500 font-bold">لا توجد نتائج</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); handleLocateMe(); }}
              disabled={isLocating}
              className={`p-1.5 rounded-[10px] hover:bg-[#E8F5E9] border border-outline-variant/10 bg-white shadow-sm transition-colors text-[#2E7D32]`}
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-pulse' : ''}`} />
            </button>

            {/* Distance Selector */}
            <div 
              onClick={() => { setIsOpenRadius(!isOpenRadius); setIsOpenCity(false); }}
              className="w-[85px] sm:w-[100px] flex items-center px-1.5 sm:px-2 py-1 relative group bg-white rounded-[10px] border border-outline-variant/10 shadow-sm transition-all hover:border-[#2E7D32]/30 cursor-pointer shrink-0"
            >
              <Navigation className="hidden sm:block w-3 h-3 text-[#2E7D32] shrink-0" />
              <div className="flex flex-col text-right sm:mr-2 flex-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsOpenRadius(!isOpenRadius); setIsOpenCity(false); }}
                  className="bg-transparent border-none outline-none w-full text-xs font-bold text-[#1A1A1A] text-right flex items-center justify-between"
                >
                  <span className="truncate">
                    {distance === '10' ? '10 كلم' : 
                     distance === '20' ? '20 كلم' : 
                     distance === '50' ? '50 كلم' : 
                     distance === 'all' ? 'الكل' : 'المسافة'}
                  </span>
                </button>

                {isOpenRadius && (
                  <div className="absolute top-full mt-2 left-0 right-0 w-full bg-white rounded-[10px] shadow-2xl border border-outline-variant/10 z-[100] p-1">
                    {['10', '20', '50', 'all'].map(v => (
                      <button key={v} onClick={(e) => { e.stopPropagation(); setDistance(v); setIsOpenRadius(false); }} className={`w-full text-right px-4 py-2 rounded-[10px] text-sm font-bold transition-colors ${distance === v ? 'bg-[#2E7D32] text-white' : 'hover:bg-[#F9F9F6] text-[#4A4A4A]'}`}>
                        {v === 'all' ? 'الكل' : `${v} كلم`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <ChevronDown className={`hidden sm:block w-3 h-3 text-[#757575] ml-1 transition-transform ${isOpenRadius ? 'rotate-180' : ''}`} />
            </div>
            
            <button 
              onClick={() => onSearch?.(getMappedCity(citySearch), distance)}
              className="bg-[#2E7D32] text-white py-1 px-3 sm:px-4 rounded-[10px] hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] border border-transparent transition-all shadow-sm flex items-center gap-2"
            >
              <span className="text-xs font-bold">بحث</span>
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* RIGHT: hamburger (first = rightmost on mobile RTL) + notification + profile */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Hamburger — first = rightmost on mobile RTL */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 bg-[#F9F9F6] rounded-xl border border-outline-variant/10 transition-colors"
          >
            <span className="w-4 h-0.5 bg-[#2E7D32] rounded-full"></span>
            <span className="w-4 h-0.5 bg-[#2E7D32] rounded-full"></span>
            <span className="w-4 h-0.5 bg-[#2E7D32] rounded-full"></span>
          </button>

          <button 
            onClick={() => setIsNotificationSidebarOpen(true)}
            className={`p-2 rounded-xl transition-colors relative ${isNotificationSidebarOpen ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F9F9F6] text-[#757575] hover:bg-white hover:text-[#2E7D32] border border-transparent hover:border-[#2E7D32]'}`}
          >
            <Bell className="w-5 h-5" />
            {(Array.isArray(notifications) ? notifications : []).some(n => !n.read) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          <div 
            className="relative" 
            ref={profileRef}
            onMouseEnter={() => setShowProfileMenu(true)}
            onMouseLeave={() => setShowProfileMenu(false)}
          >
            <button className="flex items-center justify-center w-9 h-9 rounded-full bg-[#F9F9F6] border border-outline-variant/10 md:hover:bg-white md:hover:border-[#2E7D32] transition-colors overflow-hidden shadow-sm">
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
        </div>
      </div>

      {/* Row 2 — Mobile search bar */}
      {showSearch && (
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
            {/* Mobile Radius Selector */}
            <div 
              onClick={() => { setIsOpenRadius(!isOpenRadius); setIsOpenCity(false); }}
              className="w-[80px] flex items-center px-1.5 py-1.5 relative bg-white rounded-[10px] border border-outline-variant/10 shadow-sm cursor-pointer shrink-0"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpenRadius(!isOpenRadius); setIsOpenCity(false); }}
                className="bg-transparent border-none outline-none w-full text-[11px] font-bold text-[#1A1A1A] text-center"
              >
                {distance === '10' ? '10 كلم' : 
                 distance === '20' ? '20 كلم' : 
                 distance === '50' ? '50 كلم' : 
                 distance === 'all' ? 'الكل' : 'المسافة'}
              </button>
              {isOpenRadius && (
                <div className="absolute top-full mt-2 left-0 right-0 w-full bg-white rounded-[10px] shadow-2xl border border-outline-variant/10 z-[100] p-1">
                  {['10', '20', '50', 'all'].map(v => (
                    <button
                      key={v}
                      onClick={(e) => { e.stopPropagation(); setDistance(v); setIsOpenRadius(false); onSearch?.(citySearch, v); }}
                      className={`w-full text-center px-2 py-2 rounded-[8px] text-[11px] font-bold transition-colors ${distance === v ? 'bg-[#2E7D32] text-white' : 'hover:bg-[#F9F9F6] text-[#4A4A4A]'}`}
                    >
                      {v === 'all' ? 'الكل' : `${v} كلم`}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={() => onSearch?.(getMappedCity(citySearch), distance)}
              className="bg-[#2E7D32] text-white p-1.5 rounded-[10px] shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      </header>
  );
}

