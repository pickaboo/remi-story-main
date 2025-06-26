import { View } from '../types';
import { useAppState } from '../context/AppStateContext';
import { useUser } from '../context/UserContext';
import { useSphere } from '../context/SphereContext';

export const useAppLayout = () => {
  const { 
    feedPostsForTimeline, 
    activeFeedDate,
    letFeedDriveTimelineSync,
    handleTimelineUserInteraction,
    handleAppScrollToPost
  } = useAppState();
  
  const { currentUser } = useUser();
  const { activeSphere } = useSphere();

  const shouldShowTimeline = (
    currentView: View,
    feedPostsForTimeline: any[],
    currentUser: any,
    activeSphere: any
  ) => {
    return currentView === View.Home && 
           feedPostsForTimeline.length > 0 && 
           currentUser && 
           activeSphere;
  };

  const timelineProps = {
    posts: feedPostsForTimeline,
    onScrollToPost: handleAppScrollToPost,
    activeFeedDateFromScroll: activeFeedDate,
    letFeedDriveTimelineSync,
    onTimelineUserInteraction: handleTimelineUserInteraction,
  };

  return {
    shouldShowTimeline: () => shouldShowTimeline(View.Home, feedPostsForTimeline, currentUser, activeSphere),
    timelineProps,
  };
}; 