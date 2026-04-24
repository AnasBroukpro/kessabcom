import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useSellerDashboardData } from '../hooks/useSellerDashboardData';
import { firestoreService } from '../services/firestoreService';
import { cityMapping } from '../constants/cityMapping';

// UI Components
import DashboardHeader from '../components/DashboardHeader';
import { BuyerRequestsView } from '../components/dashboard/BuyerRequestsView';
import { DonationsView } from '../components/dashboard/DonationsView';
import SellerHomeView from '../components/dashboard/SellerHomeView';
import FlockView from '../components/dashboard/FlockView';
import { SellerStats } from '../components/dashboard/SellerStats';
import SubscriptionView from '../components/dashboard/SubscriptionView';
import SettingsView from '../components/dashboard/SettingsView';
import SellerSidebar from '../components/dashboard/SellerSidebar';
import SellerMobileNav from '../components/dashboard/SellerMobileNav';
import DeleteConfirmationModal from '../components/dashboard/DeleteConfirmationModal';
import { Star, Plus } from 'lucide-react';
import Notifications from './Notifications';

export type SellerTab = 'dashboard' | 'flock' | 'stats' | 'subscription' | 'settings' | 'buyer-requests' | 'donations' | 'notifications';

interface Props {
  onNavigate: (view: any, listingId?: string, city?: string, radius?: string, subView?: string) => void;
  activeSubView?: string;
}

export default function SellerDashboard({ onNavigate, activeSubView }: Props) {
  const { user, profile, signOut } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<SellerTab>('dashboard');

  useEffect(() => {
    if (activeSubView) {
      setActiveTab(activeSubView as SellerTab);
    }
  }, [activeSubView]);

  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month'>('today');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    announcements,
    requests,
    nextCursorRequests,
    isLoadingMoreRequests,
    fetchRequests
  } = useSellerDashboardData(user);

  // Statistics
  const activeCount = Array.isArray(announcements) ? announcements.filter(a => a.status === 'active').length : 0;
  const totalViews = Array.isArray(announcements) ? announcements.reduce((sum, a) => sum + (a.views || 0), 0) : 0;
  const totalCalls = Array.isArray(announcements) ? announcements.reduce((sum, a) => sum + (a.clicks?.phone || 0), 0) : 0;
  const totalMessages = Array.isArray(announcements) ? announcements.reduce((sum, a) => sum + (a.clicks?.whatsapp || 0), 0) : 0;
  const totalLocationRequests = Array.isArray(announcements) ? announcements.reduce((sum, a) => sum + (a.clicks?.location || 0), 0) : 0;

  const statsModel = {
    activeCount,
    totalViews,
    totalCalls,
    totalMessages,
    totalLocationRequests
  };

  useEffect(() => {
    if (user && activeTab === 'buyer-requests' && requests.length === 0) {
      fetchRequests();
    }
  }, [user, activeTab]);

  const handleLoadMoreRequests = () => fetchRequests(true);

  const handleDeleteListing = async () => {
    if (!listingToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await firestoreService.deleteAnnouncement(listingToDelete);
      setShowDeleteConfirm(false);
      setListingToDelete(null);
    } catch (error: any) {
      setDeleteError(error.message || "حدث خطأ أثناء الحذف. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return `مرحبا بك، ${(() => {
        const name = profile?.fullName || profile?.displayName;
        if (!name || name.toLowerCase() === 'user') return 'سي محمد';
        return name;
      })()}`;
      case 'flock': return 'القطيع ديالي';
      case 'stats': return 'الإحصائيات';
      case 'subscription': return 'الاشتراك';
      case 'settings': return 'الإعدادات';
      case 'buyer-requests': return 'طلبات المشترين';
      case 'donations': return 'تبرع تضامني';
      default: return 'لوحة التحكم';
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-outline-variant'}`} />
      ))}
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-surface-container-low" dir="rtl">
      <SellerSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNavigate={onNavigate}
        requestsCount={requests.length}
        settings={settings}
        signOut={signOut}
      />

      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-20 md:pb-0">
        <DashboardHeader 
          title={getTitle()} 
          subtitle={activeTab === 'dashboard' ? cityMapping[(profile?.location || 'سطات').split(' ')[0].toLowerCase()] : undefined}
          location={activeTab === 'dashboard' ? cityMapping[(profile?.location || 'سطات').split(' ')[0].toLowerCase()] : undefined}
          showSearch={true}
          onSearch={(city, distance) => onNavigate('search-results', undefined, city, distance)}
          onNavigate={onNavigate}
        />

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8 text-right">
          {activeTab === 'dashboard' && (
            <SellerHomeView 
              profile={profile}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              stats={statsModel}
              announcements={announcements}
              onNavigate={onNavigate}
              setActiveTab={setActiveTab}
              settings={settings}
              setListingToDelete={setListingToDelete}
              setShowDeleteConfirm={setShowDeleteConfirm}
              renderStars={renderStars}
            />
          )}
          {activeTab === 'flock' && (
            <FlockView 
              announcements={announcements}
              onNavigate={onNavigate}
              settings={settings}
              setListingToDelete={setListingToDelete}
              setShowDeleteConfirm={setShowDeleteConfirm}
              renderStars={renderStars}
            />
          )}
          {activeTab === 'stats' && <SellerStats stats={statsModel} />}
          {activeTab === 'subscription' && <SubscriptionView settings={settings} />}
          {activeTab === 'settings' && <SettingsView profile={profile} user={user} />}
          {activeTab === 'buyer-requests' && (
            <BuyerRequestsView 
              requests={requests} 
              onLoadMore={handleLoadMoreRequests}
              hasMore={!!nextCursorRequests}
              isLoadingMore={isLoadingMoreRequests}
            />
          )}
          {activeTab === 'donations' && settings.solidarityDonationEnabled && (
            <DonationsView onBack={() => setActiveTab('dashboard')} />
          )}
          {activeTab === 'notifications' && <Notifications onNavigate={onNavigate} hideHeader={true} />}
        </div>
      </main>

      <SellerMobileNav 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        requestsCount={requests.length}
      />

      {/* Sticky "+" Button */}
      <button 
        onClick={() => onNavigate('add-listing')}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-[#115E2C] text-white rounded-[10px] shadow-2xl shadow-[#115E2C]/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group border border-white/20"
      >
        <Plus className="w-8 h-8 md:w-10 md:h-10 transition-transform group-hover:rotate-90" />
      </button>

      <DeleteConfirmationModal 
        show={showDeleteConfirm}
        isDeleting={isDeleting}
        deleteError={deleteError}
        onClose={() => {
          setShowDeleteConfirm(false);
          setListingToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteListing}
      />
    </div>
  );
}
