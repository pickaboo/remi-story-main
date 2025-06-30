import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './context/AppProviders';
import { AppRouter } from './AppRouter';
import './index.css';

function App() {
  return (
    <AppProviders>
      <BrowserRouter>
      <AppRouter />
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
