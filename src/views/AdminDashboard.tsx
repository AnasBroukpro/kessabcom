import React, { useState, useEffect } from 'react';
import logoV2 from '../assets/marketing/branding/logo v2.png';
import { ViewType } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, where, limit, getDocs, deleteDoc, deleteField } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  LayoutDashboard, Users, Tag, Layers, Settings, Bell, User, Search, 
  CheckCircle2, Ban, Eye, TrendingUp, DollarSign, ShieldCheck, BadgeCheck,
  AlertCircle, ArrowUpRight, Filter, MoreVertical, Download, Upload, FileText, Database, X,
  Clock, ChevronLeft, ChevronDown, LogOut, MapPin, Heart, HeartHandshake, Zap, Megaphone, Loader2,
  Lock, Camera, Shield, Globe, Mail, Phone, Calendar, Info, Flag, Trash2,
  ShoppingBag, CreditCard, BarChart3, PieChart, Monitor, Smartphone, Star, RefreshCw, History,
  Link as LinkIcon
} from 'lucide-react';
import { updatePassword, updateProfile, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useSettings } from '../hooks/useSettings';
import DashboardHeader from '../components/DashboardHeader';
import { cityMapping } from '../constants/cityMapping';
import { compressImage, compressFileForUpload } from '../lib/imageUtils';
import Notifications from './Notifications';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
  activeSubView?: string;
}

type AdminTab = 'overview' | 'stats' | 'users' | 'farms' | 'auctions' | 'listings' | 'reviews' | 'monetization' | 'ads' | 'settings' | 'stock-market' | 'donations' | 'reports' | 'support_requests' | 'profile' | 'notifications';

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
          {(Array.isArray(newsItems) ? newsItems : []).map((news, index) => (
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


function ReviewsModerationView() {
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectModalReview, setRejectModalReview] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await firestoreService.adminGetPendingReviews();
        setPendingReviews(data || []);
      } catch (err: any) {
        console.error("Failed to fetch pending reviews:", err);
        setError(err.message || "Une erreur est survenue lors du chargement des avis.");
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleApprove = async (review: any) => {
    try {
      await firestoreService.adminApproveReview(review.type, review.targetId, review.id);
      setPendingReviews(prev => prev.filter(r => r.id !== review.id));
    } catch (error) {
      console.error("Failed to approve review:", error);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalReview) return;
    setIsRejecting(true);
    try {
      await firestoreService.adminDeleteReview(rejectModalReview.type, rejectModalReview.targetId, rejectModalReview.id);
      setPendingReviews(prev => prev.filter(r => r.id !== rejectModalReview.id));
      setRejectModalReview(null);
      setRejectReason('');
    } catch (error) {
      console.error("Failed to reject review:", error);
    } finally {
      setIsRejecting(false);
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.startsWith('212')) return '0' + clean.slice(3);
    if (clean.startsWith('0')) return clean;
    return '0' + clean;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir="rtl">
      {/* Rejection Modal */}
      {rejectModalReview && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                <X className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-on-surface">رفض التقييم</h3>
                <p className="text-sm text-on-surface-variant">أدخل سبب الرفض (اختياري)</p>
              </div>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl italic text-sm text-on-surface">
              "{rejectModalReview.comment}"
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="سبب الرفض: محتوى مسيء، معلومات كاذبة..."
              className="w-full p-4 bg-surface-container-low border border-outline-variant/20 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-medium min-h-[100px]"
            />
            <div className="flex gap-3">
              <button
                onClick={handleRejectConfirm}
                disabled={isRejecting}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isRejecting ? 'جاري الرفض...' : 'تأكيد الرفض'}
              </button>
              <button
                onClick={() => { setRejectModalReview(null); setRejectReason(''); }}
                className="flex-1 py-3 bg-surface-container-high text-on-surface rounded-xl font-black hover:bg-surface-container transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-black text-on-surface font-headline">مراجعة التقييمات والتعليقات</h2>
        <p className="text-on-surface-variant text-sm mt-1">وافق أو ارفض التعليقات الجديدة قبل ما تبان ف السيت.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-on-surface-variant font-bold">جاري تحميل التعليقات...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-8 rounded-3xl border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-red-900 mb-2">خطأ في التحميل</h3>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-full font-bold text-sm hover:bg-red-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : pendingReviews.length === 0 ? (
        <div className="bg-surface p-12 rounded-3xl border border-outline-variant/30 text-center">
          <div className="w-20 h-20 bg-primary/5 text-primary/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Star className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-on-surface mb-2">كولشي مريغل!</h3>
          <p className="text-on-surface-variant">ما كاين حتى تعليق كيتسنى المراجعة حالياً.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingReviews.map((review) => (
            <div key={review.id} className="bg-surface p-6 rounded-3xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {(review.authorName || review.userName || 'U').charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-on-surface">{review.authorName || review.userName || 'مستخدم'}</h4>
                        {(review.authorPhone || review.phone) && (
                          <a
                            href={`https://wa.me/${formatPhone(review.authorPhone || review.phone).replace(/^0/, '212')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-black hover:bg-green-200 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            واتساب
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${review.type === 'seller' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {review.type === 'seller' ? 'تقييم كساب' : 'تقييم إعلان'}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">{review.createdAt?.toDate?.()?.toLocaleString('ar-MA')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-on-surface font-medium bg-surface-container-low p-4 rounded-xl italic">
                  "{review.comment}"
                </p>
                <div className="text-xs text-on-surface-variant flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  <span>الهدف: {review.type === 'seller' ? 'UID الكساب: ' : 'ID الإعلان: '}{review.targetId}</span>
                </div>
              </div>
              <div className="flex md:flex-col gap-2 justify-center shrink-0">
                <button 
                  onClick={() => handleApprove(review)}
                  className="flex-1 md:flex-none px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  موافقة
                </button>
                <button 
                  onClick={() => setRejectModalReview(review)}
                  className="flex-1 md:flex-none px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm border border-red-100 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard({ onNavigate, activeSubView }: Props) {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [uploadingBanner, setUploadingBanner] = useState<string | null>(null);
  const [platformStats, setPlatformStats] = useState<any>({
    totalUsers: 0, sellers: 0, buyers: 0, verifiedSellers: 0, blockedUsers: 0,
    totalAds: 0, activeAds: 0, pendingAds: 0, inactiveAds: 0, boostedAds: 0,
    totalRequests: 0, openRequests: 0, closedRequests: 0,
    totalOffers: 0, pendingReports: 0, donations: 0,
    newListingsThisWeek: 0, newUsersThisWeek: 0,
    monthlyGrowth: [], categoryBreakdown: [], planBreakdown: []
  });
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const [statsTimeFilter, setStatsTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  useEffect(() => {
    if (activeTab === 'stats') {
      firestoreService.getAdminStats(statsTimeFilter).then(setPlatformStats).catch(() => firestoreService.getPlatformStats().then(setPlatformStats));
    }
  }, [activeTab, statsTimeFilter]);

  useEffect(() => {
    if (activeSubView) {
      setActiveTab(activeSubView as AdminTab);
    }
  }, [activeSubView]);
  const [userSubTab, setUserSubTab] = useState<'sellers' | 'buyers'>('sellers');
  const [listingSubTab, setListingSubTab] = useState<'farms' | 'auctions'>('farms');
  const [overviewTimeFilter, setOverviewTimeFilter] = useState<'today' | 'week' | 'month'>('month');
  const [donationSubTab, setDonationSubTab] = useState<'donations' | 'benefits'>('donations');
  const [monetizationSubTab, setMonetizationSubTab] = useState<'subscriptions' | 'boosts'>('subscriptions');
  const [settingsTab, setSettingsTab] = useState<'general' | 'logs' | 'security' | 'import-export' | 'backup'>('general');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [activeBannerTab, setActiveBannerTab] = useState<Record<number, 'desktop' | 'mobile'>>({ 1: 'desktop', 2: 'desktop', 3: 'desktop' });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [listingFilter, setListingFilter] = useState<'all' | 'reported' | 'promoted' | 'inactive'>('all');
  const [listingCityFilter, setListingCityFilter] = useState<string>('all');
  const [listingSearch, setListingSearch] = useState('');
  const [userCityFilter, setUserCityFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'deactivated' | 'pending' | 'blocked'>('all');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [rejectMotif, setRejectMotif] = useState('');
  const [openUserMenuId, setOpenUserMenuId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [listingsPage, setListingsPage] = useState(1);
  const itemsPerPage = 10;
  const [reports, setReports] = useState<any[]>([]);
  const [reportSubTab, setReportSubTab] = useState<'listing' | 'request' | 'offer'>('listing');
  const [supportSubTab, setSupportSubTab] = useState<'password' | 'contact'>('password');
  const [sentPasswords, setSentPasswords] = useState<Record<string, boolean>>({});
  const [donations, setDonations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [offerRequests, setOfferRequests] = useState<any[]>([]);
  const [selectedAuctionOffers, setSelectedAuctionOffers] = useState<any[]>([]);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [viewingAuctionTitle, setViewingAuctionTitle] = useState('');


  // Reset page when filter or search changes
  useEffect(() => {
    setListingsPage(1);
  }, [listingFilter, listingCityFilter, listingSearch]);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [supportRequests, setSupportRequests] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Profile states
  const [newDisplayName, setNewDisplayName] = useState(profile?.fullName || profile?.displayName || '');
  const [newPhotoURL, setNewPhotoURL] = useState(profile?.photoURL || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  
  // User Preferences States
  const [prefLanguage, setPrefLanguage] = useState(profile?.preferences?.language || 'ar');
  const [prefNotifications, setPrefNotifications] = useState(profile?.preferences?.notificationsEnabled ?? true);
  const [prefCompactMode, setPrefCompactMode] = useState(profile?.preferences?.compactMode ?? false);
  const [showDeleteSupportConfirm, setShowDeleteSupportConfirm] = useState(false);
  const [supportRequestToDelete, setSupportRequestToDelete] = useState<string | null>(null);

  const { refreshProfile } = useAuth();

  const { settings, updateSettings } = useSettings();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      // Update Auth Profile
      await updateProfile(user, {
        displayName: newDisplayName,
        photoURL: newPhotoURL
      });

      // Update Firestore User Document
      await firestoreService.updateUserProfile(user.uid, {
        fullName: newDisplayName,
        displayName: newDisplayName,
        photoURL: newPhotoURL,
        preferences: {
          language: prefLanguage,
          notificationsEnabled: prefNotifications,
          compactMode: prefCompactMode
        }
      });


      await refreshProfile();
      setProfileSuccess('تم تحديث الملف الشخصي بنجاح!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setProfileError('فشل في تحديث الملف الشخصي. المرجو المحاولة لاحقاً.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    if (newPassword !== confirmPassword) {
      setProfileError('كلمات المرور غير متطابقة.');
      return;
    }

    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setProfileSuccess('تم تغيير كلمة المرور بنجاح!');
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        setProfileError('كلمة المرور الحالية غير صحيحة.');
      } else {
        setProfileError('فشل في تغيير كلمة المرور. المرجو المحاولة لاحقاً.');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  // Auto-save preferences when they change
  useEffect(() => {
    const savePrefs = async () => {
      if (!user) return;
      try {
        await firestoreService.updateUserProfile(user.uid, {
          preferences: {
            language: prefLanguage,
            notificationsEnabled: prefNotifications,
            compactMode: prefCompactMode
          }
        });
      } catch (error) {
        console.error("Failed to auto-save preferences:", error);
      }
    };

    if (profile && (
        profile?.preferences?.language !== prefLanguage || 
        profile?.preferences?.notificationsEnabled !== prefNotifications ||
        profile?.preferences?.compactMode !== prefCompactMode)) {
      savePrefs();
    }
  }, [prefLanguage, prefNotifications, prefCompactMode, user, profile]);


  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsPhotoUploading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      // 1. Compress to WebP before upload (max 400×400, 80% quality)
      const compressedFile = await compressFileForUpload(file, 400, 400, 0.80);
      // 2. Upload compressed file to Storage
      const url = await firestoreService.uploadImage(compressedFile, `profiles/${user.uid}`);
      setNewPhotoURL(url);
      
      // 2. Update Auth & DB (parallel)
      await Promise.all([
        updateProfile(user, { photoURL: url }),
        firestoreService.updateUserProfile(user.uid, { photoURL: url })
      ]);
      
      setProfileSuccess('تم تحديث الصورة الشخصية بنجاح!');

      // 4. Background refresh
      refreshProfile().catch(err => console.warn("Background refresh failed:", err));
    } catch (error) {
      console.error('Error uploading photo:', error);
      setProfileError('فشل في رفع الصورة. المرجو التأكد من اتصالك بالإنترنت.');
    } finally {
      setIsPhotoUploading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const unsub = firestoreService.subscribeToUserNotifications(user.uid, setNotifications);
    return () => unsub();
  }, [user]);

  const filteredAnnouncements = React.useMemo(() => {
    if (!Array.isArray(announcements)) return [];
    return announcements.filter(listing => {
      // Basic category filter
      let matchesFilter = true;
      if (listingFilter === 'reported') {
        matchesFilter = reports.some(r => r.announcementId === listing.id);
      } else if (listingFilter === 'promoted') {
        matchesFilter = listing.boosted === true;
      } else if (listingFilter === 'inactive') {
        matchesFilter = listing.status === 'inactive' || listing.status === 'rejected' || listing.status === 'deactivated';
      }

      if (!matchesFilter) return false;

      // City filter
      if (listingCityFilter !== 'all') {
        const arabicCity = cityMapping[listingCityFilter];
        const location = (listing.city || listing.location || listing.farmLocation || '').toLowerCase();
        const matchesLatin = location.includes(listingCityFilter.toLowerCase());
        const matchesArabic = arabicCity && location.includes(arabicCity.toLowerCase());
        
        if (!matchesLatin && !matchesArabic) return false;
      }

      // Search filter
      if (listingSearch) {
        const searchStr = listingSearch.toLowerCase();
        const seller = users.find(u => u.id === listing.sellerId);
        const matchesSearch = 
          (listing.title || '').toLowerCase().includes(searchStr) ||
          (listing.sellerName || '').toLowerCase().includes(searchStr) ||
          (listing.phone || '').includes(searchStr) ||
          (seller?.fullName || '').toLowerCase().includes(searchStr) ||
          (seller?.phoneNumber || '').includes(searchStr) ||
          (seller?.farmName || '').toLowerCase().includes(searchStr) ||
          (listing.location || '').toLowerCase().includes(searchStr) ||
          (listing.city || '').toLowerCase().includes(searchStr);
        
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [announcements, listingFilter, listingCityFilter, listingSearch, reports, users]);

  const paginatedAnnouncements = React.useMemo(() => {
    const startIndex = (listingsPage - 1) * itemsPerPage;
    return filteredAnnouncements.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAnnouncements, listingsPage]);

  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);

  const filteredUsers = React.useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users.filter(u => {
      const matchesRole = userSubTab === 'sellers' ? u.role === 'seller' : u.role === 'buyer';
      const matchesStatus = userStatusFilter === 'all' || (u.status || 'active') === userStatusFilter;
      
      // City filter
      let matchesCity = true;
      if (userCityFilter !== 'all') {
        const arabicCity = cityMapping[userCityFilter];
        const location = (u.city || u.location || '').toLowerCase();
        const matchesLatin = location.includes(userCityFilter.toLowerCase());
        const matchesArabic = arabicCity && location.includes(arabicCity.toLowerCase());
        matchesCity = matchesLatin || matchesArabic;
      }

      if (!matchesCity) return false;

      const searchStr = userSearch.toLowerCase();
      const matchesSearch = 
        (u.displayName || u.name || '').toLowerCase().includes(searchStr) ||
        (u.email || '').toLowerCase().includes(searchStr) ||
        (u.phoneNumber || '').includes(searchStr) ||
        (u.farmName || '').toLowerCase().includes(searchStr) ||
        (u.fullName || '').toLowerCase().includes(searchStr);
      
      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [users, userSubTab, userStatusFilter, userSearch, userCityFilter]);

  const isAllSelected = filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`هل أنت متأكد من حذف ${selectedUserIds.length} مستخدم؟`)) {
      try {
        await Promise.all(selectedUserIds.map(id => firestoreService.adminDeleteUser(id)));
        setSelectedUserIds([]);
        fetchAdminData();
      } catch (error) {
        console.error("Bulk delete failed:", error);
      }
    }
  };

  const handleBulkVerify = async (verify: boolean) => {
    try {
      await Promise.all(selectedUserIds.map(id => verify ? firestoreService.adminVerifyUser(id) : updateDoc(doc(db, 'users', id), { isVerified: false })));
      setSelectedUserIds([]);
      fetchAdminData();
    } catch (error) {
      console.error("Bulk verify failed:", error);
    }
  };

  const handleBulkStatus = async (status: string) => {
    try {
      await Promise.all(selectedUserIds.map(id => updateDoc(doc(db, 'users', id), { status })));
      setSelectedUserIds([]);
      fetchAdminData();
    } catch (error) {
      console.error("Bulk status change failed:", error);
    }
  };

  const stats = React.useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const filterDate = overviewTimeFilter === 'today' ? startOfToday : 
                       overviewTimeFilter === 'week' ? startOfWeek : 
                       startOfMonth;

    const toJsDate = (ts: any) => {
      if (!ts) return null;
      if (typeof ts.toDate === 'function') return ts.toDate();
      if (ts._seconds !== undefined) return new Date(ts._seconds * 1000);
      if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
      const d = new Date(ts);
      return isNaN(d.getTime()) ? null : d;
    };

    // Filter data based on time period for specific metrics
    const filteredUsersInPeriod = Array.isArray(users) ? users.filter(u => {
      const d = toJsDate(u.createdAt);
      return d && d >= filterDate;
    }) : [];

    const filteredAnnouncementsInPeriod = Array.isArray(announcements) ? announcements.filter(a => {
      const d = toJsDate(a.createdAt);
      return d && d >= filterDate;
    }) : [];

    const filteredReportsInPeriod = Array.isArray(reports) ? reports.filter(r => {
      const d = toJsDate(r.createdAt);
      return d && d >= filterDate;
    }) : [];

    // Total revenue in this period (simulated from plans of new users joining in this period)
    const periodRevenue = filteredUsersInPeriod.reduce((acc, user) => {
      if (user.plan === 'احترافي') return acc + (settings.monetization?.proMonthly || 199);
      if (user.plan === 'شركات') return acc + (settings.monetization?.farmMonthly || 499);
      return acc;
    }, 0);

    // Global stats (not period specific)
    const totalActiveSellers = Array.isArray(users) ? users.filter(u => u.role === 'seller' && (u.status || 'active') === 'active').length : 0;
    const verifiedSellers = Array.isArray(users) ? users.filter(u => u.role === 'seller' && u.isVerified).length : 0;
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
      const [usersData, listingsData, reportsData, donationsData, logsData, supportData, auctionsData] = await Promise.all([
        firestoreService.adminGetUsers(),
        firestoreService.adminGetListings(),
        firestoreService.adminGetReports(),
        firestoreService.adminGetDonations(),
        firestoreService.adminGetLogs(),
        firestoreService.adminGetSupportRequests(),
        firestoreService.getOfferRequests(undefined, 100) // Fetching recent auctions
      ]);
      setUsers(usersData);
      setAnnouncements(listingsData);
      setReports(reportsData);
      setDonations(donationsData);
      setLogs(logsData);
      setSupportRequests(supportData);
      setOfferRequests(auctionsData?.data || []);
    } catch (error: any) {
      if (error.message?.includes('Quota')) setQuotaExceeded(true);
      console.error("Fetch admin data error:", error);
    }
  }, []);

  useEffect(() => {
    if (profile?.role !== 'admin') return;

    fetchAdminData();
    // Removed setInterval to prevent excessive Firestore reads
  }, [profile?.role, fetchAdminData]);

  const handleToggleListing = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await firestoreService.adminUpdateListingStatus(listingId, newStatus);
      fetchAdminData();
    } catch (error) {
      console.error("Failed to toggle listing status:", error);
    }
  };

  const handleBoost = async (id: string) => {
    if (window.confirm("هل أنت متأكد من وضع الإعلان في البورصة (لمدة 7 أيام)؟")) {
      try {
        await firestoreService.boostAnnouncement(id);
      } catch (error) {
        console.error("Failed to boost listing:", error);
      }
    }
  };

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    try {
      await firestoreService.adminPinListingToHome(id, !currentPin);
      fetchAdminData();
    } catch (error) {
      console.error("Failed to toggle pin:", error);
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

  const handleExportUsers = () => {
    if (!filteredUsers.length) return;
    
    const headers = ["ID", "Name", "Role", "Plan", "Status", "Verified", "City", "Created At"];
    const rows = filteredUsers.map(u => [
      u.id,
      u.displayName || u.name || "N/A",
      u.role || "N/A",
      u.plan || "Free",
      u.status || "active",
      u.isVerified ? "Yes" : "No",
      (u.location || u.city || "N/A"),
      u.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `kessabcom_users_${userSubTab}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportListings = () => {
    if (!filteredAnnouncements.length) return;
    
    const headers = ["ID", "Title", "Seller", "Category", "City", "Price", "Status", "Created At"];
    const rows = filteredAnnouncements.map(l => [
      l.id,
      (l.title || "N/A").replace(/,/g, ' '),
      (l.sellerName || "N/A").replace(/,/g, ' '),
      l.category || "N/A",
      (l.city || l.location || "N/A").replace(/,/g, ' '),
      l.price || "Negotiable",
      l.status || "active",
      l.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `kessabcom_listings_${listingSubTab}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    serverPressure: 15,
    storageConsumption: 12
  });

  useEffect(() => {
    if (users.length && announcements.length) {
      // Calculate realistic firebase monitoring
      const pressure = Math.min(100, Math.round(10 + (users.length / 500) * 90));
      const storage = Math.min(100, Math.round(5 + ((announcements.length * 3) / 1000) * 95));
      setPlatformHealth({
        serverPressure: pressure,
        storageConsumption: storage
      });
    }
  }, [users.length, announcements.length]);
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

  const renderStats = () => {
    const s = platformStats;
    const loading = s.totalUsers === 0 && s.monthlyGrowth?.length === 0;

    // Mini donut helper (pure CSS conic-gradient)
    const DonutChart = ({ segments }: { segments: { value: number; color: string; label: string }[] }) => {
      const total = segments.reduce((a, b) => a + (Number(b.value) || 0), 0) || 0;
      let cumulative = 0;
      const gradient = total > 0 ? segments.map(seg => {
        const val = Number(seg.value) || 0;
        const pct = (val / total) * 100;
        const part = `${seg.color} ${cumulative.toFixed(1)}% ${(cumulative + pct).toFixed(1)}%`;
        cumulative += pct;
        return part;
      }).join(', ') : '#e2e8f0 0% 100%';
      return (
        <div className="flex items-center gap-6">
          <div className="relative shrink-0 animate-in zoom-in duration-1000" style={{ width: 80, height: 80 }}>
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${gradient})` }} />
            <div className="absolute inset-[14px] rounded-full bg-surface flex items-center justify-center">
              <span className="text-[10px] font-black text-on-surface-variant">{total}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            {segments.map((seg, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                  <span className="text-xs font-bold text-on-surface-variant truncate">{seg.label}</span>
                </div>
                <span className="text-xs font-black text-on-surface shrink-0">{seg.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    // Bar chart helper (CSS only)
    const HBarChart = ({ items, color }: { items: { label: string; value: number }[]; color: string }) => {
      const max = Math.max(...items.map(i => i.value), 1);
      return (
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-bold text-on-surface-variant">{item.label}</span>
                <span className="text-xs font-black text-on-surface">{item.value}</span>
              </div>
              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out animate-in slide-in-from-right-full"
                  style={{ width: `${(item.value / max) * 100}%`, background: color }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    };

    // Monthly growth dual-bar chart
    const GrowthChart = ({ data }: { data: { month: string; users: number; listings: number }[] }) => {
      const maxVal = Math.max(...data.flatMap(d => [d.users, d.listings]), 1);
      return (
        <div className="flex items-end gap-2 h-32" dir="ltr">
          {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-end gap-0.5 h-24 w-full justify-center">
                <div
                  title={`مستخدمون: ${d.users}`}
                  className="flex-1 rounded-t-md transition-all duration-1000 ease-out animate-in slide-in-from-bottom-full cursor-pointer hover:opacity-80"
                  style={{ height: `${(d.users / maxVal) * 96}px`, background: '#6366f1', minHeight: 2 }}
                />
                <div
                  title={`إعلانات: ${d.listings}`}
                  className="flex-1 rounded-t-md transition-all duration-1000 ease-out animate-in slide-in-from-bottom-full cursor-pointer hover:opacity-80 delay-150"
                  style={{ height: `${(d.listings / maxVal) * 96}px`, background: '#10b981', minHeight: 2 }}
                />
              </div>
              <span className="text-[9px] font-bold text-on-surface-variant text-center leading-tight whitespace-nowrap">{d.month}</span>
            </div>
          ))}
        </div>
      );
    };

    const KpiCard = ({ icon, label, value, sub, iconBg, delta }: { icon: React.ReactNode; label: string; value: number | string; sub?: string; iconBg: string; delta?: number }) => (
      <div className="bg-surface rounded-2xl p-5 border border-outline-variant/20 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-on-surface-variant mb-0.5">{label}</p>
          <p className="text-2xl font-black text-on-surface leading-none">{value}</p>
          {sub && <p className="text-[10px] text-on-surface-variant/70 font-medium mt-1">{sub}</p>}
        </div>
        {delta !== undefined && (
          <span className={`text-[10px] font-black px-2 py-1 rounded-full shrink-0 ${delta >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {delta >= 0 ? '+' : ''}{delta} هذا الأسبوع
          </span>
        )}
      </div>
    );

    return (
      <div className="space-y-8" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-on-surface font-headline">إحصائيات المنصة</h2>
            <p className="text-sm text-on-surface-variant mt-1">مؤشرات الأداء الرئيسية — يتم تحديثها عند كل زيارة للصفحة</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-surface-container-high p-1 rounded-2xl shadow-sm border border-outline-variant/10">
              <button 
                onClick={() => setStatsTimeFilter('today')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${statsTimeFilter === 'today' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-primary'}`}
              >
                اليوم
              </button>
              <button 
                onClick={() => setStatsTimeFilter('week')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${statsTimeFilter === 'week' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-primary'}`}
              >
                الأسبوع
              </button>
              <button 
                onClick={() => setStatsTimeFilter('month')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${statsTimeFilter === 'month' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-primary'}`}
              >
                الشهر
              </button>
              <button 
                onClick={() => setStatsTimeFilter('all')}
                className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${statsTimeFilter === 'all' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-primary'}`}
              >
                منذ البداية
              </button>
            </div>
            <button
              onClick={() => firestoreService.getAdminStats(statsTimeFilter).then(setPlatformStats)}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-black hover:bg-primary/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </button>
          </div>
        </div>

        {/* ── Row 1: Hero KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={<Users className="w-6 h-6 text-indigo-600" />} label={statsTimeFilter === 'all' ? "إجمالي المستخدمين" : "مستخدمون جدد"} value={s.totalUsers} iconBg="bg-indigo-100" delta={statsTimeFilter === 'all' ? s.newUsersThisWeek : undefined} />
          <KpiCard icon={<Tag className="w-6 h-6 text-emerald-600" />} label={statsTimeFilter === 'all' ? "إعلانات نشطة" : "إعلانات جديدة"} value={s.activeAds} sub={statsTimeFilter === 'all' ? `من أصل ${s.totalAds} إعلان` : undefined} iconBg="bg-emerald-100" delta={statsTimeFilter === 'all' ? s.newListingsThisWeek : undefined} />
          <KpiCard icon={<ShoppingBag className="w-6 h-6 text-violet-600" />} label={statsTimeFilter === 'all' ? "طلبات مفتوحة" : "طلبات جديدة"} value={s.openRequests} sub={statsTimeFilter === 'all' ? `${s.closedRequests} مغلق` : undefined} iconBg="bg-violet-100" />
          <KpiCard icon={<Zap className="w-6 h-6 text-amber-600" />} label={statsTimeFilter === 'all' ? "إعلانات مدفوعة" : "إعلانات مميزة جديدة"} value={s.boostedAds} sub={statsTimeFilter === 'all' ? `${s.pendingAds} في الانتظار` : undefined} iconBg="bg-amber-100" />
        </div>

        {/* ── Row 2: Users + Listings breakdowns ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Users breakdown */}
          <div className="bg-surface rounded-2xl p-6 border border-outline-variant/20 shadow-sm">
            <h3 className="font-black text-base text-on-surface mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500" />تركيبة المستخدمين</h3>
            <DonutChart segments={[
              { value: s.sellers, color: '#6366f1', label: 'كسابة' },
              { value: s.buyers, color: '#10b981', label: 'مشترون' },
              { value: Math.max(0, s.totalUsers - s.sellers - s.buyers), color: '#e2e8f0', label: 'غير محدد' },
            ]} />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-surface-container-low rounded-xl p-3 text-center">
                <p className="text-lg font-black text-primary">{s.verifiedSellers}</p>
                <p className="text-[10px] font-bold text-on-surface-variant">موثقون</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3 text-center">
                <p className="text-lg font-black text-red-600">{s.blockedUsers}</p>
                <p className="text-[10px] font-bold text-on-surface-variant">محظورون</p>
              </div>
            </div>
          </div>

          {/* Listings breakdown */}
          <div className="bg-surface rounded-2xl p-6 border border-outline-variant/20 shadow-sm">
            <h3 className="font-black text-base text-on-surface mb-4 flex items-center gap-2"><Tag className="w-4 h-4 text-emerald-500" />حالة الإعلانات</h3>
            <DonutChart segments={[
              { value: s.activeAds, color: '#10b981', label: 'نشطة' },
              { value: s.pendingAds, color: '#f59e0b', label: 'بانتظار المراجعة' },
              { value: s.inactiveAds, color: '#94a3b8', label: 'غير نشطة' },
            ]} />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-surface-container-low rounded-xl p-3 text-center">
                <p className="text-lg font-black text-amber-600">{s.boostedAds}</p>
                <p className="text-[10px] font-bold text-on-surface-variant">في البورصة</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3 text-center">
                <p className="text-lg font-black text-on-surface">{s.totalOffers}</p>
                <p className="text-[10px] font-bold text-on-surface-variant">عروض مقدمة</p>
              </div>
            </div>
          </div>

          {/* Subscription plans */}
          <div className="bg-surface rounded-2xl p-6 border border-outline-variant/20 shadow-sm">
            <h3 className="font-black text-base text-on-surface mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-violet-500" />توزيع الاشتراكات</h3>
            {s.planBreakdown?.length > 0 ? (
              <DonutChart segments={[
                { value: s.planBreakdown.find((p: any) => p.name === 'شركات')?.count || 0, color: '#3b82f6', label: 'شركات' },
                { value: s.planBreakdown.find((p: any) => p.name === 'احترافي')?.count || 0, color: '#8b5cf6', label: 'احترافي' },
                { value: s.planBreakdown.find((p: any) => p.name === 'مجاني')?.count || 0, color: '#e2e8f0', label: 'مجاني' },
              ]} />
            ) : (
              <div className="h-20 flex items-center justify-center text-on-surface-variant/40 text-sm font-bold">لا توجد بيانات</div>
            )}
            <div className="mt-4 bg-gradient-to-l from-violet-50 to-indigo-50 rounded-xl p-3 border border-violet-100">
              <p className="text-[10px] font-bold text-violet-700 mb-1">نسبة التحويل</p>
              <p className="text-xl font-black text-violet-800">
                {s.sellers > 0 ? (((s.planBreakdown?.filter((p: any) => p.name !== 'مجاني').reduce((a: number, b: any) => a + b.count, 0) || 0) / s.sellers) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* ── Row 3: Growth chart + Category distribution ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Monthly growth */}
          <div className="bg-surface rounded-2xl p-6 border border-outline-variant/20 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-base text-on-surface flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-500" />النمو الشهري (6 أشهر)</h3>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />مستخدمون</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />إعلانات</span>
              </div>
            </div>
            {s.monthlyGrowth?.length > 0 ? (
              <GrowthChart data={s.monthlyGrowth} />
            ) : (
              <div className="h-32 flex items-center justify-center text-on-surface-variant/40 text-sm font-bold">جاري التحميل...</div>
            )}
          </div>

          {/* Category breakdown */}
          <div className="bg-surface rounded-2xl p-6 border border-outline-variant/20 shadow-sm">
            <h3 className="font-black text-base text-on-surface mb-5 flex items-center gap-2"><PieChart className="w-4 h-4 text-emerald-500" />توزيع الإعلانات حسب الفصيلة</h3>
            {s.categoryBreakdown?.length > 0 ? (
              <HBarChart
                items={s.categoryBreakdown.map((c: any) => ({ label: c.name, value: c.count }))}
                color="linear-gradient(to left, #10b981, #6366f1)"
              />
            ) : (
              <div className="h-32 flex items-center justify-center text-on-surface-variant/40 text-sm font-bold">لا توجد بيانات</div>
            )}
          </div>
        </div>

        {/* ── Row 4: Marketplace funnel + Moderation health ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Marketplace funnel */}
          <div className="md:col-span-2 bg-surface rounded-2xl p-6 border border-outline-variant/20 shadow-sm">
            <h3 className="font-black text-base text-on-surface mb-5 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-violet-500" />قمع نشاط السوق</h3>
            <div className="space-y-3">
              {[
                { label: 'إجمالي المستخدمين', value: s.totalUsers, color: '#6366f1', pct: 100 },
                { label: 'كسابة (بائعون)', value: s.sellers, color: '#8b5cf6', pct: s.totalUsers > 0 ? ((s.sellers / s.totalUsers) * 100) : 0 },
                { label: 'لديهم إعلانات نشطة', value: s.activeAds, color: '#10b981', pct: s.sellers > 0 ? Math.min(100, (s.activeAds / s.sellers) * 100) : 0 },
                { label: 'طلبات مشترين مفتوحة', value: s.openRequests, color: '#f59e0b', pct: s.buyers > 0 ? ((s.openRequests / s.buyers) * 100) : 0 },
                { label: 'صفقات مغلقة', value: s.closedRequests, color: '#ef4444', pct: s.totalRequests > 0 ? ((s.closedRequests / s.totalRequests) * 100) : 0 },
              ].map((row, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-bold text-on-surface-variant">{row.label}</span>
                    <span className="text-xs font-black text-on-surface">{row.value} <span className="font-bold text-on-surface-variant/60">({row.pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${row.pct}%`, background: row.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Moderation health */}
          <div className="bg-surface rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col gap-4">
            <h3 className="font-black text-base text-on-surface flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-red-500" />صحة المنصة</h3>
            {[
              { label: 'تبليغات معلقة', value: s.pendingReports, icon: <Flag className="w-4 h-4" />, color: s.pendingReports > 10 ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50' },
              { label: 'مستخدمون محظورون', value: s.blockedUsers, icon: <Ban className="w-4 h-4" />, color: 'text-red-600 bg-red-50' },
              { label: 'تبرعات واردة', value: s.donations, icon: <HeartHandshake className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'إعلانات بانتظار الموافقة', value: s.pendingAds, icon: <Clock className="w-4 h-4" />, color: s.pendingAds > 5 ? 'text-amber-600 bg-amber-50' : 'text-on-surface-variant bg-surface-container-low' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.color}`}>{item.icon}</div>
                  <span className="text-xs font-bold text-on-surface-variant">{item.label}</span>
                </div>
                <span className="text-base font-black text-on-surface">{item.value}</span>
              </div>
            ))}
            {/* Health score */}
            <div className="mt-auto pt-4 border-t border-outline-variant/10">
              <p className="text-[10px] font-bold text-on-surface-variant mb-2">نقاء المنصة</p>
              {(() => {
                const score = Math.max(0, 100 - (s.pendingReports * 2) - (s.blockedUsers) - (s.pendingAds));
                const color = score > 80 ? '#10b981' : score > 60 ? '#f59e0b' : '#ef4444';
                return (
                  <>
                    <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, score)}%`, background: color }} />
                    </div>
                    <p className="text-sm font-black mt-1" style={{ color }}>{Math.min(100, score).toFixed(0)}%</p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  };


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
      case 'support_requests': return 'الطلبات';
      case 'profile': return 'ملفي الشخصي';
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
            {(Array.isArray(filtered) ? filtered : []).map((req) => (
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

  const renderReports = () => {
    const formatDate = (ts: any) => {
      try {
        if (!ts) return 'اليوم';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return new Intl.DateTimeFormat('ar-MA', { dateStyle: 'short', timeStyle: 'short' }).format(d);
      } catch { return 'اليوم'; }
    };

    const filteredReports = (Array.isArray(reports) ? reports : []).filter(r => {
      const type = (r.targetType || r.type || '').toLowerCase();
      if (reportSubTab === 'listing') return type === 'listing' || type === 'announcement' || (!type && r.announcementId);
      if (reportSubTab === 'request') return type === 'request' || type === 'offerrequest';
      if (reportSubTab === 'offer') return type === 'offer';
      return true;
    });

    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-on-surface font-headline">التبليغات</h2>
            <p className="text-sm text-on-surface-variant">مراجعة وإدارة تبليغات المستخدمين</p>
          </div>
          <div className="flex bg-surface-container-high p-1 rounded-xl gap-1">
            {([['listing', 'إعلان'], ['request', 'طلب'], ['offer', 'عرض']] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setReportSubTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-black transition-all ${reportSubTab === tab ? 'bg-white text-primary shadow-sm border border-primary/20' : 'text-on-surface-variant hover:text-primary'}`}
              >
                {label}
                <span className={`mr-1 text-[10px] px-1.5 py-0.5 rounded-full ${reportSubTab === tab ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                  {(Array.isArray(reports) ? reports : []).filter(r => {
                    const type = (r.targetType || r.type || '').toLowerCase();
                    if (tab === 'listing') return type === 'listing' || type === 'announcement' || (!type && r.announcementId);
                    if (tab === 'request') return type === 'request' || type === 'offerrequest';
                    return type === 'offer';
                  }).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-surface-container-lowest border-b border-outline-variant/20">
              <tr className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="p-4">المبلغ به</th>
                <th className="p-4">المبلغ (المشتري)</th>
                {reportSubTab === 'listing' && <th className="p-4">الكسابة</th>}
                <th className="p-4">سبب التبليغ</th>
                <th className="p-4">التاريخ والساعة</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-xs text-on-surface-variant">{report.targetId || report.announcementId || '—'}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black w-fit ${
                        reportSubTab === 'listing' ? 'bg-blue-100 text-blue-700' :
                        reportSubTab === 'request' ? 'bg-violet-100 text-violet-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {reportSubTab === 'listing' ? 'إعلان' : reportSubTab === 'request' ? 'طلب' : 'عرض'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-sm">{report.reporterName || report.buyerName || (report.reporterId === 'anonymous' ? 'زائر' : 'مستخدم')}</span>
                      <span className="text-xs text-on-surface-variant font-mono">{report.reporterId || '—'}</span>
                    </div>
                  </td>
                  {reportSubTab === 'listing' && (
                    <td className="p-4">
                      <span className="font-bold text-sm text-primary">{report.sellerName || report.sellerId || '—'}</span>
                    </td>
                  )}
                  <td className="p-4">
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                      {report.reason || 'بدون سبب'}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-on-surface-variant font-medium">{formatDate(report.createdAt)}</td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-center">
                      {reportSubTab === 'listing' && (
                        <button
                          onClick={() => onNavigate('listing-details', report.targetId || report.announcementId)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20"
                          title="عرض الإعلان"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          await firestoreService.adminDeleteReport(report.id);
                          setReports(prev => prev.filter(r => r.id !== report.id));
                        }}
                        className="p-2 text-error hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        title="حذف الإعلان"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          await firestoreService.adminDeleteReport(report.id);
                          setReports(prev => prev.filter(r => r.id !== report.id));
                        }}
                        className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors border border-transparent hover:border-outline-variant"
                        title="تجاهل التبليغ"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-on-surface-variant font-medium">
                    لا توجد تبليغات في هذا القسم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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
            value: stats.totalSales, icon: DollarSign, color: 'text-green-600', trend: stats.totalSales === "0 درهم" ? "0%" : "+15%", sub: 'من الاشتراكات',
            onClick: () => setActiveTab('monetization')
          },
          { 
            label: overviewTimeFilter === 'today' ? 'كسابة جدد اليوم' : overviewTimeFilter === 'week' ? 'كسابة جدد هذا الأسبوع' : 'كسابة جدد هذا الشهر', 
            value: stats.newSellers.toLocaleString(), icon: Users, color: 'text-blue-600', trend: stats.newSellers > 0 ? `+${stats.newSellers}` : '0%', sub: stats.verificationRate,
            onClick: () => { setActiveTab('users'); setUserSubTab('sellers'); }
          },
          { 
            label: overviewTimeFilter === 'today' ? 'إعلانات اليوم' : overviewTimeFilter === 'week' ? 'إعلانات الأسبوع' : 'إعلانات الشهر', 
            value: stats.activeListings.toLocaleString(), icon: Tag, color: 'text-purple-600', trend: '+12%', sub: 'إعلانات حية',
            onClick: () => setActiveTab('listings')
          },
          { 
            label: overviewTimeFilter === 'today' ? 'تبليغات اليوم' : overviewTimeFilter === 'week' ? 'تبليغات الأسبوع' : 'تبليغات الشهر', 
            value: stats.pendingReports.toLocaleString(), icon: AlertCircle, color: 'text-error', trend: stats.pendingReports > 0 ? `+${stats.pendingReports}` : '0%', sub: 'تحتاج مراجعة',
            onClick: () => setActiveTab('reports')
          }
        ].map((stat, i) => (
          <button 
            key={i} 
            onClick={(stat as any).onClick}
            className="text-right bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm relative overflow-hidden group hover:border-primary/50 hover:shadow-md transition-all active:scale-95"
          >
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
            <p className="text-[10px] text-on-surface-variant/60 font-medium">{(stat as any).sub}</p>
          </button>
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
                  <p className="text-xs text-on-surface-variant">
                    {(() => {
                      if (!activity.createdAt) return 'اليوم';
                      if (typeof activity.createdAt.toDate === 'function') return activity.createdAt.toDate().toLocaleString('ar-MA');
                      if (activity.createdAt._seconds) return new Date(activity.createdAt._seconds * 1000).toLocaleString('ar-MA');
                      if (activity.createdAt.seconds) return new Date(activity.createdAt.seconds * 1000).toLocaleString('ar-MA');
                      return new Date(activity.createdAt).toLocaleString('ar-MA');
                    })()}
                  </p>
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
                  <span className="text-primary">{quotaExceeded ? '100' : '1'}%</span>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/10">
                  <div className="h-full bg-gradient-to-l from-primary to-primary-container transition-all duration-1000 shadow-sm" style={{ width: `${quotaExceeded ? 100 : 1}%` }}></div>
                </div>
                <div className="flex justify-between text-[9px] font-black text-on-surface-variant/60">
                  <span>الحد اليومي: 20,000</span>
                  <span>المستهلك: {quotaExceeded ? '20,000+' : '5'}</span>
                </div>
              </div>

              {/* Read Ops */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black text-blue-600">
                  <span className="text-on-surface-variant uppercase tracking-tighter">عمليات القراءة (Reads)</span>
                  <span>1%</span>
                </div>
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/10">
                  <div className="h-full bg-gradient-to-l from-blue-600 to-blue-400 transition-all duration-1000 shadow-sm" style={{ width: `1%` }}></div>
                </div>
                <div className="flex justify-between text-[9px] font-black text-on-surface-variant/60">
                  <span>الحد اليومي: 50,000</span>
                  <span>المستهلك: 15</span>
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

          <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
            <h3 className="font-bold text-on-surface flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              إعدادات نظام الطلبات والعروض
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl">
                <span className="text-sm font-medium">أقصى عدد عروض للطلب</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={settings.buyerRequests?.maxOffersPerRequest || 6} 
                    onChange={(e) => updateSettings({ buyerRequests: { ...settings.buyerRequests, maxOffersPerRequest: Number(e.target.value) } })}
                    className="w-12 bg-transparent border-b border-primary text-center font-bold outline-none" 
                  />
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl">
                <span className="text-sm font-medium">أقصى عروض يومية للكساب</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={settings.buyerRequests?.maxDailyOffersPerSeller || 6} 
                    onChange={(e) => updateSettings({ buyerRequests: { ...settings.buyerRequests, maxDailyOffersPerSeller: Number(e.target.value) } })}
                    className="w-12 bg-transparent border-b border-primary text-center font-bold outline-none" 
                  />
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl">
                <span className="text-sm font-medium">عدد الطلبات في الصفحة</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={settings.buyerRequests?.requestsPerPage || 6} 
                    onChange={(e) => updateSettings({ buyerRequests: { ...settings.buyerRequests, requestsPerPage: Number(e.target.value) } })}
                    className="w-12 bg-transparent border-b border-primary text-center font-bold outline-none" 
                  />
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl">
                <span className="text-sm font-medium">مدة صلاحية الطلب (أيام)</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={settings.buyerRequests?.requestExpirationDays || 7} 
                    onChange={(e) => updateSettings({ buyerRequests: { ...settings.buyerRequests, requestExpirationDays: Number(e.target.value) } })}
                    className="w-12 bg-transparent border-b border-primary text-center font-bold outline-none" 
                  />
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl">
                <span className="text-sm font-medium">قطر البحث (كلم)</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={settings.buyerRequests?.searchRadiusKm || 10} 
                    onChange={(e) => updateSettings({ buyerRequests: { ...settings.buyerRequests, searchRadiusKm: Number(e.target.value) } })}
                    className="w-12 bg-transparent border-b border-primary text-center font-bold outline-none" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSupportRequests = () => {
    const formatSupportPhone = (phone: string) => {
      if (!phone) return '';
      const clean = phone.replace(/\D/g, '');
      if (clean.startsWith('212')) return '0' + clean.slice(3);
      if (clean.startsWith('0')) return clean;
      return '0' + clean;
    };

    const filteredRequests = supportRequests.filter(req => {
      if (supportSubTab === 'password') {
        return req.type === 'password_reset' || !req.type; // Fallback for old ones
      } else {
        return req.type === 'contact' || req.type === 'home_page' || req.type === 'banner' || req.type === 'other';
      }
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-on-surface font-headline">طلبات الدعم والتقني</h2>
            <p className="text-sm text-on-surface-variant font-medium">إدارة طلبات المستخدمين ورسائل التواصل</p>
          </div>
          <div className="flex bg-surface-container-high p-1 rounded-xl gap-1">
            <button
              onClick={() => setSupportSubTab('password')}
              className={`px-5 py-2 rounded-lg text-sm font-black transition-all ${supportSubTab === 'password' ? 'bg-white text-primary shadow-sm border border-primary/20' : 'text-on-surface-variant hover:text-primary'}`}
            >
              كلمة المرور
            </button>
            <button
              onClick={() => setSupportSubTab('contact')}
              className={`px-5 py-2 rounded-lg text-sm font-black transition-all ${supportSubTab === 'contact' ? 'bg-white text-primary shadow-sm border border-primary/20' : 'text-on-surface-variant hover:text-primary'}`}
            >
              الصفحة الرئيسية / banner
            </button>
          </div>
        </div>
        
        <div className="bg-surface rounded-3xl border border-outline-variant/30 shadow-md overflow-hidden">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-outline-variant/20">
                <th className="p-5 font-black text-xs">نوع الطلب</th>
                <th className="p-5 font-black text-xs">المستخدم</th>
                <th className="p-5 font-black text-xs">رقم الهاتف</th>
                <th className="p-5 font-black text-xs">التاريخ</th>
                <th className="p-5 font-black text-xs">الحالة</th>
                <th className="p-5 font-black text-xs text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-primary/[0.02]">
                  <td className="p-5 font-bold text-sm">
                    {req.type === 'password_reset' ? 'إعادة تعيين كلمة المرور' : 
                     req.type === 'home_page' ? 'الصفحة الرئيسية' :
                     req.type === 'banner' ? 'إعلانات البانر' : 
                     req.type === 'contact' ? 'اتصال عام' :
                     req.type === 'other' ? 'موضوع آخر' : req.type}
                  </td>
                  <td className="p-5 font-bold text-sm text-primary">
                    {req.name || 'غير معروف'}
                  </td>
                  <td className="p-5 font-mono text-sm" dir="ltr">{formatSupportPhone(req.phone)}</td>
                  <td className="p-5 text-xs text-on-surface-variant font-bold">
                    {(() => {
                      try {
                        if (!req.createdAt) return 'اليوم';
                        const date = req.createdAt.toDate ? req.createdAt.toDate() : new Date(req.createdAt);
                        if (isNaN(date.getTime())) return 'اليوم';
                        return new Intl.DateTimeFormat('ar-MA', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(date);
                      } catch (e) {
                        return 'اليوم';
                      }
                    })()}
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                      req.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {req.status === 'pending' ? 'في الانتظار' : 'تمت المعالجة'}
                    </span>
                  </td>
                  <td className="p-5 text-left">
                    <div className="flex justify-end gap-2">
                      {req.status === 'pending' && supportSubTab === 'password' && (
                        <button 
                          onClick={async () => {
                            const tempPass = Math.floor(100000 + Math.random() * 900000).toString();
                            const message = `مرحبا ${req.name || 'مستخدم كسابكوم'}،\n\nبناءً على طلبك، كلمة المرور المؤقتة الخاصة بك هي: *${tempPass}*\n\nيرجى تسجيل الدخول وتغييرها فوراً من إعدادات حسابك.\n\nفريق كسابكوم.`;
                            const cleanPhone = (req.phone || '').replace(/\+/g, '');
                            const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '212' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(message)}`;
                            
                            window.open(whatsappUrl, '_blank');
                            
                            setSentPasswords(prev => ({ ...prev, [req.id]: true }));
                          }}
                          className={`flex items-center gap-2 px-3 py-2 ${sentPasswords[req.id] ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-xl transition-all text-[10px] font-black`}
                          title="إرسال كلمة المرور عبر واتساب"
                        >
                          <Lock size={14} />
                          {sentPasswords[req.id] ? 'إعادة إرسال كلمة المرور' : 'إرسال كلمة المرور'}
                        </button>
                      )}
                      {req.status === 'pending' && supportSubTab === 'contact' && (
                        <button 
                          onClick={async () => {
                            await firestoreService.adminUpdateSupportRequestStatus(req.id, 'completed');
                            fetchAdminData();
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-[10px] font-black"
                        >
                          <CheckCircle2 size={14} />
                          تمت القراءة
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setSupportRequestToDelete(req.id);
                          setShowDeleteSupportConfirm(true);
                        }}
                        className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                        title="حذف"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-on-surface-variant font-bold">
                    لا توجد طلبات في هذا القسم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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
            <p className="text-sm text-on-surface-variant font-medium">تحكم في حسابات الكسابة والمشترين، تتبع نشاطهم، وقم بإدارة الصلاحيات والتحقق من الهوية</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-surface p-4 rounded-3xl border border-outline-variant/20 shadow-sm">
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
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-on-surface-variant">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          <div className="relative">
            <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
            <select 
              value={userCityFilter}
              onChange={(e) => setUserCityFilter(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl py-3 pr-10 pl-4 text-sm font-black outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">جميع المدن</option>
              {Object.entries(cityMapping).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-on-surface-variant">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleExportUsers}
              className="flex-1 bg-surface-container-high text-on-surface-variant py-3 rounded-2xl text-xs font-black hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              تصدير
            </button>
          </div>
        </div>

        {selectedUserIds.length > 0 && (
          <div className="bg-primary/10 p-4 rounded-2xl flex items-center justify-between border border-primary/20 shadow-sm animate-in fade-in slide-in-from-top-2">
            <span className="font-black text-primary text-sm">تم تحديد {selectedUserIds.length} مستخدم</span>
            <div className="flex gap-2">
               <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors">حذف المحدد</button>
               <button onClick={() => handleBulkVerify(true)} className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary-container transition-colors">توثيق المحدد</button>
               <button onClick={() => setSelectedUserIds([])} className="px-4 py-2 text-primary font-bold text-xs">إلغاء التحديد</button>
            </div>
          </div>
        )}

        <div className="bg-surface rounded-3xl border border-outline-variant/30 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-right border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-surface-container-low/50 text-on-surface-variant text-[10px] uppercase tracking-wider border-b border-outline-variant/20">
                  <th className="p-5 text-right w-10">
                    <input 
                      type="checkbox" 
                      checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0} 
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-outline-variant/30 text-primary focus:ring-primary/20"
                    />
                  </th>
                  <th className="p-5 font-black">المستخدم</th>
                  <th className="p-5 font-black">المعلومات</th>
                  <th className="p-5 font-black">{userSubTab === 'sellers' ? 'النشاط / الخطة' : 'المشتريات'}</th>
                  <th className="p-5 font-black">الحالة</th>
                  {userSubTab === 'sellers' && <th className="p-5 font-black">Certification</th>}
                  <th className="p-5 font-black text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredUsers.map((user, i) => (
                  <tr key={user.id || i} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="p-5 text-right">
                      <input 
                        type="checkbox" 
                        checked={selectedUserIds.includes(user.id)} 
                        onChange={() => toggleSelectUser(user.id)}
                        className="w-4 h-4 rounded border-outline-variant/30 text-primary focus:ring-primary/20"
                      />
                    </td>
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
                      <div className="flex flex-col gap-2">
                        {user.role === 'seller' ? (
                          <select 
                            value={user.plan || 'Free'}
                            onChange={async (e) => {
                              await updateDoc(doc(db, 'users', user.id), { plan: e.target.value });
                              fetchAdminData();
                            }}
                            className="bg-surface-container-low border border-outline-variant/20 rounded-lg px-2 py-1 text-[10px] font-black outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            <option value="Free">حساب عادي</option>
                            <option value="احترافي">احترافي</option>
                            <option value="شركات">شركات</option>
                          </select>
                        ) : (
                          <div className="text-[10px] font-bold text-on-surface-variant/60">مشتري</div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-on-surface">
                            <Tag className="w-3 h-3 text-primary" />
                            <span>{user.herdsCount || 0} إعلان</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-on-surface">
                            <Eye className="w-3 h-3 text-on-surface-variant" />
                            <span>{user.visitsCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <select 
                        value={user.status || 'active'}
                        onChange={async (e) => {
                          await updateDoc(doc(db, 'users', user.id), { status: e.target.value });
                          fetchAdminData();
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
                    {userSubTab === 'sellers' && (
                      <td className="p-5">
                        <button 
                          onClick={async () => {
                            const newStatus = !user.isVerified;
                            // Ensure both isVerified and isCertified are updated for consistency
                            await updateDoc(doc(db, 'users', user.id), { 
                              isVerified: newStatus,
                              isCertified: newStatus 
                            });
                            fetchAdminData();
                          }}
                          className={`group px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 border-2 ${
                            user.isVerified ? 'bg-primary/5 text-primary border-primary/20' : 'bg-surface-container-high text-on-surface-variant/40 border-outline-variant/10'
                          }`}
                        >
                          <ShieldCheck className={`w-4 h-4 transition-transform ${user.isVerified ? 'scale-110' : 'opacity-40 group-hover:scale-110'}`} />
                          <span>{user.isVerified ? 'Membre Certifié' : 'Désactivé'}</span>
                        </button>
                      </td>
                    )}
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
                            fetchAdminData();
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

  const renderListings = () => {
    return (
      <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-on-surface font-headline">إدارة الإعلانات</h2>
          <p className="text-sm text-on-surface-variant font-medium">تحكم في الإعلانات المعروضة، المزادات، وقم بمراجعة المحتوى والتبليغات</p>
        </div>
        <div className="flex bg-surface-container-high p-1 rounded-2xl shadow-sm">
          <button 
            onClick={() => setListingSubTab('farms')}
            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all border ${listingSubTab === 'farms' ? 'bg-primary text-on-primary border-primary shadow-md transform scale-105' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
          >
            الضيعات
          </button>
          <button 
            onClick={() => setListingSubTab('auctions')}
            className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all border ${listingSubTab === 'auctions' ? 'bg-primary text-on-primary border-primary shadow-md transform scale-105' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
          >
            المزادات
          </button>
        </div>
      </div>

      {listingSubTab === 'farms' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-surface p-4 rounded-3xl border border-outline-variant/20 shadow-sm">
          <div className="lg:col-span-2 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
            <input 
              type="text" 
              placeholder="البحث بالعنوان، اسم الكساب أو رقم الهاتف..."
              value={listingSearch}
              onChange={(e) => setListingSearch(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl py-3 pr-12 pl-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="relative">
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
            <select 
              value={listingFilter}
              onChange={(e) => setListingFilter(e.target.value as any)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl py-3 pr-10 pl-4 text-sm font-black outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">كل الإعلانات</option>
              <option value="reported">تبليغات ({reports.length})</option>
              <option value="promoted">مروجة</option>
              <option value="inactive">متوقفة/مرفوضة</option>
            </select>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-on-surface-variant">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          <div className="relative">
            <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
            <select 
              value={listingCityFilter}
              onChange={(e) => setListingCityFilter(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl py-3 pr-10 pl-4 text-sm font-black outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">جميع المدن</option>
              {Object.entries(cityMapping).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-on-surface-variant">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleExportListings}
              className="flex-1 bg-surface-container-high text-on-surface-variant py-3 rounded-2xl text-xs font-black hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              تصدير
            </button>
          </div>
        </div>
      ) : (
          <div className="bg-surface p-6 rounded-3xl border border-outline-variant/20 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
                <input 
                  type="text" 
                  placeholder="البحث في المزادات..."
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl py-3 pr-12 pl-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-4 py-2 rounded-xl border border-outline-variant/10">
                  إجمالي المزادات المفتوحة: {offerRequests.length}
                </div>
              </div>
            </div>

            {/* Auctions / Requests Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-[10px] font-black uppercase tracking-wider border-b border-outline-variant/30">
                    <th className="p-5 text-right">المزاد / الطلب</th>
                    <th className="p-5 text-right">المشتري</th>
                    <th className="p-5 text-right">الميزانية / السلالة</th>
                    <th className="p-5 text-right">العروض المستلمة</th>
                    <th className="p-5 text-right">الحالة</th>
                    <th className="p-5 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {offerRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-surface-container-lowest/50 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-black text-on-surface text-sm mb-0.5">{request.title}</p>
                            <p className="text-[10px] text-on-surface-variant font-bold">{request.createdAt?.toDate?.()?.toLocaleDateString() || 'اليوم'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                           <User className="w-4 h-4 text-on-surface-variant/40" />
                           <span className="text-xs font-bold text-on-surface-variant">{request.buyerName || 'مشتري'}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="space-y-1">
                          <div className="text-xs font-black text-primary">{request.budget || 'غير محدد'} درهم</div>
                          <div className="flex flex-wrap gap-1">
                            {(request.breeds || []).map((b: string, i: number) => (
                              <span key={i} className="text-[8px] font-black bg-surface-container-high px-1.5 py-0.5 rounded-full">{b}</span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <button 
                          className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-xl text-[10px] font-black hover:bg-violet-100 transition-all border border-violet-100"
                          onClick={async () => {
                            setViewingAuctionTitle(request.title);
                            const offers = await firestoreService.getOffersForRequest(request.id);
                            setSelectedAuctionOffers(offers || []);
                            setShowOffersModal(true);
                          }}
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>عرض العروض</span>
                        </button>
                      </td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          request.status === 'Open' || request.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          {request.status === 'Open' || request.status === 'Active' ? 'مفتوح' : 'مغلق'}
                        </span>
                      </td>
                      <td className="p-5 text-left">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => {
                               // Admin view request details if needed
                             }}
                             className="p-2 bg-surface-container-high text-on-surface-variant hover:text-primary rounded-xl transition-all"
                           >
                             <Eye className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => {
                               if (window.confirm("هل أنت متأكد من حذف هذا المزاد؟")) {
                                 firestoreService.deleteOfferRequest(request.id).then(fetchAdminData);
                               }
                             }}
                             className="p-2 bg-surface-container-high text-on-surface-variant hover:text-red-600 rounded-xl transition-all"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {offerRequests.length === 0 && (
                <div className="p-16 text-center">
                  <ShoppingBag className="w-12 h-12 text-on-surface-variant/20 mx-auto mb-4" />
                  <p className="text-on-surface-variant font-bold">لا توجد مزادات نشطة حالياً</p>
                </div>
              )}
            </div>
          </div>
        )}
      
      {listingSubTab === 'farms' ? (
        <div className="grid grid-cols-1 gap-4">
          {paginatedAnnouncements.map((listing) => (
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
                  onClick={() => handleTogglePin(listing.id, !!listing.isPinnedToHome)}
                  className={`p-3 rounded-xl transition-colors border border-transparent ${listing.isPinnedToHome ? 'bg-blue-100 text-blue-700 hover:border-blue-700' : 'bg-surface-container-high text-on-surface hover:border-on-surface'} hover:bg-transparent hover:text-inherit`}
                  title={listing.isPinnedToHome ? "إزالة من الصفحة الرئيسية" : "تثبيت في الصفحة الرئيسية"}
                >
                  <BadgeCheck className="w-5 h-5" />
                </button>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 bg-surface p-4 rounded-2xl border border-outline-variant/20 shadow-sm">
              <button 
                disabled={listingsPage === 1}
                onClick={() => setListingsPage(p => Math.max(1, p - 1))}
                className="p-2 bg-surface-container-high rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
              >
                <ChevronLeft className="w-5 h-5 rotate-180" />
              </button>
              
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (page === 1 || page === totalPages || (page >= listingsPage - 1 && page <= listingsPage + 1)) {
                    return (
                      <button
                        key={page}
                        onClick={() => setListingsPage(page)}
                        className={`w-10 h-10 rounded-xl font-bold text-sm transition-all border ${
                          listingsPage === page 
                          ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20 scale-110' 
                          : 'bg-surface-container-low text-on-surface-variant border-transparent hover:border-primary/30'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === listingsPage - 2 || page === listingsPage + 2) {
                    return <span key={page} className="text-on-surface-variant/40 font-black">...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                disabled={listingsPage === totalPages}
                onClick={() => setListingsPage(p => Math.min(totalPages, p + 1))}
                className="p-2 bg-surface-container-high rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          )}

          {filteredAnnouncements.length === 0 && (
            <div className="p-12 text-center bg-surface rounded-2xl border border-dashed border-outline-variant/50">
              <Tag className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
              <p className="text-on-surface-variant font-bold">لا توجد إعلانات حالياً</p>
            </div>
          )}
        </div>
      ) : null}

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
      {/* Offers Modal */}
      {showOffersModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" style={{ direction: 'rtl' }}>
          <div className="bg-surface w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-lg">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-on-surface">عروض الكسابة</h3>
                  <p className="text-xs text-on-surface-variant font-bold mt-0.5">للمزاد: {viewingAuctionTitle}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowOffersModal(false)}
                className="p-3 bg-surface-container-high text-on-surface-variant hover:text-red-600 rounded-2xl transition-all hover:rotate-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {selectedAuctionOffers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedAuctionOffers.map((offer: any) => (
                    <div key={offer.id} className="bg-surface-container-low p-5 rounded-3xl border border-outline-variant/30 hover:shadow-md transition-shadow group relative overflow-hidden text-right">
                      <div className="absolute top-0 right-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                            {offer.sellerName?.[0] || 'ك'}
                          </div>
                          <div className="text-right">
                            <p className="font-black text-on-surface text-sm">{offer.sellerName}</p>
                            <p className="text-[10px] text-on-surface-variant font-bold">{offer.sellerCity}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-primary">{offer.price} درهم</p>
                          <p className="text-[9px] text-on-surface-variant font-bold">{offer.createdAt?.toDate?.()?.toLocaleDateString() || 'اليوم'}</p>
                        </div>
                      </div>
                      <p className="text-xs text-on-surface-variant font-medium leading-relaxed mb-4 line-clamp-3">
                        {offer.description || 'لا يوجد وصف إضافي للعرض'}
                      </p>
                      <div className="flex items-center gap-2 pt-4 border-t border-outline-variant/10">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${
                          offer.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                          offer.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-violet-100 text-violet-700'
                        }`}>
                          {offer.status === 'accepted' ? 'مقبول' : offer.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                        </span>
                        <div className="flex-1" />
                        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4 text-on-surface-variant/20">
                    <History className="w-8 h-8" />
                  </div>
                  <p className="text-on-surface-variant font-black">لا توجد عروض مقدمة لهذا المزاد بعد</p>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-surface-container-low border-t border-outline-variant/10">
              <button 
                onClick={() => setShowOffersModal(false)}
                className="w-full py-4 bg-primary text-on-primary rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:translate-y-[-2px] transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    );
  };

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
            compressed = await compressImage(base64, 800, 800, 0.6);
          } else {
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
            <p className="text-on-surface-variant text-sm mt-1">قم بتخصيص بانرات الواجهة الرئيسية لكل جهاز على حدة.</p>
          </div>
          <div className="bg-primary/10 text-primary p-3 rounded-2xl">
            <Megaphone className="w-6 h-6" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((num) => {
            const index = num as 1 | 2 | 3;
            const currentTab = activeBannerTab[index] || 'desktop';
            const isDesktop = currentTab === 'desktop';
            const key = (isDesktop ? `banner${index}` : `banner${index}Mobile`) as keyof NonNullable<typeof settings.banners>;
            const enabledKey = (isDesktop ? `banner${index}DesktopEnabled` : `banner${index}MobileEnabled`) as keyof NonNullable<typeof settings.banners>;
            const urlKey = `banner${index}Url` as keyof NonNullable<typeof settings.banners>;
            
            return (
              <div key={num} className="bg-surface rounded-3xl p-6 border border-outline-variant/30 shadow-lg space-y-6 flex flex-col">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-lg">البانر {num}</h3>
                  <div className="flex bg-surface-container-high p-1 rounded-xl shadow-inner">
                    <button 
                      onClick={() => setActiveBannerTab(prev => ({ ...prev, [index]: 'desktop' }))}
                      className={`p-1.5 rounded-lg transition-all ${isDesktop ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                      title="نسخة الحاسوب"
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setActiveBannerTab(prev => ({ ...prev, [index]: 'mobile' }))}
                      className={`p-1.5 rounded-lg transition-all ${!isDesktop ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                      title="نسخة الهاتف"
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-2 py-2 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                  <span className="text-[10px] font-black text-on-surface-variant">تفعيل على {isDesktop ? 'الحاسوب' : 'الهاتف'}</span>
                  <button 
                    onClick={() => {
                      updateSettings({
                        banners: {
                          ...banners,
                          [enabledKey]: banners[enabledKey] === false ? true : false
                        }
                      });
                    }}
                    className={`w-10 h-5 rounded-full relative transition-all ${banners[enabledKey] !== false ? 'bg-primary' : 'bg-surface-variant border border-outline'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full absolute top-[2px] bg-white transition-all ${banners[enabledKey] !== false ? 'left-[2px]' : 'right-[2px]'}`}></div>
                  </button>
                </div>
                
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                      {isDesktop ? 'نسخة الحاسوب (2400x448)' : 'نسخة الهاتف (1:1)'}
                    </span>
                    {banners[key] && (
                      <button 
                        onClick={async () => {
                          if (window.confirm(`حذف نسخة ${isDesktop ? 'الحاسوب' : 'الهاتف'}؟`)) {
                            await updateSettings({ 
                              banners: { 
                                [key]: deleteField() 
                              } 
                            });
                          }
                        }}
                        className="text-[10px] font-bold text-error hover:underline"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                  
                  <div className={`relative rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/20 flex items-center justify-center group shadow-inner flex-1 min-h-[120px] ${!isDesktop ? 'aspect-square max-w-[180px] mx-auto' : 'aspect-[24/5]'}`}>
                    {banners[key] ? (
                      <img src={banners[key]} alt={`Banner ${num}`} className="w-full h-full object-cover" />
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
                          if (file) handleBannerUpload(index, file, !isDesktop);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mr-1">رابط الإعلان (يفتح عند الضغط)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/40" />
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
                      className="w-full p-3 pl-10 bg-surface-container-low border border-outline-variant/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-xs font-bold shadow-sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex items-center gap-5">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-black text-on-surface text-lg">تحكم ذكي في المحتوى</h4>
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed">بفضل التصميم الجديد، يمكنك الآن رفع صور مخصصة للهواتف (1:1) وصور عريضة للحواسيب (2400x448) لنفس البانر لضمان أفضل تجربة مستخدم على جميع الأجهزة.</p>
          </div>
        </div>
      </div>
    );
  };

  const renderLogs = () => (
    <div className="space-y-6">
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



  const renderProfile = () => {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-on-surface font-headline">ملفي الشخصي</h2>
            <p className="text-on-surface-variant text-sm mt-1">تعديل معلوماتك الشخصية، كلمة المرور وتفضيلات الحساب.</p>
          </div>
          <div className="bg-primary/10 text-primary p-3 rounded-2xl">
            <User className="w-6 h-6" />
          </div>
        </div>

        {(profileSuccess || profileError) && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 duration-200 ${profileSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {profileSuccess ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="font-bold text-sm">{profileSuccess || profileError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Summary */}
          <div className="space-y-6">
            <div className="bg-surface rounded-3xl p-8 border border-outline-variant/30 shadow-sm flex flex-col items-center">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-surface-container-low ring-1 ring-outline-variant/20">
                  {newPhotoURL ? (
                    <img src={newPhotoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                      <User className="w-12 h-12 opacity-30" />
                    </div>
                  )}
                  {isPhotoUploading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2.5 bg-primary text-on-primary rounded-full shadow-lg cursor-pointer transform transition-transform hover:scale-110 active:scale-95 border-2 border-white">
                  <Camera className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isPhotoUploading} />
                </label>
              </div>
              <h3 className="mt-6 font-black text-lg text-on-surface">{newDisplayName || 'مستخدم كسابكوم'}</h3>
              <p className="text-on-surface-variant text-sm font-bold">{user?.email}</p>
              <div className="mt-4 px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-wider">مدير النظام</div>
            </div>

            <div className="bg-surface rounded-3xl p-6 border border-outline-variant/30 shadow-sm">
              <h4 className="font-black text-sm text-on-surface mb-6 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                معلومات الحساب
              </h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-on-surface-variant" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase">البريد الإلكتروني</p>
                    <p className="text-sm font-medium text-on-surface">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-on-surface-variant" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase">الدور</p>
                    <p className="text-sm font-medium text-on-surface">مسؤول بجميع الصلاحيات</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-on-surface-variant" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase">عضو منذ</p>
                    <p className="text-sm font-medium text-on-surface">
                      {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('ar-MA') : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Forms & Preferences */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Details Form */}
            <div className="bg-surface rounded-3xl p-8 border border-outline-variant/30 shadow-sm">
              <h4 className="font-black text-lg text-on-surface mb-8 flex items-center gap-3">
                <Settings className="w-5 h-5 text-primary" />
                المعلومات الأساسية
              </h4>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-on-surface-variant mr-1">الاسم الكامل</label>
                    <div className="relative">
                      <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                      <input 
                        type="text" 
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                        className="w-full pr-12 pl-4 py-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-on-surface-variant mr-1">الصورة الشخصية (رابط)</label>
                    <div className="relative">
                      <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                      <input 
                        type="url" 
                        value={newPhotoURL}
                        onChange={(e) => setNewPhotoURL(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full pr-12 pl-4 py-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button 
                    type="submit" 
                    disabled={profileLoading}
                    className="px-8 py-4 bg-primary text-on-primary rounded-2xl font-black text-sm shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    حفظ التعديلات
                  </button>
                </div>
              </form>
            </div>

            {/* Password Change Form */}
            <div className="bg-surface rounded-3xl p-8 border border-outline-variant/30 shadow-sm">
              <h4 className="font-black text-lg text-on-surface mb-8 flex items-center gap-3">
                <Lock className="w-5 h-5 text-primary" />
                تغيير كلمة المرور
              </h4>
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-on-surface-variant mr-1">كلمة المرور الحالية</label>
                  <div className="relative">
                    <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pr-12 pl-4 py-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-bold"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-on-surface-variant mr-1">كلمة المرور الجديدة</label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pr-12 pl-4 py-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-bold"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-on-surface-variant mr-1">تأكيد كلمة المرور</label>
                    <div className="relative">
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pr-12 pl-4 py-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-bold"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button 
                    type="submit" 
                    disabled={profileLoading}
                    className="px-8 py-4 bg-primary text-on-primary rounded-2xl font-black text-sm shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    تحديث كلمة المرور
                  </button>
                </div>
              </form>
            </div>

            {/* Relevant Preferences */}
            <div className="bg-surface rounded-3xl p-8 border border-outline-variant/30 shadow-sm">
              <h4 className="font-black text-lg text-on-surface mb-8 flex items-center gap-3">
                <Zap className="w-5 h-5 text-primary" />
                تفضيلات لوحة التحكم
              </h4>
              <div className="space-y-4">
                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-on-surface">لغة الواجهة</p>
                      <p className="text-[10px] text-on-surface-variant font-bold">اختر لغة عرض لوحة التحكم</p>
                    </div>
                  </div>
                  <select 
                    value={prefLanguage}
                    onChange={(e) => {
                      setPrefLanguage(e.target.value);
                      setProfileSuccess('سيتم تطبيق اللغة في التحديث القادم');
                    }}
                    className="bg-white border border-outline-variant/30 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="ar">العربية (المغرب)</option>
                    <option value="fr">Français</option>
                  </select>
                </div>

                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-on-surface">تنبيهات الإشعارات</p>
                      <p className="text-[10px] text-on-surface-variant font-bold">تفعيل صوت الإشعارات عند وصول تبليغ جديد</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPrefNotifications(!prefNotifications)}
                    className={`w-12 h-6 rounded-full relative transition-all border-2 ${prefNotifications ? 'bg-primary border-primary' : 'bg-transparent border-on-surface-variant/30'}`}
                  >
                    <div 
                      className={`absolute top-[1px] w-4 h-4 rounded-full transition-all ${prefNotifications ? 'bg-white right-[2px]' : 'bg-on-surface-variant/50 right-[22px]'}`}
                    ></div>
                  </button>
                </div>

                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-on-surface">الوضع المكثف (Compact Mode)</p>
                      <p className="text-[10px] text-on-surface-variant font-bold">تقليل المساحات البيضاء لعرض معلومات أكثر</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPrefCompactMode(!prefCompactMode)}
                    className={`w-12 h-6 rounded-full relative transition-all border-2 ${prefCompactMode ? 'bg-primary border-primary' : 'bg-transparent border-on-surface-variant/30'}`}
                  >
                    <div 
                      className={`absolute top-[1px] w-4 h-4 rounded-full transition-all ${prefCompactMode ? 'bg-white right-[2px]' : 'bg-on-surface-variant/50 right-[22px]'}`}
                    ></div>
                  </button>
                </div>

                <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10 flex items-center justify-between opacity-50 cursor-not-allowed">

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-on-surface">الوضع الداكن (Dark Mode)</p>
                      <p className="text-[10px] text-on-surface-variant font-bold">قريباً في التحديث القادم</p>
                    </div>
                  </div>
                  <div className="bg-surface px-2 py-1 rounded text-[8px] font-black uppercase text-on-surface-variant">Soon</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                src={logoV2} 
                alt="منصة kessabcom.ma" 
                className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105"
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
              onClick={() => setActiveTab('support_requests')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors border ${activeTab === 'support_requests' ? 'bg-primary-container text-on-primary-container border-primary shadow-sm hover:bg-transparent hover:text-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              <Shield className="w-5 h-5 text-blue-600" />
              {supportRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {supportRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
              <span>الطلبات</span>
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
              onClick={() => setActiveTab('reviews')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors border ${activeTab === 'reviews' ? 'bg-primary-container text-on-primary-container border-primary shadow-sm' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              <Star className="w-5 h-5" />
              <span>التعليقات والمراجعة</span>
            </button>
            <button 
              onClick={() => setActiveTab('ads')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors border ${activeTab === 'ads' ? 'bg-primary-container text-on-primary-container border-primary shadow-sm hover:bg-transparent hover:text-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              <Megaphone className="w-5 h-5" />
              <span>الإعلانات الترويجية</span>
            </button>
            <button 
              onClick={() => setActiveTab('stock-market')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors border ${activeTab === 'stock-market' ? 'bg-primary-container text-on-primary-container border-primary shadow-sm hover:bg-transparent hover:text-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              <TrendingUp className="w-5 h-5" />
              <span>بورصة الأغنام</span>
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors border ${activeTab === 'stats' ? 'bg-primary-container text-on-primary-container border-primary shadow-sm hover:bg-transparent hover:text-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              <Database className="w-5 h-5" />
              <span>إحصائيات المنصة</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors border ${activeTab === 'settings' ? 'bg-primary-container text-on-primary-container border-primary shadow-sm hover:bg-transparent hover:text-primary' : 'text-on-surface-variant border-transparent hover:border-on-surface-variant'}`}
            >
              <Settings className="w-5 h-5" />
              <span>الإعدادات</span>
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

        <div className={`${prefCompactMode ? 'p-4 md:p-5' : 'p-6 md:p-8'} max-w-7xl mx-auto w-full transition-all duration-300`}>

          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'stats' && renderStats()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'listings' && renderListings()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'support_requests' && renderSupportRequests()}
              {activeTab === 'reviews' && <ReviewsModerationView />}
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
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'notifications' && <Notifications onNavigate={onNavigate} hideHeader={true} />}
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
                                  youtubeLink: find(['رابط فيديو يوتيوب', 'youtube', 'youtubeUrl']),
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

                    <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-primary/20">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm text-primary">تفعيل نظام المزاد (Auction)</h4>
                        <p className="text-[10px] text-on-surface-variant">يسمح للمشترين بتقديم عروض أسعار تنافسية على الإعلانات</p>
                      </div>
                      <div 
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.auctionSystemEnabled ? 'bg-primary' : 'bg-surface-variant'}`}
                        onClick={() => updateSettings({ auctionSystemEnabled: !settings.auctionSystemEnabled })}
                      >
                        <div className={`w-4 h-4 rounded-full absolute top-0.5 shadow-sm transition-all ${settings.auctionSystemEnabled ? 'bg-on-primary left-0.5' : 'bg-surface right-0.5'}`}></div>
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

                    {!settings.paymentSystemEnabled && (
                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10 animate-in slide-in-from-top-1">
                        <div>
                          <h4 className="font-bold text-on-surface text-sm text-primary">أقصى عدد من الإعلانات للمستخدم المجاني</h4>
                          <p className="text-[10px] text-on-surface-variant">الحد الأقصى للإعلانات النشطة لكل كساب في حالة تعطل نظام الدفع</p>
                        </div>
                        <input 
                          type="number" 
                          className="w-20 bg-white border border-outline-variant/30 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary font-bold text-center"
                          value={settings.maxListingsPerFreeUser || 5}
                          onChange={(e) => updateSettings({ maxListingsPerFreeUser: Number(e.target.value) })}
                        />
                      </div>
                    )}
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
                    <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-primary/20">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm text-primary">وصول الزوار (بدون تسجيل الدخول)</h4>
                        <p className="text-[10px] text-on-surface-variant">السماح للزوار بتصفح الإعلانات والاتصال بالبائعين دون الحاجة لحساب</p>
                      </div>
                      <div 
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${settings.guestBuyerMode ? 'bg-primary' : 'bg-surface-variant'}`}
                        onClick={() => updateSettings({ guestBuyerMode: !settings.guestBuyerMode })}
                      >
                        <div className={`w-4 h-4 rounded-full absolute top-0.5 shadow-sm transition-all ${settings.guestBuyerMode ? 'bg-on-primary left-0.5' : 'bg-surface right-0.5'}`}></div>
                      </div>
                    </div>

                    {/* Max Home Listings */}
                    <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-primary/20">
                      <div>
                        <h4 className="font-bold text-on-surface text-sm text-primary">عدد الإعلانات في الصفحة الرئيسية</h4>
                        <p className="text-[10px] text-on-surface-variant">الحد الأقصى لعدد الإعلانات المعروضة في كل مدينة على الصفحة الرئيسية (الحد الأقصى: 12)</p>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        className="w-16 bg-white border border-outline-variant/30 rounded-lg px-2 py-1 text-sm font-black outline-none text-center focus:ring-2 focus:ring-primary"
                        value={settings.maxHomeListings ?? 6}
                        onChange={(e) => updateSettings({ maxHomeListings: Math.min(12, Math.max(1, Number(e.target.value))) })}
                      />
                    </div>

                    {/* Listing limit when payment is disabled */}
                    {!settings.paymentSystemEnabled && (
                      <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-primary/20">
                        <div>
                          <h4 className="font-bold text-on-surface text-sm text-primary">أقصى عدد للإعلانات لكل مستخدم</h4>
                          <p className="text-[10px] text-on-surface-variant">عندما يكون نظام الدفع معطلاً، هذا هو الحد الأقصى للإعلانات التي يمكن لكل كساب نشرها.</p>
                        </div>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className="w-16 bg-white border border-outline-variant/30 rounded-lg px-2 py-1 text-sm font-black outline-none text-center focus:ring-2 focus:ring-primary"
                          value={settings.maxListingsPerFreeUser ?? 5}
                          onChange={(e) => updateSettings({ maxListingsPerFreeUser: Math.max(1, Number(e.target.value)) })}
                        />
                      </div>
                    )}
                  </div>
                </div>
                )}

                {settingsTab === 'security' && (
                  <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4 max-w-3xl mx-auto">

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
                        <button 
                          onClick={() => {
                            const headers = "Nom Complet,Numéro de téléphone,Ville,موقع الضيعة (مثل 33.55, -7.64),الصور (روابط مفصولة بـ ;),الفيديو (رابط MP4 أو YouTube),رابط فيديو يوتيوب,عدد رؤوس الغنم المتوفرة,أقل ثمن كيبدا من,السن,حجم الحولي,سلالة الغنم,وصف إضافي,Audio (رابط MP3)";
                            const row = "\nJohn Doe,212600000000,سطات,\"33.55, -7.64\",https://example.com/img1.jpg;https://example.com/img2.jpg,,https://youtube.com/watch?v=123,10,2500,ثني,كبير,سردي,وصف تجريبي,";
                            const blob = new Blob([headers + row], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.setAttribute("href", url);
                            link.setAttribute("download", "sample_kessabcom.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="mt-2 flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black hover:bg-primary/20 transition-all border border-primary/20"
                        >
                          <Download className="w-3 h-3" />
                          تحميل ملف CSV تجريبي (Sample)
                        </button>
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
                          خانة <code dir="ltr">sellerId</code> اختيارية. إلا خليتيها خاوية، النظام غادي يتكلف ويكري حساب (Firebase Auth & Profile) لكل كساب جديد بشكل تلقائي بناءً على رقم التيليفون ديالو.
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-surface rounded-[2.5rem] max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-outline-variant/20">
              <div className="relative h-32 bg-gradient-to-l from-primary to-primary-container">
                <button 
                  onClick={() => setShowStatsModal(false)}
                  className="absolute top-6 left-6 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="px-8 pb-8 -mt-12 text-right">
                <div className="flex items-end justify-between mb-8">
                  <div className="w-24 h-24 rounded-3xl bg-surface border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                    {selectedUser.photoURL ? (
                      <img src={selectedUser.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-black text-primary">{selectedUser.displayName?.[0] || 'U'}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black shadow-sm ${selectedUser.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {selectedUser.status === 'blocked' ? 'محظور' : 'نشط'}
                    </span>
                    <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black shadow-sm">
                      {selectedUser.plan || 'حساب عادي'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-black text-on-surface mb-1">{selectedUser.displayName || selectedUser.name}</h2>
                      <p className="text-on-surface-variant font-bold text-sm">{selectedUser.email}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div className="text-right flex-1">
                          <p className="text-[10px] font-black text-on-surface-variant uppercase">رقم الهاتف</p>
                          <p className="text-sm font-black text-on-surface" dir="ltr">{selectedUser.phone || 'غير مسجل'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="text-right flex-1">
                          <p className="text-[10px] font-black text-on-surface-variant uppercase">الموقع</p>
                          <p className="text-sm font-black text-on-surface">{selectedUser.location || selectedUser.city || 'غير محدد'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'عدد الإعلانات', value: selectedUser.herdsCount || 0, icon: <Tag className="w-5 h-5" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                      { label: 'إجمالي المشاهدات', value: selectedUser.visitsCount || 0, icon: <Eye className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { label: 'عضو منذ', value: selectedUser.createdAt?.toDate?.()?.getFullYear() || '2024', icon: <Calendar className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
                      { label: 'التقييم', value: '4.8/5', icon: <Star className="w-5 h-5" />, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    ].map((card, i) => (
                      <div key={i} className="p-4 bg-surface-container-low rounded-3xl border border-outline-variant/10 flex flex-col items-center justify-center text-center">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 ${card.bg} ${card.color}`}>
                          {card.icon}
                        </div>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase mb-1">{card.label}</p>
                        <p className="text-base font-black text-on-surface">{card.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowStatsModal(false)}
                    className="flex-1 py-4 bg-surface-container-high text-on-surface font-black rounded-2xl transition-all hover:bg-surface-container-highest"
                  >
                    إغلاق
                  </button>
                  <button 
                    className="flex-1 py-4 bg-primary text-on-primary font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    تعديل البيانات
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showDeleteSupportConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-surface w-full max-w-md rounded-3xl p-8 shadow-2xl border border-outline-variant/20 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-on-surface text-center mb-4 font-headline">واش بصح بغيتي تمسح هاد الطلب؟</h3>
              <p className="text-on-surface-variant text-center mb-8 font-medium">
                هاد العملية ما يمكنش ترجع فيها. واش متأكد؟
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowDeleteSupportConfirm(false)}
                  className="py-4 bg-surface-container-high text-on-surface font-bold rounded-2xl transition-colors border border-transparent hover:bg-transparent hover:text-on-surface hover:border-on-surface"
                >
                  إلغاء
                </button>
                <button 
                  onClick={async () => {
                    if (supportRequestToDelete) {
                      try {
                        await firestoreService.adminDeleteSupportRequest(supportRequestToDelete);
                        fetchAdminData();
                        setShowDeleteSupportConfirm(false);
                        setSupportRequestToDelete(null);
                      } catch (error) {
                        console.error("Failed to delete support request:", error);
                      }
                    }
                  }}
                  className="py-4 bg-red-600 text-white font-bold rounded-2xl transition-colors border border-transparent hover:bg-transparent hover:text-red-600 hover:border-red-600 shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                >
                  نعم، مسح الطلب
                </button>
              </div>
            </div>
          </div>
        )}
      </main>


    </div>
  );
}
