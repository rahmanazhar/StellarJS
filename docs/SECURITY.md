# Security Features

StellarJS v1.0.0 includes comprehensive, production-ready security features out of the box.

## Quick Start

```typescript
import { createServer } from 'stellar-js';

const server = createServer({
  port: 3000,
  auth: {
    jwtSecret: process.env.JWT_SECRET!,
  },
  // All security features enabled by default!
  security: {
    helmet: true, // Security headers
    rateLimit: true, // Rate limiting
    xss: true, // XSS protection
    noSqlInjection: true, // NoSQL injection prevention
    hpp: true, // HTTP Parameter Pollution protection
    sanitization: true, // Input sanitization
  },
  cors: {
    origins: ['https://yourdomain.com'],
    credentials: true,
  },
  audit: {
    enabled: true,
    includeBody: false,
    includeQuery: true,
  },
});
```

## CORS Configuration

### Simple Configuration

```typescript
// Development - Allow all origins
import { developmentCors } from 'stellar-js';

server.use(developmentCors);
```

```typescript
// Production - Whitelist specific origins
import { productionCors } from 'stellar-js';

server.use(productionCors(['https://app.example.com', 'https://www.example.com']));
```

### Advanced Configuration

```typescript
import { createCorsMiddleware } from 'stellar-js';

const cors = createCorsMiddleware({
  origins: ['https://app.example.com', 'https://admin.example.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit'],
  maxAge: 86400, // 24 hours
});

server.use(cors);
```

### Dynamic CORS

```typescript
import { createDynamicCors } from 'stellar-js';

// Automatically switches based on NODE_ENV
const cors = createDynamicCors(
  ['https://app.example.com'], // production
  '*' // development
);
```

### Custom Validation

```typescript
import { createValidatedCors } from 'stellar-js';

const cors = createValidatedCors((origin) => {
  // Custom validation logic
  return origin.endsWith('.yourdomain.com') || origin === 'https://yourdomain.com';
});
```

### Preset Configurations

```typescript
import { corsPresets } from 'stellar-js';

// Public API (no credentials)
server.use(corsPresets.public);

// Single origin
server.use(corsPresets.singleOrigin('https://app.example.com'));

// Mobile backend
server.use(corsPresets.mobileBackend);

// Internal microservices
server.use(corsPresets.internal);
```

## Security Middleware

### Security Profiles

```typescript
import { securityProfiles } from 'stellar-js';

// Maximum security (recommended for production)
securityProfiles.maximum().forEach((mw) => server.use(mw));

// Balanced security (good default)
securityProfiles.balanced().forEach((mw) => server.use(mw));

// Development mode (minimal interference)
securityProfiles.development().forEach((mw) => server.use(mw));

// API-specific security
securityProfiles.api().forEach((mw) => server.use(mw));
```

### Custom Security Configuration

```typescript
import { createSecurityMiddleware } from 'stellar-js';

const security = createSecurityMiddleware({
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests',
    keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
  },
  xss: true,
  noSqlInjection: true,
  hpp: {
    whitelist: ['filter', 'sort'], // Allow these as arrays
  },
});

security.forEach((mw) => server.use(mw));
```

## Rate Limiting

### Basic Rate Limiting

```typescript
import { createRateLimiter } from 'stellar-js';

const limiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP',
});

server.use('/api/', limiter);
```

### Custom Rate Limiting

```typescript
// Different limits for different endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
});

const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60, // 60 requests per minute
  keyGenerator: (req) => req.user?.id || req.ip,
});

server.use('/api/auth/login', authLimiter);
server.use('/api/', apiLimiter);
```

## Request Validation

### Schema-based Validation

```typescript
import { validate, Joi, commonSchemas } from 'stellar-js';

// User registration
const registerSchema = Joi.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
  username: commonSchemas.username,
  age: Joi.number().integer().min(13).required(),
});

router.post('/register', validate(registerSchema, 'body'), async (req, res) => {
  // req.body is validated and sanitized
  const { email, password, username } = req.body;
  // ... handle registration
});
```

### Common Schemas

```typescript
import { commonSchemas } from 'stellar-js';

// Available schemas:
commonSchemas.email;
commonSchemas.password;
commonSchemas.uuid;
commonSchemas.objectId;
commonSchemas.url;
commonSchemas.phone;
commonSchemas.pagination;
commonSchemas.dateRange;
commonSchemas.apiKey;
commonSchemas.username;
```

### File Upload Validation

```typescript
import { validateFile } from 'stellar-js';

router.post(
  '/upload',
  upload.single('file'),
  validateFile({
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    required: true,
  }),
  async (req, res) => {
    // File is validated
    const file = req.file;
    // ... handle upload
  }
);
```

### Multi-target Validation

```typescript
import { validateAll } from 'stellar-js';

router.get(
  '/search',
  validateAll([
    { schema: querySchema, target: 'query' },
    { schema: headersSchema, target: 'headers' },
  ]),
  async (req, res) => {
    // Both query and headers are validated
  }
);
```

## Input Sanitization

```typescript
import { sanitize, validators } from 'stellar-js';

// Sanitize email
const cleanEmail = sanitize.email('User@Example.com'); // 'user@example.com'

// Sanitize HTML
const safeHtml = sanitize.html('<script>alert("xss")</script>'); // escaped

// Sanitize URL
const safeUrl = sanitize.url('https://example.com/path');

// Remove non-alphanumeric
const clean = sanitize.alphanumeric('hello-world!'); // 'helloworld'

// Sanitize filename
const filename = sanitize.filename('../../../etc/passwd'); // '__________etc_passwd'

// Validators
validators.isCreditCard('4111111111111111'); // true
validators.isIP('192.168.1.1'); // true
validators.isJWT('eyJ...');
validators.isStrongPassword('MyP@ssw0rd123', {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
});
```

## API Key Authentication

```typescript
import { createApiKeyMiddleware } from 'stellar-js';

// Simple API key validation
const apiKeyAuth = createApiKeyMiddleware({
  header: 'X-API-Key',
  keys: ['sk_live_abc123...', 'sk_live_def456...'],
  excludePaths: ['/health', '/docs'],
});

server.use('/api/', apiKeyAuth);
```

```typescript
// Custom validation (e.g., database lookup)
const apiKeyAuth = createApiKeyMiddleware({
  validate: async (key) => {
    const apiKey = await db.apiKeys.findOne({ key, active: true });
    return !!apiKey;
  },
  excludePaths: [/^\/public\//],
});
```

## Security Utilities

### Generate Secure Tokens

```typescript
import {
  generateRandomString,
  generateSecureToken,
  generateApiKey,
  generateOTP,
  generateUUID,
  generateJWTSecret,
} from 'stellar-js';

// Random string (hex)
const random = generateRandomString(32);

// Secure token (base64url)
const token = generateSecureToken(32);

// API key with prefix
const apiKey = generateApiKey('sk_live'); // 'sk_live_abc123...'

// One-time password
const otp = generateOTP(6); // '123456'

// UUID v4
const id = generateUUID();

// JWT secret
const secret = generateJWTSecret(64);
```

### Encryption

```typescript
import { encrypt, decrypt } from 'stellar-js';

const secret = 'your-encryption-key';
const data = 'sensitive information';

// Encrypt
const { encrypted, iv, tag } = encrypt(data, secret);

// Decrypt
const decrypted = decrypt(encrypted, secret, iv, tag);
```

### Hashing and HMAC

```typescript
import { hashSHA256, hashSHA512, generateHMAC, verifyHMAC } from 'stellar-js';

// SHA-256
const hash = hashSHA256('data to hash');

// SHA-512
const hash512 = hashSHA512('data to hash');

// HMAC
const signature = generateHMAC('data', 'secret');
const isValid = verifyHMAC('data', 'secret', signature);
```

### Password Strength Checker

```typescript
import { checkPasswordStrength } from 'stellar-js';

const result = checkPasswordStrength('MyP@ssw0rd');
// {
//   score: 3,
//   strength: 'strong',
//   suggestions: []
// }
```

### Mask Sensitive Data

```typescript
import { maskSensitiveData, maskEmail, maskCreditCard } from 'stellar-js';

maskSensitiveData('secret123', 4); // 'secr******'
maskEmail('user@example.com'); // 'use*@example.com'
maskCreditCard('4111111111111111'); // '************1111'
```

### Time-based Tokens

```typescript
import { signWithExpiry, verifyWithExpiry } from 'stellar-js';

// Create token that expires in 1 hour
const token = signWithExpiry('user-id-123', 'secret', 60 * 60 * 1000);

// Verify token
const result = verifyWithExpiry(token, 'secret');
if (result.valid) {
  console.log('User ID:', result.data);
} else if (result.expired) {
  console.log('Token expired');
}
```

## Audit Logging

### Enable Audit Logging

```typescript
import { initializeAuditLogger, auditMiddleware } from 'stellar-js';

// Initialize
initializeAuditLogger();

// Add middleware
server.use(
  auditMiddleware({
    includeBody: false,
    includeQuery: true,
    excludePaths: ['/health', '/metrics'],
    sensitiveFields: ['password', 'token', 'creditCard'],
  })
);
```

### Manual Audit Logging

```typescript
import { getAuditLogger, AuditEventType, AuditSeverity } from 'stellar-js';

const auditLogger = getAuditLogger();

// Log authentication success
await auditLogger.log({
  type: AuditEventType.LOGIN_SUCCESS,
  severity: AuditSeverity.INFO,
  actor: {
    id: user.id,
    type: 'user',
    identifier: user.email,
    roles: user.roles,
  },
  action: 'User logged in',
  result: 'success',
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

// Log security event
await auditLogger.log({
  type: AuditEventType.SUSPICIOUS_ACTIVITY,
  severity: AuditSeverity.WARNING,
  actor: {
    type: 'anonymous',
    identifier: req.ip,
  },
  action: 'Multiple failed login attempts',
  result: 'failure',
  metadata: {
    attempts: 5,
    username: req.body.username,
  },
});
```

### Query Audit Logs

```typescript
// Get recent audit events
const events = await auditLogger.query({
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
  severity: AuditSeverity.WARNING,
  limit: 100,
});

// Get events for specific user
const userEvents = await auditLogger.query({
  actorId: 'user-123',
  eventType: AuditEventType.DATA_UPDATED,
});
```

## Additional Security Features

### IP Whitelist/Blacklist

```typescript
import { ipWhitelist, ipBlacklist } from 'stellar-js';

// Allow only specific IPs
server.use('/admin', ipWhitelist(['192.168.1.1', '10.0.0.1']));

// Block specific IPs
server.use(ipBlacklist(['192.168.1.100']));
```

### Request Size Limiting

```typescript
import { limitRequestSize } from 'stellar-js';

// Limit request size to 1MB
server.use(limitRequestSize(1024 * 1024));
```

### Content-Type Validation

```typescript
import { validateContentType } from 'stellar-js';

server.use('/api', validateContentType(['application/json', 'application/xml']));
```

## Best Practices

1. **Always use HTTPS in production** - Security features work best over HTTPS
2. **Keep JWT secrets secure** - Use environment variables, never commit secrets
3. **Enable all security features by default** - Disable only if you have a specific reason
4. **Use rate limiting** - Protect against brute force and DoS attacks
5. **Validate all inputs** - Never trust user input
6. **Log security events** - Enable audit logging to track suspicious activity
7. **Use API keys for service-to-service** communication
8. **Implement proper CORS** - Don't use `*` in production
9. **Update dependencies regularly** - Keep security packages up to date
10. **Use strong password policies** - Enforce minimum requirements

## Production Configuration Example

```typescript
import { createServer } from 'stellar-js';

const server = createServer({
  port: parseInt(process.env.PORT || '3000'),
  trustProxy: true, // Behind load balancer
  auth: {
    jwtSecret: process.env.JWT_SECRET!,
    tokenExpiration: '15m',
  },
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    credentials: true,
    maxAge: 7200,
  },
  security: {
    helmet: true,
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100,
      skipSuccessfulRequests: false,
    },
    xss: true,
    noSqlInjection: true,
    hpp: true,
    sanitization: true,
  },
  audit: {
    enabled: true,
    includeBody: false,
    includeQuery: true,
    excludePaths: ['/health', '/metrics'],
    sensitiveFields: ['password', 'token', 'apiKey', 'secret'],
  },
});

// Add API key authentication for external services
import { createApiKeyMiddleware } from 'stellar-js';

const apiKeyAuth = createApiKeyMiddleware({
  validate: async (key) => {
    // Validate against database
    return await validateApiKey(key);
  },
  excludePaths: ['/health', '/docs', '/api/auth/login'],
});

server.use('/api', apiKeyAuth);

await server.start();
```

## Migration from v0.x

If you're upgrading from an earlier version:

1. **Update package.json**: Version is now `1.0.0`
2. **Add security config**: Security is enabled by default
3. **Configure CORS**: Replace old CORS setup with new configuration
4. **Update validation**: Use new Joi-based validation system
5. **Enable audit logging**: Add audit configuration if needed

The framework is backward compatible, but we recommend adopting the new security features for better protection.
