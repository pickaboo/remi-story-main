import React from 'react';
import { useAppContext } from '../context/AppContext';
import { CreateSphereModal } from './common/CreateSphereModal';
import { InviteToSphereModal } from './common/InviteToSphereModal';
import { LookAndFeelModal } from './common/LookAndFeelModal';
import { ManageSphereModal } from './common/ManageSphereModal';
import { ImageBankSettingsModal } from './common/ImageBankSettingsModal';

export const ModalManager: React.FC = () => {
  const {
    // Modal states
    isCreateSphereModalOpen,
    isInviteModalOpen,
    sphereToInviteTo,
    isLookAndFeelModalOpen,
    isManageSphereModalOpen,
    isImageBankSettingsModalOpen,
    allUsersForManageModal,
    
    // Sphere management
    currentUser,
    activeSphere,
    handleCreateSphere,
    handleSaveSphereBackground,
    handleInviteUserToSphere,
    handleRemoveUserFromSphere,
    
    // Modal handlers
    handleCloseCreateSphereModal,
    handleCloseInviteModal,
    handleCloseLookAndFeelModal,
    handleCloseManageSphereModal,
    handleCloseImageBankSettingsModal,
    
    // Auth functions
    handleSaveShowImageMetadataPreference,
    setCurrentUser,
    showGlobalFeedback,
  } = useAppContext();

  const handleCreateSphereSubmit = async (name: string, gradientColors: [string, string]) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    
    const result = await handleCreateSphere(name, gradientColors, currentUser);
    if (!result.success) {
      throw new Error(result.error || 'Failed to create sphere');
    }
    
    // Update the current user with the updated user data from Firestore
    if (result.updatedUser) {
      // Fetch the latest user from Firestore to ensure sphereIds is up to date
      const { getUserById } = await import('../services/userService');
      const latestUser = await getUserById(result.updatedUser.id);
      if (latestUser) {
        setCurrentUser(latestUser);
        // Also refresh spheres for the user
        const { fetchUserAndSphereData } = useAppContext();
        await fetchUserAndSphereData(latestUser);
      } else {
        setCurrentUser(result.updatedUser);
      }
    }
    
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

      {isLookAndFeelModalOpen && activeSphere && currentUser && (
        <LookAndFeelModal
          isOpen={isLookAndFeelModalOpen}
          onClose={handleCloseLookAndFeelModal}
          activeSphere={activeSphere}
          currentUser={currentUser}
          onSaveSphereBackground={handleSaveSphereBackground}
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
    </>
  );
}; 