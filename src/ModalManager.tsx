import React from 'react';
import { CreateSphereModal } from './features/spheres/components/CreateSphereModal';
import { InviteToSphereModal } from './features/spheres/components/InviteToSphereModal';
import { LookAndFeelModal } from './common/components/LookAndFeelModal';
import { ManageSphereModal } from './features/spheres/components/ManageSphereModal';
import { ImageBankSettingsModal } from './features/imageBank/components/ImageBankSettingsModal';
import { User, Sphere } from './types';

interface ModalManagerProps {
  modalState: any;
  currentUser: User | null;
  activeSphere: Sphere | null;
  sphereToInviteTo: Sphere | null;
  allUsersForManageModal: User[];
  isLookAndFeelModalOpen: boolean;
  isManageSphereModalOpen: boolean;
  isImageBankSettingsModalOpen: boolean;
  onCloseCreateSphereModal: () => void;
  onCloseInviteToSphereModal: () => void;
  onCloseLookAndFeelModal: () => void;
  onCloseManageSphereModal: () => void;
  onCloseImageBankSettingsModal: () => void;
  onCreateSphere: (name: string, gradientColors: [string, string]) => Promise<void>;
  onInviteUserToSphere: (email: string, sphereId?: string, message?: string) => Promise<{success: boolean, message: string}>;
  onSaveSphereBackground: (sphereId: string, backgroundUrl: string) => Promise<void>;
  onRemoveUserFromSphere: (userIdToRemove: string, sphereId: string) => Promise<boolean>;
  onSaveShowImageMetadataPreference: (show: boolean) => Promise<void>;
}

export const ModalManager: React.FC<ModalManagerProps> = ({
  modalState,
  currentUser,
  activeSphere,
  sphereToInviteTo,
  allUsersForManageModal,
  isLookAndFeelModalOpen,
  isManageSphereModalOpen,
  isImageBankSettingsModalOpen,
  onCloseCreateSphereModal,
  onCloseInviteToSphereModal,
  onCloseLookAndFeelModal,
  onCloseManageSphereModal,
  onCloseImageBankSettingsModal,
  onCreateSphere,
  onInviteUserToSphere,
  onSaveSphereBackground,
  onRemoveUserFromSphere,
  onSaveShowImageMetadataPreference,
}) => {
  return (
    <>
      {currentUser && (
        <CreateSphereModal
          isOpen={modalState.createSphere.isOpen}
          onClose={onCloseCreateSphereModal}
          onCreateSphere={onCreateSphere}
        />
      )}
      
      {currentUser && sphereToInviteTo && ( 
        <InviteToSphereModal
          isOpen={modalState.inviteToSphere.isOpen}
          onClose={onCloseInviteToSphereModal}
          onInvite={(email, message) => onInviteUserToSphere(email, sphereToInviteTo.id, message)}
          sphereToInviteTo={sphereToInviteTo}
        />
      )}
      
      {currentUser && activeSphere && isLookAndFeelModalOpen && (
        <LookAndFeelModal
          isOpen={modalState.lookAndFeel.isOpen}
          onClose={onCloseLookAndFeelModal}
          activeSphere={activeSphere}
          onSaveSphereBackground={onSaveSphereBackground}
        />
      )}
      
      {currentUser && activeSphere && isManageSphereModalOpen && (
        <ManageSphereModal
          isOpen={modalState.manageSphere.isOpen}
          onClose={onCloseManageSphereModal}
          activeSphere={activeSphere}
          currentUser={currentUser}
          allUsers={allUsersForManageModal}
          onInviteUser={(email, sphereId, message) => onInviteUserToSphere(email, sphereId, message)}
          onRemoveUserFromSphere={onRemoveUserFromSphere}
        />
      )}
      
      {currentUser && isImageBankSettingsModalOpen && ( 
        <ImageBankSettingsModal
          isOpen={modalState.imageBankSettings.isOpen}
          onClose={onCloseImageBankSettingsModal}
          currentUser={currentUser}
          onSaveShowImageMetadataPreference={onSaveShowImageMetadataPreference}
        />
      )}
    </>
  );
}; 