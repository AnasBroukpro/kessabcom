import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, Clock, CheckCircle2, XCircle, ArrowRight, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { firestoreService } from '../../services/firestoreService';
import { ViewType } from '../../App';

interface Review {
  id: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  targetType: 'seller' | 'announcement';
  targetId: string;
  listingTitle?: string;
  sellerName?: string;
}

interface Props {
  onNavigate: (view: ViewType, listingId?: string) => void;
}

export default function BuyerReviewsView({ onNavigate }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        setLoading(true);
        const data = await firestoreService.getBuyerReviews();
        setReviews(data);
      } catch (err: any) {
        console.error("Error fetching buyer reviews:", err);
        setError("تعذر تحميل التقييمات. حاول مرة أخرى لاحقاً.");
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            مقبول
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-full">
            <XCircle className="w-3 h-3" />
            مرفوض
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full">
            <Clock className="w-3 h-3" />
            قيد المراجعة
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-[#2E7D32] animate-spin mb-4" />
        <p className="text-[#757575] font-bold">جاري تحميل تقييماتك...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-700 font-bold mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[#1A1A1A] mb-1">تقييماتي</h2>
          <p className="text-[#757575] text-xs font-bold">هنا تجد جميع التقييمات التي وضعتها للبائعين والمنتجات</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-outline-variant/20 shadow-sm">
          <span className="text-[#2E7D32] font-black text-lg">{reviews.length}</span>
          <span className="text-[#757575] text-xs font-bold mr-2">تقييم</span>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-[32px] p-12 text-center border border-outline-variant/20 shadow-sm">
          <div className="w-20 h-20 bg-[#F9F9F6] rounded-full flex items-center justify-center mx-auto mb-6">
            <Star className="w-10 h-10 text-[#ABABAB]" />
          </div>
          <h3 className="text-lg font-black text-[#1A1A1A] mb-2">مازال ما حطيتي حتى تقييم</h3>
          <p className="text-[#757575] text-sm font-bold max-w-xs mx-auto mb-8">
            ملي تشري شي حولي أو تعامل مع شي كساب، ما تنساش تحط تقييمك باش تساعد مستخدمين آخرين.
          </p>
          <button 
            onClick={() => onNavigate('home')}
            className="px-8 py-3 bg-[#2E7D32] text-white rounded-2xl font-black shadow-lg hover:bg-[#1B5E20] transition-all flex items-center gap-2 mx-auto"
          >
            <span>اكتشف العروض</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-3xl p-5 border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F9F9F6] flex items-center justify-center text-[#2E7D32]">
                    {review.targetType === 'seller' ? <UserIcon className="w-5 h-5" /> : <ShoppingBagIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] text-sm flex items-center gap-2">
                      {review.targetType === 'seller' ? 'تقييم كساب' : 'تقييم إعلان'}
                      {getStatusBadge(review.status)}
                    </h4>
                    <p className="text-[10px] text-[#757575] font-bold">
                      {(() => {
                        try {
                          const options: Intl.DateTimeFormatOptions = { 
                            dateStyle: 'long',
                            timeStyle: 'short'
                          };
                          if (typeof review.createdAt === 'string') {
                            return new Intl.DateTimeFormat('ar-MA', options).format(new Date(review.createdAt));
                          }
                          if (review.createdAt?._seconds) {
                            return new Intl.DateTimeFormat('ar-MA', options).format(new Date(review.createdAt._seconds * 1000));
                          }
                          if (review.createdAt?.toDate) {
                            return new Intl.DateTimeFormat('ar-MA', options).format(review.createdAt.toDate());
                          }
                        } catch (e) {}
                        return 'تاريخ غير معروف';
                      })()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < review.rating ? 'fill-[#FFC107] text-[#FFC107]' : 'text-[#D1D1D1]'}`} 
                    />
                  ))}
                </div>
              </div>

              <div className="bg-[#F9F9F6] p-4 rounded-2xl mb-4 italic text-[#4A4A4A] text-sm">
                "{review.comment || 'بدون تعليق'}"
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[11px] text-[#757575] font-bold">
                  {review.targetType === 'seller' ? (
                    <span>الكساب: <span className="text-[#1A1A1A]">{review.sellerName || '---'}</span></span>
                  ) : (
                    <span>الإعلان: <span className="text-[#1A1A1A]">{review.listingTitle || '---'} <span className="text-[#757575] font-normal text-[9px]">({review.targetId})</span></span></span>
                  )}
                </div>
                
                {review.targetType === 'announcement' && (
                  <button 
                    onClick={() => onNavigate('listing-details', review.targetId)}
                    className="flex items-center gap-1.5 text-[#2E7D32] text-xs font-black hover:underline"
                  >
                    <span>مشاهدة الإعلان</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Add missing icon for the review card
function ShoppingBagIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function UserIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
