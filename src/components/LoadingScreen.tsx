import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Laddar..." 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-blue-400 mx-auto"></div>
        <p className="mt-4 text-muted-text dark:text-slate-400">{message}</p>
      </div>
    </div>
  );
}; 