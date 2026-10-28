import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Languages } from 'lucide-react';
import { Language } from '@akfa/shared';

export const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const { isAuthenticated, updateOwnerProfile } = useAuth();

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    if (isAuthenticated) {
      updateOwnerProfile({ language: newLang }).catch(() => {
        // Silently keep local language if backend call encounters error
      });
    }
  };

  return (
    <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-clay-pill border border-slate-200/90 shadow-clay-pressed select-none">
      <div className="px-1.5 text-slate-400">
        <Languages className="w-3.5 h-3.5" />
      </div>
      <button
        type="button"
        onClick={() => handleLanguageChange('uz')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-clay-pill transition-all duration-150 active:scale-95 ${
          lang === 'uz'
            ? 'bg-akfa-600 text-white shadow-clay-btn'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        UZ
      </button>
      <button
        type="button"
        onClick={() => handleLanguageChange('ru')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-clay-pill transition-all duration-150 active:scale-95 ${
          lang === 'ru'
            ? 'bg-akfa-600 text-white shadow-clay-btn'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        RU
      </button>
    </div>
  );
};
