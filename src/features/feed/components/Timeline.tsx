import React from 'react';
import { ImageRecord } from '../../../../types';
import { getSwedishMonthName } from '../utils/timelineUtils';
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
  // State management
  const {
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
  } = useTimelineState({ posts, activeFeedDateFromScroll });

  // Sync logic
  const { isTimelineInteractingInternally } = useTimelineSync({
    posts,
    activeFeedDateFromScroll,
    letFeedDriveTimelineSync,
    availableMonthsWithPosts,
    currentDate,
    setCurrentDate,
    setInputYear,
    setInputMonth,
    isEditingYear,
    isEditingMonth,
    onTimelineUserInteraction
  });

  // Navigation logic
  const { timelineRef, handlePrevMonth, handleNextMonth } = useTimelineNavigation({
    currentDate,
    availableMonthsWithPosts,
    isPrevDisabled,
    isNextDisabled,
    isEditingYear,
    isEditingMonth,
    onTimelineUserInteraction,
    setCurrentDate
  });

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
    <div
      ref={timelineRef}
      className="h-full flex flex-col bg-transparent text-slate-100 p-3 rounded-lg cursor-ns-resize"
      title="Scrolla för att byta månad, klicka år/månad för att redigera"
    >
      <TimelineNavigation
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
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        isPrevDisabled={isPrevDisabled}
        isNextDisabled={isNextDisabled}
        onTimelineUserInteraction={onTimelineUserInteraction}
      />

      <div className="flex-grow overflow-y-auto no-scrollbar pt-1">
        {daysToDisplay.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-4">Inga inlägg denna månad.</div>
        ) : (
          <ul className="space-y-1.5">
            {daysToDisplay.map((item) => (
              <li key={`${item.day}-${item.firstPostId}`}>
                <button
                  className="w-full text-left rounded-md p-0 hover:scale-105 hover:shadow-lg text-slate-100 transition-all duration-150 ease-in-out transform flex items-center justify-center"
                  onClick={() => { onScrollToPost(item.firstPostId); }}
                  title={item.postNameSample ? `${item.postCount} inlägg, första: ${item.postNameSample}` : `Dag ${item.day}`}
                  disabled={isEditingYear || isEditingMonth}
                  aria-label={`Scrolla till inlägg från dag ${item.day}`}
                >
                  <span className="bg-black/40 backdrop-blur-sm text-slate-100 text-sm font-medium px-3 py-1.5 rounded-lg shadow-sm">
                    {item.day}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
