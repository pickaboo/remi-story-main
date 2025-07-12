import React, { useState, useEffect, useCallback } from 'react';

import { ViewParams, LegacyFeedback, User } from '../types';
import { LOCAL_STORAGE_USER_THEME_PREFERENCE_KEY_PREFIX } from '../constants';

export const useAppState = (navigate?: (path: string) => void) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [globalFeedback, setGlobalFeedback] = useState<LegacyFeedback | null>(null);
  const [viewParams, setViewParams] = useState<ViewParams>({});
  
  // Initialize theme preference from localStorage or default to 'system'
  const [themePreference, setThemePreference] = useState<User['themePreference']>(() => {
    const savedTheme = localStorage.getItem('themePreference');
    return (savedTheme as User['themePreference']) || 'system';
  });

  // Keep themePreference in sync with currentUser and localStorage
  useEffect(() => {
    if (currentUser && currentUser.themePreference) {
      setThemePreference(currentUser.themePreference);
      // Save to localStorage when user theme changes
      localStorage.setItem('themePreference', currentUser.themePreference);
    }
  }, [currentUser]);

  // Save theme preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('themePreference', themePreference);
  }, [themePreference]);

  // Navigate to a path using React Router
  const handleNavigate = useCallback((path: string, params?: ViewParams) => {
    if (!navigate) return;
    
    // Update viewParams if provided
    if (params) {
      setViewParams(params);
    }
    
    navigate(path);
  }, [navigate, setViewParams]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded(prev => !prev);
  }, []);

  const showGlobalFeedback = useCallback((message: string, type: 'success' | 'error') => {
    setGlobalFeedback({ message, type });
    setTimeout(() => setGlobalFeedback(null), 5000);
  }, []);

  return {
    // State
    isAuthenticated,
    currentUser,
    isSidebarExpanded,
    globalFeedback,
    themePreference,
    viewParams,
    
    // Setters
    setIsAuthenticated,
    setCurrentUser,
    setGlobalFeedback,
    setThemePreference,
    setViewParams,
    
    // Actions
    handleNavigate,
    toggleSidebar,
    showGlobalFeedback,
  };
}; 