import { useState, useEffect } from 'react';
import { User } from '../../../types';
import { getCurrentAuthenticatedUser } from '../services/authService';
import { useAppLogic } from '../../../common/hooks/useAppLogic';
import { useSphere } from '../../../context/SphereContext';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { applyThemePreference } = useAppLogic();
  const { fetchUserAndSphereData } = useSphere();

  // Initial auth check and data load
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const user = await getCurrentAuthenticatedUser(); 
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        applyThemePreference(user.themePreference || 'system');
        await fetchUserAndSphereData(user);
      } else {
        console.log('[useAuth] No user found, setting isAuthenticated to false');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    };
    checkAuthAndLoadData();
  }, [applyThemePreference, fetchUserAndSphereData]);

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
    await fetchUserAndSphereData(user);
  };

  const handleProfileComplete = async (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  return {
    isAuthenticated,
    currentUser,
    setCurrentUser,
    setIsAuthenticated,
    handleLoginSuccess,
    handleProfileComplete,
  };
}; 