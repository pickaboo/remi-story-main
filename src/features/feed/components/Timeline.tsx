import React, { useState, useMemo } from 'react';
import { ImageRecord } from '../../../types';
import { getSwedishMonthName, getInitialDate, getAvailableMonthsWithPosts, getDaysToDisplay } from '../utils/timelineUtils';
import { useTimelineState } from '../hooks/useTimelineState';
import { useTimelineSync } from '../hooks/useTimelineSync';
import { useTimelineNavigation } from '../hooks/useTimelineNavigation';
import { TimelineNavigation } from './TimelineNavigation';

interface TimelineProps {
  posts: ImageRecord[];
  onScrollToPost: (postId: string) => void;
  activeFeedDateFromScroll?: Date | null;
  letFeedDriveTimelineSync: boolean;
  onTimelineUserInteraction: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({ 
  posts, 
  onScrollToPost, 
  activeFeedDateFromScroll, 
  letFeedDriveTimelineSync, 
  onTimelineUserInteraction 
}) => {
  // Core state
  const availableMonthsWithPosts = useMemo(() => {
    return getAvailableMonthsWithPosts(posts);
  }, [posts]);

  const [currentDate, setCurrentDate] = useState<Date>(() => 
    getInitialDate(posts, activeFeedDateFromScroll, availableMonthsWithPosts)
  );

  // Timeline state management
  const {
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
  } = useTimelineState({
    currentDate,
    setCurrentDate,
    onTimelineUserInteraction
  });

  // Sync logic
  const { isTimelineInteractingInternally } = useTimelineSync({
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
  });

  // Navigation logic
  const { isPrevDisabled, isNextDisabled, handlePrevMonth, handleNextMonth } = useTimelineNavigation({
    posts,
    availableMonthsWithPosts,
    currentDate,
    setCurrentDate,
    handleTimelineInteractionInternallyAndNotifyApp: () => {
      onTimelineUserInteraction();
    }
  });

  // Computed values
  const daysToDisplay = useMemo(() => {
    return getDaysToDisplay(posts, currentDate);
  }, [posts, currentDate]);

  // Empty state
  if (posts.length === 0 && availableMonthsWithPosts.length === 0 && !activeFeedDateFromScroll) {
    const today = new Date();
    return (
      <div className="h-full flex flex-col items-center justify-center bg-transparent text-slate-300 p-2 rounded-lg">
        <div className="text-center text-2xl font-bold text-slate-100 mb-1 bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-md">
          {today.getFullYear()}
        </div>
        <div className="flex items-center justify-center mt-1">
          <button disabled className="p-1.5 rounded-full text-slate-500 cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="text-center text-lg font-medium text-slate-200 capitalize w-auto px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full shadow-md mx-1">
            {getSwedishMonthName(today).charAt(0).toUpperCase() + getSwedishMonthName(today).slice(1)}
          </div>
          <button disabled className="p-1.5 rounded-full text-slate-500 cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-center mt-4 text-slate-400">Inga inlägg att visa.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-transparent text-slate-100 p-3 rounded-lg" title="Scrolla för att byta månad, klicka år/månad för att redigera">
      {/* Year */}
      <div className="text-center text-2xl font-bold text-slate-100 mb-2 bg-black/40 backdrop-blur-sm px-6 py-2 rounded-xl shadow-md">
        {inputYear}
      </div>
      {/* Month with navigation */}
      <div className="flex items-center justify-center mb-4 gap-2">
        <button
          onClick={handlePrevMonth}
          disabled={isPrevDisabled}
          className={`p-1.5 rounded-full text-slate-200 transition-colors ${isPrevDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-700/40'}`}
          aria-label="Föregående månad"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="px-5 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-lg font-semibold capitalize shadow-md">
          {inputMonth}
        </div>
        <button
          onClick={handleNextMonth}
          disabled={isNextDisabled}
          className={`p-1.5 rounded-full text-slate-200 transition-colors ${isNextDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-700/40'}`}
          aria-label="Nästa månad"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
      {/* Days */}
      <div className="flex flex-col items-center gap-3 w-full">
        {daysToDisplay.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-4">Inga inlägg denna månad.</div>
        ) : (
          daysToDisplay.map((item, idx) => (
            <button
              key={`${item.day}-${item.firstPostId}`}
              className="w-16 py-2 bg-black/40 backdrop-blur-sm rounded-xl text-lg font-semibold text-slate-100 shadow-md hover:bg-blue-600/70 hover:text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => { onScrollToPost(item.firstPostId); }}
              title={`Dag ${item.day}`}
              disabled={isEditingYear || isEditingMonth}
              aria-label={`Scrolla till inlägg från dag ${item.day}`}
            >
              {item.day}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
