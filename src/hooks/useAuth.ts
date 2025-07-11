import { useCallback } from 'react';
import { User } from '../types';
import { 
  logout as authLogout, 
  updateUserProfile, 
  getAllUsers as authGetAllUsers, 
  acceptSphereInvitation as authAcceptSphereInvitation,
  declineSphereInvitation as authDeclineSphereInvitation,
} from '../features/auth/services/authService';
import { getPendingInvitationsForEmail } from '../services/storageService';

export const useAuth = () => {
  const handleLoginSuccess = useCallback(async (user: User): Promise<User> => {
    console.log("[useAuth] Login success for user:", user.id);
    
    // Update user's sphereIds if they accepted invitations during login
    if (user.email) {
      const pendingInvites = await getPendingInvitationsForEmail(user.email);
      const needsInviteCountUpdate = user.pendingInvitationCount !== pendingInvites.length ||
                                    (user.pendingInvitationCount === undefined && pendingInvites.length > 0);

      if (needsInviteCountUpdate) {
        await updateUserProfile(user.id, { pendingInvitationCount: pendingInvites.length });
      }
    }
    
    return user;
  }, []);

  const handleProfileComplete = useCallback(async (updatedUser: User): Promise<User> => {
    console.log("[useAuth] Profile completion for user:", updatedUser.id);
    // Note: Navigation and sphere creation should be handled by the calling component
    return updatedUser;
  }, []);

  const handleLogout = useCallback(async (): Promise<boolean> => {
    console.log("[useAuth] Logging out user");
    try {
      await authLogout();
      return true;
    } catch (error) {
      console.error("[useAuth] Logout failed:", error);
      return false;
    }
  }, []);

  const handleAcceptSphereInvitation = useCallback(async (invitationId: string, currentUser: User): Promise<User | null> => {
    console.log("[useAuth] Accepting sphere invitation:", invitationId);
    try {
      const updatedUser = await authAcceptSphereInvitation(invitationId, currentUser);
      return updatedUser;
    } catch (error) {
      console.error("[useAuth] Failed to accept invitation:", error);
      return null;
    }
  }, []);

  const handleDeclineSphereInvitation = useCallback(async (invitationId: string, currentUserEmail?: string): Promise<boolean> => {
    console.log("[useAuth] Declining sphere invitation:", invitationId);
    try {
      await authDeclineSphereInvitation(invitationId, currentUserEmail);
      return true;
    } catch (error) {
      console.error("[useAuth] Failed to decline invitation:", error);
      return false;
    }
  }, []);

  const handleSaveThemePreference = useCallback(async (theme: User['themePreference'], userId: string): Promise<boolean> => {
    console.log("[useAuth] Saving theme preference:", theme, "for user:", userId);
    try {
      await updateUserProfile(userId, { themePreference: theme });
      return true;
    } catch (error) {
      console.error("[useAuth] Failed to save theme preference:", error);
      return false;
    }
  }, []);

  const handleSaveShowImageMetadataPreference = useCallback(async (show: boolean, userId: string): Promise<boolean> => {
    console.log("[useAuth] Saving image metadata preference:", show, "for user:", userId);
    try {
      await updateUserProfile(userId, { showImageMetadataInBank: show });
      return true;
    } catch (error) {
      console.error("[useAuth] Failed to save image metadata preference:", error);
      return false;
    }
  }, []);

  const fetchAllUsers = useCallback(async (): Promise<User[]> => {
    console.log("[useAuth] Fetching all users");
    try {
      return await authGetAllUsers();
    } catch (error) {
      console.error("[useAuth] Failed to fetch all users:", error);
      return [];
    }
  }, []);

  return {
    handleLoginSuccess,
    handleProfileComplete,
    handleLogout,
    handleAcceptSphereInvitation,
    handleDeclineSphereInvitation,
    handleSaveThemePreference,
    handleSaveShowImageMetadataPreference,
    fetchAllUsers,
  };
}; 