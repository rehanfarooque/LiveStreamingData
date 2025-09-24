import { useCallback, useRef, useEffect } from 'react';
import { debounce, throttle } from '@/utils/helpers';

/**
 * Hook for debounced callbacks
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const debouncedFn = useRef(debounce(callback, delay));
  
  useEffect(() => {
    debouncedFn.current = debounce(callback, delay);
  }, [callback, delay]);
  
  return useCallback(
    (...args: Parameters<T>) => debouncedFn.current(...args),
    []
  ) as T;
};

/**
 * Hook for throttled callbacks
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T => {
  const throttledFn = useRef(throttle(callback, limit));
  
  useEffect(() => {
    throttledFn.current = throttle(callback, limit);
  }, [callback, limit]);
  
  return useCallback(
    (...args: Parameters<T>) => throttledFn.current(...args),
    []
  ) as T;
};

/**
 * Hook for managing component mount state
 */
export const useIsMounted = () => {
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  return useCallback(() => isMountedRef.current, []);
};

/**
 * Hook for previous value tracking
 */
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
};