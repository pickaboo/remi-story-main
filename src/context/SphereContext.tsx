import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Sphere, User } from '../types';
import { 
    getActiveSphere as getActiveSphereFromService,
    setCurrentSphereId as persistCurrentSphereId, 
    getUserSpheres as getUserSpheresFromService,
} from '../common/services/userService';
import { 
    getAllSpheres as getAllSpheresFromStorage, 
    saveNewSphere, 
    generateId as generateSphereId,
    getSphereById,
} from '../common/services/storageService';
import { 
    MOCK_SPHERES 
} from '../constants';
import { collection, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export interface SphereContextType {
  // State
  activeSphere: Sphere | null;
  userSpheres: Sphere[];
  allSpheres: Sphere[];
  
  // Functions
  setActiveSphere: (sphere: Sphere | null) => void;
  setUserSpheres: (spheres: Sphere[]) => void;
  setAllSpheres: (spheres: Sphere[]) => void;
  handleSwitchSphere: (sphereId: string) => Promise<void>;
  handleCreateSphere: (name: string, gradientColors: [string, string]) => Promise<Sphere | null>;
  fetchUserAndSphereData: (user: User) => Promise<void>;
  applyBackgroundPreference: (sphereForBackground?: Sphere | null, userForBackground?: User | null) => void;
  refreshActiveSphere: () => Promise<void>;
  refreshUserSpheres: () => Promise<void>;
  switchToSphere: (sphereId: string) => Promise<void>;
}

const SphereContext = createContext<SphereContextType | undefined>(undefined);

interface SphereProviderProps {
  children: ReactNode;
  currentUserId?: string;
}

export const SphereProvider: React.FC<SphereProviderProps> = ({ children, currentUserId }) => {
  const [activeSphere, setActiveSphere] = useState<Sphere | null>(null);
  const [userSpheres, setUserSpheres] = useState<Sphere[]>([]);
  const [allSpheres, setAllSpheres] = useState<Sphere[]>([]);

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

  const fetchUserAndSphereData = useCallback(async (user: User) => {
    console.log("[SphereContext] fetchUserAndSphereData called for user:", user.id, "with sphereIds:", user.sphereIds);
    let spheresFromStorage = await getAllSpheresFromStorage();
    setAllSpheres(spheresFromStorage.length > 0 ? spheresFromStorage : MOCK_SPHERES);
    
    const currentActiveSphere = await getActiveSphereFromService(user, spheresFromStorage);
    setActiveSphere(currentActiveSphere);
    setUserSpheres(await getUserSpheresFromService(user, spheresFromStorage));
    
    applyBackgroundPreference(currentActiveSphere, user);
  }, [applyBackgroundPreference]);

  const handleSwitchSphere = useCallback(async (sphereId: string) => {
    console.log("[SphereContext] handleSwitchSphere called with sphereId:", sphereId);
    
    const sphereToSwitchTo = allSpheres.find(s => s.id === sphereId);
    if (!sphereToSwitchTo) {
        console.error("Sphere not found:", sphereId);
        return;
    }

    try {
        await persistCurrentSphereId(sphereId);
        setActiveSphere(sphereToSwitchTo);
        applyBackgroundPreference(sphereToSwitchTo, null);
        console.log("[SphereContext] Successfully switched to sphere:", sphereToSwitchTo.name);
    } catch (error) {
        console.error("Error switching sphere:", error);
    }
  }, [allSpheres, applyBackgroundPreference]);

  const handleCreateSphere = useCallback(async (name: string, gradientColors: [string, string]): Promise<Sphere | null> => {
    try {
        const newSphereId = generateSphereId();
        const newSphere: Sphere = {
            id: newSphereId,
            name,
            gradientColors,
        };

        await saveNewSphere(newSphere);
        
        // Update local state
        setAllSpheres(prev => [...prev, newSphere]);
        setUserSpheres(prev => [...prev, newSphere]);
        setActiveSphere(newSphere);
        
        console.log("[SphereContext] Successfully created sphere:", newSphere.name);
        return newSphere;
    } catch (error) {
        console.error("Error creating sphere:", error);
        return null;
    }
  }, []);

  const refreshActiveSphere = async () => {
    if (activeSphere?.id) {
      try {
        const refreshedSphere = await getSphereById(activeSphere.id);
        if (refreshedSphere) {
          setActiveSphere(refreshedSphere);
        }
      } catch (error) {
        console.error('Failed to refresh active sphere:', error);
      }
    }
  };

  const refreshUserSpheres = async () => {
    if (currentUserId) {
      try {
        const user = { id: currentUserId } as User; // Create a minimal user object
        const spheres = await getUserSpheresFromService(user, allSpheres);
        setUserSpheres(spheres);
        
        // If no active sphere is set, set the first one as active
        if (!activeSphere && spheres.length > 0) {
          setActiveSphere(spheres[0]);
        }
      } catch (error) {
        console.error('Failed to refresh user spheres:', error);
      }
    }
  };

  const switchToSphere = async (sphereId: string) => {
    try {
      const sphere = await getSphereById(sphereId);
      if (sphere) {
        setActiveSphere(sphere);
      }
    } catch (error) {
      console.error('Failed to switch to sphere:', error);
    }
  };

  // Load user spheres when currentUserId changes
  useEffect(() => {
    console.log('[SphereContext] currentUserId changed:', currentUserId);
    if (currentUserId) {
      console.log('[SphereContext] Loading spheres for user:', currentUserId);
      refreshUserSpheres();
    } else {
      console.log('[SphereContext] No currentUserId, clearing sphere data');
      // Clear sphere data when user logs out
      setActiveSphere(null);
      setUserSpheres([]);
      // Keep allSpheres as it might be needed for other users
    }
  }, [currentUserId]);

  // One-time fetch for active sphere (replaces real-time listener)
  useEffect(() => {
    if (activeSphere && activeSphere.id) {
      const fetchSphere = async () => {
        const sphereDocRef = doc(db, 'spheres', activeSphere.id);
        const docSnap = await getDoc(sphereDocRef);
        if (docSnap.exists()) {
          const sphereData = { id: docSnap.id, ...docSnap.data() } as Sphere;
          if (JSON.stringify(sphereData) !== JSON.stringify(activeSphere)) {
            setActiveSphere(sphereData);
          }
        }
      };
      fetchSphere();
    }
  }, [activeSphere?.id]);

  const value: SphereContextType = {
    activeSphere,
    userSpheres,
    allSpheres,
    setActiveSphere,
    setUserSpheres,
    setAllSpheres,
    handleSwitchSphere,
    handleCreateSphere,
    fetchUserAndSphereData,
    applyBackgroundPreference,
    refreshActiveSphere,
    refreshUserSpheres,
    switchToSphere,
  };

  return (
    <SphereContext.Provider value={value}>
      {children}
    </SphereContext.Provider>
  );
};

export const useSphere = (): SphereContextType => {
  const context = useContext(SphereContext);
  if (context === undefined) {
    throw new Error('useSphere must be used within a SphereProvider');
  }
  return context;
}; 