import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { createLogger } from '../utils/helpers';

const logger = createLogger('Microservices');

/**
 * Describes a registered microservice instance.
 */
export interface ServiceInfo {
  name: string;
  version: string;
  host: string;
  port: number;
  /** Health-check endpoint path. Defaults to /health */
  healthPath?: string;
  metadata?: Record<string, string>;
}

export interface ServiceRegistryOptions {
  /** How often to ping registered services (ms). Default: 30 000 */
  heartbeatInterval?: number;
  /** Consecutive missed heartbeats before marking a service unhealthy. Default: 3 */
  unhealthyThreshold?: number;
}

type RegisteredService = ServiceInfo & { healthy: boolean; lastSeen: number };

/**
 * In-process service registry.
 *
 * Services register themselves, and the registry periodically health-checks
 * each one so callers can avoid routing to unhealthy instances.
 *
 * @example
 * ```ts
 * const registry = initServiceRegistry();
 * registry.register({ name: 'payments', version: '1.0.0', host: 'localhost', port: 4001 });
 * const info = registry.discover('payments');
 * ```
 */
export class ServiceRegistry {
  private services = new Map<string, RegisteredService>();
  private heartbeatTimers = new Map<string, ReturnType<typeof setInterval>>();
  private readonly opts: Required<ServiceRegistryOptions>;

  constructor(options: ServiceRegistryOptions = {}) {
    this.opts = {
      heartbeatInterval: options.heartbeatInterval ?? 30_000,
      unhealthyThreshold: options.unhealthyThreshold ?? 3,
    };
  }

  /** Register a service and start heartbeat monitoring. */
  register(info: ServiceInfo): void {
    this.services.set(info.name, { ...info, healthy: true, lastSeen: Date.now() });
    logger.info(`Service registered: ${info.name} @ ${info.host}:${info.port}`);
    this.startHeartbeat(info.name);
  }

  /** Remove a service from the registry and stop its heartbeat. */
  deregister(name: string): void {
    this.stopHeartbeat(name);
    this.services.delete(name);
    logger.info(`Service deregistered: ${name}`);
  }

  /** Look up a service by name. Returns undefined if not registered. */
  discover(name: string): RegisteredService | undefined {
    const svc = this.services.get(name);
    if (svc && !svc.healthy) {
      logger.warn(`Service "${name}" is registered but currently unhealthy`);
    }
    return svc;
  }

  /** All registered services (healthy and unhealthy). */
  listAll(): RegisteredService[] {
    return Array.from(this.services.values());
  }

  /** Only services that passed their last health check. */
  listHealthy(): RegisteredService[] {
    return this.listAll().filter((s) => s.healthy);
  }

  markHealthy(name: string): void {
    const svc = this.services.get(name);
    if (svc) {
      svc.healthy = true;
      svc.lastSeen = Date.now();
    }
  }

  markUnhealthy(name: string): void {
    const svc = this.services.get(name);
    if (svc) {
      svc.healthy = false;
      logger.warn(`Service "${name}" marked unhealthy`);
    }
  }

  /** Stop all heartbeat timers (call on shutdown). */
  shutdown(): void {
    for (const name of [...this.heartbeatTimers.keys()]) {
      this.stopHeartbeat(name);
    }
  }

  private startHeartbeat(name: string): void {
    this.stopHeartbeat(name);
    let missed = 0;

    const timer = setInterval(async () => {
      const svc = this.services.get(name);
      if (!svc) {
        this.stopHeartbeat(name);
        return;
      }

      const url = `http://${svc.host}:${svc.port}${svc.healthPath ?? '/health'}`;
      try {
        await axios.get(url, { timeout: 5_000 });
        missed = 0;
        this.markHealthy(name);
      } catch {
        missed++;
        if (missed >= this.opts.unhealthyThreshold) {
          this.markUnhealthy(name);
        }
      }
    }, this.opts.heartbeatInterval);

    this.heartbeatTimers.set(name, timer);
  }

  private stopHeartbeat(name: string): void {
    const timer = this.heartbeatTimers.get(name);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(name);
    }
  }
}

// ---------------------------------------------------------------------------

export interface InterServiceClientOptions {
  /** Request timeout in ms. Default: 10 000 */
  timeout?: number;
  /** Number of retry attempts after the first failure. Default: 3 */
  retries?: number;
  /** Base delay between retries in ms (multiplied by attempt number). Default: 500 */
  retryDelay?: number;
}

/**
 * HTTP client for service-to-service communication.
 *
 * Looks up the target service in the registry, then makes the request with
 * automatic retries and exponential back-off.
 *
 * @example
 * ```ts
 * const client = createInterServiceClient();
 * const data = await client.get('payments', '/api/invoices/42');
 * ```
 */
export class InterServiceClient {
  private readonly http: AxiosInstance;
  private readonly opts: Required<InterServiceClientOptions>;

  constructor(private readonly registry: ServiceRegistry, options: InterServiceClientOptions = {}) {
    this.opts = {
      timeout: options.timeout ?? 10_000,
      retries: options.retries ?? 3,
      retryDelay: options.retryDelay ?? 500,
    };
    this.http = axios.create({ timeout: this.opts.timeout });
  }

  async call<T = any>(
    serviceName: string,
    path: string,
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    const svc = this.registry.discover(serviceName);

    if (!svc) {
      throw new Error(`Service "${serviceName}" not found in registry`);
    }
    if (!svc.healthy) {
      throw new Error(`Service "${serviceName}" is currently unhealthy`);
    }

    const url = `http://${svc.host}:${svc.port}${path}`;
    let lastError: Error = new Error('Request failed');

    for (let attempt = 0; attempt <= this.opts.retries; attempt++) {
      try {
        const response = await this.http.request<T>({ ...config, url });
        return response.data;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < this.opts.retries) {
          await this.delay(this.opts.retryDelay * (attempt + 1));
        }
      }
    }

    throw lastError;
  }

  get<T = any>(serviceName: string, path: string, config?: AxiosRequestConfig): Promise<T> {
    return this.call<T>(serviceName, path, { ...config, method: 'GET' });
  }

  post<T = any>(
    serviceName: string,
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.call<T>(serviceName, path, { ...config, method: 'POST', data });
  }

  put<T = any>(
    serviceName: string,
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.call<T>(serviceName, path, { ...config, method: 'PUT', data });
  }

  patch<T = any>(
    serviceName: string,
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.call<T>(serviceName, path, { ...config, method: 'PATCH', data });
  }

  delete<T = any>(serviceName: string, path: string, config?: AxiosRequestConfig): Promise<T> {
    return this.call<T>(serviceName, path, { ...config, method: 'DELETE' });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ---------------------------------------------------------------------------
// Singleton helpers

let globalRegistry: ServiceRegistry | null = null;

/** Initialize (or return the existing) global service registry. */
export const initServiceRegistry = (options?: ServiceRegistryOptions): ServiceRegistry => {
  if (!globalRegistry) {
    globalRegistry = new ServiceRegistry(options);
  }
  return globalRegistry;
};

/** Get the global service registry, creating a default one if needed. */
export const getServiceRegistry = (): ServiceRegistry => {
  if (!globalRegistry) {
    globalRegistry = new ServiceRegistry();
  }
  return globalRegistry;
};

/** Create an inter-service client, optionally using a custom registry. */
export const createInterServiceClient = (
  registry?: ServiceRegistry,
  options?: InterServiceClientOptions
): InterServiceClient => {
  return new InterServiceClient(registry ?? getServiceRegistry(), options);
};
