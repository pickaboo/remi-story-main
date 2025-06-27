import React from 'react';
import { useUser } from './context/UserContext';
import { useAppState } from './context/AppStateContext';
import { useNavigation } from './context/NavigationContext';
import { useSphere } from './context/SphereContext';
import { useSphereManagement } from './features/spheres/hooks/useSphereManagement';
import { useAppModals } from './common/hooks/useAppModals';
import { AppRouter } from './AppRouter';
import { ModalManager } from './ModalManager';
import { FeedbackDisplay } from './common/components/FeedbackDisplay';
import { MainLayout } from './layout/MainLayout';

const App: React.FC = () => {
  // Core app state
  const { isAuthenticated, currentUser, handleLoginSuccess, handleProfileComplete } = useUser();
  const { 
    feedPostsForTimeline, 
    setFeedPostsForTimeline,
    handleVisiblePostsDateChange,
  } = useAppState();
  const { currentView, viewParams, navigate } = useNavigation();
  const { activeSphere } = useSphere();
  const { allUsersForManageModal } = useSphereManagement(currentUser);
  
  // Modal management
  const { modalManagerProps } = useAppModals(currentUser);

  return (
    <>
      <MainLayout>
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
      </MainLayout>
      
      <ModalManager {...modalManagerProps} activeSphere={activeSphere} />
      <FeedbackDisplay />
    </>
  );
};

export default App;
