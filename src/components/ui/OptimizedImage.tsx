import React, { memo, useMemo } from 'react';
import { useLazyImage } from '../../hooks/useLazyImage';

interface OptimizedImageProps {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Placeholder image URL */
  placeholder?: string;
  /** CSS classes */
  className?: string;
  /** Whether to enable lazy loading */
  lazy?: boolean;
  /** Threshold for intersection observer */
  threshold?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Click handler */
  onClick?: () => void;
  /** Additional props */
  [key: string]: any;
}

/**
 * Optimized image component with lazy loading and performance optimizations
 * 
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/path/to/image.jpg"
 *   alt="Description"
 *   placeholder="/path/to/placeholder.jpg"
 *   className="w-full h-64 object-cover"
 *   lazy={true}
 * />
 * ```
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  src,
  alt,
  placeholder,
  className = '',
  lazy = true,
  threshold = 0.1,
  rootMargin = '50px',
  onClick,
  ...props
}) => {
  const {
    isLoading,
    isLoaded,
    hasError,
    imageSrc,
    imageRef
  } = useLazyImage({
    src,
    placeholder,
    threshold,
    rootMargin,
    lazy
  });

  const imageClasses = useMemo(() => {
    const baseClasses = 'transition-all duration-300';
    const loadingClasses = isLoading ? 'opacity-50 scale-95' : '';
    const loadedClasses = isLoaded ? 'opacity-100 scale-100' : '';
    const errorClasses = hasError ? 'opacity-30' : '';
    
    return `${baseClasses} ${loadingClasses} ${loadedClasses} ${errorClasses} ${className}`.trim();
  }, [isLoading, isLoaded, hasError, className]);

  const handleClick = useMemo(() => {
    if (!onClick) return undefined;
    return (e: React.MouseEvent) => {
      e.preventDefault();
      onClick();
    };
  }, [onClick]);

  return (
    <img
      ref={imageRef}
      src={imageSrc}
      alt={alt}
      className={imageClasses}
      onClick={handleClick}
      loading={lazy ? 'lazy' : 'eager'}
      {...props}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage'; 