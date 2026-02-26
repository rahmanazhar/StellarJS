import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/helpers';

const logger = createLogger('MultiTenancy');

export type TenantStrategy = 'subdomain' | 'header' | 'path' | 'jwt-claim' | 'custom';
export type TenantIsolation = 'database' | 'schema' | 'row-level';

export interface TenantConfig {
  strategy: TenantStrategy;
  /** Custom resolver returning the tenant identifier */
  resolver?: (req: Request) => string | null | Promise<string | null>;
  /** Header name for 'header' strategy (default: 'X-Tenant-ID') */
  headerName?: string;
  /** Path segment index for 'path' strategy (default: 1, e.g. /tenant-id/...) */
  pathSegment?: number;
  /** JWT claim name for 'jwt-claim' strategy (default: 'tenantId') */
  jwtClaim?: string;
  /** Database isolation strategy */
  isolation?: TenantIsolation;
  /** Return 400 if tenant cannot be resolved (default: true) */
  required?: boolean;
  /** Bypass paths that don't require tenant context */
  bypassPaths?: string[];
}

export interface TenantContext {
  id: string;
  metadata?: Record<string, unknown>;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

async function resolveTenant(req: Request, config: TenantConfig): Promise<string | null> {
  if (config.resolver) {
    return config.resolver(req);
  }

  switch (config.strategy) {
    case 'subdomain': {
      const host = req.hostname || '';
      const parts = host.split('.');
      return parts.length >= 3 ? parts[0] : null;
    }

    case 'header': {
      const headerName = config.headerName || 'X-Tenant-ID';
      const value = req.headers[headerName.toLowerCase()];
      return typeof value === 'string' ? value : null;
    }

    case 'path': {
      const segment = config.pathSegment ?? 1;
      const parts = req.path.split('/').filter(Boolean);
      return parts[segment - 1] || null;
    }

    case 'jwt-claim': {
      const user = (req as Request & { user?: Record<string, unknown> }).user;
      const claim = config.jwtClaim || 'tenantId';
      const value = user?.[claim];
      return typeof value === 'string' ? value : null;
    }

    default:
      return null;
  }
}

export const tenantMiddleware = (config: TenantConfig) => {
  const bypassPaths = config.bypassPaths || ['/health', '/api/docs'];
  const required = config.required !== false;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip bypass paths
    if (bypassPaths.some((p) => req.path.startsWith(p))) {
      return next();
    }

    try {
      const tenantId = await resolveTenant(req, config);

      if (!tenantId) {
        if (required) {
          res.status(400).json({
            error: {
              message: `Tenant could not be resolved using strategy: ${config.strategy}`,
              code: 'TENANT_REQUIRED',
            },
          });
          return;
        }
        return next();
      }

      req.tenant = { id: tenantId };
      logger.info(`Request tenant: ${tenantId}`);
      next();
    } catch (error) {
      logger.error('Tenant resolution failed:', error);
      res.status(500).json({ error: { message: 'Tenant resolution failed' } });
    }
  };
};

/** Scopes a MongoDB query to the current tenant */
export const tenantScope = (
  req: Request,
  additionalFilter: Record<string, unknown> = {}
): Record<string, unknown> => {
  if (!req.tenant?.id) return additionalFilter;
  return { tenantId: req.tenant.id, ...additionalFilter };
};

/** Get tenant ID from request, throws if not found */
export const getTenantId = (req: Request): string => {
  if (!req.tenant?.id) {
    throw new Error('No tenant context found on request. Is tenantMiddleware configured?');
  }
  return req.tenant.id;
};
