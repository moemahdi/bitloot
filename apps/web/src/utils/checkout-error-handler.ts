/**
 * Checkout Error Handler Utility
 * Maps HTTP error codes and network errors to user-friendly messages
 */

export interface CheckoutError {
  message: string;
  code?: string;
  isRetryable: boolean;
}

/**
 * Map HTTP status code to user-friendly error message
 * @param status HTTP status code
 * @param defaultMessage Fallback message if status code not recognized
 * @returns CheckoutError with message and retry flag
 */
export function mapHttpErrorToCheckoutError(
  status: number,
  defaultMessage: string = 'Checkout failed, please try again.',
): CheckoutError {
  const errorMap: Record<number, { message: string; isRetryable: boolean }> = {
    400: {
      message: 'CAPTCHA verification failed. Please complete the verification and try again.',
      isRetryable: true,
    },
    401: {
      message: 'Authentication failed. Please refresh and try again.',
      isRetryable: true,
    },
    403: {
      message: 'Access denied. Please check your email and try again.',
      isRetryable: false,
    },
    429: {
      message: 'Too many requests. Please wait a moment before trying again.',
      isRetryable: true,
    },
    500: {
      message: 'Server error. Please try again later.',
      isRetryable: true,
    },
    502: {
      message: 'Service temporarily unavailable. Please try again later.',
      isRetryable: true,
    },
    503: {
      message: 'Service is under maintenance. Please try again later.',
      isRetryable: true,
    },
  };

  const errorInfo = errorMap[status];
  if (errorInfo !== undefined) {
    return {
      message: errorInfo.message,
      code: `HTTP_${status}`,
      isRetryable: errorInfo.isRetryable,
    };
  }

  return {
    message: defaultMessage,
    code: `HTTP_${status}`,
    isRetryable: status >= 500, // Server errors are retryable, client errors are not
  };
}

/**
 * Map network or unknown error to user-friendly message
 * @param error The error object
 * @returns CheckoutError with message and retry flag
 */
export function mapNetworkErrorToCheckoutError(error: unknown): CheckoutError {
  // Check if it's a fetch error or network error
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    if (message.includes('fetch') || message.includes('network')) {
      return {
        message: 'Network error. Please check your internet connection and try again.',
        code: 'NETWORK_ERROR',
        isRetryable: true,
      };
    }
  }

  // Check if it's a timeout
  if (error instanceof Error && error.name === 'AbortError') {
    return {
      message: 'Request timed out. Please check your connection and try again.',
      code: 'TIMEOUT_ERROR',
      isRetryable: true,
    };
  }

  // Default for unknown errors
  if (error instanceof Error) {
    const message = error.message.length > 0 ? error.message : 'Checkout failed. Please try again.';
    return {
      message,
      code: 'UNKNOWN_ERROR',
      isRetryable: false,
    };
  }

  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
    isRetryable: false,
  };
}

/**
 * Extract error details from a caught error during checkout
 * @param error The caught error (could be HTTP response error or network error)
 * @returns CheckoutError with appropriate message and retry flag
 */
export function extractCheckoutError(error: unknown): CheckoutError {
  // Handle HTTP response errors (check for status property)
  if (error !== null && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    const status = err.status;
    if (typeof status === 'number') {
      return mapHttpErrorToCheckoutError(status);
    }
  }

  // Handle any error with a message property (API errors)
  if (error instanceof Error) {
    // Check if error message contains HTTP status info
    const statusMatch = error.message.match(/status[:\s]+(\d{3})/i);
    if (statusMatch?.[1] !== undefined) {
      const status = parseInt(statusMatch[1], 10);
      return mapHttpErrorToCheckoutError(status);
    }
  }

  // Fall back to network error handling
  return mapNetworkErrorToCheckoutError(error);
}
