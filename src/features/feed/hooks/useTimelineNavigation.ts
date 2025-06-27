import { useCallback, useState, useEffect } from 'react';
import { ImageRecord } from '../../../../types';
import { findClosestAvailableMonth, getSwedishMonthName } from '../utils/timelineUtils';

interface UseTimelineNavigationProps {
  posts: ImageRecord[];
  availableMonthsWithPosts: Date[];
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  handleTimelineInteractionInternallyAndNotifyApp: () => void;
}

export const useTimelineNavigation = ({
  posts,
  availableMonthsWithPosts,
  currentDate,
  setCurrentDate,
  handleTimelineInteractionInternallyAndNotifyApp
}: UseTimelineNavigationProps) => {
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(true);

  // Update disabled state of nav buttons
  useEffect(() => {
    if (availableMonthsWithPosts.length === 0) {
      setIsPrevDisabled(true);
      setIsNextDisabled(true);
      return;
    }
    const currentTimelineTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime();
    const firstAvailableTime = availableMonthsWithPosts[0].getTime();
    const lastAvailableTime = availableMonthsWithPosts[availableMonthsWithPosts.length - 1].getTime();
    setIsPrevDisabled(currentTimelineTime <= firstAvailableTime);
    setIsNextDisabled(currentTimelineTime >= lastAvailableTime);
  }, [currentDate, availableMonthsWithPosts]);

  const handlePrevMonth = useCallback(() => {
    handleTimelineInteractionInternallyAndNotifyApp();
    if (availableMonthsWithPosts.length === 0 || isPrevDisabled) return;
    const currentMonthTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime();
    let prevAvailableMonth: Date | null = null;
    for (let i = availableMonthsWithPosts.length - 1; i >= 0; i--) {
        if (availableMonthsWithPosts[i].getTime() < currentMonthTime) {
            prevAvailableMonth = availableMonthsWithPosts[i];
            break;
        }
    }
    if (prevAvailableMonth) setCurrentDate(new Date(prevAvailableMonth));
  }, [availableMonthsWithPosts, currentDate, handleTimelineInteractionInternallyAndNotifyApp, isPrevDisabled, setCurrentDate]);

  const handleNextMonth = useCallback(() => {
    handleTimelineInteractionInternallyAndNotifyApp();
    if (availableMonthsWithPosts.length === 0 || isNextDisabled) return;
    const currentMonthTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime();
    let nextAvailableMonth: Date | null = null;
    for (let i = 0; i < availableMonthsWithPosts.length; i++) {
        if (availableMonthsWithPosts[i].getTime() > currentMonthTime) {
            nextAvailableMonth = availableMonthsWithPosts[i];
            break;
        }
    }
     if (nextAvailableMonth) setCurrentDate(new Date(nextAvailableMonth));
  }, [availableMonthsWithPosts, currentDate, handleTimelineInteractionInternallyAndNotifyApp, isNextDisabled, setCurrentDate]);

  return {
    isPrevDisabled,
    isNextDisabled,
    handlePrevMonth,
    handleNextMonth
  };
}; 