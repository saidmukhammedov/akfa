import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  padding = 'md',
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4 sm:p-5',
    md: 'p-5 sm:p-7',
    lg: 'p-7 sm:p-9',
  };

  return (
    <div className={`glass-clay-card ${paddingClasses[padding]} ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 mb-5 pb-3.5 border-b border-white/60">
          <div>
            {title && <h3 className="font-extrabold text-slate-900 text-base sm:text-xl tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
