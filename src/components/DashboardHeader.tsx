import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, MapPin, Search, Navigation, ChevronDown, LogOut, LayoutDashboard, ShoppingBag, List, PlusCircle, Users, Settings, ArrowLeft, Menu, X, LocateFixed } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { cityMapping, cityCoords, getClosestCity } from '../constants/cityMapping';
import MobileSidebar from './MobileSidebar';
import NotificationSidebar from './NotificationSidebar';
import logoV2 from '../assets/marketing/branding/logo v2.png';

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

  const filteredCities = cities.filter(city => 
    city.toLowerCase().includes(citySearch.toLowerCase()) || 
    getMappedCity(citySearch).toLowerCase().includes(city.toLowerCase())
  );

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
      <div className="absolute top-full left-0 pt-2 w-64 z-[60]">
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
                <p className="text-sm font-bold text-[#1A1A1A] truncate">{displayName}</p>
                {getRoleBadge(role)}
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
    <header className="bg-white/90 backdrop-blur-md border-b border-outline-variant/30 sticky top-0 z-[70]">
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

      <div className="max-w-7xl mx-auto px-4 py-3 md:py-0 md:h-20 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6">
        
        {/* Top Mobile Row (Actions on Right + Logo on Left) */}
        <div className="flex items-center justify-between md:hidden w-full h-14">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center justify-center">
               <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 bg-[#F9F9F6] rounded-[10px] border border-outline-variant/10">
                  <motion.span animate={isSidebarOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }} className="w-5 h-0.5 bg-[#2E7D32] rounded-full" />
                  <motion.span animate={isSidebarOpen ? { opacity: 0 } : { opacity: 1 }} className="w-5 h-0.5 bg-[#2E7D32] rounded-full" />
                  <motion.span animate={isSidebarOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }} className="w-5 h-0.5 bg-[#2E7D32] rounded-full" />
               </button>
            </div>
            
            <button 
              onClick={() => setIsNotificationSidebarOpen(true)}
              className={`p-2 rounded-[10px] border border-transparent transition-colors relative ${isNotificationSidebarOpen ? 'bg-white text-[#2E7D32] border-[#2E7D32]' : 'bg-[#F9F9F6] text-[#757575] hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32]'}`}
            >
              <Bell className="w-5 h-5" />
              {(Array.isArray(notifications) ? notifications : []).some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>

          <button onClick={() => onNavigate?.('home')} className="flex items-center">
            <img 
              src={logoV2} 
              alt="كسابكوم" 
              className="h-8 w-auto object-contain"
            />
          </button>
        </div>

        {/* Desktop Title & Centered Welcome Message / Logo */}
        <div className="hidden md:flex items-center justify-start flex-1 relative h-full">
          <div className="flex items-center gap-6 animate-in fade-in slide-in-from-top-1 duration-700">
            <button 
              onClick={() => onNavigate?.('home')}
              className="text-lg font-black text-primary hover:text-primary/80 transition-colors font-headline"
            >
              الرئيسية
            </button>
            <div className="w-px h-4 bg-outline-variant/30" />
            <button 
              onClick={() => onNavigate?.('search-results')}
              className="text-lg font-black text-[#1A1A1A] hover:text-primary transition-colors font-headline"
            >
              البحث
            </button>
          </div>
        </div>

        {/* Modern Expert Search Bar - Adapted for Dashboard */}
        {showSearch && (
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
                    {cities.map(city => (
                      <button 
                        key={city}
                        onClick={(e) => { e.stopPropagation(); setCitySearch(city); setIsOpenCity(false); onSearch?.(city, distance); }}
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
                    {distance === '10' ? '10 كلم' : 
                     distance === '20' ? '20 كلم' : 
                     distance === '50' ? '50 كلم' : 
                     distance === 'all' ? 'الكل' : 'المسافة'}
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
                          onClick={(e) => { e.stopPropagation(); setDistance(dist.val); setIsOpenRadius(false); }}
                          className={`w-full text-right px-4 py-2 rounded-[10px] text-sm font-bold transition-colors ${distance === dist.val ? 'bg-[#2E7D32] text-white' : 'hover:bg-[#F9F9F6] text-[#4A4A4A]'}`}
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
            
            <button 
              onClick={() => onSearch?.(getMappedCity(citySearch), distance)}
              className="bg-[#2E7D32] text-white py-1.5 px-4 sm:px-6 rounded-[10px] border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-all shadow-sm flex items-center gap-2 justify-center shrink-0 group"
            >
              <span className="text-xs sm:text-sm font-bold">بحث</span>
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}

        {/* Desktop Actions */}
        <div className="hidden md:flex flex-1 items-center justify-end gap-3 lg:gap-4">
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2.5 rounded-[10px] border border-transparent transition-colors relative ${showNotifications ? 'bg-white text-[#2E7D32] border-[#2E7D32]' : 'bg-[#F9F9F6] text-[#757575] hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32]'}`}
            >
              <Bell className="w-5 h-5" />
              {(Array.isArray(notifications) ? notifications : []).some(n => !n.read) && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            {showNotifications && renderNotifications()}
          </div>

          <div 
            className="relative" 
            ref={profileRef}
            onMouseEnter={() => setShowProfileMenu(true)}
            onMouseLeave={() => setShowProfileMenu(false)}
          >
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F9F9F6] border border-outline-variant/10 hover:bg-white hover:border-[#2E7D32] transition-colors overflow-hidden shadow-sm shrink-0">
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
    </header>
  );
}
