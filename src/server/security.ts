import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import hpp from 'hpp';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - xss-clean doesn't have types
import xss from 'xss-clean';
import validator from 'validator';
import { createLogger } from '../utils/helpers';

const logger = createLogger('Security');

/**
 * Security configuration options
 */
export interface SecurityConfig {
  /**
   * Enable Helmet security headers
   * Default: true
   */
  helmet?: boolean | Parameters<typeof helmet>[0];

  /**
   * Enable rate limiting
   * Default: true
   */
  rateLimit?: boolean | RateLimitConfig;

  /**
   * Enable XSS protection
   * Default: true
   */
  xss?: boolean;

  /**
   * Enable NoSQL injection protection
   * Default: true
   */
  noSqlInjection?: boolean;

  /**
   * Enable HTTP Parameter Pollution protection
   * Default: true
   */
  hpp?: boolean | HppConfig;

  /**
   * Enable input sanitization
   * Default: true
   */
  sanitization?: boolean;

  /**
   * Enable CSRF protection
   * Default: false (requires session middleware)
   */
  csrf?: boolean;

  /**
   * Trusted proxies (for rate limiting behind reverse proxy)
   */
  trustProxy?: boolean | number;

  /**
   * API key validation
   */
  apiKey?: ApiKeyConfig;
}

export interface RateLimitConfig {
  /**
   * Time window in milliseconds
   * Default: 15 * 60 * 1000 (15 minutes)
   */
  windowMs?: number;

  /**
   * Maximum requests per window
   * Default: 100
   */
  max?: number;

  /**
   * Message when rate limit exceeded
   */
  message?: string;

  /**
   * Skip successful requests
   * Default: false
   */
  skipSuccessfulRequests?: boolean;

  /**
   * Skip failed requests
   * Default: false
   */
  skipFailedRequests?: boolean;

  /**
   * Custom key generator
   */
  keyGenerator?: (req: Request) => string;

  /**
   * Custom handler for rate limit exceeded
   */
  handler?: (req: Request, res: Response) => void;
}

export interface HppConfig {
  /**
   * Whitelist of parameters that are allowed to be arrays
   */
  whitelist?: string[];

  /**
   * Check only body
   */
  checkBody?: boolean;

  /**
   * Check only query
   */
  checkQuery?: boolean;
}

export interface ApiKeyConfig {
  /**
   * Header name for API key
   * Default: 'X-API-Key'
   */
  header?: string;

  /**
   * Query parameter name for API key
   * Default: 'api_key'
   */
  queryParam?: string;

  /**
   * Validation function
   */
  validate: (key: string) => boolean | Promise<boolean>;

  /**
   * Optional: List of valid API keys for simple validation
   */
  keys?: string[];

  /**
   * Exclude certain paths from API key validation
   */
  excludePaths?: string[] | RegExp[];
}

/**
 * Default security configuration
 */
const defaultSecurityConfig: Required<Omit<SecurityConfig, 'apiKey'>> = {
  helmet: true,
  rateLimit: true,
  xss: true,
  noSqlInjection: true,
  hpp: true,
  sanitization: true,
  csrf: false,
  trustProxy: false,
};

/**
 * Create comprehensive security middleware stack
 */
export const createSecurityMiddleware = (config: SecurityConfig = {}) => {
  const securityConfig = { ...defaultSecurityConfig, ...config };
  const middlewares: any[] = [];

  // Helmet - Security headers
  if (securityConfig.helmet) {
    const helmetOptions =
      typeof securityConfig.helmet === 'object'
        ? securityConfig.helmet
        : {
            contentSecurityPolicy: {
              directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
              },
            },
            hsts: {
              maxAge: 31536000,
              includeSubDomains: true,
              preload: true,
            },
          };
    middlewares.push(helmet(helmetOptions));
    logger.info('Helmet security headers enabled');
  }

  // XSS Protection
  if (securityConfig.xss) {
    middlewares.push(xss());
    logger.info('XSS protection enabled');
  }

  // NoSQL Injection Protection
  if (securityConfig.noSqlInjection) {
    middlewares.push(
      mongoSanitize({
        replaceWith: '_',
        onSanitize: ({ req, key }: { req: Request; key: string }) => {
          logger.warn(`NoSQL injection attempt detected: ${key} in request from ${req.ip}`);
        },
      })
    );
    logger.info('NoSQL injection protection enabled');
  }

  // HTTP Parameter Pollution Protection
  if (securityConfig.hpp) {
    const hppOptions = typeof securityConfig.hpp === 'object' ? securityConfig.hpp : {};
    middlewares.push(hpp(hppOptions));
    logger.info('HPP protection enabled');
  }

  // Rate Limiting
  if (securityConfig.rateLimit) {
    const rateLimitConfig: RateLimitConfig =
      typeof securityConfig.rateLimit === 'object' ? securityConfig.rateLimit : {};

    const rateLimiter = createRateLimiter(rateLimitConfig);
    middlewares.push(rateLimiter);
    logger.info('Rate limiting enabled');
  }

  // Input Sanitization
  if (securityConfig.sanitization) {
    middlewares.push(sanitizeInputs);
    logger.info('Input sanitization enabled');
  }

  return middlewares;
};

/**
 * Create rate limiter with custom configuration
 */
export const createRateLimiter = (config: RateLimitConfig = {}): RateLimitRequestHandler => {
  const defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req: Request) => req.ip || 'unknown',
  };

  const mergedConfig = { ...defaultConfig, ...config };

  return rateLimit({
    windowMs: mergedConfig.windowMs!,
    max: mergedConfig.max!,
    message: { error: { message: mergedConfig.message } },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: mergedConfig.skipSuccessfulRequests,
    skipFailedRequests: mergedConfig.skipFailedRequests,
    keyGenerator: mergedConfig.keyGenerator,
    handler:
      mergedConfig.handler ||
      ((req: Request, res: Response) => {
        logger.warn(`Rate limit exceeded for ${req.ip}`);
        res.status(429).json({
          error: {
            message: mergedConfig.message,
            retryAfter: res.getHeader('Retry-After'),
          },
        });
      }),
  });
};

/**
 * Input sanitization middleware
 */
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Recursively sanitize an object
 */
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const sanitizedKey = sanitizeString(key);
        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  return obj;
};

/**
 * Sanitize a string value
 */
const sanitizeString = (str: string): string => {
  if (!str) return str;

  // Remove null bytes
  str = str.replace(/\0/g, '');

  // Escape HTML entities (basic)
  str = validator.escape(str);

  // Trim whitespace
  str = validator.trim(str);

  return str;
};

/**
 * API Key validation middleware factory
 */
export const createApiKeyMiddleware = (config: ApiKeyConfig) => {
  const header = config.header || 'X-API-Key';
  const queryParam = config.queryParam || 'api_key';

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Check if path is excluded
    if (config.excludePaths) {
      const isExcluded = config.excludePaths.some((path) => {
        if (typeof path === 'string') {
          return req.path === path;
        }
        return path.test(req.path);
      });

      if (isExcluded) {
        next();
        return;
      }
    }

    // Get API key from header or query
    const apiKey =
      (req.headers[header.toLowerCase()] as string) || (req.query[queryParam] as string);

    if (!apiKey) {
      logger.warn(`Missing API key in request to ${req.path} from ${req.ip}`);
      res.status(401).json({
        error: {
          message: 'API key is required',
          code: 'MISSING_API_KEY',
        },
      });
      return;
    }

    try {
      let isValid = false;

      // Use simple key validation if keys array provided
      if (config.keys && config.keys.length > 0) {
        isValid = config.keys.includes(apiKey);
      } else {
        // Use custom validation function
        const result = config.validate(apiKey);
        isValid = result instanceof Promise ? await result : result;
      }

      if (!isValid) {
        logger.warn(`Invalid API key attempt from ${req.ip}`);
        res.status(403).json({
          error: {
            message: 'Invalid API key',
            code: 'INVALID_API_KEY',
          },
        });
        return;
      }

      // Store validated API key info in request
      (req as any).apiKey = apiKey;
      next();
    } catch (error) {
      logger.error('API key validation error:', error);
      res.status(500).json({
        error: {
          message: 'API key validation failed',
        },
      });
    }
  };
};

/**
 * Content-Type validation middleware
 */
export const validateContentType = (allowedTypes: string[] = ['application/json']) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip for GET and HEAD requests
    if (req.method === 'GET' || req.method === 'HEAD') {
      next();
      return;
    }

    const contentType = req.headers['content-type'];

    if (!contentType) {
      res.status(400).json({
        error: {
          message: 'Content-Type header is required',
        },
      });
      return;
    }

    const isAllowed = allowedTypes.some((type) => contentType.includes(type));

    if (!isAllowed) {
      res.status(415).json({
        error: {
          message: `Unsupported Content-Type. Allowed types: ${allowedTypes.join(', ')}`,
          provided: contentType,
        },
      });
      return;
    }

    next();
  };
};

/**
 * IP whitelist middleware
 */
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (!clientIP || !allowedIPs.includes(clientIP)) {
      logger.warn(`Blocked request from non-whitelisted IP: ${clientIP}`);
      res.status(403).json({
        error: {
          message: 'Access denied',
        },
      });
      return;
    }

    next();
  };
};

/**
 * IP blacklist middleware
 */
export const ipBlacklist = (blockedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (clientIP && blockedIPs.includes(clientIP)) {
      logger.warn(`Blocked request from blacklisted IP: ${clientIP}`);
      res.status(403).json({
        error: {
          message: 'Access denied',
        },
      });
      return;
    }

    next();
  };
};

/**
 * Request size limiter
 */
export const limitRequestSize = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.headers['content-length'];

    if (contentLength && parseInt(contentLength, 10) > maxSize) {
      logger.warn(`Request size ${contentLength} exceeds limit ${maxSize} from ${req.ip}`);
      res.status(413).json({
        error: {
          message: 'Request entity too large',
          maxSize,
          provided: parseInt(contentLength, 10),
        },
      });
      return;
    }

    next();
  };
};

/**
 * Pre-configured security profiles
 */
export const securityProfiles = {
  /**
   * Maximum security (recommended for production)
   */
  maximum: (): any[] =>
    createSecurityMiddleware({
      helmet: true,
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 100,
      },
      xss: true,
      noSqlInjection: true,
      hpp: true,
      sanitization: true,
    }),

  /**
   * Balanced security (good default)
   */
  balanced: (): any[] =>
    createSecurityMiddleware({
      helmet: true,
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 200,
      },
      xss: true,
      noSqlInjection: true,
      hpp: true,
      sanitization: true,
    }),

  /**
   * Development mode (minimal security for easier debugging)
   */
  development: (): any[] =>
    createSecurityMiddleware({
      helmet: false,
      rateLimit: false,
      xss: true,
      noSqlInjection: true,
      hpp: false,
      sanitization: true,
    }),

  /**
   * API-specific security
   */
  api: (): any[] =>
    createSecurityMiddleware({
      helmet: {
        contentSecurityPolicy: false, // APIs don't need CSP
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 100,
      },
      xss: true,
      noSqlInjection: true,
      hpp: true,
      sanitization: true,
    }),
};

export { helmet, rateLimit, mongoSanitize, hpp, xss };
