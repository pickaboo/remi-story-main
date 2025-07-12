import React, { useState, useEffect, useCallback } from 'react';
import { Views } from '../constants/viewEnum';
import type { View } from '../constants/viewEnum';
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

  // Navigate to a view using React Router
  const handleNavigate = useCallback((view: View, params?: ViewParams) => {
    if (!navigate) return;
    
    let path = '';
    
    switch (view) {
      case Views.Home:
        path = '/home';
        break;
      case Views.ImageBank:
        path = '/image-bank';
        break;
      case Views.Diary:
        path = '/diary';
        break;
      case Views.EditImage:
        path = `/edit-image/${params?.imageId || ''}`;
        break;
      case Views.SlideshowProjects:
        path = '/slideshow-projects';
        break;
      case Views.PlaySlideshow:
        path = `/play-slideshow/${params?.projectId || ''}`;
        break;
      case Views.Login:
        path = '/login';
        break;
      case Views.Signup:
        path = '/signup';
        break;
      case Views.EmailConfirmation:
        path = '/email-confirmation';
        break;
      case Views.ProfileCompletion:
        path = '/profile-completion';
        break;
      case Views.BucketList:
        path = '/bucket-list';
        break;
      default:
        path = '/home';
    }
    
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