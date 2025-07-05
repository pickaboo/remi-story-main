import React, { useState, useEffect, memo } from 'react';
import { User } from '../types';
import { useAppContext } from '../context/AppContext';
import { AppLayout } from './AppLayout';
import { ModalManager } from './ModalManager';
import { useAuthentication } from '../hooks/useAuthentication';
import { ViewRenderer } from './ViewRenderer';
import { LoadingScreen } from './LoadingScreen';
import { ErrorScreen } from './ErrorScreen';

export const AppContent: React.FC = memo(() => {
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
    themePreference,
    setThemePreference,
  } = useAppContext();

  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Use the authentication hook
  const { isLoading: authLoading, error: authError } = useAuthentication({
    handleLoginSuccess,
    fetchUserAndSphereData,
    setCurrentView,
    setIsAuthenticated,
    setCurrentUser,
    activeSphere,
    themePreference,
    currentUser
  });

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
      setThemePreference(theme);
      const updatedUser = { ...currentUser, themePreference: theme };
      setCurrentUser(updatedUser);
      try {
        await handleSaveThemePreference(theme, currentUser.id);
      } catch (error) {
        console.error('Failed to save theme preference to database:', error);
      }
    }
  };

  const handleSwitchSphereWrapper = async (sphereId: string) => {
    if (currentUser) {
      await handleSwitchSphere(sphereId, currentUser);
    }
  };

  // Show loading while checking auth
  if (authLoading || isAuthenticated === null || !currentUser) {
    return <LoadingScreen />;
  }

  // Show auth error
  if (authError) {
    return <ErrorScreen message={`Autentiseringsfel: ${authError}`} title="Autentiseringsfel" />;
  }

  // Render views
  return (
    <AppLayout>
      <ModalManager />
      <ViewRenderer 
        currentView={currentView}
        viewParams={viewParams}
        isAuthenticated={isAuthenticated}
      />
    </AppLayout>
  );
});

AppContent.displayName = 'AppContent'; 