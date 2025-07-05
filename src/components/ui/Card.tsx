import React, { memo } from 'react';

/**
 * Base props for all card components
 */
export interface BaseCardProps {
  /** Additional CSS classes */
  className?: string;
  /** Card content */
  children: React.ReactNode;
}

/**
 * Props for the main Card component
 */
export interface CardProps extends BaseCardProps {
  /** Whether card has hover effects */
  hoverable?: boolean;
  /** Whether card is clickable */
  clickable?: boolean;
  /** Click handler for clickable cards */
  onClick?: () => void;
  /** Whether card is loading */
  loading?: boolean;
}

/**
 * Props for Card.Header component
 */
export interface CardHeaderProps extends BaseCardProps {
  /** Header title */
  title?: React.ReactNode;
  /** Header subtitle */
  subtitle?: React.ReactNode;
  /** Header actions */
  actions?: React.ReactNode;
}

/**
 * Props for Card.Body component
 */
export interface CardBodyProps extends BaseCardProps {
  /** Whether body has padding */
  padded?: boolean;
}

/**
 * Props for Card.Footer component
 */
export interface CardFooterProps extends BaseCardProps {
  /** Footer actions */
  actions?: React.ReactNode;
}

/**
 * Props for Card.Image component
 */
export interface CardImageProps {
  /** Image source */
  src: string;
  /** Image alt text */
  alt: string;
  /** Image aspect ratio */
  aspectRatio?: 'square' | 'video' | 'auto';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Card component with compound components for flexible composition
 * 
 * @example
 * ```tsx
 * // Basic card
 * <Card>
 *   <Card.Header title="Card Title" subtitle="Card subtitle" />
 *   <Card.Body>
 *     Card content goes here
 *   </Card.Body>
 * </Card>
 * 
 * // Card with image
 * <Card hoverable>
 *   <Card.Image src="/image.jpg" alt="Card image" />
 *   <Card.Header title="Card with Image" />
 *   <Card.Body>
 *     Content with image
 *   </Card.Body>
 * </Card>
 * 
 * // Clickable card
 * <Card clickable onClick={handleClick}>
 *   <Card.Header title="Clickable Card" />
 *   <Card.Body>
 *     Click me!
 *   </Card.Body>
 * </Card>
 * ```
 */
const CardComponent: React.FC<CardProps> = memo(({
  children,
  hoverable = false,
  clickable = false,
  onClick,
  loading = false,
  className = '',
  ...props
}) => {
  const baseClasses = [
    'bg-white dark:bg-dark-bg rounded-lg shadow-sm border border-border-color dark:border-dark-bg/50',
    'overflow-hidden',
    hoverable && 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200',
    clickable && 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200',
    loading && 'animate-pulse',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={baseClasses}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable && onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
});

CardComponent.displayName = 'Card';

// Compound components with memo optimization
const CardHeader: React.FC<CardHeaderProps> = memo(({ 
  children, 
  title, 
  subtitle, 
  actions, 
  className = '' 
}) => (
  <div className={`p-4 sm:p-6 border-b border-border-color dark:border-slate-700 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        {title && (
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="ml-4 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
    {children}
  </div>
));

const CardBody: React.FC<CardBodyProps> = memo(({ 
  children, 
  padded = true, 
  className = '' 
}) => (
  <div className={`${padded ? 'p-4 sm:p-6' : ''} ${className}`}>
    {children}
  </div>
));

const CardFooter: React.FC<CardFooterProps> = memo(({ 
  children, 
  actions, 
  className = '' 
}) => (
  <div className={`p-4 sm:p-6 border-t border-border-color dark:border-slate-700 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        {children}
      </div>
      {actions && (
        <div className="ml-4 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  </div>
));

const CardImage: React.FC<CardImageProps> = memo(({ 
  src, 
  alt, 
  aspectRatio = 'auto', 
  className = '' 
}) => {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  };

  return (
    <div className={`overflow-hidden ${aspectClasses[aspectRatio]} ${className}`}>
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
});

// Set display names for debugging
CardHeader.displayName = 'Card.Header';
CardBody.displayName = 'Card.Body';
CardFooter.displayName = 'Card.Footer';
CardImage.displayName = 'Card.Image';

// Export the main Card component with compound components
export const Card = Object.assign(CardComponent, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
  Image: CardImage,
}); 