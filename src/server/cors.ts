import { Request, Response, NextFunction } from 'express';
import { CorsOptions as ExpressCorsOptions } from 'cors';

export interface CorsOptions {
  /**
   * List of allowed origins. Can be:
   * - '*' for all origins (not recommended in production)
   * - Array of specific origins ['https://example.com', 'https://app.example.com']
   * - Function for dynamic origin validation
   */
  origins?: string[] | '*' | ((origin: string) => boolean | Promise<boolean>);

  /**
   * Allow credentials (cookies, authorization headers)
   * Default: true
   */
  credentials?: boolean;

  /**
   * Allowed HTTP methods
   * Default: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
   */
  methods?: string[];

  /**
   * Allowed headers
   * Default: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
   */
  allowedHeaders?: string[];

  /**
   * Headers exposed to the client
   * Default: ['X-Request-ID', 'X-Response-Time', 'X-RateLimit-Limit', 'X-RateLimit-Remaining']
   */
  exposedHeaders?: string[];

  /**
   * Max age for preflight cache (in seconds)
   * Default: 86400 (24 hours)
   */
  maxAge?: number;

  /**
   * Enable pre-flight across all routes
   * Default: true
   */
  preflightContinue?: boolean;
}

const defaultCorsOptions: Required<CorsOptions> = {
  origins: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-Response-Time',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-API-Version',
  ],
  maxAge: 86400,
  preflightContinue: false,
};

/**
 * Create CORS middleware with enhanced configuration
 */
export const createCorsMiddleware = (options: CorsOptions = {}): any => {
  const config = { ...defaultCorsOptions, ...options };

  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;
    const requestMethod = req.method.toUpperCase();

    // Determine if origin is allowed
    const checkOrigin = async (): Promise<boolean> => {
      if (config.origins === '*') {
        return true;
      } else if (typeof config.origins === 'function') {
        if (!origin) return false;
        const result = config.origins(origin);
        return result instanceof Promise ? await result : result;
      } else if (Array.isArray(config.origins)) {
        return origin ? config.origins.includes(origin) : false;
      }
      return false;
    };

    // Handle async origin checking
    checkOrigin()
      .then((isOriginAllowed) => {
        processCorsRequest(isOriginAllowed);
      })
      .catch(() => {
        processCorsRequest(false);
      });

    const processCorsRequest = (isOriginAllowed: boolean): void => {
      // Set CORS headers
      if (isOriginAllowed) {
        if (config.origins === '*') {
          res.setHeader('Access-Control-Allow-Origin', '*');
        } else if (origin) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Vary', 'Origin');
        }

        if (config.credentials) {
          res.setHeader('Access-Control-Allow-Credentials', 'true');
        }

        res.setHeader('Access-Control-Allow-Methods', config.methods.join(', '));
        res.setHeader('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
        res.setHeader('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
        res.setHeader('Access-Control-Max-Age', config.maxAge.toString());
      }

      // Handle preflight requests
      if (requestMethod === 'OPTIONS') {
        if (isOriginAllowed) {
          res.status(204).end();
        } else {
          res.status(403).json({
            error: {
              message: 'CORS policy: Origin not allowed',
              origin: origin || 'unknown',
            },
          });
        }
        return;
      }

      // Reject non-allowed origins for actual requests
      if (!isOriginAllowed && origin) {
        res.status(403).json({
          error: {
            message: 'CORS policy: Origin not allowed',
            origin,
          },
        });
        return;
      }

      next();
    };
  };
};

/**
 * Pre-configured CORS for development (allows all origins)
 */
export const developmentCors = createCorsMiddleware({
  origins: '*',
  credentials: true,
});

/**
 * Pre-configured CORS for production (whitelist-based)
 */
export const productionCors = (allowedOrigins: string[]) =>
  createCorsMiddleware({
    origins: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    maxAge: 7200, // 2 hours for production
  });

/**
 * Create dynamic CORS handler based on environment
 */
export const createDynamicCors = (
  productionOrigins: string[],
  developmentOrigins: string[] | '*' = '*'
) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return createCorsMiddleware({
    origins: isDevelopment ? developmentOrigins : productionOrigins,
    credentials: true,
  });
};

/**
 * Create CORS with origin validation function
 */
export const createValidatedCors = (validator: (origin: string) => boolean | Promise<boolean>) => {
  return createCorsMiddleware({
    origins: validator,
    credentials: true,
  });
};

/**
 * Common CORS configurations for popular scenarios
 */
export const corsPresets = {
  /**
   * Allow all origins (use only for public APIs)
   */
  public: createCorsMiddleware({
    origins: '*',
    credentials: false,
  }),

  /**
   * Development mode with full access
   */
  development: developmentCors,

  /**
   * Strict production with single origin
   */
  singleOrigin: (origin: string) =>
    createCorsMiddleware({
      origins: [origin],
      credentials: true,
    }),

  /**
   * Mobile app backend (no credentials)
   */
  mobileBackend: createCorsMiddleware({
    origins: '*',
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),

  /**
   * Microservices (internal only)
   */
  internal: createCorsMiddleware({
    origins: (origin: string) => {
      // Allow requests with no origin (server-to-server)
      if (!origin) return true;
      // Allow internal network origins
      return (
        origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('.local')
      );
    },
    credentials: true,
  }),
};

/**
 * Convert to express-cors compatible options
 */
export const toExpressCorsOptions = (options: CorsOptions): ExpressCorsOptions => {
  const config = { ...defaultCorsOptions, ...options };

  return {
    origin: (origin, callback) => {
      if (config.origins === '*') {
        callback(null, true);
        return;
      }

      if (typeof config.origins === 'function') {
        const result = config.origins(origin || '');
        if (result instanceof Promise) {
          result.then((allowed) => callback(null, allowed)).catch(() => callback(null, false));
        } else {
          callback(null, result);
        }
        return;
      }

      if (Array.isArray(config.origins)) {
        const allowed = !origin || config.origins.includes(origin);
        callback(null, allowed);
        return;
      }

      callback(null, false);
    },
    credentials: config.credentials,
    methods: config.methods,
    allowedHeaders: config.allowedHeaders,
    exposedHeaders: config.exposedHeaders,
    maxAge: config.maxAge,
    preflightContinue: config.preflightContinue,
  };
};
