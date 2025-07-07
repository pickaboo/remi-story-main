import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface UseVirtualizationOptions {
  /** Total number of items in the list */
  itemCount: number;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the container in pixels */
  containerHeight: number;
  /** Number of items to render outside the visible area (for smooth scrolling) */
  overscan?: number;
  /** Scroll offset from the top */
  scrollOffset?: number;
}

interface UseVirtualizationReturn {
  /** Array of visible item indices */
  visibleItems: number[];
  /** Total height of the virtual list */
  totalHeight: number;
  /** Offset to apply to the container for proper positioning */
  offsetY: number;
  /** Ref to attach to the scrollable container */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Function to scroll to a specific item */
  scrollToItem: (index: number) => void;
  /** Function to scroll to the top */
  scrollToTop: () => void;
  /** Function to scroll to the bottom */
  scrollToBottom: () => void;
}

/**
 * Hook for virtualizing large lists to improve performance
 * 
 * @example
 * ```tsx
 * const { visibleItems, totalHeight, offsetY, containerRef } = useVirtualization({
 *   itemCount: 1000,
 *   itemHeight: 60,
 *   containerHeight: 400,
 *   overscan: 5
 * });
 * 
 * return (
 *   <div ref={containerRef} style={{ height: '400px', overflow: 'auto' }}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       <div style={{ transform: `translateY(${offsetY}px)` }}>
 *         {visibleItems.map(index => (
 *           <div key={index} style={{ height: '60px' }}>
 *             Item {index}
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useVirtualization({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5,
  scrollOffset = 0
}: UseVirtualizationOptions): UseVirtualizationReturn {
  const [scrollTop, setScrollTop] = useState(scrollOffset);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = useMemo(() => itemCount * itemHeight, [itemCount, itemHeight]);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    const overscanStart = Math.max(0, start - overscan);
    const overscanEnd = Math.min(itemCount - 1, end + overscan);

    return {
      start: overscanStart,
      end: overscanEnd,
      visibleStart: start,
      visibleEnd: end
    };
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan]);

  const visibleItems = useMemo(() => {
    const items: number[] = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      items.push(i);
    }
    return items;
  }, [visibleRange]);

  const offsetY = useMemo(() => visibleRange.start * itemHeight, [visibleRange.start, itemHeight]);

  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    setScrollTop(target.scrollTop);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const scrollToItem = useCallback((index: number) => {
    const container = containerRef.current;
    if (container) {
      const targetScrollTop = index * itemHeight;
      container.scrollTop = targetScrollTop;
    }
  }, [itemHeight]);

  const scrollToTop = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = 0;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = totalHeight;
    }
  }, [totalHeight]);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    containerRef,
    scrollToItem,
    scrollToTop,
    scrollToBottom
  };
} 