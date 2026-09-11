import React from 'react';
import { 
  Calculator, 
  Wheat, 
  Scale, 
  Sparkles, 
  Ruler, 
  BarChart3, 
  Egg, 
  Fish, 
  ChevronRight 
} from 'lucide-react';

interface DashboardProps {
  onSelectPage: (pageId: string) => void;
}

export default function Dashboard({ onSelectPage }: DashboardProps) {
  // Cattle Tools (Live Weight Estimator এক্টিভ করে দেওয়া হলো)
  const cattleServices = [
    { id: 'cattle-info', title: 'Cattle Ration Calculator', icon: <Calculator className="text-emerald-700" size={20} />, active: true },
    { id: 'weight-measure', title: 'Live Weight Estimator', icon: <Scale className="text-emerald-700" size={20} />, active: true },
    { id: 'nourish-feeds-reference', title: 'Nourish Cattle Feeds', icon: <Wheat className="text-emerald-700" size={20} />, active: true },
  ];

  // Poultry Tools
  const poultryServices = [
    { id: 'layer-light', title: 'Layer Lighting Calculator', icon: <Sparkles className="text-amber-700" size={20} />, active: true },
    { id: 'poultry-uniformity', title: 'Uniformity Calculator', icon: <BarChart3 className="text-amber-700" size={20} />, active: true },
    { id: 'poultry-space', title: 'Space & Equipment Calcs', icon: <Ruler className="text-amber-700" size={20} />, active: true },
    { id: 'layer-feeds', title: 'Nourish Poultry Feeds', icon: <Egg className="text-amber-700" size={20} />, active: true },
  ];

  // Aqua Tools
  const fishServices = [
    { id: 'fish-feed', title: 'Aqua Feed Requirements', icon: <Fish className="text-cyan-700" size={20} />, active: false },
  ];

  return (
    <div className="min-h-screen py-6 px-4 flex flex-col items-center">
      {/* Max Width Container to keeps everything perfectly centered */}
      <div className="w-full max-w-md space-y-8">
      

        {/* 1. CATTLE SECTION */}
        <section className="space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-900">
              Cattle Tools
            </h2>
            <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
          </div>

          <div className="flex flex-col space-y-2.5">
            {cattleServices.map((item) => (
              <button
                key={item.id}
                disabled={!item.active}
                onClick={() => item.active && onSelectPage(item.id)}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                  item.active
                    ? 'bg-gradient-to-r from-emerald-50/80 to-teal-50/50 border-emerald-200/80 shadow-sm hover:shadow-md hover:border-emerald-500 cursor-pointer group'
                    : 'bg-slate-50/70 border-slate-200/60 opacity-55 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`p-2 rounded-lg transition-colors ${
                    item.active ? 'bg-white shadow-xs group-hover:bg-emerald-100' : 'bg-slate-200/50'
                  }`}>
                    {item.icon}
                  </div>
                  <span className={`font-bold text-xs sm:text-sm transition-colors ${
                    item.active ? 'text-slate-800 group-hover:text-emerald-900' : 'text-slate-500'
                  }`}>
                    {item.title}
                  </span>
                </div>

                {item.active ? (
                  <div className="bg-white/80 p-1 rounded-full text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-all shadow-xs">
                    <ChevronRight size={16} />
                  </div>
                ) : (
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded-md">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* 2. POULTRY SECTION */}
        <section className="space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-900">
              Poultry Tools
            </h2>
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          </div>

          <div className="flex flex-col space-y-2.5">
            {poultryServices.map((item) => (
              <button
                key={item.id}
                disabled={!item.active}
                onClick={() => item.active && onSelectPage(item.id)}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                  item.active
                    ? 'bg-gradient-to-r from-amber-50/80 to-orange-50/50 border-amber-200/80 shadow-sm hover:shadow-md hover:border-amber-500 cursor-pointer group'
                    : 'bg-slate-50/70 border-slate-200/60 opacity-55 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`p-2 rounded-lg transition-colors ${
                    item.active ? 'bg-white shadow-xs group-hover:bg-amber-100' : 'bg-slate-200/50'
                  }`}>
                    {item.icon}
                  </div>
                  <span className={`font-bold text-xs sm:text-sm transition-colors ${
                    item.active ? 'text-slate-800 group-hover:text-amber-900' : 'text-slate-500'
                  }`}>
                    {item.title}
                  </span>
                </div>

                {item.active ? (
                  <div className="bg-white/80 p-1 rounded-full text-amber-700 group-hover:bg-amber-700 group-hover:text-white transition-all shadow-xs">
                    <ChevronRight size={16} />
                  </div>
                ) : (
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded-md">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* 3. FISH / AQUA SECTION */}
        <section className="space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-cyan-600"></span>
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-900">
              Aqua Tools
            </h2>
            <span className="h-2 w-2 rounded-full bg-cyan-600"></span>
          </div>

          <div className="flex flex-col space-y-2.5">
            {fishServices.map((item) => (
              <button
                key={item.id}
                disabled={!item.active}
                onClick={() => item.active && onSelectPage(item.id)}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                  item.active
                    ? 'bg-gradient-to-r from-cyan-50/80 to-sky-50/50 border-cyan-200/80 shadow-sm hover:shadow-md hover:border-cyan-500 cursor-pointer group'
                    : 'bg-slate-50/70 border-slate-200/60 opacity-55 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`p-2 rounded-lg transition-colors ${
                    item.active ? 'bg-white shadow-xs group-hover:bg-cyan-100' : 'bg-slate-200/50'
                  }`}>
                    {item.icon}
                  </div>
                  <span className={`font-bold text-xs sm:text-sm transition-colors ${
                    item.active ? 'text-slate-800 group-hover:text-cyan-900' : 'text-slate-500'
                  }`}>
                    {item.title}
                  </span>
                </div>

                {item.active ? (
                  <div className="bg-white/80 p-1 rounded-full text-cyan-700 group-hover:bg-cyan-700 group-hover:text-white transition-all shadow-xs">
                    <ChevronRight size={16} />
                  </div>
                ) : (
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded-md">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}