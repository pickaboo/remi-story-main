import React from 'react';
import { ModalProvider } from './ModalContext';
// import { UserProvider } from './UserContext';
// import { SphereProvider } from './SphereContext';
// Add other providers as needed

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ModalProvider>
      {/* <UserProvider>
        <SphereProvider> */}
          {children}
        {/* </SphereProvider>
      </UserProvider> */}
    </ModalProvider>
  );
}; 