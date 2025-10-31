export interface AppConfig {
  apiUrl: string;
  auth: AuthConfig;
  services: Record<string, any>;
  security?: SecurityOptions;
  cors?: CorsOptions;
}

export interface ServerConfig {
  port: number;
  auth: AuthConfig;
  services?: Record<string, any>;
  security?: SecurityOptions;
  cors?: CorsOptions;
  audit?: AuditOptions;
  trustProxy?: boolean | number;
}

export interface SecurityOptions {
  helmet?: boolean;
  rateLimit?: boolean | RateLimitOptions;
  xss?: boolean;
  noSqlInjection?: boolean;
  hpp?: boolean;
  sanitization?: boolean;
  apiKey?: ApiKeyOptions;
}

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

export interface ApiKeyOptions {
  header?: string;
  queryParam?: string;
  keys?: string[];
  excludePaths?: string[];
}

export interface CorsOptions {
  origins?: string[] | '*';
  credentials?: boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAge?: number;
}

export interface AuditOptions {
  enabled?: boolean;
  includeBody?: boolean;
  includeQuery?: boolean;
  excludePaths?: string[];
  sensitiveFields?: string[];
}

export interface AuthConfig {
  jwtSecret: string;
  tokenExpiration?: string;
}

export interface ServiceConfig {
  name: string;
  routes: Route[];
}

export interface Route {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: (req: any, res: any) => void;
  middleware?: any[];
}

export interface ServiceResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export interface AuthUser {
  id: string;
  email: string;
  roles?: string[];
}
