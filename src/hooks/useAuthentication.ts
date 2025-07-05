import { useState, useEffect, useRef } from 'react';
import { User, View } from '../types';
import { getCurrentAuthenticatedUser } from '../services/authService';
import { applyThemePreference, setupThemeListener } from '../utils/themeUtils';
import { applyBackgroundPreference } from '../utils/backgroundUtils';

interface UseAuthenticationProps {
  handleLoginSuccess: (user: User) => Promise<void>;
  fetchUserAndSphereData: (user: User) => Promise<void>;
  setCurrentView: (view: View) => void;
  setIsAuthenticated: (value: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  activeSphere: any; // Replace with proper type
}

interface UseAuthenticationReturn {
  isAuthenticated: boolean | null;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for managing authentication state and user data
 */
export function useAuthentication({
  handleLoginSuccess,
  fetchUserAndSphereData,
  setCurrentView,
  setIsAuthenticated,
  setCurrentUser,
  activeSphere
}: UseAuthenticationProps): UseAuthenticationReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const themeCleanupRef = useRef<(() => void) | null>(null);

  // Authentication effect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
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
      } catch (err) {
        console.error('Auth check failed:', err);
        setError(err instanceof Error ? err.message : 'Autentiseringsfel');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setCurrentView(View.Login);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setIsAuthenticated, setCurrentUser, setCurrentView, handleLoginSuccess, fetchUserAndSphereData]);

  // Theme effect
  useEffect(() => {
    // Note: This hook needs to be integrated with context to get actual currentUser
    // For now, we'll skip theme handling in this hook
    return () => {
      if (themeCleanupRef.current) {
        themeCleanupRef.current();
      }
    };
  }, []);

  // Background effect
  useEffect(() => {
    // Note: This hook needs to be integrated with context to get actual currentUser
    // For now, we'll skip background handling in this hook
  }, [activeSphere]);

  return {
    isAuthenticated: null, // This should come from context
    currentUser: null, // This should come from context
    isLoading,
    error
  };
} 