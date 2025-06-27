import React, { useRef, useEffect } from 'react';
import { allSwedishMonthNames, getMonthNumberFromName, getSwedishMonthName, findClosestAvailableMonth, isSameYearMonth } from '../utils/timelineUtils';

interface TimelineDateInputProps {
  currentDate: Date;
  inputYear: string;
  inputMonth: string;
  isEditingYear: boolean;
  isEditingMonth: boolean;
  availableMonthsWithPosts: Date[];
  displayedYear: number;
  displayedMonthName: string;
  setInputYear: (year: string) => void;
  setInputMonth: (month: string) => void;
  setIsEditingYear: (editing: boolean) => void;
  setIsEditingMonth: (editing: boolean) => void;
  setCurrentDate: (date: Date) => void;
  onTimelineUserInteraction: () => void;
}

export const TimelineDateInput: React.FC<TimelineDateInputProps> = ({
  currentDate,
  inputYear,
  inputMonth,
  isEditingYear,
  isEditingMonth,
  availableMonthsWithPosts,
  displayedYear,
  displayedMonthName,
  setInputYear,
  setInputMonth,
  setIsEditingYear,
  setIsEditingMonth,
  setCurrentDate,
  onTimelineUserInteraction
}) => {
  const yearInputRef = useRef<HTMLInputElement>(null);
  const monthSelectRef = useRef<HTMLSelectElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingYear && yearInputRef.current) {
        yearInputRef.current.focus();
        yearInputRef.current.select();
    }
  }, [isEditingYear]);

  useEffect(() => {
    if (isEditingMonth && monthSelectRef.current) {
        monthSelectRef.current.focus();
    }
  }, [isEditingMonth]);

  const applyDateChangeFromInput = () => {
    const yearNum = parseInt(inputYear, 10);
    const monthNum = getMonthNumberFromName(inputMonth);
    if (!isNaN(yearNum) && yearNum >= 1000 && yearNum <= 9999 && monthNum >= 0 && monthNum <= 11) {
      const newRawDate = new Date(yearNum, monthNum, 1);
      let finalDateToSet = newRawDate;
      if (availableMonthsWithPosts.length > 0) {
          const closest = findClosestAvailableMonth(newRawDate, availableMonthsWithPosts);
          if (closest) finalDateToSet = closest;
      }
      if (!isSameYearMonth(finalDateToSet, currentDate)) {
        setCurrentDate(finalDateToSet);
        onTimelineUserInteraction();
      } else { 
        setInputYear(finalDateToSet.getFullYear().toString());
        setInputMonth(getSwedishMonthName(finalDateToSet));
      }
    }
  };

  const handleYearClick = () => {
    if (!isEditingMonth) {
      setIsEditingYear(true);
      onTimelineUserInteraction();
    }
  };

  const handleMonthClick = () => {
    if (!isEditingYear) {
      setIsEditingMonth(true);
      onTimelineUserInteraction();
    }
  };

  const handleYearKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleYearClick();
    }
  };

  const handleMonthKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleMonthClick();
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonthName = e.target.value;
    setInputMonth(newMonthName);
    const yearNum = parseInt(inputYear, 10);
    const monthNum = getMonthNumberFromName(newMonthName);
    if (!isNaN(yearNum) && monthNum !== -1) {
      const newRawDate = new Date(yearNum, monthNum, 1);
      let finalDateToSet = newRawDate;
      if (availableMonthsWithPosts.length > 0) {
        const closest = findClosestAvailableMonth(newRawDate, availableMonthsWithPosts);
        if (closest) finalDateToSet = closest;
      }
      if (!isSameYearMonth(finalDateToSet, currentDate)) {
        setCurrentDate(finalDateToSet);
        onTimelineUserInteraction();
      }
    }
    setIsEditingMonth(false);
  };

  return (
    <div className="flex-shrink-0 pb-2 mb-2 border-b border-white/20">
      {isEditingYear ? (
        <input
          ref={yearInputRef}
          type="number"
          value={inputYear}
          onChange={(e) => setInputYear(e.target.value)}
          onBlur={() => { applyDateChangeFromInput(); setIsEditingYear(false); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { 
              e.preventDefault(); 
              applyDateChangeFromInput(); 
              setIsEditingYear(false); 
            } 
            else if (e.key === 'Escape') { 
              setIsEditingYear(false); 
              setInputYear(currentDate.getFullYear().toString()); 
            }
          }}
          className="w-full mb-1 p-1 text-center bg-black/50 text-slate-100 rounded-md border border-white/30 focus:ring-1 focus:ring-primary focus:border-primary text-2xl font-bold appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label="Redigera år"
        />
      ) : (
        <div
          className="text-center text-2xl font-bold text-slate-100 mb-1 cursor-pointer bg-black/40 backdrop-blur-sm hover:bg-black/50 px-4 py-1.5 rounded-lg shadow-md"
          onClick={handleYearClick}
          title="Klicka för att redigera år" 
          role="button" 
          tabIndex={0}
          onKeyDown={handleYearKeyDown}
        >
          {displayedYear}
        </div>
      )}

      <div className="flex items-center justify-center mt-1">
        {isEditingMonth ? (
          <select
            ref={monthSelectRef} 
            value={inputMonth}
            onChange={handleMonthChange}
            onBlur={() => { setIsEditingMonth(false); setInputMonth(getSwedishMonthName(currentDate)); }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { 
                setIsEditingMonth(false); 
                setInputMonth(getSwedishMonthName(currentDate)); 
              } 
              else if (e.key === 'Enter') { 
                e.preventDefault(); 
                monthSelectRef.current?.blur(); 
              }
            }}
            className="flex-shrink p-1 mx-1 bg-black/50 text-slate-100 rounded-md border border-white/30 focus:ring-1 focus:ring-primary focus:border-primary text-lg font-medium capitalize text-center w-auto"
            aria-label="Välj månad"
          >
            {allSwedishMonthNames.map((name, index) => (
              <option key={index} value={name}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </option>
            ))}
          </select>
        ) : (
          <div
            className="text-center text-lg font-medium text-slate-200 capitalize w-auto px-3 py-1 cursor-pointer bg-black/40 backdrop-blur-sm hover:bg-black/50 rounded-full shadow-md mx-1"
            onClick={handleMonthClick}
            title="Klicka för att redigera månad" 
            role="button" 
            tabIndex={0}
            onKeyDown={handleMonthKeyDown}
          >
            {displayedMonthName}
          </div>
        )}
      </div>
    </div>
  );
}; 