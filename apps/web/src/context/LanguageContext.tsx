import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Language, TranslationType, getTranslation, formatCurrency as sharedFormatCurrency, formatDate as sharedFormatDate } from '@akfa/shared';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationType;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string | Date, style?: 'short' | 'medium' | 'full') => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('akfa_lang');
      return (saved === 'ru' || saved === 'uz') ? (saved as Language) : 'uz';
    } catch {
      return 'uz';
    }
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState((prev) => {
      if (prev === newLang) return prev;
      try {
        localStorage.setItem('akfa_lang', newLang);
      } catch {}
      document.documentElement.lang = newLang;
      return newLang;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = getTranslation(lang);

  const formatCurrency = useCallback((amount: number) => sharedFormatCurrency(amount, lang), [lang]);
  const formatDate = useCallback((date: string | Date, style: 'short' | 'medium' | 'full' = 'medium') =>
    sharedFormatDate(date, lang, style), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, formatCurrency, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
