import { useState, useCallback, useEffect } from 'react';
import { View, ViewParams, LegacyFeedback, User } from '../types';

const viewToPathMap: Record<View, string> = {
  [View.Home]: '',
  [View.ImageBank]: 'image-bank',
  [View.Diary]: 'diary',
  [View.EditImage]: 'edit-image',
  [View.SlideshowProjects]: 'projects',
  [View.PlaySlideshow]: 'play-slideshow',
  [View.Login]: 'login',
  [View.Signup]: 'signup',

  [View.EmailConfirmation]: 'confirm-email',
  [View.ProfileCompletion]: 'complete-profile',
};

const pathToViewMap: Record<string, View> = {
  '': View.Home,
  'image-bank': View.ImageBank,
  'diary': View.Diary,
  'edit-image': View.EditImage,
  'projects': View.SlideshowProjects,
  'play-slideshow': View.PlaySlideshow,
  'login': View.Login,
  'signup': View.Signup,

  'confirm-email': View.EmailConfirmation,
  'complete-profile': View.ProfileCompletion,
};

export const useAppState = () => {
  const [currentView, setCurrentView] = useState<View>(View.Login);
  const [viewParams, setViewParams] = useState<ViewParams | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [globalFeedback, setGlobalFeedback] = useState<LegacyFeedback | null>(null);
  const [themePreference, setThemePreference] = useState<User['themePreference']>('system');

  // Keep themePreference in sync with currentUser
  useEffect(() => {
    if (currentUser && currentUser.themePreference) {
      setThemePreference(currentUser.themePreference);
    }
  }, [currentUser]);

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
      const newView = pathToViewMap[basePath] || View.Home;
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