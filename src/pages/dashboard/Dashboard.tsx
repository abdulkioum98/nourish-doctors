import React, { useState } from 'react';
import { 
  Calculator, 
  Wheat, 
  Scale, 
  Sparkles, 
  Ruler, 
  BarChart3, 
  Fish, 
  ChevronRight,
  ChevronDown,
  Award,
  BookOpen,
  ShieldPlus
} from 'lucide-react';

interface DashboardProps {
  onSelectPage: (pageId: string, dropdowns: any) => void;
  activeDropdowns: {
    standards: boolean;
    vaccination: boolean;
    feeds: boolean;
    fish: boolean;
  };
  setActiveDropdowns: React.Dispatch<React.SetStateAction<any>>;
}

export default function Dashboard({ onSelectPage, activeDropdowns, setActiveDropdowns }: DashboardProps) {
  
  // ড্রপডাউন টগল করার সময় স্টেট আপডেট করা যাতে ব্যাক করলে বন্ধ না হয়ে যায়
  const toggleDropdown = (key: string) => {
    setActiveDropdowns((prev: any) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

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
    { id: 'poultry-space', title: 'Poultry Space Calculator', icon: <Ruler className="text-amber-700" size={20} />, active: true },
  ];

  const standardSubItems = [
    { id: 'broiler-standard', title: 'Broiler Standard' },
    { id: 'layer-standard', title: 'Layer Standard' },
    { id: 'sonali-standard', title: 'Sonali Standard' },
  ];

  const vaccinationSubItems = [
    { id: 'broiler-vaccination', title: 'Broiler Vaccination' },
    { id: 'layer-vaccination', title: 'Layer Vaccination' },
    { id: 'sonali-vaccination', title: 'Sonali Vaccination' },
  ];

  const feedSubItems = [
    { id: 'broiler-feeds', title: 'Broiler Feeds' },
    { id: 'layer-feeds', title: 'Layer Feeds' },
    { id: 'sonali-feeds', title: 'Sonali Feeds' },
  ];

  const fishSubItems = [
    { id: 'nourish-floating-fish', title: 'Floating Fish Feeds' },
    { id: 'nourish-sinking-fish', title: 'Sinking Fish Feeds' },
  ];

  return (
    <div className="min-h-screen py-6 px-4 flex flex-col items-center font-sans">
      <div className="w-full max-w-md space-y-8">
      
        {/* ১. CATTLE SECTION */}
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
                onClick={() => item.active && onSelectPage(item.id, activeDropdowns)}
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

        {/* ২. POULTRY SECTION */}
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
                onClick={() => onSelectPage(item.id, activeDropdowns)}
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

            {/* Poultry Standards Accordion */}
            <div className={`w-full rounded-xl border transition-all duration-300 overflow-hidden ${
              activeDropdowns.standards ? 'bg-amber-50/90 border-amber-400 shadow-md' : 'bg-gradient-to-r from-amber-50/80 to-orange-50/50 border-amber-200/80 shadow-sm'
            }`}>
              <button
                onClick={() => toggleDropdown('standards')}
                className="w-full p-3.5 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-2 rounded-lg bg-white shadow-xs group-hover:bg-amber-100 transition-colors">
                    <Award className="text-amber-700" size={20} />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-amber-900 transition-colors text-left">
                    Poultry Standards
                  </span>
                </div>
                <div className={`p-1 rounded-full transition-transform duration-300 ${
                  activeDropdowns.standards ? 'bg-amber-700 text-white rotate-180' : 'bg-white/80 text-amber-700 group-hover:bg-amber-700 group-hover:text-white shadow-xs'
                }`}>
                  <ChevronDown size={16} />
                </div>
              </button>

              {activeDropdowns.standards && (
                <div className="px-3 pb-3 pt-1 space-y-2 animate-fadeIn">
                  {standardSubItems.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => onSelectPage(sub.id, activeDropdowns)}
                      className="w-full py-2.5 px-3 pl-11 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-amber-100 hover:text-amber-900 border border-amber-200/60 flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                    >
                      <span>{sub.title}</span>
                      <ChevronRight size={14} className="text-amber-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vaccination Schedule Accordion */}
            <div className={`w-full rounded-xl border transition-all duration-300 overflow-hidden ${
              activeDropdowns.vaccination ? 'bg-amber-50/90 border-amber-400 shadow-md' : 'bg-gradient-to-r from-amber-50/80 to-orange-50/50 border-amber-200/80 shadow-sm'
            }`}>
              <button
                onClick={() => toggleDropdown('vaccination')}
                className="w-full p-3.5 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-2 rounded-lg bg-white shadow-xs group-hover:bg-amber-100 transition-colors">
                    <ShieldPlus className="text-amber-700" size={20} />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-amber-900 transition-colors text-left">
                    Vaccination Schedule
                  </span>
                </div>
                <div className={`p-1 rounded-full transition-transform duration-300 ${
                  activeDropdowns.vaccination ? 'bg-amber-700 text-white rotate-180' : 'bg-white/80 text-amber-700 group-hover:bg-amber-700 group-hover:text-white shadow-xs'
                }`}>
                  <ChevronDown size={16} />
                </div>
              </button>

              {activeDropdowns.vaccination && (
                <div className="px-3 pb-3 pt-1 space-y-2 animate-fadeIn">
                  {vaccinationSubItems.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => onSelectPage(sub.id, activeDropdowns)}
                      className="w-full py-2.5 px-3 pl-11 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-amber-100 hover:text-amber-900 border border-amber-200/60 flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                    >
                      <span>{sub.title}</span>
                      <ChevronRight size={14} className="text-amber-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nourish Poultry Feeds Accordion */}
            <div className={`w-full rounded-xl border transition-all duration-300 overflow-hidden ${
              activeDropdowns.feeds ? 'bg-amber-50/90 border-amber-400 shadow-md' : 'bg-gradient-to-r from-amber-50/80 to-orange-50/50 border-amber-200/80 shadow-sm'
            }`}>
              <button
                onClick={() => toggleDropdown('feeds')}
                className="w-full p-3.5 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-2 rounded-lg bg-white shadow-xs group-hover:bg-amber-100 transition-colors">
                    <BookOpen className="text-amber-700" size={20} />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-amber-900 transition-colors text-left">
                    Nourish Poultry Feeds
                  </span>
                </div>
                <div className={`p-1 rounded-full transition-transform duration-300 ${
                  activeDropdowns.feeds ? 'bg-amber-700 text-white rotate-180' : 'bg-white/80 text-amber-700 group-hover:bg-amber-700 group-hover:text-white shadow-xs'
                }`}>
                  <ChevronDown size={16} />
                </div>
              </button>

              {activeDropdowns.feeds && (
                <div className="px-3 pb-3 pt-1 space-y-2 animate-fadeIn">
                  {feedSubItems.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => onSelectPage(sub.id, activeDropdowns)}
                      className="w-full py-2.5 px-3 pl-11 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-amber-100 hover:text-amber-900 border border-amber-200/60 flex items-center justify-between transition-all cursor-pointer shadow-2xs"
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

        {/* ৩. FISH / AQUA SECTION */}
        <section className="space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-cyan-600"></span>
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-900">
              Aqua Tools
            </h2>
            <span className="h-2 w-2 rounded-full bg-cyan-600"></span>
          </div>

          <div className="flex flex-col space-y-2.5">
            <div className={`w-full rounded-xl border transition-all duration-300 overflow-hidden ${
              activeDropdowns.fish ? 'bg-cyan-50/90 border-cyan-400 shadow-md' : 'bg-gradient-to-r from-cyan-50/80 to-sky-50/50 border-cyan-200/80 shadow-sm'
            }`}>
              <button
                onClick={() => toggleDropdown('fish')}
                className="w-full p-3.5 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-2 rounded-lg bg-white shadow-xs group-hover:bg-cyan-100 transition-colors">
                    <Fish className="text-cyan-700" size={20} />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-cyan-900 transition-colors text-left">
                    Nourish Fish Feeds
                  </span>
                </div>
                <div className={`p-1 rounded-full transition-transform duration-300 ${
                  activeDropdowns.fish ? 'bg-cyan-700 text-white rotate-180' : 'bg-white/80 text-cyan-700 group-hover:bg-cyan-700 group-hover:text-white shadow-xs'
                }`}>
                  <ChevronDown size={16} />
                </div>
              </button>

              {activeDropdowns.fish && (
                <div className="px-3 pb-3 pt-1 space-y-2 animate-fadeIn">
                  {fishSubItems.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => onSelectPage(sub.id, activeDropdowns)}
                      className="w-full py-2.5 px-3 pl-11 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-cyan-100 hover:text-cyan-900 border border-cyan-200/60 flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                    >
                      <span>{sub.title}</span>
                      <ChevronRight size={14} className="text-cyan-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}