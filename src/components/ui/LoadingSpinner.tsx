import React, { memo, useMemo } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({ size = 'md', message }) => {
  const sizeClasses = useMemo(() => ({
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-20 w-20',
  }), []);

  return (
    <div className="flex flex-col items-center justify-center space-y-2 p-4">
      <svg 
        className={`animate-spin text-primary dark:text-blue-400 ${sizeClasses[size]}`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {message && <p className="text-muted-text dark:text-slate-400 text-sm">{message}</p>}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';