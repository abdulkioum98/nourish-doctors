import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CattleSidebar from './components/sidebars/cattle/CattleSidebar';

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
import { Loader2, X, LogOut, Mail, Scale, Calculator, History, Info, ChevronRight, Wheat, Sliders, Sparkles, BookOpen } from 'lucide-react';

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

// --- INLINE CUSTOM SIDEBAR: CATTLE WEIGHT ---
function CattleWeightSidebar({ isOpen, onClose, onNavigate, activeId, userEmail }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-70 max-w-[80vw] bg-white h-full shadow-2xl z-50 flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="bg-amber-700 text-white p-4 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h2 className="font-bold text-base sm:text-lg leading-tight">Weight Estimator</h2>
              <p className="text-[11px] text-amber-200">Cattle Health & Measurement</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-amber-600/80 rounded-lg text-white/90">
              <X size={20} />
            </button>
          </div>
          <nav className="p-3 space-y-1">
            <button onClick={() => { onNavigate('weight-measure', 'Weight Calculator'); onClose(); }} className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium flex items-center justify-between ${activeId === 'weight-measure' ? 'bg-amber-50 text-amber-900 font-bold border-l-4 border-amber-600' : 'text-gray-700 hover:bg-slate-100'}`}>
              <div className="flex items-center space-x-3"><Calculator size={18} className="text-amber-700" /><span>Weight Calculator</span></div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
            <div className="pt-6 px-1">
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-amber-900 text-xs">
                <p className="font-bold mb-1 flex items-center gap-1 text-amber-800"><Scale size={14} /> Schaeffer's Formula:</p>
                Live Weight (Lbs) = (Heart Girth² × Length) ÷ 300
              </div>
            </div>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3 sticky bottom-0">
          {userEmail && (
            <div className="flex items-center space-x-2.5 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">
              <Mail size={16} className="text-amber-600 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Logged In As</p>
                <span className="font-semibold truncate text-xs text-slate-700 block">{userEmail}</span>
              </div>
            </div>
          )}
          <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 py-2.5 px-3 rounded-xl text-xs font-bold">
            <LogOut size={15} /><span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- INLINE CUSTOM SIDEBAR: NOURISH CATTLE FEED ---
function NourishCattleFeedSidebar({ isOpen, onClose, onNavigate, activeId, userEmail }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-70 max-w-[80vw] bg-white h-full shadow-2xl z-50 flex flex-col justify-between overflow-y-auto">
        <div>
          <div className="bg-emerald-800 text-white p-4 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h2 className="font-bold text-base sm:text-lg leading-tight">Nourish Feed Section</h2>
              <p className="text-[11px] text-emerald-200">Cattle Nutrition & Products</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-emerald-700/80 rounded-lg text-white/90">
              <X size={20} />
            </button>
          </div>
          <nav className="p-3 space-y-1">
            <button onClick={() => { onNavigate('nourish-feeds', 'Feed Catalogue'); onClose(); }} className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium flex items-center justify-between ${activeId === 'nourish-feeds' ? 'bg-emerald-50 text-emerald-800 font-bold border-l-4 border-emerald-600' : 'text-gray-700 hover:bg-slate-100'}`}>
              <div className="flex items-center space-x-3"><Wheat size={18} className="text-emerald-700" /><span>Feed Catalogue</span></div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
            <div className="pt-6 px-1">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60 text-emerald-900 text-xs text-center font-medium">
                Nourish Quality Feeds for Optimal Milk & Meat Production
              </div>
            </div>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3 sticky bottom-0">
          {userEmail && (
            <div className="flex items-center space-x-2.5 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">
              <Mail size={16} className="text-emerald-600 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Logged In As</p>
                <span className="font-semibold truncate text-xs text-slate-700 block">{userEmail}</span>
              </div>
            </div>
          )}
          <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 py-2.5 px-3 rounded-xl text-xs font-bold">
            <LogOut size={15} /><span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  const [currentPage, setCurrentPage] = useState<PageType>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/admin' || path === '/admin/') {
        return 'admin';
      }
    }
    return 'home';
  });

  const [pageHistory, setPageHistory] = useState<PageType[]>(['home']);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [refPageTitle, setRefPageTitle] = useState<string>('');

  const [dairyData, setDairyData] = useState<CowData | null>(null);
  const [fatteningData, setFatteningData] = useState<FatteningCowData | null>(null);

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
    setPageHistory([]);
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

  const renderSidebar = () => {
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

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-emerald-800">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!session) {
    return <EmailLogin onLoginSuccess={() => window.location.reload()} />;
  }

  const isFormPage = currentPage === 'cattle-info' || currentPage === 'calculator-fattening';

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <Navbar
        currentPage={currentPage}
        onOpenSidebar={() => setSidebarOpen(true)}
        onGoHome={handleGoHome}
        onGoBack={handleGoBack}
      />

      {renderSidebar()}

      <main className={`p-3 sm:p-5 mx-auto transition-all duration-300 ${
        isFormPage ? 'max-w-2xl' : 'w-full max-w-6xl'
      }`}>

        {currentPage === 'home' && (
          <Dashboard onSelectPage={(pageId) => navigateToPage(pageId as PageType)} />
        )}

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
        
        {currentPage === 'cattle-info' && (
          <CattleInfoPage
            initialData={dairyData}
            onSaveAndNext={(data) => {
              setDairyData(data);
              navigateToPage('calculator');
            }}
          />
        )}

        {currentPage === 'calculator-fattening' && (
          <CalculatorFattening
            initialData={fatteningData}
            onSaveAndNext={(data) => {
              setFatteningData(data);
              navigateToPage('fatteningcalculator');
            }}
          />
        )}

        {currentPage === 'calculator' && (
          <CalculatorPage
            cowData={dairyData}
            onEditCowInfo={() => navigateToPage('cattle-info')}
          />
        )}

        {currentPage === 'fatteningcalculator' && (
          <CalculatorFatteningPage
            fatteningData={fatteningData}
            onEditInfo={() => navigateToPage('calculator-fattening')}
          />
        )}

        {(currentPage === 'nourish-feeds' || currentPage === 'nourish-feeds-reference') && (
          <NourishFeedPage onBack={handleBackToCalculator} />
        )}

        {(currentPage === 'feed-nutrients' || currentPage === 'other-ingredients-reference') && (
          <FeedNutrientsPage onBack={handleBackToCalculator} />
        )}

        {(currentPage === 'dm-reference' || currentPage === 'dm-ratio-reference') && (
          <DmReferencePage onBack={handleBackToCalculator} />
        )}

        {currentPage === 'admin' && (
          <AdminPage onBack={handleBackToCalculator} />
        )}

        {currentPage === 'breed-reference' && (
          <BreedPage onBack={handleBackToCalculator} />
        )}

        {currentPage === 'weight-measure' && (
          <WeightEstimatorPage onBack={handleBackToCalculator} />
        )}

        {currentPage === 'layer-light' && (
          <LayerLightCalculator />
        )}

        {currentPage === 'poultry-uniformity' && (
          <PoultryUniformityCalculator />
        )}

      </main>
    </div>
  );
}