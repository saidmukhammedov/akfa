import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-white/45 backdrop-blur-2xl rounded-[32px] border-2 border-dashed border-white/80 shadow-clay-card">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-white to-slate-100 border border-white/95 shadow-clay-btn flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-8 h-8 stroke-[1.8]" />
      </div>
      <h4 className="text-base font-extrabold text-slate-900">{title}</h4>
      {description && <p className="text-xs text-slate-500 max-w-sm mt-1.5 font-medium">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
