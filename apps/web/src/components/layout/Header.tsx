import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAppState } from '../../context/AppStateContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ShieldCheck, Calendar } from 'lucide-react';

export const Header: React.FC = () => {
  const { t, formatDate } = useLanguage();
  const { owner, selectedDate } = useAppState();

  return (
    <header className="sticky top-0 z-40 bg-workshop-surface/90 backdrop-blur-md border-b border-workshop-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Workshop Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-akfa-600 to-akfa-800 flex items-center justify-center text-white shadow-clay-btn border border-akfa-500/30">
              <span className="font-extrabold tracking-wider text-xs">AKFA</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-workshop-text text-base sm:text-lg leading-tight">
                  {owner.workshopName || t.app.title}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {owner.fullName}
                </span>
              </div>
              <p className="text-[11px] text-workshop-muted hidden md:block">
                {t.app.subtitle}
              </p>
            </div>
          </div>

          {/* Right Controls: Date indicator & Language Switcher */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-workshop-muted bg-slate-100/80 px-3 py-1.5 rounded-clay-pill border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatDate(selectedDate, 'medium')}</span>
            </div>

            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};
