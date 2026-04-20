import React, { useState, useEffect } from 'react';
import { ViewType } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, where, limit, getDocs, deleteDoc, deleteField } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  LayoutDashboard, Users, Tag, Layers, Settings, Bell, User, Search, 
  CheckCircle2, Ban, Eye, TrendingUp, DollarSign, ShieldCheck, BadgeCheck,
  AlertCircle, ArrowUpRight, Filter, MoreVertical, Download, Upload, FileText, Database, X,
  Clock, ChevronLeft, LogOut, MapPin, Heart, HeartHandshake, Zap, Megaphone, Loader2
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import DashboardHeader from '../components/DashboardHeader';
import { cityMapping } from '../constants/cityMapping';
import { compressImage } from '../lib/imageUtils';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
  activeSubView?: string;
}

type AdminTab = 'overview' | 'stats' | 'users' | 'listings' | 'monetization' | 'ads' | 'settings' | 'stock-market' | 'donations' | 'reports';

interface StockMarketViewProps {
  settings: any;
  updateSettings: (s: any) => Promise<void>;
}

function StockMarketView({ settings, updateSettings }: StockMarketViewProps) {
  const [sardiPrice, setSardiPrice] = useState(settings.stockMarket?.sardi || 85);
  const [berguiPrice, setBerguiPrice] = useState(settings.stockMarket?.bergui || 75);
  const [importedPrice, setImportedPrice] = useState(settings.stockMarket?.imported || 65);
  const [goatsPrice, setGoatsPrice] = useState(settings.stockMarket?.goats || 70);
  const [breakingNews, setBreakingNews] = useState(settings.stockMarket?.breakingNews || '');
  const [newsItems, setNewsItems] = useState<string[]>(settings.stockMarket?.news || [
    "الفوج الأول من الخرفان الإسبانية دخل للسوق",
    "توقعات بارتفاع الطلب مع اقتراب العيد"
  ]);
  const [newNews, setNewNews] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpdate = async () => {
    try {
      await updateSettings({
        stockMarket: {
          sardi: Number(sardiPrice),
          bergui: Number(berguiPrice),
          imported: Number(importedPrice),
          goats: Number(goatsPrice),
          news: newsItems,
          breakingNews: breakingNews
        }
      });
      
      // Notify all users about price update (parallelly)
      const allUsers = await firestoreService.adminGetUsers();
      await Promise.all(allUsers.map((userData: any) => 
        firestoreService.createNotification(userData.id, {
          title: 'تحديث في بورصة الأغنام',
          message: 'تم تحديث أسعار البورصة وأخبار السوق، اطلع عليها الآن.',
          type: 'price_update',
          relatedId: 'price_catalog'
        }).catch(err => console.error(`Failed to notify user ${userData.id}:`, err))
      ));
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update prices:", error);
    }
  };

  const handleAddNews = () => {
    if (newNews.trim()) {
      setNewsItems([...newsItems, newNews.trim()]);
      setNewNews('');
    }
  };

  const handleRemoveNews = (index: number) => {
    setNewsItems(newsItems.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-on-surface font-headline">بورصة الأغنام (درهم/كلغ)</h2>
          <p className="text-sm text-on-surface-variant">تحكم في الأسعار المعروضة في كتالوج الأسعار للمستخدمين</p>
        </div>
        <button 
          onClick={handleUpdate}
          className="bg-primary text-on-primary px-6 py-2 rounded-xl font-bold transition-colors border border-transparent hover:bg-transparent hover:text-primary hover:border-primary shadow-lg"
        >
          تحديث الأسعار في الكتالوج
        </button>
      </div>

      {showSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl relative flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold">تم تحديث كتالوج الأسعار بنجاح!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Breaking News - Moroccan Darija */}
        <div className="col-span-full bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Megaphone className="w-6 h-6 text-primary animate-pulse" />
            <h3 className="text-lg font-black text-on-surface">خبر عاجل (Darija) - شريط متحرك</h3>
          </div>
          <div className="space-y-4">
            <textarea 
              value={breakingNews}
              onChange={(e) => setBreakingNews(e.target.value)}
              placeholder="مثال: خبر عاجل.. الثمن نزل اليوم في السوق، دخلوا شوفو العروض الجديدة..."
              className="w-full bg-white border border-outline-variant/30 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary transition-all min-h-[80px]"
            />
            <p className="text-[10px] text-on-surface-variant font-medium">سيظهر هذا النص كشريط متحرك في أعلى الصفحة الرئيسية لجذب الانتباه.</p>
          </div>
        </div>

        {/* Sardi */}
        <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-black text-on-surface">سردي</span>
            <TrendingUp className="text-green-600 w-5 h-5" />
          </div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-primary">{sardiPrice}</span>
              <span className="text-xs font-bold text-on-surface-variant">درهم</span>
            </div>
          </div>
          <div className="space-y-2">
            <input 
              type="range" 
              min="50" 
              max="150" 
              value={sardiPrice} 
              onChange={(e) => setSardiPrice(Number(e.target.value))}
              className="w-full accent-primary h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="mt-4">
            <input 
              type="number" 
              value={sardiPrice}
              onChange={(e) => setSardiPrice(Number(e.target.value))}
              className="w-full bg-surface-container-high border-none rounded-lg px-3 py-2 text-sm font-bold text-center focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Bergui */}
        <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-black text-on-surface">بركي</span>
            <TrendingUp className="text-orange-600 w-5 h-5" />
          </div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-primary">{berguiPrice}</span>
              <span className="text-xs font-bold text-on-surface-variant">درهم</span>
            </div>
          </div>
          <div className="space-y-2">
            <input 
              type="range" 
              min="50" 
              max="150" 
              value={berguiPrice} 
              onChange={(e) => setBerguiPrice(Number(e.target.value))}
              className="w-full accent-primary h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="mt-4">
            <input 
              type="number" 
              value={berguiPrice}
              onChange={(e) => setBerguiPrice(Number(e.target.value))}
              className="w-full bg-surface-container-high border-none rounded-lg px-3 py-2 text-sm font-bold text-center focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Imported */}
        <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-black text-on-surface">مستورد</span>
            <TrendingUp className="text-blue-600 w-5 h-5" />
          </div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-primary">{importedPrice}</span>
              <span className="text-xs font-bold text-on-surface-variant">درهم</span>
            </div>
          </div>
          <div className="space-y-2">
            <input 
              type="range" 
              min="40" 
              max="120" 
              value={importedPrice} 
              onChange={(e) => setImportedPrice(Number(e.target.value))}
              className="w-full accent-primary h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="mt-4">
            <input 
              type="number" 
              value={importedPrice}
              onChange={(e) => setImportedPrice(Number(e.target.value))}
              className="w-full bg-surface-container-high border-none rounded-lg px-3 py-2 text-sm font-bold text-center focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Goats */}
        <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-black text-on-surface">الماعز</span>
            <TrendingUp className="text-purple-600 w-5 h-5" />
          </div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-primary">{goatsPrice}</span>
              <span className="text-xs font-bold text-on-surface-variant">درهم</span>
            </div>
          </div>
          <div className="space-y-2">
            <input 
              type="range" 
              min="40" 
              max="120" 
              value={goatsPrice} 
              onChange={(e) => setGoatsPrice(Number(e.target.value))}
              className="w-full accent-primary h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="mt-4">
            <input 
              type="number" 
              value={goatsPrice}
              onChange={(e) => setGoatsPrice(Number(e.target.value))}
              className="w-full bg-surface-container-high border-none rounded-lg px-3 py-2 text-sm font-bold text-center focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm mt-8">
        <h3 className="text-xl font-black text-on-surface mb-4">إدارة مستجدات السوق (خبار السوق)</h3>
        <p className="text-sm text-on-surface-variant mb-6">هذه الأخبار تظهر للمستخدمين في الشريط الإخباري بجانب أسعار السلالات.</p>
        
        <div className="flex gap-4 mb-6">
          <input 
            type="text" 
            value={newNews}
            onChange={(e) => setNewNews(e.target.value)}
            placeholder="أضف خبراً جديداً (مثل: الإقبال يتزايد على السردي...)"
            className="flex-1 bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAddNews()}
          />
          <button 
            onClick={handleAddNews}
            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            إضافة
          </button>
        </div>

        <div className="space-y-3">
          {newsItems.map((news, index) => (
            <div key={index} className="flex justify-between items-center bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
              <span className="font-medium text-on-surface">{news}</span>
              <button 
                onClick={() => handleRemoveNews(index)}
                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
          {newsItems.length === 0 && (
            <div className="text-center py-6 text-on-surface-variant">
              لا توجد أخبار حالياً، أضف خبراً جديداً أعلاه.
            </div>
          )}
        </div>
      </div>

      <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-on-surface">نصيحة للمسؤول</h4>
          <p className="text-xs text-on-surface-variant">تأكد من تحديث الأسعار يومياً بناءً على تقارير الأسواق الأسبوعية لضمان مصداقية المنصة.</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ onNavigate, activeSubView }: Props) {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [uploadingBanner, setUploadingBanner] = useState<string | null>(null);
  const [platformStats, setPlatformStats] = useState({ totalUsers: 0, totalAds: 0, activeAds: 0, totalRequests: 0 });
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    if (activeTab === 'stats') {
      firestoreService.getPlatformStats().then(setPlatformStats);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeSubView) {
      setActiveTab(activeSubView as AdminTab);
    }
  }, [activeSubView]);
  const [userSubTab, setUserSubTab] = useState<'sellers' | 'buyers'>('sellers');
  const [overviewTimeFilter, setOverviewTimeFilter] = useState<'today' | 'week' | 'month'>('month');
  const [donationSubTab, setDonationSubTab] = useState<'donations' | 'benefits'>('donations');
  const [monetizationSubTab, setMonetizationSubTab] = useState<'subscriptions' | 'boosts'>('subscriptions');
  const [settingsTab, setSettingsTab] = useState<'general' | 'logs' | 'security' | 'import-export' | 'backup'>('general');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [listingFilter, setListingFilter] = useState<'all' | 'reported' | 'promoted' | 'inactive'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'deactivated' | 'pending' | 'blocked'>('all');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [rejectMotif, setRejectMotif] = useState('');
  const [openUserMenuId, setOpenUserMenuId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const { settings, updateSettings } = useSettings();

  useEffect(() => {
    if (!user) return;
    const unsub = firestoreService.subscribeToUserNotifications(user.uid, setNotifications);
    return () => unsub();
  }, [user]);

  const filteredAnnouncements = React.useMemo(() => {
    return announcements.filter(listing => {
      if (listingFilter === 'all') return true;
      if (listingFilter === 'reported') {
        return reports.some(r => r.announcementId === listing.id);
      }
      if (listingFilter === 'promoted') return listing.boosted === true;
      if (listingFilter === 'inactive') return listing.status === 'inactive' || listing.status === 'rejected' || listing.status === 'deactivated';
      return true;
    });
  }, [announcements, listingFilter, reports]);

  const filteredUsers = React.useMemo(() => {
    return users.filter(u => {
      const matchesRole = userSubTab === 'sellers' ? u.role === 'seller' : u.role === 'buyer';
      const matchesStatus = userStatusFilter === 'all' || (u.status || 'active') === userStatusFilter;
      const searchStr = userSearch.toLowerCase();
      const matchesSearch = 
        (u.displayName || u.name || '').toLowerCase().includes(searchStr) ||
        (u.email || '').toLowerCase().includes(searchStr) ||
        (u.phoneNumber || '').includes(searchStr) ||
        (u.farmName || '').toLowerCase().includes(searchStr);
      
      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [users, userSubTab, userStatusFilter, userSearch]);

  const stats = React.useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const filterDate = overviewTimeFilter === 'today' ? startOfToday : 
                       overviewTimeFilter === 'week' ? startOfWeek : 
                       startOfMonth;

    // Filter data based on time period for specific metrics
    const filteredUsersInPeriod = users.filter(u => {
      if (!u.createdAt) return false;
      const d = u.createdAt.toDate?.() || new Date(u.createdAt);
      return d >= filterDate;
    });

    const filteredAnnouncementsInPeriod = announcements.filter(a => {
      if (!a.createdAt) return false;
      const d = a.createdAt.toDate?.() || new Date(a.createdAt);
      return d >= filterDate;
    });

    const filteredReportsInPeriod = reports.filter(r => {
      if (!r.createdAt) return false;
      const d = r.createdAt.toDate?.() || new Date(r.createdAt);
      return d >= filterDate;
    });

    // Total revenue in this period (simulated from plans of new users joining in this period)
    const periodRevenue = filteredUsersInPeriod.reduce((acc, user) => {
      if (user.plan === 'احترافي') return acc + (settings.monetization?.proMonthly || 199);
      if (user.plan === 'شركات') return acc + (settings.monetization?.farmMonthly || 499);
      return acc;
    }, 0);

    // Global stats (not period specific)
    const totalActiveSellers = users.filter(u => u.role === 'seller' && (u.status || 'active') === 'active').length;
    const verifiedSellers = users.filter(u => u.role === 'seller' && u.isVerified).length;
    const verificationRate = totalActiveSellers > 0 ? Math.round((verifiedSellers / totalActiveSellers) * 100) : 0;

    return {
      totalSales: `${periodRevenue.toLocaleString()} درهم`,
      activeListings: filteredAnnouncementsInPeriod.length,
      newSellers: filteredUsersInPeriod.filter(u => u.role === 'seller').length,
      verificationRate: `${verificationRate}% من الكسابة تم التحقق منهم`,
      pendingReports: filteredReportsInPeriod.filter(r => r.status === 'pending').length
    };
  }, [users, announcements, reports, settings.monetization, overviewTimeFilter]);

  const fetchAdminData = React.useCallback(async () => {
    try {
      const [usersData, listingsData, reportsData, donationsData, logsData] = await Promise.all([
        firestoreService.adminGetUsers(),
        firestoreService.adminGetListings(),
        firestoreService.adminGetReports(),
        firestoreService.adminGetDonations(),
        firestoreService.adminGetLogs()
      ]);
      setUsers(usersData);
      setAnnouncements(listingsData);
      setReports(reportsData);
      setDonations(donationsData);
      setLogs(logsData);
    } catch (error: any) {
      if (error.message?.includes('Quota')) setQuotaExceeded(true);
      console.error("Fetch admin data error:", error);
    }
  }, []);

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    fetchAdminData();
    // Re-fetch every 30 seconds for pseudo-realtime if desired, or just once.
    const interval = setInterval(fetchAdminData, 30000);
    return () => clearInterval(interval);
  }, [profile?.role, fetchAdminData]);

  const handleBoost = async (id: string) => {
    if (window.confirm("هل أنت متأكد من وضع الإعلان في البورصة (لمدة 7 أيام)؟")) {
      try {
        await firestoreService.boostAnnouncement(id);
      } catch (error) {
        console.error("Failed to boost listing:", error);
      }
    }
  };

  const handleApproveListing = async (id: string) => {
    try {
      await firestoreService.adminApproveListing(id);
      fetchAdminData();
    } catch (error) {
      console.error("Failed to approve listing:", error);
    }
  };

  const handleToggleListing = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await firestoreService.adminUpdateListingStatus(listingId, newStatus);
      fetchAdminData();
    } catch (error) {
      console.error("Failed to toggle listing status:", error);
    }
  };

  const handleRejectListing = async () => {
    if (!selectedListingId) return;
    try {
      await firestoreService.adminUpdateListingStatus(selectedListingId, 'rejected', rejectMotif);
      setShowRejectModal(false);
      setRejectMotif('');
      setSelectedListingId(null);
      fetchAdminData();
    } catch (error) {
      console.error("Failed to reject listing:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      try {
        await firestoreService.adminDeleteUser(userId);
        fetchAdminData();
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  const handleDeleteReport = async (reportId: string, announcementId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا التبليغ والإعلان؟")) {
      try {
        await firestoreService.adminDeleteReport(reportId);
        await firestoreService.adminDeleteListing(announcementId);
        fetchAdminData();
      } catch (error) {
        console.error("Failed to delete report/announcement:", error);
      }
    }
  };

  const [platformHealth, setPlatformHealth] = useState({
    serverPressure: 24,
    storageConsumption: 49
  });

  useEffect(() => {
    // Simulate dynamic platform health
    const interval = setInterval(() => {
      setPlatformHealth(prev => ({
        serverPressure: Math.min(100, Math.max(10, prev.serverPressure + (Math.random() * 10 - 5))),
        storageConsumption: Math.min(100, Math.max(10, prev.storageConsumption + (Math.random() * 2 - 1)))
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetStatus, setResetStatus] = useState<'success' | 'error' | null>(null);
  const [showImportInstructions, setShowImportInstructions] = useState(false);
  const [importData, setImportData] = useState<any[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleResetSystem = async () => {
    if (!user) return;
    setIsResetting(true);
    try {
      await firestoreService.adminSystemReset();
      setResetStatus('success');
      setShowResetConfirm(false);
      fetchAdminData();
      setTimeout(() => setResetStatus(null), 5000);
    } catch (error) {
      console.error("Reset failed:", error);
      setResetStatus('error');
      setTimeout(() => setResetStatus(null), 5000);
    } finally {
      setIsResetting(false);
    }
  };

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6" dir="rtl">
      {[
        { title: 'إجمالي المستخدمين', value: platformStats.totalUsers, color: 'text-primary' },
        { title: 'إجمالي الإعلانات', value: platformStats.totalAds, color: 'text-primary' },
        { title: 'إعلانات نشطة', value: platformStats.activeAds, color: 'text-green-600' },
        { title: 'طلبات العرض', value: platformStats.totalRequests, color: 'text-purple-600' },
      ].map((s, i) => (
        <div key={i} className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
          <h4 className="text-on-surface-variant text-sm">{s.title}</h4>
          <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );

  const getTitle = () => {
    switch (activeTab) {
      case 'overview': return 'نظرة عامة';
      case 'stats': return 'إحصائيات المنصة';
      case 'users': return 'إدارة المستخدمين';
      case 'listings': return 'إدارة الإعلانات';
      case 'monetization': return 'الأرباح والاشتراكات';
      case 'ads': return 'إدارة الإعلانات الترويجية';
      case 'settings': return 'إعدادات النظام';
      case 'stock-market': return 'بورصة الأغنام';
      case 'donations': return 'تبرعات و الاستفادات';
      case 'reports': return 'التبليغات';
      default: return 'لوحة التحكم';
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onNavigate('home');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };



const renderDonations = () => {
  const filtered = donations.filter(r => r.type === (donationSubTab === 'donations' ? 'donor' : 'benefit'));

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-on-surface font-headline">تبرعات و الاستفادات</h2>
        <div className="flex bg-surface-container-high p-1 rounded-xl">
          <button 
            onClick={() => setDonationSubTab('donations')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors border ${donationSubTab === 'donations' ? 'bg-white text-primary border-primary shadow-sm' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
          >
            التبرعات
          </button>
          <button 
            onClick={() => setDonationSubTab('benefits')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors border ${donationSubTab === 'benefits' ? 'bg-white text-primary border-primary shadow-sm' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
          >
            طلبات الاستفادة
          </button>
        </div>
      </div>
      
      <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant text-sm font-bold">
              <th className="p-4">الاسم / الجهة</th>
              <th className="p-4">المدينة</th>
              <th className="p-4">رقم الهاتف</th>
              {donationSubTab === 'donations' && <th className="p-4">عدد الأكباش</th>}
              <th className="p-4">التاريخ</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {filtered.map((req) => (
              <tr key={req.id} className="hover:bg-surface-container-lowest transition-colors">
                <td className="p-4 font-bold">{req.name}</td>
                <td className="p-4">
                  {(() => {
                    const rawCity = (req.city || 'غير محدد').split(' ')[0];
                    return (rawCity && cityMapping[rawCity.toLowerCase()]) || rawCity;
                  })()}
                </td>
                <td className="p-4 font-mono">{req.phone}</td>
                {donationSubTab === 'donations' && <td className="p-4 font-bold text-primary">{req.sheepCount}</td>}
                <td className="p-4 text-sm">{req.createdAt?.toDate?.()?.toLocaleDateString('ar-MA') || 'اليوم'}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {req.status === 'approved' ? 'تمت الموافقة' : 'قيد الانتظار'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button className="p-2 text-primary hover:bg-transparent hover:text-primary rounded-lg transition-colors border border-transparent hover:border-primary"><CheckCircle2 className="w-4 h-4" /></button>
                    <button className="p-2 text-error hover:bg-transparent hover:text-error rounded-lg transition-colors border border-transparent hover:border-error"><Ban className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <HeartHandshake className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
            <p className="text-on-surface-variant font-bold">لا توجد طلبات حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
};

  const renderReports = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-on-surface font-headline">تبليغات المستخدمين</h2>
          <p className="text-sm text-on-surface-variant">إعلانات تم التبليغ عنها لمخالفة القوانين</p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-surface-container-lowest border-b border-outline-variant/20">
            <tr className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              <th className="p-4">رقم الإعلان</th>
              <th className="p-4">المبلغ</th>
              <th className="p-4">سبب التبليغ</th>
              <th className="p-4">التاريخ</th>
              <th className="p-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-surface-container-lowest transition-colors">
                <td className="p-4 font-mono text-xs">{report.announcementId}</td>
                <td className="p-4 font-bold">{report.reporterId === 'anonymous' ? 'زائر' : 'مستخدم'}</td>
                <td className="p-4">
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                    {report.reason}
                  </span>
                </td>
                <td className="p-4 text-xs">{report.createdAt?.toDate?.()?.toLocaleString('ar-MA') || 'اليوم'}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onNavigate('listing-details', report.announcementId)}
                      className="p-2 text-primary hover:bg-transparent hover:text-primary rounded-lg transition-colors border border-transparent hover:border-primary"
                      title="عرض الإعلان"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteReport(report.id, report.announcementId)}
                      className="p-2 text-error hover:bg-transparent hover:text-error rounded-lg transition-colors border border-transparent hover:border-error"
                      title="حذف الإعلان"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-on-surface-variant font-medium">
                  لا توجد تبليغات حالياً
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-on-surface font-headline">نظرة عامة على المنصة</h2>
          <p className="text-sm text-on-surface-variant font-medium">تتبع أداء المنصة والعمليات اليومية بشكل مباشر</p>
        </div>
        <div className="flex bg-surface-container-high p-1 rounded-2xl shadow-sm border border-outline-variant/10">
          <button 
            onClick={() => setOverviewTimeFilter('today')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${overviewTimeFilter === 'today' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-primary'}`}
          >
            اليوم
          </button>
          <button 
            onClick={() => setOverviewTimeFilter('week')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${overviewTimeFilter === 'week' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-primary'}`}
          >
            هذا الأسبوع
          </button>
          <button 
            onClick={() => setOverviewTimeFilter('month')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${overviewTimeFilter === 'month' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-primary'}`}
          >
            هذا الشهر
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: overviewTimeFilter === 'today' ? 'أرباح اليوم' : overviewTimeFilter === 'week' ? 'أرباح الأسبوع' : 'أرباح الشهر', 
            value: stats.totalSales, icon: DollarSign, color: 'text-green-600', trend: '+15%', sub: 'من الاشتراكات' 
          },
          { 
            label: overviewTimeFilter === 'today' ? 'كسابة جدد اليوم' : overviewTimeFilter === 'week' ? 'كسابة جدد هذا الأسبوع' : 'كسابة جدد هذا الشهر', 
            value: stats.newSellers.toLocaleString(), icon: Users, color: 'text-blue-600', trend: '', sub: stats.verificationRate 
          },
          { 
            label: overviewTimeFilter === 'today' ? 'إعلانات اليوم' : overviewTimeFilter === 'week' ? 'إعلانات الأسبوع' : 'إعلانات الشهر', 
            value: stats.activeListings.toLocaleString(), icon: Tag, color: 'text-purple-600', trend: '+12%', sub: 'إعلانات حية' 
          },
          { 
            label: overviewTimeFilter === 'today' ? 'تبليغات اليوم' : overviewTimeFilter === 'week' ? 'تبليغات الأسبوع' : 'تبليغات الشهر', 
            value: stats.pendingReports.toLocaleString(), icon: AlertCircle, color: 'text-error', trend: stats.pendingReports > 0 ? `+${stats.pendingReports}` : '0', sub: 'تحتاج مراجعة' }
        ].map((stat, i) => (
          <div key={i} className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-surface-container-high ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant font-medium mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-on-surface mb-1">{stat.value}</h3>
            <p className="text-[10px] text-on-surface-variant/60 font-medium">{stat.sub}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-lowest">
            <h3 className="font-bold text-on-surface">النشاط الأخير</h3>
            <button className="text-primary text-sm font-bold px-2 py-1 rounded-lg border border-transparent hover:border-primary transition-colors">عرض الكل</button>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {logs.slice(0, 5).map((activity, i) => (
              <div key={activity.id || i} className="p-4 flex items-center gap-4 hover:bg-surface-container-lowest transition-colors">
                <div className={`w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center ${activity.level === 'خطأ' ? 'text-error' : 'text-primary'}`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-on-surface">
                    <span className="font-bold">{activity.user || 'النظام'}</span> {activity.msg || activity.message || activity.action}
                  </p>
                  <p className="text-xs text-on-surface-variant">{activity.createdAt?.toDate?.()?.toLocaleString('ar-MA') || 'اليوم'}</p>
                </div>
                <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="p-12 text-center">
                <Clock className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
                <p className="text-on-surface-variant font-bold">لا توجد نشاطات حالياً</p>
              </div>
            )}
          </div>
        </div>

        {/* Platform Health & Quota */}
        <div className="space-y-6">
          <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-on-surface">صحة المنصة</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-on-surface-variant">ضغط السيرفر</span>
                  <span className="text-green-600">{Math.round(platformHealth.serverPressure)}%</span>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${platformHealth.serverPressure}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-on-surface-variant">استهلاك التخزين</span>
                  <span className="text-orange-600">{Math.round(platformHealth.storageConsumption)}%</span>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${platformHealth.storageConsumption}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Firebase Detailed Quota Indicator */}
          <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6 space-y-6 border-t-4 border-t-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5">
              <Database className="w-12 h-12" />
            </div>
            <div className="flex justify-between items-center">
              <h3 className="font-black text-on-surface flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                مراقبة استهلاك Firebase
              </h3>
              <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-lg">LIVE</span>
            </div>
            
            <div className="space-y-6">
              {/* Write Ops */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black">
                  <div className="flex items-center gap-2">
                    <span className="text-on-surface-variant uppercase tracking-tighter">عمليات الكتابة (Writes)</span>
                    {quotaExceeded && <span className="bg-error/10 text-error text-[8px] px-1.5 py-0.5 rounded animate-pulse">تجاوز الحد</span>}
                  </div>
                  <span className="text-primary">{quotaExceeded ? '100' : '85'}%</span>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/10">
                  <div className="h-full bg-gradient-to-l from-primary to-primary-container transition-all duration-1000 shadow-sm" style={{ width: `${quotaExceeded ? 100 : 85}%` }}></div>
                </div>
                <div className="flex justify-between text-[9px] font-black text-on-surface-variant/60">
                  <span>الحد اليومي: 20,000</span>
                  <span>المستهلك: {quotaExceeded ? '20,000+' : '17,000'}</span>
                </div>
              </div>

              {/* Read Ops */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black text-blue-600">
                  <span className="text-on-surface-variant uppercase tracking-tighter">عمليات القراءة (Reads)</span>
                  <span>42%</span>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/10">
                  <div className="h-full bg-gradient-to-l from-blue-600 to-blue-400 transition-all duration-1000 shadow-sm" style={{ width: `42%` }}></div>
                </div>
                <div className="flex justify-between text-[9px] font-black text-on-surface-variant/60">
                  <span>الحد اليومي: 50,000</span>
                  <span>المستهلك: 21,000</span>
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/10">
                <div className="flex items-center gap-3 text-sm text-on-surface-variant font-bold">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span>آخر نسخة احتياطية: منذ 4 ساعات</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMonetization = () => (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-on-surface font-headline">الأرباح والاشتراكات</h2>
        <div className="flex bg-surface-container-high p-1 rounded-xl">
          <button 
            onClick={() => setMonetizationSubTab('subscriptions')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors border ${monetizationSubTab === 'subscriptions' ? 'bg-white text-primary border-primary shadow-sm' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
          >
            الاشتراكات
          </button>
          <button 
            onClick={() => setMonetizationSubTab('boosts')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors border ${monetizationSubTab === 'boosts' ? 'bg-white text-primary border-primary shadow-sm' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
          >
            خطط الترويج
          </button>
        </div>
      </div>

      {monetizationSubTab === 'subscriptions' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'الباقة المجانية', users: users.filter(u => !u.plan || u.plan === 'مجاني').length, revenue: '0', color: 'bg-surface-variant' },
              { name: 'الباقة الاحترافية', users: users.filter(u => u.plan === 'احترافي').length, revenue: (users.filter(u => u.plan === 'احترافي').length * (settings.monetization?.proMonthly || 199)).toLocaleString(), color: 'bg-blue-100' },
              { name: 'باقة الضيعة', users: users.filter(u => u.plan === 'شركات').length, revenue: (users.filter(u => u.plan === 'شركات').length * (settings.monetization?.farmMonthly || 499)).toLocaleString(), color: 'bg-purple-100' },
            ].map((plan, i) => (
              <div key={i} className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
                <div className={`w-full h-2 ${plan.color} rounded-full mb-4`}></div>
                <h3 className="font-bold text-on-surface mb-1">{plan.name}</h3>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase">المستخدمين</p>
                    <p className="text-xl font-black text-on-surface">{plan.users}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase">الأرباح</p>
                    <p className="text-xl font-black text-primary">{plan.revenue} درهم</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
            <h3 className="font-bold text-on-surface flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              إعدادات أسعار الاشتراكات
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl">
                <span className="text-sm font-medium">كساب محترف (شهري)</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={settings.monetization?.proMonthly || 199} 
                    onChange={(e) => updateSettings({ monetization: { ...settings.monetization, proMonthly: Number(e.target.value) } })}
                    className="w-16 bg-transparent border-b border-blue-600 text-center font-bold outline-none" 
                  />
                  <span className="text-xs">درهم</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl">
                <span className="text-sm font-medium">باقة الضيعة (شهري)</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={settings.monetization?.farmMonthly || 499} 
                    onChange={(e) => updateSettings({ monetization: { ...settings.monetization, farmMonthly: Number(e.target.value) } })}
                    className="w-16 bg-transparent border-b border-blue-600 text-center font-bold outline-none" 
                  />
                  <span className="text-xs">درهم</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
            <h3 className="font-bold text-on-surface flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              إعدادات أسعار ترويج الإعلانات
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl">
                <span className="text-sm font-medium">ترويج عادي (3 أيام)</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={settings.monetization?.boost3Days || 49} 
                    onChange={(e) => updateSettings({ monetization: { ...settings.monetization, boost3Days: Number(e.target.value) } })}
                    className="w-16 bg-transparent border-b border-primary text-center font-bold outline-none" 
                  />
                  <span className="text-xs">درهم</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl">
                <span className="text-sm font-medium">ترويج ذهبي (7 أيام)</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={settings.monetization?.boost7Days || 99} 
                    onChange={(e) => updateSettings({ monetization: { ...settings.monetization, boost7Days: Number(e.target.value) } })}
                    className="w-16 bg-transparent border-b border-primary text-center font-bold outline-none" 
                  />
                  <span className="text-xs">درهم</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderVerifications = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-on-surface font-headline">التحقق من الكسابة</h2>
      <div className="grid grid-cols-1 gap-4">
        {[
          { name: 'محمد س.', city: 'سطات', docs: ['وجه البطاقة الوطنية', 'ظهر البطاقة الوطنية', 'رخصة الضيعة'], time: 'منذ ساعة' },
          { name: 'حسن ب.', city: 'برشيد', docs: ['وجه البطاقة الوطنية', 'ظهر البطاقة الوطنية'], time: 'منذ 3 ساعات' },
        ].map((req, i) => (
          <div key={i} className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                {req.name[0]}
              </div>
              <div>
                <h3 className="font-bold text-on-surface">{req.name}</h3>
                <p className="text-xs text-on-surface-variant">{req.city} • {req.time}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {req.docs.map((doc, j) => (
                <div key={j} className="px-3 py-1 bg-surface-container-high rounded-lg text-[10px] font-bold text-on-surface-variant flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {doc}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-transparent hover:text-green-600 border border-transparent hover:border-green-600 transition-colors">قبول</button>
              <button className="px-4 py-2 bg-red-50 text-red-700 rounded-xl text-sm font-bold hover:bg-transparent hover:text-red-700 border border-transparent hover:border-red-700 transition-colors">رفض</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-on-surface font-headline">إدارة المستخدمين</h2>
            <p className="text-sm text-on-surface-variant font-medium">إدارة حسابات {userSubTab === 'sellers' ? 'الكسابة' : 'المشترين'} والتحقق من نشاطهم</p>
          </div>
          <div className="flex bg-surface-container-high p-1 rounded-2xl shadow-sm">
            <button 
              onClick={() => { setUserSubTab('sellers'); setUserStatusFilter('all'); }}
              className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all border ${userSubTab === 'sellers' ? 'bg-primary text-on-primary border-primary shadow-md transform scale-105' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
            >
              الكسابة
            </button>
            <button 
              onClick={() => { setUserSubTab('buyers'); setUserStatusFilter('all'); }}
              className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all border ${userSubTab === 'buyers' ? 'bg-primary text-on-primary border-primary shadow-md transform scale-105' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
            >
              المشترين
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-surface p-4 rounded-3xl border border-outline-variant/20 shadow-sm">
          <div className="lg:col-span-2 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
            <input 
              type="text" 
              placeholder="البحث بالاسم، البريد الإلكتروني أو رقم الهاتف..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl py-3 pr-12 pl-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
            <select 
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value as any)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl py-3 pr-10 pl-4 text-sm font-black outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="pending">في انتظار المراجعة</option>
              <option value="deactivated">معطل</option>
              <option value="blocked">محظور</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-surface-container-high text-on-surface-variant py-3 rounded-2xl text-xs font-black hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20 flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              تصدير القائمة
            </button>
          </div>
        </div>

        <div className="bg-surface rounded-3xl border border-outline-variant/30 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-right border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-surface-container-low/50 text-on-surface-variant text-[10px] uppercase tracking-wider border-b border-outline-variant/20">
                  <th className="p-5 font-black">المستخدم</th>
                  <th className="p-5 font-black">المعلومات</th>
                  <th className="p-5 font-black">{userSubTab === 'sellers' ? 'النشاط' : 'المشتريات'}</th>
                  <th className="p-5 font-black">الحالة</th>
                  <th className="p-5 font-black">التحقق</th>
                  <th className="p-5 font-black text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredUsers.map((user, i) => (
                  <tr key={user.id || i} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-surface-container-high border-2 border-white shadow-sm flex items-center justify-center font-black text-primary overflow-hidden shrink-0 group-hover:scale-110 transition-transform">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-xl">{user.displayName?.[0] || user.name?.[0] || 'U'}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-on-surface text-base mb-0.5">{user.displayName || user.name}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${user.plan === 'احترافي' ? 'bg-yellow-100 text-yellow-700' : user.plan === 'شركات' ? 'bg-blue-100 text-blue-700' : 'bg-surface-container-high text-on-surface-variant'}`}>
                              {user.plan || 'حساب عادي'}
                            </span>
                            {user.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-bold">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {(() => {
                              const rawCity = (user.location || user.city || 'غير محدد').split(' ')[0];
                              return (rawCity && cityMapping[rawCity.toLowerCase()]) || rawCity;
                            })()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/70 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>انضم {user.createdAt?.toDate?.()?.toLocaleDateString() || 'قديماً'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-black text-on-surface">
                          <Tag className="w-3.5 h-3.5 text-primary" />
                          <span>{user.herdsCount || 0} إعلان</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{user.visitsCount || 0} مشاهدة</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <select 
                        value={user.status || 'active'}
                        onChange={async (e) => {
                          await updateDoc(doc(db, 'users', user.id), { status: e.target.value });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm outline-none cursor-pointer border-2 transition-all ${
                          (user.status || 'active') === 'active' ? 'bg-green-50 text-green-700 border-green-200 focus:border-green-500' :
                          user.status === 'blocked' ? 'bg-red-50 text-red-700 border-red-200 focus:border-red-500' :
                          'bg-surface-container-high text-on-surface-variant border-outline-variant/20'
                        }`}
                      >
                        <option value="active">نشط</option>
                        <option value="deactivated">معطل</option>
                        <option value="pending">قيد المراجعة</option>
                        <option value="blocked">محظور</option>
                      </select>
                    </td>
                    <td className="p-5">
                      <button 
                        onClick={async () => {
                          await firestoreService.adminVerifyUser(user.id);
                          fetchAdminData();
                        }}
                        className={`group px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 border-2 ${
                          user.isVerified ? 'bg-primary/5 text-primary border-primary/20' : 'bg-surface-container-high text-on-surface-variant/40 border-outline-variant/10'
                        }`}
                      >
                        <ShieldCheck className={`w-4 h-4 transition-transform ${user.isVerified ? 'scale-110' : 'opacity-40 group-hover:scale-110'}`} />
                        <span>{user.isVerified ? 'موثق' : 'غير موثق'}</span>
                      </button>
                    </td>
                    <td className="p-5 text-left">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => { setSelectedUser(user); setShowStatsModal(true); }}
                          className="p-2.5 bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary rounded-2xl transition-all shadow-sm border border-transparent hover:border-primary/20"
                          title="الإحصائيات"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={async () => {
                            const isBlocked = user.status === 'blocked';
                            await firestoreService.toggleUserStatus(user.id, !isBlocked);
                          }}
                          className={`p-2.5 rounded-2xl transition-all shadow-sm border border-transparent ${user.status === 'blocked' ? 'bg-red-600 text-white hover:shadow-lg' : 'bg-surface-container-high text-on-surface-variant hover:bg-red-50 hover:text-red-700 hover:border-red-200'}`}
                          title={user.status === 'blocked' ? 'إلغاء حظر' : 'حظر'}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2.5 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-sm border border-red-100 hover:border-transparent"
                          title="حذف"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="p-20 text-center bg-surface-container-lowest/30">
              <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6 text-on-surface-variant/20">
                <Users className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-on-surface mb-2">ما لقيت حتى {userSubTab === 'sellers' ? 'كساب' : 'مشتري'}</h4>
              <p className="text-on-surface-variant font-medium">جرب تبدل كلمات البحث ولا الفلتر</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderListings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-on-surface font-headline">إدارة الإعلانات</h2>
        <div className="flex gap-2">
          <div className="flex bg-surface border border-outline-variant/30 rounded-xl p-1 overflow-x-auto">
            <button 
              onClick={() => setListingFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${listingFilter === 'all' ? 'bg-primary text-on-primary border-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              الكل
            </button>
            <button 
              onClick={() => setListingFilter('reported')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border flex items-center gap-1 ${listingFilter === 'reported' ? 'bg-primary text-on-primary border-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              تبليغات
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${listingFilter === 'reported' ? 'bg-white text-primary' : 'bg-red-100 text-red-700'}`}>
                {reports.length}
              </span>
            </button>
            <button 
              onClick={() => setListingFilter('promoted')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${listingFilter === 'promoted' ? 'bg-primary text-on-primary border-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              إعلانات مروجة
            </button>
            <button 
              onClick={() => setListingFilter('inactive')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${listingFilter === 'inactive' ? 'bg-primary text-on-primary border-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              إعلانات متوقفة
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAnnouncements.map((listing) => (
          <div key={listing.id} className="bg-surface p-4 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0 relative">
              <img className="w-full h-full object-cover" src={listing.images?.[0] || "https://i.ytimg.com/vi/RrkkshRUttw/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLD92lI4Kxe5liKSwWZaJuLAFopNeA"} alt="حولي" referrerPolicy="no-referrer" />
              {reports.some(r => r.announcementId === listing.id) && (
                <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-lg">
                  <AlertCircle className="w-3 h-3" />
                  <span>{reports.filter(r => r.announcementId === listing.id).length} تبليغات</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2 text-center md:text-right">
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-1">
                {listing.status === 'pending' && !settings.autoAcceptSellers && <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">في انتظار المراجعة</span>}
                {listing.status === 'active' && <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">نشط</span>}
                {listing.status === 'inactive' && <span className="bg-surface-variant text-on-surface-variant text-[10px] font-black px-2 py-0.5 rounded-full uppercase">متوقف</span>}
                {listing.status === 'rejected' && <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">مرفوض</span>}
                <span className="bg-surface-variant text-on-surface-variant text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{listing.category}</span>
              </div>
              <h3 className="font-bold text-on-surface text-lg">{listing.title}</h3>
              <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> {(() => {
                  const seller = users.find(u => u.id === listing.sellerId);
                  return seller ? (seller.fullName || seller.farmName || 'كساب غير معروف') : 'تحميل...';
                })()}</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {(() => {
                    const rawCity = (listing.location || 'غير محدد').split(' ')[0];
                    return (rawCity && cityMapping[rawCity.toLowerCase()]) || rawCity;
                  })()}
                </span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {listing.createdAt?.toDate?.()?.toLocaleString() || 'اليوم'}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {listing.status === 'pending' && !settings.autoAcceptSellers && (
                <button 
                  onClick={() => handleApproveListing(listing.id)}
                  className="p-3 bg-green-50 text-green-700 rounded-xl hover:bg-transparent hover:text-green-700 transition-colors border border-transparent hover:border-green-700" 
                  title="قبول الإعلان"
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              )}
              {listing.status !== 'pending' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-xl border border-outline-variant/10">
                  <span className={`text-[10px] font-bold ${listing.status === 'active' ? 'text-green-600' : 'text-on-surface-variant opacity-50'}`}>نشط</span>
                  <button 
                    onClick={() => handleToggleListing(listing.id, listing.status)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${listing.status === 'active' ? 'bg-green-600' : 'bg-surface-variant'}`}
                    title={listing.status === 'active' ? "توقيف الإعلان" : "تفعيل الإعلان"}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full absolute top-0.5 bg-white transition-all ${listing.status === 'active' ? 'left-0.5' : 'right-0.5'}`}></div>
                  </button>
                  <span className={`text-[10px] font-bold ${listing.status !== 'active' ? 'text-error' : 'text-on-surface-variant opacity-50'}`}>متوقف</span>
                </div>
              )}
              <button 
                onClick={() => onNavigate('listing-details', listing.id)}
                className="p-3 bg-surface-container-high text-on-surface rounded-xl hover:bg-transparent hover:text-on-surface transition-colors border border-transparent hover:border-on-surface" 
                title="عرض التفاصيل"
              >
                <Layers className="w-5 h-5" />
              </button>
              {settings.paymentSystemEnabled && (
                <button 
                  onClick={() => handleBoost(listing.id)}
                  className={`p-3 rounded-xl transition-colors border border-transparent ${listing.boosted ? 'bg-yellow-100 text-yellow-700 hover:border-yellow-700' : 'bg-surface-container-high text-on-surface hover:border-on-surface'} hover:bg-transparent hover:text-inherit`}
                  title="وضع في البورصة"
                >
                  <Zap className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={() => onNavigate('add-listing', listing.id)}
                className="p-3 bg-surface-container-high text-on-surface rounded-xl hover:bg-transparent hover:text-on-surface transition-colors border border-transparent hover:border-on-surface" 
                title="تعديل الإعلان"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  setListingToDelete(listing.id);
                  setShowDeleteConfirm(true);
                }}
                className="p-3 bg-red-50 text-red-700 rounded-xl hover:bg-transparent hover:text-red-700 transition-colors border border-transparent hover:border-red-700" 
                title="حذف الإعلان"
              >
                <Ban className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        {filteredAnnouncements.length === 0 && (
          <div className="p-12 text-center bg-surface rounded-2xl border border-dashed border-outline-variant/50">
            <Tag className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
            <p className="text-on-surface-variant font-bold">لا توجد إعلانات حالياً</p>
          </div>
        )}
      </div>

      {/* Import Confirmation Modal */}
      {importData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 max-w-6xl w-full shadow-2xl border border-outline-variant/20 animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-outline-variant/20 shrink-0">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-on-surface">معاينة البيانات (Excel Preview)</h3>
                <p className="text-sm text-on-surface-variant font-bold">
                  سيتم استيراد {importData.length} صف إلى قاعدة البيانات
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-surface-container-lowest border border-outline-variant/30 rounded-xl mb-6">
              <table className="w-full text-right border-collapse whitespace-nowrap min-w-[1200px]">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-outline-variant/30">
                    <th className="p-3 font-bold border-l border-outline-variant/20">اسم الكساب</th>
                    <th className="p-3 font-bold border-l border-outline-variant/20">رقم الهاتف</th>
                    <th className="p-3 font-bold border-l border-outline-variant/20">المدينة</th>
                    <th className="p-3 font-bold border-l border-outline-variant/20">عدد الرؤوس</th>
                    <th className="p-3 font-bold border-l border-outline-variant/20">الثمن المبدئي</th>
                    <th className="p-3 font-bold border-l border-outline-variant/20">الفئات العمرية</th>
                    <th className="p-3 font-bold border-l border-outline-variant/20">السلالة</th>
                    <th className="p-3 font-bold border-l border-outline-variant/20">الصور / الميديا</th>
                    <th className="p-3 font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-on-surface divide-y divide-outline-variant/10">
                  {importData.slice(0, 100).map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low transition-colors group">
                      <td className="p-3 border-l border-outline-variant/10 font-medium">
                         {row.sellerName || <span className="text-error text-xs">مفقود</span>}
                      </td>
                      <td className="p-3 border-l border-outline-variant/10 font-mono text-xs">
                        {row.phone || <span className="text-error text-xs">مفقود</span>}
                      </td>
                      <td className="p-3 border-l border-outline-variant/10">{row.location || row.farmLocation}</td>
                      <td className="p-3 border-l border-outline-variant/10">
                        {row.sheepCount > 0 ? (
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">{row.sheepCount}</span>
                        ) : '-'}
                      </td>
                      <td className="p-3 border-l border-outline-variant/10">
                        {row.price ? `${row.price} د.م` : '-'}
                      </td>
                      <td className="p-3 border-l border-outline-variant/10">{row.age || '-'}</td>
                      <td className="p-3 border-l border-outline-variant/10">
                        {row.races?.length > 0 ? row.races.join(', ') : '-'}
                      </td>
                      <td className="p-3 border-l border-outline-variant/10">
                        <div className="flex gap-1">
                           {row.images?.length > 0 && <span className="bg-blue-100 text-blue-700 px-1 rounded text-[10px] font-bold">صور ({row.images.length})</span>}
                           {row.videoUrl && <span className="bg-red-100 text-red-700 px-1 rounded text-[10px] font-bold">فيديو</span>}
                           {row.audioUrl && <span className="bg-purple-100 text-purple-700 px-1 rounded text-[10px] font-bold">أوديو</span>}
                           {!row.images && !row.videoUrl && !row.audioUrl && <span className="text-on-surface-variant text-[10px]">بدون ميديا</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        {row.title ? (
                          <span className="text-green-600 flex items-center gap-1 font-bold text-xs"><CheckCircle2 className="w-3 h-3" /> جاهز</span>
                        ) : (
                          <span className="text-error flex items-center gap-1 font-bold text-xs"><AlertCircle className="w-3 h-3" /> خطأ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {importData.length > 100 && (
                    <tr>
                      <td colSpan={9} className="p-4 text-center text-on-surface-variant font-bold text-xs bg-surface-container-lowest">
                         + {importData.length - 100} صف آخر غير معروض...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 shrink-0">
              <button 
                onClick={() => setImportData(null)}
                className="flex-1 py-3.5 rounded-2xl font-bold text-on-surface-variant hover:bg-transparent hover:text-on-surface-variant transition-colors border border-transparent hover:border-on-surface-variant"
              >
                إلغاء الأمر
              </button>
              <button 
                onClick={async () => {
                  setIsImporting(true);
                  try {
                    await firestoreService.importListings(importData);
                    setImportSuccess(true);
                    setImportData(null);
                    setTimeout(() => setImportSuccess(false), 3000);
                  } catch (error) {
                    console.error("Import failed:", error);
                  } finally {
                    setIsImporting(false);
                  }
                }}
                disabled={isImporting}
                className="flex-[2] py-3.5 bg-primary text-on-primary rounded-2xl font-bold transition-colors border border-transparent hover:bg-transparent hover:text-primary hover:border-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isImporting && <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>}
                {isImporting ? 'جاري استيراد البيانات...' : `تأكيد وحفظ ${importData.length} سجل في قاعدة البيانات`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Status Toast */}
      {resetStatus === 'success' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-6 py-3 rounded-2xl font-bold shadow-xl animate-in fade-in slide-in-from-bottom-4">
          تم تصفير النظام بنجاح!
        </div>
      )}
      {resetStatus === 'error' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-2xl font-bold shadow-xl animate-in fade-in slide-in-from-bottom-4">
          وقع مشكل فعملية التصفير. عاود جرب.
        </div>
      )}
      {showRejectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6">
            <h3 className="text-xl font-black mb-4">سبب الرفض</h3>
            <p className="text-sm text-on-surface-variant mb-4">سيتم إرجاع الإعلان إلى "مسودة" وإرسال هذا السبب للكساب.</p>
            <textarea 
              className="w-full h-32 bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary mb-6"
              placeholder="مثال: الصور غير واضحة، الثمن غير منطقي..."
              value={rejectMotif}
              onChange={(e) => setRejectMotif(e.target.value)}
            ></textarea>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 text-sm font-bold text-on-surface-variant hover:bg-transparent hover:text-on-surface-variant rounded-xl transition-colors border border-transparent hover:border-on-surface-variant"
              >
                إلغاء
              </button>
              <button 
                onClick={handleRejectListing}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold transition-colors border border-transparent hover:bg-transparent hover:text-red-600 hover:border-red-600"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-on-surface-variant mb-6">واش بصح بغيتي تمسح هاد الإعلان؟ هاد العملية ما يمكنش ترجع فيها.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setListingToDelete(null);
                }}
                className="flex-1 py-3 text-sm font-bold text-on-surface-variant hover:bg-transparent hover:text-on-surface-variant rounded-xl transition-colors border border-transparent hover:border-on-surface-variant"
              >
                إلغاء
              </button>
              <button 
                onClick={async () => {
                  if (listingToDelete) {
                    await firestoreService.deleteAnnouncement(listingToDelete);
                    setShowDeleteConfirm(false);
                    setListingToDelete(null);
                  }
                }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold transition-colors border border-transparent hover:bg-transparent hover:text-red-600 hover:border-red-600"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAds = () => {
    const banners = settings.banners || {};

    const handleBannerUpload = async (index: 1 | 2 | 3, file: File, isMobile: boolean = false) => {
      const key = isMobile ? `banner${index}Mobile` : `banner${index}`;
      setUploadingBanner(key);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          
          let compressed;
          if (isMobile) {
            // Mobile (1:1) - Square
            compressed = await compressImage(base64, 800, 800, 0.6);
          } else {
            // Desktop (2400x448 as requested previously) - using 1920 width for smaller size
            compressed = await compressImage(base64, 1920, 360, 0.6);
          }

          await updateSettings({
            banners: {
              ...banners,
              [key]: compressed
            }
          });
          setUploadingBanner(null);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Upload failed:", error);
        setUploadingBanner(null);
      }
    };

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-on-surface font-headline">إدارة الإعلانات الترويجية</h2>
            <p className="text-on-surface-variant text-sm mt-1">قم بتغيير صور البانرات في الصفحة الرئيسية للترويج للخدمات.</p>
          </div>
          <div className="bg-primary/10 text-primary p-3 rounded-2xl">
            <Megaphone className="w-6 h-6" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((num) => {
            const index = num as 1 | 2 | 3;
            const key = `banner${index}` as keyof NonNullable<typeof settings.banners>;
            const mobileKey = `banner${index}Mobile` as keyof NonNullable<typeof settings.banners>;
            const urlKey = `banner${index}Url` as keyof NonNullable<typeof settings.banners>;
            
            return (
              <div key={num} className="bg-surface rounded-3xl p-6 border border-outline-variant/30 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-lg">البانر {num}</h3>
                  <div className="text-[10px] font-bold bg-surface-container-high px-2 py-0.5 rounded-full uppercase tracking-wider text-on-surface-variant">Banner PUB {num}</div>
                </div>
                
                {/* Desktop Version */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">نسخة الحاسوب (2400x448)</span>
                    {banners[key] && (
                      <button 
                        onClick={async () => {
                          if (window.confirm("حذف نسخة الحاسوب؟")) {
                            await updateSettings({ 
                              banners: { 
                                [key]: deleteField() 
                              } 
                            });
                          }
                        }}
                        className="text-[10px] font-bold text-error hover:underline transition-all hover:opacity-70"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                  <div className="relative aspect-[24/5] rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/20 flex items-center justify-center group shadow-inner">
                    {banners[key] ? (
                      <img src={banners[key]} alt={`Banner ${num} Desktop`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                        <Upload className="w-6 h-6 opacity-20" />
                        <span className="text-[10px] font-bold opacity-40">لا توجد صورة</span>
                      </div>
                    )}
                    
                    {uploadingBanner === key && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                    
                    <label className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40 backdrop-blur-[1px] z-20">
                      <div className="bg-white text-[#1A1A1A] px-4 py-2 rounded-xl text-[10px] font-black shadow-xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <Upload className="w-3.5 h-3.5" />
                        {banners[key] ? 'تغيير' : 'رفع'}
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleBannerUpload(index, file, false);
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Mobile Version */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">نسخة الهاتف (1:1)</span>
                    {banners[mobileKey] && (
                      <button 
                        onClick={async () => {
                          if (window.confirm("حذف نسخة الهاتف؟")) {
                            await updateSettings({ 
                              banners: { 
                                [mobileKey]: deleteField() 
                              } 
                            });
                          }
                        }}
                        className="text-[10px] font-bold text-error hover:underline transition-all hover:opacity-70"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                  <div 
                    className="relative w-full max-w-[200px] mx-auto rounded-3xl overflow-hidden bg-surface-container-low border-2 border-outline-variant/30 flex items-center justify-center group shadow-xl ring-4 ring-white/50"
                    style={{ aspectRatio: '1/1' }}
                  >
                    {banners[mobileKey] ? (
                      <img src={banners[mobileKey]} alt={`Banner ${num} Mobile`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                        <Upload className="w-8 h-8 opacity-20" />
                        <span className="text-[10px] font-bold opacity-40">لا توجد صورة</span>
                      </div>
                    )}
                    
                    {uploadingBanner === mobileKey && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                    
                    <label className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40 backdrop-blur-[1px] z-20">
                      <div className="bg-white text-[#1A1A1A] px-4 py-2 rounded-xl text-[10px] font-black shadow-xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <Upload className="w-3.5 h-3.5" />
                        {banners[mobileKey] ? 'تغيير' : 'رفع'}
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleBannerUpload(index, file, true);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mr-1">رابط الإعلان (يفتح عند الضغط)</label>
                  <input 
                    type="url"
                    value={banners[urlKey] || ''}
                    onChange={(e) => {
                      updateSettings({
                        banners: {
                          ...banners,
                          [urlKey]: e.target.value
                        }
                      });
                    }}
                    placeholder="https://example.com"
                    className="w-full p-4 bg-surface-container-low border border-outline-variant/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-bold shadow-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex items-center gap-5 max-w-2xl">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-black text-on-surface text-lg">نصيحة للمدير</h4>
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed">استخدم صوراً ذات جودة عالية (نسبة 16:9) لجعل الموقع يبدو أكثر احترافية وجذب انتباه المستخدمين.</p>
          </div>
        </div>
      </div>
    );
  };

  const renderLogs = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-on-surface font-headline">سجلات النظام</h2>
      <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex gap-4">
          <select className="bg-surface border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs font-bold outline-none">
            <option>كل الأحداث</option>
            <option>الحماية</option>
            <option>المعاملات</option>
            <option>الأخطاء</option>
          </select>
          <input type="text" placeholder="بحث في السجلات..." className="flex-1 bg-surface border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs outline-none" />
        </div>
        <div className="divide-y divide-outline-variant/10 font-mono text-[11px]">
          {logs.map((log, i) => (
            <div key={log.id || i} className="p-3 flex gap-4 hover:bg-surface-container-lowest transition-colors">
              <span className="text-on-surface-variant shrink-0">{log.createdAt?.toDate?.()?.toLocaleString('ar-MA') || 'اليوم'}</span>
              <span className={`font-black shrink-0 ${log.level === 'خطأ' ? 'text-error' : log.level === 'تحذير' ? 'text-orange-600' : log.level === 'نجاح' ? 'text-green-600' : 'text-blue-600'}`}>
                [{log.level || 'معلومات'}]
              </span>
              <span className="text-on-surface truncate">{log.msg || log.message}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
              <p className="text-on-surface-variant font-bold">لا توجد سجلات حالياً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-surface-container-low" dir="rtl">
      {quotaExceeded && (
        <div className="fixed top-20 right-6 left-6 z-[200] animate-in slide-in-from-top-4">
          <div className="bg-error text-on-error p-4 rounded-2xl shadow-2xl flex items-center gap-4 justify-between border border-error-container">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-black text-sm">تم استهلاك حصة الاستخدام المجانية لهذا اليوم (Quota Exceeded)</p>
                <p className="text-[10px] font-medium opacity-80">سيتم إعادة ضبط الحصة تلقائياً خلال 24 ساعة. يمكنك الاستمرار في تصفح الواجهة ولكن لن يتم تحديث البيانات الحية.</p>
              </div>
            </div>
            <button onClick={() => setQuotaExceeded(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      {/* Sidebar (Right side for RTL) */}
      <aside className="w-64 bg-surface border-l border-outline-variant/20 flex flex-col justify-between hidden md:flex z-20">
        <div>
          <div className="h-24 flex flex-col items-center justify-center border-b border-outline-variant/20 gap-2 shrink-0">
            <button onClick={() => onNavigate('home')} className="flex items-center group">
              <img 
                src="https://i.ibb.co/Psdn5FfW/logo-removebg-preview.png" 
                alt="كسابكوم" 
                className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors border ${activeTab === 'overview' ? 'bg-primary-container text-on-primary-container border-primary shadow-sm hover:bg-transparent hover:text-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>نظرة عامة</span>
            </button>
            <button 
              onClick={() => setActiveTab('listings')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors border ${activeTab === 'listings' ? 'bg-primary-container text-on-primary-container border-primary shadow-sm hover:bg-transparent hover:text-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              <Tag className="w-5 h-5" />
              <span>الإعلانات</span>
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors border ${activeTab === 'users' ? 'bg-primary-container text-on-primary-container border-primary shadow-sm hover:bg-transparent hover:text-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              <Users className="w-5 h-5" />
              <span>المستخدمين</span>
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors border ${activeTab === 'reports' ? 'bg-primary-container text-on-primary-container border-primary shadow-sm hover:bg-transparent hover:text-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              <AlertCircle className="w-5 h-5 text-error" />
              {reports.length > 0 && (
                <span className="bg-error text-on-error text-[10px] px-2 py-0.5 rounded-full font-bold">{reports.length}</span>
              )}
              <span>التبليغات</span>
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors border ${activeTab === 'stats' ? 'bg-primary-container text-on-primary-container border-primary shadow-sm hover:bg-transparent hover:text-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              <Database className="w-5 h-5" />
              <span>إحصائيات المنصة</span>
            </button>
            <button 
              onClick={() => setActiveTab('stock-market')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors border ${activeTab === 'stock-market' ? 'bg-primary-container text-on-primary-container border-primary shadow-sm hover:bg-transparent hover:text-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              <TrendingUp className="w-5 h-5" />
              <span>بورصة الأغنام</span>
            </button>

            {settings.solidarityDonationEnabled && (
              <button 
                onClick={() => setActiveTab('donations')}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors border ${activeTab === 'donations' ? 'bg-primary-container text-on-primary-container border-primary shadow-sm hover:bg-transparent hover:text-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
              >
                <HeartHandshake className="w-5 h-5" />
                <span>تبرعات و الاستفادات</span>
              </button>
            )}

            {settings.paymentSystemEnabled && (
              <button 
                onClick={() => setActiveTab('monetization')}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors border ${activeTab === 'monetization' ? 'bg-primary-container text-on-primary-container border-primary shadow-sm hover:bg-transparent hover:text-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
              >
                <DollarSign className="w-5 h-5" />
                <span>الأرباح والاشتراكات</span>
              </button>
            )}

            <button 
              onClick={() => setActiveTab('ads')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors border ${activeTab === 'ads' ? 'bg-primary-container text-on-primary-container border-primary shadow-sm hover:bg-transparent hover:text-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              <Megaphone className="w-5 h-5" />
              <span>إعلانات المنصة</span>
            </button>

            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors border ${activeTab === 'settings' ? 'bg-primary-container text-on-primary-container border-primary shadow-sm hover:bg-transparent hover:text-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              <Settings className="w-5 h-5" />
              <span>الإعدادات</span>
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-outline-variant/20">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-error text-white py-3 rounded-xl font-bold transition-colors border border-transparent hover:bg-transparent hover:text-error hover:border-error">
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
        {/* Top Header */}
        <DashboardHeader 
          title={getTitle()} 
          subtitle="المدير العام"
          showSearch={true}
          onSearch={(city, distance) => {
            onNavigate('search-results', undefined, city, distance);
          }}
          onNavigate={onNavigate}
        />

        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'stats' && renderStats()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'listings' && renderListings()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'monetization' && (
            settings.paymentSystemEnabled ? renderMonetization() : (
              <div className="p-12 text-center bg-surface rounded-2xl border border-outline-variant/30">
                <DollarSign className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-on-surface mb-2">نظام الأرباح معطل</h3>
                <p className="text-on-surface-variant mb-6">يمكنك تفعيل نظام الاشتراكات والترويج من إعدادات النظام.</p>
                <button onClick={() => setActiveTab('settings')} className="text-primary font-bold hover:underline">انتقل للإعدادات</button>
              </div>
            )
          )}
          {activeTab === 'stock-market' && <StockMarketView settings={settings} updateSettings={updateSettings} />}
          {activeTab === 'ads' && renderAds()}
          {activeTab === 'donations' && (
            settings.solidarityDonationEnabled ? renderDonations() : (
              <div className="p-12 text-center bg-surface rounded-2xl border border-outline-variant/30">
                <HeartHandshake className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-on-surface mb-2">نظام التبرعات معطل</h3>
                <p className="text-on-surface-variant mb-6">يمكنك تفعيل وحدة تبرعات التضامن من إعدادات النظام.</p>
                <button onClick={() => setActiveTab('settings')} className="text-primary font-bold hover:underline">انتقل للإعدادات</button>
              </div>
            )
          )}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-black text-on-surface font-headline">إعدادات النظام</h2>
                <div className="flex bg-surface-container-high p-1 rounded-xl overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setSettingsTab('general')}
                    className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-colors border ${settingsTab === 'general' ? 'bg-white text-primary border-primary shadow-sm' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
                  >
                    التحكم العام
                  </button>
                  <button 
                    onClick={() => setSettingsTab('logs')}
                    className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-colors border ${settingsTab === 'logs' ? 'bg-white text-primary border-primary shadow-sm' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
                  >
                    سجلات النظام
                  </button>
                  <button 
                    onClick={() => setSettingsTab('security')}
                    className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-colors border ${settingsTab === 'security' ? 'bg-white text-primary border-primary shadow-sm' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
                  >
                    الحماية و واجهة برمجة التطبيقات
                  </button>
                  <button 
                    onClick={() => setSettingsTab('import-export')}
                    className={`whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-colors border ${settingsTab === 'import-export' ? 'bg-white text-primary border-primary shadow-sm' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
                  >
                    إدارة البيانات (Import/Export)
                  </button>
                </div>
              </div>

              <div className="w-full">
                {settingsTab === 'logs' && renderLogs()}
                {settingsTab === 'import-export' && (
                  <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4 max-w-3xl mx-auto">
                    <h3 className="font-bold text-on-surface flex items-center gap-2">
                      <Database className="w-5 h-5 text-primary" />
                      إدارة البيانات (Import/Export)
                    </h3>
                    <div className="space-y-4">
                    <div className="p-4 bg-surface-container-low rounded-xl space-y-3">
                      <h4 className="font-bold text-on-surface text-sm">تصدير البيانات (Backup)</h4>
                      <p className="text-[10px] text-on-surface-variant">تحميل جميع الإعلانات والمستخدمين في ملف JSON للنسخ الاحتياطي.</p>
                      <button 
                        onClick={async () => {
                          const listings = await firestoreService.exportCollection('announcements');
                          const blob = new Blob([JSON.stringify(listings, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `kessabcom_backup_${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-on-primary rounded-xl font-bold transition-colors border border-transparent hover:bg-transparent hover:text-primary hover:border-primary"
                      >
                        <Download className="w-4 h-4" />
                        تصدير قاعدة البيانات
                      </button>
                    </div>

                    <div className="p-4 bg-surface-container-low rounded-xl space-y-3">
                      <h4 className="font-bold text-on-surface text-sm">استيراد من CSV</h4>
                      <p className="text-[10px] text-on-surface-variant">استيراد قائمة الكسابة والإعلانات من ملف CSV (بحد أقصى 2000 سطر).</p>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept=".csv"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = async (event) => {
                              const text = event.target?.result as string;
                              const lines = text.split('\n');
                              const headers = lines[0].split(',');
                              const data = lines.slice(1).map(line => {
                                const values = line.split(',');
                                if (values.length < 2) return null;
                                
                                const row: any = {};
                                headers.forEach((header, index) => {
                                  row[header.trim().toLowerCase()] = values[index]?.trim();
                                });

                                const find = (keys: string[]) => {
                                  for (const k of keys) {
                                    const key = k.toLowerCase();
                                    if (row[key]) return row[key];
                                  }
                                  return '';
                                };

                                const item: any = {
                                  sellerName: find(['nom complet', 'الاسم الكامل', 'sellerName']),
                                  phone: find(['numéro de téléphone', 'رقم الهاتف', 'sellerPhone', 'phone']),
                                  location: find(['ville', 'المدينة', 'location', 'city']),
                                  farmLocation: find(['ville', 'المدينة', 'location', 'city']),
                                  images: find(['الصور', 'images']),
                                  videoUrl: find(['الفيديو', 'video', 'videoUrl']),
                                  youtubeUrl: find(['رابط فيديو يوتيوب', 'youtube', 'youtubeUrl']),
                                  sheepCount: find(['عدد رؤوس الغنم المتوفرة', 'العدد', 'stockCount', 'stock', 'sheepCount']),
                                  price: find(['أقل ثمن كيبدا من', 'الثمن', 'price', 'prix']),
                                  age: find(['السن', 'العمر', 'ageRange', 'age']),
                                  description: find(['وصف إضافي', 'الوصف', 'description', 'desc']),
                                  audioUrl: find(['audio', 'الصوت', 'audioUrl']),
                                  category: find(['category']) || 'sheep'
                                };

                                // Handle Arrays for races and sizes
                                const raceRaw = find(['سلالة الغنم', 'السلالة', 'breed', 'race', 'races']);
                                item.races = raceRaw ? raceRaw.split(';').map(s => s.trim().toLowerCase()) : [];

                                const sizeRaw = find(['حجم الحولي', 'الحجم', 'sizeCategory', 'size', 'sizes']);
                                item.sizes = sizeRaw ? sizeRaw.split(';').map(s => s.trim().toLowerCase()) : [];

                                // Handle Coordinates
                                const gps = find(['موقع الضيعة', 'gps', 'gpsCoordinates']).replace(/gps/gi, '').trim();
                                if (gps && gps.includes(',')) {
                                  const [lat, lng] = gps.split(',').map(n => parseFloat(n.trim()));
                                  if (!isNaN(lat) && !isNaN(lng)) {
                                    item.coordinates = { lat, lng };
                                  }
                                }

                                item.title = find(['title']) || (item.races.length > 0 ? `${item.races[0]} - ${item.location || 'المغرب'}` : 'عرض خروف');
                                item.sellerId = find(['sellerId']);
                                
                                return item;
                              }).filter(Boolean);

                              if (data.length > 0) {
                                setImportData(data);
                              }
                            };
                            reader.readAsText(file);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-container-high text-on-surface rounded-xl font-bold transition-colors border border-transparent hover:bg-transparent hover:text-on-surface hover:border-on-surface-variant">
                          <Upload className="w-4 h-4" />
                          اختيار ملف CSV
                        </button>
                      </div>
                      <button 
                        onClick={() => setShowImportInstructions(true)}
                        className="w-full text-[10px] font-bold text-primary border border-transparent hover:border-primary px-2 py-1 rounded-lg transition-colors"
                      >
                        كيفاش نوجد ملف CSV والصور؟ (تعليمات)
                      </button>
                    </div>
                  </div>
                </div>
                )}

                {settingsTab === 'general' && (
                  <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4 max-w-3xl mx-auto">
                    <h3 className="font-bold text-on-surface">التحكم العام</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">وضع الصيانة</h4>
                        <p className="text-[10px] text-on-surface-variant">تعطيل الوصول العام</p>
                      </div>
                      <div 
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.maintenanceMode ? 'bg-primary' : 'bg-surface-variant'}`}
                        onClick={() => updateSettings({ maintenanceMode: !settings.maintenanceMode })}
                      >
                        <div className={`w-4 h-4 rounded-full absolute top-0.5 shadow-sm transition-all ${settings.maintenanceMode ? 'bg-on-primary left-0.5' : 'bg-surface right-0.5'}`}></div>
                      </div>
                    </div>

                    {settings.maintenanceMode && (
                      <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-2">
                        <label className="text-[10px] font-bold text-primary uppercase flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          جدولة تفعيل المنصة
                        </label>
                        <input 
                          type="datetime-local" 
                          className="w-full bg-white border border-outline-variant/30 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary"
                          value={settings.activationDate || ''}
                          onChange={(e) => updateSettings({ activationDate: e.target.value })}
                        />
                        <p className="text-[9px] text-on-surface-variant">سيتم تعطيل وضع الصيانة تلقائياً في هذا التاريخ.</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm text-primary">قبول الكسابة تلقائياً</h4>
                        <p className="text-[10px] text-on-surface-variant">تفعيل أو تعطيل القبول التلقائي للحسابات الجديدة (بدون مراجعة يدوية)</p>
                      </div>
                      <div 
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.autoAcceptSellers ? 'bg-primary' : 'bg-surface-variant'}`}
                        onClick={() => updateSettings({ autoAcceptSellers: !settings.autoAcceptSellers })}
                      >
                        <div className={`w-4 h-4 rounded-full absolute top-0.5 shadow-sm transition-all ${settings.autoAcceptSellers ? 'bg-on-primary left-0.5' : 'bg-surface right-0.5'}`}></div>
                      </div>
                    </div>
                    {/* Date et notification de l'Aïd */}
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-4">
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-on-surface text-sm text-primary">تاريخ عيد الأضحى</h4>
                          <p className="text-[10px] text-on-surface-variant">سيتم استخدامه للعد التنازلي وإرسال التنبيهات.</p>
                        </div>
                        <input 
                          type="date" 
                          className="bg-white border border-outline-variant/30 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary"
                          value={settings.aidDate || ''}
                          onChange={(e) => updateSettings({ aidDate: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-on-surface text-sm text-primary">تفعيل تنبيهات عيد الأضحى</h4>
                          <p className="text-[10px] text-on-surface-variant">إرسال تنبيهات تلقائية للمستخدمين قبل العيد</p>
                        </div>
                        <div 
                          className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.aidNotificationEnabled ? 'bg-primary' : 'bg-surface-variant'}`}
                          onClick={() => updateSettings({ aidNotificationEnabled: !settings.aidNotificationEnabled })}
                        >
                          <div className={`w-4 h-4 rounded-full absolute top-0.5 shadow-sm transition-all ${settings.aidNotificationEnabled ? 'bg-on-primary left-0.5' : 'bg-surface right-0.5'}`}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-on-surface-variant">عدد الأيام قبل العيد:</label>
                        <input 
                          type="number" 
                          min="1"
                          max="30"
                          className="w-16 bg-white border border-outline-variant/30 rounded-lg px-2 py-1 text-xs outline-none"
                          value={settings.aidNotificationDaysBefore || 3}
                          onChange={(e) => updateSettings({ aidNotificationDaysBefore: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-primary/20">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm text-primary">تفعيل نظام الدفع</h4>
                        <p className="text-[10px] text-on-surface-variant">تعطيل هذا الخيار يجعل المنصة مجانية بالكامل</p>
                      </div>
                      <div 
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.paymentSystemEnabled ? 'bg-primary' : 'bg-surface-variant'}`}
                        onClick={() => updateSettings({ paymentSystemEnabled: !settings.paymentSystemEnabled })}
                      >
                        <div className={`w-4 h-4 rounded-full absolute top-0.5 shadow-sm transition-all ${settings.paymentSystemEnabled ? 'bg-on-primary left-0.5' : 'bg-surface right-0.5'}`}></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-primary/20">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm text-primary">تفعيل التبرع التضامني</h4>
                        <p className="text-[10px] text-on-surface-variant">تفعيل أو تعطيل قسم التبرع التضامني في جميع أنحاء التطبيق</p>
                      </div>
                      <div 
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.solidarityDonationEnabled ? 'bg-primary' : 'bg-surface-variant'}`}
                        onClick={() => updateSettings({ solidarityDonationEnabled: !settings.solidarityDonationEnabled })}
                      >
                        <div className={`w-4 h-4 rounded-full absolute top-0.5 shadow-sm transition-all ${settings.solidarityDonationEnabled ? 'bg-on-primary left-0.5' : 'bg-surface right-0.5'}`}></div>
                      </div>
                    </div>
                  </div>
                </div>
                )}

                {settingsTab === 'security' && (
                  <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4 max-w-3xl mx-auto">
                    <h3 className="font-bold text-on-surface">الحماية و واجهة برمجة التطبيقات</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">Google Maps API Key</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={settings.googleMapsApiKey || ''} 
                          onChange={(e) => updateSettings({ googleMapsApiKey: e.target.value })}
                          placeholder="AIza..."
                          className="flex-1 bg-surface-container-high border-none rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary" 
                        />
                      </div>
                      <p className="text-[9px] text-on-surface-variant">هذا المفتاح ضروري لتشغيل الخريطة في لوحة تحكم المشتري.</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">مفتاح الربط البرمجي (API Key)</label>
                      <input type="password" value="••••••••••••••••" readOnly className="w-full bg-surface-container-high border-none rounded-lg px-3 py-2 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase">تكرار النسخ الاحتياطي</label>
                      <select className="w-full bg-surface-container-high border-none rounded-lg px-3 py-2 text-xs outline-none">
                        <option>كل 6 ساعات</option>
                        <option>يومياً</option>
                        <option>أسبوعياً</option>
                      </select>
                    </div>

                    <div className="pt-4 border-t border-error/20">
                      <h4 className="font-bold text-error text-sm mb-2">منطقة الخطر</h4>
                      <p className="text-[10px] text-on-surface-variant mb-4">هاد الخيار غادي يمسح كاع البيانات (إعلانات، مستخدمين، طلبات...) وغادي يخلي غير الحساب ديالك. هاد العملية ما يمكنش ترجع فيها.</p>
                        <button 
                          onClick={() => setShowResetConfirm(true)}
                          className="w-full py-3 bg-error text-white rounded-xl font-bold transition-colors border border-transparent hover:bg-transparent hover:text-error hover:border-error"
                        >
                          تصفير النظام بالكامل (Reset)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {showResetConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                  <div className="bg-surface w-full max-w-md rounded-3xl p-8 shadow-2xl border border-error/20 animate-in zoom-in-95 duration-200">
                    <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-on-surface text-center mb-4 font-headline">واش متأكد بغيتي تصفر النظام؟</h3>
                    <p className="text-on-surface-variant text-center mb-8 font-medium">
                      هاد العملية غادي تمسح كاع الإعلانات، المستخدمين، والطلبات. غادي يبقى غير الحساب ديالك بوحدو. هادشي ما فيهش الرجوع!
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setShowResetConfirm(false)}
                        className="py-4 bg-surface-container-high text-on-surface font-bold rounded-2xl transition-colors border border-transparent hover:bg-transparent hover:text-on-surface hover:border-on-surface"
                      >
                        إلغاء
                      </button>
                      <button 
                        onClick={handleResetSystem}
                        disabled={isResetting}
                        className="py-4 bg-error text-white font-bold rounded-2xl transition-colors border border-transparent hover:bg-transparent hover:text-error hover:border-error shadow-lg shadow-error/20 flex items-center justify-center gap-2"
                      >
                        {isResetting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : 'نعم، مسح كولشي'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showImportInstructions && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                  <div className="bg-surface w-full max-w-2xl rounded-3xl p-8 shadow-2xl border border-outline-variant/20 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-black text-on-surface font-headline">تعليمات استيراد البيانات</h3>
                      <button onClick={() => setShowImportInstructions(false)} className="p-2 border border-transparent hover:border-on-surface-variant hover:text-on-surface-variant rounded-full transition-colors">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <div className="space-y-6 text-right" dir="rtl">
                      <section className="space-y-2">
                        <h4 className="font-bold text-primary flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          1. هيكلة ملف CSV
                        </h4>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          ملف CSV خاصو يكون فيه هاد العناوين (Headers) ف السطر الأول:
                          <br />
                          <code className="bg-surface-container-high px-2 py-1 rounded mt-1 block text-left" dir="ltr">
                            Nom Complet, Numéro de téléphone, Ville, موقع الضيعة (مثل 33.55, -7.64), الصور (روابط مفصولة بـ ;), الفيديو (رابط MP4 أو YouTube), رابط فيديو يوتيوب, عدد رؤوس الغنم المتوفرة, أقل ثمن كيبدا من, السن, حجم الحولي, سلالة الغنم, وصف إضافي, Audio (رابط MP3)
                          </code>
                        </p>
                      </section>

                      <section className="space-y-2">
                        <h4 className="font-bold text-primary flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          2. التعامل مع الوسائط (Images, Video, Audio)
                        </h4>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          - <strong>الصور:</strong> حط روابط مباشرة (Direct URLs) ف خانة <code dir="ltr">images</code>. إلا كانو بزاف، فرق بيناتهم بـ <code dir="ltr">;</code>.
                          <br />
                          - <strong>الفيديو:</strong> حط رابط YouTube أو رابط مباشر لملف MP4 ف خانة <code dir="ltr">videoUrl</code>.
                          <br />
                          - <strong>الأوديو:</strong> حط رابط مباشر لملف MP3 ف خانة <code dir="ltr">audioUrl</code>.
                        </p>
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                          <p className="text-[10px] font-bold text-primary mb-1">نصيحة تقنية:</p>
                          <p className="text-[10px] text-on-surface-variant">
                            باش ترفع 2000 كساب بالصور ديالهم، أحسن طريقة هي ترفع الصور ف Firebase Storage أولاً، وتاخد الروابط ديالهم وتحطهم ف ملف CSV. هادشي كيضمن أن الصور غادي يبقاو خدامين ديما.
                          </p>
                        </div>
                      </section>

                      <section className="space-y-2">
                        <h4 className="font-bold text-primary flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          3. ربط الإعلانات بالكسابة
                        </h4>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          خانة <code dir="ltr">sellerId</code> خاص يكون فيها الـ UID ديال الكساب ف Firebase. إلا كنتي باغي ترفع إعلانات لكسابة جداد، خاصك تكريهوم ف Firebase Auth أولاً.
                        </p>
                      </section>

                      <div className="pt-6 border-t border-outline-variant/20">
                        <button 
                          onClick={() => setShowImportInstructions(false)}
                          className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl transition-colors border border-transparent hover:bg-transparent hover:text-primary hover:border-primary shadow-lg shadow-primary/20"
                        >
                          فهمت، شكراً
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {showStatsModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-6">
              <h2 className="text-xl font-black text-on-surface">إحصائيات المستخدم: {selectedUser.displayName || selectedUser.name}</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">عدد الزيارات:</span>
                  <span className="font-bold">{selectedUser.visitsCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">عدد القطعان:</span>
                  <span className="font-bold">{selectedUser.herdsCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">تاريخ التسجيل:</span>
                  <span className="font-bold">{selectedUser.createdAt?.toDate?.()?.toLocaleDateString('ar-MA') || 'غير متاح'}</span>
                </div>
              </div>
              <button 
                onClick={() => setShowStatsModal(false)}
                className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl transition-colors border border-transparent hover:bg-transparent hover:text-primary hover:border-primary"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </main>


    </div>
  );
}
