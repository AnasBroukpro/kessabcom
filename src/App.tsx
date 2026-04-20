import React, { useState, useEffect } from 'react';
import { Minus, ChevronUp } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { useSettings } from './hooks/useSettings';
import Home from './views/Home';
import SearchResults from './views/SearchResults';
import Auth from './views/Auth';
import BuyerDashboard from './views/BuyerDashboard';
import SellerDashboard from './views/SellerDashboard';
import AddListing from './views/AddListing';
import AdminDashboard from './views/AdminDashboard';
import AdminAuth from './views/AdminAuth';
import ListingDetails from './views/ListingDetails';
import SolidarityRequest from './views/SolidarityRequest';
import SolidarityDonate from './views/SolidarityDonate';
import PriceCatalog from './views/PriceCatalog';
import TipsPage from './views/TipsPage';
import ContactPage from './views/ContactPage';
import TermsPage from './views/TermsPage';
import PrivacyPage from './views/PrivacyPage';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

import { firestoreService } from './services/firestoreService';
import { useAuth } from './contexts/AuthContext';
import Maintenance from './views/Maintenance';
import LoadingScreen from './components/LoadingScreen';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';

export type ViewType = 'home' | 'auth' | 'admin-auth' | 'buyer' | 'seller' | 'add-listing' | 'admin' | 'listing-details' | 'search-results' | 'solidarity-request' | 'solidarity-donate' | 'price-catalog' | 'tips' | 'contact' | 'terms' | 'privacy';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAppReady, setIsAppReady] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsAppReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);
  const [intendedView, setIntendedView] = useState<{view: ViewType, listingId?: string} | null>(null);
  const [isDevNavMinimized, setIsDevNavMinimized] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | undefined>(undefined);
  
  // Map path to ViewType for background logic
  const getViewFromPath = (pathname: string): ViewType => {
    if (pathname === '/') return 'home';
    if (pathname === '/login') return 'auth';
    if (pathname === '/panelaccess') return 'admin-auth';
    if (pathname === '/buyer') return 'buyer';
    if (pathname === '/seller') return 'seller';
    if (pathname === '/add-listing') return 'add-listing';
    if (pathname === '/admin') return 'admin';
    if (pathname.startsWith('/listing/')) return 'listing-details';
    if (pathname === '/search') return 'search-results';
    if (pathname === '/solidarity-request') return 'solidarity-request';
    if (pathname === '/solidarity-donate') return 'solidarity-donate';
    if (pathname === '/prices') return 'price-catalog';
    if (pathname === '/tips') return 'tips';
    if (pathname === '/contact') return 'contact';
    if (pathname === '/terms') return 'terms';
    if (pathname === '/privacy') return 'privacy';
    return 'home';
  };

  const currentView = getViewFromPath(location.pathname);
  const { settings, updateSettings } = useSettings();
  const { profile, loading: authLoading, user, notifications } = useAuth();


  // Handle secret admin access via URL path (clean up URL after a delay if needed)
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/panelaccess') {
      // Logic for secret access can go here if needed, 
      // but for now we just rely on Routes rendering AdminAuth
    }
  }, []);

  const handleNavigate = (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (radius) params.set('radius', radius);
    if (subView) params.set('sub', subView);
    
    const search = params.toString() ? `?${params.toString()}` : '';

    switch (view) {
      case 'home': navigate('/'); break;
      case 'auth': navigate('/login'); break;
      case 'admin-auth': navigate('/panelaccess'); break;
      case 'buyer': navigate('/buyer' + search); break;
      case 'seller': navigate('/seller' + search); break;
      case 'add-listing': navigate(listingId ? `/add-listing?id=${listingId}` : '/add-listing'); break;
      case 'admin': navigate('/admin' + search); break;
      case 'listing-details': navigate(`/listing/${listingId}`); break;
      case 'search-results': navigate('/search' + search); break;
      case 'solidarity-request': navigate('/solidarity-request'); break;
      case 'solidarity-donate': navigate('/solidarity-donate'); break;
      case 'price-catalog': navigate('/prices'); break;
      case 'tips': navigate('/tips'); break;
      case 'contact': navigate('/contact'); break;
      case 'terms': navigate('/terms'); break;
      case 'privacy': navigate('/privacy'); break;
      default: navigate('/');
    }
  };

  // Handle redirection if solidarity feature is disabled
  useEffect(() => {
    if (!settings.solidarityDonationEnabled && (currentView === 'solidarity-request' || currentView === 'solidarity-donate')) {
      handleNavigate('home');
    }
  }, [settings.solidarityDonationEnabled, currentView]);

  // Handle maintenance mode and activation date
  useEffect(() => {
    if (settings.maintenanceMode && settings.activationDate) {
      const activationTime = new Date(settings.activationDate).getTime();
      const now = new Date().getTime();
      
      if (now >= activationTime) {
        updateSettings({ maintenanceMode: false, activationDate: null });
      }
    }
  }, [settings.maintenanceMode, settings.activationDate, updateSettings]);

  // Role-based and Authentication access restrictions
  useEffect(() => {
    if (!authLoading) {
      const protectedViews: ViewType[] = ['buyer', 'seller', 'admin', 'add-listing', 'solidarity-request', 'solidarity-donate'];
      
      // If guestBuyerMode is OFF, listing-details also becomes protected
      if (!settings.guestBuyerMode) {
        protectedViews.push('listing-details');
      }
      
      if (protectedViews.includes(currentView) && !profile) {
        if (currentView !== 'auth' && currentView !== 'admin-auth') {
          setIntendedView({ view: currentView, listingId: selectedListingId });
        }
        
        if (currentView === 'admin') {
          handleNavigate('admin-auth');
        } else {
          handleNavigate('auth');
        }
        return;
      }

      if (profile) {
        if (intendedView) {
          handleNavigate(intendedView.view);
          setSelectedListingId(intendedView.listingId);
          setIntendedView(null);
          return;
        }

        if (currentView === 'auth') {
          if (profile.role === 'admin') handleNavigate('admin');
          else if (profile.role === 'seller') handleNavigate('seller');
          else handleNavigate('buyer');
          return;
        }

        // Fix: If user is admin and currentView is seller or buyer, they might be trying to see their own dashboard
        // But if they click "Dashboard" from the menu, it should go to their primary role dashboard.
        // The issue reported is that navigating back to dashboard shows Kessab instead of Admin.
        // This usually happens if the navigation link points to 'seller' or 'buyer' instead of 'admin'.
        
        if (currentView === 'admin' && profile.role !== 'admin') {
          handleNavigate('home');
        }
        if (currentView === 'seller' && profile.role !== 'seller' && profile.role !== 'admin') {
          handleNavigate('home');
        }
        if (currentView === 'buyer' && profile.role !== 'buyer' && profile.role !== 'admin') {
          handleNavigate('home');
        }
      }
    }
  }, [profile, currentView, authLoading, settings.guestBuyerMode, intendedView, selectedListingId]);

  if (settings.maintenanceMode && profile?.role !== 'admin' && currentView !== 'admin-auth') {
    return <Maintenance activationDate={settings.activationDate} onNavigate={handleNavigate} />;
  }

  const renderView = () => {
    if (authLoading || !isAppReady) {
      return <LoadingScreen />;
    }

    if (settings.maintenanceMode && profile?.role !== 'admin' && currentView !== 'admin-auth') {
      return <Maintenance activationDate={settings.activationDate} onNavigate={handleNavigate} />;
    }

    return (
      <Routes>
        <Route path="/" element={<Home onNavigate={handleNavigate} />} />
        <Route path="/login" element={<Auth onNavigate={handleNavigate} intendedView={null} />} />
        <Route path="/panelaccess" element={<AdminAuth onNavigate={handleNavigate} />} />
        
        {/* Protected Routes */}
        <Route path="/buyer" element={
          profile ? <BuyerDashboard onNavigate={handleNavigate} activeSubView={new URLSearchParams(location.search).get('sub') || undefined} /> : <Navigate to="/login" />
        } />
        <Route path="/seller" element={
          profile ? <SellerDashboard onNavigate={handleNavigate} activeSubView={new URLSearchParams(location.search).get('sub') || undefined} /> : <Navigate to="/login" />
        } />
        <Route path="/add-listing" element={
          profile ? <AddListing onNavigate={handleNavigate} listingId={new URLSearchParams(location.search).get('id') || undefined} /> : <Navigate to="/login" />
        } />
        <Route path="/admin" element={
          profile?.role === 'admin' ? <AdminDashboard onNavigate={handleNavigate} activeSubView={new URLSearchParams(location.search).get('sub') || undefined} /> : <Navigate to="/login" />
        } />
        
        <Route path="/listing/:id" element={<ListingDetailsWrapper onNavigate={handleNavigate} />} />
        <Route path="/search" element={<SearchResultsWrapper onNavigate={handleNavigate} />} />
        
        <Route path="/solidarity-request" element={settings.solidarityDonationEnabled ? <SolidarityRequest onNavigate={handleNavigate} /> : <Navigate to="/" />} />
        <Route path="/solidarity-donate" element={settings.solidarityDonationEnabled ? <SolidarityDonate onNavigate={handleNavigate} /> : <Navigate to="/" />} />
        
        <Route path="/prices" element={<PriceCatalog onNavigate={handleNavigate} />} />
        <Route path="/tips" element={<TipsPage onNavigate={handleNavigate} />} />
        <Route path="/contact" element={<ContactPage onNavigate={handleNavigate} />} />
        <Route path="/terms" element={<TermsPage onNavigate={handleNavigate} />} />
        <Route path="/privacy" element={<PrivacyPage onNavigate={handleNavigate} />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  };

  return (
    <div className={`min-h-screen bg-surface text-on-surface font-body selection:bg-primary-fixed selection:text-on-primary-fixed flex flex-col ${['buyer', 'seller', 'admin'].includes(currentView) ? 'h-screen overflow-hidden' : ''}`}>
      <ScrollToTop view={currentView} />
      <div className="flex-grow">
        {renderView()}
      </div>
      {currentView !== 'auth' && !['buyer', 'seller', 'admin'].includes(currentView) && <Footer onNavigate={handleNavigate} />}
    </div>
  );
}

// Helper wrappers for complex params moved OUTSIDE for stability
function ListingDetailsWrapper({ onNavigate }: { onNavigate: any }) {
  const { id } = useParams();
  return <ListingDetails onNavigate={onNavigate} listingId={id} />;
}

function SearchResultsWrapper({ onNavigate }: { onNavigate: any }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  return <SearchResults onNavigate={onNavigate} initialCity={params.get('city') || undefined} initialRadius={params.get('radius') || undefined} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
