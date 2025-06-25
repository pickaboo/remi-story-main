import { useState, useEffect, useCallback } from 'react';
import { User, Sphere } from '../types';
import { getActiveSphere as getActiveSphereFromService, setCurrentSphereId as persistCurrentSphereId, getUserSpheres as getUserSpheresFromService } from '../services/userService';
import { getAllSpheres as getAllSpheresFromStorage, getPendingInvitationsForEmail } from '../services/storageService';
import { updateUserProfile } from '../src/features/auth/services/authService';
import { MOCK_SPHERES } from '../constants';

type Theme = User['themePreference'];

export const useAppLogic = () => {
  const [allSpheres, setAllSpheres] = useState<Sphere[]>([]);
  const [activeSphere, setActiveSphere] = useState<Sphere | null>(null);
  const [userSpheres, setUserSpheres] = useState<Sphere[]>([]);

  const applyThemePreference = useCallback((theme: Theme) => {
    const root = document.documentElement;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (theme === 'dark' || (theme === 'system' && systemPrefersDark)) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
  }, []);

  const applyBackgroundPreference = useCallback((sphereForBackground?: Sphere | null, userForBackground?: User | null) => {
    const pageBackground = document.getElementById('page-background');
    const body = document.body;
    
    if (!pageBackground) return;

    // 1. Reset dynamic styles and classes
    pageBackground.style.backgroundImage = '';
    pageBackground.className = ''; 
    pageBackground.style.display = 'block'; 

    body.style.backgroundColor = ''; 
    body.classList.remove('solid-background-transition');
    body.classList.remove('bg-light-bg', 'dark:bg-slate-900');

    let preferenceApplied = false; 
    let isImageBackground = false; 

    if (sphereForBackground?.backgroundUrl) {
        pageBackground.style.backgroundImage = `url('${sphereForBackground.backgroundUrl}')`;
        pageBackground.classList.add('kenburns-zoom-in');
        isImageBackground = true;
        preferenceApplied = true;
    } 
    else if (userForBackground?.backgroundPreference) {
        const userPref = userForBackground.backgroundPreference;
        if (userPref.type === 'url' && userPref.value) {
            pageBackground.style.backgroundImage = `url('${userPref.value}')`;
            pageBackground.classList.add('kenburns-pan-tl-br');
            isImageBackground = true;
            preferenceApplied = true;
        } else if (userPref.type === 'color' && userPref.value) {
            body.style.backgroundColor = userPref.value;
            body.classList.add('solid-background-transition');
            pageBackground.style.display = 'none'; 
            isImageBackground = false; 
            preferenceApplied = true;
        }
    }

    if (!preferenceApplied) { 
        pageBackground.style.backgroundImage = `url('https://cdn.pixabay.com/photo/2021/04/02/19/13/sea-6145800_1280.jpg')`;
        pageBackground.classList.add('kenburns-pan-br-tl');
        isImageBackground = true; 
    }

    if (isImageBackground) {
        // Body Tailwind classes stay removed (transparent). page-background is visible.
    } else {
        const isUserSolidColorApplied = userForBackground?.backgroundPreference?.type === 'color' && userForBackground?.backgroundPreference?.value;
        if (!isUserSolidColorApplied) {
            body.classList.add('bg-light-bg', 'dark:bg-slate-900'); 
            pageBackground.style.display = 'none'; 
        }
    }
  }, []);

  const fetchUserAndSphereData = useCallback(async (userWithPotentiallyNewSphereData: User) => {
    console.log("[useAppLogic] fetchUserAndSphereData called for user:", userWithPotentiallyNewSphereData.id, "with sphereIds:", userWithPotentiallyNewSphereData.sphereIds);
    let spheresFromStorage = await getAllSpheresFromStorage();
    setAllSpheres(spheresFromStorage.length > 0 ? spheresFromStorage : MOCK_SPHERES);
    
    const currentActiveSphere = await getActiveSphereFromService(userWithPotentiallyNewSphereData, spheresFromStorage);
    setActiveSphere(currentActiveSphere);
    setUserSpheres(await getUserSpheresFromService(userWithPotentiallyNewSphereData, spheresFromStorage));
    
    applyBackgroundPreference(currentActiveSphere, userWithPotentiallyNewSphereData);
    
    let finalUserToSet = userWithPotentiallyNewSphereData;

    if (userWithPotentiallyNewSphereData.email) {
        const pendingInvites = await getPendingInvitationsForEmail(userWithPotentiallyNewSphereData.email);
        const needsInviteCountUpdate = userWithPotentiallyNewSphereData.pendingInvitationCount !== pendingInvites.length ||
                                      (userWithPotentiallyNewSphereData.pendingInvitationCount === undefined && pendingInvites.length > 0);

        if (needsInviteCountUpdate) {
            const updatedUserForInviteCount = await updateUserProfile(userWithPotentiallyNewSphereData.id, { pendingInvitationCount: pendingInvites.length });
            if (updatedUserForInviteCount) {
                // Ensure the updatedUserForInviteCount also reflects any new sphereIds from userWithPotentiallyNewSphereData
                finalUserToSet = { ...updatedUserForInviteCount, sphereIds: userWithPotentiallyNewSphereData.sphereIds };
            }
        }
    }
    console.log("[useAppLogic] Setting current user in fetchUserAndSphereData:", finalUserToSet.id, "Sphere IDs:", finalUserToSet.sphereIds);
    
    return finalUserToSet;
  }, [applyBackgroundPreference]);

  const handleSwitchSphere = useCallback(async (sphereId: string) => {
    if (!activeSphere || activeSphere.id === sphereId) return;
    
    try {
      await persistCurrentSphereId(sphereId);
      const newActiveSphere = allSpheres.find(s => s.id === sphereId);
      if (newActiveSphere) {
        setActiveSphere(newActiveSphere);
        applyBackgroundPreference(newActiveSphere, null); // Pass null for user to use sphere background
      }
    } catch (error) {
      console.error("Error switching sphere:", error);
    }
  }, [activeSphere, allSpheres, applyBackgroundPreference]);

  return {
    allSpheres,
    activeSphere,
    userSpheres,
    applyThemePreference,
    applyBackgroundPreference,
    fetchUserAndSphereData,
    handleSwitchSphere,
  };
}; 