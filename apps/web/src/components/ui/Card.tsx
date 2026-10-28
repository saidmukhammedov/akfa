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
    sm: 'p-3.5 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl sm:rounded-3xl shadow-clay-card transition-all duration-200 ${paddingClasses[padding]} ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-200/50">
          <div>
            {title && <h3 className="font-bold text-workshop-text text-base sm:text-lg tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-workshop-muted mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
