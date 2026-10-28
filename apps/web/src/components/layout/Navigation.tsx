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
      {/* Desktop / Tablet Navigation Bar (Floating sub-header capsule) */}
      <nav className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="inline-flex p-1.5 bg-slate-200/50 backdrop-blur-xl rounded-2xl border border-white/70 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-white/95 text-akfa-700 shadow-clay-card border border-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-akfa-600 stroke-[2.2]' : 'text-slate-500 stroke-[1.8]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Navigation Bar (Frosted glass floating bottom dock) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-t border-white/70 shadow-[0_-8px_25px_rgba(15,23,42,0.06)] px-2.5 py-1.5 safe-area-pb">
        <div className="grid grid-cols-4 gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all active:scale-95 cursor-pointer ${
                  isActive
                    ? 'text-akfa-700 bg-akfa-50/80 backdrop-blur-md shadow-clay-sm border border-akfa-200/60 font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.2] text-akfa-600' : 'stroke-[1.8]'}`} />
                <span className="text-[10px] tracking-tight truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
