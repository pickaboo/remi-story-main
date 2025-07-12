import React, { useState, useEffect, useCallback } from 'react';
import { Views } from '../constants/viewEnum';
import type { View } from '../constants/viewEnum';
import { ViewParams, LegacyFeedback, User } from '../types';
import { LOCAL_STORAGE_USER_THEME_PREFERENCE_KEY_PREFIX } from '../constants';

const viewToPathMap: Record<View, string> = {
  [Views.Home]: 'home',
  [Views.ImageBank]: 'image-bank',
  [Views.Diary]: 'diary',
  [Views.EditImage]: 'edit-image',
  [Views.SlideshowProjects]: 'slideshow-projects',
  [Views.PlaySlideshow]: 'play-slideshow',
  [Views.Login]: 'login',
  [Views.Signup]: 'signup',
  [Views.EmailConfirmation]: 'email-confirmation',
  [Views.ProfileCompletion]: 'profile-completion',
  [Views.BucketList]: 'bucket-list',
};

const pathToViewMap: Record<string, View> = {
  'home': Views.Home,
  'image-bank': Views.ImageBank,
  'diary': Views.Diary,
  'edit-image': Views.EditImage,
  'slideshow-projects': Views.SlideshowProjects,
  'play-slideshow': Views.PlaySlideshow,
  'login': Views.Login,
  'signup': Views.Signup,
  'email-confirmation': Views.EmailConfirmation,
  'profile-completion': Views.ProfileCompletion,
  'bucket-list': Views.BucketList,
};

export const useAppState = () => {
  const [currentView, setCurrentView] = useState<View>(Views.Login);
  const [viewParams, setViewParams] = useState<ViewParams | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [globalFeedback, setGlobalFeedback] = useState<LegacyFeedback | null>(null);
  
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

  // Navigera till en vy och synka hash
  const navigate = useCallback((view: View, params?: ViewParams) => {
    setCurrentView(view);
    setViewParams(params || null);
    const path = viewToPathMap[view] || '';
    const hash = params ? `#/${path}?${new URLSearchParams(params as Record<string, string>).toString()}` : `#/${path}`;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  }, []);

  // Synka hash -> state (t.ex. vid bakåt/framåt)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?|\/$/g, '');
      const [basePath, paramString] = hash.split('?');
      const newView = pathToViewMap[basePath] || Views.Home;
      let params: ViewParams | null = null;
      if (paramString) {
        params = Object.fromEntries(new URLSearchParams(paramString)) as ViewParams;
      }
      setCurrentView(newView);
      setViewParams(params);
    };
    window.addEventListener('hashchange', handleHashChange);
    // Init state from hash on mount
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentView]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded(prev => !prev);
  }, []);

  const showGlobalFeedback = useCallback((message: string, type: 'success' | 'error') => {
    setGlobalFeedback({ message, type });
    setTimeout(() => setGlobalFeedback(null), 5000);
  }, []);

  return {
    // State
    currentView,
    viewParams,
    isAuthenticated,
    currentUser,
    isSidebarExpanded,
    globalFeedback,
    themePreference,
    
    // Setters
    setCurrentView,
    setViewParams,
    setIsAuthenticated,
    setCurrentUser,
    setGlobalFeedback,
    setThemePreference,
    
    // Actions
    handleNavigate: navigate,
    toggleSidebar,
    showGlobalFeedback,
  };
}; 