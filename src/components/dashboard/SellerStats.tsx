import React, { useState } from 'react';
import { 
  Eye, MapPin, Phone, CheckCircle2, TrendingUp, Calendar, ArrowUpRight, MousePointer2, Users 
} from 'lucide-react';

interface SellerStatsProps {
  stats: {
    activeCount: number;
    totalViews: number;
    totalCalls: number;
    totalMessages: number;
    totalLocationRequests: number;
  };
}

export function SellerStats({ stats }: SellerStatsProps) {
  const [selectedStatIndex, setSelectedStatIndex] = useState(0);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('week');

  const statItems = [
    { 
      label: 'إجمالي المشاهدات', 
      value: stats.totalViews.toLocaleString(), 
      icon: Eye, 
      color: 'text-blue-600', 
      trend: '+12.5%',
      data: [40, 65, 45, 90, 75, 55, 82], 
      bg: 'bg-blue-50/50',
      border: 'border-blue-100',
      description: 'عدد المرات التي ظهر فيها إعلانك للمشترين'
    },
    { 
      label: 'نقرات الموقع', 
      value: stats.totalLocationRequests.toLocaleString(), 
      icon: MapPin, 
      color: 'text-[#115E2C]', 
      trend: '+8.2%',
      data: [20, 35, 25, 50, 45, 30, 42], 
      bg: 'bg-[#E8F5E9]/50',
      border: 'border-[#115E2C]/10',
      description: 'المشترون الذين طلبوا موقع الضيعة'
    },
    { 
      label: 'اتصالات هاتفية', 
      value: stats.totalCalls.toLocaleString(), 
      icon: Phone, 
      color: 'text-orange-600', 
      trend: '+5.4%',
      data: [10, 15, 12, 25, 20, 15, 18], 
      bg: 'bg-orange-50/50',
      border: 'border-orange-100',
      description: 'المشترون الذين اتصلوا بك مباشرة'
    },
    { 
      label: 'إعلانات نشطة', 
      value: stats.activeCount.toString(), 
      icon: CheckCircle2, 
      color: 'text-purple-600', 
      trend: '0%',
      data: [stats.activeCount, stats.activeCount, stats.activeCount, stats.activeCount, stats.activeCount, stats.activeCount, stats.activeCount], 
      bg: 'bg-purple-50/50',
      border: 'border-purple-100',
      description: 'عدد القطيع المعروض حالياً للبيع'
    },
  ];

  const currentStat = statItems[selectedStatIndex];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700" dir="rtl">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-[#1A1A1A] font-headline tracking-tight">الإحصائيات</h2>
          <p className="text-on-surface-variant font-medium mt-1 text-sm md:text-base">تتبع أداء قطيعك وتفاعل الزبناء مع إعلاناتك</p>
        </div>
        
        <div className="flex items-center bg-white p-1 rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden w-full md:w-auto">
          {(['today', 'week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                timeRange === range 
                ? 'bg-[#115E2C] text-white shadow-lg' 
                : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {range === 'today' ? 'اليوم' : range === 'week' ? 'هاد الأسبوع' : range === 'month' ? 'هاد الشهر' : 'هاد العام'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((stat, i) => (
          <button 
            key={i} 
            onClick={() => setSelectedStatIndex(i)}
            className={`bg-white p-8 rounded-3xl border transition-all duration-500 text-right group relative overflow-hidden flex flex-col ${selectedStatIndex === i ? 'border-[#115E2C] shadow-2xl shadow-[#115E2C]/10 ring-4 ring-[#115E2C]/5' : 'border-outline-variant/10 shadow-sm hover:shadow-xl hover:border-[#115E2C]/30'}`}
          >
            <div className="flex justify-between items-start mb-8">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${stat.color}`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-black border border-green-100">
                <ArrowUpRight className="w-3 h-3" />
                {stat.trend}
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] text-[#757575] font-black uppercase tracking-widest">{stat.label}</p>
              <p className="text-4xl font-black text-[#1A1A1A] font-headline">{stat.value}</p>
            </div>

            <p className="text-[10px] text-[#A0A0A0] font-medium mt-4 line-clamp-1 group-hover:text-[#115E2C] transition-colors">{stat.description}</p>
            
            {/* Background Decorative Element */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] transition-all duration-700 group-hover:scale-150 ${stat.color.replace('text', 'bg')}`}></div>
          </button>
        ))}
      </div>

      {/* Professional Chart Visualization */}
      <div className="bg-white rounded-3xl border border-outline-variant/10 p-8 md:p-12 shadow-sm overflow-hidden relative group">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${currentStat.bg} flex items-center justify-center ${currentStat.color} shadow-inner`}>
              <currentStat.icon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-2xl text-[#1A1A1A] font-headline">تطور {currentStat.label}</h3>
              <p className="text-on-surface-variant text-sm font-medium">مقارنة بالأداء السابق لهاد الفترة</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-2 bg-[#F9F9F6] px-5 py-3 rounded-2xl border border-outline-variant/10">
               <span className="w-3 h-3 rounded-full bg-[#115E2C]"></span>
               <span className="text-sm font-black text-[#1A1A1A]">الحالي</span>
             </div>
             <div className="flex items-center gap-2 bg-[#F9F9F6] px-5 py-3 rounded-2xl border border-outline-variant/10 border-dashed">
               <span className="w-3 h-3 rounded-full bg-[#A0A0A0]"></span>
               <span className="text-sm font-black text-[#A0A0A0]">السابق</span>
             </div>
          </div>
        </div>
        
        {/* Modern Bar Chart Visualization with Hover States */}
        <div className="h-[400px] flex items-end gap-3 md:gap-6 px-4 mb-8 relative">
          {/* Grid lines */}
          <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between pointer-events-none opacity-[0.03]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full h-px bg-black"></div>
            ))}
          </div>

          {currentStat.data.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-6 group/bar cursor-pointer relative z-10">
              <div className="flex-1 w-full flex items-end justify-center relative">
                <div 
                  className={`w-full max-w-[56px] rounded-2xl transition-all duration-700 relative overflow-hidden shadow-sm group-hover/bar:shadow-2xl group-hover/bar:-translate-y-2 ${
                    selectedStatIndex === 0 ? 'bg-blue-600/10 group-hover/bar:bg-blue-600' : 
                    selectedStatIndex === 1 ? 'bg-[#115E2C]/10 group-hover/bar:bg-[#115E2C]' : 
                    selectedStatIndex === 2 ? 'bg-orange-600/10 group-hover/bar:bg-orange-600' : 
                    'bg-purple-600/10 group-hover/bar:bg-purple-600'
                  }`}
                  style={{ height: `${(val / (Math.max(...currentStat.data) || 1)) * 100}%` }}
                >
                  {/* Subtle highlight effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-white/10 to-white/30 opacity-0 group-hover/bar:opacity-100 transition-opacity"></div>
                </div>
                
                {/* Tooltip */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white text-xs font-black px-4 py-2.5 rounded-2xl opacity-0 group-hover/bar:opacity-100 transition-all duration-300 pointer-events-none shadow-2xl -translate-y-4 group-hover/bar:translate-y-0 flex flex-col items-center min-w-[80px]">
                  <span className="text-[10px] text-white/60 mb-0.5">يوم {i + 1}</span>
                  <span>{val} {selectedStatIndex === 0 ? 'مشاهدة' : selectedStatIndex === 1 ? 'نقرة' : selectedStatIndex === 2 ? 'اتصال' : 'إعلان'}</span>
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1A1A1A] rotate-45"></div>
                </div>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-black text-[#757575] group-hover/bar:text-[#115E2C] transition-colors whitespace-nowrap block mb-1">يوم {i + 1}</span>
                <span className="text-[9px] font-bold text-[#A0A0A0] uppercase tracking-tighter">أبريل</span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Footer for the Graph */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-outline-variant/10 mt-4 relative z-10">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#F9F9F6] rounded-2xl flex items-center justify-center text-primary">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-black uppercase">متوسط التفاعل</p>
                <p className="text-lg font-black text-on-surface">{(currentStat.data.reduce((a,b)=>a+b,0)/7).toFixed(1)} / يوم</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#F9F9F6] rounded-2xl flex items-center justify-center text-orange-600">
                <MousePointer2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-black uppercase">نسبة التحويل</p>
                <p className="text-lg font-black text-on-surface">4.8% <span className="text-xs text-green-600">↑</span></p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#F9F9F6] rounded-2xl flex items-center justify-center text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-black uppercase">أفضل يوم أداء</p>
                <p className="text-lg font-black text-on-surface">يوم 4 (الخميس)</p>
              </div>
           </div>
        </div>
      </div>

      {/* Advanced Analysis & Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        <div className="lg:col-span-2 bg-[#115E2C] rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl shadow-[#115E2C]/20 group flex flex-col md:flex-row items-center gap-8">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/leaf.png')] opacity-10"></div>
          <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shrink-0 shadow-2xl group-hover:scale-110 transition-transform duration-700">
             <TrendingUp className="w-16 h-16 text-white" />
          </div>
          <div className="relative z-10 text-center md:text-right">
            <h3 className="text-3xl font-black mb-4 font-headline">نصيحة من خبير كسابكوم 💡</h3>
            <p className="text-xl opacity-90 font-medium leading-relaxed mb-6">
              "الإحصائيات كتبين بلي الإعلانات اللي فيها فيديوهات كتجيب <span className="font-black text-white underline decoration-2 underline-offset-4">3 د المرات اتصالات أكتر</span>. حاول تصور فيديو قصير للحولي وهو كيتحرك باش تزيد من فرص البيع ديالك!"
            </p>
            <button className="bg-white text-[#115E2C] px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-[#F9F9F6] transition-all">تعديل الإعلانات الحالية</button>
          </div>
        </div>

        <div className="bg-[#1A1A1A] rounded-3xl p-10 text-white flex flex-col justify-between group overflow-hidden relative">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
          <div className="relative z-10">
            <h4 className="text-sm font-black text-primary uppercase tracking-[0.2em] mb-6">الأهداف الشهرية</h4>
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-black">
                  <span>المشاهدات المرجوة</span>
                  <span className="text-primary">85%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-[85%] group-hover:w-[90%] transition-all duration-1000"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-black">
                   <span>الاتصالات المحققة</span>
                   <span className="text-orange-500">62%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full w-[62%] group-hover:w-[70%] transition-all duration-1000"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-black">
                   <span>تفاعل الموقع</span>
                   <span className="text-blue-500">45%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-50 rounded-full w-[45%] group-hover:w-[55%] transition-all duration-1000"></div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-white/40 mt-10 text-center font-medium italic relative z-10">استمر في تحسين إعلاناتك للوصول إلى أهدافك!</p>
        </div>
      </div>
    </div>
  );
}
