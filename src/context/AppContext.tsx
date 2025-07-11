import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useSphereManagement } from '../hooks/useSphereManagement';
import { useModalState } from '../hooks/useModalState';
import { useAuth } from '../hooks/useAuth';
import { 
  User, 
  Sphere, 
  ViewParams, 
  NavigationHandler, 
  LegacyFeedback,
  SphereCreationResult,
  InvitationResult
} from '../types';

interface AppContextType {
  // App State
  currentView: any;
  viewParams: ViewParams | null;
  isAuthenticated: boolean | null;
  currentUser: User | null;
  isSidebarExpanded: boolean;
  globalFeedback: LegacyFeedback | null;
  setCurrentView: (view: any) => void;
  setViewParams: (params: ViewParams | null) => void;
  setIsAuthenticated: (auth: boolean | null) => void;
  setCurrentUser: (user: User | null) => void;
  setGlobalFeedback: (feedback: LegacyFeedback | null) => void;
  handleNavigate: NavigationHandler;
  toggleSidebar: () => void;
  showGlobalFeedback: (message: string, type: 'success' | 'error') => void;
  themePreference: User['themePreference'];
  setThemePreference: (theme: User['themePreference']) => void;

  // Sphere Management
  allSpheres: Sphere[];
  activeSphere: Sphere | null;
  userSpheres: Sphere[];
  fetchUserAndSphereData: (user: User) => Promise<Sphere | null>;
  handleSwitchSphere: (sphereId: string, user: User) => Promise<boolean>;
  handleCreateSphere: (name: string, gradientColors: [string, string], user: User) => Promise<SphereCreationResult>;
  handleSaveSphereBackground: (sphereId: string, backgroundUrl: string) => Promise<void>;
  handleInviteUserToSphere: (email: string, sphereId: string, message?: string) => Promise<InvitationResult>;
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
  isProfileCompletionModalOpen: boolean;
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
  handleOpenProfileCompletionModal: () => void;
  handleCloseProfileCompletionModal: () => void;
  setAllUsersForManageModal: (users: User[]) => void;
  isBucketListModalOpen: boolean;
  handleOpenBucketListModal: () => void;
  handleCloseBucketListModal: () => void;

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
    themePreference: appState.themePreference,
    setThemePreference: appState.setThemePreference,
    
    // Sphere Management
    ...sphereManagement,
    
    // Modal State
    ...modalState,
    isBucketListModalOpen: modalState.isBucketListModalOpen,
    handleOpenBucketListModal: modalState.handleOpenBucketListModal,
    handleCloseBucketListModal: modalState.handleCloseBucketListModal,
    
    // Auth
    ...auth,
  };

  // Always load spheres when currentUser changes and is not null
  useEffect(() => {
    const loadSphereData = async () => {
      if (appState.currentUser) {
        console.log("[AppContext] Loading sphere data for user:", appState.currentUser.id);
        try {
          // --- NY LOGIK: Återuppta pending sfärskapande om e-post nu är verifierad ---
          if (appState.currentUser.emailVerified) {
            const pending = localStorage.getItem('pendingSphereCreation');
            if (pending) {
              try {
                const { userId, sphereName, gradientColors } = JSON.parse(pending);
                if (userId === appState.currentUser.id && appState.currentUser.sphereIds.length === 0) {
                  console.log('[AppContext] Attempting to resume pending sphere creation...');
                  const result = await sphereManagement.handleCreateSphere(sphereName, gradientColors, appState.currentUser);
                  if (result.success && result.sphere) {
                    appState.setCurrentUser({ ...appState.currentUser, sphereIds: [result.sphere.id] });
                    sphereManagement.setActiveSphere(result.sphere);
                    localStorage.removeItem('pendingSphereCreation');
                    sphereManagement.setUserSpheres([result.sphere]);
                    sphereManagement.setAllSpheres(prev => result.sphere ? [...prev, result.sphere] : prev);
                    contextValue.showGlobalFeedback?.('Din personliga sfär har nu skapats!', 'success');
                  } else {
                    console.error('[AppContext] Failed to resume pending sphere creation:', result.error);
                  }
                } else {
                  localStorage.removeItem('pendingSphereCreation');
                }
              } catch (e) {
                console.error('[AppContext] Error resuming pending sphere creation:', e);
                localStorage.removeItem('pendingSphereCreation');
              }
            }
          }
          // --- SLUT NY LOGIK ---
          const activeSphere = await sphereManagement.fetchUserAndSphereData(appState.currentUser);
          console.log("[AppContext] Sphere data loaded, activeSphere:", activeSphere?.name);
        } catch (error) {
          console.error("[AppContext] Failed to load sphere data:", error);
        }
      }
    };
    
    loadSphereData();
  }, [appState.currentUser]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}; 