import React, { useEffect, useRef, Suspense, lazy, useState, memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { View, User } from './types';
import { AppProvider, useAppContext } from './context/AppContext';
import { AppLayout } from './components/AppLayout';
import { ModalManager } from './components/ModalManager';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PageLoadingSpinner } from './components/common/LazyLoadingSpinner';
import { applyThemePreference, setupThemeListener } from './utils/themeUtils';
import { applyBackgroundPreference } from './utils/backgroundUtils';
import { getCurrentAuthenticatedUser } from './services/authService';

// Lazy load all pages for better performance
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(module => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import('./pages/auth/SignupPage').then(module => ({ default: module.SignupPage })));
const EmailConfirmationPage = lazy(() => import('./pages/auth/EmailConfirmationPage').then(module => ({ default: module.EmailConfirmationPage })));
const ProfileCompletionPage = lazy(() => import('./pages/auth/ProfileCompletionPage').then(module => ({ default: module.ProfileCompletionPage })));

const FeedPage = lazy(() => import('./pages/FeedPage').then(module => ({ default: module.FeedPage })));
const DiaryPage = lazy(() => import('./pages/DiaryPage').then(module => ({ default: module.DiaryPage })));
const EditImagePage = lazy(() => import('./pages/EditImagePage').then(module => ({ default: module.EditImagePage })));
const ImageBankPage = lazy(() => import('./pages/ImageBankPage').then(module => ({ default: module.ImageBankPage })));
const SlideshowProjectsPage = lazy(() => import('./pages/SlideshowProjectsPage').then(module => ({ default: module.SlideshowProjectsPage })));
const SlideshowPlayerPage = lazy(() => import('./pages/SlideshowPlayerPage').then(module => ({ default: module.SlideshowPlayerPage })));

const AppContent: React.FC = memo(() => {
  const {
    currentUser,
    activeSphere,
    userSpheres,
    isSidebarExpanded,
    currentView,
    viewParams,
    isAuthenticated,
    handleNavigate,
    handleSwitchSphere,
    toggleSidebar,
    handleOpenCreateSphereModal,
    handleOpenInviteModal,
    handleOpenLookAndFeelModal,
    handleOpenManageSphereModal,
    handleOpenImageBankSettingsModal,
    handleAcceptSphereInvitation,
    handleDeclineSphereInvitation,
    handleSaveThemePreference,
    fetchAllUsers,
    setCurrentView,
    setIsAuthenticated,
    setCurrentUser,
    handleLoginSuccess,
    fetchUserAndSphereData,
  } = useAppContext();

  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    if (currentUser) {
      fetchAllUsers().then(setAllUsers);
    }
  }, [currentUser, fetchAllUsers]);

  const handleAcceptInvitation = async (invitationId: string) => {
    if (currentUser) {
      await handleAcceptSphereInvitation(invitationId, currentUser);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    await handleDeclineSphereInvitation(invitationId, currentUser?.email);
  };

  const handleSaveThemePreferenceWrapper = async (theme: User['themePreference']) => {
    if (currentUser) {
      await handleSaveThemePreference(theme, currentUser.id);
    }
  };

  const handleSwitchSphereWrapper = async (sphereId: string) => {
    if (currentUser) {
      await handleSwitchSphere(sphereId, currentUser);
    }
  };

  const themeCleanupRef = useRef<(() => void) | null>(null);

  // Authentication effect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentAuthenticatedUser();
        if (user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
          
          // Handle new users or profile completion
          if (!user.name || user.name === "Ny Användare") {
            setCurrentView(View.ProfileCompletion);
          } else if (!user.emailVerified) {
            setCurrentView(View.EmailConfirmation);
          } else {
            await handleLoginSuccess(user);
            await fetchUserAndSphereData(user);
            setCurrentView(View.Home);
          }
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
          setCurrentView(View.Login);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setCurrentUser(null);
        setCurrentView(View.Login);
      }
    };

    checkAuth();
  }, [setIsAuthenticated, setCurrentUser, setCurrentView, handleLoginSuccess, fetchUserAndSphereData]);

  // Theme effect
  useEffect(() => {
    if (currentUser) {
      applyThemePreference(currentUser.themePreference || 'system');
      themeCleanupRef.current = setupThemeListener(currentUser, applyThemePreference);
    }

    return () => {
      if (themeCleanupRef.current) {
        themeCleanupRef.current();
      }
    };
  }, [currentUser]);

  // Background effect
  useEffect(() => {
    applyBackgroundPreference(activeSphere, currentUser);
  }, [activeSphere, currentUser]);

  // Render unauthenticated views
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
      case View.ProfileCompletion:
        return (
          <Suspense fallback={<PageLoadingSpinner message="Laddar profilkomplettering..." />}>
            <ProfileCompletionPage />
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

  // Show loading while checking auth
  if (isAuthenticated === null || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-muted-text dark:text-slate-400">Laddar...</p>
        </div>
      </div>
    );
  }

  // Render authenticated views with AppLayout
  return (
    <AppLayout>
      <ModalManager />
      
      <Suspense fallback={<PageLoadingSpinner message="Laddar sida..." />}>
        {currentView === View.Home && <FeedPage />}
        {currentView === View.Diary && <DiaryPage />}
        {currentView === View.EditImage && viewParams?.imageId && <EditImagePage imageId={viewParams.imageId} />}
        {currentView === View.ImageBank && <ImageBankPage />}
        {currentView === View.SlideshowProjects && <SlideshowProjectsPage />}
        {currentView === View.PlaySlideshow && viewParams?.projectId && <SlideshowPlayerPage projectId={viewParams.projectId} />}
      </Suspense>
    </AppLayout>
  );
});

AppContent.displayName = 'AppContent';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
