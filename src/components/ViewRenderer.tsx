import React, { Suspense } from 'react';
import { Views, View } from '../constants/viewEnum';
import { PageLoadingSpinner } from './common/LazyLoadingSpinner';
import { 
  LoginPage, 
  SignupPage, 
  EmailConfirmationPage, 
  DiaryPage,
  EditImagePage,
  SlideshowPlayerPage,
  SlideshowProjectsPage
} from './lazy';
import { ImageBankPage } from '../features/imageBank/pages/ImageBankPage';
import { FeedPage } from '../features/feed/FeedPage';

interface ViewRendererProps {
  currentView: View;
  viewParams?: any;
  isAuthenticated: boolean | null;
}

export const ViewRenderer: React.FC<ViewRendererProps> = ({ 
  currentView, 
  viewParams, 
  isAuthenticated 
}) => {
  // Handle null authentication state
  if (isAuthenticated === null) {
    return null;
  }

  // Render unauthenticated views (full screen)
  if (isAuthenticated === false) {
    switch (currentView) {
      case Views.Signup:
        return (
          <Suspense fallback={<PageLoadingSpinner message="Laddar registreringssida..." />}>
            <SignupPage />
          </Suspense>
        );
      case Views.EmailConfirmation:
        return (
          <Suspense fallback={<PageLoadingSpinner message="Laddar e-postbekräftelse..." />}>
            <EmailConfirmationPage />
          </Suspense>
        );

      default:
        return (
          <Suspense fallback={<PageLoadingSpinner message="Laddar inloggningssida..." />}>
            <LoginPage />
          </Suspense>
        );
    }
  }

  // Render authenticated views (within layout)
  return (
    <Suspense fallback={<PageLoadingSpinner message="Laddar sida..." />}>
      {currentView === Views.Home && <FeedPage />}
      {currentView === Views.Diary && <DiaryPage />}
      {currentView === Views.EditImage && viewParams?.imageId && <EditImagePage imageId={viewParams.imageId} />}
      {currentView === Views.ImageBank && <ImageBankPage />}
      {currentView === Views.SlideshowProjects && <SlideshowProjectsPage />}
      {currentView === Views.PlaySlideshow && viewParams?.projectId && <SlideshowPlayerPage projectId={viewParams.projectId} />}
      {currentView === Views.EmailConfirmation && <EmailConfirmationPage />}
    </Suspense>
  );
}; 