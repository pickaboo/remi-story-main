import { useState, useEffect, useMemo } from 'react';
import { ImageRecord } from '../../../../types';
import { getInitialDate, getAvailableMonthsWithPosts, getDaysToDisplay, getSwedishMonthName } from '../utils/timelineUtils';

interface UseTimelineStateProps {
  posts: ImageRecord[];
  activeFeedDateFromScroll?: Date | null;
}

export const useTimelineState = ({ posts, activeFeedDateFromScroll }: UseTimelineStateProps) => {
  const availableMonthsWithPosts = useMemo(() => {
    return getAvailableMonthsWithPosts(posts);
  }, [posts]);

  const [currentDate, setCurrentDate] = useState<Date>(() => 
    getInitialDate(posts, activeFeedDateFromScroll, availableMonthsWithPosts)
  );

  const [inputYear, setInputYear] = useState<string>(() => currentDate.getFullYear().toString());
  const [inputMonth, setInputMonth] = useState<string>(() => getSwedishMonthName(currentDate));

  const [isEditingYear, setIsEditingYear] = useState(false);
  const [isEditingMonth, setIsEditingMonth] = useState(false);

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

  const daysToDisplay = useMemo(() => {
    return getDaysToDisplay(posts, currentDate);
  }, [posts, currentDate]);

  const displayedYear = currentDate.getFullYear();
  const displayedMonthName = getSwedishMonthName(currentDate).charAt(0).toUpperCase() + getSwedishMonthName(currentDate).slice(1);

  return {
    currentDate,
    setCurrentDate,
    inputYear,
    setInputYear,
    inputMonth,
    setInputMonth,
    isEditingYear,
    setIsEditingYear,
    isEditingMonth,
    setIsEditingMonth,
    isPrevDisabled,
    isNextDisabled,
    availableMonthsWithPosts,
    daysToDisplay,
    displayedYear,
    displayedMonthName
  };
}; 