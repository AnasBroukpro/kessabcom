import React, { useState } from 'react';
import { 
  Eye, MapPin, Phone, CheckCircle2, TrendingUp 
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

  const statItems = [
    { 
      label: 'إجمالي المشاهدات', 
      value: stats.totalViews.toLocaleString(), 
      icon: Eye, 
      color: 'text-blue-600', 
      data: [40, 65, 45, 90, 75, 55, 82], 
      bg: 'bg-blue-50/50' 
    },
    { 
      label: 'زبناء حددو الموقع', 
      value: stats.totalLocationRequests.toLocaleString(), 
      icon: MapPin, 
      color: 'text-[#115E2C]', 
      data: [20, 35, 25, 50, 45, 30, 42], 
      bg: 'bg-[#E8F5E9]/50' 
    },
    { 
      label: 'اتصالات الزبناء', 
      value: stats.totalCalls.toLocaleString(), 
      icon: Phone, 
      color: 'text-orange-600', 
      data: [10, 15, 12, 25, 20, 15, 18], 
      bg: 'bg-orange-50/50' 
    },
    { 
      label: 'الإعلانات النشطة', 
      value: stats.activeCount.toString(), 
      icon: CheckCircle2, 
      color: 'text-purple-600', 
      data: [stats.activeCount, stats.activeCount, stats.activeCount, stats.activeCount, stats.activeCount, stats.activeCount, stats.activeCount], 
      bg: 'bg-purple-50/50' 
    },
  ];

  const currentStat = statItems[selectedStatIndex];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700" dir="rtl">
      <div>
        <h2 className="text-3xl font-black text-[#1A1A1A] font-headline tracking-tight">الإحصائيات</h2>
        <div className="w-16 h-1 bg-[#115E2C] rounded-full mt-2"></div>
      </div>
      
      {/* Premium Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {statItems.map((stat, i) => (
          <button 
            key={i} 
            onClick={() => setSelectedStatIndex(i)}
            className={`bg-white p-6 rounded-[10px] border transition-all duration-500 text-right group relative overflow-hidden ${selectedStatIndex === i ? 'border-[#115E2C] shadow-2xl shadow-[#115E2C]/10 scale-[1.02]' : 'border-outline-variant/10 shadow-sm hover:border-[#115E2C]/30 hover:shadow-xl'}`}
          >
            {selectedStatIndex === i && (
              <div className="absolute top-0 left-0 w-1 h-full bg-[#115E2C]"></div>
            )}
            <div className={`w-12 h-12 rounded-[10px] ${stat.bg} flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] text-[#757575] font-black mb-1 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-black text-[#1A1A1A]">{stat.value}</p>
          </button>
        ))}
      </div>

      {/* Chart Visualization */}
      <div className="bg-white rounded-[10px] border border-outline-variant/10 p-6 md:p-10 shadow-sm group hover:shadow-2xl transition-all duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[10px] ${currentStat.bg} flex items-center justify-center ${currentStat.color}`}>
              <currentStat.icon className="w-5 h-5" />
            </div>
            <h3 className="font-black text-xl text-[#1A1A1A]">تطور {currentStat.label}</h3>
          </div>
          <div className="flex items-center gap-2 bg-[#F5F5F0] px-4 py-2 rounded-[10px]">
            <TrendingUp className={`w-4 h-4 ${currentStat.color}`} />
            <span className="text-sm font-black text-[#1A1A1A]">{currentStat.value} في المجموع</span>
          </div>
        </div>
        
        {/* Modern Bar Chart Visualization */}
        <div className="h-72 flex items-end gap-2 md:gap-4 px-2">
          {currentStat.data.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-4 group cursor-pointer">
              <div className="flex-1 w-full flex items-end justify-center relative">
                <div 
                  className={`w-full max-w-[40px] rounded-t-[10px] transition-all duration-700 relative overflow-hidden ${
                    selectedStatIndex === 0 ? 'bg-blue-600/10 group-hover:bg-blue-600 group-hover:shadow-lg group-hover:shadow-blue-600/20' : 
                    selectedStatIndex === 1 ? 'bg-[#115E2C]/10 group-hover:bg-[#115E2C] group-hover:shadow-lg group-hover:shadow-[#115E2C]/20' : 
                    selectedStatIndex === 2 ? 'bg-orange-600/10 group-hover:bg-orange-600 group-hover:shadow-lg group-hover:shadow-orange-600/20' : 
                    'bg-purple-600/10 group-hover:bg-purple-600 group-hover:shadow-lg group-hover:shadow-purple-600/20'
                  }`}
                  style={{ height: `${(val / (Math.max(...currentStat.data) || 1)) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white text-[10px] font-black px-3 py-1.5 rounded-[10px] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none shadow-xl -translate-y-2 group-hover:translate-y-0">
                  {val}
                </div>
              </div>
              <span className="text-[10px] font-black text-[#757575] group-hover:text-[#115E2C] transition-colors whitespace-nowrap">يوم {i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Advice Card */}
      <div className="bg-[#115E2C] rounded-[10px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-[#115E2C]/20 group">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all"></div>
        <div className="relative z-10">
          <h3 className="text-2xl font-black mb-4">نصيحة من خبير كسابكوم 💡</h3>
          <p className="text-lg opacity-90 font-medium leading-relaxed max-w-2xl">
            "الإحصائيات كتبين بلي الإعلانات اللي فيها فيديوهات كتجيب 3 د المرات اتصالات أكتر. حاول تصور فيديو قصير للحولي وهو كيتحرك باش تزيد من فرص البيع ديالك!"
          </p>
        </div>
      </div>
    </div>
  );
}
