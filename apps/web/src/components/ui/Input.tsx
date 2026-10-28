import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-4 py-3 bg-white/60 backdrop-blur-xl border rounded-2xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-akfa-500/20 focus:border-akfa-500 focus:bg-white/95 transition-all shadow-[inset_0_2px_4px_rgba(15,23,42,0.06),_0_1px_2px_rgba(255,255,255,0.8)] ${
            error
              ? 'border-absent-400 bg-absent-50/50 focus:ring-absent-500/25'
              : 'border-white/85 focus:ring-akfa-500/20'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-absent-600 mt-1.5 font-bold">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-500 mt-1.5 font-medium">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
