import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { View } from '../types';
import { useUser } from './UserContext';

interface NavigationContextType {
  currentView: View;
  viewParams: any;
  navigate: (viewOrPath: View | string, params?: any) => void;
  getCurrentPathForSidebar: () => string;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [currentView, setCurrentView] = useState<View>(View.Login);
  const [viewParams, setViewParams] = useState<any>(null);
  const { isAuthenticated, currentUser } = useUser();

  const navigate = (viewOrPath: View | string, params?: any) => {
    let targetPath = '';
    if (typeof viewOrPath === 'string') {
      targetPath = viewOrPath.startsWith('/') ? viewOrPath.slice(1) : viewOrPath;
      targetPath = targetPath.toLowerCase();
    } else {
      targetPath = String(viewOrPath).toLowerCase();
    }
    const newHash = `#/${targetPath}`;
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  };

  const handleHashChange = () => {
    if (isAuthenticated === null) {
      // Auth state not known yet, don't change view
      return;
    }
    const hash = window.location.hash.replace(/^#\/?|\/$/g, '');
    const [path, queryString] = hash.split('?');
    const normalizedPath = (path || '').toLowerCase();
    if (normalizedPath === '_tmp') return; // Ignore dummy hash
    const params = queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {};

    // Debug log
    console.log('[NavigationContext] handleHashChange:', { path, normalizedPath, isAuthenticated });

    // Define auth views
    const authViews = ['login', 'signup', 'forgot-password', 'confirm-email', 'complete-profile'];
    const isAuthView = authViews.includes(normalizedPath);

    let viewToSet = null;
    switch (normalizedPath) {
      case '':
      case 'home':
        if (isAuthenticated && currentUser) {
          viewToSet = View.Home;
          setCurrentView(View.Home);
          setViewParams(params);
          console.log('[NavigationContext] Setting currentView to View.Home (feed)');
        } else {
          viewToSet = View.Login;
          setCurrentView(View.Login);
          setViewParams(params);
          console.log('[NavigationContext] Setting currentView to View.Login (not authenticated)');
        }
        break;
      case 'login':
        viewToSet = View.Login;
        setCurrentView(View.Login);
        setViewParams(params);
        break;
      case 'signup':
        viewToSet = View.Signup;
        setCurrentView(View.Signup);
        setViewParams(params);
        break;
      case 'forgot-password':
        viewToSet = View.ForgotPassword;
        setCurrentView(View.ForgotPassword);
        setViewParams(params);
        break;
      case 'confirm-email':
        viewToSet = View.EmailConfirmation;
        setCurrentView(View.EmailConfirmation);
        setViewParams(params);
        break;
      case 'complete-profile':
        viewToSet = View.ProfileCompletion;
        setCurrentView(View.ProfileCompletion);
        setViewParams(params);
        break;
      case 'image-bank':
        if (isAuthenticated && currentUser) {
          viewToSet = View.ImageBank;
          setCurrentView(View.ImageBank);
          setViewParams(params);
        } else {
          viewToSet = View.Login;
          setCurrentView(View.Login);
          setViewParams(params);
        }
        break;
      case 'diary':
        if (isAuthenticated && currentUser) {
          viewToSet = View.Diary;
          setCurrentView(View.Diary);
          setViewParams(params);
        } else {
          viewToSet = View.Login;
          setCurrentView(View.Login);
          setViewParams(params);
        }
        break;
      case 'projects':
        if (isAuthenticated && currentUser) {
          viewToSet = View.SlideshowProjects;
          setCurrentView(View.SlideshowProjects);
          setViewParams(params);
        } else {
          viewToSet = View.Login;
          setCurrentView(View.Login);
          setViewParams(params);
        }
        break;
      case 'edit':
        if (isAuthenticated && currentUser) {
          if (params.imageId) {
            viewToSet = View.EditImage;
            setCurrentView(View.EditImage);
            setViewParams({ imageId: params.imageId });
          } else {
            viewToSet = View.Home;
            setCurrentView(View.Home);
            setViewParams(params);
          }
        } else {
          viewToSet = View.Login;
          setCurrentView(View.Login);
          setViewParams(params);
        }
        break;
      case 'play':
        if (isAuthenticated && currentUser) {
          if (params.projectId) {
            viewToSet = View.PlaySlideshow;
            setCurrentView(View.PlaySlideshow);
            setViewParams({ projectId: params.projectId });
          } else {
            viewToSet = View.SlideshowProjects;
            setCurrentView(View.SlideshowProjects);
            setViewParams(params);
          }
        } else {
          viewToSet = View.Login;
          setCurrentView(View.Login);
          setViewParams(params);
        }
        break;
      default:
        if (isAuthenticated && currentUser) {
          viewToSet = View.Home;
          setCurrentView(View.Home);
          setViewParams(params);
        } else {
          viewToSet = View.Login;
          setCurrentView(View.Login);
          setViewParams(params);
        }
    }
    console.log('[NavigationContext] After switch, viewToSet:', viewToSet);
  };

  const getCurrentPathForSidebar = () => {
    const hash = window.location.hash.replace(/^#\/?|\/$/g, '');
    const basePath = hash.split('/')[0].split('?')[0]; 
    if (basePath === 'projects') return '/projects';
    if (basePath === 'image-bank') return '/image-bank';
    if (basePath === 'diary') return '/diary';
    if (basePath === '') return '/'; 
    return `/${basePath}`; 
  };

  useEffect(() => {
    const handleHashChangeEvent = () => handleHashChange();
    window.addEventListener('hashchange', handleHashChangeEvent);
    return () => window.removeEventListener('hashchange', handleHashChangeEvent);
  }, []);

  useEffect(() => {
    if (isAuthenticated !== null) {
      handleHashChange();
    }
  }, [isAuthenticated]);

  const value: NavigationContextType = {
    currentView,
    viewParams,
    navigate,
    getCurrentPathForSidebar,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}; 