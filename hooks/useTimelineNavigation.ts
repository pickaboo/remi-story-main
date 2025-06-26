import { useState, useEffect, useCallback, useMemo } from 'react';
import { ImageRecord } from '../types';

interface TimelineNavigationState {
  currentDate: Date;
  inputYear: string;
  inputMonth: string;
  isEditingYear: boolean;
  isEditingMonth: boolean;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
}

interface TimelineNavigationActions {
  setCurrentDate: (date: Date) => void;
  setInputYear: (year: string) => void;
  setInputMonth: (month: string) => void;
  setIsEditingYear: (editing: boolean) => void;
  setIsEditingMonth: (editing: boolean) => void;
  navigateToPreviousMonth: () => void;
  navigateToNextMonth: () => void;
  applyDateChangeFromInput: () => void;
  handleYearChange: (year: string) => void;
  handleMonthChange: (month: string) => void;
}

interface UseTimelineNavigationProps {
  posts: ImageRecord[];
  activeFeedDateFromScroll?: Date | null;
  letFeedDriveTimelineSync: boolean;
  onTimelineUserInteraction: () => void;
}

const getSwedishMonthName = (date: Date): string => {
  return date.toLocaleDateString('sv-SE', { month: 'long' });
};

const allSwedishMonthNames = Array.from({ length: 12 }, (_, i) => getSwedishMonthName(new Date(2000, i, 1)));

const getMonthNumberFromName = (monthName: string): number => {
  const monthIndex = allSwedishMonthNames.findIndex(name => name.toLowerCase() === monthName.toLowerCase());
  return monthIndex;
};

const isSameYearMonth = (date1?: Date | null, date2?: Date | null): boolean => {
  if (!date1 || !date2) return date1 === date2;
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
};

const findClosestAvailableMonth = (targetDate: Date, availableMonths: Date[]): Date | null => {
  if (availableMonths.length === 0) return null;

  const targetTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).getTime();

  const exactMatch = availableMonths.find(d => d.getTime() === targetTime);
  if (exactMatch) return new Date(exactMatch);

  let closestMatch: Date | null = null;
  let minDiff = Infinity;

  for (const availableMonth of availableMonths) {
    const diff = Math.abs(availableMonth.getTime() - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closestMatch = availableMonth;
    } else if (diff === minDiff) {
      if (closestMatch && availableMonth.getTime() < closestMatch.getTime() && targetTime > availableMonth.getTime()) {
        closestMatch = availableMonth;
      }
    }
  }
  return closestMatch ? new Date(closestMatch) : (availableMonths.length > 0 ? new Date(availableMonths[0]) : null);
};

const getInitialDate = (posts: ImageRecord[], activeFeedDate?: Date | null, availableMonths?: Date[]): Date => {
  let candidateDate: Date;
  if (activeFeedDate) {
    candidateDate = new Date(activeFeedDate.getFullYear(), activeFeedDate.getMonth(), 1);
  } else if (posts.length > 0 && posts[0].dateTaken) {
    const latestPostDate = new Date(posts[0].dateTaken);
    candidateDate = new Date(latestPostDate.getFullYear(), latestPostDate.getMonth(), 1);
  } else {
    const today = new Date();
    candidateDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  if (availableMonths && availableMonths.length > 0) {
    return findClosestAvailableMonth(candidateDate, availableMonths) || candidateDate;
  }
  return candidateDate;
};

export const useTimelineNavigation = ({
  posts,
  activeFeedDateFromScroll,
  letFeedDriveTimelineSync,
  onTimelineUserInteraction
}: UseTimelineNavigationProps): [TimelineNavigationState, TimelineNavigationActions] => {
  // Available months with posts
  const availableMonthsWithPosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    const monthSet = new Set<string>();
    posts.forEach(post => {
      if (post.dateTaken) {
        const d = new Date(post.dateTaken);
        monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });
    return Array.from(monthSet)
      .map(ym => {
        const [year, month] = ym.split('-').map(Number);
        return new Date(year, month - 1, 1);
      })
      .sort((a, b) => a.getTime() - b.getTime());
  }, [posts]);

  // State
  const [currentDate, setCurrentDate] = useState<Date>(() => 
    getInitialDate(posts, activeFeedDateFromScroll, availableMonthsWithPosts)
  );
  const [inputYear, setInputYear] = useState<string>(() => currentDate.getFullYear().toString());
  const [inputMonth, setInputMonth] = useState<string>(() => getSwedishMonthName(currentDate));
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [isEditingMonth, setIsEditingMonth] = useState(false);
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(true);

  // Primary sync logic: Update timeline based on feed scroll if allowed
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
  }, [activeFeedDateFromScroll, letFeedDriveTimelineSync, availableMonthsWithPosts, currentDate]);

  // Update input fields when currentDate changes
  useEffect(() => {
    if (!isEditingYear) {
      setInputYear(currentDate.getFullYear().toString());
    }
    if (!isEditingMonth) {
      setInputMonth(getSwedishMonthName(currentDate));
    }
  }, [currentDate, isEditingYear, isEditingMonth]);

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

  // Navigation actions
  const navigateToPreviousMonth = useCallback(() => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    onTimelineUserInteraction();
  }, [currentDate, onTimelineUserInteraction]);

  const navigateToNextMonth = useCallback(() => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    onTimelineUserInteraction();
  }, [currentDate, onTimelineUserInteraction]);

  const applyDateChangeFromInput = useCallback(() => {
    const yearNum = parseInt(inputYear, 10);
    const monthNum = getMonthNumberFromName(inputMonth);

    if (isNaN(yearNum) || monthNum === -1) {
      // Reset to current values if invalid
      setInputYear(currentDate.getFullYear().toString());
      setInputMonth(getSwedishMonthName(currentDate));
      return;
    }

    const newDate = new Date(yearNum, monthNum, 1);
    
    // Check if the new date is within available months
    if (availableMonthsWithPosts.length > 0) {
      const closestMonth = findClosestAvailableMonth(newDate, availableMonthsWithPosts);
      if (closestMonth) {
        setCurrentDate(closestMonth);
        onTimelineUserInteraction();
        return;
      }
    }

    // If no available months or date is valid, set directly
    setCurrentDate(newDate);
    onTimelineUserInteraction();
  }, [inputYear, inputMonth, currentDate, availableMonthsWithPosts, onTimelineUserInteraction]);

  const handleYearChange = useCallback((year: string) => {
    setInputYear(year);
    setIsEditingYear(false);
    applyDateChangeFromInput();
  }, [applyDateChangeFromInput]);

  const handleMonthChange = useCallback((month: string) => {
    setInputMonth(month);
    setIsEditingMonth(false);
    applyDateChangeFromInput();
  }, [applyDateChangeFromInput]);

  // State object
  const state: TimelineNavigationState = {
    currentDate,
    inputYear,
    inputMonth,
    isEditingYear,
    isEditingMonth,
    isPrevDisabled,
    isNextDisabled
  };

  // Actions object
  const actions: TimelineNavigationActions = {
    setCurrentDate,
    setInputYear,
    setInputMonth,
    setIsEditingYear,
    setIsEditingMonth,
    navigateToPreviousMonth,
    navigateToNextMonth,
    applyDateChangeFromInput,
    handleYearChange,
    handleMonthChange
  };

  return [state, actions];
}; 