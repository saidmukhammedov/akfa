import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Mic, Sparkles } from 'lucide-react';

interface VoiceCommandButtonProps {
  onClick: () => void;
  variant?: 'header' | 'floating' | 'inline';
  className?: string;
}

export const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({
  onClick,
  variant = 'header',
  className = '',
}) => {
  const { t } = useLanguage();

  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={onClick}
        title={t.voice?.title || 'Ovozli buyruqlar'}
        aria-label={t.voice?.title || 'Ovozli buyruqlar'}
        className={`fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-2 p-3.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-akfa-600 via-indigo-600 to-violet-600 text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(79,70,229,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 border border-white/30 cursor-pointer ${className}`}
      >
        <span className="relative flex items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 opacity-60"></span>
          <Mic className="relative w-5 h-5 stroke-[2.2] text-white" />
        </span>
        <span className="hidden sm:inline-block font-extrabold text-xs tracking-tight text-white/95">
          {t.voice?.title || 'Ovozli buyruq'}
        </span>
        <Sparkles className="w-3.5 h-3.5 text-amber-300 hidden sm:inline-block animate-pulse" />
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`clay-interactive flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-akfa-50 via-indigo-50 to-violet-50 dark:from-slate-800 dark:via-indigo-950/40 dark:to-violet-950/40 text-akfa-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200/80 dark:border-indigo-800/60 shadow-clay-pill hover:scale-102 active:scale-95 transition-all cursor-pointer ${className}`}
      >
        <Mic className="w-4 h-4 text-akfa-600 dark:text-indigo-400 stroke-[2.2]" />
        <span>{t.voice?.title || 'Ovozli buyruq'}</span>
      </button>
    );
  }

  // Header variant
  return (
    <button
      type="button"
      onClick={onClick}
      title={t.voice?.title || 'Ovozli buyruqlar'}
      aria-label={t.voice?.title || 'Ovozli buyruqlar'}
      className={`clay-interactive flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-akfa-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/50 text-akfa-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200/80 dark:border-indigo-800/60 shadow-clay-pill hover:scale-102 active:scale-95 transition-all cursor-pointer ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <Mic className="w-4 h-4 text-akfa-600 dark:text-indigo-400 stroke-[2.2]" />
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
      </div>
      <span className="hidden md:inline font-bold text-xs">
        {t.voice?.title || 'Ovozli buyruq'}
      </span>
    </button>
  );
};
