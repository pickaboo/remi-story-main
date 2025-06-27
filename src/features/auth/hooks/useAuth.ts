import { useState, useEffect } from 'react';
import { User, View } from '../../../types';
import { getCurrentAuthenticatedUser } from '../services/authService';
import { useNavigation } from '../../../context/NavigationContext';
import { useAppLogic } from '../../../common/hooks/useAppLogic';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { navigate } = useNavigation();
  const { applyThemePreference, fetchUserAndSphereData } = useAppLogic();

  // Initial auth check and data load
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const user = await getCurrentAuthenticatedUser(); 
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        applyThemePreference(user.themePreference || 'system');
        const finalUser = await fetchUserAndSphereData(user);
        setCurrentUser(finalUser);

        const hash = window.location.hash.replace(/^#\/?|\/$/g, '');
        const hashPath = hash.split('?')[0];
        const authPaths = ['login', 'signup', 'confirm-email', 'forgot-password', 'complete-profile'];

        if (user.name === "Ny Användare" || hashPath === 'complete-profile') { 
             navigate(View.ProfileCompletion, { userId: user.id }); 
        } else if (!hash || authPaths.includes(hashPath)) {
            navigate(View.Home);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        navigate(View.Login);
      }
    };
    checkAuthAndLoadData();
  }, [navigate, applyThemePreference, fetchUserAndSphereData]);

  // Theme management
  useEffect(() => {
    if (currentUser?.themePreference) {
        applyThemePreference(currentUser.themePreference);
    } else {
        applyThemePreference('system');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        if (currentUser?.themePreference === 'system' || !currentUser) {
            applyThemePreference('system');
        }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentUser, applyThemePreference]);

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    applyThemePreference(user.themePreference || 'system');
    const finalUser = await fetchUserAndSphereData(user);
    setCurrentUser(finalUser);
    navigate(View.Home);
  };

  const handleProfileComplete = async (updatedUser: User) => {
    setCurrentUser(updatedUser);
    navigate(View.Home);
  };

  return {
    isAuthenticated,
    currentUser,
    setCurrentUser,
    handleLoginSuccess,
    handleProfileComplete,
  };
}; 