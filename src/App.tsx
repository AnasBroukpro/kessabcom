import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Minus, ChevronUp } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { useSettings } from './hooks/useSettings';

// Eagerly loaded — appear on first render
import Home from './views/Home';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import LoadingScreen from './components/LoadingScreen';
import Maintenance from './views/Maintenance';

// Lazy loaded — split into separate JS chunks (Bug 3.4 fix)
// On mobile 3G/4G, this reduces initial bundle from ~2MB to ~300KB
const SearchResults = lazy(() => import('./views/SearchResults'));
const Auth = lazy(() => import('./views/Auth'));
const BuyerDashboard = lazy(() => import('./views/BuyerDashboard'));
const SellerDashboard = lazy(() => import('./views/SellerDashboard'));
const AddListing = lazy(() => import('./views/AddListing'));
const AdminDashboard = lazy(() => import('./views/AdminDashboard'));
const AdminAuth = lazy(() => import('./views/AdminAuth'));
const ListingDetails = lazy(() => import('./views/ListingDetails'));
const SolidarityRequest = lazy(() => import('./views/SolidarityRequest'));
const SolidarityDonate = lazy(() => import('./views/SolidarityDonate'));
const PriceCatalog = lazy(() => import('./views/PriceCatalog'));
const TipsPage = lazy(() => import('./views/TipsPage'));
const ContactPage = lazy(() => import('./views/ContactPage'));
const TermsPage = lazy(() => import('./views/TermsPage'));
const PrivacyPage = lazy(() => import('./views/PrivacyPage'));

import { firestoreService } from './services/firestoreService';
import { useAuth } from './contexts/AuthContext';
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
      const protectedViews: ViewType[] = ['buyer', 'seller', 'admin', 'add-listing', 'solidarity-request', 'solidarity-donate', 'listing-details'];
      
      if (protectedViews.includes(currentView) && !profile) {
        // Only set intended view if we are not already going to auth
        if (currentView !== 'auth' && currentView !== 'admin-auth') {
           if (!intendedView) {
             setIntendedView({ view: currentView, listingId: selectedListingId });
           }
        }
      }

      if (profile && intendedView) {
          const next = intendedView;
          setIntendedView(null);
          handleNavigate(next.view, next.listingId);
      }
    }
  }, [profile, currentView, authLoading, intendedView]);

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
      <Suspense fallback={<LoadingScreen />}>
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
      </Suspense>
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
