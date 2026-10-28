import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface ThemeSwitcherProps {
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ compact = false }) => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const options: Array<{ mode: ThemeMode; label: string; icon: React.ReactNode }> = [
    {
      mode: 'light',
      label: t.sozlamalar.themeLight,
      icon: <Sun className="w-3.5 h-3.5 stroke-[2.2]" />,
    },
    {
      mode: 'system',
      label: t.sozlamalar.themeSystem,
      icon: <Laptop className="w-3.5 h-3.5 stroke-[2.2]" />,
    },
    {
      mode: 'dark',
      label: t.sozlamalar.themeDark,
      icon: <Moon className="w-3.5 h-3.5 stroke-[2.2]" />,
    },
  ];

  if (compact) {
    // Single-button toggle that cycles or opens
    return (
      <div className="flex items-center p-1 rounded-2xl glass-slot">
        {options.map((opt) => {
          const isActive = theme === opt.mode;
          return (
            <button
              key={opt.mode}
              onClick={() => setTheme(opt.mode)}
              title={opt.label}
              className={`p-1.5 rounded-xl transition-all clay-interactive ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-akfa-600 dark:text-blue-400 shadow-clay-card'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {opt.icon}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center p-1.5 rounded-2xl glass-slot w-full sm:w-auto">
      {options.map((opt) => {
        const isActive = theme === opt.mode;
        return (
          <button
            key={opt.mode}
            onClick={() => setTheme(opt.mode)}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all clay-interactive ${
              isActive
                ? 'bg-white dark:bg-slate-800 text-akfa-700 dark:text-blue-300 shadow-clay-card border border-white/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
