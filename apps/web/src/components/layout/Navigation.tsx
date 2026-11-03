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

      {/* Mobile Navigation Bar (Floating Glass Island Dock above bottom edge) */}
      <nav className="sm:hidden fixed bottom-2.5 left-3.5 right-3.5 max-w-md mx-auto z-50 bg-white/80 dark:bg-slate-900/90 backdrop-blur-3xl border border-white/85 dark:border-slate-800/90 rounded-[22px] shadow-[0_8px_28px_rgba(15,23,42,0.12)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.5)] p-1 safe-area-pb transform-gpu">
        <div className="grid grid-cols-5 gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-[14px] transition-all duration-200 active:scale-90 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-b from-akfa-500 to-akfa-600 dark:from-blue-600 dark:to-indigo-700 text-white shadow-clay-btn-primary border border-akfa-400/50 dark:border-blue-500/50 font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] mb-0.5 ${isActive ? 'stroke-[2.4] text-white drop-shadow-sm' : 'stroke-[2] text-slate-500 dark:text-slate-400'}`} />
                <span className="text-[9.5px] leading-tight tracking-tight truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
