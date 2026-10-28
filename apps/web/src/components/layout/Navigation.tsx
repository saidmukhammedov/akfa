import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LayoutDashboard, CalendarCheck, Wallet, Settings } from 'lucide-react';

export type TabId = 'dashboard' | 'davomat' | 'moliya' | 'sozlamalar';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  const navItems: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'davomat', label: t.nav.davomat, icon: CalendarCheck },
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
      <nav className="sm:hidden fixed bottom-3 left-3 right-3 z-50 bg-white/75 dark:bg-slate-900/85 backdrop-blur-3xl border border-white/85 dark:border-slate-800/90 rounded-3xl shadow-[0_12px_36px_rgba(15,23,42,0.14)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] p-1.5 safe-area-pb">
        <div className="grid grid-cols-4 gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 active:scale-90 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-b from-akfa-500 to-akfa-600 dark:from-blue-600 dark:to-indigo-700 text-white shadow-clay-btn-primary border border-akfa-400/50 dark:border-blue-500/50 font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.4] text-white drop-shadow-sm' : 'stroke-[2] text-slate-500 dark:text-slate-400'}`} />
                <span className="text-[10px] tracking-tight truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
