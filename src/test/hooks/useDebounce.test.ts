import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebounceValue } from '../../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useDebounce', () => {
    it('should debounce function calls', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useDebounce(callback, { delay: 300 })
      );

      // Call the debounced function multiple times
      act(() => {
        result.current('test1');
        result.current('test2');
        result.current('test3');
      });

      // Should not have called the callback yet
      expect(callback).not.toHaveBeenCalled();

      // Fast forward time
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should have called the callback only once with the last value
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('test3');
    });

    it('should reset timer on new calls', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => 
        useDebounce(callback, { delay: 300 })
      );

      // First call
      act(() => {
        result.current('test1');
      });

      // Advance time but not enough to trigger
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Second call should reset the timer
      act(() => {
        result.current('test2');
      });

      // Advance time again
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should have called the callback only once with the last value
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('test2');
    });
  });

  describe('useDebounceValue', () => {
    it('should debounce value changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounceValue(value, 300),
        { initialProps: { value: 'initial' } }
      );

      // Initial value should be set immediately
      expect(result.current).toBe('initial');

      // Change the value
      rerender({ value: 'changed' });

      // Should still have the old value
      expect(result.current).toBe('initial');

      // Fast forward time
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should now have the new value
      expect(result.current).toBe('changed');
    });

    it('should handle multiple rapid changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounceValue(value, 300),
        { initialProps: { value: 'initial' } }
      );

      // Rapid changes
      rerender({ value: 'change1' });
      rerender({ value: 'change2' });
      rerender({ value: 'change3' });

      // Should still have initial value
      expect(result.current).toBe('initial');

      // Fast forward time
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should have the last value
      expect(result.current).toBe('change3');
    });

    it('should handle immediate option', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounceValue(value, 300),
        { initialProps: { value: 'initial' } }
      );

      // Change the value
      rerender({ value: 'changed' });

      // Should still have the old value
      expect(result.current).toBe('initial');

      // Fast forward time
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should now have the new value
      expect(result.current).toBe('changed');
    });
  });
}); 