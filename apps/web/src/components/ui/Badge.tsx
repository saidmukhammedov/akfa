import React from 'react';
import { WorkerRole, WorkerStatus } from '@akfa/shared';
import { useLanguage } from '../../context/LanguageContext';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
  role?: WorkerRole;
  status?: WorkerStatus;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  role,
  status,
}) => {
  const { t } = useLanguage();

  let text = children;
  let computedVariant = variant;

  if (role) {
    text = t.roles[role] || role;
    if (role === 'usta') computedVariant = 'primary';
    else if (role === 'shogird') computedVariant = 'warning';
    else computedVariant = 'neutral';
  } else if (status) {
    if (status === 'ACTIVE') {
      text = t.sozlamalar.activeWorkersTab;
      computedVariant = 'success';
    } else {
      text = t.sozlamalar.archivedWorkersTab;
      computedVariant = 'danger';
    }
  }

  const variantStyles = {
    primary:
      'bg-gradient-to-b from-blue-50 to-blue-100/90 dark:from-blue-950/70 dark:to-blue-900/50 text-akfa-800 dark:text-blue-300 border-blue-200/90 dark:border-blue-800/60',
    success:
      'bg-gradient-to-b from-emerald-50 to-emerald-100/90 dark:from-emerald-950/70 dark:to-emerald-900/50 text-emerald-900 dark:text-emerald-300 border-emerald-200/90 dark:border-emerald-800/60',
    danger:
      'bg-gradient-to-b from-rose-50 to-rose-100/90 dark:from-rose-950/70 dark:to-rose-900/50 text-rose-900 dark:text-rose-300 border-rose-200/90 dark:border-rose-800/60',
    warning:
      'bg-gradient-to-b from-amber-50 to-amber-100/90 dark:from-amber-950/70 dark:to-amber-900/50 text-amber-900 dark:text-amber-300 border-amber-200/90 dark:border-amber-800/60',
    neutral:
      'bg-gradient-to-b from-white to-slate-100/90 dark:from-slate-800 dark:to-slate-850 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-3 py-0.5',
    md: 'text-xs px-3.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-extrabold rounded-full border shadow-clay-pill backdrop-blur-md whitespace-nowrap shrink-0 ${variantStyles[computedVariant]} ${sizeStyles[size]}`}
    >
      {text}
    </span>
  );
};
