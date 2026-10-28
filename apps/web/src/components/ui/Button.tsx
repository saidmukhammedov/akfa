import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'clay-pill';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', fullWidth = false, className = '', disabled, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs font-medium rounded-lg',
      md: 'px-4 py-2 text-sm font-semibold rounded-xl',
      lg: 'px-5 py-2.5 text-base font-semibold rounded-2xl',
    };

    const variantClasses = {
      primary:
        'bg-akfa-600 text-white shadow-clay-btn hover:bg-akfa-700 border border-akfa-500/30 active:shadow-clay-pressed',
      secondary:
        'bg-white text-workshop-text border border-workshop-border shadow-clay-btn hover:bg-slate-50 active:shadow-clay-pressed',
      danger:
        'bg-absent-600 text-white shadow-clay-btn hover:bg-absent-700 border border-absent-500/30 active:shadow-clay-pressed',
      ghost:
        'bg-transparent text-workshop-subtext hover:bg-slate-100 hover:text-workshop-text',
      'clay-pill':
        'bg-white text-workshop-text border border-workshop-border rounded-clay-pill shadow-clay-pill hover:bg-slate-50',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 select-none transition-all duration-100 active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none ${
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
