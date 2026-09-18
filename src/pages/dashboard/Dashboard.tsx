import React, { useState } from 'react';
import { 
  Calculator, 
  Wheat, 
  Scale, 
  Sparkles, 
  Ruler, 
  BarChart3, 
  Egg, 
  Fish, 
  ChevronRight,
  ChevronDown,
  Award,
  BookOpen
} from 'lucide-react';

interface DashboardProps {
  onSelectPage: (pageId: string) => void;
}

export default function Dashboard({ onSelectPage }: DashboardProps) {
  const [standardsOpen, setStandardsOpen] = useState(false);
  const [feedsOpen, setFeedsOpen] = useState(false);

  // Cattle Tools
  const cattleServices = [
    { id: 'cattle-info', title: 'Cattle Ration Calculator', icon: <Calculator className="text-emerald-700" size={20} />, active: true },
    { id: 'weight-measure', title: 'Live Weight Estimator', icon: <Scale className="text-emerald-700" size={20} />, active: true },
    { id: 'nourish-feeds-reference', title: 'Nourish Cattle Feeds', icon: <Wheat className="text-emerald-700" size={20} />, active: true },
  ];

  // Poultry Main Tools
  const poultryMainServices = [
    { id: 'layer-light', title: 'Layer Lighting Calculator', icon: <Sparkles className="text-amber-700" size={20} />, active: true },
    { id: 'poultry-uniformity', title: 'Uniformity Calculator', icon: <BarChart3 className="text-amber-700" size={20} />, active: true },
    { id: 'poultry-space', title: 'Space & Equipment Calcs', icon: <Ruler className="text-amber-700" size={20} />, active: true },
  ];

  // Sub-options for Standards
  const standardSubItems = [
    { id: 'nourish-broiler-standard', title: 'Broiler Standard' },
    { id: 'nourish-layer-standard', title: 'Layer Standard' },
    { id: 'nourish-sonali-standard', title: 'Sonali Standard' },
  ];

  // Sub-options for Feeds
  const feedSubItems = [
    { id: 'nourish-broiler-feeds', title: 'Broiler Feeds' },
    { id: 'nourish-layer-feeds', title: 'Layer Feeds' },
    { id: 'nourish-sonali-feeds', title: 'Sonali Feeds' },
  ];

  // Aqua Tools
  const fishServices = [
    { id: 'fish-feed', title: 'Aqua Feed Requirements', icon: <Fish className="text-cyan-700" size={20} />, active: false },
  ];

  return (
    <div className="min-h-screen py-6 px-4 flex flex-col items-center font-sans">
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
                  <span className={`font-bold text-xs sm:text-sm transition-colors text-left ${
                    item.active ? 'text-slate-800 group-hover:text-emerald-900' : 'text-slate-500'
                  }`}>
                    {item.title}
                  </span>
                </div>

                {item.active ? (
                  <div className="bg-white/80 p-1 rounded-full text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-all shadow-xs shrink-0">
                    <ChevronRight size={16} />
                  </div>
                ) : (
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded-md shrink-0">
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
            {poultryMainServices.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className="w-full p-3.5 rounded-xl border bg-gradient-to-r from-amber-50/80 to-orange-50/50 border-amber-200/80 shadow-sm hover:shadow-md hover:border-amber-500 cursor-pointer flex items-center justify-between transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-2 rounded-lg bg-white shadow-xs group-hover:bg-amber-100 transition-colors">
                    {item.icon}
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-amber-900 transition-colors text-left">
                    {item.title}
                  </span>
                </div>
                <div className="bg-white/80 p-1 rounded-full text-amber-700 group-hover:bg-amber-700 group-hover:text-white transition-all shadow-xs shrink-0">
                  <ChevronRight size={16} />
                </div>
              </button>
            ))}

            {/* Nourish Standards Dropdown */}
            <div 
              className="w-full rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 to-orange-50/50 shadow-sm overflow-hidden transition-all duration-200"
              onMouseEnter={() => window.innerWidth >= 768 && setStandardsOpen(true)}
              onMouseLeave={() => window.innerWidth >= 768 && setStandardsOpen(false)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStandardsOpen(!standardsOpen);
                }}
                className="w-full p-3.5 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-3.5 pointer-events-none">
                  <div className="p-2 rounded-lg bg-white shadow-xs group-hover:bg-amber-100 transition-colors">
                    <Award className="text-amber-700" size={20} />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-amber-900 transition-colors text-left">
                    Nourish Standards
                  </span>
                </div>
                <div className="bg-white/80 p-1 rounded-full text-amber-700 group-hover:bg-amber-700 group-hover:text-white transition-all shadow-xs shrink-0">
                  {standardsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </button>

              {standardsOpen && (
                <div className="px-3 pb-3 space-y-1.5">
                  {standardSubItems.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => onSelectPage(sub.id)}
                      className="w-full py-2 px-3 pl-11 rounded-lg text-xs font-semibold text-slate-700 bg-white/90 hover:bg-amber-100 hover:text-amber-900 border border-amber-100 flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                    >
                      <span>{sub.title}</span>
                      <ChevronRight size={14} className="text-amber-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nourish Poultry Feeds Dropdown */}
            <div 
              className="w-full rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 to-orange-50/50 shadow-sm overflow-hidden transition-all duration-200"
              onMouseEnter={() => window.innerWidth >= 768 && setFeedsOpen(true)}
              onMouseLeave={() => window.innerWidth >= 768 && setFeedsOpen(false)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFeedsOpen(!feedsOpen);
                }}
                className="w-full p-3.5 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-3.5 pointer-events-none">
                  <div className="p-2 rounded-lg bg-white shadow-xs group-hover:bg-amber-100 transition-colors">
                    <BookOpen className="text-amber-700" size={20} />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-amber-900 transition-colors text-left">
                    Nourish Poultry Feeds
                  </span>
                </div>
                <div className="bg-white/80 p-1 rounded-full text-amber-700 group-hover:bg-amber-700 group-hover:text-white transition-all shadow-xs shrink-0">
                  {feedsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </button>

              {feedsOpen && (
                <div className="px-3 pb-3 space-y-1.5">
                  {feedSubItems.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => onSelectPage(sub.id)}
                      className="w-full py-2 px-3 pl-11 rounded-lg text-xs font-semibold text-slate-700 bg-white/90 hover:bg-amber-100 hover:text-amber-900 border border-amber-100 flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                    >
                      <span>{sub.title}</span>
                      <ChevronRight size={14} className="text-amber-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>

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
                  <span className={`font-bold text-xs sm:text-sm transition-colors text-left ${
                    item.active ? 'text-slate-800 group-hover:text-cyan-900' : 'text-slate-500'
                  }`}>
                    {item.title}
                  </span>
                </div>

                {item.active ? (
                  <div className="bg-white/80 p-1 rounded-full text-cyan-700 group-hover:bg-cyan-700 group-hover:text-white transition-all shadow-xs shrink-0">
                    <ChevronRight size={16} />
                  </div>
                ) : (
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded-md shrink-0">
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