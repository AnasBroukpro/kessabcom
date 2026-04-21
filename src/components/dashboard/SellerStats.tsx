import React, { useState } from 'react';
import { 
  Eye, MapPin, Phone, CheckCircle2 
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
      data: [40, 65, 45, 90, 75, 55, Math.min(100, (stats.totalViews / 100))], 
      bg: 'bg-blue-50' 
    },
    { 
      label: 'زبناء حددو الموقع ديالك', 
      value: stats.totalLocationRequests.toLocaleString(), 
      icon: MapPin, 
      color: 'text-green-600', 
      data: [20, 35, 25, 50, 45, 30, Math.min(100, (stats.totalLocationRequests / 10))], 
      bg: 'bg-green-50' 
    },
    { 
      label: 'عدد الزبناء اللي اتصلوا بيك', 
      value: stats.totalCalls.toLocaleString(), 
      icon: Phone, 
      color: 'text-orange-600', 
      data: [10, 15, 12, 25, 20, 15, Math.min(100, stats.totalCalls)], 
      bg: 'bg-orange-50' 
    },
    { 
      label: 'الإعلانات النشطة', 
      value: stats.activeCount.toString(), 
      icon: CheckCircle2, 
      color: 'text-purple-600', 
      data: [stats.activeCount, stats.activeCount, stats.activeCount, stats.activeCount, stats.activeCount, stats.activeCount, stats.activeCount], 
      bg: 'bg-purple-50' 
    },
  ];

  const currentStat = statItems[selectedStatIndex];

  return (
    <div className="space-y-8" dir="rtl">
      <h2 className="text-2xl font-black text-on-surface font-headline">الإحصائيات</h2>
      
      {/* Mobile Stats Tabs */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-2 snap-x no-scrollbar">
        {statItems.map((stat, i) => (
          <button
            key={i}
            onClick={() => setSelectedStatIndex(i)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all snap-start border ${
              selectedStatIndex === i 
              ? 'bg-primary text-white border-primary shadow-md shadow-primary/10' 
              : 'bg-white text-on-surface-variant border-outline-variant/30'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <stat.icon className={`w-3.5 h-3.5 ${selectedStatIndex === i ? 'text-white' : stat.color}`} />
              <span>{stat.label.replace('إجمالي ', '')}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="hidden md:grid md:grid-cols-4 gap-4">
        {statItems.map((stat, i) => (
          <button 
            key={i} 
            onClick={() => setSelectedStatIndex(i)}
            className={`bg-white p-6 rounded-2xl border transition-all text-right group ${selectedStatIndex === i ? 'border-primary ring-2 ring-primary/10 shadow-md' : 'border-outline-variant/30 shadow-sm hover:border-primary/50'}`}
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-xs text-on-surface-variant font-bold mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-on-surface">{stat.value}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-outline-variant/30 p-4 md:p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-on-surface">تطور {currentStat.label}</h3>
          <div className={`px-3 py-1 rounded-full text-xs font-bold bg-surface-container-high ${currentStat.color}`}>
            {currentStat.value} إجمالي
          </div>
        </div>
        
        {/* Simple Bar Chart Visualization */}
        <div className="h-64 flex items-end gap-1.5 md:gap-2">
          {currentStat.data.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <div 
                className={`w-full rounded-t-lg transition-all relative ${
                  selectedStatIndex === 0 ? 'bg-blue-500/20 group-hover:bg-blue-500' : 
                  selectedStatIndex === 1 ? 'bg-green-500/20 group-hover:bg-green-500' : 
                  selectedStatIndex === 2 ? 'bg-orange-500/20 group-hover:bg-orange-500' : 
                  'bg-purple-500/20 group-hover:bg-purple-500'
                }`}
                style={{ height: `${(val / (Math.max(...currentStat.data) || 1)) * 100}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {val}
                </div>
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant">يوم {i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
