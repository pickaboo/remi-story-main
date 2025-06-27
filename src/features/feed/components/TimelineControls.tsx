import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../../../../components/common/icons/ChevronIcons';

interface TimelineControlsProps {
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  isPrevDisabled,
  isNextDisabled,
  onPrevMonth,
  onNextMonth
}) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrevMonth}
        disabled={isPrevDisabled}
        className={`p-2 rounded-lg transition-colors ${
          isPrevDisabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
        }`}
        aria-label="Previous month"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>
      
      <button
        onClick={onNextMonth}
        disabled={isNextDisabled}
        className={`p-2 rounded-lg transition-colors ${
          isNextDisabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
        }`}
        aria-label="Next month"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </div>
  );
}; 