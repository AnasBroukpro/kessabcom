import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewType } from '../App';
import { Search, MapPin, Star, ArrowLeft, SlidersHorizontal, Heart, LayoutGrid, List as ListIcon, Map as MapIcon, Scale, BadgeCheck, X, PlusCircle, Loader2, TrendingUp, ChevronDown, Phone, ChevronRight, ChevronLeft } from 'lucide-react';
import SearchHeader from '../components/SearchHeader';
import GoogleMapComponent from '../components/GoogleMap';
import { firestoreService } from '../services/firestoreService';
import { cityMapping, cityCoords, getDisplayCity, calculateDistance, normalizeArabic } from '../constants/cityMapping';
import { getCachedData, setCachedData } from '../lib/cache';
import ContactSellerModal from '../components/ContactSellerModal';
import LoginRequiredModal from '../components/LoginRequiredModal';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string, breed?: string) => void;
  initialCity?: string;
  initialRadius?: string;
  initialBreed?: string;
}

const moroccanCities = Object.keys(cityCoords);

export default function SearchResults({ onNavigate, initialCity, initialRadius, initialBreed }: Props) {
  const [citySearch, setCitySearch] = useState(initialCity || '');
  const [radiusSearch, setRadiusSearch] = useState(initialRadius || '10');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    if (initialCity) {
      setCitySearch(initialCity);
    }
  }, [initialCity]);

  useEffect(() => {
    if (initialRadius) {
      setRadiusSearch(initialRadius);
    }
  }, [initialRadius]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialBreed ? [initialBreed] : []);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'rating'>('newest');
  const [listings, setListings] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const toggleSelection = <T,>(item: T, currentArray: T[], setArray: React.Dispatch<React.SetStateAction<T[]>>) => {
    if (currentArray.includes(item)) {
      setArray(currentArray.filter(i => i !== item));
    } else {
      setArray([...currentArray, item]);
    }
  };

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedSellerPhone, setSelectedSellerPhone] = useState<string | undefined>();
  const [selectedSellerWhatsapp, setSelectedSellerWhatsapp] = useState<string | undefined>();
  const [selectedListingId, setSelectedListingId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [showListingSidebar, setShowListingSidebar] = useState(false);
  const [showCityAlert, setShowCityAlert] = useState(false);

  useEffect(() => {
    if (viewMode === 'map' && !citySearch) {
      setShowCityAlert(true);
    } else {
      setShowCityAlert(false);
    }
  }, [viewMode, citySearch]);

  const { settings } = useSettings();
  const { profile } = useAuth();



  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      setCurrentPage(1);

      const cacheKey = `search_results_${selectedCategory}_all`;
      const cached = getCachedData(cacheKey);
      if (cached) {
        setListings(cached.listings);
        setHasMore(false);
        setIsLoading(false);
        return;
      }

      // Load all listings in one shot (limit 200)
      let allListings: any[] = [];
      let cursor: string | null = null;
      let iterations = 0;
      do {
        const response = await firestoreService.getAnnouncements(
          selectedCategory === 'الكل' ? undefined : selectedCategory,
          cursor || undefined,
          200
        );
        if (response && response.data) {
          allListings = [...allListings, ...response.data];
          cursor = response.nextCursor || null;
        } else {
          break;
        }
        iterations++;
      } while (cursor && iterations < 5); // safety cap

      setListings(allListings);
      setHasMore(false);
      setCachedData(cacheKey, { listings: allListings });
      setIsLoading(false);
    };
    fetchListings();
  }, [selectedCategory]);

  // No-op — all data is loaded upfront
  const handleLoadMore = async () => {};

  const filteredListings = (Array.isArray(listings) ? listings : []).filter(listing => {
    const matchesTypes = selectedTypes.length === 0 || selectedTypes.includes(listing.category);
    const matchesSize = selectedSizes.length === 0 || (listing.sizes && listing.sizes.some((s: string) => selectedSizes.includes(s)));
    const matchesRating = selectedRatings.length === 0 || selectedRatings.includes(Math.floor(listing.rating || 0));
    const matchesAge = selectedAges.length === 0 || selectedAges.includes(listing.age);
    
    // Price filtering
    const price = listing.price || listing.minPrice || 0;
    const matchesMinPrice = !minPrice || price >= parseInt(minPrice);
    const matchesMaxPrice = !maxPrice || price <= parseInt(maxPrice);
    const matchesPrice = matchesMinPrice && matchesMaxPrice;

    // Core search center point
    const normSearchInput = citySearch.trim();
    const mappedSearch = cityMapping[normSearchInput.toLowerCase()] || cityMapping[normSearchInput];
    const normalizedSearch = mappedSearch || normSearchInput;
    const searchCoords = cityCoords[normalizedSearch];

    // Check if the city search matches the calculated display city
    const displayCity = getDisplayCity(listing);
    const normDisplayCity = normalizeArabic(displayCity);
    const normNormalizedSearch = normalizeArabic(normalizedSearch);
    
    const matchesCityName = normalizedSearch === 'الكل' || 
                          normDisplayCity.includes(normNormalizedSearch) || 
                          (listing.location && normalizeArabic(listing.location).includes(normNormalizedSearch));

    let dist = 999;

    if (searchCoords) {
      if (listing.coordinates && listing.coordinates.lat && listing.coordinates.lng) {
        // Preferred: calculate actual distance between search city center and exact listing coordinates
        dist = calculateDistance(searchCoords.lat, searchCoords.lng, listing.coordinates.lat, listing.coordinates.lng);
      } else {
        // Fallback: look up the listing's derived display city in our map
        const listingMappedCoords = cityCoords[displayCity];
        if (listingMappedCoords) {
          dist = calculateDistance(searchCoords.lat, searchCoords.lng, listingMappedCoords.lat, listingMappedCoords.lng);
        }
      }
    }

    listing.calculatedDistance = dist; // Store for display

    let matchesDistance = true;
    if (settings.disableSearchRadius) {
      matchesDistance = matchesCityName || !citySearch || normalizedSearch === 'الكل';
    } else if (radiusSearch !== 'all' && normalizedSearch !== 'الكل') {
      const radius = parseInt(radiusSearch);
      // It's a match if within radius OR if city name directly matches the text
      matchesDistance = (dist !== 999 && dist <= radius) || matchesCityName;
    } else {
      // If "all" is selected, we interpret "all" as max 250km radius (broader than 150km for 'all')
      matchesDistance = (dist !== 999 && dist <= 250) || matchesCityName || !citySearch || normalizedSearch === 'الكل';
    }

    return matchesTypes && matchesSize && matchesRating && matchesAge && matchesDistance && matchesPrice;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return (a.price || a.minPrice || 0) - (b.price || b.minPrice || 0);
    if (sortBy === 'price-desc') return (b.price || b.minPrice || 0) - (a.price || a.minPrice || 0);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    // newest
    const dateA = a.createdAt?.toDate?.() || new Date(0);
    const dateB = b.createdAt?.toDate?.() || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });


  return (
    <div className="min-h-screen bg-[#FDFCF8] antialiased" dir="rtl">
      <SearchHeader onNavigate={onNavigate} initialCity={citySearch} initialRadius={radiusSearch} />

      <main className="max-w-7xl mx-auto px-4 pt-0 pb-6 mt-0 md:mt-0">
        {/* Results Header */}
        <div className="flex flex-col mb-6 gap-6 pt-10">
          {/* Row 1: Title (Right) */}
          <div className="flex flex-col text-right">
            <h1 className="text-xl md:text-3xl font-black text-[#1A1A1A] font-headline mb-1 tracking-tight">
              نتائج البحث في {citySearch} {!settings.disableSearchRadius && radiusSearch !== 'all' && `ضمن محيط (${radiusSearch} كلم)`}
            </h1>
            <p className="text-[#757575] font-black text-xs md:text-sm">لقيت ليك {filteredListings.length} ضيعات قريبة ليك</p>
          </div>

          {/* Row 2: Views + Filters — responsive layout */}
          <div className="flex flex-col gap-3 border-t border-outline-variant/10 pt-4">

            {/* Line 1: Views | Filter | Sort (+ breeds on desktop) */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* View Switcher */}
              <div className="flex bg-white rounded-xl border border-outline-variant/30 p-1 shadow-sm shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors border border-transparent ${viewMode === 'grid' ? 'bg-[#2E7D32] text-white shadow-md border-[#2E7D32]' : 'text-[#757575] hover:bg-[#F9F9F6] hover:text-[#2E7D32]'}`}
                  title="عرض شبكي"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors border border-transparent ${viewMode === 'list' ? 'bg-[#2E7D32] text-white shadow-md border-[#2E7D32]' : 'text-[#757575] hover:bg-[#F9F9F6] hover:text-[#2E7D32]'}`}
                  title="عرض قائمة"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-lg transition-colors border border-transparent ${viewMode === 'map' ? 'bg-[#2E7D32] text-white shadow-md border-[#2E7D32]' : 'text-[#757575] hover:bg-[#F9F9F6] hover:text-[#2E7D32]'}`}
                  title="عرض الخريطة"
                >
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Filter button */}
              <button
                onClick={() => setShowFilterModal(true)}
                className={`flex items-center gap-2 border transition-all duration-300 ${selectedTypes.length > 0 || selectedSizes.length > 0 || selectedRatings.length > 0 || selectedAges.length > 0 || minPrice || maxPrice ? 'bg-[#2E7D32] border-[#2E7D32] text-white' : 'bg-white border-outline-variant/30 text-[#1A1A1A]'} px-4 py-2 rounded-xl text-sm font-black hover:shadow-lg shrink-0`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>تصفية</span>
              </button>

              {/* Sort select */}
              <div className="relative hidden md:block">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none px-10 py-2 rounded-xl text-sm font-black bg-white text-[#1A1A1A] border border-outline-variant/30 hover:border-[#2E7D32] transition-all focus:outline-none pr-8 shadow-sm"
                >
                  <option value="newest">الأحدث أولاً</option>
                  <option value="price-asc">الثمن: من الأقل</option>
                  <option value="price-desc">الثمن: من الأعلى</option>
                  <option value="rating">الأعلى تقييماً</option>
                </select>
                <TrendingUp className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[#2E7D32] pointer-events-none" />
                <ChevronDown className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-[#757575] pointer-events-none" />
              </div>

              {/* Breed types — desktop only, horizontal */}
              <div className="hidden md:flex items-center gap-2 ml-auto">
                {['سردي', 'بركي', 'مستورد'].map(type => (
                  <button
                    key={type}
                    onClick={() => toggleSelection(type, selectedTypes, setSelectedTypes)}
                    className={`px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap border shadow-sm ${selectedTypes.includes(type) ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]' : 'bg-white text-[#1A1A1A] border-outline-variant/30 hover:border-[#2E7D32]'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Line 2 (mobile only): Sort + Breed types */}
            <div className="flex md:hidden items-center gap-2 flex-wrap">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none px-8 py-2 rounded-xl text-xs font-black bg-white text-[#1A1A1A] border border-outline-variant/30 focus:outline-none pr-6 shadow-sm"
                >
                  <option value="newest">الأحدث أولاً</option>
                  <option value="price-asc">الثمن: الأقل</option>
                  <option value="price-desc">الثمن: الأعلى</option>
                  <option value="rating">الأعلى تقييماً</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[#757575] pointer-events-none" />
              </div>
              {['سردي', 'بركي', 'مستورد'].map(type => (
                <button
                  key={type}
                  onClick={() => toggleSelection(type, selectedTypes, setSelectedTypes)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap border ${selectedTypes.includes(type) ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]' : 'bg-white text-[#1A1A1A] border-outline-variant/30 hover:border-[#2E7D32]'}`}
                >
                  {type}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between">
                <h2 className="text-xl font-black font-headline">تصفية النتائج</h2>
                <button onClick={() => setShowFilterModal(false)} className="p-2 transition-colors border border-transparent hover:border-gray-300 rounded-full">
                  <ArrowLeft className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
                {/* Size Filter */}
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">حجم الحولي</h3>
                  <div className="flex gap-3">
                    {['صغير', 'متوسط', 'كبير'].map(size => (
                      <button
                        key={size}
                        onClick={() => toggleSelection(size, selectedSizes, setSelectedSizes)}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${selectedSizes.includes(size) ? 'bg-[#2E7D32] text-white border-[#2E7D32]' : 'bg-[#F9F9F6] text-[#1A1A1A] border-transparent hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32]'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Filter */}
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">السن (الأعمار)</h3>
                  <div className="flex gap-3">
                    {['حليب', 'ثني', 'رباعي'].map(age => (
                      <button
                        key={age}
                        onClick={() => toggleSelection(age, selectedAges, setSelectedAges)}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${selectedAges.includes(age) ? 'bg-[#2E7D32] text-white border-[#2E7D32]' : 'bg-[#F9F9F6] text-[#1A1A1A] border-transparent hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32]'}`}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">الثمن (درهم)</h3>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] text-[#757575] mb-1 block">من</label>
                      <input 
                        type="number"
                        placeholder="مثلا: 1000"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full p-4 bg-[#F9F9F6] border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-[#2E7D32] outline-none text-right"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-[#757575] mb-1 block">إلى</label>
                      <input 
                        type="number"
                        placeholder="مثلا: 5000"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full p-4 bg-[#F9F9F6] border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-[#2E7D32] outline-none text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">التقييم (النجوم)</h3>
                  <div className="flex flex-col gap-3">
                    {[5, 4, 3].map(rating => (
                      <button
                        key={rating}
                        onClick={() => toggleSelection(rating, selectedRatings, setSelectedRatings)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold border transition-colors ${selectedRatings.includes(rating) ? 'bg-[#2E7D32] text-white border-[#2E7D32]' : 'bg-[#F9F9F6] text-[#1A1A1A] border-transparent hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32]'}`}
                      >
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < rating ? (selectedRatings.includes(rating) ? 'fill-white text-white' : 'fill-[#FFC107] text-[#FFC107]') : 'text-[#D1D1D1]'}`} />
                          ))}
                        </div>
                        <span>{rating} نجوم فما فوق</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-[#F9F9F6] flex gap-3">
                <button 
                  onClick={() => {
                    setSelectedTypes([]);
                    setSelectedSizes([]);
                    setSelectedRatings([]);
                    setSelectedAges([]);
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                  className="flex-1 py-4 text-sm font-bold text-[#757575] hover:text-[#1A1A1A] transition-colors border border-transparent hover:border-gray-300 rounded-xl"
                >
                  مسح الكل
                </button>
                <button 
                  onClick={() => setShowFilterModal(false)}
                  className="flex-[2] py-4 bg-[#2E7D32] text-white rounded-xl font-bold border border-transparent hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors"
                >
                  تطبيق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Content */}
        {filteredListings.length > 0 ? (
          viewMode === 'map' ? (
            /* MAP FULLSCREEN MODE */
            <div className="fixed inset-0 top-[115px] md:top-[80px] z-40 bg-[#F9F9F6] animate-in fade-in duration-300" dir="ltr">

              {/* ── Floating top-right: View switcher + Filter + Breed buttons ── */}
              <div className={`absolute top-3 right-3 z-[60] flex flex-col items-end gap-2 transition-all ${showListingSidebar ? 'md:right-[390px]' : ''}`} dir="rtl">

              {/* Row: Views (horizontal) + Filter (next to views) */}
                <div className="flex flex-row items-start gap-2">
                  {/* Detached List button — only visible when sidebar is hidden */}
                  {!showListingSidebar && (
                    <button
                      onClick={() => setShowListingSidebar(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#2E7D32] text-white text-xs font-black transition-all hover:bg-[#1B5E20] shadow-lg backdrop-blur-md border border-white/10 animate-in fade-in slide-in-from-right-2 duration-300"
                    >
                      <ListIcon className="w-4 h-4" />
                      <span>القائمة ({filteredListings.length})</span>
                    </button>
                  )}

                  {/* View switcher pill */}
                  <div className="bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl p-1 shadow-lg flex flex-row gap-1">
                    {/* Grid — rightmost */}
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[#2E7D32] text-white shadow-sm' : 'text-[#757575] hover:bg-[#F9F9F6]'}`}
                      title="شبكي"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    {/* List — middle */}
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[#2E7D32] text-white shadow-sm' : 'text-[#757575] hover:bg-[#F9F9F6]'}`}
                      title="قائمة"
                    >
                      <ListIcon className="w-4 h-4" />
                    </button>
                    {/* Map — leftmost (divider) */}
                    <div className="w-px bg-outline-variant/20 my-1" />
                    <button
                      onClick={() => setViewMode('map')}
                      className={`p-2.5 rounded-xl transition-all ${viewMode === 'map' ? 'bg-[#2E7D32] text-white shadow-sm' : 'text-[#757575] hover:bg-[#F9F9F6]'}`}
                      title="خريطة"
                    >
                      <MapIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Filter + Breed types (horizontal) */}
                  <div className="flex flex-row flex-wrap gap-1.5 items-center">
                    {/* Filter button */}
                    <button
                      onClick={() => setShowFilterModal(true)}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-black shadow-lg backdrop-blur-md transition-all border ${
                        selectedTypes.length > 0 || selectedSizes.length > 0 || selectedRatings.length > 0 || selectedAges.length > 0 || minPrice || maxPrice
                          ? 'bg-[#2E7D32] border-[#2E7D32] text-white'
                          : 'bg-white/90 border-white/20 text-[#1A1A1A]'
                      }`}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span className="hidden sm:inline">تصفية</span>
                      {(selectedTypes.length + selectedSizes.length + selectedRatings.length + selectedAges.length) > 0 && (
                        <span className="bg-white/30 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                          {selectedTypes.length + selectedSizes.length + selectedRatings.length + selectedAges.length}
                        </span>
                      )}
                    </button>

                    {/* Breed types — horizontal */}
                    <div className="hidden sm:flex flex-row gap-1.5">
                      {['سردي', 'بركي', 'مستورد'].map(type => (
                        <button
                          key={type}
                          onClick={() => toggleSelection(type, selectedTypes, setSelectedTypes)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black shadow-md backdrop-blur-md transition-all border ${
                            selectedTypes.includes(type)
                              ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                              : 'bg-white/90 text-[#1A1A1A] border-white/20 hover:border-[#2E7D32]/40'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                </div>


              {/* ── The map itself (full screen) ── */}
              <div className="w-full h-full">
                <GoogleMapComponent
                  listings={(Array.isArray(filteredListings) ? filteredListings : [])
                    .filter(l => l.coordinates && l.coordinates.lat && l.coordinates.lng)
                    .map((l: any) => ({
                      id: l.id,
                      title: l.sellerPseudo || l.sellerName || l.title || 'ضيعة',
                      breed: l.category || 'سردي',
                      location: l.location || 'غير محدد',
                      weight: l.sizes?.[0] || '~50kg',
                      verified: true,
                      rating: l.rating || 5,
                      image: l.images?.[0] || l.image || "https://picsum.photos/seed/sheep/200/200",
                      lat: l.coordinates.lat,
                      lng: l.coordinates.lng,
                      phone: l.phone,
                      whatsapp: l.whatsapp
                    }))}
                  onListingClick={(listing) => onNavigate('listing-details', listing.id)}
                  onContactClick={(listing) => {
                    setSelectedSellerPhone(listing.phone || null);
                    setSelectedSellerWhatsapp(listing.whatsapp || null);
                    setSelectedListingId(listing.id);
                    setContactModalOpen(true);
                  }}
                  hoveredListingId={hoveredMarker}
                  setHoveredListingId={setHoveredMarker}
                />
              </div>

              {/* City Selection Required Alert */}
              <AnimatePresence>
                {showCityAlert && (
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[80] w-[90%] max-w-sm bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-500/20"
                    dir="rtl"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black leading-tight">عافاك اختار المدينة فين كتقلب أولاً</p>
                      <p className="text-[10px] font-bold opacity-80 mt-0.5">باش نقدروا نلقاو ليك أحسن العروض قريب ليك</p>
                    </div>
                    <button 
                      onClick={() => setShowCityAlert(false)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Right sidebar (slides in) ── */}
              {showListingSidebar && (
                <div className="absolute inset-y-0 right-0 w-full md:w-[380px] bg-[#FDFCF8] border-l border-outline-variant/20 z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" dir="rtl">
                  {/* Sidebar header */}
                  <div className="p-4 border-b border-outline-variant/20 bg-white flex items-center justify-between shrink-0">
                    <div>
                      <h2 className="text-base font-black text-[#1A1A1A]">{filteredListings.length} حولي فـ المنطقة</h2>
                      <p className="text-[10px] text-[#757575] font-bold">
                        {!settings.disableSearchRadius ? `شعاع ${radiusSearch === 'all' ? '150' : radiusSearch} كلم من ${citySearch}` : `نتائج البحث في ${citySearch}`}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowListingSidebar(false)}
                      className="p-2 rounded-xl hover:bg-[#F9F9F6] transition-colors border border-transparent hover:border-outline-variant/20"
                    >
                      <X className="w-5 h-5 text-[#757575]" />
                    </button>
                  </div>

                  {/* Sidebar listing list — BuyerHomeView style */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
                    {filteredListings.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((listing: any) => {
                      const listingImage = listing.images?.[0] || listing.image || "https://images.unsplash.com/photo-1511117833895-4b473c0b85d6?auto=format&fit=crop&q=80&w=800";
                      return (
                        <div
                          key={listing.id}
                          className={`bg-white rounded-2xl p-3 flex gap-3 border transition-all cursor-pointer group relative overflow-hidden ${hoveredMarker === listing.id ? 'border-[#2E7D32] shadow-md ring-1 ring-[#2E7D32]/20' : 'border-outline-variant/20 hover:shadow-md hover:border-[#2E7D32]/30'}`}
                          onClick={() => onNavigate('listing-details', listing.id)}
                          onMouseEnter={() => setHoveredMarker(listing.id)}
                          onMouseLeave={() => setHoveredMarker(null)}
                        >
                          <div className="w-24 h-24 rounded-xl overflow-hidden relative shrink-0">
                            <img alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={listingImage} referrerPolicy="no-referrer" />
                            <div className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-sm text-[#2E7D32] px-1.5 py-0.5 rounded-lg text-[9px] font-black shadow-sm">
                              {listing.minPrice || listing.price || '0'} د.م
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                            <div>
                              <h4 className="font-bold text-[#1A1A1A] text-sm mb-0.5 truncate">
                                ضيعة {listing.sellerPseudo || listing.sellerName || 'كساب'}
                              </h4>
                              <div className="flex items-center gap-1 text-[#757575] text-[10px] font-bold mb-1">
                                <MapPin className="w-3 h-3 text-[#2E7D32] shrink-0" />
                                <span className="truncate">
                                  {getDisplayCity(listing)}
                                  {!settings.disableSearchRadius && listing.calculatedDistance && listing.calculatedDistance !== 999 && ` (${Math.round(listing.calculatedDistance)} كلم)`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="bg-[#E8F5E9] text-[#2E7D32] text-[9px] font-black px-2 py-0.5 rounded-lg">{listing.category || 'سردي'}</span>
                                <div className="flex items-center gap-0.5 bg-[#FFF9C4] px-1.5 py-0.5 rounded text-[#F57F17]">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  <span className="text-[9px] font-black">
                                    {listing.ratingCount > 0 ? ((listing.rating || 0) / listing.ratingCount).toFixed(1) : '5.0'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1.5 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSellerPhone(listing.phone || null);
                                  setSelectedSellerWhatsapp(listing.whatsapp || null);
                                  setSelectedListingId(listing.id);
                                  setContactModalOpen(true);
                                }}
                                className="flex-1 py-1.5 bg-[#2E7D32] text-white text-[10px] font-black rounded-lg shadow-sm hover:bg-[#1B5E20] transition-all text-center flex items-center justify-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                تواصل
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); onNavigate('listing-details', listing.id); }}
                                className="flex-1 py-1.5 bg-[#F9F9F6] text-[#1A1A1A] text-[10px] font-black rounded-lg border border-outline-variant/20 hover:border-[#2E7D32]/30 transition-all text-center"
                              >
                                التفاصيل
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex flex-col gap-4 sm:gap-6 max-w-5xl mx-auto">
              {filteredListings.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((listing) => (
                <div 
                  key={listing.id} 
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-row min-h-[140px]" 
                  onClick={() => onNavigate('listing-details', listing.id)}
                >
                  <div className="relative w-[140px] h-[140px] sm:w-[200px] sm:h-[200px] shrink-0 self-start">
                    <img 
                      alt={listing.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      src={listing.images?.[0] || listing.image || "https://images.unsplash.com/photo-1511117833895-4b473c0b85d6?auto=format&fit=crop&q=80&w=800"} 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-xl font-black text-[#1A1A1A] group-hover:text-[#2E7D32] transition-colors truncate mb-1">ضيعة {listing.sellerPseudo || listing.sellerName || 'كساب'}</h3>
                        <div className="flex items-center gap-1 text-[10px] sm:text-sm text-[#757575] font-bold">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-[#2E7D32] shrink-0" />
                          <span className="truncate">
                            {getDisplayCity(listing)}
                            {!settings.disableSearchRadius && listing.calculatedDistance && listing.calculatedDistance !== 999 && ` (${Math.round(listing.calculatedDistance)} كلم)`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-[#FFF9C4] px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold text-[#F57F17] shrink-0">
                        <Star className="w-3 h-3 fill-current" />
                        <span>
                          {listing.ratingCount > 0 
                            ? ((listing.rating || 0) / listing.ratingCount).toFixed(1) 
                            : '5.0'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="bg-[#E8F5E9] px-2 py-0.5 rounded text-[10px] sm:text-xs font-black text-[#2E7D32] border border-[#2E7D32]/10">{listing.category || 'سردي'}</span>
                      {(Array.isArray(listing.sizes) ? listing.sizes : []).slice(0, 2).map((size: string, idx: number) => (
                        <span key={idx} className="bg-[#F9F9F6] px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold text-[#4A4A4A] border border-outline-variant/10">
                          {size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : size === 'large' ? 'كبير' : size === 'extra-large' ? 'كبير جداً' : size}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                      <div className="text-[#2E7D32] font-black text-xs sm:text-lg truncate">
                        كيبدا من {listing.minPrice || listing.price || '0'} درهم
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSellerPhone(listing.phone);
                            setSelectedSellerWhatsapp(listing.whatsapp);
                            setSelectedListingId(listing.id);
                            setContactModalOpen(true);
                          }}
                          className="flex-1 sm:flex-none px-3 py-1.5 sm:px-6 sm:py-2.5 bg-[#2E7D32] text-white rounded-lg text-[10px] sm:text-sm font-black transition-colors hover:bg-[#1B5E20] text-center shadow-sm"
                        >
                          تواصل
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('listing-details', listing.id);
                          }}
                          className="flex-1 sm:flex-none px-3 py-1.5 sm:px-6 sm:py-2.5 bg-white text-[#2E7D32] border border-[#2E7D32]/20 rounded-lg text-[10px] sm:text-sm font-black transition-colors hover:bg-[#2E7D32]/5 text-center"
                        >
                          التفاصيل
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredListings.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((listing) => (
              <div key={listing.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20 hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={() => onNavigate('listing-details', listing.id)}>
                <div className="relative h-64 overflow-hidden">
                  <img alt={listing.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={listing.images?.[0] || listing.image || "https://images.unsplash.com/photo-1511117833895-4b473c0b85d6?auto=format&fit=crop&q=80&w=800"} referrerPolicy="no-referrer" />
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
                        const dist = listing.calculatedDistance || listing.distance || 0;
                        const city = getDisplayCity(listing);
                        
                        if (dist === 0 || dist >= 999 || settings.disableSearchRadius) return city;
                        if (dist < 5) return `${city} (قريب ليك)`;
                        if (dist < 25) return `${city} (على بعد ${Math.round(dist)} كلم)`;
                        if (dist < 80) return `${city} (بعيد شوية، ${Math.round(dist)} كلم)`;
                        return `${city} (بعيد)`;
                      })()}
                    </span>
                  </div>
                  {!settings.guestBuyerMode && (
                    <button className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur rounded-full text-[#757575] hover:text-red-500 transition-colors shadow-sm">
                      <Heart className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[#2E7D32] font-bold truncate max-w-[150px]">ضيعة {listing.sellerPseudo || listing.sellerName || 'كساب'}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#757575]">الحجم:</span>
                        <div className="flex gap-1 text-[10px] font-bold text-[#4A4A4A]">
                          {(Array.isArray(listing.sizes) ? listing.sizes : []).slice(0, 3).map((size: string, idx: number) => (
                            <span key={idx} className="bg-[#F9F9F6] px-1.5 py-0.5 rounded border border-outline-variant/10">
                              {size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : size === 'large' ? 'كبير' : size === 'extra-large' ? 'كبير جداً' : size}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[#757575] text-sm font-bold">
                        <span className="truncate max-w-[200px]">{listing.farmLocation || 'موقع الضيعة غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-0.5" dir="ltr">
                        {[...Array(5)].map((_, i) => {
                          const avg = listing.ratingCount > 0 ? (listing.rating || 0) / listing.ratingCount : 5;
                          return (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(avg) ? 'fill-[#FFC107] text-[#FFC107]' : 'text-[#D1D1D1]'}`} />
                          );
                        })}
                        {listing.ratingCount > 0 && (
                          <span className="text-[10px] text-on-surface-variant font-bold ml-1">({listing.ratingCount})</span>
                        )}
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
                        className="py-2.5 bg-[#2E7D32] text-white font-bold rounded-lg border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors text-sm text-center flex items-center justify-center"
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
              </div>
            ))}
          </div>
        )) : (
          <div className="bg-white rounded-[32px] p-6 md:p-16 text-center border border-outline-variant/20 shadow-xl max-w-4xl mx-auto overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8F5E9] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
            <div className="relative z-10">

              {/* Title */}
              <h2 className="text-xl md:text-3xl font-black text-[#1A1A1A] mb-2 font-headline leading-tight">
                مالقينا حتى حولي فـ <span className="text-[#2E7D32]">{citySearch || 'هاد البلاصة'}</span> دابا
              </h2>
              <p className="text-[#757575] text-sm md:text-base font-medium max-w-lg mx-auto mb-8">
                ولكن كاينين عروض زوينة فـ مدن أخرى قريبة ليك
              </p>

              {/* Cities grid */}
              <div className="bg-[#FDFCF8] rounded-3xl p-6 border border-outline-variant/20 shadow-inner mb-8">
                <p className="text-xs font-black text-[#757575] uppercase tracking-widest mb-5">مدن فيها عروض قريبة ليك</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(() => {
                    // Aggregate counts
                    const cityCounts: Record<string, number> = {};
                    (Array.isArray(listings) ? listings : []).forEach(l => {
                      const city = getDisplayCity(l);
                      cityCounts[city] = (cityCounts[city] || 0) + 1;
                    });

                    // Distance-based recommendations
                    const searchCoords = cityCoords[citySearch];
                    const recommendations = Object.entries(cityCoords)
                      .map(([name, coords]) => {
                        const dist = searchCoords ? calculateDistance(searchCoords.lat, searchCoords.lng, coords.lat, coords.lng) : 0;
                        return { name, dist, count: cityCounts[name] || 0 };
                      })
                      .filter(c => c.count > 0 && c.name !== citySearch)
                      .sort((a, b) => a.dist - b.dist)
                      .slice(0, 4);

                    // Fallback to most popular if no nearby have listings
                    const finalRecs = recommendations.length > 0 ? recommendations : 
                      Object.entries(cityCounts)
                        .map(([name, count]) => ({ name, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 4);

                    return finalRecs.map(city => (
                      <button 
                        key={city.name}
                        onClick={() => setCitySearch(city.name)}
                        className="flex flex-col items-center p-4 bg-white rounded-2xl border border-outline-variant/10 hover:border-[#2E7D32] hover:shadow-md transition-all group"
                      >
                        <span className="text-[#1A1A1A] font-bold mb-1 group-hover:text-[#2E7D32]">{city.name}</span>
                        <span className="text-[10px] text-[#2E7D32] font-black bg-[#E8F5E9] px-2 py-0.5 rounded-full">{city.count} حولي</span>
                      </button>
                    ));
                  })()}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    const popularCities = ['الدار البيضاء', 'سطات', 'الرباط', 'مراكش', 'فاس', 'مكناس'];
                    const nextCity = popularCities[Math.floor(Math.random() * popularCities.length)];
                    setCitySearch(nextCity);
                  }}
                  className="w-full sm:w-auto bg-[#2E7D32] text-white px-8 py-3.5 rounded-2xl font-black border border-transparent hover:bg-[#1B5E20] transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>قلب فـ مدينة أخرى</span>
                </button>
                <button
                  onClick={() => onNavigate('home')}
                  className="w-full sm:w-auto bg-[#F9F9F6] text-[#1A1A1A] px-8 py-3.5 rounded-2xl font-black border border-outline-variant/20 hover:border-[#757575] transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>الرجوع للرئيسية</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Pagination — pure local, all data already loaded */}
        {filteredListings.length > 0 && Math.ceil(filteredListings.length / pageSize) > 1 && (
          <div className="flex flex-col items-center gap-6 mt-12 mb-20">
            <div className="flex items-center gap-2">
              {/* Prev */}
<button
                disabled={currentPage === 1}
                onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="p-2 rounded-xl bg-white border border-outline-variant/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F9F9F6] transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {[...Array(Math.ceil(filteredListings.length / pageSize))].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${
                      currentPage === i + 1
                        ? 'bg-[#2E7D32] text-white shadow-lg'
                        : 'bg-white text-[#757575] border border-outline-variant/10 hover:border-[#2E7D32]/30'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Next */}
              <button
                disabled={currentPage === Math.ceil(filteredListings.length / pageSize)}
                onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="p-2 rounded-xl bg-white border border-outline-variant/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F9F9F6] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
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
