import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppStateProvider } from './context/AppStateContext';
import { ThemeProvider } from './context/ThemeContext';
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
      <div className="min-h-screen bg-[#eaf1f9] flex items-center justify-center relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-400/25 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-400/25 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-[28px] bg-white/75 backdrop-blur-3xl border-2 border-white/90 shadow-clay-card flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-akfa-600 stroke-[2.5]" />
          </div>
          <span className="text-xs font-black text-slate-700 tracking-wider uppercase">Yuklanmoqda...</span>
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
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppStateProvider>
            <AppContent />
          </AppStateProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
