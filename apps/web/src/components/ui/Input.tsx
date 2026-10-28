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
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-4 py-2.5 bg-white/70 backdrop-blur-md border rounded-2xl text-sm font-medium text-workshop-text placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-akfa-500/15 focus:border-akfa-500 focus:bg-white/95 transition-all shadow-inner ${
            error ? 'border-absent-400 bg-absent-50/40 focus:ring-absent-500/20' : 'border-white/90 focus:ring-akfa-500/20'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-absent-600 mt-1.5 font-semibold">{error}</p>}
        {helperText && !error && <p className="text-xs text-workshop-muted mt-1.5">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
