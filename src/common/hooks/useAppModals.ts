import { useModal } from '../../context';
import { useSphereManagement } from '../../features/spheres/hooks/useSphereManagement';
import { useAppEventHandlers } from './useAppEventHandlers';

export const useAppModals = (currentUser: any) => {
  const { modalState, closeCreateSphereModal, closeInviteToSphereModal, closeLookAndFeelModal, openManageSphereModal, closeManageSphereModal, closeImageBankSettingsModal } = useModal();
  
  const { 
    sphereToInviteTo, 
    allUsersForManageModal, 
    handleSaveSphereBackground,
    handleRemoveUserFromSphere,
  } = useSphereManagement(currentUser);

  const {
    handleCloseInviteModal,
    handleCreateSphereWithUpdate,
    handleInviteUserToSphereWithActiveSphere,
    handleSaveShowImageMetadataPreferenceWithUpdate,
  } = useAppEventHandlers(currentUser);

  const modalManagerProps = {
    modalState,
    currentUser,
    sphereToInviteTo: modalState.inviteToSphere.sphereToInviteTo,
    allUsersForManageModal,
    isLookAndFeelModalOpen: modalState.lookAndFeel.isOpen,
    isManageSphereModalOpen: modalState.manageSphere.isOpen,
    isImageBankSettingsModalOpen: modalState.imageBankSettings.isOpen,
    onCloseCreateSphereModal: closeCreateSphereModal,
    onCloseInviteToSphereModal: handleCloseInviteModal,
    onCloseLookAndFeelModal: closeLookAndFeelModal,
    onCloseManageSphereModal: closeManageSphereModal,
    onCloseImageBankSettingsModal: closeImageBankSettingsModal,
    onCreateSphere: handleCreateSphereWithUpdate,
    onInviteUserToSphere: handleInviteUserToSphereWithActiveSphere,
    onSaveSphereBackground: handleSaveSphereBackground,
    onRemoveUserFromSphere: handleRemoveUserFromSphere,
    onSaveShowImageMetadataPreference: handleSaveShowImageMetadataPreferenceWithUpdate,
  };

  console.log('%c🧩 [useAppModals] modalManagerProps:', 'background: #00bcd4; color: #fff; font-weight: bold; padding: 2px 8px; border-radius: 4px;', modalManagerProps);

  return {
    modalManagerProps,
  };
}; 