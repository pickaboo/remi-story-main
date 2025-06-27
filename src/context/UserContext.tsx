import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { 
    getCurrentAuthenticatedUser, 
    logout as authLogout, 
    updateUserProfile 
} from '../features/auth/services/authService';
import { getPendingInvitationsForEmail } from '../common/services/storageService';
import { getUserById } from '../common/services/userService';

export interface UserContextType {
  // State
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // Functions
  setCurrentUser: (user: User | null) => void;
  handleLoginSuccess: (user: User) => void;
  handleProfileComplete: (user: User) => void;
  handleLogout: () => Promise<void>;
  handleSaveThemePreference: (theme: User['themePreference']) => Promise<void>;
  handleSaveShowImageMetadataPreference: (show: boolean) => Promise<void>;
  checkAuthAndLoadData: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthAndLoadData = async () => {
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
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleProfileComplete = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await authLogout();
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleSaveThemePreference = async (theme: User['themePreference']) => {
    if (!currentUser) return;
    
    try {
      const updatedUser = await updateUserProfile(currentUser.id, { themePreference: theme });
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const handleSaveShowImageMetadataPreference = async (show: boolean) => {
    if (!currentUser) return;
    
    try {
      const updatedUser = await updateUserProfile(currentUser.id, { showImageMetadataInBank: show });
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error saving show image metadata preference:', error);
    }
  };

  const refreshUser = async () => {
    if (currentUser?.id) {
      try {
        const refreshedUser = await getUserById(currentUser.id);
        if (refreshedUser) {
          setCurrentUser(refreshedUser);
        }
      } catch (error) {
        console.error('Failed to refresh user:', error);
      }
    }
  };

  const value: UserContextType = {
    currentUser,
    isAuthenticated,
    setCurrentUser,
    handleLoginSuccess,
    handleProfileComplete,
    handleLogout,
    handleSaveThemePreference,
    handleSaveShowImageMetadataPreference,
    checkAuthAndLoadData,
    refreshUser,
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