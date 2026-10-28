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
    <div className="inline-flex items-center p-1 bg-slate-200/50 backdrop-blur-md rounded-full border border-white/70 shadow-inner select-none">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!isPresent) onChange('PRESENT');
        }}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-100 active:scale-95 cursor-pointer ${
          isPresent
            ? 'bg-gradient-to-b from-present-500 to-present-600 text-white shadow-clay-btn-success border border-present-400/50'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
        }`}
      >
        <Check className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isPresent ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span>{t.davomat.present}</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (isPresent) onChange('ABSENT');
        }}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-100 active:scale-95 cursor-pointer ${
          !isPresent
            ? 'bg-gradient-to-b from-absent-500 to-absent-600 text-white shadow-clay-btn-danger border border-absent-400/50'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
        }`}
      >
        <X className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${!isPresent ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span>{t.davomat.absent}</span>
      </button>
    </div>
  );
};
