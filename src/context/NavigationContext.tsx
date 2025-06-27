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
  const { isAuthenticated } = useUser();

  const navigate = (viewOrPath: View | string, params?: any) => {
    if (typeof viewOrPath === 'string') {
      const path = viewOrPath.startsWith('/') ? viewOrPath.slice(1) : viewOrPath;
      window.location.hash = `#/${path}`;
      // Set currentView based on path
      switch (path) {
        case '':
        case 'home':
          setCurrentView(View.Home);
          break;
        case 'login':
          setCurrentView(View.Login);
          break;
        case 'signup':
          setCurrentView(View.Signup);
          break;
        case 'forgot-password':
          setCurrentView(View.ForgotPassword);
          break;
        case 'confirm-email':
          setCurrentView(View.EmailConfirmation);
          break;
        case 'complete-profile':
          setCurrentView(View.ProfileCompletion);
          break;
        case 'image-bank':
          setCurrentView(View.ImageBank);
          break;
        case 'diary':
          setCurrentView(View.Diary);
          break;
        case 'projects':
          setCurrentView(View.SlideshowProjects);
          break;
        case 'edit':
          setCurrentView(View.EditImage);
          break;
        case 'play':
          setCurrentView(View.PlaySlideshow);
          break;
        default:
          setCurrentView(View.Home);
      }
    } else {
      setCurrentView(viewOrPath);
    }
    setViewParams(params || null);
  };

  const handleHashChange = () => {
    const hash = window.location.hash.replace(/^#\/?|\/$/g, '');
    const [path, queryString] = hash.split('?');
    const params = queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {};

    // Debug log
    console.log('[NavigationContext] handleHashChange:', { path, isAuthenticated });

    // Define auth views
    const authViews = ['login', 'signup', 'forgot-password', 'confirm-email', 'complete-profile'];
    const isAuthView = authViews.includes(path);

    switch (path) {
      case '':
      case 'home':
        if (isAuthenticated) {
          setCurrentView(View.Home);
          setViewParams(params);
        } else {
          setCurrentView(View.Login);
          setViewParams(params);
        }
        break;
      case 'login':
        setCurrentView(View.Login);
        setViewParams(params);
        break;
      case 'signup':
        setCurrentView(View.Signup);
        setViewParams(params);
        break;
      case 'forgot-password':
        setCurrentView(View.ForgotPassword);
        setViewParams(params);
        break;
      case 'confirm-email':
        setCurrentView(View.EmailConfirmation);
        setViewParams(params);
        break;
      case 'complete-profile':
        setCurrentView(View.ProfileCompletion);
        setViewParams(params);
        break;
      case 'image-bank':
        if (isAuthenticated) {
          setCurrentView(View.ImageBank);
          setViewParams(params);
        } else {
          setCurrentView(View.Login);
          setViewParams(params);
        }
        break;
      case 'diary':
        if (isAuthenticated) {
          setCurrentView(View.Diary);
          setViewParams(params);
        } else {
          setCurrentView(View.Login);
          setViewParams(params);
        }
        break;
      case 'projects':
        if (isAuthenticated) {
          setCurrentView(View.SlideshowProjects);
          setViewParams(params);
        } else {
          setCurrentView(View.Login);
          setViewParams(params);
        }
        break;
      case 'edit':
        if (isAuthenticated) {
          if (params.imageId) {
            setCurrentView(View.EditImage);
            setViewParams({ imageId: params.imageId });
          } else {
            setCurrentView(View.Home);
            setViewParams(params);
          }
        } else {
          setCurrentView(View.Login);
          setViewParams(params);
        }
        break;
      case 'play':
        if (isAuthenticated) {
          if (params.projectId) {
            setCurrentView(View.PlaySlideshow);
            setViewParams({ projectId: params.projectId });
          } else {
            setCurrentView(View.SlideshowProjects);
            setViewParams(params);
          }
        } else {
          setCurrentView(View.Login);
          setViewParams(params);
        }
        break;
      default:
        if (isAuthenticated) {
          setCurrentView(View.Home);
          setViewParams(params);
        } else {
          setCurrentView(View.Login);
          setViewParams(params);
        }
    }
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