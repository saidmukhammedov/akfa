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
    <div className="inline-flex items-center p-1.5 glass-slot rounded-full select-none">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!isPresent) onChange('PRESENT');
        }}
        className={`clay-interactive flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-black transition-all duration-150 cursor-pointer ${
          isPresent
            ? 'bg-gradient-to-b from-present-400 via-present-500 to-present-600 text-white shadow-clay-btn-success border border-present-300/60'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-bold'
        }`}
      >
        <Check className={`w-4 h-4 ${isPresent ? 'stroke-[3] drop-shadow-sm' : 'stroke-2'}`} />
        <span>{t.davomat.present}</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (isPresent) onChange('ABSENT');
        }}
        className={`clay-interactive flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-black transition-all duration-150 cursor-pointer ${
          !isPresent
            ? 'bg-gradient-to-b from-absent-400 via-absent-500 to-absent-600 text-white shadow-clay-btn-danger border border-absent-300/60'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-bold'
        }`}
      >
        <X className={`w-4 h-4 ${!isPresent ? 'stroke-[3] drop-shadow-sm' : 'stroke-2'}`} />
        <span>{t.davomat.absent}</span>
      </button>
    </div>
  );
};
