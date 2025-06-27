import { useCallback, useRef, useEffect } from 'react';
import { findClosestAvailableMonth, isSameYearMonth, getSwedishMonthName } from '../utils/timelineUtils';

interface UseTimelineNavigationProps {
  currentDate: Date;
  availableMonthsWithPosts: Date[];
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
  isEditingYear: boolean;
  isEditingMonth: boolean;
  onTimelineUserInteraction: () => void;
  setCurrentDate: (date: Date) => void;
}

export const useTimelineNavigation = ({
  currentDate,
  availableMonthsWithPosts,
  isPrevDisabled,
  isNextDisabled,
  isEditingYear,
  isEditingMonth,
  onTimelineUserInteraction,
  setCurrentDate
}: UseTimelineNavigationProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const internalInteractionTimeoutRef = useRef<number | null>(null);

  const handleTimelineInteractionInternallyAndNotifyApp = useCallback(() => {
    onTimelineUserInteraction(); 
    if (internalInteractionTimeoutRef.current) {
      clearTimeout(internalInteractionTimeoutRef.current);
    }
    internalInteractionTimeoutRef.current = window.setTimeout(() => {
      // Reset internal interaction state after timeout
    }, 1500);
  }, [onTimelineUserInteraction]);

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

  // Wheel scroll handler
  useEffect(() => {
    const handleWheelScroll = (event: WheelEvent) => {
      event.preventDefault();
      handleTimelineInteractionInternallyAndNotifyApp();
      if (event.deltaY < 0) {
        if(!isPrevDisabled) handlePrevMonth();
      } else if (event.deltaY > 0) {
        if(!isNextDisabled) handleNextMonth();
      }
    };
    const currentTimelineRef = timelineRef.current;
    if (currentTimelineRef) {
      currentTimelineRef.addEventListener('wheel', handleWheelScroll, { passive: false });
    }
    return () => {
      if (currentTimelineRef) currentTimelineRef.removeEventListener('wheel', handleWheelScroll);
      if(internalInteractionTimeoutRef.current) clearTimeout(internalInteractionTimeoutRef.current);
    };
  }, [handlePrevMonth, handleNextMonth, handleTimelineInteractionInternallyAndNotifyApp, isPrevDisabled, isNextDisabled]);

  return {
    timelineRef,
    handlePrevMonth,
    handleNextMonth,
    handleTimelineInteractionInternallyAndNotifyApp
  };
}; 