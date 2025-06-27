import { ImageRecord } from '../../../../types';

export interface DayDisplayItem {
  day: number;
  firstPostId: string;
  postCount: number;
  postNameSample?: string;
}

export const getSwedishMonthName = (date: Date): string => {
  return date.toLocaleDateString('sv-SE', { month: 'long' });
};

export const allSwedishMonthNames = Array.from({ length: 12 }, (_, i) => getSwedishMonthName(new Date(2000, i, 1)));

export const getMonthNumberFromName = (monthName: string): number => {
  const monthIndex = allSwedishMonthNames.findIndex(name => name.toLowerCase() === monthName.toLowerCase());
  return monthIndex; // Will be -1 if not found
};

export const isSameYearMonth = (date1?: Date | null, date2?: Date | null): boolean => {
  if (!date1 || !date2) return date1 === date2;
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
};

export const findClosestAvailableMonth = (targetDate: Date, availableMonths: Date[]): Date | null => {
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
  return closestMatch ? new Date(closestMatch) : (availableMonths.length > 0 ? new Date(availableMonths[0]) : null);
};

export const getInitialDate = (posts: ImageRecord[], activeFeedDate?: Date | null, availableMonths?: Date[]): Date => {
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

export const getAvailableMonthsWithPosts = (posts: ImageRecord[]): Date[] => {
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
};

export const getDaysToDisplay = (posts: ImageRecord[], currentDate: Date): DayDisplayItem[] => {
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
}; 