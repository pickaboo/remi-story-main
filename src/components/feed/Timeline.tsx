import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { ImageRecord } from '../../types';

const getSwedishMonthName = (date: Date): string => {
  return date.toLocaleDateString('sv-SE', { month: 'long' });
};

const allSwedishMonthNames = Array.from({ length: 12 }, (_, i) => getSwedishMonthName(new Date(2000, i, 1)));

const getMonthNumberFromName = (monthName: string): number => {
  const monthIndex = allSwedishMonthNames.findIndex(name => name.toLowerCase() === monthName.toLowerCase());
  return monthIndex; // Will be -1 if not found
};


interface DayDisplayItem {
  day: number;
  firstPostId: string;
  postCount: number;
  postNameSample?: string;
}

interface TimelineProps {
  posts: ImageRecord[];
  onScrollToPost: (postId: string) => void;
  activeFeedDateFromScroll?: Date | null;
  letFeedDriveTimelineSync: boolean;
  onTimelineUserInteraction: () => void;
}

const isSameYearMonth = (date1?: Date | null, date2?: Date | null): boolean => {
  if (!date1 || !date2) return date1 === date2;
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
};

const findClosestAvailableMonth = (targetDate: Date, availableMonths: Date[]): Date | null => {
    if (availableMonths.length === 0) return null;

    const targetTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).getTime();

    const exactMatch = availableMonths.find(d => d.getTime() === targetTime);
    if (exactMatch) return new Date(exactMatch);

    let closestMatch: Date | null = null;
    let minDiff = Infinity;

    for (const availableMonth of availableMonths) {
      const diff = Math.abs(availableMonth.getTime() - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestMatch = availableMonth;
      } else if (diff === minDiff) {
        if (closestMatch && availableMonth.getTime() < closestMatch.getTime() && targetTime > availableMonth.getTime()) {
           closestMatch = availableMonth;
        }
      }
    }
    return closestMatch ? new Date(closestMatch) : (availableMonths.length > 0 ? new Date(availableMonths[0]) : null) ;
};

const getInitialDate = (posts: ImageRecord[], activeFeedDate?: Date | null, availableMonths?: Date[]): Date => {
  let candidateDate: Date;
  if (activeFeedDate) {
    candidateDate = new Date(activeFeedDate.getFullYear(), activeFeedDate.getMonth(), 1);
  } else if (posts.length > 0 && posts[0].dateTaken) {
    const latestPostDate = new Date(posts[0].dateTaken);
    candidateDate = new Date(latestPostDate.getFullYear(), latestPostDate.getMonth(), 1);
  } else {
    const today = new Date();
    candidateDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  if (availableMonths && availableMonths.length > 0) {
    return findClosestAvailableMonth(candidateDate, availableMonths) || candidateDate;
  }
  return candidateDate;
};


export const Timeline: React.FC<TimelineProps> = memo(({ posts, onScrollToPost, activeFeedDateFromScroll, letFeedDriveTimelineSync, onTimelineUserInteraction }) => {

  const availableMonthsWithPosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    const monthSet = new Set<string>();
    posts.forEach(post => {
      if (post.dateTaken) {
        const d = new Date(post.dateTaken);
        monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });
    return Array.from(monthSet)
      .map(ym => {
        const [year, month] = ym.split('-').map(Number);
        return new Date(year, month - 1, 1);
      })
      .sort((a, b) => a.getTime() - b.getTime());
  }, [posts]);

  const [currentDate, setCurrentDate] = useState<Date>(() => getInitialDate(posts, activeFeedDateFromScroll, availableMonthsWithPosts));

  const [inputYear, setInputYear] = useState<string>(() => currentDate.getFullYear().toString());
  const [inputMonth, setInputMonth] = useState<string>(() => getSwedishMonthName(currentDate));

  const [isEditingYear, setIsEditingYear] = useState(false);
  const [isEditingMonth, setIsEditingMonth] = useState(false);

  const [isTimelineInteractingInternally, setIsTimelineInteractingInternally] = useState(false);
  const internalInteractionTimeoutRef = useRef<number | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const monthSelectRef = useRef<HTMLSelectElement>(null);

  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(true);

  const handleTimelineInteractionInternallyAndNotifyApp = useCallback(() => {
    setIsTimelineInteractingInternally(true);
    onTimelineUserInteraction(); 
    if (internalInteractionTimeoutRef.current) {
      clearTimeout(internalInteractionTimeoutRef.current);
    }
    internalInteractionTimeoutRef.current = window.setTimeout(() => {
      setIsTimelineInteractingInternally(false);
    }, 1500);
  }, [onTimelineUserInteraction]);


  // Primary sync logic: Update timeline based on feed scroll if allowed by App.tsx
  useEffect(() => {
    if (!letFeedDriveTimelineSync) {
      return;
    }

    if (activeFeedDateFromScroll) {
      let targetDateForTimeline: Date | null = null;
      if (availableMonthsWithPosts.length > 0) {
        const feedMonthCandidate = new Date(activeFeedDateFromScroll.getFullYear(), activeFeedDateFromScroll.getMonth(), 1);
        targetDateForTimeline = findClosestAvailableMonth(feedMonthCandidate, availableMonthsWithPosts);
      } else {
        targetDateForTimeline = new Date(activeFeedDateFromScroll.getFullYear(), activeFeedDateFromScroll.getMonth(), 1);
      }

      if (targetDateForTimeline && !isSameYearMonth(currentDate, targetDateForTimeline)) {
        setCurrentDate(targetDateForTimeline);
      }
    }
    // If activeFeedDateFromScroll is null, primary effect does nothing, timeline holds.
  }, [activeFeedDateFromScroll, letFeedDriveTimelineSync, availableMonthsWithPosts, currentDate]);


  // Update input fields when currentDate changes (and not editing or recently interacted)
  useEffect(() => {
    if (!isEditingYear && !isTimelineInteractingInternally) {
        setInputYear(currentDate.getFullYear().toString());
    }
    if (!isEditingMonth && !isTimelineInteractingInternally) {
        setInputMonth(getSwedishMonthName(currentDate));
    }
  }, [currentDate, isEditingYear, isEditingMonth, isTimelineInteractingInternally]);

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

  // Secondary useEffect - for initialization and reacting when user drives timeline.
  useEffect(() => {
    if (isEditingMonth || isEditingYear || isTimelineInteractingInternally) {
      return; 
    }

    if (letFeedDriveTimelineSync) {
      // If the feed is driving, this effect should not interfere with date changes.
      // The primary effect handles feed-driven date changes.
      // If activeFeedDateFromScroll is null, feed is driving but no specific date,
      // timeline should hold. We only ensure inputs are synced.
      if (activeFeedDateFromScroll === null) {
        if (!isEditingYear) setInputYear(currentDate.getFullYear().toString());
        if (!isEditingMonth) setInputMonth(getSwedishMonthName(currentDate));
      }
      return; 
    }

    // If we reach here, letFeedDriveTimelineSync is FALSE (user is driving the timeline).
    // We should ensure currentDate is valid or pick a new one based on available months.
    // Use `currentDate` as the target for `getInitialDate` because the user is in control.
    const newDateCandidate = getInitialDate(posts, currentDate, availableMonthsWithPosts); 
    
    if (!isSameYearMonth(currentDate, newDateCandidate)) {
        setCurrentDate(newDateCandidate);
    } else {
        // Ensure inputs are synced if currentDate didn't change but was re-evaluated.
        if (!isEditingYear) setInputYear(currentDate.getFullYear().toString());
        if (!isEditingMonth) setInputMonth(getSwedishMonthName(currentDate));
    }
  }, [
    posts, availableMonthsWithPosts, 
    activeFeedDateFromScroll, letFeedDriveTimelineSync, 
    isEditingMonth, isEditingYear, isTimelineInteractingInternally, 
    currentDate, // Needed to check if update is necessary and for getInitialDate when user is driving
  ]);


  const displayedYear = currentDate.getFullYear();
  const displayedMonthName = getSwedishMonthName(currentDate).charAt(0).toUpperCase() + getSwedishMonthName(currentDate).slice(1);

  const daysToDisplay = useMemo((): DayDisplayItem[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const postsForMonth = posts.filter(post => {
      if (!post.dateTaken) return false;
      const postDate = new Date(post.dateTaken);
      return postDate.getFullYear() === year && postDate.getMonth() === month;
    });
    const daysMap: { [day: number]: { postsOnDay: ImageRecord[], firstPostId: string, postNameSample?: string } } = {};
    postsForMonth.forEach(post => {
      const dayOfMonth = new Date(post.dateTaken!).getDate();
      if (!daysMap[dayOfMonth]) {
        const earliestPostOnDay = postsForMonth
            .filter(p => new Date(p.dateTaken!).getDate() === dayOfMonth)
            .sort((a,b) => new Date(a.dateTaken!).getTime() - new Date(b.dateTaken!).getTime())[0];
        daysMap[dayOfMonth] = {
            postsOnDay: [],
            firstPostId: earliestPostOnDay.id,
            postNameSample: earliestPostOnDay.name
        };
      }
      daysMap[dayOfMonth].postsOnDay.push(post);
    });
    return Object.keys(daysMap)
      .map(Number)
      .sort((a, b) => b - a) 
      .map(day => ({
        day: day,
        firstPostId: daysMap[day].firstPostId,
        postCount: daysMap[day].postsOnDay.length,
        postNameSample: daysMap[day].postNameSample,
      }));
  }, [posts, currentDate]);

  const handlePrevMonth = useCallback(() => {
    handleTimelineInteractionInternallyAndNotifyApp();
    if (availableMonthsWithPosts.length === 0 || isPrevDisabled) return;
    const currentMonthTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime();
    let prevAvailableMonth: Date | null = null;
    for (let i = availableMonthsWithPosts.length - 1; i >= 0; i--) {
        if (availableMonthsWithPosts[i].getTime() < currentMonthTime) {
            prevAvailableMonth = availableMonthsWithPosts[i];
            break;
        }
    }
    if (prevAvailableMonth) setCurrentDate(new Date(prevAvailableMonth));
  }, [availableMonthsWithPosts, currentDate, handleTimelineInteractionInternallyAndNotifyApp, isPrevDisabled]);

  const handleNextMonth = useCallback(() => {
    handleTimelineInteractionInternallyAndNotifyApp();
    if (availableMonthsWithPosts.length === 0 || isNextDisabled) return;
    const currentMonthTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime();
    let nextAvailableMonth: Date | null = null;
    for (let i = 0; i < availableMonthsWithPosts.length; i++) {
        if (availableMonthsWithPosts[i].getTime() > currentMonthTime) {
            nextAvailableMonth = availableMonthsWithPosts[i];
            break;
        }
    }
     if (nextAvailableMonth) setCurrentDate(new Date(nextAvailableMonth));
  }, [availableMonthsWithPosts, currentDate, handleTimelineInteractionInternallyAndNotifyApp, isNextDisabled]);

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
        handleTimelineInteractionInternallyAndNotifyApp();
      } else { 
        setInputYear(finalDateToSet.getFullYear().toString());
        setInputMonth(getSwedishMonthName(finalDateToSet));
      }
    }
  };

  useEffect(() => {
    const handleWheelScroll = (event: WheelEvent) => {
      event.preventDefault();
      handleTimelineInteractionInternallyAndNotifyApp();
      if (event.deltaY < 0) {
        if(!isPrevDisabled) handlePrevMonth();
      } else if (event.deltaY > 0) {
        if(!isNextDisabled) handleNextMonth();
      }
    };
    const currentTimelineRef = timelineRef.current;
    if (currentTimelineRef) {
      currentTimelineRef.addEventListener('wheel', handleWheelScroll, { passive: false });
    }
    return () => {
      if (currentTimelineRef) currentTimelineRef.removeEventListener('wheel', handleWheelScroll);
      if(internalInteractionTimeoutRef.current) clearTimeout(internalInteractionTimeoutRef.current);
    };
  }, [handlePrevMonth, handleNextMonth, handleTimelineInteractionInternallyAndNotifyApp, isPrevDisabled, isNextDisabled]);

  if (posts.length === 0 && availableMonthsWithPosts.length === 0 && !activeFeedDateFromScroll) {
    const today = new Date();
    return (
      <div className="h-full flex flex-col items-center justify-center bg-transparent text-slate-300 p-2 rounded-lg">
        <div className="text-center text-2xl font-bold text-slate-100 mb-1 bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-md">
            {today.getFullYear()}
        </div>
        <div className="flex items-center justify-center mt-1">
            <button disabled className="p-1.5 rounded-full text-slate-500 cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <div className="text-center text-lg font-medium text-slate-200 capitalize w-auto px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full shadow-md mx-1">
                {getSwedishMonthName(today).charAt(0).toUpperCase() + getSwedishMonthName(today).slice(1)}
            </div>
            <button disabled className="p-1.5 rounded-full text-slate-500 cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
            </button>
        </div>
        <p className="text-xs text-center mt-4 text-slate-400">Inga inlägg att visa.</p>
      </div>
    );
  }

  const NavButton: React.FC<{onClick: () => void, children: React.ReactNode, ariaLabel: string, disabled?: boolean}> =
    ({onClick, children, ariaLabel, disabled}) => (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-full transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-white/50
                  ${disabled ? 'text-slate-600 cursor-not-allowed' : 'text-slate-200 hover:bg-black/50 hover:text-white'}`}
      aria-label={ariaLabel}
      disabled={isEditingYear || isEditingMonth || disabled}
    >
      {children}
    </button>
  );

  return (
    <div
      ref={timelineRef}
      className="h-full flex flex-col bg-transparent text-slate-100 p-3 rounded-lg cursor-ns-resize"
      title="Scrolla för att byta månad, klicka år/månad för att redigera"
    >
      <div className="flex-shrink-0 pb-2 mb-2 border-b border-white/20">
        {isEditingYear ? (
            <input
                ref={yearInputRef}
                type="number"
                value={inputYear}
                onChange={(e) => setInputYear(e.target.value)}
                onBlur={() => { applyDateChangeFromInput(); setIsEditingYear(false); }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); applyDateChangeFromInput(); setIsEditingYear(false); } 
                    else if (e.key === 'Escape') { setIsEditingYear(false); setInputYear(currentDate.getFullYear().toString()); }
                }}
                className="w-full mb-1 p-1 text-center bg-black/50 text-slate-100 rounded-md border border-white/30 focus:ring-1 focus:ring-primary focus:border-primary text-2xl font-bold appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="Redigera år"
            />
        ) : (
            <div
                className="text-center text-2xl font-bold text-slate-100 mb-1 cursor-pointer bg-black/40 backdrop-blur-sm hover:bg-black/50 px-4 py-1.5 rounded-lg shadow-md"
                onClick={() => { if (!isEditingMonth) { setIsEditingYear(true); handleTimelineInteractionInternallyAndNotifyApp(); } }}
                title="Klicka för att redigera år" role="button" tabIndex={0}
                onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') if (!isEditingMonth) { setIsEditingYear(true); handleTimelineInteractionInternallyAndNotifyApp(); } }}
            >
                {displayedYear}
            </div>
        )}

        <div className="flex items-center justify-center mt-1">
          <NavButton onClick={handlePrevMonth} ariaLabel="Föregående månad" disabled={isPrevDisabled}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </NavButton>

          {isEditingMonth ? (
             <select
                ref={monthSelectRef} value={inputMonth}
                onChange={(e) => {
                    const newMonthName = e.target.value; setInputMonth(newMonthName);
                    const yearNum = parseInt(inputYear, 10); const monthNum = getMonthNumberFromName(newMonthName);
                    if (!isNaN(yearNum) && monthNum !== -1) {
                         const newRawDate = new Date(yearNum, monthNum, 1);
                         let finalDateToSet = newRawDate;
                         if (availableMonthsWithPosts.length > 0) {
                             const closest = findClosestAvailableMonth(newRawDate, availableMonthsWithPosts);
                             if (closest) finalDateToSet = closest;
                         }
                         if (!isSameYearMonth(finalDateToSet, currentDate)) {
                            setCurrentDate(finalDateToSet); handleTimelineInteractionInternallyAndNotifyApp();
                         }
                    }
                    setIsEditingMonth(false);
                }}
                onBlur={() => { setIsEditingMonth(false); setInputMonth(getSwedishMonthName(currentDate)); }}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') { setIsEditingMonth(false); setInputMonth(getSwedishMonthName(currentDate)); } 
                    else if (e.key === 'Enter') { e.preventDefault(); monthSelectRef.current?.blur(); }
                }}
                className="flex-shrink p-1 mx-1 bg-black/50 text-slate-100 rounded-md border border-white/30 focus:ring-1 focus:ring-primary focus:border-primary text-lg font-medium capitalize text-center w-auto"
                aria-label="Välj månad"
            >
                {allSwedishMonthNames.map((name, index) => (
                    <option key={index} value={name}>{name.charAt(0).toUpperCase() + name.slice(1)}</option>
                ))}
            </select>
          ) : (
            <div
                className="text-center text-lg font-medium text-slate-200 capitalize w-auto px-3 py-1 cursor-pointer bg-black/40 backdrop-blur-sm hover:bg-black/50 rounded-full shadow-md mx-1"
                onClick={() => { if(!isEditingYear) { setIsEditingMonth(true); handleTimelineInteractionInternallyAndNotifyApp(); } }}
                title="Klicka för att redigera månad" role="button" tabIndex={0}
                onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') if (!isEditingYear) { setIsEditingMonth(true); handleTimelineInteractionInternallyAndNotifyApp(); } }}
            >
                {displayedMonthName}
            </div>
          )}

          <NavButton onClick={handleNextMonth} ariaLabel="Nästa månad" disabled={isNextDisabled}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </NavButton>
        </div>
      </div>

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
});

Timeline.displayName = 'Timeline';
