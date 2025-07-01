import { useState } from 'react';
import { Sphere, User } from '../../../types';
import { addUserToSphere, updateUserProfile, removeUserFromSphere as authRemoveUserFromSphere } from '../../auth/services/authService';
import { saveNewSphere, generateId as generateSphereId } from '../../../common/services/storageService';
import { useFeedback } from '../../../context/FeedbackContext';
import { useAppLogic } from '../../../common/hooks/useAppLogic';
import { createSphereInvitation } from '../../../common/services/invitationService';
import { useSphere } from '../../../context/SphereContext';

export const useSphereManagement = (currentUser: User | null) => {
  const [sphereToInviteTo, setSphereToInviteTo] = useState<Sphere | null>(null);
  const [allUsersForManageModal, setAllUsersForManageModal] = useState<User[]>([]);
  const { showFeedback } = useFeedback();
  const { fetchUserAndSphereData } = useAppLogic(currentUser);
  const { activeSphere, refreshActiveSphere, applyBackgroundPreference } = useSphere();

  const handleCreateSphere = async (name: string, gradientColors: [string, string]) => {
    if (!currentUser) return;
    
    const newSphere: Sphere = {
      id: generateSphereId(),
      name,
      gradientColors,
      ownerUserId: currentUser.id,
      backgroundUrl: undefined,
    };
    
    await saveNewSphere(newSphere);
    const updatedUser = await addUserToSphere(currentUser.id, newSphere.id);
    if (updatedUser) {
      const finalUser = await fetchUserAndSphereData(updatedUser);
      return finalUser;
    }
    return null;
  };

  const handleInviteUserToSphere = async (
    inviteeEmail: string, 
    sphereIdToInviteTo?: string, 
    message?: string,
    activeSphere?: Sphere | null
  ): Promise<{success: boolean, message: string}> => {
    console.log('🔍 handleInviteUserToSphere CALLED with:', { inviteeEmail, sphereIdToInviteTo, message, activeSphereId: activeSphere?.id });
    
    try {
      const sphereId = sphereIdToInviteTo || activeSphere?.id;
      if (!sphereId || !currentUser) {
        console.log('❌ Missing sphereId or currentUser:', { sphereId, currentUserId: currentUser?.id });
        return { success: false, message: "Ingen aktiv sfär hittad eller användare inte inloggad." };
      }
      
      console.log('✅ Creating invitation for:', { sphereId, inviteeEmail, message });
      
      // Create the invitation in Firestore
      await createSphereInvitation({
        inviterUserId: currentUser.id,
        inviteeEmail: inviteeEmail.toLowerCase(),
        sphereId: sphereId,
        message: message || undefined,
      });

      console.log('✅ Invitation created successfully');
      showFeedback(`Inbjudan skickad till ${inviteeEmail}!`, 'success');
      return { success: true, message: `Inbjudan skickad till ${inviteeEmail}!` };
    } catch (error) {
      console.error('❌ Error inviting user to sphere:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ett fel uppstod när inbjudan skulle skickas.';
      showFeedback(errorMessage, 'error');
      return { success: false, message: errorMessage };
    }
  };

  const handleSaveSphereBackground = async (sphereId: string, backgroundUrl: string) => {
    if (!currentUser || !activeSphere) {
      showFeedback("Ingen användare inloggad eller aktiv sfär.", 'error');
      return;
    }

    if (activeSphere.id !== sphereId) {
      showFeedback("Fel: Kan inte ändra bakgrund för en inaktiv sfär.", 'error');
      return;
    }

    try {
      // Update the sphere with the new background URL
      const updatedSphere = {
        ...activeSphere,
        backgroundUrl: backgroundUrl || undefined,
      };

      // Save the updated sphere
      await saveNewSphere(updatedSphere);

      // Refresh the active sphere data
      await refreshActiveSphere();

      // Apply the new background immediately
      applyBackgroundPreference(updatedSphere, currentUser);

      showFeedback(`Bakgrund för sfären "${updatedSphere.name}" uppdaterad!`, 'success');
    } catch (error) {
      console.error("Error saving sphere background:", error);
      showFeedback("Kunde inte spara bakgrund.", 'error');
    }
  };

  const handleSaveShowImageMetadataPreference = async (show: boolean) => {
    if (!currentUser) return;
    
    const updatedUser = await updateUserProfile(currentUser.id, { showImageMetadataInBank: show });
    if (updatedUser) {
      return updatedUser;
    }
    return null;
  };

  const handleRemoveUserFromSphere = async (userIdToRemove: string, sphereId: string): Promise<boolean> => {
    try {
      await authRemoveUserFromSphere(userIdToRemove, sphereId);
      return true;
    } catch (error) {
      console.error("Error removing user from sphere:", error);
      return false;
    }
  };

  return {
    sphereToInviteTo,
    setSphereToInviteTo,
    allUsersForManageModal,
    setAllUsersForManageModal,
    handleCreateSphere,
    handleInviteUserToSphere,
    handleSaveSphereBackground,
    handleSaveShowImageMetadataPreference,
    handleRemoveUserFromSphere,
  };
}; 