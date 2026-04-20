import React from 'react';
import { ViewType } from '../App';
import { TrendingUp, TrendingDown, Minus, Info, Calendar, MapPin, Search, Filter } from 'lucide-react';
import SearchHeader from '../components/SearchHeader';
import { useSettings } from '../hooks/useSettings';

interface Props {
  onNavigate: (view: ViewType, listingId?: string, city?: string, radius?: string, subView?: string) => void;
}

export default function PriceCatalog({ onNavigate }: Props) {
  const { settings } = useSettings();
  const prices = [
    { breed: 'سردي (Sardi)', region: 'الشاوية، سطات', price: `${(settings.stockMarket?.sardi || 85) - 5} - ${(settings.stockMarket?.sardi || 85) + 5}`, unit: 'درهم/كلم', status: 'طالع شوية', trend: 'up', change: '+2.4%' },
    { breed: 'بركي (Barki)', region: 'برشيد، بنسليمان', price: `${(settings.stockMarket?.bergui || 75) - 5} - ${(settings.stockMarket?.bergui || 75) + 5}`, unit: 'درهم/كلم', status: 'مستقر', trend: 'stable', change: '0.0%' },
    { breed: 'مستورد (Importé)', region: 'الموانئ، الضيعات الكبرى', price: `${(settings.stockMarket?.imported || 65) - 5} - ${(settings.stockMarket?.imported || 65) + 5}`, unit: 'درهم/كلم', status: 'نازل شوية', trend: 'down', change: '-1.2%' },
    { breed: 'الماعز (Chèvre)', region: 'كاع المناطق', price: `${(settings.stockMarket?.goats || 70) - 5} - ${(settings.stockMarket?.goats || 70) + 5}`, unit: 'درهم/كلم', status: 'طالع شوية', trend: 'up', change: '+3.1%' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA]" dir="rtl">
      <SearchHeader onNavigate={onNavigate} />
      
      <div className="max-w-7xl mx-auto py-12 px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 font-headline">بورصة الأغنام</h1>
            <p className="text-gray-500 text-sm font-medium">متابعة حية لأثمنة السوق المغربي</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">آخر تحديث</p>
                <p className="text-gray-900 font-black text-sm">07 أبريل 2026</p>
              </div>
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-100 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 text-xs font-bold">السوق مفتوح</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Market Controls */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="بحث عن سلالة..." 
                  className="pr-9 pl-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none w-64"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 transition-colors hover:bg-gray-600 hover:text-white hover:border-gray-600">
                <Filter className="w-4 h-4" />
                <span>تصفية</span>
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
              <span>المجموع: {prices.length} سلالات</span>
              <span className="w-px h-4 bg-gray-200"></span>
              <span className="text-green-600">طالع: 3</span>
              <span className="text-red-600">نازل: 1</span>
            </div>
          </div>

          {/* Stock Market Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">السلالة</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">المنطقة الرئيسية</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">الثمن (درهم/كلم)</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">التغير</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {prices.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          item.trend === 'up' ? 'bg-green-50 text-green-600' : 
                          item.trend === 'down' ? 'bg-red-50 text-red-600' : 
                          'bg-gray-50 text-gray-400'
                        }`}>
                          {item.trend === 'up' ? <TrendingUp className="w-5 h-5" /> : 
                           item.trend === 'down' ? <TrendingDown className="w-5 h-5" /> : 
                           <Minus className="w-5 h-5" />}
                        </div>
                        <span className="font-black text-gray-900 text-lg">{item.breed}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-gray-600 font-medium">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{item.region}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-gray-900">{item.price}</span>
                        <span className="text-xs font-bold text-gray-400">{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-black ${
                        item.trend === 'up' ? 'bg-green-100 text-green-700' : 
                        item.trend === 'down' ? 'bg-red-100 text-red-700' : 
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {item.change}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-sm font-bold ${
                        item.trend === 'up' ? 'text-green-600' : 
                        item.trend === 'down' ? 'text-red-600' : 
                        'text-gray-500'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-left">
                      <button className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Info className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Analysis Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>تحليل السوق</span>
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              كنلاحظو ارتفاع طفيف فالسردي هاد السيمانة بسبب اقتراب العيد وزيادة الطلب. البركي كيبقى الخيار الأكثر استقراراً.
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-black text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>المناطق النشطة</span>
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              سوق سطات وبرشيد كيعرفو حركية كبيرة هاد الأيام. كنصحو الكسابا يردو البال للأثمنة فالمناطق الجبلية لي باقة مناسبة.
            </p>
          </div>
          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 shadow-sm">
            <h4 className="font-black text-primary mb-2 flex items-center gap-2">
              <Info className="w-5 h-5" />
              <span>تنبيه للمستعملين</span>
            </h4>
            <p className="text-sm text-primary/80 leading-relaxed">
              هاد الأرقام هي متوسط الأثمنة فالسوق. الثمن النهائي كيبقى بين الشاري والبيع على حساب المليح والوزن.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

