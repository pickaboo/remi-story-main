import React from 'react';
import { AppProviders } from './context/AppProviders';
import { AppRouter } from './AppRouter';
import { ModalManager } from './ModalManager';

const App: React.FC = () => (
  <AppProviders>
    <AppRouter />
    <ModalManager />
  </AppProviders>
);

export default App;
