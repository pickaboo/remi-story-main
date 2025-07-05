import { useState, useCallback } from 'react';
import { Sphere, User } from '../types';

export const useModalState = () => {
  // Modal visibility states
  const [isCreateSphereModalOpen, setIsCreateSphereModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [sphereToInviteTo, setSphereToInviteTo] = useState<Sphere | null>(null);
  const [isLookAndFeelModalOpen, setIsLookAndFeelModalOpen] = useState(false);
  const [isManageSphereModalOpen, setIsManageSphereModalOpen] = useState(false);
  const [isImageBankSettingsModalOpen, setIsImageBankSettingsModalOpen] = useState(false);
  const [isProfileCompletionModalOpen, setIsProfileCompletionModalOpen] = useState(false);
  const [allUsersForManageModal, setAllUsersForManageModal] = useState<User[]>([]);

  // Modal handlers
  const handleOpenCreateSphereModal = useCallback(() => {
    setIsCreateSphereModalOpen(true);
  }, []);

  const handleCloseCreateSphereModal = useCallback(() => {
    setIsCreateSphereModalOpen(false);
  }, []);

  const handleOpenInviteModal = useCallback((sphere: Sphere) => {
    setSphereToInviteTo(sphere);
    setIsInviteModalOpen(true);
  }, []);

  const handleCloseInviteModal = useCallback(() => {
    setIsInviteModalOpen(false);
    setSphereToInviteTo(null);
  }, []);

  const handleOpenLookAndFeelModal = useCallback(() => {
    setIsLookAndFeelModalOpen(true);
  }, []);

  const handleCloseLookAndFeelModal = useCallback(() => {
    setIsLookAndFeelModalOpen(false);
  }, []);

  const handleOpenManageSphereModal = useCallback(() => {
    setIsManageSphereModalOpen(true);
  }, []);

  const handleCloseManageSphereModal = useCallback(() => {
    setIsManageSphereModalOpen(false);
  }, []);

  const handleOpenImageBankSettingsModal = useCallback(() => {
    setIsImageBankSettingsModalOpen(true);
  }, []);

  const handleCloseImageBankSettingsModal = useCallback(() => {
    setIsImageBankSettingsModalOpen(false);
  }, []);

  const handleOpenProfileCompletionModal = useCallback(() => {
    setIsProfileCompletionModalOpen(true);
  }, []);

  const handleCloseProfileCompletionModal = useCallback(() => {
    setIsProfileCompletionModalOpen(false);
  }, []);

  return {
    // Modal states
    isCreateSphereModalOpen,
    isInviteModalOpen,
    sphereToInviteTo,
    isLookAndFeelModalOpen,
    isManageSphereModalOpen,
    isImageBankSettingsModalOpen,
    isProfileCompletionModalOpen,
    allUsersForManageModal,

    // Modal handlers
    handleOpenCreateSphereModal,
    handleCloseCreateSphereModal,
    handleOpenInviteModal,
    handleCloseInviteModal,
    handleOpenLookAndFeelModal,
    handleCloseLookAndFeelModal,
    handleOpenManageSphereModal,
    handleCloseManageSphereModal,
    handleOpenImageBankSettingsModal,
    handleCloseImageBankSettingsModal,
    handleOpenProfileCompletionModal,
    handleCloseProfileCompletionModal,

    // Setters
    setAllUsersForManageModal,
  };
}; 