import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useSphereManagement } from '../hooks/useSphereManagement';
import { useModalState } from '../hooks/useModalState';
import { useAuth } from '../hooks/useAuth';
import { User, Sphere } from '../types';

interface AppContextType {
  // App State
  currentView: any;
  viewParams: any;
  isAuthenticated: boolean | null;
  currentUser: User | null;
  isSidebarExpanded: boolean;
  globalFeedback: { message: string; type: 'success' | 'error' } | null;
  setCurrentView: (view: any) => void;
  setViewParams: (params: any) => void;
  setIsAuthenticated: (auth: boolean | null) => void;
  setCurrentUser: (user: User | null) => void;
  setGlobalFeedback: (feedback: { message: string; type: 'success' | 'error' } | null) => void;
  handleNavigate: (viewOrPath: any, params?: any) => void;
  toggleSidebar: () => void;
  showGlobalFeedback: (message: string, type: 'success' | 'error') => void;

  // Sphere Management
  allSpheres: Sphere[];
  activeSphere: Sphere | null;
  userSpheres: Sphere[];
  fetchUserAndSphereData: (user: User) => Promise<Sphere | null>;
  handleSwitchSphere: (sphereId: string, user: User) => Promise<boolean>;
  handleCreateSphere: (name: string, gradientColors: [string, string], user: User) => Promise<{ success: boolean; sphere?: Sphere; updatedUser?: User; error?: string }>;
  handleSaveSphereBackground: (sphereId: string, backgroundUrl: string) => Promise<void>;
  handleInviteUserToSphere: (email: string, sphereId: string, message?: string) => Promise<{ success: boolean; message: string }>;
  handleRemoveUserFromSphere: (userIdToRemove: string, sphereId: string) => Promise<boolean>;
  setAllSpheres: (spheres: Sphere[]) => void;
  setActiveSphere: (sphere: Sphere | null) => void;
  setUserSpheres: (spheres: Sphere[]) => void;

  // Modal State
  isCreateSphereModalOpen: boolean;
  isInviteModalOpen: boolean;
  sphereToInviteTo: Sphere | null;
  isLookAndFeelModalOpen: boolean;
  isManageSphereModalOpen: boolean;
  isImageBankSettingsModalOpen: boolean;
  allUsersForManageModal: User[];
  handleOpenCreateSphereModal: () => void;
  handleCloseCreateSphereModal: () => void;
  handleOpenInviteModal: (sphere: Sphere) => void;
  handleCloseInviteModal: () => void;
  handleOpenLookAndFeelModal: () => void;
  handleCloseLookAndFeelModal: () => void;
  handleOpenManageSphereModal: () => void;
  handleCloseManageSphereModal: () => void;
  handleOpenImageBankSettingsModal: () => void;
  handleCloseImageBankSettingsModal: () => void;
  setAllUsersForManageModal: (users: User[]) => void;

  // Auth
  handleLoginSuccess: (user: User, isNewUserViaOAuthOrEmailFlow?: boolean) => Promise<User>;
  handleProfileComplete: (updatedUser: User) => Promise<User>;
  handleLogout: () => Promise<boolean>;
  handleAcceptSphereInvitation: (invitationId: string, currentUser: User) => Promise<boolean>;
  handleDeclineSphereInvitation: (invitationId: string, currentUserEmail?: string) => Promise<boolean>;
  handleSaveThemePreference: (theme: User['themePreference'], userId: string) => Promise<boolean>;
  handleSaveShowImageMetadataPreference: (show: boolean, userId: string) => Promise<boolean>;
  fetchAllUsers: () => Promise<User[]>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const appState = useAppState();
  const sphereManagement = useSphereManagement();
  const modalState = useModalState();
  const auth = useAuth();

  const contextValue: AppContextType = {
    // App State
    ...appState,
    
    // Sphere Management
    ...sphereManagement,
    
    // Modal State
    ...modalState,
    
    // Auth
    ...auth,
  };

  // Always load spheres when currentUser changes and is not null
  useEffect(() => {
    if (appState.currentUser) {
      sphereManagement.fetchUserAndSphereData(appState.currentUser);
    }
  }, [appState.currentUser]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}; 