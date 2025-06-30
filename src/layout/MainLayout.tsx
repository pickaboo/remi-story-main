import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Timeline } from '../features/feed/components/Timeline';
import { useAppState } from '../context/AppStateContext';
import { useAppLayout } from '../common/hooks/useAppLayout';

interface MainLayoutProps {
  children: React.ReactNode;
}

const YOUR_LOGO_URL = "https://example.com/your-logo.png";

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { 
    isSidebarExpanded, 
    toggleSidebar, 
    mainScrollContainerRef,
  } = useAppState();
  
  const { shouldShowTimeline, timelineProps } = useAppLayout();

  return (
    <>
      <div className="h-full flex">
        <Sidebar
          isExpanded={isSidebarExpanded}
          onToggle={toggleSidebar}
        />
        <Header
          isSidebarExpanded={isSidebarExpanded} 
          logoUrl={YOUR_LOGO_URL.startsWith("https://example.com") ? undefined : YOUR_LOGO_URL}
        />
        <div className="flex-1 pt-16 h-full flex justify-center">
          <div className="h-full overflow-y-auto no-scrollbar w-full" ref={mainScrollContainerRef}>
            {children}
          </div>
        </div>
        
        {shouldShowTimeline() && (
          <div className="fixed top-[calc(4rem+2rem)] right-60 w-36 bottom-32 z-20 group" >
            <Timeline {...timelineProps} />
          </div>
        )}
      </div>
    </>
  );
}; 