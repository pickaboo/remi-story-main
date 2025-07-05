import { useState, useEffect, useCallback } from 'react';
import { ImageRecord } from '../types';

interface UseTimelineProps {
  posts: ImageRecord[];
  onDateChange?: (date: Date) => void;
}

interface UseTimelineReturn {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  inputYear: string;
  setInputYear: (year: string) => void;
  inputMonth: string;
  setInputMonth: (month: string) => void;
  isEditingYear: boolean;
  setIsEditingYear: (value: boolean) => void;
  isEditingMonth: boolean;
  setIsEditingMonth: (value: boolean) => void;
  availableMonthsWithPosts: Date[];
  displayedYear: number;
  displayedMonth: string;
  handleYearChange: (year: string) => void;
  handleMonthChange: (month: string) => void;
  handleYearSubmit: () => void;
  handleMonthSubmit: () => void;
  handleYearCancel: () => void;
  handleMonthCancel: () => void;
}

/**
 * Custom hook for managing timeline state and date navigation
 */
export function useTimeline({ 
  posts, 
  onDateChange 
}: UseTimelineProps): UseTimelineReturn {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [inputYear, setInputYear] = useState(currentDate.getFullYear().toString());
  const [inputMonth, setInputMonth] = useState(getSwedishMonthName(currentDate));
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [isEditingMonth, setIsEditingMonth] = useState(false);

  // Get available months with posts
  const availableMonthsWithPosts = useCallback(() => {
    const months = new Set<string>();
    posts.forEach(post => {
      const postDate = new Date(post.createdAt);
      const monthKey = `${postDate.getFullYear()}-${postDate.getMonth()}`;
      months.add(monthKey);
    });
    
    return Array.from(months).map(monthKey => {
      const [year, month] = monthKey.split('-').map(Number);
      return new Date(year, month, 1);
    }).sort((a, b) => b.getTime() - a.getTime());
  }, [posts]);

  const displayedYear = currentDate.getFullYear();
  const displayedMonth = getSwedishMonthName(currentDate);

  const handleYearChange = (year: string) => {
    setInputYear(year);
  };

  const handleMonthChange = (month: string) => {
    setInputMonth(month);
  };

  const handleYearSubmit = () => {
    const year = parseInt(inputYear);
    if (year >= 1900 && year <= 2100) {
      const newDate = new Date(year, currentDate.getMonth(), 1);
      setCurrentDate(newDate);
      onDateChange?.(newDate);
    }
    setIsEditingYear(false);
  };

  const handleMonthSubmit = () => {
    const monthIndex = getSwedishMonthIndex(inputMonth);
    if (monthIndex !== -1) {
      const newDate = new Date(currentDate.getFullYear(), monthIndex, 1);
      setCurrentDate(newDate);
      onDateChange?.(newDate);
    }
    setIsEditingMonth(false);
  };

  const handleYearCancel = () => {
    setInputYear(currentDate.getFullYear().toString());
    setIsEditingYear(false);
  };

  const handleMonthCancel = () => {
    setInputMonth(getSwedishMonthName(currentDate));
    setIsEditingMonth(false);
  };

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
    availableMonthsWithPosts: availableMonthsWithPosts(),
    displayedYear,
    displayedMonth,
    handleYearChange,
    handleMonthChange,
    handleYearSubmit,
    handleMonthSubmit,
    handleYearCancel,
    handleMonthCancel
  };
}

// Helper functions
function getSwedishMonthName(date: Date): string {
  const months = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];
  return months[date.getMonth()];
}

function getSwedishMonthIndex(monthName: string): number {
  const months = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];
  return months.findIndex(month => month.toLowerCase() === monthName.toLowerCase());
} 