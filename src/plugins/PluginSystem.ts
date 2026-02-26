import { Express, Request, Response, NextFunction } from 'express';
import { EventBus } from '../events/EventBus';

export interface PluginContext {
  /** Add a named extension accessible via getPlugin() */
  extend: (name: string, value: unknown) => void;
  /** Retrieve a previously registered extension */
  get: (name: string) => unknown;
  /** Subscribe to a framework event */
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  /** Emit a framework event */
  emit: (event: string, ...args: unknown[]) => void;
  /** Register an Express middleware globally */
  addMiddleware: (mw: (req: Request, res: Response, next: NextFunction) => void) => void;
  /** Register an Express route */
  addRoute: (
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    handler: (req: Request, res: Response) => void
  ) => void;
}

export interface StellarPlugin {
  name: string;
  version?: string;
  setup: (ctx: PluginContext, options?: unknown) => void | Promise<void>;
}

export type PluginFactory<TOptions = unknown> = (options?: TOptions) => PluginEntry;

export interface PluginEntry {
  plugin: StellarPlugin;
  options?: unknown;
}

/** Define a reusable plugin */
export const definePlugin = <TOptions = unknown>(
  plugin: StellarPlugin
): PluginFactory<TOptions> => {
  return (options?: TOptions): PluginEntry => ({ plugin, options });
};

export class PluginRegistry {
  private plugins = new Map<string, PluginEntry>();
  private extensions = new Map<string, unknown>();
  private middlewares: Array<(req: Request, res: Response, next: NextFunction) => void> = [];
  private routes: Array<{
    method: string;
    path: string;
    handler: (req: Request, res: Response) => void;
  }> = [];
  private eventBus: EventBus;
  private app: Express | null = null;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  private mountRoute(
    app: Express,
    method: string,
    routePath: string,
    handler: (req: Request, res: Response) => void
  ): void {
    const methodMap: Record<
      string,
      ((path: string, handler: (req: Request, res: Response) => void) => void) | undefined
    > = {
      get: (p, h) => app.get(p, h),
      post: (p, h) => app.post(p, h),
      put: (p, h) => app.put(p, h),
      patch: (p, h) => app.patch(p, h),
      delete: (p, h) => app.delete(p, h),
    };
    methodMap[method]?.(routePath, handler);
  }

  attachApp(app: Express): void {
    this.app = app;
    // Mount any routes registered before app was attached
    this.routes.forEach((r) => {
      this.mountRoute(app, r.method, r.path, r.handler);
    });
    this.middlewares.forEach((mw) => app.use(mw));
  }

  async register(entry: PluginEntry): Promise<void> {
    const { plugin, options } = entry;
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already registered`);
    }

    const ctx: PluginContext = {
      extend: (name, value) => this.extensions.set(name, value),
      get: (name) => this.extensions.get(name),
      on: (event, handler) => this.eventBus.on(event, handler),
      emit: (event, ...args) => this.eventBus.emit(event, ...args),
      addMiddleware: (mw) => {
        this.middlewares.push(mw);
        if (this.app) this.app.use(mw);
      },
      addRoute: (method, path, handler) => {
        this.routes.push({ method, path, handler });
        if (this.app) this.mountRoute(this.app, method, path, handler);
      },
    };

    await plugin.setup(ctx, options);
    this.plugins.set(plugin.name, entry);
  }

  get(name: string): unknown {
    return this.extensions.get(name);
  }

  list(): string[] {
    return Array.from(this.plugins.keys());
  }

  getPluginInfo(): Array<{ name: string; version?: string }> {
    return Array.from(this.plugins.values()).map(({ plugin }) => ({
      name: plugin.name,
      version: plugin.version,
    }));
  }
}

let globalRegistry: PluginRegistry | null = null;

export const initPluginRegistry = (): PluginRegistry => {
  globalRegistry = new PluginRegistry();
  return globalRegistry;
};

export const getPluginRegistry = (): PluginRegistry => {
  if (!globalRegistry) globalRegistry = new PluginRegistry();
  return globalRegistry;
};
