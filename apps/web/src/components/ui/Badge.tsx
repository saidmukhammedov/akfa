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
    primary: 'bg-gradient-to-b from-blue-50 to-blue-100/90 text-akfa-800 border-blue-200/90',
    success: 'bg-gradient-to-b from-emerald-50 to-emerald-100/90 text-emerald-900 border-emerald-200/90',
    danger: 'bg-gradient-to-b from-rose-50 to-rose-100/90 text-rose-900 border-rose-200/90',
    warning: 'bg-gradient-to-b from-amber-50 to-amber-100/90 text-amber-900 border-amber-200/90',
    neutral: 'bg-gradient-to-b from-white to-slate-100/90 text-slate-700 border-slate-200/90',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-3 py-0.5',
    md: 'text-xs px-3.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-extrabold rounded-full border shadow-clay-pill backdrop-blur-md ${variantStyles[computedVariant]} ${sizeStyles[size]}`}
    >
      {text}
    </span>
  );
};
