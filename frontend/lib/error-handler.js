// Error types
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  CLIENT_ERROR: 'CLIENT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Custom error class
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN_ERROR, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Error handler utility
export class ErrorHandler {
  static handle(error, context = {}) {
    const processedError = this.processError(error);
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', {
        error: processedError,
        context,
        stack: error.stack
      });
    }

    // In production, you might want to send to error tracking service
    // this.reportError(processedError, context);

    return processedError;
  }

  static processError(error) {
    // If it's already an AppError, return as is
    if (error instanceof AppError) {
      return error;
    }

    // Handle different error types
    if (error.name === 'ValidationError') {
      return new AppError(
        error.message,
        ErrorTypes.VALIDATION_ERROR,
        400,
        error.details
      );
    }

    if (error.response) {
      // HTTP error response
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new AppError(
            data.error || 'Bad request',
            ErrorTypes.CLIENT_ERROR,
            400,
            data
          );
        case 401:
          return new AppError(
            data.error || 'Authentication required',
            ErrorTypes.AUTHENTICATION_ERROR,
            401,
            data
          );
        case 403:
          return new AppError(
            data.error || 'Access forbidden',
            ErrorTypes.AUTHORIZATION_ERROR,
            403,
            data
          );
        case 404:
          return new AppError(
            data.error || 'Resource not found',
            ErrorTypes.CLIENT_ERROR,
            404,
            data
          );
        case 422:
          return new AppError(
            data.error || 'Validation failed',
            ErrorTypes.VALIDATION_ERROR,
            422,
            data
          );
        case 429:
          return new AppError(
            data.error || 'Too many requests',
            ErrorTypes.CLIENT_ERROR,
            429,
            data
          );
        case 500:
        default:
          return new AppError(
            data.error || 'Internal server error',
            ErrorTypes.SERVER_ERROR,
            status,
            data
          );
      }
    }

    if (error.request) {
      // Network error
      return new AppError(
        'Network error. Please check your connection.',
        ErrorTypes.NETWORK_ERROR,
        0,
        { originalError: error.message }
      );
    }

    // Generic error
    return new AppError(
      error.message || 'An unexpected error occurred',
      ErrorTypes.UNKNOWN_ERROR,
      500,
      { originalError: error.message }
    );
  }

  static getErrorMessage(error) {
    if (error instanceof AppError) {
      return error.message;
    }
    return error.message || 'An unexpected error occurred';
  }

  static getErrorType(error) {
    if (error instanceof AppError) {
      return error.type;
    }
    return ErrorTypes.UNKNOWN_ERROR;
  }

  static isRetryable(error) {
    if (!(error instanceof AppError)) {
      return false;
    }

    const retryableTypes = [
      ErrorTypes.NETWORK_ERROR,
      ErrorTypes.SERVER_ERROR
    ];

    const retryableStatusCodes = [500, 502, 503, 504];

    return retryableTypes.includes(error.type) || 
           retryableStatusCodes.includes(error.statusCode);
  }

  static getUserFriendlyMessage(error) {
    if (!(error instanceof AppError)) {
      return 'Something went wrong. Please try again.';
    }

    switch (error.type) {
      case ErrorTypes.NETWORK_ERROR:
        return 'Unable to connect. Please check your internet connection and try again.';
      case ErrorTypes.AUTHENTICATION_ERROR:
        return 'Please sign in to continue.';
      case ErrorTypes.AUTHORIZATION_ERROR:
        return 'You don\'t have permission to perform this action.';
      case ErrorTypes.VALIDATION_ERROR:
        return error.message; // Validation messages are usually user-friendly
      case ErrorTypes.SERVER_ERROR:
        return 'Our servers are experiencing issues. Please try again later.';
      default:
        return error.message || 'Something went wrong. Please try again.';
    }
  }

  // Report error to external service (implement as needed)
  static reportError(error, context = {}) {
    // Example: Send to error tracking service
    // Sentry.captureException(error, { extra: context });
    
    // Or send to your own logging endpoint
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ error, context })
    // });
  }
}

// Retry utility for failed operations
export class RetryHandler {
  static async retry(operation, options = {}) {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = 2,
      shouldRetry = ErrorHandler.isRetryable
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = ErrorHandler.handle(error);
        
        if (attempt === maxAttempts || !shouldRetry(lastError)) {
          throw lastError;
        }

        // Wait before retrying
        await new Promise(resolve => 
          setTimeout(resolve, delay * Math.pow(backoff, attempt - 1))
        );
      }
    }

    throw lastError;
  }
}

// Form validation error handler
export function handleFormErrors(error, setError) {
  const processedError = ErrorHandler.handle(error);
  
  if (processedError.type === ErrorTypes.VALIDATION_ERROR && processedError.details) {
    // Handle field-specific validation errors
    if (processedError.details.fields) {
      Object.entries(processedError.details.fields).forEach(([field, message]) => {
        setError(field, { type: 'server', message });
      });
      return;
    }
  }

  // Handle general error
  setError('root', { 
    type: 'server', 
    message: ErrorHandler.getUserFriendlyMessage(processedError) 
  });
}

// Global error handler for unhandled promise rejections
export function setupGlobalErrorHandling() {
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      ErrorHandler.handle(event.reason, { type: 'unhandledRejection' });
      event.preventDefault();
    });

    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      ErrorHandler.handle(event.error, { type: 'globalError' });
    });
  }
}