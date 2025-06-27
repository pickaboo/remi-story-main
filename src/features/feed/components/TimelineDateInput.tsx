import React from 'react';

interface TimelineDateInputProps {
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
}

export const TimelineDateInput: React.FC<TimelineDateInputProps> = ({
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
  onStartEditingMonth
}) => {
  return (
    <div className="flex items-center gap-2 text-sm">
      {isEditingYear ? (
        <input
          ref={yearInputRef}
          type="text"
          value={inputYear}
          onChange={onYearChange}
          onKeyDown={onYearKeyDown}
          onBlur={onYearBlur}
          className="w-16 px-2 py-1 text-center border rounded bg-white text-gray-900"
          placeholder="År"
        />
      ) : (
        <button
          onClick={onStartEditingYear}
          className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          {inputYear}
        </button>
      )}
      
      <span className="text-gray-400">-</span>
      
      {isEditingMonth ? (
        <input
          ref={monthInputRef}
          type="text"
          value={inputMonth}
          onChange={onMonthChange}
          onKeyDown={onMonthKeyDown}
          onBlur={onMonthBlur}
          className="w-24 px-2 py-1 text-center border rounded bg-white text-gray-900"
          placeholder="Månad"
        />
      ) : (
        <button
          onClick={onStartEditingMonth}
          className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          {inputMonth}
        </button>
      )}
    </div>
  );
}; 