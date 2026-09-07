import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import EmailLogin from './components/EmailLogin';
import Dashboard from './pages/dashboard/Dashboard';

// Folder-based imports
import CattleInfoPage, { CowData } from './pages/cattle/CattleInfoPage';
import CalculatorFattening, { FatteningCowData } from './pages/cattle/FatteningInfoPage';
import CalculatorPage from './pages/cattle/CalculatorDairyPage';
import CalculatorFatteningPage from './pages/cattle/CalculatorFatteningPage';
import NourishFeedPage from './pages/cattle/NourishFeedPage';

import FeedNutrientsPage from './pages/references/OtherIngredientsPage';
import DmReferencePage from './pages/references/DmReferencePage';
import BreedPage from './pages/references/BreedPage';

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

  // --- PAGE & APPLICATION STATES ---
  const [currentPage, setCurrentPage] = useState<PageType>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path === '/admin' || path === '/admin/') {
        return 'admin';
      }
    }
    return 'home'; // App-e dhukar sathei Dashboard ashbe
  });

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [refPageTitle, setRefPageTitle] = useState<string>('');

  // Isolated states
  const [dairyData, setDairyData] = useState<CowData | null>(null);
  const [fatteningData, setFatteningData] = useState<FatteningCowData | null>(null);

  // 1. SUPABASE AUTH SESSION CHECK (Persistent Login)
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

  // 2. Browser navigation (Back/Forward URL sync)
  useEffect(() => {
    const handleUrlCheck = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/admin' || path === '/admin/') {
        setCurrentPage('admin');
      } else if (path === '/' || path === '') {
        if (currentPage === 'admin') {
          setCurrentPage('home');
        }
      }
    };

    window.addEventListener('popstate', handleUrlCheck);
    return () => window.removeEventListener('popstate', handleUrlCheck);
  }, [currentPage]);

  const handleSidebarNavigate = (id: string, label: string) => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }

    if (id === 'calculator') {
      setCurrentPage(dairyData ? 'calculator' : 'cattle-info');
    } else if (id === 'calculator-fattening') {
      setCurrentPage('calculator-fattening');
    } else {
      setRefPageTitle(label);
      setCurrentPage(id as PageType);
    }
  };

  const handleBackToCalculator = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }

    if (currentPage === 'fatteningcalculator' || fatteningData) {
      setCurrentPage('fatteningcalculator');
    } else if (dairyData) {
      setCurrentPage('calculator');
    } else {
      setCurrentPage('cattle-info');
    }
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
      <Navbar
        onOpenSidebar={() => setSidebarOpen(true)}
        onGoHome={() => {
          if (window.location.pathname !== '/') {
            window.history.pushState({}, '', '/');
          }
          setCurrentPage('home');
        }}
        onGoCalculator={() => {
          if (window.location.pathname !== '/') {
            window.history.pushState({}, '', '/');
          }
          if (fatteningData && currentPage === 'calculator-fattening') {
            setCurrentPage('fatteningcalculator');
          } else {
            setCurrentPage(dairyData ? 'calculator' : 'cattle-info');
          }
        }}
        hasCowData={!!dairyData || !!fatteningData}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleSidebarNavigate}
        activeId={currentPage}
        userEmail={session.user?.email}
      />

      <main className={`p-3 sm:p-5 mx-auto transition-all duration-300 ${
        isFormPage ? 'max-w-2xl' : 'w-full max-w-6xl'
      }`}>

        {/* HOME / DASHBOARD PAGE */}
        {currentPage === 'home' && (
          <Dashboard onSelectPage={(pageId) => setCurrentPage(pageId as PageType)} />
        )}

        {/* MAIN TOGGLE (Dairy vs Fattening) */}
        {isFormPage && (
          <div className="flex bg-slate-200 p-1 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => setCurrentPage('cattle-info')}
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
              onClick={() => setCurrentPage('calculator-fattening')}
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
              setCurrentPage('calculator');
            }}
          />
        )}

        {/* FATTENING INPUT FORM */}
        {currentPage === 'calculator-fattening' && (
          <CalculatorFattening
            initialData={fatteningData}
            onSaveAndNext={(data) => {
              setFatteningData(data);
              setCurrentPage('fatteningcalculator');
            }}
          />
        )}

        {/* DAIRY CALCULATOR PAGE */}
        {currentPage === 'calculator' && (
          <CalculatorPage
            cowData={dairyData}
            onEditCowInfo={() => setCurrentPage('cattle-info')}
          />
        )}

        {/* FATTENING CALCULATOR PAGE */}
        {currentPage === 'fatteningcalculator' && (
          <CalculatorFatteningPage
            fatteningData={fatteningData}
            onEditInfo={() => setCurrentPage('calculator-fattening')}
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

      </main>
    </div>
  );
}