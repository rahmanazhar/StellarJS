// ─── Core ────────────────────────────────────────────────────────────────────
export { StellarApp } from './core/StellarApp';
export { StellarProvider, useStellar } from './core/StellarProvider';

// ─── Server ──────────────────────────────────────────────────────────────────
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

// ─── Database Adapters ───────────────────────────────────────────────────────
export { initDatabaseAdapter, getDatabaseAdapter } from './database/DatabaseAdapter';
export type { DatabaseAdapter, DatabaseConfig } from './database/DatabaseAdapter';
export { MongooseAdapter } from './database/adapters/MongooseAdapter';
export { PrismaAdapter } from './database/adapters/PrismaAdapter';
export { RedisAdapter } from './database/adapters/RedisAdapter';

// ─── Security ────────────────────────────────────────────────────────────────
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

// ─── Validation ──────────────────────────────────────────────────────────────
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

// ─── Audit & Logging ─────────────────────────────────────────────────────────
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

// ─── Hooks ───────────────────────────────────────────────────────────────────
export { useService, useAuth } from './hooks/useService';
export * from './hooks';

// ─── Microservices ───────────────────────────────────────────────────────────
export {
  ServiceRegistry,
  InterServiceClient,
  initServiceRegistry,
  getServiceRegistry,
  createInterServiceClient,
} from './server/microservices';
export type {
  ServiceInfo,
  ServiceRegistryOptions,
  InterServiceClientOptions,
} from './server/microservices';

// ─── Services ────────────────────────────────────────────────────────────────
export { AuthService, createAuthService, createAuthMiddleware } from './services/auth/AuthService';
export { UserModel } from './services/auth/UserModel';
export type { IUser } from './services/auth/UserModel';
export { UserService, createUserService } from './services/user/UserService';

// ─── Event Bus ───────────────────────────────────────────────────────────────
export { EventBus, initEventBus, getEventBus, stellarOn, stellarEmit } from './events/EventBus';
export type { EventHandler, TypedEventMap } from './events/EventBus';

// ─── Plugin System ───────────────────────────────────────────────────────────
export {
  definePlugin,
  PluginRegistry,
  initPluginRegistry,
  getPluginRegistry,
} from './plugins/PluginSystem';
export type {
  StellarPlugin,
  PluginContext,
  PluginEntry,
  PluginFactory,
} from './plugins/PluginSystem';

// ─── AI Integration ──────────────────────────────────────────────────────────
export { AIManager, initAI, getAI } from './ai/AIRouter';
export type { AIManagerOptions, AIRouteOptions, ProviderName } from './ai/AIRouter';

export { OpenAIProvider } from './ai/providers/OpenAIProvider';
export type { OpenAIProviderOptions } from './ai/providers/OpenAIProvider';

export { AnthropicProvider } from './ai/providers/AnthropicProvider';
export type { AnthropicProviderOptions } from './ai/providers/AnthropicProvider';

export { OllamaProvider } from './ai/providers/OllamaProvider';
export type { OllamaProviderOptions } from './ai/providers/OllamaProvider';

export type {
  AIProvider,
  AIMessage,
  AICompletionOptions,
  AICompletionResult,
} from './ai/providers/AIProvider';

export { useAI } from './ai/useAI';
export type { UseAIOptions, UseAIReturn } from './ai/useAI';

// ─── Real-time / WebSocket ────────────────────────────────────────────────────
export { StellarWebSocket, initWebSocket, getWebSocket } from './realtime/StellarWebSocket';
export type { ChannelOptions, WebSocketOptions } from './realtime/StellarWebSocket';

export { useChannel } from './realtime/useChannel';
export type { UseChannelOptions, UseChannelReturn } from './realtime/useChannel';

// ─── Background Jobs ─────────────────────────────────────────────────────────
export { JobManager, initJobQueue, getJobQueue } from './jobs/JobQueue';
export type {
  JobOptions,
  JobHandler,
  JobDefinition,
  ScheduledJob,
  QueueOptions,
} from './jobs/JobQueue';

// ─── SSR / SSG / ISR ─────────────────────────────────────────────────────────
export { SSREngine, initSSR, getSSR } from './ssr/StellarSSR';
export type {
  RenderMode,
  PageProps,
  GetServerPropsResult,
  GetServerProps,
  PageModule,
  SSROptions,
} from './ssr/StellarSSR';

// ─── File-based Routing ──────────────────────────────────────────────────────
export { FileRouter, initFileRouter, getFileRouter } from './routing/FileRouter';
export type { FileRouteEntry, FileRouterOptions } from './routing/FileRouter';

// ─── DevTools ────────────────────────────────────────────────────────────────
export { DevTools, initDevTools, getDevTools } from './devtools/DevTools';
export type { DevToolsOptions } from './devtools/DevTools';

// ─── Multi-tenancy ───────────────────────────────────────────────────────────
export { tenantMiddleware, tenantScope, getTenantId } from './tenancy/TenantMiddleware';
export type {
  TenantConfig,
  TenantContext,
  TenantStrategy,
  TenantIsolation,
} from './tenancy/TenantMiddleware';

// ─── i18n ────────────────────────────────────────────────────────────────────
export { I18nProvider, useTranslation, useI18n } from './i18n/I18nProvider';
export type {
  I18nConfig,
  I18nContextValue,
  I18nProviderProps,
  TranslationRecord,
} from './i18n/I18nProvider';

// ─── Image Optimization ──────────────────────────────────────────────────────
export { StellarImage } from './image/StellarImage';
export type {
  StellarImageProps,
  ImageFit,
  ImageFormat as StellarImageFormat,
} from './image/StellarImage';

export { ImageOptimizer, initImageOptimizer, getImageOptimizer } from './image/ImageOptimizer';
export type { ImageOptimizerOptions, OptimizeOptions } from './image/ImageOptimizer';

// ─── Utils ───────────────────────────────────────────────────────────────────
export * from './utils/helpers';
export * from './utils/constants';
export * from './utils/config';
export * from './utils/errors';

// ─── Security Utils ──────────────────────────────────────────────────────────
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

// ─── Types ───────────────────────────────────────────────────────────────────
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
