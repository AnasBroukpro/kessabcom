import React, { useState, useRef, useEffect } from 'react';
import { ViewType } from '../App';
import { Search, MapPin, Navigation, ArrowLeft, BadgeCheck, Scale, BookOpen, User, Star, ShieldCheck, Heart, Camera, CheckCircle, Clock, HeartHandshake, TrendingUp, Bell, LogOut, LayoutDashboard, ShoppingBag, PlusCircle, Settings, Users, List, ChevronDown, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { cityMapping, cityCoords, getDisplayCity } from '../constants/cityMapping';

import { useSettings } from '../hooks/useSettings';
import ContactSellerModal from '../components/ContactSellerModal';
import LoginRequiredModal from '../components/LoginRequiredModal';
import NewsTicker from '../components/NewsTicker';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
}

const moroccanCities = [
  "الدار البيضاء", "الرباط", "فاس", "مراكش", "أكادير", "طنجة", "مكناس", "وجدة", "القنيطرة", "تطوان", "خريبكة", "بني ملال", "الجديدة", "آسفي", "سطات", "برشيد", "الخميسات", "الناظور", "تازة", "المحمدية", "سلا", "تمارة", "العرائش", "كلميم", "بركان", "الفقيه بن صالح", "تاوريرت", "بوسكورة", "ورزازات", "العيون", "الداخلة", "تارودانت", "قلعة السراغنة", "سيدي سليمان", "سيدي قاسم", "تيزنيت", "طانطان", "شفشاون", "الحسيمة", "تيفلت", "وزان", "جرسيف", "المضيق", "الفنيدق", "سوق الأربعاء", "بوجدور", "تنغير", "زاكورة", "ميدلت", "اليوسفية", "بن جرير"
];

export default function Home({ onNavigate }: Props) {
  const { settings } = useSettings();
  const { user, profile, notifications, unreadCount, signOut } = useAuth();

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const [citySearch, setCitySearch] = useState('');
  const [radiusSearch, setRadiusSearch] = useState('10');
  const [favorites, setFavorites] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  


  const handleMarkNotifAsRead = async (id: string) => {
    if (user) await firestoreService.markNotificationAsRead(user.uid, id);
  };
  
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedSellerPhone, setSelectedSellerPhone] = useState<string | undefined>();
  const [selectedSellerWhatsapp, setSelectedSellerWhatsapp] = useState<string | undefined>();
  const [selectedListingId, setSelectedListingId] = useState<string | undefined>();

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const filteredCities = moroccanCities.filter(city => city.includes(citySearch));

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const unsub = firestoreService.subscribeToFavorites(user.uid, setFavorites);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const anns = await firestoreService.getAnnouncements();
      if (anns) setAnnouncements(anns);
    };
    fetchAnnouncements();
  }, []);

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

  const handleSearchNearMe = async () => {
    if (citySearch) {
      onNavigate('search-results', undefined, citySearch, radiusSearch);
      return;
    }

    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.state || data.address?.province || '';
          
          if (city) {
            onNavigate('search-results', undefined, city, radiusSearch);
          } else {
            onNavigate('search-results', undefined, undefined, radiusSearch);
          }
        } catch (error) {
          console.error("Error detecting city:", error);
          onNavigate('search-results', undefined, undefined, radiusSearch);
        } finally {
          setIsLocating(false);
        }
      }, (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);
        onNavigate('search-results', undefined, undefined, radiusSearch);
      });
    } else {
      setIsLocating(false);
      onNavigate('search-results', undefined, undefined, radiusSearch);
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
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-outline-variant/30">
        <div className="flex justify-between items-center px-6 h-16 max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <button onClick={() => onNavigate('home')} className="flex items-center group">
              <img 
                src="https://i.ibb.co/Psdn5FfW/logo-removebg-preview.png" 
                alt="كسابكوم" 
                className="h-8 md:h-10 w-auto object-contain transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </button>
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => onNavigate('home')} className="text-[#2E7D32] border-b-2 border-[#2E7D32] font-bold py-1 transition-colors">الرئيسية</button>
              <button onClick={() => onNavigate('search-results')} className="text-on-surface-variant hover:text-[#2E7D32] transition-colors font-medium">البحث</button>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 rounded-xl border border-transparent transition-colors relative ${showNotifications ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]' : 'bg-[#F9F9F6] text-[#757575] hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32]'}`}
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.some(n => !n.isRead) && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200 text-right">
                      <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between">
                        <h3 className="font-bold text-[#1A1A1A]">التنبيهات</h3>
                        {notifications.filter(n => !n.isRead).length > 0 && (
                          <span className="text-[10px] bg-[#2E7D32] text-white px-2 py-0.5 rounded-full">{notifications.filter(n => !n.isRead).length} جديد</span>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              className={`p-4 border-b border-outline-variant/5 transition-colors cursor-pointer ${!notif.isRead ? 'bg-[#E8F5E9]/30 hover:bg-[#E8F5E9]/50' : 'hover:bg-[#F9F9F6]'}`}
                              onClick={() => handleMarkNotifAsRead(notif.id)}
                            >
                              <p className="text-sm font-bold text-[#1A1A1A] mb-1">{notif.title}</p>
                              <p className="text-xs text-[#757575]">{notif.message}</p>
                              <p className="text-[10px] text-[#2E7D32] mt-2">
                                {notif.createdAt?.toDate?.()?.toLocaleDateString('ar-MA') || 'منذ وقت قصير'}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-on-surface-variant font-bold">لا توجد تنبيهات</div>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <button className="w-full p-3 text-sm font-bold text-[#2E7D32] border-t border-transparent hover:bg-white hover:border-[#2E7D32] transition-colors border-t border-outline-variant/10">
                          مشاهدة الكل
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile */}
                <div 
                  className="relative" 
                  ref={profileRef}
                  onMouseEnter={() => setShowProfileMenu(true)}
                  onMouseLeave={() => setShowProfileMenu(false)}
                >
                  <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F9F9F6] border border-outline-variant/10 hover:bg-white hover:border-[#2E7D32] transition-colors overflow-hidden shadow-sm">
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
              <button onClick={() => onNavigate('auth')} className="bg-[#2E7D32] text-white px-6 py-2.5 rounded-xl text-sm font-bold border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors shadow-md">
                دخول
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero & Search Section */}
        <section className="relative min-h-[650px] flex items-center justify-center overflow-hidden bg-[#FDFCF8] px-4 py-20">
          <div className="absolute inset-0 opacity-50">
            <img alt="مرعى في جبال الأطلس المغربية" className="w-full h-full object-cover" src="https://i.ibb.co/hxCgrSY7/generated-image.jpg" referrerPolicy="no-referrer" />
          </div>

          {/* Floating Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div 
              animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 right-[8%] w-32 h-32 md:w-56 md:h-56 opacity-40 md:opacity-80"
            >
              <img src="https://i.pinimg.com/474x/f1/c4/f3/f1c4f375f585d2c88ef5bf4b453cd01e.jpg" alt="Agneau" className="w-full h-full object-contain rounded-full border-4 border-white/50 shadow-2xl" referrerPolicy="no-referrer" />
            </motion.div>
            <motion.div 
              animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-1/4 left-[8%] w-32 h-32 md:w-56 md:h-56 opacity-40 md:opacity-80"
            >
              <img src="https://img12.360buyimg.com/n1/jfs/t1/1057/6/17739/86725/63e0f8fdFd3aacdb6/a637b488004ffee2.jpg" alt="Sheep" className="w-full h-full object-contain rounded-full border-4 border-white/50 shadow-2xl" referrerPolicy="no-referrer" />
            </motion.div>
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/3 left-[5%] w-16 h-16 md:w-32 md:h-32"
            >
              <div className="w-full h-full bg-[#2E7D32] rounded-full blur-3xl"></div>
            </motion.div>
          </div>

          <div className="relative z-10 max-w-4xl w-full text-center">
            {/* News Ticker moved to top on mobile */}
            <div className="md:hidden mb-6">
              <NewsTicker isMobile={true} />
            </div>

            <div className="mb-4 inline-flex items-center gap-2 bg-[#E8F5E9]/80 backdrop-blur-sm px-4 py-2 rounded-full border border-[#2E7D32]/20">
              <Clock className="w-4 h-4 text-[#2E7D32]" />
              <span className="text-xs font-bold text-[#1B5E20]">باقي لعيد الأضحى:</span>
            </div>
            <Countdown />
            <h1 className="text-4xl md:text-6xl font-black text-[#1A1A1A] mb-2 tracking-tight font-headline leading-tight">
              شوف الحولي <span className="text-[#2E7D32]">حداك</span> <br /> وزورو فالضيعة
            </h1>
            <p className="text-[#2E7D32] font-black tracking-[0.2em] text-sm md:text-base mb-8 uppercase font-headline">منكم وإليكم</p>
            <p className="text-[11px] md:text-lg text-[#4A4A4A] mb-12 max-w-2xl mx-auto font-medium leading-relaxed md:leading-normal">
              بلاما تضرب تمارة فالسواق، كسابكوم كايوريك الكسابة لي قراب ليك. قلب على المدينة، وشوف الكسيبة بعينيك فبلاصتها.
            </p>

            {/* Filter Box */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-outline-variant/20">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <div className="flex flex-col text-right gap-2 relative col-span-1 md:col-span-1" ref={suggestionsRef}>
                  <label className="text-[10px] md:text-xs font-bold text-[#4A4A4A] px-1 md:px-2">المدينة فين نتا؟</label>
                  <div className="relative">
                    <input 
                      className="w-full bg-[#F9F9F6] border border-transparent rounded-lg py-3 md:py-4 px-3 md:px-4 pl-8 md:pl-10 text-xs md:text-base focus:ring-2 focus:ring-[#2E7D32] focus:bg-white transition-all outline-none" 
                      placeholder="مثلا: سطات..." 
                      type="text" 
                      value={citySearch}
                      onChange={(e) => {
                        setCitySearch(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                    />
                    <MapPin className="absolute left-2 md:left-3 top-3 md:top-4 text-[#757575] w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  {showSuggestions && citySearch && filteredCities.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-outline-variant/20 max-h-48 overflow-y-auto z-50">
                      {filteredCities.map((city, idx) => (
                        <button
                          key={idx}
                          className="w-full text-right px-4 py-3 hover:bg-[#F9F9F6] text-[#1A1A1A] font-medium transition-colors border-b border-outline-variant/10 last:border-0"
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
                <div className="flex flex-col text-right gap-2 col-span-1 md:col-span-1">
                  <label className="text-[10px] md:text-xs font-bold text-[#4A4A4A] px-1 md:px-2">شحال بعيد عليك؟</label>
                  <div className="relative group">
                    <select 
                      value={radiusSearch}
                      onChange={(e) => setRadiusSearch(e.target.value)}
                      className="w-full bg-[#F9F9F6] border border-transparent rounded-lg py-3 md:py-4 px-3 md:px-4 pl-8 md:pl-10 text-xs md:text-base appearance-none focus:ring-2 focus:ring-[#2E7D32] focus:bg-white transition-all outline-none cursor-pointer font-bold text-[#1A1A1A]"
                    >
                      <option value="10">10 كلم</option>
                      <option value="20">20 كلم</option>
                      <option value="50">50 كلم</option>
                      <option value="all">كاع</option>
                    </select>
                    <Navigation className="absolute left-7 md:left-10 top-3 md:top-4 text-[#2E7D32] w-4 h-4 md:w-5 md:h-5 pointer-events-none group-hover:scale-110 transition-transform" />
                    <ChevronDown className="absolute left-2 md:left-3 top-3.5 md:top-5 text-[#757575] w-3 h-3 md:w-4 md:h-4 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-end col-span-2 md:col-span-1">
                  <button 
                    onClick={handleSearchNearMe} 
                    disabled={isLocating}
                    className="w-full bg-[#2E7D32] text-white py-3 md:py-4 px-6 rounded-lg font-bold flex items-center justify-center gap-2 border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors disabled:opacity-70 shadow-lg group"
                  >
                    {isLocating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 md:w-5 md:h-5 transition-transform" />
                    )}
                    <span className="text-sm md:text-base">{isLocating ? 'جاري...' : 'قلب حدايا'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
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
                  <p className="text-[#E8F5E9] text-lg mb-10 font-medium">كسابكوم كايفتح الباب للمحسنين لي بغاو يتبرعو بأضحية العيد، وللناس لي فوضعية صعبة وبغاو يستافدو من المبادرة.</p>
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
        <div className="max-w-7xl mx-auto px-6 py-10">
          {settings.banners?.banner1 ? (
            <div 
              onClick={() => settings.banners?.banner1Url && window.open(settings.banners.banner1Url, '_blank')}
              className={`relative rounded-3xl overflow-hidden shadow-md group cursor-pointer border border-outline-variant/10 ${settings.banners?.banner1Url ? 'hover:opacity-90 transition-opacity' : ''} ${settings.banners?.banner1Mobile ? 'aspect-square' : 'aspect-video'} md:aspect-[24/4.5]`}
            >
              <picture className="w-full h-full">
                {settings.banners?.banner1Mobile && (
                  <source media="(max-width: 767px)" srcSet={settings.banners.banner1Mobile} />
                )}
                <img 
                  src={settings.banners.banner1} 
                  alt="Ad Banner 1" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </picture>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-[#2E7D32] to-[#43A047] rounded-3xl p-8 text-white text-center shadow-md border border-outline-variant/10">
              <p className="opacity-90 font-medium">استفد من عروض خاصة بمناسبة عيد الأضحى</p>
            </div>
          )}
        </div>

        {/* Featured Listings Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex justify-between items-end mb-12">
            <div className="text-right">
              <span className="text-[#2E7D32] font-bold text-sm tracking-widest uppercase mb-2 block">كسيبة قريبة ليك</span>
              <h2 className="text-3xl font-black text-[#1A1A1A] font-headline">أحدث العروض فمنطقتك</h2>
            </div>
            <button onClick={() => onNavigate('buyer')} className="text-[#2E7D32] font-bold flex items-center gap-2 hover:gap-3 transition-all">
              <span>شوف كلشي</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {announcements.slice(0, 6).map((listing) => (
              <div key={listing.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={() => onNavigate('listing-details', listing.id)}>
                <div className="relative h-64 overflow-hidden">
                  <img alt={listing.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={listing.images?.[0] || 'https://i.ytimg.com/vi/RrkkshRUttw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD92lI4Kxe5liKSwWZaJuLAFopNeA'} referrerPolicy="no-referrer" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-[#1A1A1A] px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    كيبدا من {listing.minPrice || listing.price || '0'} درهم
                  </div>
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
                        
                        if (dist === 0 || dist >= 999) return city;
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
                          const isFavorite = favorites.some(f => f.listingId === listing.id);
                          firestoreService.toggleFavorite(listing.id, isFavorite);
                        } else {
                          setLoginModalOpen(true);
                        }
                      }}
                      className={`absolute top-4 left-4 p-2 bg-white/90 backdrop-blur rounded-full transition-colors shadow-sm ${
                        user && favorites.some(f => f.listingId === listing.id) ? 'text-red-500' : 'text-[#757575] hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${user && favorites.some(f => f.listingId === listing.id) ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[#2E7D32] font-bold">ضيعة {listing.sellerName || 'كساب'}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#757575]">الحجم:</span>
                        <div className="flex gap-1 text-[10px] font-bold text-[#4A4A4A]">
                          {listing.sizes?.slice(0, 3).map((size: string, idx: number) => (
                            <span key={idx} className="bg-[#F9F9F6] px-1.5 py-0.5 rounded border border-outline-variant/10">
                              {size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : size === 'large' ? 'كبير' : size === 'extra-large' ? 'كبير جداً' : size}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[#757575] text-sm font-bold">
                        <span>{listing.farmLocation || 'موقع الضيعة غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-0.5" dir="ltr">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < (listing.rating || 5) ? 'fill-[#FFC107] text-[#FFC107]' : 'text-[#D1D1D1]'}`} />
                        ))}
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
            ))}
          </div>
        </section>

        {/* Banner 2 */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          {settings.banners?.banner2 ? (
            <div 
              onClick={() => settings.banners?.banner2Url && window.open(settings.banners.banner2Url, '_blank')}
              className={`relative rounded-3xl overflow-hidden shadow-md group cursor-pointer border border-outline-variant/10 ${settings.banners?.banner2Url ? 'hover:opacity-90 transition-opacity' : ''} ${settings.banners?.banner2Mobile ? 'aspect-square' : 'aspect-video'} md:aspect-[24/4.5]`}
            >
              <picture className="w-full h-full">
                {settings.banners?.banner2Mobile && (
                  <source media="(max-width: 767px)" srcSet={settings.banners.banner2Mobile} />
                )}
                <img 
                  src={settings.banners.banner2} 
                  alt="Ad Banner 2" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </picture>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-[#FF9800] to-[#F57C00] rounded-3xl p-8 text-white text-center shadow-md border border-outline-variant/10">
              <p className="opacity-90 font-medium">اكتشف أفضل السلالات المغربية</p>
            </div>
          )}
        </div>

        {/* Sales Phases Section */}
        <section className="bg-white py-20 border-y border-outline-variant/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-[#2E7D32] font-bold text-sm tracking-widest uppercase mb-2 block">كيفاش تبيع؟</span>
              <h2 className="text-3xl md:text-4xl font-black text-[#1A1A1A] font-headline">مراحل البيع فـ كسابكوم</h2>
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
              <button onClick={() => onNavigate('auth')} className="bg-[#2E7D32] text-white px-10 py-4 rounded-xl font-bold border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors shadow-lg">
                حط إعلانك دابا
              </button>
            </div>
          </div>
        </section>

        {/* Banner 3 */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          {settings.banners?.banner3 ? (
            <div 
              onClick={() => settings.banners?.banner3Url && window.open(settings.banners.banner3Url, '_blank')}
              className={`relative rounded-3xl overflow-hidden shadow-md group cursor-pointer border border-outline-variant/10 ${settings.banners?.banner3Url ? 'hover:opacity-90 transition-opacity' : ''} ${settings.banners?.banner3Mobile ? 'aspect-square' : 'aspect-video'} md:aspect-[24/4.5]`}
            >
              <picture className="w-full h-full">
                {settings.banners?.banner3Mobile && (
                  <source media="(max-width: 767px)" srcSet={settings.banners.banner3Mobile} />
                )}
                <img 
                  src={settings.banners.banner3} 
                  alt="Ad Banner 3" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </picture>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-[#2196F3] to-[#1976D2] rounded-3xl p-8 text-white text-center shadow-md border border-outline-variant/10">
              <p className="opacity-90 font-medium">خدمات النقل متوفرة الآن</p>
            </div>
          )}
        </div>

        {/* Seller CTA Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="relative bg-[#2E7D32] overflow-hidden rounded-3xl p-12 md:p-20 flex flex-col md:flex-row items-center gap-12">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-20"></div>
            <div className="relative z-10 w-full md:w-1/2 text-right">
              <h2 className="text-4xl font-black text-white mb-6 font-headline leading-tight">عندك كسيبة وبغيتي <br /> تجيب الناس <span className="text-[#A5D6A7]">للضيعة؟</span></h2>
              <p className="text-[#E8F5E9] text-lg mb-10 max-w-md font-medium">كسابكوم كايسهل على المشتري يلقاك فخريطة المدينة. حط إعلانك وجيب الكليان حتى لدارك.</p>
              <button onClick={() => onNavigate('auth')} className="bg-white text-[#2E7D32] px-10 py-5 rounded-xl font-black text-lg flex items-center justify-center gap-3 border border-transparent hover:bg-transparent hover:text-white hover:border-white transition-colors shadow-xl w-fit ml-auto">
                <MapPin className="w-6 h-6" />
                <span>زيد الضيعة ديالك دابا</span>
              </button>
            </div>
            <div className="relative z-10 w-full md:w-1/2">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 text-right">
                  <MapPin className="text-white w-8 h-8 mb-3 ml-auto" />
                  <p className="text-white font-bold">موقع محدد</p>
                  <p className="text-white/70 text-xs">كايعرفو بلاصتك بالتدقيق</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 text-right">
                  <User className="text-white w-8 h-8 mb-3 ml-auto" />
                  <p className="text-white font-bold">زوار بزاف</p>
                  <p className="text-white/70 text-xs">كولشي كايقلب حداه</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 text-right">
                  <BadgeCheck className="text-white w-8 h-8 mb-3 ml-auto" />
                  <p className="text-white font-bold">بيع مباشر</p>
                  <p className="text-white/70 text-xs">بلا وسيط بلا سمسار</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 text-right">
                  <ShieldCheck className="text-white w-8 h-8 mb-3 ml-auto" />
                  <p className="text-white font-bold">ثقة الكليان</p>
                  <p className="text-white/70 text-xs">كايزورو الضيعة بعينيهم</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Articles Section */}
        {/* Removed */}
      </main>

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
    <div className="flex justify-center gap-2 md:gap-4 mb-8" dir="ltr">
      {[
        { label: 'أيام', value: timeLeft.days },
        { label: 'ساعات', value: timeLeft.hours },
        { label: 'دقائق', value: timeLeft.minutes },
        { label: 'ثواني', value: timeLeft.seconds }
      ].map((item, idx) => (
        <div key={idx} className="bg-white/90 backdrop-blur-md border border-[#2E7D32]/20 rounded-2xl p-3 md:p-4 min-w-[70px] md:min-w-[90px] shadow-xl">
          <div className="text-2xl md:text-3xl font-black text-[#2E7D32] leading-none mb-1">{item.value}</div>
          <div className="text-[10px] md:text-xs font-bold text-[#757575] uppercase tracking-wider">{item.label}</div>
        </div>
      ))}
    </div>
  );
};
