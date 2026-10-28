import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAppState } from '../../context/AppStateContext';
import { useAuth } from '../../context/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ShieldCheck, Calendar } from 'lucide-react';

export const Header: React.FC = () => {
  const { t, formatDate } = useLanguage();
  const { selectedDate } = useAppState();
  const { owner } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/65 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-white/70 dark:border-slate-800/80 shadow-[0_8px_25px_-5px_rgba(15,23,42,0.05)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Logo & Workshop Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-akfa-500 via-akfa-600 to-indigo-700 flex items-center justify-center text-white shadow-clay-btn-primary border border-akfa-400/50 select-none flex-shrink-0">
              <span className="font-black tracking-widest text-[11px] sm:text-xs drop-shadow-md">AKFA</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-lg tracking-tight leading-tight">
                  {owner?.workshopName || t.app.title}
                </h1>
                {owner && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/60 backdrop-blur-md px-3 py-0.5 rounded-full border border-emerald-200/90 dark:border-emerald-800/60 shadow-clay-pill">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {owner.fullName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:block">
                {t.app.subtitle}
              </p>
            </div>
          </div>

          {/* Right Controls: Date indicator, Theme Switcher & Language Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-800/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/90 dark:border-slate-700 shadow-clay-pill">
              <Calendar className="w-4 h-4 text-akfa-600 dark:text-blue-400" />
              <span>{formatDate(selectedDate, 'medium')}</span>
            </div>

            <ThemeSwitcher compact />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};
