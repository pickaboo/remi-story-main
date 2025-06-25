import { useCallback, useMemo } from 'react';
import { useSphere } from '../../../../context/SphereContext';
import { useUser } from '../../../../context/UserContext';

export const useSphereData = () => {
  const { 
    activeSphere, 
    userSpheres, 
    allSpheres,
    handleSwitchSphere,
    handleCreateSphere,
    fetchUserAndSphereData 
  } = useSphere();
  
  const { currentUser } = useUser();

  const switchSphere = useCallback(async (sphereId: string) => {
    await handleSwitchSphere(sphereId);
  }, [handleSwitchSphere]);

  const createSphere = useCallback(async (name: string, gradientColors: [string, string]) => {
    return await handleCreateSphere(name, gradientColors);
  }, [handleCreateSphere]);

  const refreshSphereData = useCallback(async () => {
    if (currentUser) {
      await fetchUserAndSphereData(currentUser);
    }
  }, [currentUser, fetchUserAndSphereData]);

  return {
    activeSphere,
    userSpheres,
    allSpheres,
    switchSphere,
    createSphere,
    refreshSphereData,
  };
}; 