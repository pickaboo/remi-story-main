import React, { useState, useEffect, useRef, memo } from 'react';
import { User, View } from '../types';
import { useAppContext } from '../context/AppContext';
import { AppLayout } from './AppLayout';
import { ModalManager } from './ModalManager';
import { ViewRenderer } from './ViewRenderer';
import { LoadingScreen } from './LoadingScreen';
import { ErrorScreen } from './ErrorScreen';
import { getCurrentAuthenticatedUser } from '../services/authService';
import { applyThemePreference, setupThemeListener } from '../utils/themeUtils';
import { applyBackgroundPreference } from '../utils/backgroundUtils';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useProfileCompletion } from '../hooks/useProfileCompletion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

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
    handleLogout,
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
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAuthStateInitialized, setIsAuthStateInitialized] = useState(false);
  const themeCleanupRef = useRef<(() => void) | null>(null);
  const authUnsubscribeRef = useRef<(() => void) | null>(null);

  // Check profile completion
  useProfileCompletion();

  // Firebase Auth state listener
  useEffect(() => {
    console.log('[AppContent] Setting up Firebase Auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AppContent] Firebase Auth state changed:', firebaseUser ? {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified
      } : 'null');
      
      // Skip auth check if we're logging out
      if (isLoggingOut) {
        console.log('[AppContent] Skipping auth check during logout');
        return;
      }
      
      try {
        setIsLoading(true);
        setAuthError(null);
        
        if (firebaseUser) {
          // User is authenticated, get full user data
          const user = await getCurrentAuthenticatedUser();
          console.log('[AppContent] Authentication check result:', user ? { 
            name: user.name, 
            initials: user.initials, 
            emailVerified: user.emailVerified,
            nameIsDefault: user.name === "Ny Användare",
            initialsIsDefault: user.initials === "NY"
          } : 'null');
          
          if (user) {
            setIsAuthenticated(true);
            setCurrentUser(user);
            
            // Förbättrad logik: Navigera endast till EmailConfirmation om användaren är o-verifierad
            if (!user.emailVerified) {
              console.log('[AppContent] User needs email verification, setting view to EmailConfirmation');
              handleNavigate(View.EmailConfirmation);
            } else {
              // Om användaren är verifierad, gå alltid till Home
              console.log('[AppContent] User is authenticated, navigating to Home');
              await handleLoginSuccess(user);
              await fetchUserAndSphereData(user);
              handleNavigate(View.Home);
            }
          } else {
            console.log('[AppContent] Firebase user exists but getCurrentAuthenticatedUser returned null');
            setIsAuthenticated(false);
            setCurrentUser(null);
            handleNavigate(View.Login);
          }
        } else {
          console.log('[AppContent] No Firebase user found, setting view to Login');
          setIsAuthenticated(false);
          setCurrentUser(null);
          handleNavigate(View.Login);
        }
      } catch (err) {
        console.error('[AppContent] Auth check failed:', err);
        setAuthError(err instanceof Error ? err.message : 'Autentiseringsfel');
        setIsAuthenticated(false);
        setCurrentUser(null);
        handleNavigate(View.Login);
      } finally {
        setIsLoading(false);
        setIsAuthStateInitialized(true);
      }
    });

    authUnsubscribeRef.current = unsubscribe;

    return () => {
      if (authUnsubscribeRef.current) {
        console.log('[AppContent] Cleaning up Firebase Auth state listener');
        authUnsubscribeRef.current();
      }
    };
  }, [setIsAuthenticated, setCurrentUser, setCurrentView, handleLoginSuccess, fetchUserAndSphereData, isLoggingOut]);

  // Theme effect
  useEffect(() => {
    applyThemePreference(themePreference || 'system');
    if (currentUser) {
      themeCleanupRef.current = setupThemeListener(currentUser, applyThemePreference);
    }
    return () => {
      if (themeCleanupRef.current) {
        themeCleanupRef.current();
      }
    };
  }, [themePreference, currentUser]);

  // Background effect
  useEffect(() => {
    applyBackgroundPreference(activeSphere, currentUser);
  }, [activeSphere, currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchAllUsers().then(setAllUsers);
    }
  }, [currentUser, fetchAllUsers]);

  // Add this effect after the main useEffect for auth state
  useEffect(() => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.id);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Only update if something actually changed
        if (data) {
          setCurrentUser({ ...currentUser, ...data });
        }
      }
    });
    return () => unsubscribe();
  }, [currentUser?.id]);

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

  const handleLogoutWrapper = async () => {
    console.log('[AppContent] Starting logout process...');
    setIsLoggingOut(true);
    
    try {
      // First perform Firebase logout
      const success = await handleLogout();
      console.log('[AppContent] Logout result:', success);
      
      if (success) {
        console.log('[AppContent] Logout completed successfully');
        // Reset app state after successful Firebase logout
        setCurrentUser(null);
        setIsAuthenticated(false);
        handleNavigate(View.Login);
      } else {
        console.log('[AppContent] Logout was not successful');
      }
    } catch (error) {
      console.error('[AppContent] Logout failed:', error);
    } finally {
      // Reset logout flag after a longer delay to ensure Firebase state is cleared
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 2000);
    }
  };

  // Show loading while checking auth or during initial auth state setup
  if (isLoading || !isAuthStateInitialized) {
    return <LoadingScreen />;
  }

  // Show auth error
  if (authError) {
    return <ErrorScreen message={`Autentiseringsfel: ${authError}`} title="Autentiseringsfel" />;
  }

  // Render unauthenticated views without layout
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-slate-900">
        <ModalManager />
        <ViewRenderer 
          currentView={currentView}
          viewParams={viewParams}
          isAuthenticated={isAuthenticated}
        />
      </div>
    );
  }

  // Render authenticated views with layout
  return (
    <AppLayout onLogout={handleLogoutWrapper}>
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