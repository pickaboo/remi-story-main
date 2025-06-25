import React from 'react';
import { useFeedback } from '../../context/FeedbackContext';

export const FeedbackDisplay: React.FC = () => {
  const { globalFeedback } = useFeedback();

  if (!globalFeedback) return null;

  return (
    <div 
      className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-xl text-white z-[200]
                  ${globalFeedback.type === 'success' ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'}`}
    >
      {globalFeedback.message}
    </div>
  );
}; 