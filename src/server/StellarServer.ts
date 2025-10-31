import express, { Express, Request, Response, NextFunction } from 'express';
import { ServerConfig, ServiceConfig, Route } from '../types';
import { createCorsMiddleware, developmentCors } from './cors';
import { createSecurityMiddleware, securityProfiles } from './security';
import { requestLogger, errorHandler, requestId } from './middleware';
import { initializeAuditLogger, auditMiddleware } from './audit';
import { createLogger } from '../utils/helpers';

const logger = createLogger('StellarServer');

export class StellarServer {
  private app: Express;
  private services: Map<string, any>;
  private middlewares: ((req: Request, res: Response, next: NextFunction) => void)[];
  private server: any;

  constructor(private config: ServerConfig) {
    this.app = express();
    this.services = new Map();
    this.middlewares = [];
    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    // Trust proxy if configured (important for rate limiting behind reverse proxy)
    if (this.config.trustProxy) {
      this.app.set('trust proxy', this.config.trustProxy);
    }

    // Request ID for tracking
    this.app.use(requestId);

    // CORS configuration
    const corsMiddleware = this.config.cors
      ? createCorsMiddleware(this.config.cors)
      : developmentCors;
    this.app.use(corsMiddleware);

    // Security middleware stack
    const environment = process.env.NODE_ENV || 'development';
    const securityMiddlewares = this.config.security
      ? createSecurityMiddleware(this.config.security as any)
      : environment === 'production'
      ? securityProfiles.maximum()
      : securityProfiles.development();

    securityMiddlewares.forEach((middleware) => this.app.use(middleware));
    logger.info('Security middleware enabled');

    // Body parsing with size limits
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);

    // Audit logging
    if (this.config.audit?.enabled !== false) {
      initializeAuditLogger(undefined, true);
      this.app.use(auditMiddleware(this.config.audit || {}));
      logger.info('Audit logging enabled');
    }
  }

  public use(middleware: (req: Request, res: Response, next: NextFunction) => void): void {
    this.middlewares.push(middleware);
    this.app.use(middleware);
  }

  public registerService(serviceConfig: ServiceConfig): void {
    const { name, routes } = serviceConfig;

    if (this.services.has(name)) {
      throw new Error(`Service with name ${name} is already registered`);
    }

    // Register all routes for the service
    routes.forEach((route: Route) => {
      const path = `/api/${name}${route.path}`;
      const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';

      if (typeof this.app[method] !== 'function') {
        throw new Error(`Invalid HTTP method: ${route.method}`);
      }

      const handlers = route.middleware ? [...route.middleware, route.handler] : [route.handler];

      this.app[method](path, ...handlers);
    });

    this.services.set(name, serviceConfig);
  }

  public async start(): Promise<void> {
    const { port = 3000 } = this.config;

    // Add error handler last
    this.app.use(errorHandler);

    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(port, () => {
          logger.info(`🚀 StellarJS Server running on port ${port}`);
          logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
          logger.info(`Security: Enabled`);
          logger.info(`CORS: Configured`);
          resolve();
        });

        this.server.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            logger.error(`Port ${port} is already in use`);
          } else {
            logger.error('Server error:', error);
          }
          reject(error);
        });
      } catch (error) {
        logger.error('Failed to start server:', error);
        reject(error);
      }
    });
  }

  public getApp(): Express {
    return this.app;
  }

  public getService(name: string): any {
    return this.services.get(name);
  }

  public async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve, reject) => {
        this.server.close((err: any) => {
          if (err) {
            logger.error('Error stopping server:', err);
            reject(err);
          } else {
            logger.info('Server stopped successfully');
            resolve();
          }
        });
      });
    }
    return Promise.resolve();
  }

  /**
   * Get server health status
   */
  public getHealth(): {
    status: 'healthy' | 'unhealthy';
    uptime: number;
    services: number;
  } {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      services: this.services.size,
    };
  }
}

// Export a factory function to create server instances
export const createServer = (config: ServerConfig): StellarServer => {
  return new StellarServer(config);
};
