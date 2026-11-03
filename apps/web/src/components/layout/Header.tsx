import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAppState } from '../../context/AppStateContext';
import { useAuth } from '../../context/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';
import { ShieldCheck, Calendar, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const { t, formatDate } = useLanguage();
  const { selectedDate } = useAppState();
  const { owner, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-b from-white/95 via-white/80 to-transparent dark:from-slate-900/98 dark:via-slate-900/80 dark:to-transparent backdrop-blur-2xl border-none shadow-none transform-gpu transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[82px] sm:min-h-[92px] py-3.5 sm:py-4.5">
          {/* Logo & Workshop Name */}
          <div className="flex items-center gap-3.5">
            {/* Enhanced Modern AKFA Architectural Emblem */}
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-akfa-600 to-indigo-700 p-0.5 shadow-[0_8px_20px_-4px_rgba(37,99,235,0.45)] border border-white/40 dark:border-blue-400/30 flex items-center justify-center select-none flex-shrink-0 group">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/25 via-transparent to-transparent pointer-events-none" />
              <div className="flex flex-col items-center justify-center">
                <svg className="w-5 h-5 text-white drop-shadow-sm mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" className="stroke-white" />
                  <path d="M12 3v18" className="stroke-white/90" />
                  <path d="M3 12h18" className="stroke-white/90" />
                  <circle cx="12" cy="12" r="1.5" className="fill-sky-300 stroke-none" />
                </svg>
                <span className="font-black text-[9px] sm:text-[9.5px] tracking-[0.18em] text-white/95 leading-none pl-0.5">AKFA</span>
              </div>
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
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:block mt-0.5">
                {t.app.subtitle}
              </p>
            </div>
          </div>

          {/* Right Controls: Date indicator, Theme Switcher, Language Switcher & Logout */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-800/80 backdrop-blur-md h-10 sm:h-11 px-3.5 rounded-2xl border border-white/90 dark:border-slate-700 shadow-clay-pill">
              <Calendar className="w-4 h-4 text-akfa-600 dark:text-blue-400" />
              <span>{formatDate(selectedDate, 'medium')}</span>
            </div>

            <ThemeSwitcher />
            <LanguageSwitcher />

            {owner && (
              <button
                type="button"
                onClick={logout}
                title={t.auth.logoutButton || 'Chiqish'}
                aria-label="Chiqish"
                className="clay-interactive w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 rounded-2xl transition-all cursor-pointer border border-white/60 dark:border-slate-700/60 glass-slot shadow-clay-card"
              >
                <LogOut className="w-4.5 h-4.5 stroke-[2.2]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
