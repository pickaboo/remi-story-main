import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { ImageRecord } from '../types';

interface AppStateContextType {
  // Sidebar state
  isSidebarExpanded: boolean;
  toggleSidebar: () => void;
  
  // Feed state
  feedPostsForTimeline: ImageRecord[];
  setFeedPostsForTimeline: (posts: ImageRecord[]) => void;
  activeFeedDate: Date | null;
  setActiveFeedDate: (date: Date | null) => void;
  letFeedDriveTimelineSync: boolean;
  setLetFeedDriveTimelineSync: (sync: boolean) => void;
  
  // Scroll ref
  mainScrollContainerRef: React.RefObject<HTMLDivElement | null>;
  
  // Timeline handlers
  handleVisiblePostsDateChange: (date: Date | null) => void;
  handleTimelineUserInteraction: () => void;
  handleAppScrollToPost: (postId: string) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [feedPostsForTimeline, setFeedPostsForTimeline] = useState<ImageRecord[]>([]);
  const [activeFeedDate, setActiveFeedDate] = useState<Date | null>(null);
  const [letFeedDriveTimelineSync, setLetFeedDriveTimelineSync] = useState(true);
  const mainScrollContainerRef = useRef<HTMLDivElement | null>(null);

  const toggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);

  const handleVisiblePostsDateChange = useCallback((date: Date | null) => {
    setActiveFeedDate(date);
    setLetFeedDriveTimelineSync(true);
  }, []);

  const handleTimelineUserInteraction = useCallback(() => {
    setLetFeedDriveTimelineSync(false); 
  }, []);

  const handleAppScrollToPost = (postId: string) => {
    const element = mainScrollContainerRef.current?.querySelector(`#post-item-${postId}`) as HTMLElement;
    if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  };

  const value: AppStateContextType = {
    isSidebarExpanded,
    toggleSidebar,
    feedPostsForTimeline,
    setFeedPostsForTimeline,
    activeFeedDate,
    setActiveFeedDate,
    letFeedDriveTimelineSync,
    setLetFeedDriveTimelineSync,
    mainScrollContainerRef,
    handleVisiblePostsDateChange,
    handleTimelineUserInteraction,
    handleAppScrollToPost,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}; 