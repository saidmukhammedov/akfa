import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'clay-pill';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', fullWidth = false, className = '', disabled, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3.5 py-1.5 text-xs font-bold rounded-xl',
      md: 'px-5 py-2.5 text-sm font-bold rounded-2xl',
      lg: 'px-6 py-3.5 text-base font-extrabold rounded-2xl',
    };

    const variantClasses = {
      primary:
        'bg-gradient-to-b from-akfa-500 via-akfa-600 to-akfa-700 text-white shadow-clay-btn-primary hover:from-akfa-400 hover:to-akfa-600 border border-akfa-400/50',
      secondary:
        'bg-gradient-to-b from-white to-slate-100 dark:from-slate-800 dark:to-slate-850 text-slate-800 dark:text-slate-100 shadow-clay-btn hover:from-white hover:to-slate-50 dark:hover:from-slate-750 dark:hover:to-slate-800 border border-white/95 dark:border-slate-700',
      danger:
        'bg-gradient-to-b from-absent-500 via-absent-600 to-absent-700 text-white shadow-clay-btn-danger hover:from-absent-400 hover:to-absent-600 border border-absent-400/50',
      ghost:
        'bg-white/35 dark:bg-slate-800/40 backdrop-blur-md text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-white/60 dark:border-slate-700 shadow-sm',
      'clay-pill':
        'bg-gradient-to-b from-white to-slate-100 dark:from-slate-800 dark:to-slate-850 text-slate-800 dark:text-slate-100 border border-white/95 dark:border-slate-700 rounded-full shadow-clay-pill hover:bg-white dark:hover:bg-slate-750',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`clay-interactive inline-flex items-center justify-center gap-2 select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${
          sizeClasses[size]
        } ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
