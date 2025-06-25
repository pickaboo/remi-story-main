import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // Added .tsx extension
import { UserProvider, SphereProvider, ModalProvider } from './context';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <UserProvider>
      <SphereProvider>
        <ModalProvider>
          <App />
        </ModalProvider>
      </SphereProvider>
    </UserProvider>
  </React.StrictMode>
);