export interface AppConfig {
  apiUrl: string;
  auth: AuthConfig;
  services: Record<string, any>;
}

export interface ServerConfig {
  port: number;
  auth: AuthConfig;
  services?: Record<string, any>;
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
