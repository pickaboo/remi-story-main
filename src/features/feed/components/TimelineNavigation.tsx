import React from 'react';
import { TimelineDateInput } from './TimelineDateInput';
import { TimelineControls } from './TimelineControls';

interface TimelineNavigationProps {
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
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
  onTimelineUserInteraction: () => void;
}

export const TimelineNavigation: React.FC<TimelineNavigationProps> = ({
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
  onPrevMonth,
  onNextMonth,
  isPrevDisabled,
  isNextDisabled,
  onTimelineUserInteraction
}) => {
  return (
    <div className="flex-shrink-0 pb-2 mb-2 border-b border-white/20">
      <TimelineDateInput
        currentDate={currentDate}
        inputYear={inputYear}
        inputMonth={inputMonth}
        isEditingYear={isEditingYear}
        isEditingMonth={isEditingMonth}
        availableMonthsWithPosts={availableMonthsWithPosts}
        displayedYear={displayedYear}
        displayedMonthName={displayedMonthName}
        setInputYear={setInputYear}
        setInputMonth={setInputMonth}
        setIsEditingYear={setIsEditingYear}
        setIsEditingMonth={setIsEditingMonth}
        setCurrentDate={setCurrentDate}
        onTimelineUserInteraction={onTimelineUserInteraction}
      />
      
      <TimelineControls
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        isPrevDisabled={isPrevDisabled}
        isNextDisabled={isNextDisabled}
        isEditingYear={isEditingYear}
        isEditingMonth={isEditingMonth}
      />
    </div>
  );
}; 