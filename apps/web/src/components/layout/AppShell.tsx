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
    <div className="relative min-h-screen flex flex-col text-workshop-text pb-24 sm:pb-16 overflow-x-hidden">
      {/* Dynamic ambient glowing light orbs behind the frosted glass surfaces */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full bg-blue-400/25 blur-[120px]" />
        <div className="absolute top-1/4 -right-20 w-[450px] h-[450px] rounded-full bg-indigo-400/20 blur-[130px]" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full bg-emerald-300/20 blur-[140px]" />
        <div className="absolute -bottom-24 left-1/4 w-[550px] h-[550px] rounded-full bg-sky-300/25 blur-[130px]" />
        <div className="absolute bottom-1/4 -right-20 w-[420px] h-[420px] rounded-full bg-purple-300/20 blur-[130px]" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <Header />
        <Navigation activeTab={activeTab} onTabChange={onTabChange} />

        {/* Error Notification Banner with frosted glass */}
        {error && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/85 backdrop-blur-xl border border-rose-200/80 text-rose-900 text-xs sm:text-sm font-semibold shadow-clay-card animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={clearError}
                className="p-1 hover:bg-rose-100/70 rounded-xl text-rose-600 transition-colors"
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
