import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAppState } from '../../context/AppStateContext';
import { useAuth } from '../../context/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ShieldCheck, Calendar } from 'lucide-react';

export const Header: React.FC = () => {
  const { t, formatDate } = useLanguage();
  const { selectedDate } = useAppState();
  const { owner } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/65 backdrop-blur-2xl border-b border-white/70 shadow-[0_8px_25px_-5px_rgba(15,23,42,0.05)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Logo & Workshop Name */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-akfa-500 via-akfa-600 to-indigo-700 flex items-center justify-center text-white shadow-clay-btn-primary border border-akfa-400/50 select-none flex-shrink-0">
              <span className="font-black tracking-widest text-xs drop-shadow-md">AKFA</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight leading-tight">
                  {owner?.workshopName || t.app.title}
                </h1>
                {owner && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50/90 backdrop-blur-md px-3 py-0.5 rounded-full border border-emerald-200/90 shadow-clay-pill">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {owner.fullName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium hidden md:block">
                {t.app.subtitle}
              </p>
            </div>
          </div>

          {/* Right Controls: Date indicator & Language Switcher */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-700 bg-white/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/90 shadow-clay-pill">
              <Calendar className="w-4 h-4 text-akfa-600" />
              <span>{formatDate(selectedDate, 'medium')}</span>
            </div>

            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};
