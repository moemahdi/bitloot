'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface ErrorState {
  error: Error | null;
  isNetworkError: boolean;
  isTimeoutError: boolean;
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface UseErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error, context: string) => void;
  onRetry?: (attempt: number) => void;
  onRecovery?: () => void;
}

/**
 * useErrorHandler: Comprehensive error handling hook
 *
 * Features:
 * ✅ Track error state with network/timeout detection
 * ✅ Automatic retry logic with exponential backoff
 * ✅ Recovery callbacks
 * ✅ Error logging support
 * ✅ Clear and reset functions
 *
 * Usage:
 * const { error, isRetrying, retry, clearError } = useErrorHandler({ maxRetries: 3 });
 *
 * try {
 *   await fetchData();
 * } catch (err) {
 *   handleError(err, 'fetchData');
 * }
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}): {
  state: ErrorState;
  handleError: (error: unknown, context: string) => void;
  retry: (fn: () => Promise<void>) => Promise<void>;
  clearError: () => void;
  reset: () => void;
} {
  const maxRetries = options.maxRetries ?? 3;
  const retryDelay = options.retryDelay ?? 1000;
  const onError = options.onError;
  const onRetry = options.onRetry;
  const onRecovery = options.onRecovery;

  const [error, setError] = useState<Error | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [isTimeoutError, setIsTimeoutError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryFunctionRef = useRef<(() => Promise<void>) | null>(null);

  // Detect error type
  const classifyError = useCallback(
    (err: unknown): { error: Error; isNetwork: boolean; isTimeout: boolean } => {
      let error: Error;
      let isNetwork = false;
      let isTimeout = false;

      if (err instanceof Error) {
        error = err;
      } else if (typeof err === 'string') {
        error = new Error(err);
      } else {
        error = new Error('Unknown error occurred');
      }

      const message = error.message.toLowerCase();
      const name = error.name.toLowerCase();

      // Network error detection
      if (
        message.includes('network') ||
        message.includes('offline') ||
        message.includes('failed to fetch') ||
        message.includes('connection') ||
        name.includes('networkerror')
      ) {
        isNetwork = true;
      }

      // Timeout error detection
      if (
        message.includes('timeout') ||
        message.includes('timeout') ||
        error.name === 'AbortError'
      ) {
        isTimeout = true;
      }

      return { error, isNetwork, isTimeout };
    },
    []
  );

  // Handle error
  const handleError = useCallback(
    (err: unknown, context: string): void => {
      const { error: classifiedError, isNetwork, isTimeout } = classifyError(err);

      setError(classifiedError);
      setIsNetworkError(isNetwork);
      setIsTimeoutError(isTimeout);
      setRetryCount(0);

      // Call custom error handler
      if (onError !== null && onError !== undefined) {
        onError(classifiedError, context);
      }

      // Log error
      if (process.env.NODE_ENV === 'development') {
        console.info(`[${context}] Error:`, classifiedError);
      }
    },
    [classifyError, onError]
  );

  // Retry with exponential backoff
  const retry = useCallback(
    async (fn: () => Promise<void>): Promise<void> => {
      if (retryCount >= maxRetries) {
        return;
      }

      setIsRetrying(true);
      retryFunctionRef.current = fn;

      try {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = retryDelay * Math.pow(2, retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Call onRetry callback
        if (onRetry !== null && onRetry !== undefined) {
          onRetry(retryCount + 1);
        }

        // Execute function
        await fn();

        // Success: clear error and reset count
        setError(null);
        setRetryCount(0);
        setIsRetrying(false);

        // Call recovery callback
        if (onRecovery !== null && onRecovery !== undefined) {
          onRecovery();
        }
      } catch (err) {
        const { error: classifiedError, isNetwork, isTimeout } = classifyError(err);
        setError(classifiedError);
        setIsNetworkError(isNetwork);
        setIsTimeoutError(isTimeout);
        setRetryCount((c) => c + 1);
        setIsRetrying(false);

        // Log retry failure
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Retry attempt ${retryCount + 1} failed:`, classifiedError);
        }
      }
    },
    [retryCount, maxRetries, retryDelay, classifyError, onRetry, onRecovery]
  );

  // Clear error without resetting retry count
  const clearError = useCallback((): void => {
    setError(null);
    setIsNetworkError(false);
    setIsTimeoutError(false);
  }, []);

  // Reset everything
  const reset = useCallback((): void => {
    setError(null);
    setIsNetworkError(false);
    setIsTimeoutError(false);
    setIsRetrying(false);
    setRetryCount(0);
    retryFunctionRef.current = null;
  }, []);

  return {
    state: {
      error,
      isNetworkError,
      isTimeoutError,
      isRetrying,
      retryCount,
      maxRetries,
    },
    handleError,
    retry,
    clearError,
    reset,
  };
}

/**
 * useNetworkStatus: Hook to detect online/offline status
 *
 * Features:
 * ✅ Real-time online/offline detection
 * ✅ Event listener management
 * ✅ Cleanup on unmount
 *
 * Usage:
 * const isOnline = useNetworkStatus();
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = (): void => {
      setIsOnline(true);
      if (process.env.NODE_ENV === 'development') {
        console.info('✅ Online');
      }
    };

    const handleOffline = (): void => {
      setIsOnline(false);
      if (process.env.NODE_ENV === 'development') {
        console.info('❌ Offline');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
