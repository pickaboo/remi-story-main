import React, { useRef, useEffect } from 'react';
import { TimelineDateInput } from './TimelineDateInput';
import { TimelineControls } from './TimelineControls';

interface TimelineNavigationProps {
  inputYear: string;
  inputMonth: string;
  isEditingYear: boolean;
  isEditingMonth: boolean;
  yearInputRef: React.RefObject<HTMLInputElement | null>;
  monthInputRef: React.RefObject<HTMLInputElement | null>;
  onYearChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMonthChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onYearKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onMonthKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onYearBlur: () => void;
  onMonthBlur: () => void;
  onStartEditingYear: () => void;
  onStartEditingMonth: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
  onTimelineInteraction: () => void;
}

export const TimelineNavigation: React.FC<TimelineNavigationProps> = ({
  inputYear,
  inputMonth,
  isEditingYear,
  isEditingMonth,
  yearInputRef,
  monthInputRef,
  onYearChange,
  onMonthChange,
  onYearKeyDown,
  onMonthKeyDown,
  onYearBlur,
  onMonthBlur,
  onStartEditingYear,
  onStartEditingMonth,
  onPrevMonth,
  onNextMonth,
  isPrevDisabled,
  isNextDisabled,
  onTimelineInteraction
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);

  // Wheel scroll handler
  useEffect(() => {
    const handleWheelScroll = (event: WheelEvent) => {
      event.preventDefault();
      onTimelineInteraction();
      if (event.deltaY < 0) {
        if(!isPrevDisabled) onPrevMonth();
      } else if (event.deltaY > 0) {
        if(!isNextDisabled) onNextMonth();
      }
    };
    
    const currentTimelineRef = timelineRef.current;
    if (currentTimelineRef) {
      currentTimelineRef.addEventListener('wheel', handleWheelScroll, { passive: false });
    }
    
    return () => {
      if (currentTimelineRef) {
        currentTimelineRef.removeEventListener('wheel', handleWheelScroll);
      }
    };
  }, [onPrevMonth, onNextMonth, onTimelineInteraction, isPrevDisabled, isNextDisabled]);

  return (
    <div ref={timelineRef} className="flex-shrink-0 pb-2 mb-2 border-b border-white/20">
      <TimelineDateInput
        inputYear={inputYear}
        inputMonth={inputMonth}
        isEditingYear={isEditingYear}
        isEditingMonth={isEditingMonth}
        yearInputRef={yearInputRef}
        monthInputRef={monthInputRef}
        onYearChange={onYearChange}
        onMonthChange={onMonthChange}
        onYearKeyDown={onYearKeyDown}
        onMonthKeyDown={onMonthKeyDown}
        onYearBlur={onYearBlur}
        onMonthBlur={onMonthBlur}
        onStartEditingYear={onStartEditingYear}
        onStartEditingMonth={onStartEditingMonth}
      />
      
      <TimelineControls
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        isPrevDisabled={isPrevDisabled}
        isNextDisabled={isNextDisabled}
      />
    </div>
  );
}; 