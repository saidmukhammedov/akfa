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
      {/* Desktop / Tablet Navigation Bar (Top sub-header) */}
      <nav className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="inline-flex p-1.5 bg-slate-200/70 rounded-2xl border border-slate-300/60 shadow-clay-pressed backdrop-blur-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'bg-white text-akfa-700 shadow-clay-card border border-slate-200/80'
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

      {/* Mobile Navigation Bar (Fixed at bottom for easy thumb access in the workshop) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1 safe-area-pb">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all active:scale-95 ${
                  isActive ? 'text-akfa-600 bg-akfa-50/70 font-semibold' : 'text-slate-500 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                <span className="text-[10px] truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
