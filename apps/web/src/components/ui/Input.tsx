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
          <label htmlFor={inputId} className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-4 py-3 bg-white/60 dark:bg-slate-800/80 backdrop-blur-xl border rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-akfa-500/20 focus:border-akfa-500 focus:bg-white/95 dark:focus:bg-slate-800 transition-all shadow-[inset_0_2px_4px_rgba(15,23,42,0.06),_0_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] ${
            error
              ? 'border-absent-400 bg-absent-50/50 dark:bg-rose-950/40 focus:ring-absent-500/25'
              : 'border-white/85 dark:border-slate-700 focus:ring-akfa-500/20'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-absent-600 dark:text-rose-400 mt-1.5 font-bold">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
