import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Navigation, Bell, User, LogOut, LayoutDashboard, ShoppingBag, PlusCircle, Settings, Users, List, ChevronDown, Menu, X } from 'lucide-react';
import { motion } from 'motion/react';
import { ViewType } from '../App';
import { useAuth } from '../contexts/AuthContext';
import MobileSidebar from './MobileSidebar';
import { firestoreService } from '../services/firestoreService';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
  initialCity?: string;
  initialRadius?: string;
}

const moroccanCities = [
  "الدار البيضاء", "الرباط", "فاس", "مراكش", "أكادير", "طنجة", "مكناس", "وجدة", "القنيطرة", "تطوان", "خريبكة", "بني ملال", "الجديدة", "آسفي", "سطات", "برشيد", "الخميسات", "الناظور", "تازة", "المحمدية"
];

export default function SearchHeader({ onNavigate, initialCity = '', initialRadius = '10' }: Props) {
  const { user, profile, signOut } = useAuth();
  const [citySearch, setCitySearch] = useState(initialCity);
  const [radiusSearch, setRadiusSearch] = useState(initialRadius);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

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
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
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
    const unreadCount = notifications.filter(n => !n.read).length;
    return (
      <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between">
          <h3 className="font-bold text-[#1A1A1A]">التنبيهات</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] bg-[#2E7D32] text-white px-2 py-0.5 rounded-full">{unreadCount} جديد</span>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => handleMarkNotifAsRead(notif.id)}
                className={`p-4 border-b border-outline-variant/5 hover:bg-[#F9F9F6] transition-colors cursor-pointer ${!notif.read ? 'bg-primary/5' : ''}`}
              >
                <p className="text-sm font-bold text-[#1A1A1A] mb-1">{notif.title}</p>
                <p className="text-xs text-[#757575] line-clamp-2">{notif.message}</p>
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

      <div className="max-w-7xl mx-auto px-6 py-3 md:py-0 md:h-20 flex flex-col md:grid md:grid-cols-3 md:items-center gap-3 md:gap-4">
        
        {/* Top Mobile Row: Logo + Actions */}
        <div className="flex items-center justify-between md:hidden">
          {/* Logo */}
          <button onClick={() => onNavigate('home')} className="text-xl font-black text-[#2E7D32] tracking-tight font-headline">Kessabcom</button>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="relative" ref={notificationsRef}>
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 rounded-xl transition-colors border ${showNotifications ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]' : 'bg-[#F9F9F6] text-[#757575] border-transparent hover:border-[#757575]'}`}
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  </button>
                  {showNotifications && renderNotifications()}
                </div>
                
                {/* Animated Hamburger Button */}
                <button 
                  onClick={() => {
                    setShowNotifications(false);
                    setShowProfileMenu(false);
                    setIsSidebarOpen(!isSidebarOpen);
                  }}
                  className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 bg-[#F9F9F6] rounded-xl border border-outline-variant/10 relative z-[105]"
                >
                  <motion.span 
                    animate={isSidebarOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                    className="w-5 h-0.5 bg-[#2E7D32] rounded-full"
                  />
                  <motion.span 
                    animate={isSidebarOpen ? { opacity: 0 } : { opacity: 1 }}
                    className="w-5 h-0.5 bg-[#2E7D32] rounded-full"
                  />
                  <motion.span 
                    animate={isSidebarOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                    className="w-5 h-0.5 bg-[#2E7D32] rounded-full"
                  />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => onNavigate('auth')} className="bg-[#2E7D32] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors border border-transparent hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32]">
                  دخول
                </button>
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 bg-[#F9F9F6] rounded-xl border border-outline-variant/10 transition-colors hover:border-[#2E7D32]"
                >
                  <span className="w-5 h-0.5 bg-[#2E7D32] rounded-full"></span>
                  <span className="w-5 h-0.5 bg-[#2E7D32] rounded-full"></span>
                  <span className="w-5 h-0.5 bg-[#2E7D32] rounded-full"></span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Logo & Nav (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-6 justify-start">
          <button onClick={() => onNavigate('home')} className="flex items-center group">
            <img 
              src="https://i.ibb.co/Psdn5FfW/logo-removebg-preview.png" 
              alt="كسابكوم" 
              className="h-7 md:h-9 w-auto object-contain transition-transform group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          </button>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('home')} className="text-on-surface-variant hover:text-[#2E7D32] transition-colors font-medium text-sm">الرئيسية</button>
            <button onClick={() => onNavigate('search-results')} className="text-[#2E7D32] border-b-2 border-[#2E7D32] font-bold py-1 transition-colors text-sm">البحث</button>
          </div>
        </div>

        {/* Search Bar - Centered on Desktop, Full width on Mobile */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#F9F9F6] border border-outline-variant/20 rounded-xl p-1.5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-1 items-center divide-x divide-x-reverse divide-outline-variant/30">
            <div className="flex-1 relative" ref={suggestionsRef}>
              <div className="flex items-center px-3 gap-2">
                <MapPin className="w-4 h-4 text-[#2E7D32] shrink-0" />
                <input 
                  type="text" 
                  className="bg-transparent border-none outline-none w-full py-2.5 sm:py-2 text-sm font-bold text-[#1A1A1A] placeholder:text-[#757575]/60" 
                  placeholder="فين كتقلب؟"
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
              </div>
              {showSuggestions && citySearch && filteredCities.length > 0 && (
                <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-2xl border border-outline-variant/20 max-h-48 overflow-y-auto z-50">
                  {filteredCities.map((city, idx) => (
                    <button
                      key={idx}
                      className="w-full text-right px-4 py-2 hover:bg-[#F9F9F6] text-[#1A1A1A] font-medium transition-colors text-sm"
                      onClick={() => {
                        setCitySearch(city);
                        setShowSuggestions(false);
                      }}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex-1 flex items-center px-3 gap-2 group relative">
              <Navigation className="w-4 h-4 text-[#2E7D32] shrink-0 group-hover:scale-110 transition-transform" />
              <select 
                value={radiusSearch}
                onChange={(e) => setRadiusSearch(e.target.value)}
                className="bg-transparent border-none outline-none w-full py-2.5 sm:py-2 text-sm font-bold text-[#1A1A1A] appearance-none cursor-pointer focus:text-[#2E7D32] transition-colors"
                style={{ direction: 'rtl' }}
              >
                <option value="10">10 كلم</option>
                <option value="20">20 كلم</option>
                <option value="50">50 كلم</option>
                <option value="all">كاع لي كاين</option>
              </select>
              <ChevronDown className="w-3 h-3 text-[#757575] absolute left-3 pointer-events-none" />
            </div>
          </div>
          
          <button onClick={() => onNavigate('search-results', undefined, citySearch, radiusSearch)} className="bg-[#2E7D32] text-white p-3 sm:p-2.5 rounded-lg transition-colors border border-transparent hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32] shadow-sm flex items-center justify-center shrink-0">
            <Search className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Actions - Desktop only */}
        <div className="hidden md:flex items-center gap-4 justify-end">
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
