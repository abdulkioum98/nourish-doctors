import React from 'react';
import { Menu, Home, ArrowLeft } from 'lucide-react';

interface NavbarProps {
  onOpenSidebar: () => void;
  onGoHome: () => void;
  onGoBack?: () => void;
  currentPage: string;
}

const PAGE_TITLES: Record<string, string> = {
  'dashboard': 'Nourish-Doctors',
  'cattle-info': 'Cattle Ration Calculator',
  'nourish-feeds-reference': 'Nourish Feeds Reference',
  'weight-measure': 'Live Weight Estimator',
  'layer-light': 'Layer Lighting Schedule',
  'poultry-space': 'Space & Equipment Calcs',
  'poultry-uniformity': 'Flock Uniformity Index',
  'layer-feeds': 'Commercial Poultry Feeds',
  'fish-feed': 'Aqua Feed Requirements',
};

export default function Navbar({ onOpenSidebar, onGoHome, onGoBack, currentPage }: NavbarProps) {
  const pageTitle = PAGE_TITLES[currentPage] || 'Nourish-Doctors';
  const isHomePage = currentPage === 'home' || currentPage === 'dashboard';

  const handleBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      window.history.back();
    }
  };

  return (
    <header className="bg-emerald-700 text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-20">
      {/* Left Section: Menu, Logo, Dynamic Page Title & Home Button */}
      <div className="flex items-center space-x-3">
        <button 
          onClick={onOpenSidebar} 
          className="text-2xl focus:outline-none p-1 hover:bg-emerald-800 rounded-lg transition"
          aria-label="Open Sidebar"
        >
          <Menu size={24} />
        </button>
        
        {/* Brand Logo & Dynamic Page Title */}
        <div className="flex items-center space-x-2.5 select-none">
          <img 
            src="/nourish.png" 
            alt="Nourish Logo" 
            className="h-7 w-auto object-contain bg-white/90 p-0.5 rounded-md shadow-xs"
          />
          <h1 className="text-lg font-bold tracking-tight">
            {pageTitle}
          </h1>
        </div>

        {/* Home Button (Title-এর পাশে বামেই রাখা হয়েছে) */}
        {!isHomePage && (
          <button 
            onClick={onGoHome} 
            className="p-1 hover:bg-emerald-800 rounded-lg transition ml-1" 
            title="Home Dashboard"
          >
            <Home size={20} />
          </button>
        )}
      </div>
      
      {/* Right Section: Back Button */}
      <div className="flex items-center">
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