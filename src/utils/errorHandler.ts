export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'AUTHZ_ERROR', 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
  }
}

export function handleError(error: unknown): { message: string; code: string } {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    };
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

export function logError(error: unknown, context?: Record<string, any>): void {
  const errorInfo = handleError(error);

  console.error('Error occurred:', {
    ...errorInfo,
    context,
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined,
  });
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('connection')
    );
  }
  return false;
}

export function getUserFriendlyMessage(error: unknown): string {
  const errorInfo = handleError(error);

  const friendlyMessages: Record<string, string> = {
    AUTH_ERROR: 'Please check your email and password and try again.',
    AUTHZ_ERROR: 'You do not have permission to access this resource.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    NOT_FOUND: 'The requested resource could not be found.',
    RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
    UNKNOWN_ERROR: 'Something went wrong. Please try again later.',
  };

  if (isNetworkError(error)) {
    return 'Network connection issue. Please check your internet and try again.';
  }

  return friendlyMessages[errorInfo.code] || errorInfo.message;
}
