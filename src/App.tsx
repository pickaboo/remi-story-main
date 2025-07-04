import React, { useEffect, useRef } from 'react';
import { View } from './types';
import { AppProvider, useAppContext } from './context/AppContext';
import { AppLayout } from './components/AppLayout';
import { ModalManager } from './components/ModalManager';
import { applyThemePreference, setupThemeListener } from './utils/themeUtils';
import { applyBackgroundPreference } from './utils/backgroundUtils';
import { getCurrentAuthenticatedUser } from './services/authService';
import { 
  LoginPage, 
  SignupPage, 
  EmailConfirmationPage, 
  ProfileCompletionPage 
} from './pages/auth';
import { 
  HomePage, 
  FeedPage, 
  DiaryPage, 
  EditImagePage, 
  ImageBankPage, 
  SlideshowProjectsPage, 
  SlideshowPlayerPage 
} from './pages';

const AppContent: React.FC = () => {
  const {
    currentView,
    viewParams,
    isAuthenticated,
    currentUser,
    activeSphere,
    setCurrentView,
    setIsAuthenticated,
    setCurrentUser,
    handleLoginSuccess,
    handleLogout,
    fetchUserAndSphereData,
    showGlobalFeedback,
  } = useAppContext();

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

  // URL hash effect - removed duplicate handler since useAppState already handles this

  // Handle logout
  const handleLogoutWithNavigation = async () => {
    const success = await handleLogout();
    if (success) {
      setCurrentView(View.Login);
      showGlobalFeedback('Du har loggats ut', 'success');
    } else {
      showGlobalFeedback('Kunde inte logga ut', 'error');
    }
  };

  // Render unauthenticated views
  if (isAuthenticated === false) {
    switch (currentView) {
      case View.Signup:
        return <SignupPage />;
      case View.EmailConfirmation:
        return <EmailConfirmationPage />;
      case View.ProfileCompletion:
        return <ProfileCompletionPage />;
      default:
        return <LoginPage />;
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
      
      {currentView === View.Home && <FeedPage />}
      {currentView === View.Diary && <DiaryPage />}
      {currentView === View.EditImage && <EditImagePage imageId={viewParams?.imageId} />}
      {currentView === View.ImageBank && <ImageBankPage />}
      {currentView === View.SlideshowProjects && <SlideshowProjectsPage />}
      {currentView === View.PlaySlideshow && <SlideshowPlayerPage projectId={viewParams?.projectId} />}
    </AppLayout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
