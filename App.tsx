import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FeedPage } from './pages/FeedPage';
import { EditImagePage } from './pages/EditImagePage';
import { SlideshowProjectsPage } from './pages/SlideshowProjectsPage';
import { SlideshowPlayerPage } from './pages/SlideshowPlayerPage';
import { ImageBankPage } from './pages/ImageBankPage'; // Ensured correct relative path
import { DiaryPage } from './pages/DiaryPage';
import { LoginPage } from './pages/auth/LoginPage'; 
import { SignupPage } from './pages/auth/SignupPage'; 
import { EmailConfirmationPage } from './pages/auth/EmailConfirmationPage'; 
import { ProfileCompletionPage } from './pages/auth/ProfileCompletionPage';
import { CreateSphereModal } from './components/common/CreateSphereModal';
import { InviteToSphereModal } from './components/common/InviteToSphereModal';
import { LookAndFeelModal } from './components/common/LookAndFeelModal';
import { ManageSphereModal } from './components/common/ManageSphereModal'; 
import { ImageBankSettingsModal } from './components/common/ImageBankSettingsModal'; // New Modal

import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Timeline } from './components/feed/Timeline';
import { View, User, ImageRecord, Sphere, BackgroundPreference, SphereInvitation } from './types'; 
import { 
    getActiveSphere as getActiveSphereFromService,
    setCurrentSphereId as persistCurrentSphereId, 
    // setCurrentUserId, // Removed as Firebase Auth handles this
    getUserSpheres as getUserSpheresFromService,
    getUserById,
} from './services/userService';
import { 
    getAllSpheres as getAllSpheresFromStorage, 
    saveNewSphere, 
    generateId as generateSphereId, 
    getAllImages,
    getPendingInvitationsForEmail, // Added
} from './services/storageService'; 
import { 
    MOCK_SPHERES, 
    LOCAL_STORAGE_USER_THEME_PREFERENCE_KEY_PREFIX,
    LOCAL_STORAGE_USER_SHOW_IMAGE_METADATA_KEY_PREFIX, 
} from './constants'; 
import { 
    getCurrentAuthenticatedUser, 
    logout as authLogout, 
    addUserToSphere, 
    mock_inviteUserToSphereByEmail, // This uses storageCreateSphereInvitation now
    updateUserProfile, 
    getAllUsers as authGetAllUsers, 
    removeUserFromSphere as authRemoveUserFromSphere, 
    acceptSphereInvitation as authAcceptSphereInvitation, // Added
    declineSphereInvitation as authDeclineSphereInvitation, // Added
} from './services/authService'; 
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';


const YOUR_LOGO_URL = "https://example.com/your-logo.png"; 
type Theme = User['themePreference'];

const App: React.FC = () => {
  // All useState, useRef, useCallback hooks
  const [currentView, setCurrentView] = useState<View>(View.Login); 
  const [viewParams, setViewParams] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); 
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [feedPostsForTimeline, setFeedPostsForTimeline] = useState<ImageRecord[]>([]);
  const mainScrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeFeedDate, setActiveFeedDate] = useState<Date | null>(null);
  const [letFeedDriveTimelineSync, setLetFeedDriveTimelineSync] = useState(true);
  const [allSpheres, setAllSpheres] = useState<Sphere[]>([]);
  const [activeSphere, setActiveSphere] = useState<Sphere | null>(null);
  const [userSpheres, setUserSpheres] = useState<Sphere[]>([]);
  const [isCreateSphereModalOpen, setIsCreateSphereModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [sphereToInviteTo, setSphereToInviteTo] = useState<Sphere | null>(null);
  const [isLookAndFeelModalOpen, setIsLookAndFeelModalOpen] = useState(false);
  const [isManageSphereModalOpen, setIsManageSphereModalOpen] = useState(false); 
  const [isImageBankSettingsModalOpen, setIsImageBankSettingsModalOpen] = useState(false); 
  const [allUsersForManageModal, setAllUsersForManageModal] = useState<User[]>([]); 
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null); 
  const [globalFeedback, setGlobalFeedback] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // All useCallback, useEffect hooks
  const applyThemePreference = useCallback((theme: Theme) => {
    const root = document.documentElement;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (theme === 'dark' || (theme === 'system' && systemPrefersDark)) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (currentUser?.themePreference) {
        applyThemePreference(currentUser.themePreference);
    } else {
        applyThemePreference('system'); // Default if no user or no preference
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
        if (currentUser?.themePreference === 'system' || !currentUser) {
            applyThemePreference('system');
        }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentUser, applyThemePreference]);


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
    console.log("[App.tsx] fetchUserAndSphereData called for user:", userWithPotentiallyNewSphereData.id, "with sphereIds:", userWithPotentiallyNewSphereData.sphereIds);
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
    console.log("[App.tsx] Setting current user in fetchUserAndSphereData:", finalUserToSet.id, "Sphere IDs:", finalUserToSet.sphereIds);
    setCurrentUser(finalUserToSet);
    
  }, [applyBackgroundPreference]);


  // Initial auth check and data load
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const user = await getCurrentAuthenticatedUser(); 
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        // await setCurrentUserId(user.id); // This was removed
        applyThemePreference(user.themePreference || 'system');
        await fetchUserAndSphereData(user);

        const hash = window.location.hash.replace(/^#\/?|\/$/g, '');
        const hashPath = hash.split('?')[0];
        const authPaths = ['login', 'signup', 'confirm-email', 'forgot-password', 'complete-profile'];

        if (user.name === "Ny Användare" || hashPath === 'complete-profile') { 
             if (currentView !== View.ProfileCompletion) {
                handleNavigate(View.ProfileCompletion, { userId: user.id }); 
             }
        } else if (!hash || authPaths.includes(hashPath)) {
            handleNavigate(View.Home);
        } else {
            handleHashChange(); 
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setActiveSphere(null);
        setUserSpheres([]);
        let spheresFromStorage = await getAllSpheresFromStorage(); 
        setAllSpheres(spheresFromStorage.length > 0 ? spheresFromStorage : MOCK_SPHERES); 
        applyThemePreference('system'); 
        applyBackgroundPreference(null, null); 
        const authPaths = ['login', 'signup', 'forgot-password', 'confirm-email', 'complete-profile'];
        const currentHashPath = window.location.hash.replace(/^#\/?|\/$/g, '').split('/')[0].split('?')[0];
        if (!authPaths.includes(currentHashPath)) {
            handleNavigate(View.Login);
        } else {
            handleHashChange(); 
        }
      }
      setAllUsersForManageModal(await authGetAllUsers()); 
    };

    checkAuthAndLoadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyBackgroundPreference, applyThemePreference, fetchUserAndSphereData]); // Removed currentView and handleHashChange to simplify

  useEffect(() => {
    applyBackgroundPreference(activeSphere, currentUser);
  }, [activeSphere, currentUser, applyBackgroundPreference]);


  const handleLoginSuccess = async (user: User, isNewUserViaOAuthOrEmailFlow?: boolean) => {
    setCurrentUser(user); 
    setIsAuthenticated(true);
    // await setCurrentUserId(user.id); // This was removed
    applyThemePreference(user.themePreference || 'system');
    await fetchUserAndSphereData(user); // Fetch spheres and invitations
    setAllUsersForManageModal(await authGetAllUsers());
    
    if (isNewUserViaOAuthOrEmailFlow || user.name === "Ny Användare") {
      handleNavigate(View.ProfileCompletion, { userId: user.id }); 
    } else {
      handleNavigate(View.Home);
    }
  };

  const handleProfileComplete = async (updatedUser: User) => {
    setCurrentUser(updatedUser); 
    applyThemePreference(updatedUser.themePreference || 'system');
    await fetchUserAndSphereData(updatedUser); // Refresh spheres and invitation count
    handleNavigate(View.Home); 
  };

  const handleLogout = async () => {
    await authLogout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveSphere(null);
    setUserSpheres([]);
    setFeedPostsForTimeline([]);
    applyThemePreference('system');
    applyBackgroundPreference(null, null); 
    handleNavigate(View.Login);
  };
  
  const handleSwitchSphere = async (sphereId: string) => {
    console.log("[App.tsx] handleSwitchSphere called with sphereId:", sphereId);
    console.log("[App.tsx] Current user for switch check:", currentUser?.id, "Sphere IDs:", currentUser?.sphereIds);
    console.log("[App.tsx] All spheres for switch check:", allSpheres.map(s => s.id));
    
    const spheresToUse = allSpheres.length > 0 ? allSpheres : MOCK_SPHERES;
    const newSphere = spheresToUse.find(s => s.id === sphereId);

    if (newSphere) {
      console.log("[App.tsx] Found newSphere:", newSphere.name);
      if (currentUser) {
        console.log("[App.tsx] Checking if currentUser.sphereIds includes sphereId:", currentUser.sphereIds.includes(sphereId));
        if (currentUser.sphereIds.includes(sphereId)) {
          await persistCurrentSphereId(sphereId);
          setActiveSphere(newSphere);
          // We call fetchUserAndSphereData to ensure all sphere-related context is fresh with the new active sphere,
          // especially if the user object itself might need updates based on the sphere switch (e.g. sphere-specific settings if any)
          await fetchUserAndSphereData(currentUser); // Pass current user to ensure context is based on it.
          handleNavigate(View.Home);
          console.log("[App.tsx] Sphere switched successfully to:", newSphere.name);
        } else {
          console.error("[App.tsx] Sphere switch failed: currentUser.sphereIds does NOT include sphereId.", {
            sphereIdToSwitchTo: sphereId,
            currentUserSphereIds: currentUser.sphereIds,
            activeSphereId: activeSphere?.id,
            userSpheresFromState: userSpheres.map(s=>s.id)
          });
           // As a fallback, try to refetch user data in case of staleness, then retry or inform user.
          // await fetchUserAndSphereData(currentUser); 
          setGlobalFeedback({ message: "Kunde inte byta sfär. Användarens sfärdata kan vara inaktuell.", type: 'error' });
          setTimeout(() => setGlobalFeedback(null), 5000);
        }
      } else {
        console.error("[App.tsx] Sphere switch failed: currentUser is null.");
      }
    } else {
      console.error("[App.tsx] Sphere switch failed: newSphere not found for sphereId:", sphereId, "in spheresToUse:", spheresToUse.map(s=>s.id));
    }
  };

  const handleOpenCreateSphereModal = () => setIsCreateSphereModalOpen(true);
  const handleCloseCreateSphereModal = () => setIsCreateSphereModalOpen(false);
  const handleCreateSphere = async (name: string, gradientColors: [string, string]) => {
    if (!currentUser) throw new Error("Du måste vara inloggad för att skapa en sfär.");
    const newSphereId = generateSphereId();
    const newSphere: Sphere = { id: newSphereId, name, gradientColors, ownerUserId: currentUser.id };
    await saveNewSphere(newSphere);
    const updatedUser = await addUserToSphere(currentUser.id, newSphereId);
    if (!updatedUser) throw new Error("Kunde inte lägga till sfären till användaren.");
    
    await fetchUserAndSphereData(updatedUser); 
    setAllUsersForManageModal(await authGetAllUsers());
    
    const currentActiveSphere = await getActiveSphereFromService(updatedUser, await getAllSpheresFromStorage());
    setActiveSphere(currentActiveSphere);
    if (currentActiveSphere) await persistCurrentSphereId(currentActiveSphere.id);
    
    handleCloseCreateSphereModal();
    if (currentView !== View.Home) handleNavigate(View.Home);
  };

  const handleOpenInviteModal = (sphere: Sphere) => {
    setSphereToInviteTo(sphere); setIsInviteModalOpen(true);
  };
  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false); setSphereToInviteTo(null);
  };
  
  const handleInviteUserToSphere = async (
    inviteeEmail: string, 
    sphereIdToInviteTo?: string, 
    message?: string // Added message parameter
  ): Promise<{success: boolean, message: string}> => {
    const targetSphereId = sphereIdToInviteTo || sphereToInviteTo?.id;
    if (!currentUser || !targetSphereId) {
      return { success: false, message: "Fel: Ingen användare inloggad eller ingen sfär vald för inbjudan." };
    }
    const result = await mock_inviteUserToSphereByEmail(
      currentUser.id, 
      targetSphereId, 
      inviteeEmail, 
      message // Pass message
    );
    // Feedback is now handled locally in the modals
    // setInviteFeedback(result.message); 
    if (result.success) { 
        // If an invite might change member status, refresh allUsers for ManageSphereModal
        setAllUsersForManageModal(await authGetAllUsers()); 
    }
    return result;
  };

  const handleOpenLookAndFeelModal = () => setIsLookAndFeelModalOpen(true);
  const handleCloseLookAndFeelModal = () => setIsLookAndFeelModalOpen(false);
  
  const handleSaveSphereBackground = async (sphereId: string, backgroundUrl: string) => {
    if (!activeSphere || activeSphere.id !== sphereId) {
        setGlobalFeedback({ message: "Fel: Kan inte ändra bakgrund för en inaktiv sfär.", type: 'error'});
        setTimeout(() => setGlobalFeedback(null), 3000);
        return;
    }
    const updatedSphere = { ...activeSphere, backgroundUrl };
    await saveNewSphere(updatedSphere); 
    
    setAllSpheres(prevAllSpheres => 
        prevAllSpheres.map(s => s.id === sphereId ? updatedSphere : s)
    );
    setActiveSphere(updatedSphere); 
    applyBackgroundPreference(updatedSphere, currentUser); 
    
    setGlobalFeedback({ message: `Bakgrund för sfären "${updatedSphere.name}" uppdaterad!`, type: 'success' });
    setTimeout(() => setGlobalFeedback(null), 3000);
  };

  const handleSaveThemePreference = async (theme: Theme) => {
    if (!currentUser) {
        setGlobalFeedback({message: "Ingen användare inloggad.", type: 'error'});
        setTimeout(() => setGlobalFeedback(null), 3000);
        return Promise.reject("No current user");
    }
    const updatedUser = await updateUserProfile(currentUser.id, { themePreference: theme });
    if (updatedUser) {
        setCurrentUser(updatedUser);
        applyThemePreference(theme); 
        localStorage.setItem(`${LOCAL_STORAGE_USER_THEME_PREFERENCE_KEY_PREFIX}${currentUser.id}`, theme || 'system');
        setGlobalFeedback({ message: "Temainställning sparad!", type: 'success' });
        setTimeout(() => setGlobalFeedback(null), 3000);
        return Promise.resolve();
    } else {
        setGlobalFeedback({ message: "Kunde inte spara temainställning.", type: 'error'});
        setTimeout(() => setGlobalFeedback(null), 3000);
        return Promise.reject("Failed to update user profile for theme");
    }
  };

  const handleSaveShowImageMetadataPreference = async (show: boolean) => {
    if (!currentUser) {
      setGlobalFeedback({ message: "Ingen användare inloggad.", type: 'error' });
      setTimeout(() => setGlobalFeedback(null), 3000);
      return;
    }
    const updatedUser = await updateUserProfile(currentUser.id, { showImageMetadataInBank: show });
    if (updatedUser) {
      setCurrentUser(updatedUser);
      localStorage.setItem(`${LOCAL_STORAGE_USER_SHOW_IMAGE_METADATA_KEY_PREFIX}${currentUser.id}`, show.toString());
      setGlobalFeedback({ message: "Inställning för bildmetadata sparad!", type: 'success' });
      setTimeout(() => setGlobalFeedback(null), 3000);
    } else {
      setGlobalFeedback({ message: "Kunde inte spara inställning för bildmetadata.", type: 'error' });
      setTimeout(() => setGlobalFeedback(null), 3000);
    }
  };


  const handleOpenManageSphereModal = async () => {
    setAllUsersForManageModal(await authGetAllUsers()); 
    setIsManageSphereModalOpen(true);
  };
  const handleCloseManageSphereModal = () => setIsManageSphereModalOpen(false);

  const handleOpenImageBankSettingsModal = () => setIsImageBankSettingsModalOpen(true); 
  const handleCloseImageBankSettingsModal = () => setIsImageBankSettingsModalOpen(false); 

  const handleRemoveUserFromSphere = async (userIdToRemove: string, sphereId: string): Promise<boolean> => {
    if (!currentUser || !activeSphere || sphereId !== activeSphere.id) return false;
    if (userIdToRemove === activeSphere.ownerUserId && userIdToRemove === currentUser.id) {
        alert("Ägare kan inte ta bort sig själva från sfären här.");
        return false;
    }
    const updatedUserRecord = await authRemoveUserFromSphere(userIdToRemove, sphereId);
    if (updatedUserRecord) {
        setAllUsersForManageModal(await authGetAllUsers()); 
        if (userIdToRemove === currentUser.id) { // If current user removed themselves
            await fetchUserAndSphereData(updatedUserRecord); // Refresh their data fully
            if (!updatedUserRecord.sphereIds.includes(activeSphere.id)) { // If no longer in current sphere
                const newActive = await getActiveSphereFromService(updatedUserRecord, allSpheres);
                if (newActive) {
                    setActiveSphere(newActive); 
                    await persistCurrentSphereId(newActive.id); 
                } else {
                    await handleLogout(); // No spheres left, log out
                }
            }
        }
        setGlobalFeedback({message: `Användare borttagen från sfären "${activeSphere.name}".`, type: 'success'});
        setTimeout(() => setGlobalFeedback(null), 3000);
        return true;
    }
    setGlobalFeedback({message: "Kunde inte ta bort användare.", type: 'error'});
    setTimeout(() => setGlobalFeedback(null), 3000);
    return false;
  };
  
  const handleNavigate = (viewOrPath: View | string, params?: any) => {
    let pathSegment = '';
    let fullHashPath = '';
    let queryParamsString = '';

    const targetView = typeof viewOrPath === 'string' && viewOrPath.startsWith('#') 
        ? viewOrPath.substring(1).split('?')[0] 
        : viewOrPath as View;

    switch(targetView) {
        case View.Home: pathSegment = ''; break;
        case View.ImageBank: pathSegment = 'image-bank'; break;
        case View.Diary: pathSegment = 'diary'; break;
        case View.EditImage: pathSegment = 'images/edit'; break;
        case View.SlideshowProjects: pathSegment = 'projects'; break;
        case View.PlaySlideshow: pathSegment = 'projects/play'; break;
        case View.Login: pathSegment = 'login'; break;
        case View.Signup: pathSegment = 'signup'; break;
        case View.ForgotPassword: pathSegment = 'forgot-password'; break;
        case View.EmailConfirmation: pathSegment = 'confirm-email'; break;
        case View.ProfileCompletion: pathSegment = 'complete-profile'; break;
        case 'login': case 'signup': case 'forgot-password': case 'confirm-email': case 'complete-profile':
            pathSegment = targetView;
            break;
        default: pathSegment = ''; 
    }

    fullHashPath = pathSegment;

    if (params) {
        const query = new URLSearchParams();
        if (targetView === View.EditImage && params.imageId) {
            fullHashPath = `${pathSegment}/${params.imageId}`;
        } else if (targetView === View.PlaySlideshow && params.projectId) {
            fullHashPath = `${pathSegment}/${params.projectId}`;
        } else if (targetView === View.Home) {
            if (params.prefillPostWithImageId) query.set('prefillPostWithImageId', params.prefillPostWithImageId);
            if (params.scrollToPostId) query.set('scrollToPostId', params.scrollToPostId);
        } else if (targetView === View.EmailConfirmation && params.email) {
            query.set('email', params.email);
        } else if (targetView === View.ProfileCompletion && params.userId) {
             query.set('userId', params.userId); 
        }
        
        const queryStringFromParams = query.toString();
        if(queryStringFromParams) queryParamsString = `?${queryStringFromParams}`;
    }
    
    const targetHash = fullHashPath + queryParamsString;
    const currentHashWithQuery = window.location.hash.replace(/^#\/?|\/$/g, '');
    
    if (currentHashWithQuery !== targetHash) {
        window.location.hash = targetHash;
    } else {
        let viewEnumToSet: View = View.Home; 
        const pathIsViewString = typeof targetView === 'string' ? targetView : View[targetView as keyof typeof View];
        const viewKey = Object.keys(View).find(key => View[key as keyof typeof View].toLowerCase().replace(/_/g, '-') === pathIsViewString.toLowerCase().replace(/_/g, '-'));
        if (viewKey) viewEnumToSet = View[viewKey as keyof typeof View];
        
        setCurrentView(viewEnumToSet);
        setViewParams(params); 
        if (viewEnumToSet !== View.Home) { 
          setFeedPostsForTimeline([]);
          setActiveFeedDate(null); 
          setLetFeedDriveTimelineSync(true); 
        }
    }
  };

  const handleHashChange = useCallback(() => {
    const hashContent = window.location.hash.replace(/^#\/?|\/$/g, '');
    const [pathString, queryString] = hashContent.split('?');
    const pathParts = pathString.split('/');
    const viewPath = pathParts[0] || '';
    
    let viewName: View;
    let params: any = {};

    if (queryString) {
        const query = new URLSearchParams(queryString);
        if (query.has('prefillPostWithImageId')) params.prefillPostWithImageId = query.get('prefillPostWithImageId');
        if (query.has('scrollToPostId')) params.scrollToPostId = query.get('scrollToPostId');
        if (query.has('email')) params.email = query.get('email'); 
        if (query.has('userId')) params.userId = query.get('userId'); 
    }

    switch(viewPath) {
        case '': viewName = isAuthenticated ? View.Home : View.Login; break;
        case 'image-bank': viewName = View.ImageBank; break;
        case 'diary': viewName = View.Diary; break;
        case 'images':
            if (pathParts[1] === 'edit' && pathParts[2]) { viewName = View.EditImage; params.imageId = pathParts[2]; } 
            else { viewName = isAuthenticated ? View.Home : View.Login; }
            break;
        case 'projects':
            if (pathParts[1] === 'play' && pathParts[2]) { viewName = View.PlaySlideshow; params.projectId = pathParts[2]; } 
            else { viewName = View.SlideshowProjects; }
            break;
        case 'login': viewName = View.Login; break;
        case 'signup': viewName = View.Signup; break;
        case 'forgot-password': viewName = View.ForgotPassword; break;
        case 'confirm-email': viewName = View.EmailConfirmation; break;
        case 'complete-profile': viewName = View.ProfileCompletion; break;
        default: viewName = isAuthenticated ? View.Home : View.Login;
    }
    
    const authViews = [View.Login, View.Signup, View.ForgotPassword, View.EmailConfirmation];
    
    if (isAuthenticated && authViews.includes(viewName)) { 
        if (viewName !== View.ProfileCompletion) { // Allow profile completion if already auth (e.g. OAuth new user)
             setCurrentView(View.Home); setViewParams({}); window.location.hash = ''; 
             return;
        }
    } else if (!isAuthenticated && !authViews.includes(viewName) && viewName !== View.ProfileCompletion) {
        setCurrentView(View.Login); setViewParams({}); window.location.hash = 'login'; 
        return;
    }

    setCurrentView(viewName);
    setViewParams(params);

    if (viewName !== View.Home && isAuthenticated) { 
        setFeedPostsForTimeline([]); setActiveFeedDate(null); setLetFeedDriveTimelineSync(true); 
    }
  }, [isAuthenticated]); 

  useEffect(() => {
    window.addEventListener('hashchange', handleHashChange);
    if (isAuthenticated !== null) { 
        handleHashChange();
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [handleHashChange, isAuthenticated]);

  const handleAcceptSphereInvitation = async (invitationId: string) => {
    if (!currentUser) return;
    const updatedUser = await authAcceptSphereInvitation(invitationId, currentUser);
    if (updatedUser) {
        await fetchUserAndSphereData(updatedUser); // Refreshes currentUser, spheres, invitation count
        setGlobalFeedback({message: "Inbjudan accepterad!", type: 'success'});
        setTimeout(() => setGlobalFeedback(null), 3000);
    } else {
        setGlobalFeedback({message: "Kunde inte acceptera inbjudan.", type: 'error'});
        setTimeout(() => setGlobalFeedback(null), 3000);
        // Also refresh to ensure invitation list is up-to-date even on failure
        if (currentUser.email) {
            const pendingInvites = await getPendingInvitationsForEmail(currentUser.email);
            await updateUserProfile(currentUser.id, { pendingInvitationCount: pendingInvites.length });
        }
    }
  };

  const handleDeclineSphereInvitation = async (invitationId: string) => {
    if (!currentUser || !currentUser.email) return;
    const declined = await authDeclineSphereInvitation(invitationId);
    if (declined) {
        const pendingInvites = await getPendingInvitationsForEmail(currentUser.email);
        const updatedUser = await updateUserProfile(currentUser.id, { pendingInvitationCount: pendingInvites.length });
        if (updatedUser) setCurrentUser(updatedUser); // Update user with new count
        setGlobalFeedback({message: "Inbjudan nekad.", type: 'success'});
        setTimeout(() => setGlobalFeedback(null), 3000);
    } else {
        setGlobalFeedback({message: "Kunde inte neka inbjudan.", type: 'error'});
        setTimeout(() => setGlobalFeedback(null), 3000);
    }
  };


  const handleFeedPostsUpdate = useCallback((updatedPosts: ImageRecord[]) => {
    setFeedPostsForTimeline(updatedPosts);
  }, []);

  const handleAppScrollToPost = (postId: string) => {
    if (mainScrollContainerRef.current) {
      const element = mainScrollContainerRef.current.querySelector(`#post-item-${postId}`) as HTMLElement;
      if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }
  };
  
  const handleVisiblePostsDateChange = useCallback((date: Date | null) => {
    setActiveFeedDate(date);
    setLetFeedDriveTimelineSync(true);
  }, []);

  const handleTimelineUserInteraction = useCallback(() => {
    setLetFeedDriveTimelineSync(false); 
  }, []);

  const renderAuthView = () => {
     switch (currentView) {
      case View.Login:
        return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={handleNavigate} />;
      case View.Signup:
        return <SignupPage onLoginSuccess={handleLoginSuccess} onNavigate={handleNavigate} />;
      case View.EmailConfirmation:
        return <EmailConfirmationPage email={viewParams?.email} onLoginSuccess={handleLoginSuccess} onNavigate={handleNavigate} />;
      case View.ProfileCompletion:
        const userForProfile = viewParams?.userId ? allUsersForManageModal.find(u=>u.id === viewParams.userId) || currentUser : currentUser;
        if (userForProfile) { 
            return <ProfileCompletionPage initialUser={userForProfile} onProfileComplete={handleProfileComplete} onNavigate={handleNavigate} />;
        }
        console.warn("ProfileCompletion: User data not available, redirecting to login.");
        handleNavigate(View.Login); 
        return <LoadingSpinner message="Laddar profildata..." />;
      default:
        if (!isAuthenticated) {
            const authPaths = ['login', 'signup', 'forgot-password', 'confirm-email', 'complete-profile'];
            const currentHashPath = window.location.hash.replace(/^#\/?|\/$/g, '').split('?')[0];
            if (!authPaths.includes(currentHashPath)){
                handleNavigate(View.Login); 
                return <LoadingSpinner message="Omdirigerar till inloggning..." />;
            }
        }
        return null; 
    }
  }

  const renderMainAppView = () => {
    if (!currentUser || !activeSphere) { 
        return (
            <div className="flex items-center justify-center h-screen w-full">
                <LoadingSpinner message="Laddar användardata och sfär..." size="lg" />
            </div>
        );
    }
    switch (currentView) {
      case View.Home:
        return <FeedPage 
                  onNavigate={handleNavigate} currentUser={currentUser} activeSphere={activeSphere} 
                  onFeedPostsUpdate={handleFeedPostsUpdate} onVisiblePostsDateChange={handleVisiblePostsDateChange}
                  prefillPostWithImageId={viewParams?.prefillPostWithImageId}
                  scrollToPostIdFromParams={viewParams?.scrollToPostId}
                />;
      case View.ImageBank:
        return <ImageBankPage currentUser={currentUser} activeSphere={activeSphere} onNavigate={handleNavigate} />;
      case View.Diary:
        return <DiaryPage currentUser={currentUser} />; 
      case View.EditImage:
        if (viewParams?.imageId) { return <EditImagePage imageId={viewParams.imageId} onNavigate={handleNavigate} currentUser={currentUser} />; }
        handleNavigate(View.Home); return null;
      case View.SlideshowProjects:
        return <SlideshowProjectsPage onNavigate={handleNavigate} currentUser={currentUser} activeSphere={activeSphere} />;
      case View.PlaySlideshow:
        if (viewParams?.projectId) { return <SlideshowPlayerPage projectId={viewParams.projectId} onNavigate={handleNavigate} />; }
        handleNavigate(View.SlideshowProjects); return null;
      default: 
        const authViewsDefault = [View.Login, View.Signup, View.ForgotPassword, View.EmailConfirmation, View.ProfileCompletion];
        if (authViewsDefault.includes(currentView)) {
             if (currentView !== View.ProfileCompletion) { 
                handleNavigate(View.Home);
                return null;
            }
        }
        console.warn("Unhandled authenticated view in renderMainAppView:", currentView, "defaulting to Home.");
        handleNavigate(View.Home);
        return null;
    }
  };

  const getCurrentPathForSidebar = () => {
    const hash = window.location.hash.replace(/^#\/?|\/$/g, '');
    const basePath = hash.split('/')[0].split('?')[0]; 
    if (basePath === 'projects') return '/projects';
    if (basePath === 'image-bank') return '/image-bank';
    if (basePath === 'diary') return '/diary';
    if (basePath === '') return '/'; 
    return `/${basePath}`; 
  }

  const toggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);
  
  if (isAuthenticated === null) { 
    return ( <div className="fixed inset-0 flex items-center justify-center bg-light-bg dark:bg-slate-900"> <LoadingSpinner message="Autentiserar..." size="lg" /> </div> );
  }

  const isAuthFlowView = [View.Login, View.Signup, View.ForgotPassword, View.EmailConfirmation, View.ProfileCompletion].includes(currentView);

  if (!isAuthenticated || isAuthFlowView) {
    const authContent = renderAuthView();
    if (authContent) return authContent;
    if (!isAuthenticated) { 
        handleNavigate(View.Login); 
        return <LoadingSpinner message="Omdirigerar..." />; 
    }
  }

  return (
    <>
      <div className="h-full flex">
        <Sidebar
          currentPath={getCurrentPathForSidebar()} 
          onNavigate={handleNavigate} 
          isExpanded={isSidebarExpanded}
          onToggle={toggleSidebar}
        />
        <Header
            isSidebarExpanded={isSidebarExpanded} 
            onNavigate={handleNavigate}
            logoUrl={YOUR_LOGO_URL.startsWith("https://example.com") ? undefined : YOUR_LOGO_URL}
          />
        <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'ml-60' : 'ml-20'} pt-16 h-full`} >
          <div className="h-full overflow-y-auto no-scrollbar" ref={mainScrollContainerRef}>
            {renderMainAppView()}
          </div>
        </div>
        
        {currentView === View.Home && feedPostsForTimeline.length > 0 && currentUser && activeSphere && (
            <div className="fixed top-[calc(4rem+2rem)] right-60 w-36 bottom-32 z-20 group" >
              <Timeline 
                posts={feedPostsForTimeline} onScrollToPost={handleAppScrollToPost}
                activeFeedDateFromScroll={activeFeedDate} letFeedDriveTimelineSync={letFeedDriveTimelineSync}
                onTimelineUserInteraction={handleTimelineUserInteraction}
              />
            </div>
          )}
      </div>
      {currentUser && (
        <CreateSphereModal
          isOpen={isCreateSphereModalOpen}
          onClose={handleCloseCreateSphereModal}
          onCreateSphere={handleCreateSphere}
        />
      )}
      {currentUser && sphereToInviteTo && ( 
        <InviteToSphereModal
          isOpen={isInviteModalOpen}
          onClose={handleCloseInviteModal}
          onInvite={(email, message) => handleInviteUserToSphere(email, sphereToInviteTo.id, message)} // Pass message
          sphereToInviteTo={sphereToInviteTo}
        />
      )}
      {currentUser && activeSphere && isLookAndFeelModalOpen && (
        <LookAndFeelModal
          isOpen={isLookAndFeelModalOpen}
          onClose={handleCloseLookAndFeelModal}
          activeSphere={activeSphere}
          currentUser={currentUser}
          onSaveSphereBackground={handleSaveSphereBackground}
        />
      )}
      {currentUser && activeSphere && isManageSphereModalOpen && (
        <ManageSphereModal
            isOpen={isManageSphereModalOpen}
            onClose={handleCloseManageSphereModal}
            activeSphere={activeSphere}
            currentUser={currentUser}
            allUsers={allUsersForManageModal}
            onInviteUser={(email, sphereId, message) => handleInviteUserToSphere(email, sphereId, message)} // Pass message
            onRemoveUserFromSphere={handleRemoveUserFromSphere}
        />
      )}
      {currentUser && isImageBankSettingsModalOpen && ( 
        <ImageBankSettingsModal
            isOpen={isImageBankSettingsModalOpen}
            onClose={handleCloseImageBankSettingsModal}
            currentUser={currentUser}
            onSaveShowImageMetadataPreference={handleSaveShowImageMetadataPreference}
        />
      )}
      {globalFeedback && (
        <div 
          className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-xl text-white z-[200]
                      ${globalFeedback.type === 'success' ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'}`}
        >
          {globalFeedback.message}
        </div>
      )}
    </>
  );
};

export default App;
