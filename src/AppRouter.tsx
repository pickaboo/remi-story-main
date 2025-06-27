import React from 'react';
import { FeedPage } from './pages/FeedPage';
import { EditImagePage } from './features/imageBank/components/EditImagePage';
import { SlideshowProjectsPage } from './features/slideshow/components/SlideshowProjectsPage';
import { SlideshowPlayerPage } from './features/slideshow/components/SlideshowPlayerPage';
import { ImageBankPage } from './features/imageBank/components/ImageBankPage';
import { DiaryPage } from './features/diary/components/DiaryPage';
import { LoginPage, SignupPage, EmailConfirmationPage, ProfileCompletionPage } from './features/auth';
import { LoadingSpinner } from './common/components/LoadingSpinner';
import { View, User, ImageRecord } from './types';

interface AppRouterProps {
  currentView: View;
  viewParams: any;
  isAuthenticated: boolean | null;
  currentUser: User | null;
  activeSphere: any;
  allUsersForManageModal: User[];
  feedPostsForTimeline: ImageRecord[];
  onNavigate: (viewOrPath: View | string, params?: any) => void;
  onFeedPostsUpdate: (posts: ImageRecord[]) => void;
  onVisiblePostsDateChange: (date: Date | null) => void;
  prefillPostWithImageId?: string | null;
  scrollToPostIdFromParams?: string;
  onLoginSuccess: (user: User, isNewUserViaOAuthOrEmailFlow?: boolean) => void;
  onProfileComplete: (updatedUser: User) => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({
  currentView,
  viewParams,
  isAuthenticated,
  currentUser,
  activeSphere,
  allUsersForManageModal,
  feedPostsForTimeline,
  onNavigate,
  onFeedPostsUpdate,
  onVisiblePostsDateChange,
  prefillPostWithImageId,
  scrollToPostIdFromParams,
  onLoginSuccess,
  onProfileComplete,
}) => {
  const renderAuthView = () => {
    switch (currentView) {
      case View.Login:
        return <LoginPage onLoginSuccess={onLoginSuccess} onNavigate={onNavigate} />;
      case View.Signup:
        return <SignupPage onLoginSuccess={onLoginSuccess} onNavigate={onNavigate} />;
      case View.EmailConfirmation:
        return <EmailConfirmationPage email={viewParams?.email} onLoginSuccess={onLoginSuccess} onNavigate={onNavigate} />;
      case View.ProfileCompletion:
        const userForProfile = viewParams?.userId ? allUsersForManageModal.find(u=>u.id === viewParams.userId) || currentUser : currentUser;
        if (userForProfile) { 
            return <ProfileCompletionPage initialUser={userForProfile} onProfileComplete={onProfileComplete} onNavigate={onNavigate} />;
        }
        console.warn("ProfileCompletion: User data not available, redirecting to login.");
        onNavigate(View.Login); 
        return <LoadingSpinner message="Laddar profildata..." />;
      default:
        if (!isAuthenticated) {
            const authPaths = ['login', 'signup', 'forgot-password', 'confirm-email', 'complete-profile'];
            const currentHashPath = window.location.hash.replace(/^#\/?|\/$/g, '').split('?')[0];
            if (!authPaths.includes(currentHashPath)){
                onNavigate(View.Login); 
                return <LoadingSpinner message="Omdirigerar till inloggning..." />;
            }
        }
        return null; 
    }
  };

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
                  onNavigate={onNavigate}
                  onFeedPostsUpdate={onFeedPostsUpdate} 
                  onVisiblePostsDateChange={onVisiblePostsDateChange}
                  prefillPostWithImageId={prefillPostWithImageId}
                  scrollToPostIdFromParams={scrollToPostIdFromParams}
                />;
      case View.ImageBank:
        return <ImageBankPage onNavigate={onNavigate} />;
      case View.Diary:
        return <DiaryPage />; 
      case View.EditImage:
        if (viewParams?.imageId) { return <EditImagePage imageId={viewParams.imageId} onNavigate={onNavigate} />; }
        onNavigate(View.Home); return null;
      case View.SlideshowProjects:
        return <SlideshowProjectsPage onNavigate={onNavigate} />;
      case View.PlaySlideshow:
        if (viewParams?.projectId) { return <SlideshowPlayerPage projectId={viewParams.projectId} onNavigate={onNavigate} />; }
        onNavigate(View.SlideshowProjects); return null;
      default: 
        const authViewsDefault = [View.Login, View.Signup, View.ForgotPassword, View.EmailConfirmation, View.ProfileCompletion];
        if (authViewsDefault.includes(currentView)) {
             if (currentView !== View.ProfileCompletion) { 
                onNavigate(View.Home);
                return null;
            }
        }
        console.warn("Unhandled authenticated view in renderMainAppView:", currentView, "defaulting to Home.");
        onNavigate(View.Home);
        return null;
    }
  };

  if (isAuthenticated === null) { 
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-light-bg dark:bg-slate-900"> 
        <LoadingSpinner message="Autentiserar..." size="lg" /> 
      </div>
    );
  }

  const isAuthFlowView = [View.Login, View.Signup, View.ForgotPassword, View.EmailConfirmation, View.ProfileCompletion].includes(currentView);

  if (!isAuthenticated || isAuthFlowView) {
    const authContent = renderAuthView();
    if (authContent) return authContent;
    if (!isAuthenticated) { 
        onNavigate(View.Login); 
        return <LoadingSpinner message="Omdirigerar..." />; 
    }
  }

  return renderMainAppView();
}; 