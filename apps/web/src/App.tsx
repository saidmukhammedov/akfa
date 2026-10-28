import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AppStateProvider } from './context/AppStateContext';
import { AppShell } from './components/layout/AppShell';
import { TabId } from './components/layout/Navigation';
import { DashboardView } from './components/views/DashboardView';
import { DavomatView } from './components/views/DavomatView';
import { MoliyaView } from './components/views/MoliyaView';
import { SozlamalarView } from './components/views/SozlamalarView';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

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
      <AppStateProvider>
        <AppContent />
      </AppStateProvider>
    </LanguageProvider>
  );
}

export default App;
