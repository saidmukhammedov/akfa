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
    <div className="inline-flex items-center p-1 glass-slot rounded-full select-none">
      <div className="px-1.5 text-slate-400">
        <Languages className="w-3.5 h-3.5" />
      </div>
      <button
        type="button"
        onClick={() => handleLanguageChange('uz')}
        className={`px-3 py-1 text-xs font-black rounded-full transition-all duration-200 active:scale-95 cursor-pointer ${
          lang === 'uz'
            ? 'bg-gradient-to-b from-akfa-500 to-akfa-600 text-white shadow-clay-btn-primary border border-akfa-400/50'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        UZ
      </button>
      <button
        type="button"
        onClick={() => handleLanguageChange('ru')}
        className={`px-3 py-1 text-xs font-black rounded-full transition-all duration-200 active:scale-95 cursor-pointer ${
          lang === 'ru'
            ? 'bg-gradient-to-b from-akfa-500 to-akfa-600 text-white shadow-clay-btn-primary border border-akfa-400/50'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        RU
      </button>
    </div>
  );
};
