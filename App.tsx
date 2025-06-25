import React from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Timeline } from './src/features/feed/components/Timeline';
import { View } from './types';
import { useModal } from './context';
import { useNavigation } from './context/NavigationContext';
import { useFeedback } from './context/FeedbackContext';
import { useAppState } from './context/AppStateContext';
import { useAuth } from './src/features/auth/hooks/useAuth';
import { useSphereManagement } from './src/features/spheres/hooks/useSphereManagement';
import { AppRouter } from './AppRouter';
import { ModalManager } from './ModalManager';
import { FeedbackDisplay } from './components/common/FeedbackDisplay';
import { useAppLogic } from './hooks/useAppLogic';

const YOUR_LOGO_URL = "https://example.com/your-logo.png"; 

const App: React.FC = () => {
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
  const { activeSphere } = useAppLogic();

  // Use feature hooks
  const { isAuthenticated, currentUser, setCurrentUser, handleLoginSuccess, handleProfileComplete } = useAuth();
  const { 
    sphereToInviteTo, 
    setSphereToInviteTo,
    allUsersForManageModal, 
    setAllUsersForManageModal,
    handleCreateSphere,
    handleInviteUserToSphere,
    handleSaveSphereBackground,
    handleSaveShowImageMetadataPreference,
    handleRemoveUserFromSphere
  } = useSphereManagement(currentUser);

  const { modalState, closeCreateSphereModal, openInviteToSphereModal, closeInviteToSphereModal, closeLookAndFeelModal, openManageSphereModal, closeManageSphereModal, closeImageBankSettingsModal } = useModal();

  const handleCloseInviteModal = () => {
    setSphereToInviteTo(null);
    closeInviteToSphereModal();
  };

  const handleCreateSphereWithUpdate = async (name: string, gradientColors: [string, string]) => {
    const updatedUser = await handleCreateSphere(name, gradientColors);
    if (updatedUser) {
      setCurrentUser(updatedUser);
    }
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
    const updatedUser = await handleSaveShowImageMetadataPreference(show);
    if (updatedUser) {
      setCurrentUser(updatedUser);
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
        onCreateSphere={handleCreateSphereWithUpdate}
        onInviteUserToSphere={handleInviteUserToSphereWithActiveSphere}
        onSaveSphereBackground={handleSaveSphereBackground}
        onRemoveUserFromSphere={handleRemoveUserFromSphere}
        onSaveShowImageMetadataPreference={handleSaveShowImageMetadataPreferenceWithUpdate}
      />
      
      <FeedbackDisplay />
    </>
  );
};

export default App;
