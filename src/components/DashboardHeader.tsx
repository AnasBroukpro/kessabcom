import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, MapPin, Search, Navigation, ChevronDown, LogOut, LayoutDashboard, ShoppingBag, List, PlusCircle, Users, Settings, ArrowLeft, Menu, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { cityMapping } from '../constants/cityMapping';
import MobileSidebar from './MobileSidebar';
import NotificationSidebar from './NotificationSidebar';

interface Props {
  title?: string;
  subtitle?: string;
  location?: string;
  showSearch?: boolean;
  onSearch?: (city: string, distance: string) => void;
  onNavigate?: (view: any, listingId?: string, city?: string, radius?: string, subView?: string) => void;
}

const cities = ["سطات", "برشيد", "خريبكة", "الدار البيضاء", "الرباط", "مراكش", "أزرو", "خنيفرة", "وجدة", "الراشيدية", "طنجة"];

export default function DashboardHeader({ title, subtitle, location, showSearch = true, onSearch, onNavigate }: Props) {
  const { user, profile, notifications, unreadCount, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [distance, setDistance] = useState('10');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
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
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
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
    if (onNavigate) onNavigate('home');
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
              <button onClick={() => { onNavigate?.('buyer', undefined, undefined, undefined, 'dashboard'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                <span>لوحة التحكم</span>
              </button>
              <button onClick={() => { onNavigate?.('buyer', undefined, undefined, undefined, 'kessaba-offers'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
                <ShoppingBag className="w-4 h-4" />
                <span>طلباتي</span>
              </button>
            </>
          )}
          
          {role === 'seller' && (
            <>
              <button onClick={() => { onNavigate?.('seller', undefined, undefined, undefined, 'dashboard'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                <span>لوحة التحكم</span>
              </button>
              <button onClick={() => { onNavigate?.('seller', undefined, undefined, undefined, 'flock'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
                <List className="w-4 h-4" />
                <span>إعلاناتي</span>
              </button>
              <button onClick={() => { onNavigate?.('add-listing'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
                <PlusCircle className="w-4 h-4" />
                <span>إضافة إعلان</span>
              </button>
            </>
          )}
          
          {role === 'admin' && (
            <>
              <button onClick={() => { onNavigate?.('admin', undefined, undefined, undefined, 'overview'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                <span>لوحة التحكم</span>
              </button>
              <button onClick={() => { onNavigate?.('admin', undefined, undefined, undefined, 'users'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
                <Users className="w-4 h-4" />
                <span>المستخدمين</span>
              </button>
              <button onClick={() => { onNavigate?.('admin', undefined, undefined, undefined, 'settings'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
                <Settings className="w-4 h-4" />
                <span>الإعدادات</span>
              </button>
            </>
          )}

          <button onClick={() => { onNavigate?.('home'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A4A4A] hover:bg-[#F9F9F6] rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4 rotate-180" />
            <span>الرجوع للرئيسية</span>
          </button>
          
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

  const renderNotifications = () => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    return (
      <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-3 duration-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h3 className="font-black text-[#1A1A1A]">التنبيهات</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] bg-[#2E7D32] text-white px-2.5 py-1 rounded-full font-bold">{unreadCount} جديد</span>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`px-5 py-4 border-b border-gray-50 transition-all cursor-pointer ${!notif.isRead ? 'bg-green-50/50 hover:bg-green-50' : 'hover:bg-gray-50'}`}
                onClick={() => onMarkNotificationAsRead?.(notif.id)}
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
        {notifications.length > 0 && (
          <button className="w-full p-4 text-sm font-bold text-[#2E7D32] hover:bg-green-50 transition-colors border-t border-gray-50">
            مشاهدة جميع التنبيهات
          </button>
        )}
      </div>
    );
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-outline-variant/30 sticky top-0 z-50">
      <MobileSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onNavigate={(view, lid, city, rad, sub) => onNavigate?.(view, lid, city, rad, sub)} 
      />
      <NotificationSidebar
        isOpen={isNotificationSidebarOpen}
        onClose={() => setIsNotificationSidebarOpen(false)}
        notifications={notifications}
        onMarkNotificationAsRead={onMarkNotificationAsRead}
      />

      <div className="max-w-7xl mx-auto px-4 py-3 md:py-0 md:h-20 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6">
        
        {/* Top Mobile Row (Logo + Actions) */}
        <div className="flex items-center justify-between md:hidden w-full h-14">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center justify-center">
               <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 bg-[#F9F9F6] rounded-xl border border-outline-variant/10">
                  <motion.span animate={isSidebarOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }} className="w-5 h-0.5 bg-[#2E7D32] rounded-full" />
                  <motion.span animate={isSidebarOpen ? { opacity: 0 } : { opacity: 1 }} className="w-5 h-0.5 bg-[#2E7D32] rounded-full" />
                  <motion.span animate={isSidebarOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }} className="w-5 h-0.5 bg-[#2E7D32] rounded-full" />
               </button>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <button onClick={() => onNavigate?.('home')} className="group flex items-center">
              <img 
                src="https://i.ibb.co/Psdn5FfW/logo-removebg-preview.png" 
                alt="كسابكوم" 
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsNotificationSidebarOpen(true)}
              className={`p-2 rounded-xl border border-transparent transition-colors relative ${isNotificationSidebarOpen ? 'bg-white text-[#2E7D32] border-[#2E7D32]' : 'bg-[#F9F9F6] text-[#757575] hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32]'}`}
            >
              <Bell className="w-5 h-5" />
              {notifications.some(n => !n.isRead) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Title & Centered Welcome Message / Logo */}
        <div className="hidden md:flex items-center justify-center flex-1 relative h-full">
          {profile?.role === 'admin' ? (
            <div className="text-center animate-in fade-in slide-in-from-top-2 duration-700">
              <h2 className="text-lg font-black text-[#1A1A1A] font-headline">
                مرحبا بك {profile?.fullName?.split(' ')[0] || 'أنس'}، هاهي نظرة عامة ...
              </h2>
            </div>
          ) : (
            <button 
              onClick={() => onNavigate?.('home')} 
              className="flex items-center justify-center group"
            >
              <img 
                src="https://i.ibb.co/Psdn5FfW/logo-removebg-preview.png" 
                alt="كسابكوم" 
                className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </button>
          )}
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="flex-1 lg:max-w-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#F9F9F6] border border-outline-variant/20 rounded-xl p-1.5 shadow-sm hover:shadow-md transition-shadow">
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
                  <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-2xl border border-outline-variant/20 max-h-48 overflow-y-auto z-50 text-right">
                    {filteredCities.map((city, idx) => (
                      <button
                        key={idx}
                        className="w-full text-right px-4 py-2 hover:bg-[#F9F9F6] text-[#1A1A1A] font-medium transition-colors text-sm"
                        onClick={() => {
                          const mappedCity = getMappedCity(citySearch);
                          setCitySearch(mappedCity);
                          setShowSuggestions(false);
                          onSearch?.(mappedCity, '10');
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
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
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
            
            <button 
              onClick={() => onSearch?.(getMappedCity(citySearch), distance)}
              className="bg-[#2E7D32] text-white p-3 sm:p-2.5 rounded-lg border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors shadow-sm flex items-center justify-center shrink-0"
            >
              <Search className="w-4 h-4 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}

        {/* Desktop Actions */}
        <div className="hidden md:flex flex-1 items-center justify-end gap-3 lg:gap-4">
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2.5 rounded-xl border border-transparent transition-colors relative ${showNotifications ? 'bg-white text-[#2E7D32] border-[#2E7D32]' : 'bg-[#F9F9F6] text-[#757575] hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32]'}`}
            >
              <Bell className="w-5 h-5" />
              {notifications.some(n => !n.isRead) && (
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
