import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LayoutDashboard, CalendarCheck, Layers, Wallet, Settings } from 'lucide-react';

export type TabId = 'dashboard' | 'davomat' | 'obyom' | 'moliya' | 'sozlamalar';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  const navItems: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'davomat', label: t.nav.davomat, icon: CalendarCheck },
    { id: 'obyom', label: t.nav.obyom || 'Obyom', icon: Layers },
    { id: 'moliya', label: t.nav.moliya, icon: Wallet },
    { id: 'sozlamalar', label: t.nav.sozlamalar, icon: Settings },
  ];

  return (
    <>
      {/* Desktop / Tablet Navigation Bar (Floating Glass Sub-Header Capsule) */}
      <nav className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-2">
        <div className="inline-flex p-1.5 glass-slot rounded-2xl shadow-glass-slot">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-akfa-700 dark:text-blue-300 shadow-clay-card border border-white dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-akfa-600 dark:text-blue-400 stroke-[2.4]' : 'text-slate-500 dark:text-slate-400 stroke-[2]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Floating Navigation Dock: higher elevation, narrower width, taller height, soft rounded corners */}
      <nav className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-50 bg-white/85 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/70 dark:border-slate-800/70 rounded-2xl shadow-[0_12px_32px_-4px_rgba(15,23,42,0.15)] dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)] p-1.5 transform-gpu">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-b from-akfa-600 to-indigo-600 dark:from-blue-600 dark:to-indigo-600 text-white shadow-[0_4px_14px_rgba(79,70,229,0.28)] border border-white/25 dark:border-white/20 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'stroke-[2.2] text-white drop-shadow-sm' : 'stroke-[1.8] text-slate-500 dark:text-slate-400'}`} />
                <span className="text-[10px] leading-tight tracking-tight truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
