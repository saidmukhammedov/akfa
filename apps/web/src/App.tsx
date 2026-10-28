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
import { Loader2 } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-clay-card flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-akfa-600" />
          </div>
          <span className="text-xs font-bold text-slate-600 tracking-wide">Yuklanmoqda...</span>
        </div>
      </div>
    );
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
