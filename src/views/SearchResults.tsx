import React, { useState, useRef, useEffect } from 'react';
import { ViewType } from '../App';
import { Search, MapPin, Star, ArrowLeft, SlidersHorizontal, Heart, LayoutGrid, List as ListIcon, Map as MapIcon, Scale, BadgeCheck, X, PlusCircle, Loader2, TrendingUp, ChevronDown, Phone } from 'lucide-react';
import SearchHeader from '../components/SearchHeader';
import GoogleMapComponent from '../components/GoogleMap';
import { firestoreService } from '../services/firestoreService';
import { cityMapping, cityCoords, getDisplayCity } from '../constants/cityMapping';
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
  const [citySearch, setCitySearch] = useState(initialCity || 'سطات');
  const [radiusSearch, setRadiusSearch] = useState(initialRadius || '10');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [isLoading, setIsLoading] = useState(true);

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
  const [nextCursor, setNextCursor] = useState<string | null>(null);
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

  const { settings } = useSettings();
  const { profile } = useAuth();

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    const fetchListings = async () => {
      const response = await firestoreService.getAnnouncements(selectedCategory === 'الكل' ? undefined : selectedCategory);
      if (response && response.data) {
        setListings(response.data);
        setNextCursor(response.nextCursor);
      }
      setIsLoading(false);
    };
    fetchListings();
  }, [selectedCategory]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const response = await firestoreService.getAnnouncements(
        selectedCategory === 'الكل' ? undefined : selectedCategory,
        nextCursor
      );
      
      if (response && response.data) {
        setListings(prev => [...prev, ...response.data]);
        setNextCursor(response.nextCursor);
      }
    } catch (error) {
      console.error("Error loading more listings:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const filteredListings = listings.filter(listing => {
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
    const searchCoords = cityCoords[citySearch];

    // Check if the city search matches the calculated display city
    const displayCity = getDisplayCity(listing);
    const matchesCityName = displayCity.includes(citySearch) || (listing.location && listing.location.includes(citySearch) && !listing.coordinates);

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
    if (radiusSearch !== 'all') {
      const radius = parseInt(radiusSearch);
      // It's a match if within radius OR if city name directly matches the text
      matchesDistance = (dist !== 999 && dist <= radius) || matchesCityName;
    } else {
      // If "all" is selected, we interpret "all" as max 250km radius (broader than 150km for 'all')
      matchesDistance = (dist !== 999 && dist <= 250) || matchesCityName || !citySearch;
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

  const renderViewSwitcher = () => (
    <div className="flex bg-white rounded-xl border border-outline-variant/30 p-1 shadow-sm">
      <button 
        onClick={() => setViewMode('grid')}
        className={`p-2 rounded-lg transition-colors border border-transparent ${viewMode === 'grid' ? 'bg-[#2E7D32] text-white shadow-md border-[#2E7D32]' : 'text-[#757575] hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32]'}`}
        title="عرض شبكي"
      >
        <LayoutGrid className="w-5 h-5" />
      </button>
      <button 
        onClick={() => setViewMode('list')}
        className={`p-2 rounded-lg transition-colors border border-transparent ${viewMode === 'list' ? 'bg-[#2E7D32] text-white shadow-md border-[#2E7D32]' : 'text-[#757575] hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32]'}`}
        title="عرض قائمة"
      >
        <ListIcon className="w-5 h-5" />
      </button>
      <button 
        onClick={() => setViewMode('map')}
        className={`p-2 rounded-lg transition-colors border border-transparent ${viewMode === 'map' ? 'bg-[#2E7D32] text-white shadow-md border-[#2E7D32]' : 'text-[#757575] hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32]'}`}
        title="عرض الخريطة"
      >
        <MapIcon className="w-5 h-5" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCF8] antialiased" dir="rtl">
      <SearchHeader onNavigate={onNavigate} initialCity={citySearch} initialRadius={radiusSearch} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="flex flex-col mb-10 gap-6">
          {/* Row 1: Title (Right) */}
          <div className="flex flex-col text-right">
            <h1 className="text-xl md:text-3xl font-black text-[#1A1A1A] font-headline mb-1 tracking-tight">
              نتائج البحث في {citySearch} {radiusSearch !== 'all' && `ضمن محيط (${radiusSearch} كلم)`}
            </h1>
            <p className="text-[#757575] font-black text-xs md:text-sm">لقيت ليك {filteredListings.length} ضيعات قريبة ليك</p>
          </div>

          {/* Row 2: Views (Right) & Filters (Left) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-outline-variant/10 pt-6">
            {/* View Switcher (Right in RTL) */}
            <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-outline-variant/20 shadow-sm order-1">
              {renderViewSwitcher()}
            </div>

            {/* Filters Group (Left in RTL) */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar flex-1 justify-end order-2">
              <div className="relative">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none px-12 py-2.5 rounded-2xl text-sm font-black bg-white text-[#1A1A1A] border border-outline-variant/30 hover:border-[#2E7D32] transition-all focus:outline-none focus:ring-4 focus:ring-[#2E7D32]/10 pr-10 shadow-sm"
                >
                  <option value="newest">الأحدث أولاً</option>
                  <option value="price-asc">الثمن: من الأقل</option>
                  <option value="price-desc">الثمن: من الأعلى</option>
                  <option value="rating">الأعلى تقييماً</option>
                </select>
                <TrendingUp className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-[#2E7D32] pointer-events-none" />
                <ChevronDown className="w-3 h-3 absolute left-4 top-1/2 -translate-y-1/2 text-[#757575] pointer-events-none" />
              </div>

              <div className="flex items-center gap-2">
                {['سردي', 'بركي', 'مستورد'].map(type => (
                  <button 
                    key={type}
                    onClick={() => toggleSelection(type, selectedTypes, setSelectedTypes)}
                    className={`px-6 py-2.5 rounded-2xl text-sm font-black transition-all whitespace-nowrap border shadow-sm ${selectedTypes.includes(type) ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]' : 'bg-white text-[#1A1A1A] border-outline-variant/30 hover:border-[#2E7D32]'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setShowFilterModal(true)}
                className={`flex items-center gap-2 border transition-all duration-300 ${selectedTypes.length > 0 || selectedSizes.length > 0 || selectedRatings.length > 0 || selectedAges.length > 0 || minPrice || maxPrice ? 'bg-[#2E7D32] border-[#2E7D32] text-white' : 'bg-white border-outline-variant/30 text-[#1A1A1A]'} px-6 py-2.5 rounded-2xl text-sm font-black hover:shadow-lg`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>تصفية</span>
              </button>
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
            <div className="flex flex-col md:flex-row bg-white rounded-3xl overflow-hidden shadow-sm border border-outline-variant/20 h-[calc(100vh-240px)] min-h-[500px] animate-in fade-in duration-500 relative z-10">
              {/* Desktop Sidebar / Mobile List Tab */}
              <div className={`w-full md:w-[400px] lg:w-[450px] flex-col border-l border-outline-variant/20 bg-[#FDFCF8] ${activeTab === 'map' ? 'hidden md:flex' : 'flex'} h-full shrink-0 relative z-20`}>
                <div className="p-4 border-b border-outline-variant/20 bg-white flex justify-between items-center shrink-0">
                  <div>
                    <h2 className="text-lg font-black text-[#1A1A1A] font-headline">{filteredListings.length} حولي فـ الخريطة</h2>
                    <p className="text-xs text-[#757575]">شعاع {radiusSearch === 'all' ? '150' : radiusSearch} كلم</p>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
                  {filteredListings.map((listing: any) => {
                    return (
                      <div 
                        key={listing.id} 
                        className={`bg-white rounded-2xl overflow-hidden flex flex-row min-h-[120px] border transition-all cursor-pointer group ${hoveredMarker === listing.id ? 'border-[#2E7D32] shadow-md ring-1 ring-[#2E7D32]' : 'border-outline-variant/30 hover:shadow-md'}`}
                        onClick={() => onNavigate('listing-details', listing.id)}
                        onMouseEnter={() => setHoveredMarker(listing.id)}
                        onMouseLeave={() => setHoveredMarker(null)}
                      >
                        <div className="w-[120px] h-[120px] relative shrink-0 self-start">
                          <img alt={listing.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={listing.images?.[0] || listing.image || "https://images.unsplash.com/photo-1511117833895-4b473c0b85d6?auto=format&fit=crop&q=80&w=800"} referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 p-2.5 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex justify-between items-start mb-0.5 gap-2">
                              <h3 className="font-black text-[#1A1A1A] text-xs truncate flex-1">ضيعة {listing.sellerPseudo || listing.sellerName || 'كساب'}</h3>
                              <span className="text-[8px] font-black text-[#2E7D32] bg-[#2E7D32]/10 px-1.5 py-0.5 rounded-md shrink-0">{listing.category || 'سردي'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#757575] text-[9px] font-bold">
                              <MapPin className="w-2.5 h-2.5 text-[#2E7D32] shrink-0" />
                              <span className="truncate">
                                {getDisplayCity(listing)}
                                {listing.calculatedDistance && listing.calculatedDistance !== 999 && ` (${Math.round(listing.calculatedDistance)} كلم)`}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-outline-variant/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[#2E7D32] font-black text-[11px] truncate pr-1">من {listing.minPrice || listing.price} د.م</span>
                              <div className="flex items-center gap-0.5 shrink-0 bg-[#FFF9C4] px-1 rounded text-[#F57F17]">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                <span className="text-[9px] font-black">{(listing.rating || 5).toFixed(1)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSellerPhone(listing.phone || null);
                                  setSelectedSellerWhatsapp(listing.whatsapp || null);
                                  setSelectedListingId(listing.id);
                                  setContactModalOpen(true);
                                }}
                                className="flex-1 py-1.5 bg-[#2E7D32] text-white text-[9px] font-black rounded-lg shadow-sm hover:bg-[#1B5E20] transition-all flex justify-center items-center"
                              >
                                تواصل
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Map Area */}
              <div className={`flex-1 relative bg-[#F9F9F6] ${activeTab === 'list' ? 'hidden md:block' : 'block'} h-full`}>
                <GoogleMapComponent
                  listings={filteredListings
                    .filter(l => l.coordinates && l.coordinates.lat && l.coordinates.lng)
                    .map((l: any) => ({
                      id: l.id,
                      title: l.title,
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
                
                {/* Mobile Floating Toggle for Map/List */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:hidden z-[60]">
                  <div className="bg-[#1A1A1A] p-1 rounded-full shadow-2xl flex items-center gap-1 backdrop-blur-md bg-opacity-90 border border-white/10">
                    <button 
                      onClick={() => setActiveTab('map')} 
                      className={`px-6 py-2 rounded-full text-xs font-black transition-all ${activeTab === 'map' ? 'bg-white text-[#1A1A1A] shadow-md' : 'text-white/70 hover:text-white'}`}
                    >
                      الخريطة
                    </button>
                    <button 
                      onClick={() => setActiveTab('list')} 
                      className={`px-6 py-2 rounded-full text-xs font-black transition-all ${activeTab === 'list' ? 'bg-white text-[#1A1A1A] shadow-md' : 'text-white/70 hover:text-white'}`}
                    >
                      اللائحة
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex flex-col gap-4 sm:gap-6 max-w-5xl mx-auto">
              {filteredListings.map((listing) => (
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
                            {listing.calculatedDistance && listing.calculatedDistance !== 999 && ` (${Math.round(listing.calculatedDistance)} كلم)`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-[#FFF9C4] px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold text-[#F57F17] shrink-0">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{(listing.rating || 5).toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="bg-[#E8F5E9] px-2 py-0.5 rounded text-[10px] sm:text-xs font-black text-[#2E7D32] border border-[#2E7D32]/10">{listing.category || 'سردي'}</span>
                      {listing.sizes?.slice(0, 2).map((size: string, idx: number) => (
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
            {filteredListings.map((listing) => (
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
                        
                        if (dist === 0 || dist >= 999) return city;
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
                      <p className="text-[#2E7D32] font-bold">ضيعة {listing.sellerPseudo || listing.sellerName || 'كساب'}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#757575]">الحجم:</span>
                        <div className="flex gap-1 text-[10px] font-bold text-[#4A4A4A]">
                          {listing.sizes?.slice(0, 3).map((size: string, idx: number) => (
                            <span key={idx} className="bg-[#F9F9F6] px-1.5 py-0.5 rounded border border-outline-variant/10">
                              {size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : size === 'large' ? 'كبير' : size === 'extra-large' ? 'كبير جداً' : size}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[#757575] text-sm font-bold">
                        <span>{listing.farmLocation || 'موقع الضيعة غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-0.5" dir="ltr">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < (listing.rating || 5) ? 'fill-[#FFC107] text-[#FFC107]' : 'text-[#D1D1D1]'}`} />
                        ))}
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
          <div className="bg-white rounded-[32px] p-8 md:p-20 text-center border border-outline-variant/20 shadow-xl max-w-4xl mx-auto overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8F5E9] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-[#F9F9F6] rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-outline-variant/10">
                <Search className="w-10 h-10 md:w-14 md:h-14 text-[#2E7D32] opacity-20" />
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-[#1A1A1A] mb-6 font-headline leading-tight">مالقينا حتى حولي فهاد البلاصة دابا</h2>
              <p className="text-[#757575] md:text-lg font-medium max-w-lg mx-auto mb-10 leading-relaxed">
                سمح لينا، حاليا ماكاينش شي إعلان فـ <span className="text-[#2E7D32] font-bold underline decoration-wavy underline-offset-4">{citySearch || 'هاد المنطقة'}</span>. 
                ولكن تقدر تلقى عروض زوينة فـ مدن خرى قريبة ليك.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <button 
                  onClick={() => {
                    const popularCities = ['الدار البيضاء', 'سطات', 'الرباط', 'مراكش'];
                    const nextCity = popularCities[Math.floor(Math.random() * popularCities.length)];
                    setCitySearch(nextCity);
                  }}
                  className="w-full sm:w-auto bg-[#2E7D32] text-white px-10 py-4 rounded-2xl font-bold border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-all shadow-lg hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-5 h-5" />
                  <span>قلب فـ مدينة أخرى</span>
                </button>
                <button 
                  onClick={() => onNavigate('home')}
                  className="w-full sm:w-auto bg-[#F9F9F6] text-[#1A1A1A] px-10 py-4 rounded-2xl font-bold border border-transparent hover:border-[#757575] transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>الرجوع للرئيسية</span>
                </button>
              </div>

              <div className="bg-[#FDFCF8] rounded-3xl p-8 border border-outline-variant/20 shadow-inner">
                <p className="text-sm font-bold text-[#757575] uppercase tracking-widest mb-6">مدن فيها عروض قريبة ليك</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(() => {
                    // Aggregate counts
                    const cityCounts: Record<string, number> = {};
                    listings.forEach(l => {
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
            </div>
          </div>
        )}

        {/* Load More Button */}
        {nextCursor && filteredListings.length > 0 && viewMode !== 'map' && (
          <div className="mt-12 text-center pb-12">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-8 py-4 bg-white border-2 border-[#2E7D32] text-[#2E7D32] rounded-2xl font-bold flex items-center justify-center gap-3 mx-auto hover:bg-[#2E7D32] hover:text-white transition-all shadow-md group disabled:opacity-50"
            >
              {isLoadingMore ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              )}
              <span>{isLoadingMore ? 'جاري التحميل...' : 'شوف عروض أخرى'}</span>
            </button>
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
