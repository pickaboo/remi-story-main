import { useEffect, useRef } from 'react';

export const useClickOutside = (
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      if (!ref.current || ref.current.contains(target)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler, enabled]);

  return ref;
};

export const useEscapeKey = (
  handler: (event: KeyboardEvent) => void,
  enabled: boolean = true
): void => {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handler(event);
      }
    };

    document.addEventListener('keydown', listener);

    return () => {
      document.removeEventListener('keydown', listener);
    };
  }, [handler, enabled]);
};

// Hook for multiple refs
export const useClickOutsideMultiple = <T extends HTMLElement = HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
  refs: RefObject<T>[],
  options: UseClickOutsideOptions = {}
): void => {
  const { enabled = true, eventType = 'mousedown' } = options;

  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // Check if click is inside any of the refs
      const isInsideAnyRef = refs.some(ref => 
        ref.current && ref.current.contains(target)
      );

      if (isInsideAnyRef) {
        return;
      }

      handler(event);
    };

    document.addEventListener(eventType, listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener(eventType, listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler, refs, enabled, eventType]);
};

// Combined hook for click outside and escape key
export const useClickOutsideAndEscape = (
  handler: () => void,
  options: UseClickOutsideOptions & { escapeEnabled?: boolean } = {}
): RefObject<HTMLElement> => {
  const { escapeEnabled = true, ...clickOutsideOptions } = options;
  const ref = useClickOutside(handler, clickOutsideOptions);
  
  useEscapeKey(handler, escapeEnabled);

  return ref;
}; 