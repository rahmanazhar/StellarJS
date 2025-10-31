/**
 * Logger utility for consistent logging across the framework
 */
export class Logger {
  constructor(private context: string) {}

  info(message: string, ...args: any[]): void {
    console.log(`[${this.context}] INFO:`, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.context}] WARN:`, message, ...args);
  }

  error(message: string, error?: Error | any, ...args: any[]): void {
    console.error(`[${this.context}] ERROR:`, message, error, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${this.context}] DEBUG:`, message, ...args);
    }
  }

  success(message: string, ...args: any[]): void {
    console.log(`[${this.context}] ✓`, message, ...args);
  }
}

/**
 * Create a logger instance for a specific context
 */
export const createLogger = (context: string): Logger => {
  return new Logger(context);
};

/**
 * Format error messages consistently
 */
export const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

/**
 * Async error wrapper for try-catch blocks
 */
export const tryCatch = async <T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<[Error | null, T | null]> => {
  try {
    const result = await fn();
    return [null, result];
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(formatError(error));
    if (errorMessage) {
      errorObj.message = `${errorMessage}: ${errorObj.message}`;
    }
    return [errorObj, null];
  }
};

/**
 * Retry a function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> => {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000, backoffMultiplier = 2 } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(formatError(error));

      if (attempt < maxRetries) {
        await sleep(Math.min(delay, maxDelay));
        delay *= backoffMultiplier;
      }
    }
  }

  throw lastError!;
};

/**
 * Sleep for a specified duration
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Debounce a function
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

/**
 * Throttle a function
 */
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as any;
  }

  if (obj instanceof Object) {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  return obj;
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj: any): boolean => {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === 'string') return obj.trim().length === 0;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * Generate a random string
 */
export const randomString = (length = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a UUID v4
 */
export const uuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
