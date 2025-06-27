import { useEffect, useCallback, useRef, useState } from 'react';
import { ImageRecord } from '../../../types';
import { findClosestAvailableMonth, isSameYearMonth, getInitialDate, getSwedishMonthName } from '../utils/timelineUtils';

interface UseTimelineSyncProps {
  posts: ImageRecord[];
  availableMonthsWithPosts: Date[];
  activeFeedDateFromScroll?: Date | null;
  letFeedDriveTimelineSync: boolean;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  setInputYear: (year: string) => void;
  setInputMonth: (month: string) => void;
  isEditingMonth: boolean;
  isEditingYear: boolean;
  onTimelineUserInteraction: () => void;
}

export const useTimelineSync = ({
  posts,
  availableMonthsWithPosts,
  activeFeedDateFromScroll,
  letFeedDriveTimelineSync,
  currentDate,
  setCurrentDate,
  setInputYear,
  setInputMonth,
  isEditingMonth,
  isEditingYear,
  onTimelineUserInteraction
}: UseTimelineSyncProps) => {
  const [isTimelineInteractingInternally, setIsTimelineInteractingInternally] = useState(false);
  const internalInteractionTimeoutRef = useRef<number | null>(null);

  const handleTimelineInteractionInternallyAndNotifyApp = useCallback(() => {
    setIsTimelineInteractingInternally(true);
    onTimelineUserInteraction(); 
    if (internalInteractionTimeoutRef.current) {
      clearTimeout(internalInteractionTimeoutRef.current);
    }
    internalInteractionTimeoutRef.current = window.setTimeout(() => {
      setIsTimelineInteractingInternally(false);
    }, 1500);
  }, [onTimelineUserInteraction]);

  // Primary sync logic: Update timeline based on feed scroll if allowed by App.tsx
  useEffect(() => {
    if (!letFeedDriveTimelineSync) {
      return;
    }

    if (activeFeedDateFromScroll) {
      let targetDateForTimeline: Date | null = null;
      if (availableMonthsWithPosts.length > 0) {
        const feedMonthCandidate = new Date(activeFeedDateFromScroll.getFullYear(), activeFeedDateFromScroll.getMonth(), 1);
        targetDateForTimeline = findClosestAvailableMonth(feedMonthCandidate, availableMonthsWithPosts);
      } else {
        targetDateForTimeline = new Date(activeFeedDateFromScroll.getFullYear(), activeFeedDateFromScroll.getMonth(), 1);
      }

      if (targetDateForTimeline && !isSameYearMonth(currentDate, targetDateForTimeline)) {
        setCurrentDate(targetDateForTimeline);
      }
    }
    // If activeFeedDateFromScroll is null, primary effect does nothing, timeline holds.
  }, [activeFeedDateFromScroll, letFeedDriveTimelineSync, availableMonthsWithPosts, currentDate, setCurrentDate]);

  // Update input fields when currentDate changes (and not editing or recently interacted)
  useEffect(() => {
    if (!isEditingYear && !isTimelineInteractingInternally) {
        setInputYear(currentDate.getFullYear().toString());
    }
    if (!isEditingMonth && !isTimelineInteractingInternally) {
        setInputMonth(getSwedishMonthName(currentDate));
    }
  }, [currentDate, isEditingYear, isEditingMonth, isTimelineInteractingInternally, setInputYear, setInputMonth]);

  // Secondary useEffect - for initialization and reacting when user drives timeline.
  useEffect(() => {
    if (isEditingMonth || isEditingYear || isTimelineInteractingInternally) {
      return; 
    }

    if (letFeedDriveTimelineSync) {
      // If the feed is driving, this effect should not interfere with date changes.
      // The primary effect handles feed-driven date changes.
      // If activeFeedDateFromScroll is null, feed is driving but no specific date,
      // timeline should hold. We only ensure inputs are synced.
      if (activeFeedDateFromScroll === null) {
        return; 
      }
      return; 
    }

    // If we reach here, letFeedDriveTimelineSync is FALSE (user is driving the timeline).
    // We should ensure currentDate is valid or pick a new one based on available months.
    // Use `currentDate` as the target for `getInitialDate` because the user is in control.
    const newDateCandidate = getInitialDate(posts, currentDate, availableMonthsWithPosts); 
    
    if (!isSameYearMonth(currentDate, newDateCandidate)) {
        setCurrentDate(newDateCandidate);
    }
  }, [
    posts, availableMonthsWithPosts, 
    activeFeedDateFromScroll, letFeedDriveTimelineSync, 
    isEditingMonth, isEditingYear, isTimelineInteractingInternally, 
    currentDate, setCurrentDate
  ]);

  return {
    isTimelineInteractingInternally,
    handleTimelineInteractionInternallyAndNotifyApp
  };
};