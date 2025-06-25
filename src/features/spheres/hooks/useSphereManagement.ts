import { useState } from 'react';
import { Sphere, User } from '../../../../types';
import { addUserToSphere, mock_inviteUserToSphereByEmail, updateUserProfile, removeUserFromSphere as authRemoveUserFromSphere } from '../../auth/services/authService';
import { saveNewSphere, generateId as generateSphereId } from '../../../../services/storageService';
import { useFeedback } from '../../../../context/FeedbackContext';
import { useAppLogic } from '../../../../hooks/useAppLogic';

export const useSphereManagement = (currentUser: User | null) => {
  const [sphereToInviteTo, setSphereToInviteTo] = useState<Sphere | null>(null);
  const [allUsersForManageModal, setAllUsersForManageModal] = useState<User[]>([]);
  const { showFeedback } = useFeedback();
  const { fetchUserAndSphereData } = useAppLogic();

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
    try {
      const sphereId = sphereIdToInviteTo || activeSphere?.id;
      if (!sphereId || !currentUser) {
        return { success: false, message: "Ingen aktiv sfär hittad eller användare inte inloggad." };
      }
      
      const result = await mock_inviteUserToSphereByEmail(currentUser.id, sphereId, inviteeEmail, message);
      if (result.success) {
        showFeedback(`Inbjudan skickad till ${inviteeEmail}`, 'success');
      }
      return result;
    } catch (error: any) {
      const errorMessage = error.message || "Ett fel uppstod vid skickning av inbjudan.";
      showFeedback(errorMessage, 'error', 5000);
      return { success: false, message: errorMessage };
    }
  };

  const handleSaveSphereBackground = async (sphereId: string, backgroundUrl: string) => {
    // Implementation would go here
    console.log("Saving sphere background:", sphereId, backgroundUrl);
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