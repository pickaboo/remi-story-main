import { useCallback } from 'react';
import { User } from '../types';
import { 
  getCurrentAuthenticatedUser, 
  logout as authLogout, 
  updateUserProfile, 
  getAllUsers as authGetAllUsers, 
  acceptSphereInvitation as authAcceptSphereInvitation,
  declineSphereInvitation as authDeclineSphereInvitation,
} from '../services/authService';
import { getPendingInvitationsForEmail } from '../services/storageService';

export const useAuth = () => {
  const handleLoginSuccess = useCallback(async (user: User, isNewUserViaOAuthOrEmailFlow?: boolean) => {
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

  const handleProfileComplete = useCallback(async (updatedUser: User) => {
    console.log("[useAuth] Profile completion for user:", updatedUser.id);
    return updatedUser;
  }, []);

  const handleLogout = useCallback(async () => {
    console.log("[useAuth] Logging out user");
    try {
      await authLogout();
      return true;
    } catch (error) {
      console.error("[useAuth] Logout failed:", error);
      return false;
    }
  }, []);

  const handleAcceptSphereInvitation = useCallback(async (invitationId: string, currentUser: User) => {
    console.log("[useAuth] Accepting sphere invitation:", invitationId);
    try {
      await authAcceptSphereInvitation(invitationId, currentUser);
      return true;
    } catch (error) {
      console.error("[useAuth] Failed to accept invitation:", error);
      return false;
    }
  }, []);

  const handleDeclineSphereInvitation = useCallback(async (invitationId: string, currentUserEmail?: string) => {
    console.log("[useAuth] Declining sphere invitation:", invitationId);
    try {
      await authDeclineSphereInvitation(invitationId, currentUserEmail);
      return true;
    } catch (error) {
      console.error("[useAuth] Failed to decline invitation:", error);
      return false;
    }
  }, []);

  const handleSaveThemePreference = useCallback(async (theme: User['themePreference'], userId: string) => {
    console.log("[useAuth] Saving theme preference:", theme, "for user:", userId);
    try {
      await updateUserProfile(userId, { themePreference: theme });
      return true;
    } catch (error) {
      console.error("[useAuth] Failed to save theme preference:", error);
      return false;
    }
  }, []);

  const handleSaveShowImageMetadataPreference = useCallback(async (show: boolean, userId: string) => {
    console.log("[useAuth] Saving image metadata preference:", show, "for user:", userId);
    try {
      await updateUserProfile(userId, { showImageMetadataInBank: show });
      return true;
    } catch (error) {
      console.error("[useAuth] Failed to save image metadata preference:", error);
      return false;
    }
  }, []);

  const fetchAllUsers = useCallback(async () => {
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