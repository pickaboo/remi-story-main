import { useState, useEffect, useRef } from 'react';

interface ImageLoaderState {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  error?: string;
  ref?: React.RefObject<HTMLImageElement | null>;
}

interface UseImageLoaderOptions {
  lazy?: boolean;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Hook for optimized image loading with lazy loading support
 * @param src - Image source URL
 * @param options - Loading options
 * @returns Image loading state
 */
export function useImageLoader(
  src: string | null | undefined,
  options: UseImageLoaderOptions = {}
): ImageLoaderState {
  const { lazy = true, threshold = 0.1, rootMargin = '50px' } = options;
  const [state, setState] = useState<ImageLoaderState>({
    isLoading: false,
    isLoaded: false,
    hasError: false
  });
  
  const imgRef = useRef<HTMLImageElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!src) {
      setState({ isLoading: false, isLoaded: false, hasError: false });
      return;
    }

    if (!lazy) {
      // Load immediately if not lazy
      loadImage();
      return;
    }

    // Setup intersection observer for lazy loading
    if (imgRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage();
              observerRef.current?.disconnect();
            }
          });
        },
        { threshold, rootMargin }
      );

      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, lazy, threshold, rootMargin]);

  const loadImage = () => {
    if (!src) return;

    setState(prev => ({ ...prev, isLoading: true, hasError: false }));

    const img = new Image();
    
    img.onload = () => {
      setState({
        isLoading: false,
        isLoaded: true,
        hasError: false
      });
    };

    img.onerror = () => {
      setState({
        isLoading: false,
        isLoaded: false,
        hasError: true,
        error: 'Failed to load image'
      });
    };

    img.src = src;
  };

  return {
    ...state,
    ref: imgRef
  };
}

/**
 * Hook for preloading multiple images
 * @param imageUrls - Array of image URLs to preload
 * @returns Loading state for all images
 */
export function useImagePreloader(imageUrls: string[]): {
  loadedCount: number;
  totalCount: number;
  isComplete: boolean;
  errors: string[];
} {
  const [loadedCount, setLoadedCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (imageUrls.length === 0) return;

    let mounted = true;
    let loaded = 0;
    const newErrors: string[] = [];

    const loadImage = (url: string, index: number) => {
      const img = new Image();
      
      img.onload = () => {
        if (mounted) {
          loaded++;
          setLoadedCount(loaded);
        }
      };

      img.onerror = () => {
        if (mounted) {
          newErrors.push(`Failed to load image ${index + 1}: ${url}`);
          setErrors([...newErrors]);
          loaded++;
          setLoadedCount(loaded);
        }
      };

      img.src = url;
    };

    imageUrls.forEach((url, index) => {
      loadImage(url, index);
    });

    return () => {
      mounted = false;
    };
  }, [imageUrls]);

  return {
    loadedCount,
    totalCount: imageUrls.length,
    isComplete: loadedCount === imageUrls.length,
    errors
  };
} 