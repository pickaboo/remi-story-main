import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyImageOptions {
  /** The image source URL */
  src: string;
  /** Placeholder image URL to show while loading */
  placeholder?: string;
  /** Threshold for when to start loading (0-1) */
  threshold?: number;
  /** Root margin for the intersection observer */
  rootMargin?: string;
  /** Whether to enable lazy loading */
  lazy?: boolean;
}

interface UseLazyImageReturn {
  /** Current loading state */
  isLoading: boolean;
  /** Whether the image has loaded successfully */
  isLoaded: boolean;
  /** Whether there was an error loading the image */
  hasError: boolean;
  /** The current image source (placeholder or actual) */
  imageSrc: string;
  /** Ref to attach to the image element */
  imageRef: React.RefObject<HTMLImageElement | null>;
  /** Function to manually trigger loading */
  loadImage: () => void;
  /** Function to reset the loading state */
  reset: () => void;
}

/**
 * Hook for lazy loading images with intersection observer
 * 
 * @example
 * ```tsx
 * const { isLoading, isLoaded, hasError, imageSrc, imageRef } = useLazyImage({
 *   src: '/path/to/image.jpg',
 *   placeholder: '/path/to/placeholder.jpg',
 *   threshold: 0.1
 * });
 * 
 * return (
 *   <img
 *     ref={imageRef}
 *     src={imageSrc}
 *     alt="Lazy loaded image"
 *     className={`transition-opacity duration-300 ${
 *       isLoaded ? 'opacity-100' : 'opacity-50'
 *     }`}
 *   />
 * );
 * ```
 */
export function useLazyImage({
  src,
  placeholder,
  threshold = 0.1,
  rootMargin = '50px',
  lazy = true
}: UseLazyImageOptions): UseLazyImageReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const imageRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const imageSrc = useCallback(() => {
    if (isLoaded) return src;
    if (placeholder) return placeholder;
    return src;
  }, [src, placeholder, isLoaded])();

  const loadImage = useCallback(() => {
    if (shouldLoad || isLoaded || hasError) return;
    
    setIsLoading(true);
    setHasError(false);
    
    const img = new Image();
    
    img.onload = () => {
      setIsLoading(false);
      setIsLoaded(true);
      setHasError(false);
    };
    
    img.onerror = () => {
      setIsLoading(false);
      setIsLoaded(false);
      setHasError(true);
    };
    
    img.src = src;
  }, [src, shouldLoad, isLoaded, hasError]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsLoaded(false);
    setHasError(false);
    setShouldLoad(!lazy);
  }, [lazy]);

  // Setup intersection observer
  useEffect(() => {
    if (!lazy || shouldLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observerRef.current = observer;

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy, shouldLoad, threshold, rootMargin]);

  // Load image when shouldLoad becomes true
  useEffect(() => {
    if (shouldLoad) {
      loadImage();
    }
  }, [shouldLoad, loadImage]);

  return {
    isLoading,
    isLoaded,
    hasError,
    imageSrc,
    imageRef,
    loadImage,
    reset
  };
} 