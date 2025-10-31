// Core
export { StellarApp } from './core/StellarApp';
export { StellarProvider, useStellar } from './core/StellarProvider';

// Server
export { StellarServer, createServer } from './server/StellarServer';
export {
  DatabaseManager,
  createDatabaseManager,
  initDatabase,
  getDatabase,
  closeDatabase,
} from './server/database';
export { ApiDocGenerator, createApiDocGenerator } from './server/docs';
export * from './server/middleware';

// Security
export {
  createCorsMiddleware,
  developmentCors,
  productionCors,
  createDynamicCors,
  createValidatedCors,
  corsPresets,
  toExpressCorsOptions,
} from './server/cors';
export type { CorsOptions } from './server/cors';

export {
  createSecurityMiddleware,
  createRateLimiter,
  sanitizeInputs,
  createApiKeyMiddleware,
  validateContentType,
  ipWhitelist,
  ipBlacklist,
  limitRequestSize,
  securityProfiles,
} from './server/security';
export type { SecurityConfig, RateLimitConfig, HppConfig, ApiKeyConfig } from './server/security';

// Validation
export {
  validate,
  commonSchemas,
  sanitize,
  validators,
  validateFile,
  validateAll,
  Joi,
} from './server/validation';
export type { ValidationTarget, ValidationOptions, ValidationError } from './server/validation';

// Audit & Logging
export {
  initializeAuditLogger,
  getAuditLogger,
  auditMiddleware,
  AuditLogger,
  AuditEventType,
  AuditSeverity,
  InMemoryAuditStorage,
} from './server/audit';
export type {
  AuditEvent,
  AuditActor,
  AuditResource,
  AuditStorage,
  AuditQueryFilters,
} from './server/audit';

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
export * from './utils/errors';

// Security Utils
export {
  generateRandomString,
  generateSecureToken,
  generateApiKey,
  hashSHA256,
  hashSHA512,
  generateHMAC,
  verifyHMAC,
  encrypt,
  decrypt,
  generateCSRFToken,
  verifyCSRFToken,
  generateSessionId,
  maskSensitiveData,
  maskEmail,
  maskCreditCard,
  checkPasswordStrength,
  generateNonce,
  createRequestFingerprint,
  constantTimeCompare,
  generateOTP,
  generateJWTSecret,
  obfuscateId,
  deobfuscateId,
  TokenBucket,
  randomInt,
  generateUUID,
  signWithExpiry,
  verifyWithExpiry,
} from './utils/security';
export type { PasswordStrength } from './utils/security';

// Types
export type {
  AppConfig,
  ServerConfig,
  AuthConfig,
  ServiceConfig,
  Route,
  ServiceResponse,
  AuthUser,
  SecurityOptions,
  RateLimitOptions,
  ApiKeyOptions,
  AuditOptions,
} from './types';
