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
    primary: 'bg-akfa-50/85 text-akfa-700 border-akfa-200/80',
    success: 'bg-present-50/85 text-present-700 border-present-200/80',
    danger: 'bg-absent-50/85 text-absent-700 border-absent-200/80',
    warning: 'bg-amber-50/85 text-amber-800 border-amber-200/80',
    neutral: 'bg-slate-100/85 text-slate-700 border-slate-200/80',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border shadow-clay-sm backdrop-blur-md ${variantStyles[computedVariant]} ${sizeStyles[size]}`}
    >
      {text}
    </span>
  );
};
