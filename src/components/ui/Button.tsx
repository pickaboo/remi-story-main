import React, { memo } from 'react';

/**
 * Button variant options for different visual styles
 */
export type ButtonVariant = 
  | 'primary'    // Main action button (blue)
  | 'secondary'  // Secondary action button (gray)
  | 'accent'     // Accent action button (purple)
  | 'danger'     // Destructive action button (red)
  | 'ghost'      // Transparent background button
  | 'outline';   // Outlined button

/**
 * Button size options for different use cases
 */
export type ButtonSize = 
  | 'sm'   // Small button (32px height)
  | 'md'   // Medium button (40px height)
  | 'lg';  // Large button (48px height)

/**
 * Base props for all button components
 */
export interface BaseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant of the button */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Whether button should take full width of container */
  fullWidth?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for the main Button component
 */
export interface ButtonProps extends BaseButtonProps {
  /** Whether to show loading spinner */
  isLoading?: boolean;
  /** Loading text to display when isLoading is true */
  loadingText?: string;
  /** Icon to display before the button text */
  leftIcon?: React.ReactNode;
  /** Icon to display after the button text */
  rightIcon?: React.ReactNode;
  /** Button content */
  children: React.ReactNode;
}

/**
 * Props for Button.Icon component
 */
export interface ButtonIconProps {
  /** Icon to display */
  children: React.ReactNode;
  /** Position of the icon */
  position?: 'left' | 'right';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for Button.Text component
 */
export interface ButtonTextProps {
  /** Text content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for Button.Loading component
 */
export interface ButtonLoadingProps {
  /** Loading text to display */
  text?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Button component with compound components for flexible composition
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Button variant="primary" onClick={handleClick}>
 *   Save Changes
 * </Button>
 * 
 * // With compound components
 * <Button variant="primary" onClick={handleClick}>
 *   <Button.Icon position="left">
 *     <SaveIcon />
 *   </Button.Icon>
 *   <Button.Text>Save Changes</Button.Text>
 *   <Button.Icon position="right">
 *     <ArrowIcon />
 *   </Button.Icon>
 * </Button>
 * 
 * // Loading state
 * <Button variant="primary" isLoading>
 *   <Button.Loading text="Saving..." />
 * </Button>
 * ```
 */
const ButtonComponent: React.FC<ButtonProps> = memo(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  // Base button classes
  const baseClasses = [
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    fullWidth ? 'w-full' : '',
  ].join(' ');

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Variant classes with hover and focus states
  const variantClasses = {
    primary: [
      'bg-primary text-white shadow-sm',
      'hover:bg-primary/90 hover:shadow-md',
      'focus:ring-primary/50',
      'active:bg-primary/80',
    ].join(' '),
    secondary: [
      'bg-slate-100 text-slate-700 dark:bg-dark-bg dark:text-slate-200',
      'hover:bg-slate-200 dark:hover:bg-dark-bg/50',
      'focus:ring-slate-500/50',
      'active:bg-slate-300 dark:active:bg-dark-bg/70',
    ].join(' '),
    accent: [
      'bg-purple-600 text-white shadow-sm',
      'hover:bg-purple-700 hover:shadow-md',
      'focus:ring-purple-500/50',
      'active:bg-purple-800',
    ].join(' '),
    danger: [
      'bg-red-600 text-white shadow-sm',
      'hover:bg-red-700 hover:shadow-md',
      'focus:ring-red-500/50',
      'active:bg-red-800',
    ].join(' '),
    ghost: [
      'bg-transparent text-slate-700 dark:text-slate-200',
      'hover:bg-slate-100 dark:hover:bg-dark-bg/50',
      'focus:ring-slate-500/50',
      'active:bg-slate-200 dark:active:bg-dark-bg/70',
    ].join(' '),
    outline: [
      'bg-transparent border border-slate-300 dark:border-dark-bg/50 text-slate-700 dark:text-slate-200',
      'hover:bg-slate-50 dark:hover:bg-dark-bg/50',
      'focus:ring-slate-500/50',
      'active:bg-slate-100 dark:active:bg-dark-bg/70',
    ].join(' '),
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <svg 
      className="animate-spin -ml-1 mr-2 h-4 w-4" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `.trim()}
      disabled={disabled || isLoading}
      type={props.type || 'button'}
      {...props}
    >
      {isLoading && <LoadingSpinner />}
      {!isLoading && leftIcon && (
        <span className="mr-2 flex-shrink-0">{leftIcon}</span>
      )}
      <span className="flex-shrink-0">
        {isLoading && loadingText ? loadingText : children}
      </span>
      {!isLoading && rightIcon && (
        <span className="ml-2 flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
});

ButtonComponent.displayName = 'Button';

// Compound components
const ButtonIcon: React.FC<ButtonIconProps> = ({ children, position = 'left', className = '' }) => (
  <span className={`flex-shrink-0 ${position === 'left' ? 'mr-2' : 'ml-2'} ${className}`}>
    {children}
  </span>
);

const ButtonText: React.FC<ButtonTextProps> = ({ children, className = '' }) => (
  <span className={`flex-shrink-0 ${className}`}>
    {children}
  </span>
);

const ButtonLoading: React.FC<ButtonLoadingProps> = ({ text, className = '' }) => (
  <span className={`flex-shrink-0 ${className}`}>
    {text}
  </span>
);

// Export the main Button component with compound components
export const Button = Object.assign(ButtonComponent, {
  Icon: ButtonIcon,
  Text: ButtonText,
  Loading: ButtonLoading,
});