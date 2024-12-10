import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ServerConfig, ServiceConfig, Route } from '../types';

export class StellarServer {
  private app: Express;
  private services: Map<string, any>;
  private middlewares: ((req: Request, res: Response, next: NextFunction) => void)[];

  constructor(private config: ServerConfig) {
    this.app = express();
    this.services = new Map();
    this.middlewares = [];
    this.setupDefaultMiddleware();
  }

  private setupDefaultMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
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
      const method = route.method.toLowerCase();
      
      if (typeof this.app[method] !== 'function') {
        throw new Error(`Invalid HTTP method: ${route.method}`);
      }

      const handlers = route.middleware 
        ? [...route.middleware, route.handler]
        : [route.handler];

      this.app[method](path, ...handlers);
    });

    this.services.set(name, serviceConfig);
  }

  public async start(): Promise<void> {
    const { port = 3000 } = this.config;

    return new Promise((resolve) => {
      this.app.listen(port, () => {
        console.log(`🚀 StellarJS Server running on port ${port}`);
        resolve();
      });
    });
  }

  public getApp(): Express {
    return this.app;
  }

  public getService(name: string): any {
    return this.services.get(name);
  }

  public async stop(): Promise<void> {
    // Cleanup logic here (close database connections, etc.)
    return Promise.resolve();
  }
}

// Export a factory function to create server instances
export const createServer = (config: ServerConfig): StellarServer => {
  return new StellarServer(config);
};
