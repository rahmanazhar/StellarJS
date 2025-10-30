# StellarJS API Reference

Complete reference of all exported APIs from the StellarJS framework.

## Table of Contents
- [Core](#core)
- [Server](#server)
- [Hooks](#hooks)
- [Services](#services)
- [Utilities](#utilities)
- [Middleware](#middleware)
- [Types](#types)

---

## Core

### StellarApp
Main application wrapper component.
```typescript
<StellarApp config={config}>
  {children}
</StellarApp>
```

### StellarProvider
Context provider for configuration.
```typescript
<StellarProvider config={config}>
  {children}
</StellarProvider>
```

### useStellar
Hook to access Stellar configuration.
```typescript
const { config } = useStellar();
```

---

## Server

### createServer(config: ServerConfig)
Factory function to create a StellarJS server.

### StellarServer
Main server class with methods:
- `use(middleware)` - Add middleware
- `registerService(config)` - Register a service
- `start()` - Start the server
- `stop()` - Stop the server
- `getApp()` - Get Express app instance
- `getService(name)` - Get registered service

### Database

#### initDatabase(config: DatabaseConfig)
Initialize global database connection.

#### getDatabase()
Get global database manager instance.

#### closeDatabase()
Close global database connection.

#### createDatabaseManager(config)
Create a new database manager instance.

#### DatabaseManager
- `connect()` - Connect to database
- `disconnect()` - Disconnect from database
- `isConnected()` - Check connection status
- `healthCheck()` - Check database health
- `getConnection()` - Get Mongoose connection

### API Documentation

#### createApiDocGenerator(options)
Create API documentation generator.

#### ApiDocGenerator
- `registerService(service)` - Register service for docs
- `generateJson()` - Generate JSON documentation
- `generateMarkdown()` - Generate Markdown docs
- `generateOpenApi()` - Generate OpenAPI spec
- `generateHtml()` - Generate HTML docs
- `setupDocEndpoint(app, path)` - Setup doc endpoints

---

## Hooks

### useService(serviceName, method, options)
Call service methods from React components.
```typescript
const { data, loading, error, execute, reset } = useService('users', 'getUsers', {
  immediate: true,
  onSuccess: (data) => {},
  onError: (error) => {}
});
```

### useAuth()
Authentication hook.
```typescript
const { login, register, isLoading, error } = useAuth();
```

### useAsync(asyncFn, immediate?)
Handle async operations.
```typescript
const { execute, status, data, error, isPending, isSuccess, isError } = useAsync(fn);
```

### useLocalStorage(key, initialValue)
Persist state in localStorage.
```typescript
const [value, setValue, removeValue] = useLocalStorage('key', defaultValue);
```

### useSessionStorage(key, initialValue)
Persist state in sessionStorage.
```typescript
const [value, setValue, removeValue] = useSessionStorage('key', defaultValue);
```

### useFetch(url, options?)
Fetch data from URL.
```typescript
const { data, error, loading, refetch } = useFetch('/api/data');
```

### useDebounce(value, delay)
Debounce a value.
```typescript
const debouncedValue = useDebounce(searchTerm, 500);
```

### useInterval(callback, delay)
Set up an interval.
```typescript
useInterval(() => console.log('tick'), 1000);
```

### useToggle(initialValue?)
Toggle boolean state.
```typescript
const [isOpen, toggle, setIsOpen] = useToggle(false);
```

### usePrevious(value)
Get previous value.
```typescript
const previousValue = usePrevious(currentValue);
```

### useMount(callback)
Run callback on component mount.
```typescript
useMount(() => console.log('mounted'));
```

### useUnmount(callback)
Run callback on component unmount.
```typescript
useUnmount(() => console.log('unmounting'));
```

### useWindowSize()
Track window dimensions.
```typescript
const { width, height } = useWindowSize();
```

### useOnClickOutside(ref, handler)
Detect clicks outside element.
```typescript
useOnClickOutside(ref, () => console.log('clicked outside'));
```

---

## Services

### AuthService
JWT-based authentication service.
- `login(req, res)` - Handle login
- `register(req, res)` - Handle registration
- `authenticateToken(req, res, next)` - Auth middleware
- `requireRoles(roles)` - Role-based auth middleware

#### createAuthService(config)
Factory function for AuthService.

#### createAuthMiddleware(authService)
Create auth middleware from service.

### UserService
Example CRUD service for users.
- `getUsers(req, res)` - Get all users
- `getUserById(req, res)` - Get user by ID
- `createUser(req, res)` - Create new user
- `updateUser(req, res)` - Update user
- `deleteUser(req, res)` - Delete user

#### createUserService()
Factory function for UserService.

---

## Utilities

### Helpers

#### Logger
```typescript
const logger = createLogger('Context');
logger.info('message');
logger.warn('warning');
logger.error('error', error);
logger.debug('debug info');
logger.success('success message');
```

#### Error Handling
- `formatError(error)` - Format error message
- `tryCatch(fn, errorMessage?)` - Async error wrapper
- `retry(fn, options?)` - Retry with backoff

#### Async Utilities
- `sleep(ms)` - Sleep for duration
- `debounce(fn, delay)` - Debounce function
- `throttle(fn, limit)` - Throttle function

#### Data Utilities
- `deepClone(obj)` - Deep clone object
- `isEmpty(obj)` - Check if empty
- `randomString(length?)` - Generate random string
- `uuid()` - Generate UUID

### Configuration

#### loadConfig(baseConfig, envConfigs?)
Load configuration with environment overrides.

#### validateAppConfig(config)
Validate app configuration.

#### validateServerConfig(config)
Validate server configuration.

#### loadConfigFromEnv()
Load config from environment variables.

#### mergeConfig(defaults, overrides)
Merge configurations.

#### Environment Helpers
- `getEnvironment()` - Get current environment
- `isProduction()` - Check if production
- `isDevelopment()` - Check if development
- `isTest()` - Check if test

### Validation

#### validate(data, schema)
Validate data against schema.

#### validateRequest(schema)
Express middleware for validation.

#### validateNested(data, schema, prefix?)
Validate nested objects.

#### validateArray(data, schema)
Validate array of objects.

#### Validators
- `isValidEmail(email)` - Check email validity
- `isValidUrl(url)` - Check URL validity
- `sanitizeString(str)` - Sanitize string for XSS

#### commonSchemas
Pre-defined validation schemas:
- `commonSchemas.email`
- `commonSchemas.password`
- `commonSchemas.login`
- `commonSchemas.register`

### Error Classes

- `StellarError` - Base error class
- `ValidationError` - Validation errors
- `AuthenticationError` - Auth required
- `AuthorizationError` - Insufficient permissions
- `NotFoundError` - Resource not found
- `ConflictError` - Resource conflict
- `RateLimitError` - Too many requests
- `ServiceUnavailableError` - Service unavailable

#### Error Utilities
- `isOperationalError(error)` - Check if operational
- `formatErrorResponse(error)` - Format for API response

### Constants

- `HTTP_STATUS` - HTTP status codes
- `ERROR_MESSAGES` - Common error messages
- `DEFAULTS` - Default values
- `ENVIRONMENTS` - Environment names
- `HTTP_METHODS` - HTTP method constants
- `SERVICE_STATUS` - Service status values

---

## Middleware

### Error Handling
- `errorHandler` - Global error handler
- `notFound` - 404 handler
- `asyncHandler(fn)` - Wrap async handlers

### Request Processing
- `requestLogger` - Log requests
- `requestId` - Add request ID
- `timeout(ms)` - Request timeout
- `formatResponse` - Format responses

### Validation & Security
- `validateBody(fields)` - Validate request body
- `securityHeaders` - Add security headers
- `configureCors(origins)` - Configure CORS
- `rateLimit(options)` - Rate limiting

### Utilities
- `apiVersion(version)` - API versioning

---

## Types

### AppConfig
```typescript
interface AppConfig {
  apiUrl: string;
  auth: AuthConfig;
  services: Record<string, any>;
}
```

### ServerConfig
```typescript
interface ServerConfig {
  port: number;
  auth: AuthConfig;
  services?: Record<string, any>;
}
```

### AuthConfig
```typescript
interface AuthConfig {
  jwtSecret: string;
  tokenExpiration?: string;
}
```

### ServiceConfig
```typescript
interface ServiceConfig {
  name: string;
  routes: Route[];
}
```

### Route
```typescript
interface Route {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: (req: any, res: any) => void;
  middleware?: any[];
}
```

### ServiceResponse
```typescript
interface ServiceResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}
```

### AuthUser
```typescript
interface AuthUser {
  id: string;
  email: string;
  roles?: string[];
}
```

### ValidationRule
```typescript
type ValidationRule = {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'email' | 'url';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
}
```

### ValidationSchema
```typescript
type ValidationSchema = {
  [key: string]: ValidationRule;
}
```

### ValidationResult
```typescript
type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
}
```

---

## Import Examples

```typescript
// Core
import { StellarApp, StellarProvider, useStellar } from 'stellar-js';

// Server
import { 
  createServer, 
  initDatabase, 
  createApiDocGenerator 
} from 'stellar-js';

// Hooks
import { 
  useService, 
  useAuth, 
  useAsync, 
  useLocalStorage 
} from 'stellar-js';

// Services
import { 
  createAuthService, 
  createUserService 
} from 'stellar-js';

// Utilities
import { 
  createLogger, 
  validate, 
  retry, 
  deepClone 
} from 'stellar-js';

// Middleware
import { 
  errorHandler, 
  requestLogger, 
  securityHeaders 
} from 'stellar-js';

// Errors
import { 
  NotFoundError, 
  ValidationError 
} from 'stellar-js';

// Types
import type { 
  AppConfig, 
  ServerConfig, 
  ServiceConfig 
} from 'stellar-js';
```
