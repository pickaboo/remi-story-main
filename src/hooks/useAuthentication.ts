import { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { Views, View } from '../constants/viewEnum';
import { getCurrentAuthenticatedUser } from '../features/auth/services/authService';
import { applyThemePreference, setupThemeListener } from '../utils/themeUtils';
import { applyBackgroundPreference } from '../utils/backgroundUtils';

interface UseAuthenticationProps {
  handleLoginSuccess: (user: User) => Promise<User>;
  fetchUserAndSphereData: (user: User) => Promise<any>;
  setCurrentView: (view: View) => void;
  setIsAuthenticated: (value: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  activeSphere: any; // Replace with proper type
  themePreference: User['themePreference'];
  currentUser: User | null;
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
  activeSphere,
  themePreference,
  currentUser
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
            setCurrentView(Views.ProfileCompletion);
          } else if (!user.emailVerified) {
            setCurrentView(Views.EmailConfirmation);
          } else {
            try {
              await handleLoginSuccess(user);
              
              // Try to fetch sphere data with better error handling
              try {
                await fetchUserAndSphereData(user);
                setCurrentView(Views.Home);
              } catch (sphereError) {
                console.error('Failed to fetch sphere data:', sphereError);
                // If sphere data fetch fails, still navigate to home but with limited functionality
                setCurrentView(Views.Home);
                // You could also set a flag to show a warning about limited functionality
              }
            } catch (loginError) {
              console.error('Login success handling failed:', loginError);
              setError(loginError instanceof Error ? loginError.message : 'Inloggning misslyckades');
              setCurrentView(Views.Login);
            }
          }
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
          setCurrentView(Views.Login);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setError(err instanceof Error ? err.message : 'Autentiseringsfel');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setCurrentView(Views.Login);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setIsAuthenticated, setCurrentUser, setCurrentView, handleLoginSuccess, fetchUserAndSphereData]);

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

  return {
    isAuthenticated: null, // This should come from context
    currentUser: null, // This should come from context
    isLoading,
    error
  };
} 