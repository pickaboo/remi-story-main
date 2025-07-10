import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  CreateSphereModal,
  InviteToSphereModal,
  LookAndFeelModal,
  ManageSphereModal,
  ImageBankSettingsModal
} from './modals';
import { ProfileCompletionModal } from './modals/ProfileCompletionModal';
import { BucketListPage } from '../features/bucketList/pages/BucketListPage';

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
    isBucketListModalOpen,
    
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
    handleCloseBucketListModal,
    
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
    console.log('[ModalManager] handleCreateSphereSubmit called with:', name, gradientColors);
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

  const handleCloseCreateSphereModalWithLog = () => {
    console.log('[ModalManager] handleCloseCreateSphereModal called');
    handleCloseCreateSphereModal();
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
          onClose={handleCloseCreateSphereModalWithLog}
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

      {isBucketListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-2xl">
          {(() => {
            const [isDark, setIsDark] = useState(false);
            useEffect(() => {
              setIsDark(document.documentElement.classList.contains('dark'));
            }, []);
            const lightBg = 'rgba(255,255,255,0.85)';
            const darkBg = 'rgba(24,24,27,0.85)'; // zinc-900
            return (
              <div
                className="rounded-xl p-6 shadow-xl w-full max-w-2xl relative border border-slate-100 dark:border-slate-800"
                style={{
                  background: isDark ? darkBg : lightBg,
                  boxShadow: '0 12px 48px 0 rgba(0,0,0,0.18)'
                }}
              >
                <button onClick={handleCloseBucketListModal} className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Stäng">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <BucketListPage />
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}; 