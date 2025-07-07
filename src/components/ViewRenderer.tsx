import React, { Suspense } from 'react';
import { View } from '../types';
import { PageLoadingSpinner } from './common/LazyLoadingSpinner';
import { 
  LoginPage, 
  SignupPage, 
  EmailConfirmationPage, 
  FeedPage,
  DiaryPage,
  EditImagePage,
  ImageBankPage,
  SlideshowProjectsPage,
  SlideshowPlayerPage
} from './lazy';

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
      case View.Signup:
        return (
          <Suspense fallback={<PageLoadingSpinner message="Laddar registreringssida..." />}>
            <SignupPage />
          </Suspense>
        );
      case View.EmailConfirmation:
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
      {currentView === View.Home && <FeedPage />}
      {currentView === View.Diary && <DiaryPage />}
      {currentView === View.EditImage && viewParams?.imageId && <EditImagePage imageId={viewParams.imageId} />}
      {currentView === View.ImageBank && <ImageBankPage />}
      {currentView === View.SlideshowProjects && <SlideshowProjectsPage />}
      {currentView === View.PlaySlideshow && viewParams?.projectId && <SlideshowPlayerPage projectId={viewParams.projectId} />}
      {currentView === View.EmailConfirmation && <EmailConfirmationPage />}
    </Suspense>
  );
}; 