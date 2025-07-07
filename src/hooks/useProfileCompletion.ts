import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { isProfileComplete } from '../utils/profileUtils';

export const useProfileCompletion = () => {
  const { currentUser, isProfileCompletionModalOpen, handleOpenProfileCompletionModal } = useAppContext();

  useEffect(() => {
    // Only check if user is authenticated and modal is not already open
    if (currentUser && !isProfileCompletionModalOpen) {
      const profileIsComplete = isProfileComplete(currentUser);
      
      if (!profileIsComplete) {
        console.log('[useProfileCompletion] Profile incomplete, showing modal');
        handleOpenProfileCompletionModal();
      }
    }
  }, [currentUser, isProfileCompletionModalOpen, handleOpenProfileCompletionModal]);
}; 