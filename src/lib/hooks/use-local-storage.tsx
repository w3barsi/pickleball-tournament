import * as React from "react";

// ============================================================================
// Hook Implementation
// ============================================================================

interface UseLocalStorageOptions<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  initializeWithValue?: boolean;
}

const IS_SERVER = typeof window === "undefined";

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options: UseLocalStorageOptions<T> = {},
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const { initializeWithValue = true } = options;

  const optionsRef = React.useRef(options);
  optionsRef.current = options;

  const initialValueRef = React.useRef(initialValue);
  initialValueRef.current = initialValue;

  const getDefaultValue = React.useCallback(() => {
    const iv = initialValueRef.current;
    return iv instanceof Function ? iv() : iv;
  }, []);

  const serializer = React.useCallback((value: T): string => {
    if (optionsRef.current.serializer) {
      return optionsRef.current.serializer(value);
    }
    return JSON.stringify(value);
  }, []);

  const deserializer = React.useCallback(
    (value: string): T => {
      if (optionsRef.current.deserializer) {
        return optionsRef.current.deserializer(value);
      }
      if (value === "undefined") {
        return undefined as unknown as T;
      }
      const defaultValue = getDefaultValue();
      try {
        return JSON.parse(value) as T;
      } catch {
        return defaultValue;
      }
    },
    [getDefaultValue],
  );

  const readValue = React.useCallback((): T => {
    const initialValueToUse = getDefaultValue();

    if (IS_SERVER) {
      return initialValueToUse;
    }

    try {
      const raw = window.localStorage.getItem(key);
      return raw ? deserializer(raw) : initialValueToUse;
    } catch {
      return initialValueToUse;
    }
  }, [key, deserializer, getDefaultValue]);

  const [storedValue, setStoredValue] = React.useState<T>(() => {
    if (initializeWithValue) {
      return readValue();
    }
    return getDefaultValue();
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = React.useCallback(
    (value) => {
      if (IS_SERVER) {
        return;
      }

      try {
        const newValue = value instanceof Function ? value(readValue()) : value;
        window.localStorage.setItem(key, serializer(newValue));
        setStoredValue(newValue);
        window.dispatchEvent(new StorageEvent("local-storage", { key }));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serializer, readValue],
  );

  const removeValue = React.useCallback(() => {
    if (IS_SERVER) {
      return;
    }

    const defaultValue = getDefaultValue();

    window.localStorage.removeItem(key);
    setStoredValue(defaultValue);
    window.dispatchEvent(new StorageEvent("local-storage", { key }));
  }, [key, getDefaultValue]);

  React.useEffect(() => {
    setStoredValue(readValue());
  }, [key, readValue]);

  React.useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key !== key) {
        return;
      }
      setStoredValue(readValue());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage" as any, handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage" as any, handleStorageChange);
    };
  }, [key, readValue]);

  return [storedValue, setValue, removeValue];
}

export type { UseLocalStorageOptions };
