import React from 'react';
import { supabase } from '../../../supabaseClient';
import {
  X,
  BookOpen,
  Wheat,
  Calculator,
  Layers,
  Dna,
  LogOut,
  Mail,
  Home
} from 'lucide-react';

interface CattleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (id: string, label: string) => void;
  activeId?: string;
  userEmail?: string;
}

export default function CattleSidebar({
  isOpen,
  onClose,
  onNavigate,
  activeId = 'cattle-info',
  userEmail
}: CattleSidebarProps) {

  const menuItems = [
    { id: 'cattle-info', label: 'Calculator', icon: <Calculator size={18} /> },
    { id: 'nourish-feeds-reference', label: 'Nourish Feeds', icon: <Wheat size={18} /> },
    { id: 'other-ingredients-reference', label: 'Other Ingredients', icon: <Layers size={18} /> },
    { id: 'dm-ratio-reference', label: 'DM Ratio Reference', icon: <BookOpen size={18} /> },
    { id: 'breed-reference', label: 'Breeds Guide', icon: <Dna size={18} /> },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div className="relative w-70 max-w-[80vw] bg-white h-full shadow-2xl z-50 flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header with Home Icon & Close Icon */}
          <div className="bg-emerald-800 text-white p-4 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h2 className="font-bold text-base sm:text-lg leading-tight">Cattle Module</h2>
              <p className="text-[11px] text-emerald-200">Tools & Reference Tables</p>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Header-এর ভেতর Home Button */}
              <button
                onClick={() => {
                  onNavigate('home', 'Dashboard');
                  onClose();
                }}
                className="p-1.5 hover:bg-emerald-700/80 rounded-lg transition-colors text-white/90"
                title="Go to Dashboard"
              >
                <Home size={20} />
              </button>

              {/* Close Button */}
              <button 
                onClick={onClose} 
                className="p-1.5 hover:bg-emerald-700/80 rounded-lg transition-colors text-white/90"
                aria-label="Close Sidebar"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = activeId === item.id || 
                (item.id === 'cattle-info' && (activeId === 'calculator-fattening' || activeId === 'calculator' || activeId === 'fatteningcalculator'));

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id, item.label);
                    onClose();
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium flex items-center space-x-3 transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-bold shadow-xs border-l-4 border-emerald-600'
                      : 'text-gray-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={isActive ? 'text-emerald-700' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Logout Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3 sticky bottom-0">
          {userEmail && (
            <div className="flex items-center space-x-2.5 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
              <Mail size={16} className="text-emerald-600 shrink-0" />
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
            className="w-full flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.99]"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>

          <div className="text-[10px] text-slate-400 text-center font-medium">
            Cattle Ration Calculator v2.0
          </div>
        </div>
      </div>
    </div>
  );
}