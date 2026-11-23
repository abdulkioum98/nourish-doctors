import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Folder-based Sidebars Imports
import CattleSidebar from './components/sidebars/Cattle/CattleSidebar';
import CattleWeightSidebar from './components/sidebars/Cattle/CattleWeightSidebar';
import NourishCattleFeedSidebar from './components/sidebars/Cattle/NourishCattleFeedSidebar';
import LayerLightingSidebar from './components/sidebars/Poultry/LayerLightingSidebar';
import PoultryUniformitySidebar from './components/sidebars/Poultry/PoultryUniformitySidebar';

import EmailLogin from './components/EmailLogin';
import Dashboard from './pages/dashboard/Dashboard';
import UserInfoPage from './components/UserInfoPage';

// Folder-based imports (Cattle)
import CattleInfoPage, { CowData } from './pages/cattle/CattleInfoPage';
import CalculatorFattening, { FatteningCowData } from './pages/cattle/FatteningInfoPage';
import CalculatorPage from './pages/cattle/CalculatorDairyPage';
import CalculatorFatteningPage from './pages/cattle/CalculatorFatteningPage';
import NourishFeedPage from './pages/cattle/NourishFeedPage';
import WeightEstimatorPage from './pages/cattle/WeightEstimatorPage';
import MeasurementGuidePage from './pages/cattle/MeasurementGuidePage';
import SchaefferFormulaPage from './pages/cattle/SchaefferFormulaPage';

// References
import FeedNutrientsPage from './pages/references/OtherIngredientsPage';
import DmReferencePage from './pages/references/DmReferencePage';
import BreedPage from './pages/references/BreedPage';

// Folder-based imports (Poultry)
import LayerLightCalculator from './pages/poultry/Layer/LayerLightCalculator';
import PoultryUniformityCalculator from './pages/poultry/PoultryUniformityCalculator';
import PoultryUniformityFormulaGuide from './pages/poultry/PoultryUniformityFormulaGuide';
import LumenReferencePage from './pages/poultry/Layer/LumenReferencePage'; 
import FormulaReferencePage from './pages/poultry/Layer/LightingFormulaReferencePage'; 
import PoultrySpaceCalculator from './pages/poultry/PoultrySpaceCalculator';
import BroilerStandard from './pages/poultry/Broiler/BroilerStandard';
import LayerStandard from './pages/poultry/Layer/LayerStandard';
import SonaliStandard from './pages/poultry/Sonali/SonaliStandard';
import NourishBroilerFeeds from './pages/poultry/Broiler/NourishBroilerFeeds';
import NourishLayerFeeds from './pages/poultry/Layer/NourishLayerFeeds';
import NourishSonaliFeeds from './pages/poultry/Sonali/NourishSonaliFeeds';

// --- Vaccination Pages ---
import BroilerVaccination from './pages/poultry/Broiler/BroilerVaccination';
import LayerVaccination from './pages/poultry/Layer/LayerVaccination';
import SonaliVaccination from './pages/poultry/Sonali/SonaliVaccination';

// Folder-based imports (Fish)
import NourishFloatingFishFeeds from './pages/fish/NourishFloatingFishFeeds';
import NourishSinkingFishFeeds from './pages/fish/NourishSinkingFishFeeds';

import AdminPage from './pages/admin/AdminPage';
import { Loader2 } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import {
  initOfflineSync,
  syncAllReferenceData,
  processOutbox,
  sendOrQueueUserLog,
  isOnline,
  saveOfflineUser,
  getOfflineUser,
} from './lib/offline';

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
  | 'weight-guide'
  | 'schaeffer-formula'
  
  // --- Poultry Section ---
  | 'layer-light'
  | 'lighting-calculator'
  | 'lighting-guide'
  | 'lux-formula'
  | 'poultry-space'
  | 'poultry-uniformity'
  | 'uniformity-calculator'
  | 'poultry-formula-guide'
  | 'layer-feeds'
  | 'broiler-feeds'
  | 'sonali-feeds'
  | 'layer-standard'
  | 'broiler-standard'
  | 'sonali-standard'
  | 'broiler-vaccination'
  | 'layer-vaccination'
  | 'sonali-vaccination'
  | 'lumen-reference'
  | 'formula-guide' 

  // --- Fish Section ---
  | 'nourish-floating-fish'
  | 'nourish-sinking-fish'

  // --- References & Admin ---
  | 'price-list'
  | 'feed-nutrients'
  | 'other-ingredients-reference'
  | 'dm-reference'
  | 'dm-ratio-reference'
  | 'breed-reference'
  | 'admin'
  | 'user-info';

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

  const [pageHistory, setPageHistory] = useState<PageType[]>(['home']);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [, setRefPageTitle] = useState<string>('');

  // Dashboard Scroll & Accordion State Preservation
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const [activeDropdowns, setActiveDropdowns] = useState({
    standards: false,
    vaccination: false,
    feeds: false,
    fish: false,
  });

  const [dairyData, setDairyData] = useState<CowData | null>(null);
  const [fatteningData, setFatteningData] = useState<FatteningCowData | null>(null);

  // Helper function to update user online status in database.
  // Offline-safe: queued in Dexie and sent when back online, never blocks.
  const updateUserOnlineStatus = async (email: string) => {
    await sendOrQueueUserLog({
      user_email: email,
      is_logged_in: true,
      login_time: new Date().toISOString(),
    });
  };

  // 1. SUPABASE AUTH SESSION CHECK & AUTO ONLINE SYNC
  useEffect(() => {
    initOfflineSync();

    // getSession() reads the locally stored session, but a stale/expired
    // token can make it hang when offline — never block the app on it.
    // The auth-state listener below still delivers the session when ready.
    const sessionTimeout = new Promise<{ data: { session: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { session: null } }), 4000),
    );
    Promise.race([supabase.auth.getSession(), sessionTimeout])
      .then(({ data: { session } }) => {
        // Offline + no Supabase session (expired token cannot refresh without
        // internet): reopen with the last logged-in user instead of asking
        // for login again. The real session returns on the 'online' event.
        let effectiveSession: any = session;
        if (!session && !isOnline()) {
          const stored = getOfflineUser();
          if (stored) {
            effectiveSession = { user: { id: stored.id, email: stored.email } };
          }
        }
        if (session?.user?.email) {
          saveOfflineUser({ id: session.user.id, email: session.user.email });
        }
        setSession(effectiveSession);
        setCheckingAuth(false);

        // ইউজার সাইটে প্রবেশ করলেই বা রিফ্রেশ দিলেই ডাটাবেজে Online হয়ে যাবে
        if (effectiveSession?.user?.email) {
          updateUserOnlineStatus(effectiveSession.user.email);
          if (isOnline()) {
            void syncAllReferenceData();
            void processOutbox();
          }
        }
      })
      .catch(() => setCheckingAuth(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      let effectiveSession: any = session;
      if (!session && !isOnline()) {
        const stored = getOfflineUser();
        if (stored) {
          effectiveSession = { user: { id: stored.id, email: stored.email } };
        }
      }
      if (session?.user?.email) {
        saveOfflineUser({ id: session.user.id, email: session.user.email });
      }
      setSession(effectiveSession);
      setCheckingAuth(false);
      if (effectiveSession?.user?.email) {
        updateUserOnlineStatus(effectiveSession.user.email);
        if (isOnline()) {
          void syncAllReferenceData();
          void processOutbox();
        }
      }
    });

    // Back online: the real session replaces the offline stand-in, so the
    // app keeps working with a fresh token after an offline reopen.
    const handleOnline = () => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          saveOfflineUser({ id: session.user.id, email: session.user.email });
          setSession(session);
        }
      });
    };
    window.addEventListener('online', handleOnline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Restore scroll position when returning to home/dashboard
  useEffect(() => {
    if (currentPage === 'home') {
      window.scrollTo(0, scrollPosition);
    }
  }, [currentPage, scrollPosition]);

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

  const navigateToPage = (newPage: PageType, addToHistory = true) => {
    if (currentPage === 'home') {
      setScrollPosition(window.scrollY);
    }
    if (addToHistory && newPage !== currentPage) {
      setPageHistory((prev) => [...prev, currentPage]);
    }
    setCurrentPage(newPage);
    // A new page always opens from the top (e.g. a calculator opens with
    // its inputs first, not scrolled down to the result). Returning home
    // is the only case that restores the saved scroll position (see the
    // effect above).
    if (newPage !== 'home') {
      window.scrollTo(0, 0);
    }
  };

  const handleSidebarNavigate = (id: string, label: string) => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }

    if (id === 'calculator') {
      navigateToPage(dairyData ? 'calculator' : 'cattle-info');
    } else if (id === 'calculator-fattening') {
      navigateToPage('calculator-fattening');
    } else if (id === 'lighting-calculator') {
      navigateToPage('layer-light');
    } else if (id === 'uniformity-calculator') {
      navigateToPage('poultry-uniformity');
    } else if (id === 'formula-guide') {
      navigateToPage('poultry-formula-guide');
    } else {
      setRefPageTitle(label);
      navigateToPage(id as PageType);
    }
  };

  const handleGoBack = () => {
    // Pop history until the previous page is actually different from the
    // current one (the initial ['home'] entry used to create duplicates
    // that made Back look like it went nowhere / to the wrong page).
    const hist = [...pageHistory];
    let previous: PageType | undefined;
    while (hist.length > 0) {
      previous = hist.pop();
      if (previous !== currentPage) break;
      previous = undefined;
    }
    setPageHistory(hist);
    setCurrentPage(previous ?? 'home');
  };

  const handleGoHome = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    setPageHistory([]); 
    setCurrentPage('home');
  };

  // 3. Android hardware back button (native app only — the browser's own
  // back button is handled by the popstate listener above). On Home it
  // asks before closing the app; on any other page it goes back inside
  // the app, like the Navbar back button.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handle = CapApp.addListener('backButton', () => {
      if (showExitConfirm) {
        setShowExitConfirm(false);
        return;
      }
      if (sidebarOpen) {
        setSidebarOpen(false);
        return;
      }
      if (currentPage === 'home') {
        setShowExitConfirm(true);
        return;
      }
      handleGoBack();
    });
    return () => {
      void handle.then((h) => h.remove());
    };
  }, [currentPage, pageHistory, showExitConfirm, sidebarOpen]);

  // --- SIDEBAR RENDER LOGIC HELPER ---
  const renderSidebar = () => {
    const pagesWithoutSidebar: PageType[] = [
      'poultry-space'
    ];

    if (pagesWithoutSidebar.includes(currentPage)) {
      return null;
    }

    const uniformityPages: PageType[] = [
      'poultry-uniformity',
      'uniformity-calculator',
      'poultry-formula-guide'
    ];

    if (uniformityPages.includes(currentPage)) {
      return (
        <PoultryUniformitySidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigate={handleSidebarNavigate}
          activeTab={currentPage === 'poultry-formula-guide' ? 'formula-guide' : 'uniformity-calculator'}
          setActiveTab={(tab) => {
            if (tab === 'formula-guide') navigateToPage('poultry-formula-guide');
            else navigateToPage('poultry-uniformity');
          }}
          userEmail={session?.user?.email}
        />
      );
    }

    const lightingPages: PageType[] = [
      'layer-light',
      'lighting-calculator',
      'lumen-reference',
      'formula-guide',
      'lighting-guide',
      'lux-formula'
    ];

    if (lightingPages.includes(currentPage)) {
      return (
        <LayerLightingSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigate={handleSidebarNavigate}
          activeId={currentPage}
          userEmail={session?.user?.email}
        />
      );
    }

    const weightPages: PageType[] = ['weight-measure', 'weight-guide', 'schaeffer-formula'];

    if (weightPages.includes(currentPage)) {
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
          <Dashboard 
            onSelectPage={(pageId) => navigateToPage(pageId as PageType)}
            activeDropdowns={activeDropdowns}
            setActiveDropdowns={setActiveDropdowns}
          />
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
          <NourishFeedPage onBack={handleGoHome} />
        )}

        {(currentPage === 'feed-nutrients' || currentPage === 'other-ingredients-reference') && (
          <FeedNutrientsPage onBack={handleGoHome} />
        )}

        {(currentPage === 'dm-reference' || currentPage === 'dm-ratio-reference') && (
          <DmReferencePage onBack={handleGoHome} />
        )}

        {currentPage === 'admin' && (
          <AdminPage onBack={handleGoHome} />
        )}

        {currentPage === 'breed-reference' && (
          <BreedPage onBack={handleGoHome} />
        )}

        {currentPage === 'weight-measure' && (
          <WeightEstimatorPage onBack={handleGoBack} />
        )}

        {/* --- POULTRY PAGES --- */}
        {(currentPage === 'layer-light' || currentPage === 'lighting-calculator') && (
          <LayerLightCalculator />
        )}

        {currentPage === 'poultry-uniformity' && (
          <PoultryUniformityCalculator />
        )}

        {currentPage === 'poultry-formula-guide' && (
          <PoultryUniformityFormulaGuide />
        )}

        {currentPage === 'poultry-space' && (
          <PoultrySpaceCalculator />
        )}

        {currentPage === 'broiler-standard' && (
          <BroilerStandard />
        )}

        {currentPage === 'layer-standard' && (
          <LayerStandard />
        )}

        {currentPage === 'sonali-standard' && (
          <SonaliStandard />
        )}

        {currentPage === 'broiler-feeds' && (
          <NourishBroilerFeeds />
        )}

        {currentPage === 'layer-feeds' && (
          <NourishLayerFeeds />
        )}

        {currentPage === 'sonali-feeds' && (
          <NourishSonaliFeeds />
        )}

        {/* --- VACCINATION PAGES --- */}
        {currentPage === 'broiler-vaccination' && (
          <BroilerVaccination />
        )}

        {currentPage === 'layer-vaccination' && (
          <LayerVaccination />
        )}

        {currentPage === 'sonali-vaccination' && (
          <SonaliVaccination />
        )}

        {/* --- FISH PAGES --- */}
        {currentPage === 'nourish-floating-fish' && (
          <NourishFloatingFishFeeds />
        )}

        {currentPage === 'nourish-sinking-fish' && (
          <NourishSinkingFishFeeds />
        )}

        {currentPage === 'weight-guide' && (
          <MeasurementGuidePage onBack={handleGoBack} />
        )}

        {currentPage === 'schaeffer-formula' && (
          <SchaefferFormulaPage onBack={handleGoBack} />
        )}

        {currentPage === 'lumen-reference' && (
          <LumenReferencePage onBack={handleGoBack} />
        )}

        {currentPage === 'formula-guide' && (
          <FormulaReferencePage onBack={handleGoBack} />
        )}
        
        {currentPage === 'user-info' && (
          <UserInfoPage session={session} />
        )}

      </main>

      {/* Exit confirmation — shown by the Android back button on Home */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900">Close the app?</h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to exit Nourish Doctors?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-800 text-sm font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => void CapApp.exitApp()}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold transition cursor-pointer"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}