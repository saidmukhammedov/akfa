import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface ThemeSwitcherProps {
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const isDark = theme === 'dark';
  const label = isDark ? (t.sozlamalar?.themeLight || 'Yorug‘ rejim') : (t.sozlamalar?.themeDark || 'Qorong‘i rejim');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className="clay-interactive w-10 h-10 sm:w-11 sm:h-11 rounded-2xl glass-slot text-slate-700 dark:text-amber-400 hover:text-akfa-600 dark:hover:text-amber-300 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all cursor-pointer shadow-clay-card flex items-center justify-center border border-white/60 dark:border-slate-700/60"
    >
      {isDark ? (
        <Sun className="w-5 h-5 stroke-[2.2] text-amber-400" />
      ) : (
        <Moon className="w-5 h-5 stroke-[2.2] text-slate-700" />
      )}
    </button>
  );
};
