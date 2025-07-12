import React from 'react';
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { ModalManager } from '../components/ModalManager';
import { AppContent } from '../components/AppContent';
import { AppProvider } from '../context/AppContext';

// Lazy load pages
const LoginPage = React.lazy(() => import('../features/auth/pages/LoginPage').then(module => ({ default: module.LoginPage })));
const SignupPage = React.lazy(() => import('../features/auth/pages/SignupPage').then(module => ({ default: module.SignupPage })));
const EmailConfirmationPage = React.lazy(() => import('../features/auth/pages/EmailConfirmationPage').then(module => ({ default: module.EmailConfirmationPage })));
const ProfileCompletionPage = React.lazy(() => import('../features/auth/pages/ProfileCompletionPage').then(module => ({ default: module.ProfileCompletionPage })));
const FeedPage = React.lazy(() => import('../features/feed/FeedPage').then(module => ({ default: module.FeedPage })));
const DiaryPage = React.lazy(() => import('../features/diary/DiaryPage').then(module => ({ default: module.DiaryPage })));
const ImageBankPage = React.lazy(() => import('../features/imageBank/pages/ImageBankPage').then(module => ({ default: module.ImageBankPage })));
const EditImagePage = React.lazy(() => import('../pages/EditImagePage').then(module => ({ default: module.EditImagePage })));
const SlideshowProjectsPage = React.lazy(() => import('../pages/SlideshowProjectsPage').then(module => ({ default: module.SlideshowProjectsPage })));
const SlideshowPlayerPage = React.lazy(() => import('../pages/SlideshowPlayerPage').then(module => ({ default: module.SlideshowPlayerPage })));
const BucketListPage = React.lazy(() => import('../features/bucketList/pages/BucketListPage').then(module => ({ default: module.BucketListPage })));

// Loading component
const PageLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

// Wrapper components for pages with parameters
const EditImagePageWrapper = () => {
  const { imageId } = useParams();
  return <EditImagePage imageId={imageId!} />;
};

const SlideshowPlayerPageWrapper = () => {
  const { projectId } = useParams();
  return <SlideshowPlayerPage projectId={projectId!} />;
};

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppProvider>
      <AppContent />
      {children}
    </AppProvider>
  );
};

// Public route wrapper (for unauthenticated users)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppProvider>
      <AppContent />
      {children}
    </AppProvider>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <div className="min-h-screen bg-light-bg dark:bg-slate-900">
          <ModalManager />
          <React.Suspense fallback={<PageLoadingSpinner />}>
            <LoginPage />
          </React.Suspense>
        </div>
      </PublicRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <PublicRoute>
        <div className="min-h-screen bg-light-bg dark:bg-slate-900">
          <ModalManager />
          <React.Suspense fallback={<PageLoadingSpinner />}>
            <SignupPage />
          </React.Suspense>
        </div>
      </PublicRoute>
    ),
  },
  {
    path: '/email-confirmation',
    element: (
      <PublicRoute>
        <div className="min-h-screen bg-light-bg dark:bg-slate-900">
          <ModalManager />
          <React.Suspense fallback={<PageLoadingSpinner />}>
            <EmailConfirmationPage />
          </React.Suspense>
        </div>
      </PublicRoute>
    ),
  },
  {
    path: '/profile-completion',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <ModalManager />
          <React.Suspense fallback={<PageLoadingSpinner />}>
            <ProfileCompletionPage />
          </React.Suspense>
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <ModalManager />
          <React.Suspense fallback={<PageLoadingSpinner />}>
            <FeedPage />
          </React.Suspense>
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/diary',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <ModalManager />
          <React.Suspense fallback={<PageLoadingSpinner />}>
            <DiaryPage />
          </React.Suspense>
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/image-bank',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <ModalManager />
          <React.Suspense fallback={<PageLoadingSpinner />}>
            <ImageBankPage />
          </React.Suspense>
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/edit-image/:imageId',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <ModalManager />
          <React.Suspense fallback={<PageLoadingSpinner />}>
            <EditImagePageWrapper />
          </React.Suspense>
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/slideshow-projects',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <ModalManager />
          <React.Suspense fallback={<PageLoadingSpinner />}>
            <SlideshowProjectsPage />
          </React.Suspense>
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/play-slideshow/:projectId',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <ModalManager />
          <React.Suspense fallback={<PageLoadingSpinner />}>
            <SlideshowPlayerPageWrapper />
          </React.Suspense>
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/bucket-list',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <ModalManager />
          <React.Suspense fallback={<PageLoadingSpinner />}>
            <BucketListPage />
          </React.Suspense>
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/home" replace />,
  },
]); 