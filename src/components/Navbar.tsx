import React, { useState, useEffect } from 'react';
import { Menu, Home, ArrowLeft } from 'lucide-react';

interface NavbarProps {
  onOpenSidebar: () => void;
  onGoHome: () => void;
  onGoBack?: () => void;
  currentPage: string;
}

// Short titles for every page, so the navbar never wraps to a second
// line on a phone. Keep them short (one or two words where possible).
const PAGE_TITLES: Record<string, string> = {
  // Home
  'home': 'Nourish Doctors',
  'dashboard': 'Nourish Doctors',
  // Cattle
  'cattle-info': 'Ration Calc.',
  'calculator': 'Dairy Calc.',
  'calculator-fattening': 'Fattening Calc.',
  'fatteningcalculator': 'Fattening Calc.',
  'nourish-feeds': 'Nourish Feeds',
  'nourish-feeds-reference': 'Nourish Feeds',
  'cattle-health': 'Cattle Health',
  'weight-measure': 'Live Weight',
  'weight-guide': 'Measure Guide',
  'schaeffer-formula': 'Schaeffer Formula',
  // Poultry
  'layer-light': 'Layer Light',
  'lighting-calculator': 'Layer Light',
  'lighting-guide': 'Lighting Guide',
  'lux-formula': 'Lux Formula',
  'lumen-reference': 'Lumen Ref.',
  'formula-guide': 'Light Formula',
  'poultry-space': 'Space Calc.',
  'poultry-uniformity': 'Uniformity',
  'uniformity-calculator': 'Uniformity',
  'poultry-formula-guide': 'Uniformity Guide',
  'layer-feeds': 'Layer Feeds',
  'broiler-feeds': 'Broiler Feeds',
  'sonali-feeds': 'Sonali Feeds',
  'layer-standard': 'Layer Std.',
  'broiler-standard': 'Broiler Std.',
  'sonali-standard': 'Sonali Std.',
  'broiler-vaccination': 'Broiler Vaccine',
  'layer-vaccination': 'Layer Vaccine',
  'sonali-vaccination': 'Sonali Vaccine',
  // Fish
  'nourish-floating-fish': 'Floating Feed',
  'nourish-sinking-fish': 'Sinking Feed',
  'aqua-feeding-rate': 'Feeding Rate',
  'aqua-stocking-density': 'Stocking Density',
  'aqua-water-quality': 'Water Quality',
  'aqua-nursery-feeding': 'Nursery Feeding',
  'aqua-pond-prep': 'Pond Prep',
  'fish-feed': 'Aqua Feed',
  // References
  'feed-nutrients': 'Ingredients',
  'other-ingredients-reference': 'Ingredients',
  'dm-reference': 'DM Reference',
  'dm-ratio-reference': 'DM Ratio',
  'breed-reference': 'Breeds',
  'price-list': 'Price List',
  // Admin & account
  'admin': 'Admin',
  'user-info': 'My Account',
};

export default function Navbar({ onOpenSidebar, onGoHome, onGoBack, currentPage }: NavbarProps) {
  const pageTitle = PAGE_TITLES[currentPage] || 'Nourish Doctors';
  const isHomePage = currentPage === 'home' || currentPage === 'dashboard';
  const [offline, setOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  const handleBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      window.history.back();
    }
  };

  return (
    <header className="bg-emerald-700 text-white p-3 sm:p-4 flex justify-between items-center shadow-md sticky top-0 z-20">
      {/* Left Section: Menu, Logo, Dynamic Page Title & Home Button */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
        <button 
          onClick={onOpenSidebar} 
          className="text-2xl focus:outline-none p-1 hover:bg-emerald-800 rounded-lg transition shrink-0"
          aria-label="Open Sidebar"
        >
          <Menu size={24} />
        </button>
        
        {/* Brand Logo & Dynamic Page Title — never wraps: the title
            truncates with an ellipsis instead of breaking to a second line */}
        <div className="flex items-center space-x-2 select-none min-w-0 flex-1">
          {/* Logo — clickable: takes you to the Home page */}
          <button
            onClick={onGoHome}
            className="shrink-0 rounded-md focus:outline-none hover:opacity-90 active:scale-95 transition"
            title="Home"
            aria-label="Go to Home"
          >
            <img
              src="/nourish.png"
              alt="Nourish Logo"
              className="h-7 w-auto object-contain bg-white/90 p-0.5 rounded-md shadow-xs block"
            />
          </button>
          <h1 className="text-base sm:text-lg font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
            {pageTitle}
          </h1>
          {offline && (
            <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
              Offline
            </span>
          )}
        </div>

        {/* Home Button*/}
        {!isHomePage && (
          <button 
            onClick={onGoHome} 
            className="p-1 hover:bg-emerald-800 rounded-lg transition ml-1 shrink-0" 
            title="Home Dashboard"
          >
            <Home size={20} />
          </button>
        )}
      </div>
      
      {/* Right Section: Back Button */}
      <div className="flex items-center shrink-0">
        {!isHomePage && (
          <button 
            onClick={handleBack} 
            className="p-1.5 hover:bg-emerald-800 rounded-lg transition flex items-center justify-center" 
            title="Go Back"
          >
            <ArrowLeft size={22} />
          </button>
        )}
      </div>
    </header>
  );
}