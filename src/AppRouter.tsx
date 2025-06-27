import React, { useEffect, useRef } from 'react';
import { useUser } from './context/UserContext';
import { useNavigation } from './context/NavigationContext';
import { AuthenticatedApp, UnauthenticatedApp } from './components';
import { LoadingSpinner } from './common/components/LoadingSpinner';
import { View } from './types';

export const AppRouter: React.FC = () => {
  const { isAuthenticated, currentUser } = useUser();
  const { currentView, navigate } = useNavigation();
  
  // Debug log
  console.log('[AppRouter] isAuthenticated:', isAuthenticated, 'currentView:', currentView);
  
  // Track last navigation to avoid infinite loops
  const lastNavRef = useRef<string | null>(null);

  // Handle redirects for auth views
  useEffect(() => {
    if (isAuthenticated === false) {
      const authPaths = ['login', 'signup', 'forgot-password', 'confirm-email', 'complete-profile'];
      const currentHashPath = window.location.hash.replace(/^#\/?|\/$/g, '').split('?')[0];
      if (!authPaths.includes(currentHashPath)) {
        if (lastNavRef.current !== 'login') {
          lastNavRef.current = 'login';
          navigate(View.Login);
        }
      }
    }
  }, [isAuthenticated, navigate]);

  // Handle redirect from auth views to Home if already authenticated
  useEffect(() => {
    const authViewsDefault = [View.Login, View.Signup, View.ForgotPassword, View.EmailConfirmation];
    if (isAuthenticated && authViewsDefault.includes(currentView)) {
      if (lastNavRef.current !== 'home') {
        lastNavRef.current = 'home';
        navigate(View.Home);
      }
    }
  }, [isAuthenticated, currentView, navigate]);

  // Handle profile completion redirect
  useEffect(() => {
    if (isAuthenticated && currentUser && currentUser.name === 'Ny Användare') {
      if (lastNavRef.current !== 'profile-completion') {
        lastNavRef.current = 'profile-completion';
        navigate(View.ProfileCompletion, { userId: currentUser.id });
      }
    }
  }, [isAuthenticated, currentUser, navigate]);

  // Show loading spinner while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-light-bg dark:bg-slate-900"> 
        <LoadingSpinner message="Autentiserar..." size="lg" /> 
      </div>
    );
  }

  // Show loading spinner if authenticated but user data is still loading
  if (isAuthenticated && !currentUser) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-light-bg dark:bg-slate-900"> 
        <LoadingSpinner message="Laddar användardata..." size="lg" /> 
      </div>
    );
  }

  // Render appropriate app based on authentication state
  return isAuthenticated ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}; 