import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppStateProvider } from './context/AppStateContext';
import { AppShell } from './components/layout/AppShell';
import { TabId } from './components/layout/Navigation';
import { DashboardView } from './components/views/DashboardView';
import { DavomatView } from './components/views/DavomatView';
import { MoliyaView } from './components/views/MoliyaView';
import { SozlamalarView } from './components/views/SozlamalarView';
import { AuthView } from './components/views/AuthView';
import { Loader2 } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-workshop-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-clay-card flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-akfa-600" />
          </div>
          <span className="text-xs font-semibold text-workshop-muted">Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView />;
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
      {activeTab === 'davomat' && <DavomatView />}
      {activeTab === 'moliya' && <MoliyaView />}
      {activeTab === 'sozlamalar' && <SozlamalarView />}
    </AppShell>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppStateProvider>
          <AppContent />
        </AppStateProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
