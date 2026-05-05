import React from 'react';
import { Bell, Trash2, CheckCircle, Clock, ArrowRight, ShieldCheck, Tag, Info, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../services/firestoreService';
import DashboardHeader from '../components/DashboardHeader';
import { ViewType } from '../App';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
  hideHeader?: boolean;
}

export default function Notifications({ onNavigate, hideHeader = false }: Props) {
  const { user, notifications } = useAuth();

  const handleMarkAsRead = async (id: string) => {
    if (user) await firestoreService.markNotificationAsRead(user.uid, id);
  };

  const handleClearAll = async () => {
    if (!user || !(notifications || []).length) return;
    if (window.confirm('هل أنت متأكد من حذف جميع التنبيهات؟')) {
      try {
        await Promise.all((Array.isArray(notifications) ? notifications : []).map(n => firestoreService.deleteNotification(user.uid, n.id)));
      } catch (error) {
        console.error('Failed to clear notifications:', error);
      }
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'price_update': return <Tag className="w-5 h-5 text-indigo-500" />;
      case 'verification': return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className={`min-h-screen ${hideHeader ? 'bg-transparent' : 'bg-[#F9F9F6]'}`} dir="rtl">
      {!hideHeader && (
        <DashboardHeader 
          title="التنبيهات" 
          subtitle="كل الإشعارات الخاصة بحسابك في مكان واحد"
          onNavigate={onNavigate}
          showSearch={false}
        />
      )}
      
      <main className={`max-w-4xl mx-auto px-4 ${hideHeader ? 'py-4' : 'py-12'}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {!hideHeader && (
              <button 
                onClick={() => onNavigate('home')}
                className="p-3 bg-white rounded-2xl border border-outline-variant/20 text-on-surface-variant hover:text-primary transition-all hover:shadow-md"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <h1 className={`${hideHeader ? 'text-2xl' : 'text-3xl'} font-black text-on-surface font-headline`}>كل التنبيهات</h1>
          </div>
          
          {(notifications || []).length > 0 && (
            <button 
              onClick={handleClearAll}
              className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-sm hover:bg-red-600 hover:text-white transition-all border border-red-100"
            >
              <Trash2 className="w-4 h-4" />
              حذف الكل
            </button>
          )}
        </div>

        <div className="bg-white rounded-[2.5rem] border border-outline-variant/30 shadow-xl overflow-hidden">
          {(notifications || []).length > 0 ? (
            <div className="divide-y divide-outline-variant/10">
              {(Array.isArray(notifications) ? notifications : []).map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id)}
                  className={`p-8 flex gap-6 items-start transition-all cursor-pointer group ${!notif.read ? 'bg-primary/[0.03] hover:bg-primary/[0.06]' : 'hover:bg-gray-50'}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-white group-hover:scale-110 transition-transform ${!notif.read ? 'bg-white' : 'bg-gray-50'}`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className={`text-lg font-black transition-colors ${!notif.read ? 'text-primary' : 'text-on-surface'}`}>
                        {notif.title}
                      </h3>
                      {!notif.read && (
                        <span className="w-2.5 h-2.5 bg-primary rounded-full shadow-lg shadow-primary/40"></span>
                      )}
                    </div>
                    <p className="text-on-surface-variant font-medium leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant/60 font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{(() => {
                          if (!notif.createdAt) return 'منذ وقت قصير';
                          try {
                            const date = notif.createdAt.toDate ? notif.createdAt.toDate() : 
                                       (notif.createdAt._seconds ? new Date(notif.createdAt._seconds * 1000) : 
                                       new Date(notif.createdAt));
                            if (isNaN(date.getTime())) return 'منذ وقت قصير';
                            return date.toLocaleString('ar-MA');
                          } catch (e) {
                            return 'منذ وقت قصير';
                          }
                        })()}</span>
                      </div>
                      {notif.relatedId && (
                        <button className="text-xs font-black text-primary hover:underline">
                          التفاصيل
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6 text-on-surface-variant/20">
                <Bell className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-black text-on-surface mb-2">لا توجد تنبيهات</h3>
              <p className="text-on-surface-variant font-medium">عندما تتلقى إشعاراً جديداً، سيظهر هنا.</p>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-primary/5 p-6 rounded-3xl border border-primary/10 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/10 shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-black text-primary mb-1">نصيحة ذكية</p>
            <p className="text-xs text-on-surface-variant font-medium">ابقِ تنبيهاتك نشطة لتكون أول من يعلم بتحديثات الأسعار وطلبات الشراء الجديدة في منطقتك.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
