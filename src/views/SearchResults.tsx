import React, { useState, useRef, useEffect } from 'react';
import { ViewType } from '../App';
import { Search, MapPin, Star, ArrowLeft, SlidersHorizontal, Heart, LayoutGrid, List as ListIcon, Map as MapIcon, Scale, BadgeCheck, X } from 'lucide-react';
import SearchHeader from '../components/SearchHeader';
import GoogleMapComponent from '../components/GoogleMap';
import { firestoreService } from '../services/firestoreService';
import { cityMapping, cityCoords, getDisplayCity } from '../constants/cityMapping';
import ContactSellerModal from '../components/ContactSellerModal';
import LoginRequiredModal from '../components/LoginRequiredModal';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
  initialCity?: string;
  initialRadius?: string;
}

const moroccanCities = [
  "الدار البيضاء", "الرباط", "فاس", "مراكش", "أكادير", "طنجة", "مكناس", "وجدة", "القنيطرة", "تطوان", "خريبكة", "بني ملال", "الجديدة", "آسفي", "سطات", "برشيد", "الخميسات", "الناظور", "تازة", "المحمدية", "سلا", "تمارة", "العرائش", "كلميم", "بركان", "الفقيه بن صالح", "تاوريرت", "بوسكورة", "ورزازات", "العيون", "الداخلة", "تارودانت", "قلعة السراغنة", "سيدي سليمان", "سيدي قاسم", "تيزنيت", "طانطان", "شفشاون", "الحسيمة", "تيفلت", "وزان", "جرسيف", "المضيق", "الفنيدق", "سوق الأربعاء", "بوجدور", "تنغير", "زاكورة", "ميدلت", "اليوسفية", "بن جرير"
];

export default function SearchResults({ onNavigate, initialCity, initialRadius }: Props) {
  const [citySearch, setCitySearch] = useState(initialCity || 'سطات');
  const [radiusSearch, setRadiusSearch] = useState(initialRadius || '10');

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
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [listings, setListings] = useState<any[]>([]);

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
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);
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
      const anns = await firestoreService.getAnnouncements();
      if (anns) setListings(anns);
    };
    fetchListings();
  }, []);

  const filteredListings = listings.filter(listing => {
    const matchesTypes = selectedTypes.length === 0 || selectedTypes.includes(listing.category);
    const matchesSize = selectedSizes.length === 0 || (listing.sizes && listing.sizes.some((s: string) => selectedSizes.includes(s)));
    const matchesRating = selectedRatings.length === 0 || selectedRatings.includes(Math.floor(listing.rating || 0));
    const matchesAge = selectedAges.length === 0 || selectedAges.includes(listing.age);
    
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
      // If "all" is selected, we should prioritize the city if they typed one, 
      // but "all" generally means anywhere. Let's still favor strings or within a very large radius (e.g., 500km) so we don't return literally everything unless necessary?
      // Wait, "كاع لي كاين" (all) means "All the ones that exist". Typically users expect it to apply to the WHOLE country unless city search forces a match.
      // Since citySearch acts as a primary filter, if it's set and radius is "all", it usually means "anywhere in this city/region". 
      // Let's interpret "all" as max 100km radius for the specific city, OR matching city name.
      // If the city search is actually intended to filter... wait, if radius is 'all', matchesDistance is true means it ignores citySearch completely! 
      // Therefore, if radius is 'all', we *must* enforce basic city proximity.
      matchesDistance = (dist !== 999 && dist <= 150) || matchesCityName;
    }

    return matchesTypes && matchesSize && matchesRating && matchesAge && matchesDistance;
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#1A1A1A] font-headline mb-1">
              نتائج البحث في {citySearch}
              {radiusSearch !== 'all' && ` ضمن محيط (${radiusSearch} كلم)`}
            </h1>
            <p className="text-[#757575] font-medium">لقيت ليك {filteredListings.length} ضيعات قريبة ليك</p>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-2 -mt-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 no-scrollbar relative snap-x scroll-smooth">
            {renderViewSwitcher()}
            <button 
              onClick={() => setShowFilterModal(true)}
              className={`flex items-center gap-2 border transition-colors ${selectedTypes.length > 0 || selectedSizes.length > 0 || selectedRatings.length > 0 || selectedAges.length > 0 ? 'bg-white border-[#2E7D32] text-[#2E7D32]' : 'bg-white border-outline-variant/30 text-[#1A1A1A]'} px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#2E7D32] hover:text-white hover:border-[#2E7D32] whitespace-nowrap shadow-sm snap-start`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>تصفية</span>
            </button>
            {['سردي', 'بركي', 'مستورد'].map(type => (
              <button 
                key={type}
                onClick={() => toggleSelection(type, selectedTypes, setSelectedTypes)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border shadow-sm snap-start ${selectedTypes.includes(type) ? 'bg-[#2E7D32] text-white border-[#2E7D32]' : 'bg-white text-[#1A1A1A] border-outline-variant/30 hover:border-[#2E7D32]'}`}
              >
                {type}
              </button>
            ))}
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
                  <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">ثمن كيبدا</h3>
                  <input 
                    type="number"
                    placeholder="مثلا: 1000"
                    className="w-full p-4 bg-[#F9F9F6] border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-[#2E7D32] outline-none"
                  />
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
            <div className="fixed inset-0 top-[148px] md:top-[81px] bg-white z-40 flex flex-col md:flex-row shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
              {/* Floating Exit Button for Mobile Map View */}
              <div className="absolute top-4 left-4 z-[70] md:hidden">
                <button 
                  onClick={() => setViewMode('grid')}
                  className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-outline-variant/20 text-[#2E7D32]"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              </div>

              {/* Map Layout - similar to screenshot */}
              <div className={`w-full md:w-[450px] lg:w-[500px] bg-white flex flex-col border-l border-outline-variant/20 z-10 ${activeTab === 'map' ? 'hidden md:flex' : 'flex'} h-full overflow-hidden`}>
                <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-white shrink-0">
                  <div>
                    <h2 className="text-xl font-black text-[#1A1A1A] font-headline">{filteredListings.length} حولي قريب ليك</h2>
                    <p className="text-sm text-[#757575]">فشعاع {radiusSearch === 'all' ? '150' : radiusSearch} كلم من {citySearch}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowFilterModal(true)}
                      className="p-2 bg-[#F9F9F6] rounded-xl transition-colors border border-transparent hover:border-gray-300"
                    >
                      <SlidersHorizontal className="w-5 h-5 text-[#1A1A1A]" />
                    </button>
                    <button 
                      onClick={() => setViewMode('grid')}
                      className="p-2 bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-600 text-red-600 md:hidden"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                  {filteredListings.map((listing: any) => {
                    const isFavorite = !settings.guestBuyerMode && false; // Handle favoriting properly if needed
                    return (
                      <div 
                        key={listing.id} 
                        className={`bg-[#FDFCF8] rounded-2xl p-3 flex gap-4 border transition-all cursor-pointer group ${hoveredMarker === listing.id ? 'border-[#2E7D32] shadow-lg ring-1 ring-[#2E7D32]' : 'border-outline-variant/30 hover:shadow-lg'}`}
                        onClick={() => onNavigate('listing-details', listing.id)}
                        onMouseEnter={() => setHoveredMarker(listing.id)}
                        onMouseLeave={() => setHoveredMarker(null)}
                      >
                        <div className="w-28 h-28 rounded-xl overflow-hidden relative shrink-0">
                          <img alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={listing.images?.[0] || listing.image || "https://images.unsplash.com/photo-1511117833895-4b473c0b85d6?auto=format&fit=crop&q=80&w=800"} referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-bold text-[#2E7D32] bg-[#2E7D32]/10 px-2 py-0.5 rounded-md">{listing.category || 'سردي'}</span>
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < (listing.rating || 5) ? 'fill-[#FFC107] text-[#FFC107]' : 'text-[#D1D1D1]'}`} />
                                ))}
                              </div>
                            </div>
                            <h3 className="font-bold text-[#1A1A1A] text-sm mb-1 leading-tight">{listing.title}</h3>
                            <div className="flex items-center gap-1 text-[#757575] text-[10px] mb-2">
                              <MapPin className="w-3 h-3" />
                              <span>{getDisplayCity(listing)}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1 text-[#757575] font-bold">
                              <span className="text-[#2E7D32]">{listing.minPrice || listing.price} درهم</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#2E7D32] font-bold bg-[#E8F5E9] px-2 py-0.5 rounded text-[8px]">
                                <BadgeCheck className="w-3 h-3" />
                                <span>موثق</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Map/List Toggle */}
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-2xl flex md:hidden border border-outline-variant/10 z-[60]">
                   <button onClick={() => setActiveTab('map')} className={`px-8 py-3 rounded-full text-sm font-black transition-colors border border-transparent ${activeTab === 'map' ? 'bg-[#2E7D32] text-white shadow-lg border-[#2E7D32]' : 'text-[#757575] hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32]'}`}>الخريطة</button>
                   <button onClick={() => setActiveTab('list')} className={`px-8 py-3 rounded-full text-sm font-black transition-colors border border-transparent ${activeTab === 'list' ? 'bg-[#2E7D32] text-white shadow-lg border-[#2E7D32]' : 'text-[#757575] hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32]'}`}>اللائحة</button>
                </div>
              </div>

              {/* Map View */}
              <div className={`flex-1 relative bg-[#F9F9F6] ${activeTab === 'list' ? 'hidden md:block' : 'block'}`}>
                <GoogleMapComponent
                  listings={filteredListings.map((l: any) => ({
                    id: l.id,
                    title: l.title,
                    breed: l.category || 'سردي',
                    location: l.location || 'غير محدد',
                    weight: l.sizes?.[0] || '~50kg',
                    verified: true,
                    rating: l.rating || 5,
                    image: l.images?.[0] || l.image || "https://picsum.photos/seed/sheep/200/200",
                    lat: l.coordinates?.lat || 33.5731,
                    lng: l.coordinates?.lng || -7.5898
                  }))}
                  onListingClick={(listing) => onNavigate('listing-details', listing.id.toString())}
                  hoveredListingId={hoveredMarker}
                  setHoveredListingId={setHoveredMarker}
                />
                
                {/* View Switcher Overlay for Mobile Map */}
                <div className="absolute top-4 right-4 z-[70] md:hidden">
                  {renderViewSwitcher()}
                </div>

                {/* Close Map Button for Desktop */}
                <button 
                  onClick={() => setViewMode('grid')}
                  className="absolute top-4 right-4 p-3 bg-white rounded-2xl shadow-xl border border-outline-variant/20 transition-colors hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32] hidden md:flex items-center gap-2 group"
                >
                  <LayoutGrid className="w-5 h-5 text-[#2E7D32]" />
                  <span className="font-bold text-sm">رجوع للشبكة</span>
                </button>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex flex-col gap-4 max-w-4xl mx-auto">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-outline-variant/20 hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-row h-40 sm:h-56" onClick={() => onNavigate('listing-details', listing.id)}>
                  <div className="relative w-36 sm:w-72 h-full overflow-hidden shrink-0">
                    <img alt={listing.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={listing.images?.[0] || listing.image || "https://images.unsplash.com/photo-1511117833895-4b473c0b85d6?auto=format&fit=crop&q=80&w=800"} referrerPolicy="no-referrer" />
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-[#2E7D32] text-white px-2 py-0.5 md:px-3 md:py-1 rounded-lg md:rounded-full text-[10px] md:text-xs font-black shadow-lg">
                      {listing.minPrice || listing.price || '0'} درهم
                    </div>
                  </div>
                  <div className="p-3 md:p-6 flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="min-w-0">
                      <div className="flex items-center justify-between mb-0.5 md:mb-1">
                         <h3 className="text-sm md:text-xl font-black text-[#1A1A1A] group-hover:text-[#2E7D32] transition-colors truncate">{listing.title}</h3>
                         <div className="hidden md:flex items-center gap-0.5 shrink-0">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < (listing.rating || 5) ? 'fill-[#FFC107] text-[#FFC107]' : 'text-[#D1D1D1]'}`} />
                            ))}
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-2 md:gap-4 mb-1.5 md:mb-4 overflow-hidden">
                        <div className="flex items-center gap-1 text-[10px] md:text-sm text-[#757575] font-bold truncate">
                          <MapPin className="w-3 h-3 md:w-4 md:h-4 text-[#2E7D32] shrink-0" />
                          <span className="truncate">{getDisplayCity(listing)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] md:text-sm font-bold text-[#2E7D32] bg-[#E8F5E9] px-1.5 py-0.5 md:px-3 md:py-1 rounded-full shrink-0">
                           <BadgeCheck className="w-3 h-3 md:w-4 md:h-4" />
                           <span className="hidden sm:inline">ضيعة موثقة</span>
                           <span className="sm:hidden">موثق</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 md:gap-2 mb-1.5 md:mb-4 max-h-12 overflow-hidden">
                        <span className="bg-[#E8F5E9] px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-[8px] md:text-xs font-black text-[#2E7D32] border border-[#2E7D32]/10 tracking-tight">{listing.category || 'سردي'}</span>
                        {listing.sizes?.slice(0, 2).map((size: string, idx: number) => (
                          <span key={idx} className="bg-[#F9F9F6] px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-[8px] md:text-xs font-bold text-[#4A4A4A] border border-outline-variant/10 whitespace-nowrap">
                            {size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : size === 'large' ? 'كبير' : size === 'extra-large' ? 'كبير جداً' : size}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-1.5 md:pt-4 border-t border-outline-variant/10 shrink-0">
                      <div className="flex flex-col">
                        <p className="text-[9px] md:text-sm font-bold text-[#757575]">ضيعة <span className="text-[#1A1A1A]">{listing.sellerName || 'كساب محترف'}</span></p>
                        <div className="md:hidden flex items-center gap-0.5 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-2.5 h-2.5 ${i < (listing.rating || 5) ? 'fill-[#FFC107] text-[#FFC107]' : 'text-[#D1D1D1]'}`} />
                            ))}
                        </div>
                      </div>
                      <button className="text-[#2E7D32] font-black transition-colors border border-transparent hover:bg-transparent hover:text-[#2E7D32] hover:border-[#2E7D32] flex items-center gap-1 text-[10px] md:text-sm bg-[#2E7D32]/5 px-3 py-1.5 rounded-xl">
                        <span>التفاصيل</span>
                        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 ml-1" />
                      </button>
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
                      <p className="text-[#2E7D32] font-bold">ضيعة {listing.sellerName || 'كساب'}</p>
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
          <div className="bg-white rounded-3xl p-12 text-center border border-outline-variant/20 shadow-sm">
            <div className="w-20 h-20 bg-[#F9F9F6] rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-[#757575]" />
            </div>
            <h2 className="text-2xl font-black text-[#1A1A1A] mb-4 font-headline">مالقينا حتى حولي فهاد البلاصة دابا</h2>
            <p className="text-[#757575] font-medium max-w-md mx-auto mb-8">
              سمح لينا، حاليا ماكاينش شي إعلان فهاد المدينة. ولكن ماتخافش، غادي نعلنو الكسابة لي فـ هاد المنطقة وغادي يجاوبوك فـ ظرف <span className="text-[#2E7D32] font-bold">24 ساعة</span>.
            </p>
            <button 
              onClick={() => setCitySearch('سطات')}
              className="bg-[#2E7D32] text-white px-8 py-3 rounded-xl font-bold border border-transparent hover:bg-white hover:text-[#2E7D32] hover:border-[#2E7D32] transition-colors"
            >
              قلب فـ مدينة أخرى
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
