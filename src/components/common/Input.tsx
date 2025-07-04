
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, error, className, ...props }) => {
  const errorId = error && id ? `${id}-error` : undefined;
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-muted-text dark:text-slate-400 mb-1">{label}</label>}
      <input
        id={id}
        className={`block w-full px-4 py-2 border border-border-color rounded-full shadow-sm bg-input-bg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:border-primary dark:focus:border-blue-400 sm:text-sm ${error ? 'border-red-500 dark:border-red-400 ring-red-500 dark:ring-red-400' : ''} ${className}`}
        aria-invalid={!!error}
        aria-describedby={errorId}
        {...props}
      />
      {error && <p id={errorId} className="mt-1 text-xs text-danger dark:text-red-400">{error}</p>}
    </div>
  );
};
