import { useState, useEffect, useCallback } from 'react';

interface UseImageLoaderOptions {
  /** Whether to load the image immediately */
  immediate?: boolean;
  /** Cross-origin setting for the image */
  crossOrigin?: 'anonymous' | 'use-credentials';
  /** Whether to decode the image */
  decode?: boolean;
}

interface UseImageLoaderReturn {
  /** Whether the image is currently loading */
  isLoading: boolean;
  /** Whether the image has loaded successfully */
  isLoaded: boolean;
  /** Whether there was an error loading the image */
  hasError: boolean;
  /** The loaded image element */
  image: HTMLImageElement | null;
  /** Function to manually load the image */
  load: () => void;
  /** Function to reset the loading state */
  reset: () => void;
}

/**
 * Hook for optimized image loading with error handling
 * 
 * @example
 * ```tsx
 * const { isLoading, isLoaded, hasError, image, load } = useImageLoader({
 *   src: '/path/to/image.jpg',
 *   immediate: true
 * });
 * 
 * if (isLoading) return <div>Loading...</div>;
 * if (hasError) return <div>Error loading image</div>;
 * if (isLoaded) return <img src={image?.src} alt="Loaded image" />;
 * ```
 */
export function useImageLoader(
  src: string,
  options: UseImageLoaderOptions = {}
): UseImageLoaderReturn {
  const { immediate = true, crossOrigin, decode = true } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  const load = useCallback(() => {
    if (!src) return;

    setIsLoading(true);
    setHasError(false);
    setIsLoaded(false);

    const img = new Image();
    
    if (crossOrigin) {
      img.crossOrigin = crossOrigin;
    }

    img.onload = () => {
      setIsLoading(false);
      setIsLoaded(true);
      setHasError(false);
      setImage(img);

      if (decode && 'decode' in img) {
        img.decode().catch(() => {
          // Decode failed, but image is still loaded
        });
      }
    };

    img.onerror = () => {
      setIsLoading(false);
      setIsLoaded(false);
      setHasError(true);
      setImage(null);
    };

    img.src = src;
  }, [src, crossOrigin, decode]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsLoaded(false);
    setHasError(false);
    setImage(null);
  }, []);

  useEffect(() => {
    if (immediate) {
      load();
    }
  }, [immediate, load]);

  return {
    isLoading,
    isLoaded,
    hasError,
    image,
    load,
    reset
  };
}

/**
 * Hook for preloading multiple images
 * 
 * @example
 * ```tsx
 * const { isLoading, loadedCount, totalCount, hasError } = useImagePreloader([
 *   '/image1.jpg',
 *   '/image2.jpg',
 *   '/image3.jpg'
 * ]);
 * 
 * if (isLoading) return <div>Loading {loadedCount}/{totalCount} images...</div>;
 * ```
 */
export function useImagePreloader(
  imageUrls: string[],
  options: UseImageLoaderOptions = {}
): {
  isLoading: boolean;
  loadedCount: number;
  totalCount: number;
  hasError: boolean;
  errors: string[];
} {
  const [loadedCount, setLoadedCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const loadImages = useCallback(() => {
    if (imageUrls.length === 0) return;

    setIsLoading(true);
    setLoadedCount(0);
    setErrors([]);
    setHasError(false);

    let completedCount = 0;
    const newErrors: string[] = [];

    const checkCompletion = () => {
      completedCount++;
      if (completedCount === imageUrls.length) {
        setIsLoading(false);
        setHasError(newErrors.length > 0);
      }
    };

    imageUrls.forEach((url, index) => {
      const img = new Image();
      
      if (options.crossOrigin) {
        img.crossOrigin = options.crossOrigin;
      }

      img.onload = () => {
        setLoadedCount(prev => prev + 1);
        checkCompletion();
      };

      img.onerror = () => {
        newErrors.push(url);
        setErrors(prev => [...prev, url]);
        checkCompletion();
      };

      img.src = url;
    });
  }, [imageUrls, options.crossOrigin]);

  useEffect(() => {
    if (options.immediate !== false) {
      loadImages();
    }
  }, [loadImages, options.immediate]);

  return {
    isLoading,
    loadedCount,
    totalCount: imageUrls.length,
    hasError,
    errors
  };
} 