import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '../types';
import { useAuth } from '../features/auth/hooks/useAuth';
import { logout as authLogout, updateUserProfile } from '../features/auth/services/authService';
import { getPendingInvitationsForEmail } from '../common/services/storageService';
import { getUserById, addSphereToUser } from '../common/services/userService';
import { updateSphereInvitationStatus } from '../common/services/invitationService';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export interface UserContextType {
  // State
  currentUser: User | null;
  isAuthenticated: boolean | null;
  
  // Functions
  setCurrentUser: (user: User | null) => void;
  handleLoginSuccess: (user: User) => void;
  handleProfileComplete: (user: User) => void;
  handleLogout: () => Promise<void>;
  handleSaveThemePreference: (theme: User['themePreference']) => Promise<void>;
  handleSaveShowImageMetadataPreference: (show: boolean) => Promise<void>;
  refreshUser: () => Promise<void>;
  handleAcceptInvitation: (invitationId: string) => Promise<void>;
  handleDeclineInvitation: (invitationId: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

let userProviderRenderCount = 0;

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  userProviderRenderCount += 1;
  console.info(`[UserProvider] Render #${userProviderRenderCount} at ${new Date().toISOString()}`);
  // Use the original useAuth hook for authentication logic
  const { 
    isAuthenticated, 
    currentUser, 
    setCurrentUser, 
    handleLoginSuccess: authHandleLoginSuccess, 
    handleProfileComplete: authHandleProfileComplete,
    setIsAuthenticated
  } = useAuth();

  React.useEffect(() => {
    console.log('[UserContext] State update:', { isAuthenticated, currentUser });
  }, [isAuthenticated, currentUser]);

  // One-time fetch for user profile (replaces real-time listener)
  React.useEffect(() => {
    if (currentUser && currentUser.id) {
      const fetchUser = async () => {
        const userDocRef = doc(db, 'users', currentUser.id);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const userData = { id: docSnap.id, ...docSnap.data() } as User;
          if (JSON.stringify(userData) !== JSON.stringify(currentUser)) {
            setCurrentUser(userData);
          }
        }
      };
      fetchUser();
    }
  }, [currentUser?.id]);

  const handleLogout = async () => {
    console.log('[UserContext] handleLogout called');
    try {
      console.log('[UserContext] Calling authLogout...');
      await authLogout();
      console.log('[UserContext] authLogout completed, clearing state');
      setCurrentUser(null);
      if (setIsAuthenticated) setIsAuthenticated(false);
      console.log('[UserContext] State cleared, logout complete');
    } catch (error) {
      console.error('[UserContext] Error during logout:', error);
      // Even if there's an error, clear the state
      setCurrentUser(null);
      if (setIsAuthenticated) setIsAuthenticated(false);
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

  const handleAcceptInvitation = async (invitationId: string) => {
    if (!currentUser?.id) {
      console.error('No current user found');
      return;
    }

    try {
      console.log('🚀 ACCEPTING INVITATION:', invitationId, 'for user:', currentUser.id);
      
      // Update the invitation status to accepted
      const updatedInvitation = await updateSphereInvitationStatus(invitationId, 'accepted', currentUser.id);
      
      if (!updatedInvitation) {
        console.error('Failed to update invitation status');
        return;
      }

      // Add the sphere to the user's membership
      const sphereAdded = await addSphereToUser(currentUser.id, updatedInvitation.sphereId);
      
      if (!sphereAdded) {
        console.error('Failed to add sphere to user membership');
        return;
      }

      console.log('✅ Successfully accepted invitation and added sphere to user');
      
      // Refresh user data to reflect the new sphere membership
      await refreshUser();
      
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    if (!currentUser?.id) {
      console.error('No current user found');
      return;
    }

    try {
      console.log('❌ DECLINING INVITATION:', invitationId, 'for user:', currentUser.id);
      
      // Update the invitation status to declined
      const updatedInvitation = await updateSphereInvitationStatus(invitationId, 'declined');
      
      if (!updatedInvitation) {
        console.error('Failed to update invitation status');
        return;
      }

      console.log('✅ Successfully declined invitation');
      
      // Refresh user data (invitations will be updated via usePendingInvites)
      await refreshUser();
      
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  };

  const value: UserContextType = {
    currentUser,
    isAuthenticated,
    setCurrentUser,
    handleLoginSuccess: authHandleLoginSuccess,
    handleProfileComplete: authHandleProfileComplete,
    handleLogout,
    handleSaveThemePreference,
    handleSaveShowImageMetadataPreference,
    refreshUser,
    handleAcceptInvitation,
    handleDeclineInvitation,
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