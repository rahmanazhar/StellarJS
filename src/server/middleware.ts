import { Request, Response, NextFunction } from 'express';
import { createLogger, formatError } from '../utils/helpers';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';

const logger = createLogger('Middleware');

/**
 * Error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Request error:', err);

  const statusCode = (err as any).statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = formatError(err);

  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

/**
 * Not found middleware
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: {
      message: ERROR_MESSAGES.NOT_FOUND,
      path: req.originalUrl
    }
  });
};

/**
 * Validate request body middleware factory
 */
export const validateBody = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: {
          message: ERROR_MESSAGES.VALIDATION_ERROR,
          missingFields
        }
      });
      return;
    }

    next();
  };
};

/**
 * Rate limiting middleware factory
 */
export const rateLimit = (options: {
  windowMs: number;
  maxRequests: number;
}) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip || 'unknown';
    const now = Date.now();
    const record = requests.get(identifier);

    if (!record || now > record.resetTime) {
      requests.set(identifier, {
        count: 1,
        resetTime: now + options.windowMs
      });
      next();
      return;
    }

    if (record.count >= options.maxRequests) {
      res.status(429).json({
        error: {
          message: 'Too many requests, please try again later'
        }
      });
      return;
    }

    record.count++;
    next();
  };
};

/**
 * CORS configuration middleware
 */
export const configureCors = (allowedOrigins: string[] = ['*']) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;

    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  };
};

/**
 * Request timeout middleware
 */
export const timeout = (ms: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
          error: {
            message: 'Request timeout'
          }
        });
      }
    }, ms);

    res.on('finish', () => clearTimeout(timer));
    next();
  };
};

/**
 * API versioning middleware factory
 */
export const apiVersion = (version: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    (req as any).apiVersion = version;
    res.setHeader('X-API-Version', version);
    next();
  };
};

/**
 * Request ID middleware
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const id = req.headers['x-request-id'] as string || 
    Math.random().toString(36).substring(2, 15);
  (req as any).id = id;
  res.setHeader('X-Request-ID', id);
  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
};

/**
 * Async handler wrapper to catch errors in async routes
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Response formatting middleware
 */
export const formatResponse = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json.bind(res);

  res.json = function (data: any): Response {
    if (data && typeof data === 'object' && !data.error) {
      return originalJson({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    }
    return originalJson(data);
  };

  next();
};
