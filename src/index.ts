// Core
export { StellarApp } from './core/StellarApp';
export { StellarProvider, useStellar } from './core/StellarProvider';

// Server
export { StellarServer, createServer } from './server/StellarServer';
export { DatabaseManager, createDatabaseManager, initDatabase, getDatabase, closeDatabase } from './server/database';
export { ApiDocGenerator, createApiDocGenerator } from './server/docs';
export * from './server/middleware';

// Hooks
export { useService, useAuth } from './hooks/useService';
export * from './hooks';

// Services
export { AuthService, createAuthService, createAuthMiddleware } from './services/auth/AuthService';
export { UserService, createUserService } from './services/user/UserService';

// Utils
export * from './utils/helpers';
export * from './utils/constants';
export * from './utils/config';
export {
  validate,
  validateRequest,
  validateNested,
  validateArray,
  isValidEmail,
  isValidUrl,
  sanitizeString,
  commonSchemas
} from './utils/validation';
export type { ValidationRule, ValidationSchema, ValidationResult } from './utils/validation';
export * from './utils/errors';

// Types
export type {
  AppConfig,
  ServerConfig,
  AuthConfig,
  ServiceConfig,
  Route,
  ServiceResponse,
  AuthUser
} from './types';
