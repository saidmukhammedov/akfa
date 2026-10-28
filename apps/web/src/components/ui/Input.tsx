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
          <label htmlFor={inputId} className="block text-xs font-semibold text-workshop-text mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-workshop-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-akfa-500/20 focus:border-akfa-600 transition-all shadow-sm ${
            error ? 'border-absent-500 bg-absent-50/20' : 'border-workshop-border'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-absent-600 mt-1 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-workshop-muted mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
