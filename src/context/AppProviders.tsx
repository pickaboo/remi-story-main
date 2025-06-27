import React from 'react';
import { ModalProvider } from './ModalContext';
import { NavigationProvider } from './NavigationContext';
import { FeedbackProvider } from './FeedbackContext';
import { AppStateProvider } from './AppStateContext';
import { UserProvider } from './UserContext';
import { SphereProvider } from './SphereContext';
// Add other providers as needed

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <NavigationProvider>
      <FeedbackProvider>
        <AppStateProvider>
          <UserProvider>
            <SphereProvider>
              <ModalProvider>
                {children}
              </ModalProvider>
            </SphereProvider>
          </UserProvider>
        </AppStateProvider>
      </FeedbackProvider>
    </NavigationProvider>
  );
}; 