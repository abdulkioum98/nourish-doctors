import React from 'react';
import { supabase } from '../../../supabaseClient';
import {
  X,
  LogOut,
  Mail,
  Lightbulb,
  BookOpen,
  ChevronRight,
  Sliders,
  SunMedium,
  Binary
} from 'lucide-react';

export type LayerLightingTab = 
  | 'lighting-calculator' 
  | 'lumen-reference' 
  | 'formula-guide' 
  | 'lighting-guide' 
  | 'lux-recommendation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (id: LayerLightingTab, label: string) => void;
  activeTab?: LayerLightingTab;
  setActiveTab?: (tab: LayerLightingTab) => void;
  userEmail?: string;
}

export default function LayerLightingSidebar({
  isOpen,
  onClose,
  onNavigate,
  activeTab = 'lighting-calculator',
  setActiveTab,
  userEmail
}: SidebarProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleTabClick = (id: LayerLightingTab, label: string) => {
    if (setActiveTab) setActiveTab(id);
    if (onNavigate) onNavigate(id, label);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Background Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Sidebar Main Content */}
      <div className="relative w-70 max-w-[80vw] bg-white h-full shadow-2xl z-50 flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header - Amber Theme */}
          <div className="bg-amber-600 text-white p-4 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h2 className="font-bold text-base sm:text-lg leading-tight">Lighting Manager</h2>
              <p className="text-[11px] text-amber-100">Layer Poultry Light & Lux Calculation</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-amber-700/80 rounded-lg transition-colors text-white/90 cursor-pointer"
              aria-label="Close Sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {/* 1. Lighting Calculator */}
            <button
              onClick={() => handleTabClick('lighting-calculator', 'Light Calculator')}
              className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all duration-150 cursor-pointer ${
                activeTab === 'lighting-calculator'
                  ? 'bg-amber-50 text-amber-900 font-bold shadow-xs border-l-4 border-amber-600'
                  : 'text-gray-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Lightbulb size={18} className="text-amber-600" />
                <span>Light Calculator</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            {/* 2. Lumen Reference */}
            <button
              onClick={() => handleTabClick('lumen-reference', 'Lumen Reference')}
              className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all duration-150 cursor-pointer ${
                activeTab === 'lumen-reference'
                  ? 'bg-amber-50 text-amber-900 font-bold shadow-xs border-l-4 border-amber-600'
                  : 'text-gray-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <SunMedium size={18} className="text-amber-600" />
                <span>Lumen Reference</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            {/* 3. Formula Guide */}
            <button
              onClick={() => handleTabClick('formula-guide', 'Formula Guide')}
              className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all duration-150 cursor-pointer ${
                activeTab === 'formula-guide'
                  ? 'bg-amber-50 text-amber-900 font-bold shadow-xs border-l-4 border-amber-600'
                  : 'text-gray-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Binary size={18} className="text-amber-600" />
                <span>Formula Guide</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            {/* 4. Lighting Guide */}
            <button
              onClick={() => handleTabClick('lighting-guide', 'Lighting Program Guide')}
              className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all duration-150 cursor-pointer ${
                activeTab === 'lighting-guide'
                  ? 'bg-amber-50 text-amber-900 font-bold shadow-xs border-l-4 border-amber-600'
                  : 'text-gray-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <BookOpen size={18} className="text-amber-600" />
                <span>Lighting Program Guide</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>

            {/* 5. Lux Recommendation */}
            <button
              onClick={() => handleTabClick('lux-recommendation', 'Lux Requirements')}
              className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all duration-150 cursor-pointer ${
                activeTab === 'lux-recommendation'
                  ? 'bg-amber-50 text-amber-900 font-bold shadow-xs border-l-4 border-amber-600'
                  : 'text-gray-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Sliders size={18} className="text-amber-600" />
                <span>Lux Requirements</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
          </nav>
        </div>

        {/* Profile & Logout Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3 sticky bottom-0">
          {userEmail && (
            <div className="flex items-center space-x-2.5 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
              <Mail size={16} className="text-amber-600 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-[10px] text-slate-400 font-semibold uppercase leading-none">Logged In As</p>
                <span className="font-semibold truncate text-xs text-slate-700 block mt-0.5" title={userEmail}>
                  {userEmail}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.99] cursor-pointer"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>

          <div className="text-[10px] text-slate-400 text-center font-medium">
            Nourish-Doctors v2.0
          </div>
        </div>
      </div>
    </div>
  );
}