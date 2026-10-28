import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Navigation, TabId } from './Navigation';
import { useAppState } from '../../context/AppStateContext';
import { AlertCircle, X } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const AppShell: React.FC<AppShellProps> = ({ children, activeTab, onTabChange }) => {
  const { error, clearError } = useAppState();

  return (
    <div className="relative min-h-screen flex flex-col text-workshop-text dark:text-slate-100 pb-32 sm:pb-16 transition-colors">
      {/* Dynamic ambient glowing light orbs behind the frosted glass surfaces (Isolated GPU compositor layer) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transform-gpu">
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full bg-blue-400/25 dark:bg-blue-600/15 blur-[100px]" />
        <div className="absolute top-1/4 -right-20 w-[450px] h-[450px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/15 blur-[100px]" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full bg-emerald-300/20 dark:bg-emerald-600/10 blur-[100px]" />
        <div className="absolute -bottom-24 left-1/4 w-[550px] h-[550px] rounded-full bg-sky-300/25 dark:bg-sky-600/15 blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-[420px] h-[420px] rounded-full bg-purple-300/20 dark:bg-purple-600/15 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <Header />
        <Navigation activeTab={activeTab} onTabChange={onTabChange} />

        {/* Error Notification Banner with frosted glass */}
        {error && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/85 dark:bg-rose-950/80 backdrop-blur-xl border border-rose-200/80 dark:border-rose-800/80 text-rose-900 dark:text-rose-200 text-xs sm:text-sm font-semibold shadow-clay-card animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={clearError}
                className="p-1 hover:bg-rose-100/70 dark:hover:bg-rose-900/60 rounded-xl text-rose-600 dark:text-rose-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
          {children}
        </main>
      </div>
    </div>
  );
};
