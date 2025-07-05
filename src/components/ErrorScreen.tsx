import React from 'react';

interface ErrorScreenProps {
  message: string;
  title?: string;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ 
  message, 
  title = "Ett fel uppstod" 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-slate-900">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">{title}</h1>
        <p className="text-danger dark:text-red-400">{message}</p>
      </div>
    </div>
  );
}; 