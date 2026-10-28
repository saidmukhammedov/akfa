import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'clay-pill';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', fullWidth = false, className = '', disabled, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs font-semibold rounded-xl',
      md: 'px-4 py-2.5 text-sm font-semibold rounded-2xl',
      lg: 'px-5 py-3 text-base font-bold rounded-2xl',
    };

    const variantClasses = {
      primary:
        'bg-gradient-to-b from-akfa-500 to-akfa-600 text-white shadow-clay-btn-primary hover:from-akfa-400 hover:to-akfa-600 border border-akfa-400/40 active:translate-y-0.5 active:shadow-clay-pressed',
      secondary:
        'bg-white/80 backdrop-blur-md text-slate-800 border border-white/90 shadow-clay-card hover:bg-white/95 active:translate-y-0.5 active:shadow-clay-pressed',
      danger:
        'bg-gradient-to-b from-absent-500 to-absent-600 text-white shadow-clay-btn-danger hover:from-absent-400 hover:to-absent-600 border border-absent-400/40 active:translate-y-0.5 active:shadow-clay-pressed',
      ghost:
        'bg-transparent text-slate-600 hover:bg-white/50 hover:text-slate-900 border border-transparent hover:border-white/60 active:scale-95',
      'clay-pill':
        'bg-white/85 backdrop-blur-md text-slate-800 border border-white/90 rounded-full shadow-clay-pill hover:bg-white active:translate-y-0.5 active:shadow-clay-pressed',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 select-none transition-all duration-150 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${
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
