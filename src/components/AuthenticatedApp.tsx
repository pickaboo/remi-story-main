import React from 'react';
import { useUser } from '../context/UserContext';
import { useAppState } from '../context/AppStateContext';
import { useNavigation } from '../context/NavigationContext';
import { useSphere } from '../context/SphereContext';
import { useSphereManagement } from '../features/spheres/hooks/useSphereManagement';
import { useAppModals } from '../common/hooks/useAppModals';
import { FeedPage } from '../pages/FeedPage';
import { EditImagePage } from '../features/imageBank/components/EditImagePage';
import { SlideshowProjectsPage } from '../features/slideshow/components/SlideshowProjectsPage';
import { SlideshowPlayerPage } from '../features/slideshow/components/SlideshowPlayerPage';
import { ImageBankPage } from '../features/imageBank/components/ImageBankPage';
import { DiaryPage } from '../features/diary/components/DiaryPage';
import { ModalManager } from '../ModalManager';
import { FeedbackDisplay } from '../common/components/FeedbackDisplay';
import { MainLayout } from '../layout/MainLayout';
import { LoadingSpinner } from '../common/components/LoadingSpinner';
import { View } from '../types';

export const AuthenticatedApp: React.FC = () => {
  // Get all needed data from contexts
  const { currentUser, handleLoginSuccess, handleProfileComplete } = useUser();
  const { 
    feedPostsForTimeline, 
    setFeedPostsForTimeline,
    handleVisiblePostsDateChange,
  } = useAppState();
  const { currentView, viewParams, navigate } = useNavigation();
  const { activeSphere } = useSphere();
  const { allUsersForManageModal } = useSphereManagement(currentUser);
  const { modalManagerProps } = useAppModals(currentUser);

  // Safety check - this component should only be rendered when user is authenticated
  if (!currentUser) {
    return null;
  }

  // Show loading spinner if sphere data is still loading
  if (!activeSphere) { 
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <LoadingSpinner message="Laddar användardata och sfär..." size="lg" />
      </div>
    );
  }

  // Render the appropriate page based on current view
  const renderPage = () => {
    switch (currentView) {
      case View.Home:
        return (
          <FeedPage 
            onNavigate={navigate}
            onFeedPostsUpdate={setFeedPostsForTimeline} 
            onVisiblePostsDateChange={handleVisiblePostsDateChange}
            prefillPostWithImageId={viewParams?.prefillPostWithImageId}
            scrollToPostIdFromParams={viewParams?.scrollToPostId}
          />
        );
      case View.ImageBank:
        return <ImageBankPage onNavigate={navigate} />;
      case View.Diary:
        return <DiaryPage />; 
      case View.EditImage:
        if (viewParams?.imageId) { 
          return <EditImagePage imageId={viewParams.imageId} onNavigate={navigate} />; 
        }
        return null;
      case View.SlideshowProjects:
        return <SlideshowProjectsPage onNavigate={navigate} />;
      case View.PlaySlideshow:
        if (viewParams?.projectId) { 
          return <SlideshowPlayerPage projectId={viewParams.projectId} onNavigate={navigate} />; 
        }
        return null;
      default: 
        return null;
    }
  };

  return (
    <>
      <MainLayout>
        {renderPage()}
      </MainLayout>
      <ModalManager {...modalManagerProps} activeSphere={activeSphere} />
      <FeedbackDisplay />
    </>
  );
}; 