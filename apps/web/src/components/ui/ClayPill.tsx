import React from 'react';
import { Check, X, Clock3 } from 'lucide-react';
import { AttendanceStatus } from '@akfa/shared';
import { useLanguage } from '../../context/LanguageContext';

interface ClayAttendanceToggleProps {
  status: AttendanceStatus;
  isHalfDay?: boolean;
  onChange: (newStatus: AttendanceStatus, isHalfDay?: boolean) => void;
  onHalfDayToggle?: (newIsHalfDay: boolean) => void;
  disabled?: boolean;
}

export const ClayAttendanceToggle: React.FC<ClayAttendanceToggleProps> = ({
  status,
  isHalfDay = false,
  onChange,
  onHalfDayToggle,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const isPresent = status === 'PRESENT';

  const handleHalfDayClick = () => {
    if (disabled) return;
    if (!isPresent) {
      // If absent, clicking 0.5 kun automatically marks as PRESENT with half day
      onChange('PRESENT', true);
    } else if (onHalfDayToggle) {
      onHalfDayToggle(!isHalfDay);
    } else {
      onChange('PRESENT', !isHalfDay);
    }
  };

  return (
    <div className="inline-flex items-center gap-1 p-1 sm:p-1.5 glass-slot rounded-full select-none max-w-full overflow-x-auto">
      {/* Keldi Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!isPresent) {
            onChange('PRESENT', false);
          }
        }}
        className={`clay-interactive flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-black transition-all duration-150 cursor-pointer ${
          isPresent && !isHalfDay
            ? 'bg-gradient-to-b from-present-400 via-present-500 to-present-600 text-white shadow-clay-btn-success border border-present-300/60'
            : isPresent && isHalfDay
            ? 'bg-present-500/20 text-present-700 dark:text-present-300 border border-present-400/40 font-bold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40 font-bold'
        }`}
      >
        <Check className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isPresent && !isHalfDay ? 'stroke-[3] drop-shadow-sm' : 'stroke-2'}`} />
        <span>{t.davomat.present}</span>
      </button>

      {/* 0.5 kun (Half-day) Toggle Button */}
      <button
        type="button"
        disabled={disabled || !isPresent}
        onClick={handleHalfDayClick}
        title={!isPresent ? "0.5 kun faqat 'Keldi' statusida ishlaydi" : isHalfDay ? "To'liq kunga qaytarish" : "Yarim kun (0.5 stavka) belgilash"}
        className={`clay-interactive flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-black transition-all duration-150 ${
          !isPresent
            ? 'opacity-40 text-slate-400 dark:text-slate-600 cursor-not-allowed bg-transparent'
            : isHalfDay
            ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-white shadow-clay-btn border border-amber-300/80 ring-2 ring-amber-400/30 cursor-pointer animate-in zoom-in-95'
            : 'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:text-amber-600 hover:bg-white dark:hover:bg-slate-800 border border-white/70 dark:border-slate-700 cursor-pointer'
        }`}
      >
        <Clock3 className={`w-3.5 h-3.5 ${isHalfDay ? 'stroke-[2.8] drop-shadow-sm' : 'stroke-2'}`} />
        <span className="whitespace-nowrap">{t.davomat.halfDay || '0.5 kun'}</span>
      </button>

      {/* Kelmadi Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (isPresent) {
            onChange('ABSENT', false);
          }
        }}
        className={`clay-interactive flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-black transition-all duration-150 cursor-pointer ${
          !isPresent
            ? 'bg-gradient-to-b from-absent-400 via-absent-500 to-absent-600 text-white shadow-clay-btn-danger border border-absent-300/60'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40 font-bold'
        }`}
      >
        <X className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${!isPresent ? 'stroke-[3] drop-shadow-sm' : 'stroke-2'}`} />
        <span>{t.davomat.absent}</span>
      </button>
    </div>
  );
};
