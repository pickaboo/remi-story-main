import { useRef, useCallback, useState, useEffect } from 'react';

/**
 * Hook for throttling callback functions
 * @param callback - The function to throttle
 * @param delay - Delay in milliseconds
 * @returns The throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef<number>(0);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();

    if (lastRun.current && now - lastRun.current < delay) {
      // Clear existing timeout
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }

      // Set new timeout
      timeoutId.current = setTimeout(() => {
        lastRun.current = now;
        callback(...args);
      }, delay - (now - lastRun.current));
    } else {
      lastRun.current = now;
      callback(...args);
    }
  }, [callback, delay]) as T;
}

/**
 * Hook for throttling values
 * @param value - The value to throttle
 * @param delay - Delay in milliseconds
 * @returns The throttled value
 */
export function useThrottledValue<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRun = useRef<number>(0);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const now = Date.now();

    if (lastRun.current && now - lastRun.current < delay) {
      // Clear existing timeout
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }

      // Set new timeout
      timeoutId.current = setTimeout(() => {
        lastRun.current = now;
        setThrottledValue(value);
      }, delay - (now - lastRun.current));
    } else {
      lastRun.current = now;
      setThrottledValue(value);
    }

    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, [value, delay]);

  return throttledValue;
} 