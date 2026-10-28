import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Navigation, TabId } from './Navigation';
import { PROTOTYPE_SEED_DATA } from '../../context/AppStateContext';
import { Info } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="min-h-screen flex flex-col bg-workshop-bg text-workshop-text pb-20 sm:pb-12">
      <Header />
      <Navigation activeTab={activeTab} onTabChange={onTabChange} />

      {/* Development Prototype Banner: Clearly isolates sample data as requested in Phase 1 brief */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/80 border border-blue-200/60 text-blue-800 text-[11px]">
          <Info className="w-3.5 h-3.5 flex-shrink-0 text-blue-600" />
          <span className="font-medium">
            {PROTOTYPE_SEED_DATA.notice}
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
};
