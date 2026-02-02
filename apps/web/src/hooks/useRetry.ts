'use client';

import { useState, useCallback, useRef } from 'react';

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier?: number;
  /** Whether to retry on specific error types */
  retryOn?: (error: Error) => boolean;
}

export interface RetryState {
  /** Current retry attempt (0 = initial, 1+ = retry) */
  attempt: number;
  /** Whether currently retrying */
  isRetrying: boolean;
  /** Last error encountered */
  lastError: Error | null;
  /** Time until next retry in ms */
  nextRetryIn: number | null;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryOn: () => true,
};

/**
 * Hook for automatic retry with exponential backoff
 * Useful for network requests that may fail temporarily
 */
export function useRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): {
  execute: () => Promise<T>;
  state: RetryState;
  reset: () => void;
  cancel: () => void;
} {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<RetryState>({
    attempt: 0,
    isRetrying: false,
    lastError: null,
    nextRetryIn: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cancelledRef = useRef(false);

  const calculateDelay = useCallback((attempt: number): number => {
    const delay = mergedConfig.initialDelay * Math.pow(mergedConfig.backoffMultiplier, attempt);
    return Math.min(delay, mergedConfig.maxDelay);
  }, [mergedConfig.initialDelay, mergedConfig.backoffMultiplier, mergedConfig.maxDelay]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState((prev) => ({ ...prev, isRetrying: false, nextRetryIn: null }));
  }, []);

  const reset = useCallback(() => {
    cancel();
    cancelledRef.current = false;
    setState({
      attempt: 0,
      isRetrying: false,
      lastError: null,
      nextRetryIn: null,
    });
  }, [cancel]);

  const execute = useCallback(async (): Promise<T> => {
    cancelledRef.current = false;
    let attempt = 0;

    const attemptExecution = async (): Promise<T> => {
      try {
        setState((prev) => ({ ...prev, attempt, isRetrying: attempt > 0, lastError: null }));
        const result = await fn();
        reset();
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        if (cancelledRef.current) {
          throw err;
        }

        const shouldRetry = attempt < mergedConfig.maxRetries && mergedConfig.retryOn(err);
        
        if (!shouldRetry) {
          setState((prev) => ({ ...prev, lastError: err, isRetrying: false }));
          throw err;
        }

        const delay = calculateDelay(attempt);
        setState((prev) => ({ 
          ...prev, 
          attempt: attempt + 1,
          lastError: err,
          isRetrying: true,
          nextRetryIn: delay,
        }));

        // Wait with countdown updates
        await new Promise<void>((resolve) => {
          const startTime = Date.now();
          const updateCountdown = () => {
            if (cancelledRef.current) {
              resolve();
              return;
            }
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, delay - elapsed);
            setState((prev) => ({ ...prev, nextRetryIn: remaining }));
            
            if (remaining > 0) {
              timeoutRef.current = setTimeout(updateCountdown, 100);
            } else {
              resolve();
            }
          };
          timeoutRef.current = setTimeout(updateCountdown, 100);
        });

        if (cancelledRef.current) {
          throw err;
        }

        attempt++;
        return attemptExecution();
      }
    };

    return attemptExecution();
  }, [fn, mergedConfig.maxRetries, mergedConfig.retryOn, calculateDelay, reset]);

  return { execute, state, reset, cancel };
}

/**
 * Check if an error is retryable (network-related)
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const retryablePatterns = [
    'network',
    'timeout',
    'failed to fetch',
    'fetch failed',
    'econnrefused',
    'econnreset',
    'enotfound',
    'socket hang up',
    '502',
    '503',
    '504',
    'gateway',
    'service unavailable',
  ];
  return retryablePatterns.some((pattern) => message.includes(pattern));
}
