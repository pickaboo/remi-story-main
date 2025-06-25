import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { View } from '../types';

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

  const navigate = (viewOrPath: View | string, params?: any) => {
    if (typeof viewOrPath === 'string') {
      const path = viewOrPath.startsWith('/') ? viewOrPath.slice(1) : viewOrPath;
      window.location.hash = `#/${path}`;
      setCurrentView(View.Home); // Default to home for path-based navigation
    } else {
      setCurrentView(viewOrPath);
    }
    setViewParams(params || null);
  };

  const handleHashChange = () => {
    const hash = window.location.hash.replace(/^#\/?|\/$/g, '');
    const [path, queryString] = hash.split('?');
    const params = queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {};
    
    switch (path) {
      case '':
      case 'home':
        navigate(View.Home, params);
        break;
      case 'image-bank':
        navigate(View.ImageBank);
        break;
      case 'diary':
        navigate(View.Diary);
        break;
      case 'projects':
        navigate(View.SlideshowProjects);
        break;
      case 'edit':
        if (params.imageId) {
          navigate(View.EditImage, { imageId: params.imageId });
        } else {
          navigate(View.Home);
        }
        break;
      case 'play':
        if (params.projectId) {
          navigate(View.PlaySlideshow, { projectId: params.projectId });
        } else {
          navigate(View.SlideshowProjects);
        }
        break;
      default:
        navigate(View.Home);
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