import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FeedbackMessage {
  message: string;
  type: 'success' | 'error';
}

interface FeedbackContextType {
  globalFeedback: FeedbackMessage | null;
  showFeedback: (message: string, type: 'success' | 'error', duration?: number) => void;
  clearFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

interface FeedbackProviderProps {
  children: ReactNode;
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
  const [globalFeedback, setGlobalFeedback] = useState<FeedbackMessage | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error', duration: number = 3000) => {
    setGlobalFeedback({ message, type });
    if (duration > 0) {
      setTimeout(() => setGlobalFeedback(null), duration);
    }
  };

  const clearFeedback = () => {
    setGlobalFeedback(null);
  };

  const value: FeedbackContextType = {
    globalFeedback,
    showFeedback,
    clearFeedback,
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
}; 