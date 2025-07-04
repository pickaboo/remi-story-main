import React from 'react';

interface LazyLoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LazyLoadingSpinner: React.FC<LazyLoadingSpinnerProps> = ({ 
  message = "Laddar...", 
  size = 'md',
  className = ""
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-primary dark:border-blue-400 ${sizeClasses[size]}`}></div>
      <p className={`mt-3 text-muted-text dark:text-slate-400 ${textSizes[size]}`}>
        {message}
      </p>
    </div>
  );
};

// Pre-configured loading components for different contexts
export const PageLoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-slate-900">
    <LazyLoadingSpinner message={message || "Laddar sida..."} size="lg" />
  </div>
);

export const ComponentLoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <LazyLoadingSpinner message={message || "Laddar komponent..."} size="md" />
);

export const ModalLoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <LazyLoadingSpinner message={message || "Laddar modal..."} size="sm" />
); 