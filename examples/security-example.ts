/**
 * StellarJS Security Features Example
 *
 * This example demonstrates all the security features available in StellarJS v1.0.0
 */

import {
  createServer,
  createCorsMiddleware,
  createSecurityMiddleware,
  createRateLimiter,
  createApiKeyMiddleware,
  validate,
  Joi,
  commonSchemas,
  getAuditLogger,
  AuditEventType,
  AuditSeverity,
  generateApiKey,
  checkPasswordStrength,
  maskEmail,
  hashSHA256,
} from 'stellar-js';

// ============================================================================
// 1. Server Setup with Comprehensive Security
// ============================================================================

const server = createServer({
  port: 3000,
  trustProxy: true, // Important when behind a load balancer/reverse proxy

  // JWT Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    tokenExpiration: '15m',
  },

  // CORS Configuration
  cors: {
    // In production, specify exact origins
    origins:
      process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com', 'https://app.yourdomain.com']
        : '*', // Allow all in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400, // 24 hours
  },

  // Security Features
  security: {
    helmet: true, // Security headers
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: 'Too many requests, please try again later',
    },
    xss: true, // XSS protection
    noSqlInjection: true, // NoSQL injection prevention
    hpp: true, // HTTP Parameter Pollution
    sanitization: true, // Input sanitization
  },

  // Audit Logging
  audit: {
    enabled: true,
    includeBody: false, // Don't log request bodies (may contain sensitive data)
    includeQuery: true, // Log query parameters
    excludePaths: ['/health', '/metrics'], // Don't log health checks
    sensitiveFields: ['password', 'token', 'apiKey', 'creditCard'],
  },
});

const app = server.getApp();

// ============================================================================
// 2. Custom Rate Limiters for Different Endpoints
// ============================================================================

// Strict rate limiter for authentication endpoints
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true, // Don't count successful logins
});

// API rate limiter
const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60, // 60 requests per minute
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return (req as any).user?.id || req.ip || 'unknown';
  },
});

// ============================================================================
// 3. API Key Authentication for External Services
// ============================================================================

const apiKeyMiddleware = createApiKeyMiddleware({
  header: 'X-API-Key',
  validate: async (key: string) => {
    // In production, validate against database
    // For demo, we'll use a simple check
    const validKeys = ['sk_test_abc123', 'sk_live_xyz789'];
    return validKeys.includes(key);
  },
  excludePaths: ['/health', '/docs', '/api/auth/login', '/api/auth/register'],
});

// Apply API key auth to all API routes
app.use('/api', apiKeyMiddleware);

// ============================================================================
// 4. Validation Schemas
// ============================================================================

// User registration schema
const registerSchema = Joi.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
  username: commonSchemas.username,
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  age: Joi.number().integer().min(13).max(120).optional(),
  acceptTerms: Joi.boolean().valid(true).required(),
});

// Login schema
const loginSchema = Joi.object({
  email: commonSchemas.email,
  password: Joi.string().required(),
});

// Update user schema
const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  email: commonSchemas.email.optional(),
  currentPassword: Joi.string().when('newPassword', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  newPassword: commonSchemas.password.optional(),
});

// Query parameters schema
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('createdAt', 'updatedAt', 'name', 'email').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});

// ============================================================================
// 5. Routes with Security Features
// ============================================================================

// Health check (no authentication required)
app.get('/health', (req, res) => {
  const health = server.getHealth();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: health.uptime,
    services: health.services,
  });
});

// Public registration endpoint with rate limiting
app.post(
  '/api/auth/register',
  authRateLimiter,
  validate(registerSchema, 'body'),
  async (req, res) => {
    try {
      const { email, password, username, firstName, lastName } = req.body;

      // Check password strength
      const strength = checkPasswordStrength(password);
      if (strength.score < 3) {
        return res.status(400).json({
          error: {
            message: 'Password is too weak',
            suggestions: strength.suggestions,
          },
        });
      }

      // Hash password (use bcrypt in production)
      const hashedPassword = hashSHA256(password);

      // Create user (database logic here)
      const user = {
        id: generateApiKey('usr'),
        email,
        username,
        firstName,
        lastName,
        password: hashedPassword,
        createdAt: new Date(),
      };

      // Log audit event
      const auditLogger = getAuditLogger();
      await auditLogger.log({
        type: AuditEventType.USER_CREATED,
        severity: AuditSeverity.INFO,
        actor: {
          type: 'system',
          identifier: 'registration-system',
        },
        action: 'User registered',
        result: 'success',
        resource: {
          type: 'user',
          id: user.id,
          name: maskEmail(email),
        },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: maskEmail(email),
          username,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: {
          message: 'Registration failed',
        },
      });
    }
  }
);

// Login endpoint with strict rate limiting
app.post('/api/auth/login', authRateLimiter, validate(loginSchema, 'body'), async (req, res) => {
  try {
    const { email, password } = req.body;
    const auditLogger = getAuditLogger();

    // Authenticate user (database logic here)
    const authenticated = true; // Replace with actual auth logic

    if (!authenticated) {
      // Log failed login
      await auditLogger.log({
        type: AuditEventType.LOGIN_FAILURE,
        severity: AuditSeverity.WARNING,
        actor: {
          type: 'user',
          identifier: email,
        },
        action: 'Failed login attempt',
        result: 'failure',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(401).json({
        error: {
          message: 'Invalid credentials',
        },
      });
    }

    // Generate token
    const token = 'jwt-token-here'; // Use actual JWT generation

    // Log successful login
    await auditLogger.log({
      type: AuditEventType.LOGIN_SUCCESS,
      severity: AuditSeverity.INFO,
      actor: {
        type: 'user',
        identifier: email,
      },
      action: 'User logged in',
      result: 'success',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      token,
      user: {
        email: maskEmail(email),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: 'Login failed',
      },
    });
  }
});

// Protected API endpoint with validation
app.get('/api/users', apiRateLimiter, validate(paginationSchema, 'query'), async (req, res) => {
  try {
    const { page, limit, sort, order } = req.query;

    // Fetch users (database logic here)
    const users = [
      { id: '1', email: 'user1@example.com', username: 'user1' },
      { id: '2', email: 'user2@example.com', username: 'user2' },
    ];

    res.json({
      data: users,
      pagination: {
        page,
        limit,
        total: users.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: 'Failed to fetch users',
      },
    });
  }
});

// Update user with complex validation
app.put('/api/users/:id', apiRateLimiter, validate(updateUserSchema, 'body'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Update user (database logic here)
    const auditLogger = getAuditLogger();
    await auditLogger.log({
      type: AuditEventType.USER_UPDATED,
      severity: AuditSeverity.INFO,
      actor: {
        type: 'user',
        identifier: (req as any).user?.email || 'unknown',
      },
      action: 'Updated user profile',
      result: 'success',
      resource: {
        type: 'user',
        id,
      },
      metadata: {
        fields: Object.keys(updates),
      },
    });

    res.json({
      message: 'User updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: 'Failed to update user',
      },
    });
  }
});

// Admin endpoint - query audit logs
app.get(
  '/api/admin/audit-logs',
  apiRateLimiter,
  validate(
    Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().optional(),
      eventType: Joi.string().optional(),
      severity: Joi.string().valid('info', 'warning', 'error', 'critical').optional(),
      limit: Joi.number().integer().min(1).max(1000).default(100),
    }),
    'query'
  ),
  async (req, res) => {
    try {
      const auditLogger = getAuditLogger();
      const events = await auditLogger.query(req.query as any);

      res.json({
        data: events,
        total: events.length,
      });
    } catch (error) {
      res.status(500).json({
        error: {
          message: 'Failed to fetch audit logs',
        },
      });
    }
  }
);

// ============================================================================
// 6. Start Server
// ============================================================================

async function startServer() {
  try {
    await server.start();
    console.log('');
    console.log('✅ StellarJS Server Started Successfully!');
    console.log('');
    console.log('📚 Available Endpoints:');
    console.log('   GET  /health              - Health check');
    console.log('   POST /api/auth/register  - Register user');
    console.log('   POST /api/auth/login     - Login');
    console.log('   GET  /api/users          - List users (requires API key)');
    console.log('   PUT  /api/users/:id      - Update user (requires API key)');
    console.log('   GET  /api/admin/audit-logs - View audit logs');
    console.log('');
    console.log('🔐 Security Features Enabled:');
    console.log('   ✓ Helmet security headers');
    console.log('   ✓ Rate limiting (5/15min for auth, 60/min for API)');
    console.log('   ✓ XSS protection');
    console.log('   ✓ NoSQL injection prevention');
    console.log('   ✓ HTTP Parameter Pollution protection');
    console.log('   ✓ Input sanitization');
    console.log('   ✓ CORS configured');
    console.log('   ✓ API key authentication');
    console.log('   ✓ Audit logging');
    console.log('');
    console.log('🧪 Test with:');
    console.log('   curl http://localhost:3000/health');
    console.log('   curl -X POST http://localhost:3000/api/auth/register \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -H "X-API-Key: sk_test_abc123" \\');
    console.log(
      '     -d \'{"email":"test@example.com","password":"SecureP@ss123","username":"testuser","firstName":"Test","lastName":"User","acceptTerms":true}\''
    );
    console.log('');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

startServer();

// ============================================================================
// 7. Utility Functions for Demo
// ============================================================================

/**
 * Example: Generate API keys for external services
 */
function generateApiKeys() {
  console.log('Generated API Keys:');
  console.log('Test:', generateApiKey('sk_test'));
  console.log('Live:', generateApiKey('sk_live'));
}

/**
 * Example: Check password strength
 */
function checkPasswordExamples() {
  const passwords = ['password', 'Password1', 'P@ssw0rd', 'MySecureP@ssw0rd123!'];

  passwords.forEach((pwd) => {
    const result = checkPasswordStrength(pwd);
    console.log(`Password: ${pwd}`);
    console.log(`Strength: ${result.strength} (score: ${result.score}/4)`);
    console.log(`Suggestions:`, result.suggestions);
    console.log('---');
  });
}

// Uncomment to run examples:
// generateApiKeys();
// checkPasswordExamples();
