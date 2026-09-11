import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Folder-based Sidebars Imports
import CattleSidebar from './components/sidebars/cattle/CattleSidebar';
import CattleWeightSidebar from './components/sidebars/cattle/CattleWeightSidebar';
import NourishCattleFeedSidebar from './components/sidebars/cattle/NourishCattleFeedSidebar';

import EmailLogin from './components/EmailLogin';
import Dashboard from './pages/dashboard/Dashboard';

// Folder-based imports
import CattleInfoPage, { CowData } from './pages/cattle/CattleInfoPage';
import CalculatorFattening, { FatteningCowData } from './pages/cattle/FatteningInfoPage';
import CalculatorPage from './pages/cattle/CalculatorDairyPage';
import CalculatorFatteningPage from './pages/cattle/CalculatorFatteningPage';
import NourishFeedPage from './pages/cattle/NourishFeedPage';
import WeightEstimatorPage from './pages/cattle/WeightEstimatorPage';

import FeedNutrientsPage from './pages/references/OtherIngredientsPage';
import DmReferencePage from './pages/references/DmReferencePage';
import BreedPage from './pages/references/BreedPage';

import LayerLightCalculator from './pages/poultry/LayerLightCalculator';
import PoultryUniformityCalculator from './pages/poultry/PoultryUniformityCalculator';

import AdminPage from './pages/admin/AdminPage';
import { Loader2 } from 'lucide-react';

export type CattleData = CowData | FatteningCowData;

export type PageType =
  | 'home'
  // --- Cattle Section ---
  | 'cattle-info'
  | 'calculator-fattening'
  | 'calculator'
  | 'fatteningcalculator'
  | 'weight-measure'
  | 'nourish-feeds'
  | 'nourish-feeds-reference'
  // --- Poultry Section ---
  | 'layer-light'
  | 'poultry-space'
  | 'poultry-uniformity'
  | 'layer-feeds'
  | 'broiler-feeds'
  | 'sonali-feeds'
  | 'layer-standard'
  | 'broiler-standard'
  | 'sonali-standard'
  // --- Fish Section ---
  | 'fish-feed'
  // --- References & Admin ---
  | 'price-list'
  | 'feed-nutrients'
  | 'other-ingredients-reference'
  | 'dm-reference'
  | 'dm-ratio-reference'
  | 'breed-reference'
  | 'admin';

export default function App() {
  // --- AUTHENTICATION STATES ---
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // --- PAGE & NAVIGATION STATES ---
  const [currentPage, setCurrentPage] = useState<PageType>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/admin' || path === '/admin/') {
        return 'admin';
      }
    }
    return 'home';
  });

  // পেজ হিস্ট্রি ট্র্যাক করার জন্য স্টেট (Back Button-এর জন্য)
  const [pageHistory, setPageHistory] = useState<PageType[]>(['home']);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [refPageTitle, setRefPageTitle] = useState<string>('');

  // Isolated data states
  const [dairyData, setDairyData] = useState<CowData | null>(null);
  const [fatteningData, setFatteningData] = useState<FatteningCowData | null>(null);

  // 1. SUPABASE AUTH SESSION CHECK
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Browser Navigation Sync
  useEffect(() => {
    const handleUrlCheck = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/admin' || path === '/admin/') {
        navigateToPage('admin', false);
      } else if (path === '/' || path === '') {
        if (currentPage === 'admin') {
          navigateToPage('home', false);
        }
      }
    };

    window.addEventListener('popstate', handleUrlCheck);
    return () => window.removeEventListener('popstate', handleUrlCheck);
  }, [currentPage]);

  // পেজ পরিবর্তন ও হিস্ট্রি ম্যানেজমেন্ট হ্যান্ডলার
  const navigateToPage = (newPage: PageType, addToHistory = true) => {
    if (addToHistory && newPage !== currentPage) {
      setPageHistory((prev) => [...prev, currentPage]);
    }
    setCurrentPage(newPage);
  };

  const handleSidebarNavigate = (id: string, label: string) => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }

    if (id === 'calculator') {
      navigateToPage(dairyData ? 'calculator' : 'cattle-info');
    } else if (id === 'calculator-fattening') {
      navigateToPage('calculator-fattening');
    } else {
      setRefPageTitle(label);
      navigateToPage(id as PageType);
    }
  };

  const handleGoBack = () => {
    if (pageHistory.length > 0) {
      const previousPage = pageHistory[pageHistory.length - 1];
      setPageHistory((prev) => prev.slice(0, -1));
      setCurrentPage(previousPage);
    } else {
      setCurrentPage('home');
    }
  };

  const handleGoHome = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    setPageHistory([]); // Clear history when going home
    setCurrentPage('home');
  };

  const handleBackToCalculator = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }

    if (currentPage === 'fatteningcalculator' || fatteningData) {
      navigateToPage('fatteningcalculator');
    } else if (dairyData) {
      navigateToPage('calculator');
    } else {
      navigateToPage('cattle-info');
    }
  };

  // --- SIDEBAR RENDER LOGIC HELPER ---
  const renderSidebar = () => {
    // ১. Live Weight Estimator পেজের জন্য সাইডবার
    if (currentPage === 'weight-measure') {
      return (
        <CattleWeightSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigate={handleSidebarNavigate}
          activeId={currentPage}
          userEmail={session?.user?.email}
        />
      );
    }

    // ২. Nourish Cattle Feed sidebar
    if (currentPage === 'nourish-feeds' || currentPage === 'nourish-feeds-reference') {
      return (
        <NourishCattleFeedSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigate={handleSidebarNavigate}
          activeId={currentPage}
          userEmail={session?.user?.email}
        />
      );
    }

    // ৩. অন্যান্য ক্যাটল পেজসমূহের জন্য সাধারণ ক্যাটল সাইডবার
    const generalCattlePages: PageType[] = [
      'cattle-info',
      'calculator',
      'calculator-fattening',
      'fatteningcalculator',
      'feed-nutrients',
      'other-ingredients-reference',
      'dm-reference',
      'dm-ratio-reference',
      'breed-reference',
    ];

    if (generalCattlePages.includes(currentPage)) {
      return (
        <CattleSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigate={handleSidebarNavigate}
          activeId={currentPage}
          userEmail={session?.user?.email}
        />
      );
    }

    // Main Sidebar
    return (
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleSidebarNavigate}
        activeId={currentPage}
        userEmail={session?.user?.email}
      />
    );
  };

  // --- RENDER LOADING STATE ---
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-emerald-800">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  // --- RENDER LOGIN IF NOT AUTHENTICATED ---
  if (!session) {
    return <EmailLogin onLoginSuccess={() => window.location.reload()} />;
  }

  // --- RENDER MAIN APPLICATION IF LOGGED IN ---
  const isFormPage = currentPage === 'cattle-info' || currentPage === 'calculator-fattening';

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* 1. Dynamic Navbar */}
      <Navbar
        currentPage={currentPage}
        onOpenSidebar={() => setSidebarOpen(true)}
        onGoHome={handleGoHome}
        onGoBack={handleGoBack}
      />

      {/* 2. DYNAMIC SIDEBAR (রেন্ডার হেলপার ফাংশনের মাধ্যমে নির্দিষ্ট সাইডবার লোড হবে) */}
      {renderSidebar()}

      <main className={`p-3 sm:p-5 mx-auto transition-all duration-300 ${
        isFormPage ? 'max-w-2xl' : 'w-full max-w-6xl'
      }`}>

        {/* HOME / DASHBOARD PAGE */}
        {currentPage === 'home' && (
          <Dashboard onSelectPage={(pageId) => navigateToPage(pageId as PageType)} />
        )}

        {/* MAIN TOGGLE (Dairy vs Fattening) */}
        {isFormPage && (
          <div className="flex bg-slate-200 p-1 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => navigateToPage('cattle-info')}
              className={`flex-1 py-2.5 text-center rounded-lg text-sm font-bold transition-all ${
                currentPage === 'cattle-info'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dairy
            </button>
            <button
              type="button"
              onClick={() => navigateToPage('calculator-fattening')}
              className={`flex-1 py-2.5 text-center rounded-lg text-sm font-bold transition-all ${
                currentPage === 'calculator-fattening'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fattening
            </button>
          </div>
        )}
        
        {/* DAIRY INPUT FORM */}
        {currentPage === 'cattle-info' && (
          <CattleInfoPage
            initialData={dairyData}
            onSaveAndNext={(data) => {
              setDairyData(data);
              navigateToPage('calculator');
            }}
          />
        )}

        {/* FATTENING INPUT FORM */}
        {currentPage === 'calculator-fattening' && (
          <CalculatorFattening
            initialData={fatteningData}
            onSaveAndNext={(data) => {
              setFatteningData(data);
              navigateToPage('fatteningcalculator');
            }}
          />
        )}

        {/* DAIRY CALCULATOR PAGE */}
        {currentPage === 'calculator' && (
          <CalculatorPage
            cowData={dairyData}
            onEditCowInfo={() => navigateToPage('cattle-info')}
          />
        )}

        {/* FATTENING CALCULATOR PAGE */}
        {currentPage === 'fatteningcalculator' && (
          <CalculatorFatteningPage
            fatteningData={fatteningData}
            onEditInfo={() => navigateToPage('calculator-fattening')}
          />
        )}

        {/* NOURISH FEEDS REFERENCE PAGE */}
        {(currentPage === 'nourish-feeds' || currentPage === 'nourish-feeds-reference') && (
          <NourishFeedPage onBack={handleBackToCalculator} />
        )}

        {/* OTHER INGREDIENTS REFERENCE PAGE */}
        {(currentPage === 'feed-nutrients' || currentPage === 'other-ingredients-reference') && (
          <FeedNutrientsPage onBack={handleBackToCalculator} />
        )}

        {/* DM RATIO REFERENCE PAGE */}
        {(currentPage === 'dm-reference' || currentPage === 'dm-ratio-reference') && (
          <DmReferencePage onBack={handleBackToCalculator} />
        )}

        {/* HIDDEN ADMIN PAGE */}
        {currentPage === 'admin' && (
          <AdminPage onBack={handleBackToCalculator} />
        )}

        {/* BREED PAGE */}
        {currentPage === 'breed-reference' && (
          <BreedPage onBack={handleBackToCalculator} />
        )}

        {/* WEIGHT ESTIMATOR PAGE */}
        {currentPage === 'weight-measure' && (
          <WeightEstimatorPage onBack={handleBackToCalculator} />
        )}

        {/* LAYER LIGHT CALCULATOR PAGE */}
        {currentPage === 'layer-light' && (
          <LayerLightCalculator />
        )}

        {/* FLOCK UNIFORMITY CALCULATOR PAGE */}
        {currentPage === 'poultry-uniformity' && (
          <PoultryUniformityCalculator />
        )}

      </main>
    </div>
  );
}