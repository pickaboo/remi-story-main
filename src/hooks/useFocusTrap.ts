import { useEffect, useRef } from 'react';

interface UseFocusTrapOptions {
  /** Whether the focus trap is active */
  enabled?: boolean;
  /** Element to focus when trap is activated */
  initialFocus?: HTMLElement | null;
}

/**
 * Hook for creating a focus trap within a container
 * 
 * @example
 * ```tsx
 * const modalRef = useRef<HTMLDivElement>(null);
 * useFocusTrap(modalRef, { enabled: isModalOpen });
 * 
 * return (
 *   <div ref={modalRef}>
 *     <button>First focusable</button>
 *     <button>Last focusable</button>
 *   </div>
 * );
 * ```
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  options: UseFocusTrapOptions = {}
): void {
  const { enabled = true, initialFocus } = options;
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    // Store the previously focused element
    previousFocus.current = document.activeElement as HTMLElement;

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ];

      return Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors.join(', '))
      ).filter(el => {
        // Check if element is visible
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
    };

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    // Focus initial element or first focusable element
    const elementToFocus = initialFocus || focusableElements[0];
    if (elementToFocus) {
      elementToFocus.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const currentFocusIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
      if (currentFocusIndex === -1) return;

      event.preventDefault();

      if (event.shiftKey) {
        // Shift + Tab: move to previous element
        const previousIndex = currentFocusIndex === 0 
          ? focusableElements.length - 1 
          : currentFocusIndex - 1;
        focusableElements[previousIndex]?.focus();
      } else {
        // Tab: move to next element
        const nextIndex = currentFocusIndex === focusableElements.length - 1 
          ? 0 
          : currentFocusIndex + 1;
        focusableElements[nextIndex]?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore previous focus when trap is disabled
      if (previousFocus.current) {
        previousFocus.current.focus();
      }
    };
  }, [enabled, initialFocus, containerRef]);
}

/**
 * Hook for managing focus when a component mounts/unmounts
 * @param shouldFocus - Whether to focus the element on mount
 */
export function useFocusOnMount(shouldFocus: boolean = true) {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      elementRef.current.focus();
    }
  }, [shouldFocus]);

  return elementRef;
}

/**
 * Hook for returning focus to the previously focused element
 * @param shouldReturnFocus - Whether to return focus when unmounting
 */
export function useReturnFocus(shouldReturnFocus: boolean = true) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (shouldReturnFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      return () => {
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [shouldReturnFocus]);

  return previousFocusRef;
} 