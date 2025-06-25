import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Timeline } from './src/features/feed/components/Timeline';
import { View, User, ImageRecord, Sphere } from './types';
import { getCurrentAuthenticatedUser, addUserToSphere, mock_inviteUserToSphereByEmail, updateUserProfile, removeUserFromSphere as authRemoveUserFromSphere } from './src/features/auth/services/authService';
import { saveNewSphere, generateId as generateSphereId } from './services/storageService';
import { useModal } from './context';
import { useNavigation } from './context/NavigationContext';
import { useFeedback } from './context/FeedbackContext';
import { useAppState } from './context/AppStateContext';
import { AppRouter } from './AppRouter';
import { ModalManager } from './ModalManager';
import { FeedbackDisplay } from './components/common/FeedbackDisplay';
import { useAppLogic } from './hooks/useAppLogic';

const YOUR_LOGO_URL = "https://example.com/your-logo.png"; 

const App: React.FC = () => {
  // Core app state (not yet moved to contexts)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); 
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sphereToInviteTo, setSphereToInviteTo] = useState<Sphere | null>(null);
  const [allUsersForManageModal, setAllUsersForManageModal] = useState<User[]>([]); 

  // Use contexts
  const { currentView, viewParams, navigate, getCurrentPathForSidebar } = useNavigation();
  const { showFeedback } = useFeedback();
  const { 
    isSidebarExpanded, 
    toggleSidebar, 
    feedPostsForTimeline, 
    setFeedPostsForTimeline,
    activeFeedDate,
    letFeedDriveTimelineSync,
    mainScrollContainerRef,
    handleVisiblePostsDateChange,
    handleTimelineUserInteraction,
    handleAppScrollToPost
  } = useAppState();

  // Use extracted logic
  const {
    activeSphere,
    applyThemePreference,
    fetchUserAndSphereData,
  } = useAppLogic();

  const { modalState, closeCreateSphereModal, openInviteToSphereModal, closeInviteToSphereModal, closeLookAndFeelModal, openManageSphereModal, closeManageSphereModal, closeImageBankSettingsModal } = useModal();

  // Theme management
  useEffect(() => {
    if (currentUser?.themePreference) {
        applyThemePreference(currentUser.themePreference);
    } else {
        applyThemePreference('system');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        if (currentUser?.themePreference === 'system' || !currentUser) {
            applyThemePreference('system');
        }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentUser, applyThemePreference]);

  // Initial auth check and data load
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const user = await getCurrentAuthenticatedUser(); 
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        applyThemePreference(user.themePreference || 'system');
        const finalUser = await fetchUserAndSphereData(user);
        setCurrentUser(finalUser);

        const hash = window.location.hash.replace(/^#\/?|\/$/g, '');
        const hashPath = hash.split('?')[0];
        const authPaths = ['login', 'signup', 'confirm-email', 'forgot-password', 'complete-profile'];

        if (user.name === "Ny Användare" || hashPath === 'complete-profile') { 
             if (currentView !== View.ProfileCompletion) {
                navigate(View.ProfileCompletion, { userId: user.id }); 
             }
        } else if (!hash || authPaths.includes(hashPath)) {
            navigate(View.Home);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        navigate(View.Login);
      }
    };
    checkAuthAndLoadData();
  }, []);

  // Event handlers (not yet moved to feature hooks)
  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    applyThemePreference(user.themePreference || 'system');
    const finalUser = await fetchUserAndSphereData(user);
    setCurrentUser(finalUser);
    navigate(View.Home);
  };

  const handleProfileComplete = async (updatedUser: User) => {
    setCurrentUser(updatedUser);
    navigate(View.Home);
  };

  const handleCreateSphere = async (name: string, gradientColors: [string, string]) => {
    if (!currentUser) return;
    
    const newSphere: Sphere = {
      id: generateSphereId(),
      name,
      gradientColors,
      ownerUserId: currentUser.id,
      backgroundUrl: undefined,
    };
    
    await saveNewSphere(newSphere);
    const updatedUser = await addUserToSphere(currentUser.id, newSphere.id);
    if (updatedUser) {
      setCurrentUser(updatedUser);
      const finalUser = await fetchUserAndSphereData(updatedUser);
      setCurrentUser(finalUser);
    }
    closeCreateSphereModal();
  };

  const handleCloseInviteModal = () => {
    setSphereToInviteTo(null);
    closeInviteToSphereModal();
  };

  const handleInviteUserToSphere = async (
    inviteeEmail: string, 
    sphereIdToInviteTo?: string, 
    message?: string
  ): Promise<{success: boolean, message: string}> => {
    try {
      const sphereId = sphereIdToInviteTo || activeSphere?.id;
      if (!sphereId || !currentUser) {
        return { success: false, message: "Ingen aktiv sfär hittad eller användare inte inloggad." };
      }
      
      const result = await mock_inviteUserToSphereByEmail(currentUser.id, sphereId, inviteeEmail, message);
      if (result.success) {
        showFeedback(`Inbjudan skickad till ${inviteeEmail}`, 'success');
      }
      return result;
    } catch (error: any) {
      const errorMessage = error.message || "Ett fel uppstod vid skickning av inbjudan.";
      showFeedback(errorMessage, 'error', 5000);
      return { success: false, message: errorMessage };
    }
  };

  const handleSaveSphereBackground = async (sphereId: string, backgroundUrl: string) => {
    // Implementation would go here
    console.log("Saving sphere background:", sphereId, backgroundUrl);
  };

  const handleSaveShowImageMetadataPreference = async (show: boolean) => {
    if (!currentUser) return;
    
    const updatedUser = await updateUserProfile(currentUser.id, { showImageMetadataInBank: show });
    if (updatedUser) {
      setCurrentUser(updatedUser);
    }
  };

  const handleRemoveUserFromSphere = async (userIdToRemove: string, sphereId: string): Promise<boolean> => {
    try {
      await authRemoveUserFromSphere(userIdToRemove, sphereId);
      return true;
    } catch (error) {
      console.error("Error removing user from sphere:", error);
      return false;
    }
  };

  return (
    <>
      <div className="h-full flex">
        <Sidebar
          currentPath={getCurrentPathForSidebar()} 
          onNavigate={navigate} 
          isExpanded={isSidebarExpanded}
          onToggle={toggleSidebar}
        />
        <Header
          isSidebarExpanded={isSidebarExpanded} 
          onNavigate={navigate}
          logoUrl={YOUR_LOGO_URL.startsWith("https://example.com") ? undefined : YOUR_LOGO_URL}
        />
        <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'ml-60' : 'ml-20'} pt-16 h-full`} >
          <div className="h-full overflow-y-auto no-scrollbar" ref={mainScrollContainerRef}>
            <AppRouter
              currentView={currentView}
              viewParams={viewParams}
              isAuthenticated={isAuthenticated}
              currentUser={currentUser}
              activeSphere={activeSphere}
              allUsersForManageModal={allUsersForManageModal}
              feedPostsForTimeline={feedPostsForTimeline}
              onNavigate={navigate}
              onFeedPostsUpdate={setFeedPostsForTimeline}
              onVisiblePostsDateChange={handleVisiblePostsDateChange}
              prefillPostWithImageId={viewParams?.prefillPostWithImageId}
              scrollToPostIdFromParams={viewParams?.scrollToPostId}
              onLoginSuccess={handleLoginSuccess}
              onProfileComplete={handleProfileComplete}
            />
          </div>
        </div>
        
        {currentView === View.Home && feedPostsForTimeline.length > 0 && currentUser && activeSphere && (
          <div className="fixed top-[calc(4rem+2rem)] right-60 w-36 bottom-32 z-20 group" >
            <Timeline 
              posts={feedPostsForTimeline} 
              onScrollToPost={handleAppScrollToPost}
              activeFeedDateFromScroll={activeFeedDate} 
              letFeedDriveTimelineSync={letFeedDriveTimelineSync}
              onTimelineUserInteraction={handleTimelineUserInteraction}
            />
          </div>
        )}
      </div>
      
      <ModalManager
        modalState={modalState}
        currentUser={currentUser}
        activeSphere={activeSphere}
        sphereToInviteTo={sphereToInviteTo}
        allUsersForManageModal={allUsersForManageModal}
        isLookAndFeelModalOpen={modalState.lookAndFeel.isOpen}
        isManageSphereModalOpen={modalState.manageSphere.isOpen}
        isImageBankSettingsModalOpen={modalState.imageBankSettings.isOpen}
        onCloseCreateSphereModal={closeCreateSphereModal}
        onCloseInviteToSphereModal={handleCloseInviteModal}
        onCloseLookAndFeelModal={closeLookAndFeelModal}
        onCloseManageSphereModal={closeManageSphereModal}
        onCloseImageBankSettingsModal={closeImageBankSettingsModal}
        onCreateSphere={handleCreateSphere}
        onInviteUserToSphere={handleInviteUserToSphere}
        onSaveSphereBackground={handleSaveSphereBackground}
        onRemoveUserFromSphere={handleRemoveUserFromSphere}
        onSaveShowImageMetadataPreference={handleSaveShowImageMetadataPreference}
      />
      
      <FeedbackDisplay />
    </>
  );
};

export default App;
