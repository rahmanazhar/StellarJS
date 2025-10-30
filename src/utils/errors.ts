/**
 * Custom error classes for StellarJS
 */

export class StellarError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends StellarError {
  public errors: any[];

  constructor(message: string = 'Validation failed', errors: any[] = []) {
    super(message, 400);
    this.errors = errors;
  }
}

export class AuthenticationError extends StellarError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends StellarError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends StellarError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends StellarError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export class RateLimitError extends StellarError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

export class ServiceUnavailableError extends StellarError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503);
  }
}

/**
 * Check if error is operational (expected)
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof StellarError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: Error) {
  if (error instanceof ValidationError) {
    return {
      error: {
        message: error.message,
        details: error.errors,
        statusCode: error.statusCode
      }
    };
  }

  if (error instanceof StellarError) {
    return {
      error: {
        message: error.message,
        statusCode: error.statusCode
      }
    };
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production') {
    return {
      error: {
        message: 'Internal server error',
        statusCode: 500
      }
    };
  }

  return {
    error: {
      message: error.message,
      statusCode: 500,
      stack: error.stack
    }
  };
}
