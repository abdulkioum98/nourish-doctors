import React from 'react';
import { 
  Calculator, 
  Wheat, 
  Layers, 
  BookOpen, 
  Dna, 
  Egg, 
  Fish, 
  Scale, 
  Ruler, 
  BarChart3, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface DashboardProps {
  onSelectPage: (pageId: string) => void;
}

export default function Dashboard({ onSelectPage }: DashboardProps) {
  // Cattle Section Items
  const cattleServices = [
    {
      id: 'cattle-info',
      title: 'Cattle Ration Calculator',
      description: 'Calculate DM, ME, & CP requirements for Dairy and Fattening cattle.',
      icon: <Calculator className="text-emerald-600" size={24} />,
      badge: 'Active',
      active: true,
    },
    {
      id: 'nourish-feeds-reference',
      title: 'Nourish Feeds',
      description: 'Nutritional profiles and specifications of Nourish commercial feeds.',
      icon: <Wheat className="text-amber-600" size={24} />,
      badge: 'Active',
      active: true,
    },
    {
      id: 'weight-measure',
      title: 'Weight Estimator',
      description: 'Estimate live body weight using heart girth and length measurements.',
      icon: <Scale className="text-blue-600" size={24} />,
      badge: 'Coming Soon',
      active: false,
    },
  ];

  // Poultry Section Items
  const poultryServices = [
    {
      id: 'layer-light',
      title: 'Layer Lighting Schedule',
      description: 'Light duration and intensity guide according to bird age.',
      icon: <Sparkles className="text-amber-500" size={24} />,
      badge: 'Coming Soon',
      active: false,
    },
    {
      id: 'poultry-space',
      title: 'Space & Equipment Calcs',
      description: 'Floor, feeder, and drinker space requirements for birds.',
      icon: <Ruler className="text-indigo-600" size={24} />,
      badge: 'Coming Soon',
      active: false,
    },
    {
      id: 'poultry-uniformity',
      title: 'Flock Uniformity',
      description: 'Calculate flock uniformity % and body weight variation.',
      icon: <BarChart3 className="text-violet-600" size={24} />,
      badge: 'Coming Soon',
      active: false,
    },
    {
      id: 'layer-feeds',
      title: 'Layer & Broiler Feeds',
      description: 'Feed specs for Layer, Broiler, and Sonali commercial breeds.',
      icon: <Egg className="text-orange-500" size={24} />,
      badge: 'Coming Soon',
      active: false,
    },
  ];

  // Fish Section Items
  const fishServices = [
    {
      id: 'fish-feed',
      title: 'Aqua Feed Requirements',
      description: 'Daily feeding rate based on body weight and fish biomass.',
      icon: <Fish className="text-cyan-600" size={24} />,
      badge: 'Coming Soon',
      active: false,
    },
  ];

  // Reference Items
  const referenceData = [
    {
      id: 'other-ingredients-reference',
      title: 'Other Feed Ingredients',
      description: 'Nutrient data of green grass, straw, and raw materials.',
      icon: <Layers className="text-emerald-700" size={20} />,
      active: true,
    },
    {
      id: 'dm-ration-reference',
      title: 'DM Ration Standards',
      description: 'Standard Dry Matter intake recommendations for cattle.',
      icon: <BookOpen className="text-blue-700" size={20} />,
      active: true,
    },
    {
      id: 'breed-reference',
      title: 'Cattle Breeds',
      description: 'Physical traits and production standards of dairy breeds.',
      icon: <Dna className="text-purple-700" size={20} />,
      active: true,
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Livestock & Poultry Decision Support System
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Welcome! Select a tool or reference module below to calculate precise feed rations, estimate requirements, and optimize animal nutrition.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none">
          <Calculator size={300} />
        </div>
      </div>

      {/* 1. CATTLE SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-emerald-600 rounded-full inline-block"></span>
            Cattle Nutrition & Tools
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cattleServices.map((item) => (
            <div
              key={item.id}
              onClick={() => item.active && onSelectPage(item.id)}
              className={`p-5 rounded-xl border bg-white transition-all duration-200 flex flex-col justify-between ${
                item.active
                  ? 'border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer group'
                  : 'border-slate-100 opacity-60 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-slate-50 rounded-lg group-hover:bg-emerald-50 transition">
                    {item.icon}
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      item.active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 mb-1 text-base group-hover:text-emerald-700 transition">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {item.description}
                </p>
              </div>

              {item.active && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                  <span>Open Tool</span>
                  <ArrowRight size={14} className="ml-1" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 2. POULTRY SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-amber-500 rounded-full inline-block"></span>
            Poultry Management
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {poultryServices.map((item) => (
            <div
              key={item.id}
              onClick={() => item.active && onSelectPage(item.id)}
              className={`p-4 rounded-xl border bg-white transition-all duration-200 flex flex-col justify-between ${
                item.active
                  ? 'border-slate-200 hover:border-amber-500 hover:shadow-md cursor-pointer group'
                  : 'border-slate-100 opacity-60 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-slate-50 rounded-lg">{item.icon}</div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 mb-1 text-sm">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FISH SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-cyan-600 rounded-full inline-block"></span>
            Aqua / Fish Nutrition
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fishServices.map((item) => (
            <div
              key={item.id}
              onClick={() => item.active && onSelectPage(item.id)}
              className={`p-4 rounded-xl border bg-white transition-all duration-200 flex flex-col justify-between ${
                item.active
                  ? 'border-slate-200 hover:border-cyan-500 hover:shadow-md cursor-pointer group'
                  : 'border-slate-100 opacity-60 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-slate-50 rounded-lg">{item.icon}</div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 mb-1 text-sm">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. REFERENCE DATA SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-slate-600 rounded-full inline-block"></span>
            Reference Database
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {referenceData.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md cursor-pointer transition group flex items-start space-x-3"
            >
              <div className="p-2.5 bg-slate-50 rounded-lg group-hover:bg-emerald-50 transition shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-0.5 group-hover:text-emerald-700 transition">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}