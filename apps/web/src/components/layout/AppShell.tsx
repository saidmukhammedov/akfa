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
    <div className="min-h-screen flex flex-col bg-workshop-bg text-workshop-text pb-20 sm:pb-12">
      <Header />
      <Navigation activeTab={activeTab} onTabChange={onTabChange} />

      {/* Honest Error Notification Banner if an API mutation fails */}
      {error && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-absent-50 border border-absent-200 text-absent-800 text-xs sm:text-sm font-medium shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-absent-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="p-1 hover:bg-absent-100 rounded-lg text-absent-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
};
