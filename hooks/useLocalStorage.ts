import { useState, useEffect, useCallback } from 'react';

interface UseLocalStorageOptions {
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
}

const defaultSerialize = JSON.stringify;
const defaultDeserialize = JSON.parse;

export const useLocalStorage = <T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {}
): [T, (value: T | ((val: T) => T)) => void, () => void] => {
  const { serialize = defaultSerialize, deserialize = defaultDeserialize } = options;

  // Get initial value from localStorage or use provided initial value
  const getStoredValue = useCallback((): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, deserialize]);

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      window.localStorage.setItem(key, serialize(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue, serialize]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes to this localStorage key from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          console.warn(`Error deserializing localStorage value for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserialize]);

  return [storedValue, setValue, removeValue];
};

// Specialized hooks for common use cases
export const useLocalStorageString = (key: string, initialValue: string) => {
  return useLocalStorage(key, initialValue, {
    serialize: (value: string) => value,
    deserialize: (value: string) => value
  });
};

export const useLocalStorageBoolean = (key: string, initialValue: boolean) => {
  return useLocalStorage(key, initialValue, {
    serialize: (value: boolean) => value.toString(),
    deserialize: (value: string) => value === 'true'
  });
};

export const useLocalStorageNumber = (key: string, initialValue: number) => {
  return useLocalStorage(key, initialValue, {
    serialize: (value: number) => value.toString(),
    deserialize: (value: string) => {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? initialValue : parsed;
    }
  });
}; 