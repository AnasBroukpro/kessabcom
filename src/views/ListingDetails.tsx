import React, { useState, useRef } from 'react';
import { ViewType } from '../App';
import { MapPin, Phone, MessageCircle, Navigation, Star, ArrowLeft, BadgeCheck, Play, Heart, AlertTriangle, X, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SearchHeader from '../components/SearchHeader';
import { firestoreService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { cityMapping, getDisplayCity } from '../constants/cityMapping';
import ContactSellerModal from '../components/ContactSellerModal';
import LoginRequiredModal from '../components/LoginRequiredModal';
import { useSettings } from '../hooks/useSettings';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string, breed?: string) => void;
  listingId?: string;
}

export default function ListingDetails({ onNavigate, listingId }: Props) {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [listing, setListing] = useState<any>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMedia, setActiveMedia] = useState<{ type: 'video' | 'image', url: string } | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedSellerPhone, setSelectedSellerPhone] = useState<string | undefined>();
  const [selectedSellerWhatsapp, setSelectedSellerWhatsapp] = useState<string | undefined>();
  const [selectedListingId, setSelectedListingId] = useState<string | undefined>();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<'details' | 'location' | 'reviews'>('details');

  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [relatedListings, setRelatedListings] = useState<any[]>([]);

  const RelatedListingCard = ({ relatedListing }: { relatedListing: any }) => (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 hover:shadow-xl transition-all duration-300 group cursor-pointer h-full flex flex-col" onClick={() => onNavigate('listing-details', relatedListing.id)}>
      <div className="relative h-48 sm:h-64 overflow-hidden shrink-0">
        <img alt={relatedListing.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={relatedListing.images?.[0] || "https://images.unsplash.com/photo-1511117833895-4b473c0b85d6?auto=format&fit=crop&q=80&w=800"} referrerPolicy="no-referrer" />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-[#1A1A1A] px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-sm">
          {relatedListing.category || 'أغنام'}
        </div>
        {!settings.guestBuyerMode && (
          <button className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur rounded-full text-[#757575] hover:text-red-500 transition-colors shadow-sm">
            <Heart className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[#2E7D32] font-bold text-sm sm:text-base truncate">{relatedListing.title}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex gap-1 text-[8px] sm:text-[10px] font-bold text-[#4A4A4A]">
                {relatedListing.sizes?.slice(0, 2).map((size: string, idx: number) => (
                  <span key={idx} className="bg-[#F9F9F6] px-1.5 py-0.5 rounded border border-outline-variant/10 whitespace-nowrap">
                    {size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : size === 'large' ? 'كبير' : size === 'extra-large' ? 'كبير جداً' : size}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[#757575] text-xs font-bold truncate">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {(() => {
                  const dist = relatedListing.distance || 0;
                  const city = getDisplayCity(relatedListing);
                  
                  if (dist < 5) return `${city} (قريب ليك)`;
                  if (dist < 25) return `${city} (على بعد ${Math.round(dist)} كلم)`;
                  if (dist < 80) return `${city} (بعيد شوية، ${Math.round(dist)} كلم)`;
                  return `${city} (بعيد)`;
                })()}
              </span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0" dir="ltr">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${i < (relatedListing.rating || 5) ? 'fill-[#FFC107] text-[#FFC107]' : 'text-[#D1D1D1]'}`} />
              ))}
              {relatedListing.ratingCount > 0 && (
                <span className="text-[8px] sm:text-[10px] text-on-surface-variant font-bold ml-1">({relatedListing.ratingCount})</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 border-t border-outline-variant/20 pt-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSellerPhone(relatedListing.phone);
                setSelectedSellerWhatsapp(relatedListing.whatsapp);
                setSelectedListingId(relatedListing.id);
                setContactModalOpen(true);
              }}
              className="py-2 sm:py-2.5 bg-[#2E7D32] text-white font-bold rounded-lg transition-colors border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] text-[10px] sm:text-xs"
            >
              تواصل
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (!settings.guestBuyerMode && !profile) {
                  setLoginModalOpen(true);
                } else {
                  onNavigate('listing-details', relatedListing.id);
                  window.scrollTo(0, 0);
                }
              }}
              className="py-2 sm:py-2.5 bg-[#1A1A1A] text-white font-bold rounded-lg transition-colors border border-transparent hover:bg-white hover:text-[#1A1A1A] hover:border-[#1A1A1A] text-[10px] sm:text-xs"
            >
              التفاصيل
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  React.useEffect(() => {
    if (listingId) {
      const fetchListing = async () => {
        try {
          const docRef = await firestoreService.getAnnouncement(listingId) as any;
          if (docRef) {
            setListing(docRef);
            if (docRef.videoUrl || docRef.youtubeLink) {
              setActiveMedia({ type: 'video', url: docRef.videoUrl || docRef.youtubeLink });
            } else if (docRef.images && docRef.images.length > 0) {
              setActiveMedia({ type: 'image', url: docRef.images[0] });
            }
            
            // Bug #12 FIX: fetch seller profile + related listings in parallel (was sequential N+1)
            const [sellerProfileData, relatedRaw] = await Promise.all([
              docRef.sellerId
                ? firestoreService.getPublicProfile(docRef.sellerId)
                : Promise.resolve(null),
              firestoreService.getAnnouncements(docRef.category)
            ]);

            if (sellerProfileData) {
              setSellerProfile(sellerProfileData);
              // If user is logged in, check if they have a review and pre-fill
              if (user) {
                const existingReview = (sellerProfileData as any).reviews?.find((r: any) => r.userId === user.uid);
                if (existingReview) {
                  setNewReviewRating(existingReview.rating);
                  setNewReviewComment(existingReview.comment);
                }
              }
            }

            if (relatedRaw) {
              const relatedArr = Array.isArray(relatedRaw)
                ? relatedRaw
                : ((relatedRaw as any).data ?? []);
              setRelatedListings(relatedArr.filter((l: any) => l.id !== listingId).slice(0, 3));
            }
          }
        } catch (error) {
          console.error("Error fetching listing:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchListing();
      // Real Statistics: Increment view on mount
      firestoreService.incrementView(listingId);
    } else {
      setLoading(false);
    }
  }, [listingId]);

  const images = [
    "https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&q=80&w=1600",
    "https://images.unsplash.com/photo-1511117833895-4b473c0b85d6?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1605001067030-2b1f1d79817a?auto=format&fit=crop&q=80&w=800"
  ];

  const reportReasons = [
    "معلومات خاطئة",
    "ثمن غير حقيقي",
    "صور غير لائقة",
    "كساب غير جدي",
    "أخرى"
  ];

  const handleReport = async () => {
    if (!reportReason || !listingId) return;
    setIsReporting(true);
    try {
      await firestoreService.createReport({
        announcementId: listingId,
        reporterId: user?.uid || 'anonymous',
        reason: reportReason,
        timestamp: new Date().toISOString()
      });
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
        setReportReason('');
      }, 2000);
    } catch (error) {
      console.error("Failed to report:", error);
    } finally {
      setIsReporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#2E7D32]/30 border-t-[#2E7D32] rounded-full animate-spin"></div>
          <p className="font-bold text-[#2E7D32]">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-4 text-center" dir="rtl">
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black mb-2">الإعلان ما بقاش متوفر</h2>
        <p className="text-[#757575] mb-6">هاد الإعلان يقدر يكون تمسح ولا الرابط غلط.</p>
        <button 
          onClick={() => onNavigate('home')}
          className="bg-[#2E7D32] text-white px-8 py-3 rounded-xl font-bold transition-colors border border-transparent hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32] shadow-lg"
        >
          رجوع للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans" dir="rtl">
      <SearchHeader onNavigate={onNavigate} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Right Column - Sticky Contact Info (Swapped to Right) */}
          <div className="lg:col-span-1 order-1 lg:order-1">
            <div className="sticky top-28 space-y-6">
              
              {/* Seller Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    {sellerProfile?.photoURL ? (
                      <img 
                        src={sellerProfile.photoURL} 
                        alt="الكساب" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center border-2 border-white shadow-sm">
                        <User className="w-8 h-8 text-[#2E7D32]" />
                      </div>
                    )}
                    {sellerProfile?.isCertified && (
                      <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5">
                        <BadgeCheck className="w-5 h-5 text-[#2E7D32] fill-current" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#1A1A1A]">
                      {(() => {
                        const name = sellerProfile?.fullName || sellerProfile?.displayName || listing?.sellerName;
                        if (!name || name.toLowerCase() === 'user') return 'كساب';
                        return name;
                      })()}
                    </h3>
                    {sellerProfile?.isCertified ? (
                      <p className="text-[10px] text-[#2E7D32] font-bold mb-1">
                        كساب معتمد فـ منصة kessabcom.ma
                      </p>
                    ) : (
                      <p className="text-sm text-[#2E7D32] font-bold mb-1">كساب</p>
                    )}
                    {sellerProfile?.reviewsCount > 0 && (
                      <div className="flex items-center gap-1 text-sm font-bold text-[#1A1A1A]">
                        <Star className="w-4 h-4 text-[#FF9800] fill-current" />
                        <span>{(sellerProfile?.rating || 5).toFixed(1)}</span>
                        <span className="text-[#757575] font-normal">({sellerProfile?.reviewsCount} تقييم)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#F9F9F6] p-3 rounded-xl text-center mb-6">
                  <p className="text-[11px] text-[#4A4A4A] font-medium whitespace-nowrap overflow-hidden text-ellipsis">الثمن على حساب التفاهم، اتصل بالكساب مباشرة باش تعرف التفاصيل</p>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      setSelectedSellerPhone(sellerProfile?.phoneNumber || listing?.phone);
                      setSelectedSellerWhatsapp(sellerProfile?.whatsappNumber || listing?.whatsapp);
                      setSelectedListingId(listing?.id);
                      setContactModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-[#2E7D32] text-white py-4 rounded-xl font-bold transition-colors border border-transparent hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32] shadow-lg shadow-[#2E7D32]/20"
                  >
                    <Phone className="w-5 h-5" />
                    <span>تواصل مع الكساب</span>
                  </button>
                  
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className="w-full flex items-center justify-center gap-2 text-red-600 py-3 rounded-xl font-bold transition-colors border border-transparent hover:border-red-600"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>تبليغ عن هذه الإعلان</span>
                  </button>
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/10">
                <div className="mb-6 rounded-xl overflow-hidden border border-outline-variant/20 bg-gray-100 aspect-video relative">
                  {listing?.coordinates ? (
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${listing.coordinates.lat},${listing.coordinates.lng}&z=15&output=embed`}
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#757575] bg-[#F9F9F6]">
                      <MapPin className="w-8 h-8 mb-2 opacity-20" />
                      <span className="text-[10px] font-bold">خريطة الموقع</span>
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-3 mb-6">
                  <div className="p-2 bg-[#E8F5E9] rounded-full text-[#2E7D32] shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-[#757575] mb-1 font-medium">موقع الضيعة</p>
                    <p className="font-bold text-[#1A1A1A]">
                      {listing?.farmLocation || getDisplayCity(listing)}
                    </p>
                  </div>
                </div>
                {listing?.coordinates ? (
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${listing.coordinates.lat},${listing.coordinates.lng}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={() => firestoreService.incrementContactClick(listing.id, 'location')}
                    className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] text-white py-4 rounded-xl font-bold transition-colors border border-transparent hover:bg-transparent hover:text-[#1A1A1A] hover:border-[#1A1A1A]"
                  >
                    <Navigation className="w-5 h-5" />
                    <span>طريق الضيعة (GPS)</span>
                  </a>
                ) : listing?.location ? (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.location)}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={() => firestoreService.incrementContactClick(listing.id, 'location')}
                    className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] text-white py-4 rounded-xl font-bold transition-colors border border-transparent hover:bg-transparent hover:text-[#1A1A1A] hover:border-[#1A1A1A]"
                  >
                    <Navigation className="w-5 h-5" />
                    <span>طريق الضيعة (GPS)</span>
                  </a>
                ) : null}
              </div>

            </div>
          </div>

          {/* Left Column - Main Content (Swapped to Left) */}
          <div className="lg:col-span-2 space-y-8 order-2 lg:order-2">
            
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] md:aspect-[16/10] rounded-2xl overflow-hidden bg-black shadow-lg">
                {!activeMedia ? (
                  <div className="w-full h-full flex items-center justify-center bg-surface-container-low">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  </div>
                ) : activeMedia.type === 'video' ? (
                  activeMedia.url.includes('youtube.com') || activeMedia.url.includes('youtu.be') ? (
                    <iframe 
                      src={activeMedia.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video src={activeMedia.url} controls className="w-full h-full object-contain" />
                  )
                ) : (
                  <img 
                    src={activeMedia.url} 
                    alt="صورة الحولي" 
                    className="w-full h-full object-cover animate-in fade-in duration-500"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute top-4 right-4 bg-[#2E7D32] text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md z-10 flex items-center gap-1">
                  <span>ثمن كيبدا من:</span>
                  <span>{listing?.price || '---'} درهم</span>
                </div>
              </div>
              
              <div className="p-4 bg-white rounded-xl shadow-sm border border-outline-variant/10 mt-4">
                <p className="text-sm font-bold mb-2">قيم هاد الحولي:</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={async () => {
                      if (listing?.id) {
                        await firestoreService.rateAnnouncement(listing.id, star);
                        const updatedListing = await firestoreService.getAnnouncement(listing.id);
                        setListing(updatedListing);
                      }
                    }}>
                      <Star className={`w-6 h-6 ${star <= (listing?.rating || 5) ? 'text-[#FF9800] fill-current' : 'text-[#D1D1D1]'}`} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-4">
                {/* Video Thumbnail */}
                {(listing?.videoUrl || listing?.youtubeLink) && (
                  <div 
                    onClick={() => setActiveMedia({ type: 'video', url: listing?.videoUrl || listing?.youtubeLink })}
                    className={`aspect-square rounded-xl overflow-hidden bg-surface-variant cursor-pointer relative group border-2 transition-all ${activeMedia?.type === 'video' ? 'border-[#2E7D32]' : 'border-transparent'}`}
                  >
                    <div className="w-full h-full bg-black/50 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white fill-current" />
                    </div>
                  </div>
                )}

                {listing?.images?.map((img: string, idx: number) => (
                  <div 
                    key={idx}
                    onClick={() => setActiveMedia({ type: 'image', url: img })}
                    className={`aspect-square rounded-xl overflow-hidden bg-surface-variant cursor-pointer border-2 transition-all ${activeMedia?.type === 'image' && activeMedia?.url === img ? 'border-[#2E7D32]' : 'border-transparent hover:opacity-90'}`}
                  >
                    <img src={img} alt={`صورة مصغرة ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </div>

            {/* Title & Location */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-outline-variant/10">
              <h1 className="text-3xl font-black text-[#1A1A1A] mb-2 font-headline">
                {listing?.title?.split(' - ').map((part: string) => {
                  return part.split(', ').map((subPart: string) => {
                    const trimmed = subPart.trim();
                    if (trimmed === 'sardi') return 'سردي';
                    if (trimmed === 'bargui') return 'بركي';
                    if (trimmed === 'imported') return 'مستورد';
                    return subPart;
                  }).join('، ');
                }).join(' - ') || 'إعلان بدون عنوان'}
              </h1>
              <p className="text-[#2E7D32] font-bold text-xl mb-4">
                ضيعة {sellerProfile?.fullName || sellerProfile?.displayName || listing?.sellerName || 'كساب'}
              </p>
              <div className="flex items-center gap-2 text-[#4A4A4A] mb-6">
                <MapPin className="w-5 h-5 text-[#2E7D32]" />
                <span className="font-medium">
                  {listing?.farmLocation || getDisplayCity(listing)}
                </span>
              </div>
              
              {/* Tabs Navigation */}
              <div className="flex bg-[#F9F9F6] p-1 rounded-xl mb-8 border border-outline-variant/10">
                <button 
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-colors border ${activeTab === 'details' ? 'bg-white text-[#2E7D32] border-[#2E7D32] shadow-sm' : 'text-[#757575] border-transparent hover:border-[#757575]'}`}
                >
                  التفاصيل
                </button>
                <button 
                  onClick={() => setActiveTab('reviews')}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-colors border ${activeTab === 'reviews' ? 'bg-white text-[#2E7D32] border-[#2E7D32] shadow-sm' : 'text-[#757575] border-transparent hover:border-[#757575]'}`}
                >
                  تقييمات الكساب ({sellerProfile?.reviewsCount || 0})
                </button>
              </div>

              {/* Tab Content: Details */}
              {activeTab === 'details' && (
                <div className="animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#F9F9F6] p-4 rounded-2xl border border-outline-variant/10">
                      <p className="text-[10px] text-[#757575] mb-1">عدد الرؤوس</p>
                      <p className="font-bold text-[#1A1A1A]">{listing?.sheepCount || '---'} رأس</p>
                    </div>
                    <div className="bg-[#F9F9F6] p-4 rounded-2xl border border-outline-variant/10">
                      <p className="text-[10px] text-[#757575] mb-1">أقل ثمن</p>
                      <p className="font-bold text-[#2E7D32]">{listing?.price || '---'} درهم</p>
                    </div>
                    <div className="bg-[#F9F9F6] p-4 rounded-2xl border border-outline-variant/10">
                      <p className="text-[10px] text-[#757575] mb-1">السن (الأعمار)</p>
                      <p className="font-bold text-[#1A1A1A]">
                        {listing?.age?.split(', ').map((a: string) => {
                          const trimmed = a.trim();
                          if (trimmed === 'milk') return 'سنان الحليب';
                          if (trimmed === 'thni') return 'ثني';
                          if (trimmed === 'rba3i') return 'رباعي';
                          if (trimmed === 'sdassi') return 'سداسي';
                          if (trimmed === 'jam3') return 'جامع';
                          return a;
                        }).join('، ') || '---'}
                      </p>
                    </div>
                    <div className="bg-[#F9F9F6] p-4 rounded-2xl border border-outline-variant/10">
                      <p className="text-[10px] text-[#757575] mb-1">سلالة الغنم</p>
                      <p className="font-bold text-[#1A1A1A]">
                        {listing?.races?.map((r: string) => 
                          r === 'sardi' ? 'سردي' : r === 'bargui' ? 'بركي' : r === 'imported' ? 'مستورد' : r
                        ).join('، ') || '---'}
                      </p>
                    </div>
                    <div className="bg-[#F9F9F6] p-4 rounded-2xl border border-outline-variant/10">
                      <p className="text-[10px] text-[#757575] mb-1">حجم الحولي</p>
                      <div className="flex gap-1 flex-wrap">
                        {listing?.sizes?.length > 0 ? listing.sizes.map((size: string, idx: number) => (
                          <span key={idx} className="text-xs font-bold text-[#1A1A1A]">
                            {size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : size === 'large' ? 'كبير' : size === 'extra-large' ? 'كبير جداً' : size}
                            {idx < listing.sizes.length - 1 ? '، ' : ''}
                          </span>
                        )) : '---'}
                      </div>
                    </div>
                  </div>

                  {/* Audio Player UI */}
                  {listing?.audioUrl && (
                    <div className="mb-8">
                      <h3 className="text-sm font-bold text-[#1A1A1A] mb-3">وصف إضافي (أوديو):</h3>
                      <div className="bg-[#e8f3e8] p-4 rounded-2xl flex items-center justify-between border border-green-100 shadow-sm">
                        <audio src={listing.audioUrl} controls className="w-full h-10" />
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">وصف القطيع</h2>
                    <p className="text-[#4A4A4A] leading-relaxed whitespace-pre-wrap">
                      {listing?.description || 'لا يوجد وصف متاح.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab Content: Reviews */}
              {activeTab === 'reviews' && (
                <div className="animate-in fade-in duration-300 space-y-8">
                  {/* Add Review Form */}
                  {user && profile?.role === 'buyer' && (
                    <div id="review-form" className="bg-[#F9F9F6] p-6 rounded-2xl border border-outline-variant/10">
                      <h3 className="font-bold text-[#1A1A1A] mb-4">
                        {sellerProfile?.reviews?.some((r: any) => r.userId === user.uid) 
                          ? 'عدل التقييم ديالك:' 
                          : 'خلي تقييمك لهاد الكساب:'}
                      </h3>
                      <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            onClick={() => setNewReviewRating(star)}
                            className="transition-colors"
                          >
                            <Star className={`w-8 h-8 ${star <= newReviewRating ? 'text-[#FF9800] fill-current' : 'text-[#D1D1D1]'}`} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder="اكتب التعليق ديالك هنا..."
                        className="w-full p-4 rounded-xl border border-outline-variant/20 bg-white min-h-[100px] mb-4 outline-none focus:ring-2 focus:ring-[#2E7D32]"
                      />
                      <button
                        onClick={async () => {
                          if (!newReviewComment.trim() || isSubmittingReview) return;
                          setIsSubmittingReview(true);
                          try {
                            // Check if user already reviewed
                            const existingReview = sellerProfile?.reviews?.find((r: any) => r.userId === user.uid);
                            
                            if (existingReview) {
                              // Logic to update review (we'll use the same service but it needs to handle updates)
                              await firestoreService.addSellerReview(listing.sellerId, {
                                userId: user.uid,
                                userName: profile?.fullName || profile?.displayName || 'مشتري',
                                rating: newReviewRating,
                                comment: newReviewComment
                              });
                            } else {
                              await firestoreService.addSellerReview(listing.sellerId, {
                                userId: user.uid,
                                userName: profile?.fullName || profile?.displayName || 'مشتري',
                                rating: newReviewRating,
                                comment: newReviewComment
                              });
                            }
                            
                            const updatedProfile = await firestoreService.getUserProfile(listing.sellerId);
                            setSellerProfile(updatedProfile);
                            setNewReviewComment('');
                            setNewReviewRating(5);
                          } catch (error) {
                            console.error("Failed to add review:", error);
                          } finally {
                            setIsSubmittingReview(false);
                          }
                        }}
                        disabled={!newReviewComment.trim() || isSubmittingReview}
                        className="bg-[#2E7D32] text-white px-6 py-3 rounded-xl font-bold transition-colors border border-transparent hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32] disabled:opacity-50"
                      >
                        {isSubmittingReview ? 'جاري الإرسال...' : (sellerProfile?.reviews?.some((r: any) => r.userId === user.uid) ? 'تحديث التقييم' : 'إرسال التقييم')}
                      </button>
                    </div>
                  )}

                  {sellerProfile?.reviews && sellerProfile.reviews.length > 0 ? (
                    <div>
                      <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">شنو قالو الناس على هاد الكساب</h2>
                      <div className="space-y-4">
                        {sellerProfile.reviews.map((review: any, idx: number) => (
                          <div key={idx} className="bg-[#F9F9F6] p-6 rounded-2xl">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#FF9800] text-white flex items-center justify-center font-bold text-xl">
                                  {review.userName?.charAt(0) || 'م'}
                                </div>
                                <div>
                                  <h4 className="font-bold text-[#1A1A1A]">{review.userName || 'مستخدم'}</h4>
                                  <p className="text-xs text-[#757575]">{new Date(review.date).toLocaleDateString('ar-MA')}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex text-[#FF9800]">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-[#D1D1D1]'}`} />
                                  ))}
                                </div>
                                <div className="flex gap-3">
                                  {(user?.uid === review.userId || isAdmin) && (
                                    <div className="flex items-center gap-2">
                                      {reviewToDelete === review.userId ? (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                          <button 
                                            onClick={async () => {
                                              try {
                                                await firestoreService.deleteSellerReview(listing.sellerId, review.userId);
                                                const updatedProfile = await firestoreService.getUserProfile(listing.sellerId);
                                                setSellerProfile(updatedProfile);
                                                setReviewToDelete(null);
                                              } catch (error) {
                                                console.error("Failed to delete review:", error);
                                              }
                                            }}
                                            className="bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold transition-colors border border-transparent hover:bg-transparent hover:text-red-500 hover:border-red-500"
                                          >
                                            تأكيد المسح
                                          </button>
                                          <button 
                                            onClick={() => setReviewToDelete(null)}
                                            className="text-gray-500 text-[10px] font-bold hover:text-gray-900 transition-colors"
                                          >
                                            إلغاء
                                          </button>
                                        </div>
                                      ) : (
                                        <button 
                                          onClick={() => setReviewToDelete(review.userId)}
                                          className="text-red-500 hover:bg-red-500 hover:text-white px-2 py-0.5 rounded transition-colors border border-transparent hover:border-red-500 text-xs font-bold"
                                        >
                                          مسح
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  {user?.uid === review.userId && (
                                    <button 
                                      onClick={() => {
                                        setNewReviewRating(review.rating);
                                        setNewReviewComment(review.comment);
                                        // Scroll to form
                                        const formElement = document.getElementById('review-form');
                                        if (formElement) {
                                          formElement.scrollIntoView({ behavior: 'smooth' });
                                        } else {
                                          window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                      }}
                                      className="text-[#2E7D32] hover:bg-[#2E7D32] hover:text-white px-2 py-0.5 rounded transition-colors border border-transparent hover:border-[#2E7D32] text-xs font-bold"
                                    >
                                      تعديل
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="text-[#4A4A4A] text-sm leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">تقييمات الكساب</h2>
                      <div className="bg-[#F9F9F6] p-6 rounded-2xl text-center">
                        <p className="text-[#757575]">لا توجد تقييمات حالياً.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Related Listings */}
        <div className="mt-16 pt-16 border-t border-outline-variant/20">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-black text-[#1A1A1A] font-headline mb-1">شوف قطيع آخر</h2>
              <p className="text-[#757575]">سلعة أخرى تقدر تعجبك</p>
            </div>
            <button 
              onClick={() => onNavigate('search-results')}
              className="flex items-center gap-2 text-[#2E7D32] font-bold px-3 py-1.5 rounded-lg border border-transparent hover:border-[#2E7D32] transition-colors"
            >
              <span>شوف كولشي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {relatedListings.map((relatedListing) => (
              <div key={relatedListing.id}>
                <RelatedListingCard relatedListing={relatedListing} />
              </div>
            ))}
          </div>

          {/* Mobile Carousel */}
          <div className="md:hidden relative group">
            <div className="overflow-x-auto pb-8 -mx-4 px-4 no-scrollbar snap-x flex gap-4 scroll-smooth">
              {relatedListings.map((relatedListing) => (
                <div key={relatedListing.id} className="min-w-[280px] snap-center">
                  <RelatedListingCard relatedListing={relatedListing} />
                </div>
              ))}
            </div>
            
            {/* Pagination Dots */}
            <div className="flex justify-center gap-1.5 -mt-4">
              {relatedListings.map((_, idx) => (
                <div key={idx} className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]/20" />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="text-xl font-black text-[#1A1A1A]">تبليغ عن إعلان</h3>
              <button 
                onClick={() => setShowReportModal(false)}
                className="p-2 transition-colors border border-transparent hover:border-gray-300 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8">
              {reportSuccess ? (
                <div className="text-center py-8 animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-black text-[#1A1A1A] mb-2">شكراً لك!</h4>
                  <p className="text-[#4A4A4A]">تم إرسال التبليغ بنجاح. غادي نراجعو الإعلان ف أقرب وقت.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-[#4A4A4A] font-medium">علاش بغيتي تبلغ على هاد الإعلان؟</p>
                  <div className="grid grid-cols-1 gap-3">
                    {reportReasons.map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setReportReason(reason)}
                        className={`w-full text-right p-4 rounded-2xl border-2 transition-all font-bold ${
                          reportReason === reason 
                            ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32]' 
                            : 'border-outline-variant/10 hover:border-outline-variant/30 text-[#4A4A4A]'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleReport}
                    disabled={!reportReason || isReporting}
                    className="w-full h-14 bg-red-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-red-600/20 transition-colors border border-transparent hover:bg-transparent hover:text-red-600 hover:border-red-600 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 mt-4"
                  >
                    {isReporting ? (
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      'إرسال التبليغ'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
