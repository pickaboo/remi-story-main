import React, { useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigation } from '../context/NavigationContext';
import { useSphereManagement } from '../features/spheres/hooks/useSphereManagement';
import { LoginPage, SignupPage, EmailConfirmationPage, ProfileCompletionPage } from '../features/auth';
import { LoadingSpinner } from '../common/components/LoadingSpinner';
import { View } from '../types';

export const UnauthenticatedApp: React.FC = () => {
  // Get all needed data from contexts
  const { currentUser, handleLoginSuccess, handleProfileComplete } = useUser();
  const { currentView, viewParams, navigate } = useNavigation();
  const { allUsersForManageModal } = useSphereManagement(currentUser);

  console.log('[UnauthenticatedApp] currentView:', currentView);

  // Ensure we always land on a valid auth view
  useEffect(() => {
    const validAuthViews = [View.Login, View.Signup, View.ForgotPassword, View.EmailConfirmation, View.ProfileCompletion];
    console.log('[UnauthenticatedApp] useEffect: currentView =', currentView, 'typeof:', typeof currentView);
    console.log('[UnauthenticatedApp] useEffect: validAuthViews =', validAuthViews);
    if (!validAuthViews.includes(currentView)) {
      console.log('[UnauthenticatedApp] useEffect: currentView not in validAuthViews, navigating to Login');
      navigate(View.Login);
    }
  }, [currentView, navigate]);

  // Render the appropriate auth page based on current view
  const renderAuthPage = () => {
    switch (currentView) {
      case View.Login:
        return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={navigate} />;
      case View.Signup:
        return <SignupPage onLoginSuccess={handleLoginSuccess} onNavigate={navigate} />;
      case View.EmailConfirmation:
        return <EmailConfirmationPage email={viewParams?.email} onLoginSuccess={handleLoginSuccess} onNavigate={navigate} />;
      case View.ProfileCompletion:
        const userForProfile = viewParams?.userId ? allUsersForManageModal.find(u=>u.id === viewParams.userId) || currentUser : currentUser;
        if (userForProfile) { 
          return <ProfileCompletionPage initialUser={userForProfile} onProfileComplete={handleProfileComplete} onNavigate={navigate} />;
        }
        return <LoadingSpinner message="Laddar profildata..." />;
      default:
        return <LoadingSpinner message="Omdirigerar..." />; 
    }
  };

  return renderAuthPage();
}; 