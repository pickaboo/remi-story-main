import { useState, useCallback, useRef, useEffect } from 'react';
import { ImageRecord } from '../../../types';
import { getSwedishMonthName } from '../utils/timelineUtils';

interface UseTimelineStateProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  onTimelineUserInteraction: () => void;
}

export const useTimelineState = ({
  currentDate,
  setCurrentDate,
  onTimelineUserInteraction
}: UseTimelineStateProps) => {
  const [inputYear, setInputYear] = useState(currentDate.getFullYear().toString());
  const [inputMonth, setInputMonth] = useState(getSwedishMonthName(currentDate));
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [isEditingMonth, setIsEditingMonth] = useState(false);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);

  // Update input values when currentDate changes
  useEffect(() => {
    if (!isEditingYear) {
      setInputYear(currentDate.getFullYear().toString());
    }
    if (!isEditingMonth) {
      setInputMonth(getSwedishMonthName(currentDate));
    }
  }, [currentDate, isEditingYear, isEditingMonth]);

  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputYear(e.target.value);
  }, []);

  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMonth(e.target.value);
  }, []);

  const handleYearKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const year = parseInt(inputYear);
      if (!isNaN(year) && year >= 1900 && year <= 2100) {
        const newDate = new Date(year, currentDate.getMonth(), 1);
        setCurrentDate(newDate);
        setIsEditingYear(false);
        onTimelineUserInteraction();
      }
    } else if (e.key === 'Escape') {
      setInputYear(currentDate.getFullYear().toString());
      setIsEditingYear(false);
    }
  }, [inputYear, currentDate, setCurrentDate, onTimelineUserInteraction]);

  const handleMonthKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const monthNames = [
        'januari', 'februari', 'mars', 'april', 'maj', 'juni',
        'juli', 'augusti', 'september', 'oktober', 'november', 'december'
      ];
      const monthIndex = monthNames.findIndex(name => 
        name.toLowerCase() === inputMonth.toLowerCase()
      );
      if (monthIndex !== -1) {
        const newDate = new Date(currentDate.getFullYear(), monthIndex, 1);
        setCurrentDate(newDate);
        setIsEditingMonth(false);
        onTimelineUserInteraction();
      }
    } else if (e.key === 'Escape') {
      setInputMonth(getSwedishMonthName(currentDate));
      setIsEditingMonth(false);
    }
  }, [inputMonth, currentDate, setCurrentDate, onTimelineUserInteraction]);

  const handleYearBlur = useCallback(() => {
    const year = parseInt(inputYear);
    if (!isNaN(year) && year >= 1900 && year <= 2100) {
      const newDate = new Date(year, currentDate.getMonth(), 1);
      setCurrentDate(newDate);
      onTimelineUserInteraction();
    } else {
      setInputYear(currentDate.getFullYear().toString());
    }
    setIsEditingYear(false);
  }, [inputYear, currentDate, setCurrentDate, onTimelineUserInteraction]);

  const handleMonthBlur = useCallback(() => {
    const monthNames = [
      'januari', 'februari', 'mars', 'april', 'maj', 'juni',
      'juli', 'augusti', 'september', 'oktober', 'november', 'december'
    ];
    const monthIndex = monthNames.findIndex(name => 
      name.toLowerCase() === inputMonth.toLowerCase()
    );
    if (monthIndex !== -1) {
      const newDate = new Date(currentDate.getFullYear(), monthIndex, 1);
      setCurrentDate(newDate);
      onTimelineUserInteraction();
    } else {
      setInputMonth(getSwedishMonthName(currentDate));
    }
    setIsEditingMonth(false);
  }, [inputMonth, currentDate, setCurrentDate, onTimelineUserInteraction]);

  const startEditingYear = useCallback(() => {
    setIsEditingYear(true);
    setTimeout(() => yearInputRef.current?.focus(), 0);
  }, []);

  const startEditingMonth = useCallback(() => {
    setIsEditingMonth(true);
    setTimeout(() => monthInputRef.current?.focus(), 0);
  }, []);

  return {
    inputYear,
    inputMonth,
    isEditingYear,
    isEditingMonth,
    yearInputRef,
    monthInputRef,
    handleYearChange,
    handleMonthChange,
    handleYearKeyDown,
    handleMonthKeyDown,
    handleYearBlur,
    handleMonthBlur,
    startEditingYear,
    startEditingMonth,
    setInputYear,
    setInputMonth
  };
}; 