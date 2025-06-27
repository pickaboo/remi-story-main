
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ease-in-out shadow-sm hover:shadow-md flex items-center justify-center border dark:focus:ring-offset-slate-800'; // Added dark mode focus offset
  
  const variantStyles = {
    primary: 'bg-transparent text-primary border-primary hover:bg-primary/20 focus:ring-primary dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-400/20 dark:focus:ring-blue-400',
    secondary: 'bg-transparent text-secondary border-secondary hover:bg-secondary/20 focus:ring-secondary dark:text-amber-400 dark:border-amber-400 dark:hover:bg-amber-400/20 dark:focus:ring-amber-400',
    danger: 'bg-transparent text-danger border-danger hover:bg-danger/20 focus:ring-danger dark:text-red-400 dark:border-red-400 dark:hover:bg-red-400/20 dark:focus:ring-red-400',
    ghost: 'bg-transparent text-primary border-primary hover:bg-primary/10 focus:ring-primary dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-400/10 dark:focus:ring-blue-400', 
    accent: 'bg-transparent text-accent border-accent hover:bg-accent/20 focus:ring-accent dark:text-emerald-400 dark:border-emerald-400 dark:hover:bg-emerald-400/20 dark:focus:ring-emerald-400', 
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base', 
    lg: 'px-7 py-3.5 text-lg', 
  };

  const disabledStyles = 'opacity-60 cursor-not-allowed hover:shadow-sm !bg-transparent dark:opacity-50'; 

  const spinnerColorMap = {
    primary: 'text-primary dark:text-blue-400',
    secondary: 'text-secondary dark:text-amber-400',
    danger: 'text-danger dark:text-red-400',
    accent: 'text-accent dark:text-emerald-400',
    ghost: 'text-primary dark:text-blue-400',
  };
  const spinnerColorClass = spinnerColorMap[variant];

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${ (disabled || isLoading) ? disabledStyles : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className={`animate-spin -ml-1 mr-3 h-5 w-5 ${spinnerColorClass}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </>
      ) : children}
    </button>
  );
};