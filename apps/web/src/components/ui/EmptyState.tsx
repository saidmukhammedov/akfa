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
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white/50 backdrop-blur-xl rounded-3xl border border-dashed border-slate-300/80 shadow-clay-sm">
      <div className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 shadow-clay-card flex items-center justify-center text-slate-400 mb-3.5">
        <Icon className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h4 className="text-sm font-bold text-workshop-text">{title}</h4>
      {description && <p className="text-xs text-workshop-muted max-w-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
