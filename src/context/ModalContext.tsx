import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Sphere } from '../types';

interface ModalState {
  createSphere: {
    isOpen: boolean;
  };
  inviteToSphere: {
    isOpen: boolean;
    sphereToInviteTo: Sphere | null;
  };
  lookAndFeel: {
    isOpen: boolean;
  };
  manageSphere: {
    isOpen: boolean;
  };
  imageBankSettings: {
    isOpen: boolean;
  };
}

interface ModalContextType {
  modalState: ModalState;
  openCreateSphereModal: () => void;
  closeCreateSphereModal: () => void;
  openInviteToSphereModal: (sphere: Sphere) => void;
  closeInviteToSphereModal: () => void;
  openLookAndFeelModal: () => void;
  closeLookAndFeelModal: () => void;
  openManageSphereModal: () => void;
  closeManageSphereModal: () => void;
  openImageBankSettingsModal: () => void;
  closeImageBankSettingsModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalState>({
    createSphere: { isOpen: false },
    inviteToSphere: { isOpen: false, sphereToInviteTo: null },
    lookAndFeel: { isOpen: false },
    manageSphere: { isOpen: false },
    imageBankSettings: { isOpen: false },
  });

  const openCreateSphereModal = () => {
    setModalState(prev => ({
      ...prev,
      createSphere: { isOpen: true }
    }));
  };

  const closeCreateSphereModal = () => {
    setModalState(prev => ({
      ...prev,
      createSphere: { isOpen: false }
    }));
  };

  const openInviteToSphereModal = (sphere: Sphere) => {
    setModalState(prev => ({
      ...prev,
      inviteToSphere: { isOpen: true, sphereToInviteTo: sphere }
    }));
  };

  const closeInviteToSphereModal = () => {
    setModalState(prev => ({
      ...prev,
      inviteToSphere: { isOpen: false, sphereToInviteTo: null }
    }));
  };

  const openLookAndFeelModal = () => {
    setModalState(prev => ({
      ...prev,
      lookAndFeel: { isOpen: true }
    }));
  };

  const closeLookAndFeelModal = () => {
    setModalState(prev => ({
      ...prev,
      lookAndFeel: { isOpen: false }
    }));
  };

  const openManageSphereModal = () => {
    setModalState(prev => ({
      ...prev,
      manageSphere: { isOpen: true }
    }));
  };

  const closeManageSphereModal = () => {
    setModalState(prev => ({
      ...prev,
      manageSphere: { isOpen: false }
    }));
  };

  const openImageBankSettingsModal = () => {
    setModalState(prev => ({
      ...prev,
      imageBankSettings: { isOpen: true }
    }));
  };

  const closeImageBankSettingsModal = () => {
    setModalState(prev => ({
      ...prev,
      imageBankSettings: { isOpen: false }
    }));
  };

  const value: ModalContextType = {
    modalState,
    openCreateSphereModal,
    closeCreateSphereModal,
    openInviteToSphereModal,
    closeInviteToSphereModal,
    openLookAndFeelModal,
    closeLookAndFeelModal,
    openManageSphereModal,
    closeManageSphereModal,
    openImageBankSettingsModal,
    closeImageBankSettingsModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}; 