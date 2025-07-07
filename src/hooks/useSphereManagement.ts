import { useState, useCallback } from 'react';
import { Sphere, User, SphereCreationResult, InvitationResult } from '../types';
import { 
  getAllSpheres, 
  saveNewSphere, 
  updateSphere, 
  generateId as generateSphereId
} from '../services/storageService';
import { 
  getActiveSphere as getActiveSphereFromService,
  getUserSpheres as getUserSpheresFromService,
  setCurrentSphereId as persistCurrentSphereId
} from '../services/userService';
import { 
  mock_inviteUserToSphereByEmail,
  removeUserFromSphere,
  addUserToSphere,
} from '../services/authService';
import { MOCK_SPHERES } from '../constants';
import { isPersonalSphere } from '../types';

export const useSphereManagement = () => {
  const [allSpheres, setAllSpheres] = useState<Sphere[]>([]);
  const [activeSphere, setActiveSphere] = useState<Sphere | null>(null);
  const [userSpheres, setUserSpheres] = useState<Sphere[]>([]);

  const fetchUserAndSphereData = useCallback(async (user: User): Promise<Sphere | null> => {
    console.log("[useSphereManagement] fetchUserAndSphereData called for user:", user.id, "with sphereIds:", user.sphereIds);
    
    try {
      // Increase timeout to 10 seconds for first-time users
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Sphere data fetch timeout')), 10000);
      });
      
      const fetchPromise = (async () => {
        let spheresFromStorage = await getAllSpheres();
        const spheresToUse = spheresFromStorage.length > 0 ? spheresFromStorage : MOCK_SPHERES;
        setAllSpheres(spheresToUse);
        
        // For first-time users or users without spheres, create a default sphere
        if (!user.sphereIds || user.sphereIds.length === 0) {
          console.log("[useSphereManagement] User has no spheres, creating personal sphere");
          
          // Create a personal sphere for the user
          const personalSphereName = user.name && user.name !== "Ny Användare" 
            ? `${user.name}s personliga sfär` 
            : "Min personliga sfär";
            
          const personalSphere: Sphere = {
            id: generateSphereId(),
            name: personalSphereName,
            gradientColors: ['#3B82F6', '#1E40AF'], // Blue gradient
            memberIds: [user.id], // Only the user is a member
            ownerId: user.id, // User owns this sphere
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isPersonal: true, // Mark as personal sphere
          };
          
          try {
            // Save the personal sphere to Firestore
            await saveNewSphere(personalSphere);
            console.log("[useSphereManagement] Personal sphere saved to Firestore:", personalSphere.name);
            
            // Add user to the sphere
            const updatedUser = await addUserToSphere(user.id, personalSphere.id);
            if (updatedUser) {
              console.log("[useSphereManagement] User added to personal sphere");
            }
            
            // Update local state
            setAllSpheres(prev => [...prev, personalSphere]);
            setUserSpheres([personalSphere]);
            setActiveSphere(personalSphere);
            
            console.log("[useSphereManagement] Personal sphere created and set as active:", personalSphere.name);
            return personalSphere;
          } catch (error) {
            console.error("[useSphereManagement] Failed to create personal sphere:", error);
            // Fallback to null if sphere creation fails
            setActiveSphere(null);
            setUserSpheres([]);
            return null;
          }
        }
        
        const currentActiveSphere = await getActiveSphereFromService(user, spheresToUse);
        setActiveSphere(currentActiveSphere);
        setUserSpheres(await getUserSpheresFromService(user, spheresToUse));
        
        return currentActiveSphere;
      })();
      
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      console.error("[useSphereManagement] Error fetching sphere data:", error);
      
      // Fallback to MOCK_SPHERES if there's an error
      setAllSpheres(MOCK_SPHERES);
      setActiveSphere(null);
      setUserSpheres([]);
      
      // Don't throw the error, just return null to allow navigation to continue
      return null;
    }
  }, []);

  const handleSwitchSphere = useCallback(async (sphereId: string, user: User): Promise<boolean> => {
    console.log("[useSphereManagement] Switching to sphere:", sphereId);
    
    const sphereToSwitchTo = allSpheres.find(s => s.id === sphereId);
    if (!sphereToSwitchTo) {
      console.error("[useSphereManagement] Sphere not found:", sphereId);
      return false;
    }

    // Check if user has access to this sphere
    if (!user.sphereIds.includes(sphereId)) {
      console.error("[useSphereManagement] User doesn't have access to sphere:", sphereId);
      return false;
    }

    try {
      await persistCurrentSphereId(sphereId);
      setActiveSphere(sphereToSwitchTo);
      console.log("[useSphereManagement] Successfully switched to sphere:", sphereToSwitchTo.name);
      return true;
    } catch (error) {
      console.error("[useSphereManagement] Failed to switch sphere:", error);
      return false;
    }
  }, [allSpheres]);

  const handleCreateSphere = useCallback(async (name: string, gradientColors: [string, string], user: User): Promise<SphereCreationResult> => {
    console.log("[useSphereManagement] Creating new sphere:", name);
    
    try {
      console.log("[useSphereManagement] Step 1: Creating sphere object");
      const newSphere: Sphere = {
        id: generateSphereId(),
        name,
        gradientColors,
        memberIds: [user.id],
        ownerId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPersonal: false, // Explicitly mark as not personal (or omit)
      };
      console.log("[useSphereManagement] Sphere object created:", newSphere);

      console.log("[useSphereManagement] Step 2: Saving sphere to database");
      await saveNewSphere(newSphere);
      console.log("[useSphereManagement] Sphere saved to database successfully");
      
      console.log("[useSphereManagement] Step 3: Adding user to sphere");
      const updatedUser = await addUserToSphere(user.id, newSphere.id);
      if (!updatedUser) {
        throw new Error('Failed to add user to sphere - addUserToSphere returned null');
      }
      console.log("[useSphereManagement] User added to sphere successfully:", updatedUser);
      
      console.log("[useSphereManagement] Step 4: Updating local state");
      // Update local state
      setAllSpheres(prev => [...prev, newSphere]);
      setUserSpheres(prev => [...prev, newSphere]);
      setActiveSphere(newSphere);
      
      // Also persist the new sphere as the active sphere
      await persistCurrentSphereId(newSphere.id);
      
      console.log("[useSphereManagement] Successfully created sphere:", newSphere.name);
      return { success: true, sphere: newSphere, updatedUser };
    } catch (error) {
      console.error("[useSphereManagement] Failed to create sphere:", error);
      console.error("[useSphereManagement] Error details:", {
        name,
        gradientColors,
        userId: user.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create sphere' };
    }
  }, []);

  const handleSaveSphereBackground = useCallback(async (sphereId: string, backgroundUrl: string): Promise<void> => {
    console.log("[useSphereManagement] Saving sphere background:", sphereId, backgroundUrl);
    
    try {
      await updateSphere(sphereId, { backgroundUrl });
      
      // Update local state
      setAllSpheres(prev => prev.map(sphere => 
        sphere.id === sphereId ? { ...sphere, backgroundUrl } : sphere
      ));
      setUserSpheres(prev => prev.map(sphere => 
        sphere.id === sphereId ? { ...sphere, backgroundUrl } : sphere
      ));
      setActiveSphere(prev => prev?.id === sphereId ? { ...prev, backgroundUrl } : prev);
      
      console.log("[useSphereManagement] Successfully saved sphere background");
    } catch (error) {
      console.error("[useSphereManagement] Failed to save sphere background:", error);
      throw error;
    }
  }, []);

  const handleInviteUserToSphere = useCallback(async (email: string, sphereId: string, message?: string): Promise<InvitationResult> => {
    console.log("[useSphereManagement] Inviting user to sphere:", email, sphereId);
    
    try {
      // Find the sphere to get the owner ID
      const sphere = allSpheres.find(s => s.id === sphereId);
      if (!sphere?.ownerId) {
        return { success: false, message: "Could not determine sphere owner" };
      }
      
      // Check if this is a personal sphere (only owner is member)
      if (isPersonalSphere(sphere)) {
        return { success: false, message: "Kan inte bjuda in till en personlig sfär. Skapa en ny sfär för att dela med andra." };
      }
      
      const result = await mock_inviteUserToSphereByEmail(sphere.ownerId, sphereId, email, message);
      return result;
    } catch (error) {
      console.error("[useSphereManagement] Failed to invite user:", error);
      return { success: false, message: "Failed to invite user" };
    }
  }, [allSpheres]);

  const handleRemoveUserFromSphere = useCallback(async (userIdToRemove: string, sphereId: string): Promise<boolean> => {
    console.log("[useSphereManagement] Removing user from sphere:", userIdToRemove, sphereId);
    
    try {
      const result = await removeUserFromSphere(userIdToRemove, sphereId);
      return !!result;
    } catch (error) {
      console.error("[useSphereManagement] Failed to remove user:", error);
      return false;
    }
  }, []);

  return {
    // State
    allSpheres,
    activeSphere,
    userSpheres,
    
    // Actions
    fetchUserAndSphereData,
    handleSwitchSphere,
    handleCreateSphere,
    handleSaveSphereBackground,
    handleInviteUserToSphere,
    handleRemoveUserFromSphere,
    
    // Setters
    setAllSpheres,
    setActiveSphere,
    setUserSpheres,
  };
}; 