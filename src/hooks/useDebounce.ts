import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDebounceOptions {
  /** Delay in milliseconds */
  delay: number;
  /** Whether to call the function immediately on first call */
  immediate?: boolean;
}

/**
 * Hook for debouncing function calls
 * 
 * @example
 * ```tsx
 * const debouncedSearch = useDebounce((searchTerm: string) => {
 *   // Perform search API call
 *   searchAPI(searchTerm);
 * }, { delay: 300 });
 * 
 * // Usage
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  options: UseDebounceOptions
): T {
  const { delay, immediate = false } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Hook for debouncing values
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounceValue(searchTerm, 300);
 * 
 * useEffect(() => {
 *   // This will only run when debouncedSearchTerm changes
 *   // (300ms after the last setSearchTerm call)
 *   searchAPI(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 * ```
 */
export function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}