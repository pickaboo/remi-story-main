import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { 
    getCurrentAuthenticatedUser, 
    logout as authLogout, 
    updateUserProfile 
} from '../services/authService';
import { getPendingInvitationsForEmail } from '../services/storageService';

export interface UserContextType {
  // State
  currentUser: User | null;
  isAuthenticated: boolean | null;
  
  // Functions
  setCurrentUser: (user: User | null) => void;
  setIsAuthenticated: (authenticated: boolean | null) => void;
  handleLoginSuccess: (user: User, isNewUserViaOAuthOrEmailFlow?: boolean) => Promise<void>;
  handleProfileComplete: (updatedUser: User) => Promise<void>;
  handleLogout: () => Promise<void>;
  handleSaveThemePreference: (theme: User['themePreference']) => Promise<void>;
  handleSaveShowImageMetadataPreference: (show: boolean) => Promise<void>;
  checkAuthAndLoadData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const checkAuthAndLoadData = useCallback(async () => {
    try {
      const user = await getCurrentAuthenticatedUser();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // Update pending invitation count if user has email
        if (user.email) {
          const pendingInvites = await getPendingInvitationsForEmail(user.email);
          const needsInviteCountUpdate = user.pendingInvitationCount !== pendingInvites.length ||
                                        (user.pendingInvitationCount === undefined && pendingInvites.length > 0);

          if (needsInviteCountUpdate) {
            const updatedUser = await updateUserProfile(user.id, { pendingInvitationCount: pendingInvites.length });
            if (updatedUser) {
              setCurrentUser(updatedUser);
            }
          }
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const handleLoginSuccess = useCallback(async (user: User, isNewUserViaOAuthOrEmailFlow?: boolean) => {
    console.log("[UserContext] handleLoginSuccess called for user:", user.id);
    setCurrentUser(user);
    setIsAuthenticated(true);
    
    // Update pending invitation count
    if (user.email) {
      const pendingInvites = await getPendingInvitationsForEmail(user.email);
      const needsInviteCountUpdate = user.pendingInvitationCount !== pendingInvites.length ||
                                    (user.pendingInvitationCount === undefined && pendingInvites.length > 0);

      if (needsInviteCountUpdate) {
        const updatedUser = await updateUserProfile(user.id, { pendingInvitationCount: pendingInvites.length });
        if (updatedUser) {
          setCurrentUser(updatedUser);
        }
      }
    }
  }, []);

  const handleProfileComplete = useCallback(async (updatedUser: User) => {
    console.log("[UserContext] handleProfileComplete called for user:", updatedUser.id);
    setCurrentUser(updatedUser);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await authLogout();
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, []);

  const handleSaveThemePreference = useCallback(async (theme: User['themePreference']) => {
    if (!currentUser) return;
    
    try {
      const updatedUser = await updateUserProfile(currentUser.id, { themePreference: theme });
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }, [currentUser]);

  const handleSaveShowImageMetadataPreference = useCallback(async (show: boolean) => {
    if (!currentUser) return;
    
    try {
      const updatedUser = await updateUserProfile(currentUser.id, { showImageMetadataInBank: show });
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error saving show image metadata preference:', error);
    }
  }, [currentUser]);

  const value: UserContextType = {
    currentUser,
    isAuthenticated,
    setCurrentUser,
    setIsAuthenticated,
    handleLoginSuccess,
    handleProfileComplete,
    handleLogout,
    handleSaveThemePreference,
    handleSaveShowImageMetadataPreference,
    checkAuthAndLoadData,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 