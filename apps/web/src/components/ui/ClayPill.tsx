import React from 'react';
import { Check, X } from 'lucide-react';
import { AttendanceStatus } from '@akfa/shared';
import { useLanguage } from '../../context/LanguageContext';

interface ClayAttendanceToggleProps {
  status: AttendanceStatus;
  onChange: (newStatus: AttendanceStatus) => void;
  disabled?: boolean;
}

export const ClayAttendanceToggle: React.FC<ClayAttendanceToggleProps> = ({
  status,
  onChange,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const isPresent = status === 'PRESENT';

  return (
    <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-clay-pill border border-slate-200/80 shadow-clay-pressed select-none">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('PRESENT')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-clay-pill text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 ${
          isPresent
            ? 'bg-present-600 text-white shadow-clay-btn border border-present-500/40'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
      >
        <Check className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isPresent ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span>{t.davomat.present}</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('ABSENT')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-clay-pill text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 ${
          !isPresent
            ? 'bg-absent-600 text-white shadow-clay-btn border border-absent-500/40'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
      >
        <X className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${!isPresent ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span>{t.davomat.absent}</span>
      </button>
    </div>
  );
};
