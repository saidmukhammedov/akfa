import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Globe } from 'lucide-react';
import { Language } from '@akfa/shared';

export const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const { isAuthenticated, updateOwnerProfile } = useAuth();

  const handleLanguageToggle = () => {
    const nextLang: Language = lang === 'uz' ? 'ru' : 'uz';
    setLang(nextLang);
    if (isAuthenticated) {
      updateOwnerProfile({ language: nextLang }).catch(() => {
        // Silently keep local language if backend call encounters error
      });
    }
  };

  const tooltipLabel = lang === 'uz' ? "Русский языкга ўтиш" : "O'zbek tiliga o'tish";

  return (
    <button
      type="button"
      onClick={handleLanguageToggle}
      title={tooltipLabel}
      aria-label={tooltipLabel}
      className="clay-interactive h-10 px-3 sm:h-11 sm:px-3.5 rounded-2xl glass-slot text-slate-700 dark:text-slate-200 hover:text-akfa-600 dark:hover:text-blue-400 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all cursor-pointer shadow-clay-card flex items-center justify-center gap-1.5 border border-white/60 dark:border-slate-700/60"
    >
      <Globe className="w-4 h-4 stroke-[2.2] text-slate-500 dark:text-slate-400" />
      <span className="font-black text-xs tracking-wider uppercase">
        {lang}
      </span>
    </button>
  );
};
