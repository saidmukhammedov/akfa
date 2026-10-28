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
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Workshop Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-akfa-500 via-akfa-600 to-akfa-700 flex items-center justify-center text-white shadow-clay-btn-primary border border-akfa-400/40 select-none">
              <span className="font-extrabold tracking-wider text-xs drop-shadow-sm">AKFA</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-workshop-text text-base sm:text-lg leading-tight">
                  {owner?.workshopName || t.app.title}
                </h1>
                {owner && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-emerald-200/80 shadow-clay-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {owner.fullName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-workshop-muted hidden md:block">
                {t.app.subtitle}
              </p>
            </div>
          </div>

          {/* Right Controls: Date indicator & Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/80 shadow-clay-sm">
              <Calendar className="w-3.5 h-3.5 text-akfa-600" />
              <span>{formatDate(selectedDate, 'medium')}</span>
            </div>

            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};
