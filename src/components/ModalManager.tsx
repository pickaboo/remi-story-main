import React from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  CreateSphereModal,
  InviteToSphereModal,
  LookAndFeelModal,
  ManageSphereModal,
  ImageBankSettingsModal
} from './modals';
import { ProfileCompletionModal } from './modals/ProfileCompletionModal';

export const ModalManager: React.FC = () => {
  const {
    // Modal states
    isCreateSphereModalOpen,
    isInviteModalOpen,
    sphereToInviteTo,
    isLookAndFeelModalOpen,
    isManageSphereModalOpen,
    isImageBankSettingsModalOpen,
    isProfileCompletionModalOpen,
    allUsersForManageModal,
    
    // Sphere management
    currentUser,
    activeSphere,
    handleCreateSphere,
    handleSaveSphereBackground,
    handleInviteUserToSphere,
    handleRemoveUserFromSphere,
    handleSwitchSphere,
    fetchUserAndSphereData,
    
    // Modal handlers
    handleCloseCreateSphereModal,
    handleCloseInviteModal,
    handleCloseLookAndFeelModal,
    handleCloseManageSphereModal,
    handleCloseImageBankSettingsModal,
    handleCloseProfileCompletionModal,
    
    // Auth functions
    handleSaveThemePreference,
    handleSaveShowImageMetadataPreference,
    setCurrentUser,
    showGlobalFeedback,
  } = useAppContext();

  const handleCreateSphereSubmit = async (name: string, gradientColors: [string, string]) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    
    const result = await handleCreateSphere(name, gradientColors, currentUser);
    console.log('[ModalManager] Create sphere result:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create sphere');
    }
    
    // Update the current user with the updated user data from Firestore
    if (result.updatedUser) {
      console.log('[ModalManager] Updating user with result.updatedUser');
      // Fetch the latest user from Firestore to ensure sphereIds is up to date
      const { getUserById } = await import('../services/userService');
      const latestUser = await getUserById(result.updatedUser.id);
      if (latestUser) {
        setCurrentUser(latestUser);
        // Don't refresh spheres here as it might override the active sphere
        // handleCreateSphere already sets the new sphere as active
      } else {
        setCurrentUser(result.updatedUser);
      }
    }
    
    // Note: handleCreateSphere already sets the new sphere as active, so no need to switch manually
    console.log('[ModalManager] Sphere created successfully, active sphere should already be updated');
    
    // Show success feedback
    showGlobalFeedback(`Sfären "${name}" skapades framgångsrikt!`, 'success');
  };

  const handleInviteSubmit = async (email: string, message?: string) => {
    if (!sphereToInviteTo) {
      return { success: false, message: "Missing sphere information" };
    }
    
    return await handleInviteUserToSphere(email, sphereToInviteTo.id, message);
  };

  const handleSaveImageMetadataPreference = async (show: boolean) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    
    const success = await handleSaveShowImageMetadataPreference(show, currentUser.id);
    if (!success) {
      throw new Error('Failed to save image metadata preference');
    }
  };

  const handleSaveThemePreferenceWrapper = async (theme: string) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    await handleSaveThemePreference(theme as any, currentUser.id);
  };

  const handleSaveShowImageMetadataPreferenceWrapper = async (show: boolean) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    await handleSaveShowImageMetadataPreference(show, currentUser.id);
  };

  return (
    <>
      {isCreateSphereModalOpen && (
        <CreateSphereModal
          isOpen={isCreateSphereModalOpen}
          onClose={handleCloseCreateSphereModal}
          onCreateSphere={handleCreateSphereSubmit}
        />
      )}

      {isInviteModalOpen && sphereToInviteTo && (
        <InviteToSphereModal
          isOpen={isInviteModalOpen}
          onClose={handleCloseInviteModal}
          onInvite={handleInviteSubmit}
          sphereToInviteTo={sphereToInviteTo}
        />
      )}

      {isLookAndFeelModalOpen && activeSphere && (
        <LookAndFeelModal
          isOpen={isLookAndFeelModalOpen}
          onClose={handleCloseLookAndFeelModal}
          activeSphere={activeSphere}
          onSaveSphereBackground={handleSaveSphereBackground}
          onSaveThemePreference={handleSaveThemePreferenceWrapper}
          onSaveShowImageMetadataPreference={handleSaveShowImageMetadataPreferenceWrapper}
        />
      )}

      {isManageSphereModalOpen && activeSphere && currentUser && (
        <ManageSphereModal
          isOpen={isManageSphereModalOpen}
          onClose={handleCloseManageSphereModal}
          activeSphere={activeSphere}
          currentUser={currentUser}
          allUsers={allUsersForManageModal}
          onInviteUser={handleInviteUserToSphere}
          onRemoveUserFromSphere={handleRemoveUserFromSphere}
        />
      )}

      {isImageBankSettingsModalOpen && currentUser && (
        <ImageBankSettingsModal
          isOpen={isImageBankSettingsModalOpen}
          onClose={handleCloseImageBankSettingsModal}
          currentUser={currentUser}
          onSaveShowImageMetadataPreference={handleSaveImageMetadataPreference}
        />
      )}

      {isProfileCompletionModalOpen && (
        <ProfileCompletionModal
          isOpen={isProfileCompletionModalOpen}
          onClose={handleCloseProfileCompletionModal}
        />
      )}
    </>
  );
}; 