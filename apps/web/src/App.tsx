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
import { AuthView } from './components/views/AuthView';

export const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

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
