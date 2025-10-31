import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/helpers';

const logger = createLogger('AuditLog');

/**
 * Audit event types
 */
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILURE = 'auth.login.failure',
  LOGOUT = 'auth.logout',
  TOKEN_REFRESH = 'auth.token.refresh',
  PASSWORD_CHANGE = 'auth.password.change',
  PASSWORD_RESET = 'auth.password.reset',

  // Authorization events
  ACCESS_DENIED = 'authz.access.denied',
  PERMISSION_GRANTED = 'authz.permission.granted',

  // User management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_ROLE_CHANGED = 'user.role.changed',

  // Data access
  DATA_READ = 'data.read',
  DATA_CREATED = 'data.created',
  DATA_UPDATED = 'data.updated',
  DATA_DELETED = 'data.deleted',

  // Security events
  RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  INVALID_TOKEN = 'security.token.invalid',
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  IP_BLOCKED = 'security.ip.blocked',
  CORS_VIOLATION = 'security.cors.violation',

  // System events
  CONFIG_CHANGED = 'system.config.changed',
  SERVICE_STARTED = 'system.service.started',
  SERVICE_STOPPED = 'system.service.stopped',
  ERROR_OCCURRED = 'system.error.occurred',

  // API events
  API_KEY_CREATED = 'api.key.created',
  API_KEY_REVOKED = 'api.key.revoked',
  API_KEY_INVALID = 'api.key.invalid',

  // Custom events
  CUSTOM = 'custom',
}

/**
 * Audit event severity levels
 */
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Audit event interface
 */
export interface AuditEvent {
  timestamp: Date;
  type: AuditEventType;
  severity: AuditSeverity;
  actor: AuditActor;
  resource?: AuditResource;
  action: string;
  result: 'success' | 'failure';
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Actor information (who performed the action)
 */
export interface AuditActor {
  id?: string;
  type: 'user' | 'service' | 'system' | 'anonymous';
  identifier: string; // username, email, service name, etc.
  roles?: string[];
}

/**
 * Resource information (what was acted upon)
 */
export interface AuditResource {
  type: string; // 'user', 'post', 'file', etc.
  id?: string;
  name?: string;
  attributes?: Record<string, any>;
}

/**
 * Audit log storage interface
 */
export interface AuditStorage {
  save(event: AuditEvent): Promise<void>;
  query(filters: AuditQueryFilters): Promise<AuditEvent[]>;
}

/**
 * Query filters for audit logs
 */
export interface AuditQueryFilters {
  startDate?: Date;
  endDate?: Date;
  actorId?: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  result?: 'success' | 'failure';
  limit?: number;
  offset?: number;
}

/**
 * In-memory audit storage (for development)
 */
class InMemoryAuditStorage implements AuditStorage {
  private events: AuditEvent[] = [];
  private maxEvents: number;

  constructor(maxEvents = 10000) {
    this.maxEvents = maxEvents;
  }

  async save(event: AuditEvent): Promise<void> {
    this.events.push(event);

    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  async query(filters: AuditQueryFilters): Promise<AuditEvent[]> {
    let filtered = [...this.events];

    if (filters.startDate) {
      filtered = filtered.filter((e) => e.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter((e) => e.timestamp <= filters.endDate!);
    }

    if (filters.actorId) {
      filtered = filtered.filter((e) => e.actor.id === filters.actorId);
    }

    if (filters.eventType) {
      filtered = filtered.filter((e) => e.type === filters.eventType);
    }

    if (filters.severity) {
      filtered = filtered.filter((e) => e.severity === filters.severity);
    }

    if (filters.resourceType) {
      filtered = filtered.filter((e) => e.resource?.type === filters.resourceType);
    }

    if (filters.resourceId) {
      filtered = filtered.filter((e) => e.resource?.id === filters.resourceId);
    }

    if (filters.result) {
      filtered = filtered.filter((e) => e.result === filters.result);
    }

    // Sort by timestamp descending (most recent first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;

    return filtered.slice(offset, offset + limit);
  }

  getAll(): AuditEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}

/**
 * Audit logger class
 */
export class AuditLogger {
  private storage: AuditStorage;
  private enabled: boolean;

  constructor(storage?: AuditStorage, enabled = true) {
    this.storage = storage || new InMemoryAuditStorage();
    this.enabled = enabled;
  }

  /**
   * Log an audit event
   */
  async log(event: Partial<AuditEvent>): Promise<void> {
    if (!this.enabled) return;

    const fullEvent: AuditEvent = {
      timestamp: new Date(),
      type: event.type || AuditEventType.CUSTOM,
      severity: event.severity || AuditSeverity.INFO,
      actor: event.actor || {
        type: 'anonymous',
        identifier: 'unknown',
      },
      action: event.action || 'unknown',
      result: event.result || 'success',
      resource: event.resource,
      metadata: event.metadata,
      ip: event.ip,
      userAgent: event.userAgent,
      requestId: event.requestId,
    };

    try {
      await this.storage.save(fullEvent);

      // Log to console based on severity
      const logMessage = this.formatLogMessage(fullEvent);
      switch (fullEvent.severity) {
        case AuditSeverity.CRITICAL:
        case AuditSeverity.ERROR:
          logger.error(logMessage);
          break;
        case AuditSeverity.WARNING:
          logger.warn(logMessage);
          break;
        default:
          logger.info(logMessage);
      }
    } catch (error) {
      logger.error('Failed to save audit event:', error);
    }
  }

  /**
   * Query audit logs
   */
  async query(filters: AuditQueryFilters): Promise<AuditEvent[]> {
    return this.storage.query(filters);
  }

  /**
   * Format log message for console output
   */
  private formatLogMessage(event: AuditEvent): string {
    const parts = [
      `[${event.type}]`,
      `Actor: ${event.actor.identifier} (${event.actor.type})`,
      `Action: ${event.action}`,
      `Result: ${event.result}`,
    ];

    if (event.resource) {
      parts.push(
        `Resource: ${event.resource.type}${event.resource.id ? `#${event.resource.id}` : ''}`
      );
    }

    if (event.ip) {
      parts.push(`IP: ${event.ip}`);
    }

    return parts.join(' | ');
  }

  /**
   * Enable/disable audit logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if audit logging is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Global audit logger instance
let globalAuditLogger: AuditLogger | null = null;

/**
 * Initialize global audit logger
 */
export const initializeAuditLogger = (storage?: AuditStorage, enabled = true): AuditLogger => {
  globalAuditLogger = new AuditLogger(storage, enabled);
  return globalAuditLogger;
};

/**
 * Get global audit logger instance
 */
export const getAuditLogger = (): AuditLogger => {
  if (!globalAuditLogger) {
    globalAuditLogger = new AuditLogger();
  }
  return globalAuditLogger;
};

/**
 * Express middleware for automatic request auditing
 */
export const auditMiddleware = (
  options: {
    includeBody?: boolean;
    includeQuery?: boolean;
    excludePaths?: string[] | RegExp[];
    sensitiveFields?: string[];
  } = {}
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const auditLogger = getAuditLogger();

    // Check if path should be excluded
    if (options.excludePaths) {
      const isExcluded = options.excludePaths.some((path) => {
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

    const startTime = Date.now();

    // Capture the original response methods
    const originalSend = res.send;
    const originalJson = res.json;

    let responseBody: any;

    // Override response methods to capture response
    res.send = function (body): Response {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.json = function (body): Response {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Wait for response to complete
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      const user = (req as any).user;

      const metadata: Record<string, any> = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
      };

      if (options.includeQuery && Object.keys(req.query).length > 0) {
        metadata.query = req.query;
      }

      if (options.includeBody && req.body) {
        metadata.body = sanitizeSensitiveFields(req.body, options.sensitiveFields);
      }

      const isSuccess = res.statusCode >= 200 && res.statusCode < 400;

      await auditLogger.log({
        type: getEventTypeFromRequest(req, res),
        severity: getSeverityFromStatus(res.statusCode),
        actor: {
          id: user?.id,
          type: user ? 'user' : 'anonymous',
          identifier: user?.email || user?.username || req.ip || 'unknown',
          roles: user?.roles,
        },
        action: `${req.method} ${req.path}`,
        result: isSuccess ? 'success' : 'failure',
        metadata,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: (req as any).id,
      });
    });

    next();
  };
};

/**
 * Helper to determine event type from request
 */
const getEventTypeFromRequest = (req: Request, res: Response): AuditEventType => {
  const path = req.path.toLowerCase();
  const method = req.method.toUpperCase();

  // Authentication endpoints
  if (path.includes('/login')) {
    return res.statusCode === 200 ? AuditEventType.LOGIN_SUCCESS : AuditEventType.LOGIN_FAILURE;
  }
  if (path.includes('/logout')) return AuditEventType.LOGOUT;
  if (path.includes('/token/refresh')) return AuditEventType.TOKEN_REFRESH;

  // CRUD operations
  if (method === 'GET') return AuditEventType.DATA_READ;
  if (method === 'POST') return AuditEventType.DATA_CREATED;
  if (method === 'PUT' || method === 'PATCH') return AuditEventType.DATA_UPDATED;
  if (method === 'DELETE') return AuditEventType.DATA_DELETED;

  return AuditEventType.CUSTOM;
};

/**
 * Helper to determine severity from HTTP status
 */
const getSeverityFromStatus = (statusCode: number): AuditSeverity => {
  if (statusCode >= 500) return AuditSeverity.ERROR;
  if (statusCode >= 400) return AuditSeverity.WARNING;
  return AuditSeverity.INFO;
};

/**
 * Sanitize sensitive fields from objects
 */
const sanitizeSensitiveFields = (
  obj: any,
  sensitiveFields: string[] = ['password', 'token', 'secret', 'apiKey']
): any => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeSensitiveFields(item, sensitiveFields));
  }

  const sanitized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = sanitizeSensitiveFields(obj[key], sensitiveFields);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }
  return sanitized;
};

/**
 * Export storage implementations
 */
export { InMemoryAuditStorage };
