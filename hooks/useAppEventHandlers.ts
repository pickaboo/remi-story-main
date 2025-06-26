import { useSphere } from '../context/SphereContext';
import { useSphereManagement } from '../src/features/spheres/hooks/useSphereManagement';
import { useModal } from '../context';

export const useAppEventHandlers = (currentUser: any) => {
  const { activeSphere } = useSphere();
  const { 
    setSphereToInviteTo,
    handleCreateSphere,
    handleInviteUserToSphere,
    handleSaveShowImageMetadataPreference,
  } = useSphereManagement(currentUser);
  const { closeCreateSphereModal, closeInviteToSphereModal } = useModal();

  const handleCloseInviteModal = () => {
    setSphereToInviteTo(null);
    closeInviteToSphereModal();
  };

  const handleCreateSphereWithUpdate = async (name: string, gradientColors: [string, string]) => {
    await handleCreateSphere(name, gradientColors);
    closeCreateSphereModal();
  };

  const handleInviteUserToSphereWithActiveSphere = async (
    inviteeEmail: string, 
    sphereIdToInviteTo?: string, 
    message?: string
  ) => {
    return handleInviteUserToSphere(inviteeEmail, sphereIdToInviteTo, message, activeSphere);
  };

  const handleSaveShowImageMetadataPreferenceWithUpdate = async (show: boolean) => {
    await handleSaveShowImageMetadataPreference(show);
  };

  return {
    handleCloseInviteModal,
    handleCreateSphereWithUpdate,
    handleInviteUserToSphereWithActiveSphere,
    handleSaveShowImageMetadataPreferenceWithUpdate,
  };
}; 