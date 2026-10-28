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

  const isNonePadding = padding === 'none';

  return (
    <div className={`glass-clay-card ${paddingClasses[padding]} ${className}`}>
      {(title || action) && (
        <div
          className={`flex items-start justify-between gap-4 border-b border-white/60 dark:border-slate-700/80 ${
            isNonePadding ? 'px-4 sm:px-6 py-4 sm:py-5 mb-0' : 'mb-5 pb-3.5'
          }`}
        >
          <div className="min-w-0">
            {title && (
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-xl tracking-tight leading-snug">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-normal">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
