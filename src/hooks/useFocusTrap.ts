import { useEffect, useRef } from 'react';

/**
 * Hook for trapping focus within a modal or popover
 * @param isActive - Whether the focus trap should be active
 * @param onEscape - Optional callback for when Escape is pressed
 */
export function useFocusTrap(isActive: boolean, onEscape?: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus the first element when trap becomes active
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }

      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab: move backwards
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: move forwards
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, onEscape]);

  return containerRef;
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