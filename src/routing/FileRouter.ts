import * as fs from 'fs';
import * as path from 'path';
import { Express, Request, Response } from 'express';
import { SSREngine, PageModule, PageProps } from '../ssr/StellarSSR';
import { createLogger } from '../utils/helpers';

const logger = createLogger('FileRouter');

export interface FileRouteEntry {
  filePath: string;
  routePath: string;
  params: string[];
}

export interface FileRouterOptions {
  /** Directory to scan for pages (default: 'pages') */
  pagesDir?: string;
  /** File extensions to include (default: ['.ts', '.tsx', '.js', '.jsx']) */
  extensions?: string[];
  /** SSR engine instance */
  ssrEngine?: SSREngine;
}

export class FileRouter {
  private routes: FileRouteEntry[] = [];
  private pagesDir: string;
  private extensions: string[];
  private ssrEngine: SSREngine;

  constructor(options: FileRouterOptions = {}) {
    this.pagesDir = path.resolve(options.pagesDir || 'pages');
    this.extensions = options.extensions || ['.ts', '.tsx', '.js', '.jsx'];
    this.ssrEngine = options.ssrEngine || new SSREngine();
  }

  /** Scan pages directory and discover all routes */
  scan(): FileRouteEntry[] {
    if (!fs.existsSync(this.pagesDir)) {
      logger.warn(`Pages directory not found: ${this.pagesDir}`);
      return [];
    }

    this.routes = [];
    this.scanDir(this.pagesDir, '');
    logger.info(`Discovered ${this.routes.length} file-based routes`);
    return this.routes;
  }

  private scanDir(dir: string, routePrefix: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Handle nested directories
        const segmentName = entry.name;
        this.scanDir(fullPath, `${routePrefix}/${segmentName}`);
        continue;
      }

      const ext = path.extname(entry.name);
      if (!this.extensions.includes(ext)) continue;

      const baseName = path.basename(entry.name, ext);

      // Skip API routes - they are handled separately
      if (routePrefix.startsWith('/api')) continue;

      let routePath: string;
      const params: string[] = [];

      if (baseName === 'index') {
        routePath = routePrefix || '/';
      } else if (baseName.startsWith('[') && baseName.endsWith(']')) {
        // Dynamic route: [id].tsx → /:id
        const paramName = baseName.slice(1, -1);
        params.push(paramName);
        routePath = `${routePrefix}/:${paramName}`;
      } else if (baseName.startsWith('...') || baseName === '[...all]') {
        // Catch-all route
        routePath = `${routePrefix}/*`;
      } else {
        routePath = `${routePrefix}/${baseName}`;
      }

      this.routes.push({ filePath: fullPath, routePath, params });
    }
  }

  /** Mount all discovered routes onto an Express app */
  mount(app: Express): void {
    const routes = this.scan();

    for (const route of routes) {
      app.get(route.routePath, async (req: Request, res: Response) => {
        try {
          // Dynamic require of the page module at runtime
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const pageModule: PageModule = require(route.filePath);

          const context: PageProps = {
            params: req.params as Record<string, string>,
            query: req.query as Record<string, string | string[]>,
            req,
          };

          await this.ssrEngine.renderPage(pageModule, context, req, res);
        } catch (error: unknown) {
          logger.error(`Error rendering page ${route.filePath}:`, error);
          res.status(500).send('<h1>500 - Internal Server Error</h1>');
        }
      });

      logger.info(`  GET ${route.routePath} → ${path.relative(this.pagesDir, route.filePath)}`);
    }
  }

  /** Convert a file path to an Express route path */
  static filePathToRoute(filePath: string, pagesDir: string): string {
    const relative = path.relative(pagesDir, filePath);
    const withoutExt = relative.replace(/\.(ts|tsx|js|jsx)$/, '');
    const parts = withoutExt.split(path.sep);

    return (
      '/' +
      parts
        .map((part) => {
          if (part === 'index') return '';
          if (part.startsWith('[') && part.endsWith(']')) {
            return `:${part.slice(1, -1)}`;
          }
          return part;
        })
        .filter(Boolean)
        .join('/')
    );
  }

  getRoutes(): FileRouteEntry[] {
    return this.routes;
  }
}

let globalFileRouter: FileRouter | null = null;

export const initFileRouter = (app: Express, options?: FileRouterOptions): FileRouter => {
  globalFileRouter = new FileRouter(options);
  globalFileRouter.mount(app);
  return globalFileRouter;
};

export const getFileRouter = (): FileRouter | null => globalFileRouter;
