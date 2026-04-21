import React from 'react';
import { Bookmark, PlusCircle } from 'lucide-react';

interface ActivityItem {
  action: string;
  target: string;
  time: string;
  timestamp: number;
  icon: any;
  color: string;
  listingId?: any;
  view?: string;
}

interface ActivityFeedProps {
  favorites: any[];
  kessabaRequests: any[];
  announcements: any[];
  onNavigate: (view: string, id?: any) => void;
  setActiveView: (view: string) => void;
}

export default function ActivityFeed({ 
  favorites, 
  kessabaRequests, 
  announcements, 
  onNavigate, 
  setActiveView 
}: ActivityFeedProps) {
  const recentActivity: ActivityItem[] = [];
  
  if (Array.isArray(favorites)) {
    favorites.forEach(fav => {
      const listing = Array.isArray(announcements) ? announcements.find(a => (a.id || a.listingId)?.toString() === fav.listingId) : null;
      if (listing) {
        recentActivity.push({
          action: 'حفظت إعلان',
          target: listing.title || 'إعلان',
          time: fav.createdAt ? new Date(fav.createdAt.seconds * 1000).toLocaleDateString('ar-MA') : 'مؤخرا',
          timestamp: fav.createdAt ? fav.createdAt.seconds : 0,
          icon: Bookmark,
          color: 'text-primary',
          listingId: listing.id || listing.listingId
        });
      }
    });
  }

  if (Array.isArray(kessabaRequests)) {
    kessabaRequests.forEach(req => {
      recentActivity.push({
        action: 'فتحت مزاد',
        target: req.title || 'طلب',
        time: req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleDateString('ar-MA') : 'مؤخرا',
        timestamp: req.createdAt ? req.createdAt.seconds : 0,
        icon: PlusCircle,
        color: 'text-blue-500',
        view: 'kessaba-offers'
      });
    });
  }

  recentActivity.sort((a, b) => b.timestamp - a.timestamp);
  const displayActivity = recentActivity.slice(0, 3);

  if (displayActivity.length === 0) {
    return <p className="text-center text-on-surface-variant">لا يوجد نشاط أخير</p>;
  }

  return (
    <div className="space-y-6">
      {displayActivity.map((item, i) => (
        <button 
          key={i} 
          onClick={() => {
            if (item.listingId) onNavigate('listing-details', item.listingId);
            else if (item.view) setActiveView(item.view);
          }}
          className="w-full flex items-center gap-4 hover:bg-surface-container-low p-2 rounded-xl transition-colors text-right"
        >
          <div className={`w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center ${item.color}`}>
            <item.icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-on-surface">{item.action}: <span className="text-primary">{item.target}</span></p>
            <p className="text-xs text-on-surface-variant">{item.time}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
