import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Views } from '../constants/viewEnum';
import type { View } from '../constants/viewEnum';
import { User } from '../types';
import { useAppContext } from '../context/AppContext';
import { LoadingScreen } from './LoadingScreen';
import { ErrorScreen } from './ErrorScreen';
import { getCurrentAuthenticatedUser } from '../features/auth/services/authService';
import { applyThemePreference, setupThemeListener } from '../utils/themeUtils';
import { applyBackgroundPreference } from '../utils/backgroundUtils';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useProfileCompletion } from '../hooks/useProfileCompletion';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

export const AppContent: React.FC = () => {
  const location = useLocation();
  
  const {
    currentUser,
    activeSphere,
    userSpheres,
    isSidebarExpanded,
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

  // Theme and background setup
  useEffect(() => {
    const cleanup = setupThemeListener(currentUser, applyThemePreference);
    themeCleanupRef.current = cleanup;
    return cleanup;
  }, [currentUser]);

  useEffect(() => {
    if (themePreference) {
      applyThemePreference(themePreference);
    }
  }, [themePreference]);

  useEffect(() => {
    if (activeSphere) {
      applyBackgroundPreference(activeSphere, currentUser);
    }
  }, [activeSphere, currentUser]);

  // Authentication state management
  useEffect(() => {
    console.log('[AppContent] Setting up Firebase Auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        console.log('[AppContent] Firebase auth state changed:', firebaseUser?.uid);
        
        if (firebaseUser) {
          console.log('[AppContent] Firebase user found, checking authentication');
          const user = await getCurrentAuthenticatedUser();
          
          if (user) {
            setIsAuthenticated(true);
            setCurrentUser(user);
            
            // Only navigate if we're on an auth page
            const isOnAuthPage = ['/login', '/signup', '/email-confirmation'].includes(location.pathname);
            
            if (isOnAuthPage) {
              // Navigate based on user state
              if (!user.emailVerified) {
                console.log('[AppContent] User needs email verification, navigating to email-confirmation');
                handleNavigate(Views.EmailConfirmation);
              } else if (!user.name || user.name === "Ny Användare") {
                console.log('[AppContent] User needs profile completion, navigating to profile-completion');
                handleNavigate(Views.ProfileCompletion);
              } else {
                console.log('[AppContent] User is authenticated, navigating to home');
                await handleLoginSuccess(user);
                await fetchUserAndSphereData(user);
                handleNavigate(Views.Home);
              }
            }
          } else {
            console.log('[AppContent] Firebase user exists but getCurrentAuthenticatedUser returned null');
            setIsAuthenticated(false);
            setCurrentUser(null);
            // Only navigate to login if we're not already on an auth page
            if (!['/login', '/signup', '/email-confirmation'].includes(location.pathname)) {
              handleNavigate(Views.Login);
            }
          }
        } else {
          console.log('[AppContent] No Firebase user found');
          setIsAuthenticated(false);
          setCurrentUser(null);
          // Only navigate to login if we're not already on an auth page
          if (!['/login', '/signup', '/email-confirmation'].includes(location.pathname)) {
            handleNavigate(Views.Login);
          }
        }
      } catch (err) {
        console.error('[AppContent] Auth check failed:', err);
        setAuthError(err instanceof Error ? err.message : 'Autentiseringsfel');
        setIsAuthenticated(false);
        setCurrentUser(null);
        // Only navigate to login if we're not already on an auth page
        if (!['/login', '/signup', '/email-confirmation'].includes(location.pathname)) {
          handleNavigate(Views.Login);
        }
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
  }, [setIsAuthenticated, setCurrentUser, handleLoginSuccess, fetchUserAndSphereData, isLoggingOut, handleNavigate, location.pathname]);

  // Fetch all users for modals
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await fetchAllUsers();
        setAllUsers(users);
      } catch (error) {
        console.error('Failed to fetch all users:', error);
      }
    };

    if (isAuthenticated && currentUser) {
      fetchUsers();
    }
  }, [isAuthenticated, currentUser, fetchAllUsers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (themeCleanupRef.current) {
        themeCleanupRef.current();
      }
    };
  }, []);

  const handleSwitchSphereWrapper = async (sphereId: string) => {
    if (currentUser) {
      await handleSwitchSphere(sphereId, currentUser);
    }
  };

  const handleLogoutWrapper = async () => {
    console.log('[AppContent] Starting logout process...');
    setIsLoggingOut(true);
    
    try {
      const success = await handleLogout();
      console.log('[AppContent] Logout result:', success);
      
      if (success) {
        console.log('[AppContent] Logout completed successfully');
        setCurrentUser(null);
        setIsAuthenticated(false);
        handleNavigate(Views.Login);
      } else {
        console.log('[AppContent] Logout was not successful');
      }
    } catch (error) {
      console.error('[AppContent] Logout failed:', error);
    } finally {
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

  // The actual routing is now handled by React Router
  // This component just manages authentication state
  return <></>;
}; 