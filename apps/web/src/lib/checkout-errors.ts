/**
 * Checkout Error Handling Utilities
 * Maps API errors to user-friendly messages with actionable guidance
 */

export interface CheckoutError {
  /** User-friendly error message */
  message: string;
  /** More detailed description */
  description: string;
  /** Whether the error can be resolved by retrying */
  isRetryable: boolean;
  /** Suggested action for the user */
  action: 'retry' | 'contact_support' | 'go_back' | 'refresh' | 'wait';
  /** Optional action button text */
  actionText?: string;
}

/**
 * Error codes from the backend mapped to user-friendly messages
 */
const ERROR_MAP: Record<string, CheckoutError> = {
  // Order errors
  ORDER_NOT_FOUND: {
    message: 'Order not found',
    description: 'This order may have expired or the link is invalid.',
    isRetryable: false,
    action: 'go_back',
    actionText: 'Browse Products',
  },
  ORDER_EXPIRED: {
    message: 'Order has expired',
    description: 'The payment window has closed. Please create a new order.',
    isRetryable: false,
    action: 'go_back',
    actionText: 'Start New Order',
  },
  ORDER_ALREADY_PAID: {
    message: 'Order already paid',
    description: 'This order has already been paid. Check your email for the delivery.',
    isRetryable: false,
    action: 'go_back',
    actionText: 'View Order',
  },
  ORDER_CANCELLED: {
    message: 'Order was cancelled',
    description: 'This order has been cancelled. Please create a new order.',
    isRetryable: false,
    action: 'go_back',
    actionText: 'Browse Products',
  },
  
  // Payment errors
  PAYMENT_FAILED: {
    message: 'Payment failed',
    description: 'There was an issue processing your payment. Please try again.',
    isRetryable: true,
    action: 'retry',
    actionText: 'Try Again',
  },
  PAYMENT_EXPIRED: {
    message: 'Payment window expired',
    description: 'The 1-hour payment window has closed. No funds were charged.',
    isRetryable: false,
    action: 'go_back',
    actionText: 'Create New Order',
  },
  PAYMENT_UNDERPAID: {
    message: 'Insufficient payment',
    description: 'The amount received was less than required. Please contact support.',
    isRetryable: false,
    action: 'contact_support',
    actionText: 'Contact Support',
  },
  INVALID_CURRENCY: {
    message: 'Invalid cryptocurrency',
    description: 'The selected cryptocurrency is not available. Please choose another.',
    isRetryable: true,
    action: 'retry',
    actionText: 'Select Different Currency',
  },
  
  // Cart/Product errors
  CART_EMPTY: {
    message: 'Your cart is empty',
    description: 'Add some products to your cart before checking out.',
    isRetryable: false,
    action: 'go_back',
    actionText: 'Browse Products',
  },
  PRODUCT_UNAVAILABLE: {
    message: 'Product no longer available',
    description: 'One or more items in your cart are no longer in stock.',
    isRetryable: false,
    action: 'go_back',
    actionText: 'Update Cart',
  },
  PRICE_CHANGED: {
    message: 'Price has changed',
    description: 'The price of one or more items has been updated. Please review your cart.',
    isRetryable: true,
    action: 'refresh',
    actionText: 'Refresh Prices',
  },
  
  // Validation errors
  INVALID_EMAIL: {
    message: 'Invalid email address',
    description: 'Please enter a valid email address to receive your products.',
    isRetryable: true,
    action: 'retry',
  },
  EMAIL_REQUIRED: {
    message: 'Email is required',
    description: 'We need your email address to deliver your digital products.',
    isRetryable: true,
    action: 'retry',
  },
  
  // Rate limiting
  TOO_MANY_REQUESTS: {
    message: 'Too many requests',
    description: 'Please wait a moment before trying again.',
    isRetryable: true,
    action: 'wait',
    actionText: 'Wait and Retry',
  },
  
  // Server errors
  SERVER_ERROR: {
    message: 'Something went wrong',
    description: 'Our servers are having trouble. Please try again in a moment.',
    isRetryable: true,
    action: 'retry',
    actionText: 'Try Again',
  },
  SERVICE_UNAVAILABLE: {
    message: 'Service temporarily unavailable',
    description: 'We\'re experiencing high traffic. Please try again shortly.',
    isRetryable: true,
    action: 'wait',
    actionText: 'Try Again Later',
  },
};

/**
 * Default error for unknown error types
 */
const DEFAULT_ERROR: CheckoutError = {
  message: 'Something went wrong',
  description: 'An unexpected error occurred. Please try again.',
  isRetryable: true,
  action: 'retry',
  actionText: 'Try Again',
};

/**
 * Extract error code from various error formats
 */
function extractErrorCode(error: unknown): string | null {
  if (error === null || error === undefined) return null;
  
  // Check for error object with code
  if (typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    if (typeof errorObj.code === 'string') return errorObj.code;
    if (typeof errorObj.errorCode === 'string') return errorObj.errorCode;
    
    // Check nested error
    if (errorObj.error !== null && errorObj.error !== undefined && typeof errorObj.error === 'object') {
      const nested = errorObj.error as Record<string, unknown>;
      if (typeof nested.code === 'string') return nested.code;
    }
  }
  
  return null;
}

/**
 * Extract error message from various error formats
 */
function extractErrorMessage(error: unknown): string {
  if (error === null || error === undefined) return '';
  
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  
  if (typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    if (typeof errorObj.message === 'string') return errorObj.message;
    if (typeof errorObj.error === 'string') return errorObj.error;
  }
  
  return String(error);
}

/**
 * Map HTTP status code to checkout error
 */
function mapStatusCodeToError(status: number): CheckoutError | null {
  switch (status) {
    case 400:
      return { ...DEFAULT_ERROR, message: 'Invalid request', description: 'Please check your input and try again.' };
    case 401:
      return { ...DEFAULT_ERROR, message: 'Session expired', description: 'Please log in again.', action: 'refresh' };
    case 403:
      return { ...DEFAULT_ERROR, message: 'Access denied', description: 'You don\'t have permission for this action.', isRetryable: false };
    case 404: {
      const notFoundError = ERROR_MAP['ORDER_NOT_FOUND'];
      return notFoundError !== undefined ? notFoundError : null;
    }
    case 409:
      return { ...DEFAULT_ERROR, message: 'Conflict detected', description: 'This action has already been completed.', isRetryable: false };
    case 429: {
      const rateLimitError = ERROR_MAP['TOO_MANY_REQUESTS'];
      return rateLimitError !== undefined ? rateLimitError : null;
    }
    case 500: {
      const serverError = ERROR_MAP['SERVER_ERROR'];
      return serverError !== undefined ? serverError : null;
    }
    case 502:
    case 503:
    case 504: {
      const serviceError = ERROR_MAP['SERVICE_UNAVAILABLE'];
      return serviceError !== undefined ? serviceError : null;
    }
    default:
      return null;
  }
}

/**
 * Parse an error into a user-friendly CheckoutError
 */
export function parseCheckoutError(error: unknown): CheckoutError {
  // Extract error code and check mapping
  const errorCode = extractErrorCode(error);
  if (errorCode !== null) {
    const mappedError = ERROR_MAP[errorCode];
    if (mappedError !== undefined) {
      return mappedError;
    }
  }
  
  // Check for HTTP status code
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (typeof errorObj.status === 'number') {
      const statusError = mapStatusCodeToError(errorObj.status);
      if (statusError !== null) return statusError;
    }
  }
  
  // Check error message for patterns
  const message = extractErrorMessage(error).toLowerCase();
  
  if (message.includes('network') || message.includes('failed to fetch') || message.includes('timeout')) {
    return {
      message: 'Connection problem',
      description: 'Please check your internet connection and try again.',
      isRetryable: true,
      action: 'retry',
      actionText: 'Retry',
    };
  }
  
  if (message.includes('expired')) {
    const expiredError = ERROR_MAP['ORDER_EXPIRED'];
    if (expiredError !== undefined) return expiredError;
  }
  
  if (message.includes('not found')) {
    const notFoundError = ERROR_MAP['ORDER_NOT_FOUND'];
    if (notFoundError !== undefined) return notFoundError;
  }
  
  if (message.includes('email')) {
    const emailError = ERROR_MAP['INVALID_EMAIL'];
    if (emailError !== undefined) return emailError;
  }
  
  // Return default with original message if available
  const originalMessage = extractErrorMessage(error);
  if (originalMessage !== '' && originalMessage.length < 100) {
    return {
      ...DEFAULT_ERROR,
      description: originalMessage,
    };
  }
  
  return DEFAULT_ERROR;
}

/**
 * Check if an error should trigger a retry
 */
export function shouldRetry(error: unknown): boolean {
  const parsed = parseCheckoutError(error);
  return parsed.isRetryable;
}
