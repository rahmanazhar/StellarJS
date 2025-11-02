# Changelog

All notable changes to StellarJS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 (2025-11-02)

- fix: Add axios dependency and fix TypeScript errors in php-client.ts ([d9a58e7](https://github.com/rahmanazhar/StellarJS/commit/d9a58e7))
- fix: Add package-lock.json for CI/CD consistency ([c9907c6](https://github.com/rahmanazhar/StellarJS/commit/c9907c6))
- fix: Exclude php-client.ts from coverage requirements ([b49ad87](https://github.com/rahmanazhar/StellarJS/commit/b49ad87))
- fix: Fix test suite failures and improve test infrastructure ([0f944b8](https://github.com/rahmanazhar/StellarJS/commit/0f944b8))
- fix: Resolve remaining TypeScript and ESLint errors ([7d863df](https://github.com/rahmanazhar/StellarJS/commit/7d863df))
- fix: Resolve TypeScript and ESLint errors ([cd51b23](https://github.com/rahmanazhar/StellarJS/commit/cd51b23))
- fix: Update npm package name to @rahmanazhar/stellar-js in README ([0bc5b78](https://github.com/rahmanazhar/StellarJS/commit/0bc5b78))
- fix: Update npm package references in README for correct usage ([f46583f](https://github.com/rahmanazhar/StellarJS/commit/f46583f))
- fix(ci): Update @semantic-release/gitlab to v13.2.9 and fix cache configuration ([a927db5](https://github.com/rahmanazhar/StellarJS/commit/a927db5))
- feat: Add deployment infrastructure and update dependencies ([93fc1af](https://github.com/rahmanazhar/StellarJS/commit/93fc1af))
- feat: Add ESLint, Prettier, Jest configs and comprehensive tests ([54845b5](https://github.com/rahmanazhar/StellarJS/commit/54845b5))
- feat: Add routing and state management components with type safety ([62015bd](https://github.com/rahmanazhar/StellarJS/commit/62015bd))
- feat: add testing utilities and configuration validation ([564e55e](https://github.com/rahmanazhar/StellarJS/commit/564e55e))
- feat: Implement automated npm publishing and release process ([658d8e1](https://github.com/rahmanazhar/StellarJS/commit/658d8e1))
- feat: Implement GitLab CI/CD pipeline and semantic-release configuration ([05eb191](https://github.com/rahmanazhar/StellarJS/commit/05eb191))
- feat: Initialize StellarJS CRUD Example with full stack implementation ([351c190](https://github.com/rahmanazhar/StellarJS/commit/351c190))
- feat: Refactor index.ts for improved structure and logging ([0bd9400](https://github.com/rahmanazhar/StellarJS/commit/0bd9400))
- chore: Remove new-crud-app project files ([9fed6cd](https://github.com/rahmanazhar/StellarJS/commit/9fed6cd))
- main: initial commit ([502c438](https://github.com/rahmanazhar/StellarJS/commit/502c438))

## [1.0.0] - 2025-10-31

### 🎉 Major Release - Enterprise Security & Production Ready

This is the first major release of StellarJS, marking it as production-ready with comprehensive security features and enterprise-grade capabilities.

### ✨ Added

#### Security Features

- **Comprehensive Security Middleware Stack**

  - Helmet integration for security headers (CSP, HSTS, X-Frame-Options, etc.)
  - XSS (Cross-Site Scripting) protection with automatic sanitization
  - NoSQL injection protection with MongoDB sanitizer
  - HTTP Parameter Pollution (HPP) protection
  - Automatic input sanitization for body, query, and params
  - Security profiles (maximum, balanced, development, api)

- **Advanced CORS Management**

  - Flexible CORS configuration with multiple strategies
  - Origin whitelisting and blacklisting
  - Dynamic origin validation with custom functions
  - Preset configurations (public, development, production, single-origin, mobile, internal)
  - Pre-flight request handling with caching
  - Wildcard support with fine-grained control
  - Automatic environment-based configuration

- **Rate Limiting**

  - Configurable rate limiting per endpoint
  - Multiple rate limit strategies (IP-based, user-based, API key-based)
  - Custom key generators for flexible identification
  - Skip successful/failed requests options
  - Customizable response handlers
  - Memory-efficient token bucket implementation

- **Input Validation**

  - Joi-based schema validation for requests
  - Multi-target validation (body, query, params, headers)
  - Common validation schemas (email, password, UUID, ObjectId, URL, phone, etc.)
  - File upload validation (size, type, required)
  - Custom validation rules and extensions
  - Automatic sanitization during validation
  - Batch validation support

- **API Key Authentication**

  - Header and query parameter-based API key validation
  - Simple key list validation
  - Custom async validation functions
  - Path exclusion support (regex and string)
  - Database-backed API key validation

- **Audit Logging System**

  - Comprehensive audit trail for all operations
  - Automatic request/response logging
  - Security event tracking (login, logout, access denied, etc.)
  - Configurable event types and severity levels
  - Actor, resource, and action tracking
  - Sensitive data redaction in logs
  - Query interface for audit log analysis
  - In-memory and extensible storage backends

- **Security Utilities**
  - Secure random string and token generation
  - API key generation with prefixes
  - SHA-256 and SHA-512 hashing
  - HMAC signature generation and verification
  - AES-256-GCM encryption/decryption
  - CSRF token generation and validation
  - Session ID generation
  - Password strength checker with suggestions
  - Data masking (email, credit card, sensitive fields)
  - Request fingerprinting
  - Constant-time string comparison
  - OTP (One-Time Password) generation
  - JWT secret generation
  - ID obfuscation
  - Time-based token signatures with expiry
  - UUID v4 generation
  - Secure random number generation

#### Access Control

- **IP Whitelisting/Blacklisting**

  - Allow or block specific IP addresses
  - Support for CIDR ranges
  - Multiple IP management

- **Content-Type Validation**

  - Enforce specific content types per endpoint
  - Multiple allowed types support

- **Request Size Limiting**
  - Configurable maximum request sizes
  - Protection against large payload attacks

#### Developer Experience

- **Better Error Handling**

  - Structured error responses
  - Development vs production error details
  - Error logging with stack traces

- **Request Tracking**

  - Automatic request ID generation
  - Request/response correlation
  - Performance metrics (response time)

- **Enhanced Logging**
  - Colored console output
  - Structured logging format
  - Log levels (info, warn, error, debug)
  - Request/response logging middleware

#### Configuration

- **Flexible Server Configuration**

  - Environment-based configuration
  - TypeScript-first configuration interface
  - Security presets for different environments
  - Trust proxy configuration for load balancers

- **Type Safety**
  - Comprehensive TypeScript types for all security features
  - Strict type checking
  - IntelliSense support

### 🔒 Security

- **Default Secure Configuration**

  - Security features enabled by default in production
  - Reasonable defaults for all security middleware
  - Automatic HTTPS enforcement (when available)
  - Secure headers by default

- **Input Sanitization**

  - All user inputs sanitized automatically
  - XSS prevention through HTML escaping
  - NoSQL injection prevention
  - Parameter pollution protection

- **Authentication Enhancements**
  - Stronger password requirements
  - Token expiration and refresh
  - Role-based access control (RBAC)
  - Multiple authentication strategies

### 📚 Documentation

- **Comprehensive Security Guide** (`docs/SECURITY.md`)

  - Detailed examples for all security features
  - Best practices and recommendations
  - Migration guide from v0.x
  - Production configuration examples

- **API Documentation Updates**
  - Security middleware documentation
  - CORS configuration guide
  - Validation examples
  - Audit logging guide

### 🔄 Changed

- **Server Initialization**

  - Enhanced StellarServer with security by default
  - Better error handling during startup
  - Graceful shutdown support
  - Health check endpoint

- **Middleware Stack**
  - Reorganized middleware order for optimal security
  - Request ID added before all other middleware
  - Error handler moved to end of chain
  - Improved middleware composition

### 🏗️ Infrastructure

- **Dependencies**
  - Added `helmet` (^7.1.0) - Security headers
  - Added `express-rate-limit` (^7.1.5) - Rate limiting
  - Added `express-mongo-sanitize` (^2.2.0) - NoSQL injection protection
  - Added `hpp` (^0.2.3) - HTTP parameter pollution protection
  - Added `xss-clean` (^0.1.4) - XSS protection
  - Added `joi` (^17.11.0) - Schema validation
  - Added `validator` (^13.11.0) - Input validation utilities
  - Added `crypto-js` (^4.2.0) - Additional crypto utilities
  - Updated all dependencies to latest stable versions

### 🔧 Improvements

- **Performance**

  - Optimized middleware execution
  - Efficient rate limiting with token bucket
  - Minimal overhead from security features
  - Lazy loading of audit logs

- **Error Messages**

  - More descriptive error messages
  - Consistent error response format
  - Error codes for programmatic handling

- **Type Definitions**
  - Improved TypeScript definitions
  - Better IntelliSense support
  - Stricter type checking

### 📦 Internal

- **Code Organization**
  - New `server/cors.ts` - CORS management
  - New `server/security.ts` - Security middleware
  - New `server/validation.ts` - Input validation
  - New `server/audit.ts` - Audit logging
  - New `utils/security.ts` - Security utilities
  - Refactored middleware structure

### 🐛 Bug Fixes

- Fixed CORS pre-flight handling
- Fixed rate limiter edge cases with multiple requests
- Fixed error handler middleware ordering
- Fixed type safety issues in validation

### ⚠️ Breaking Changes

None - This release is designed to be backward compatible with v0.x configurations. However, security features are now enabled by default, which may affect applications that rely on less secure defaults.

### 📈 Migration Guide

#### From v0.x to v1.0.0

1. **Update package.json**

   ```json
   {
     "dependencies": {
       "stellar-js": "^1.0.0"
     }
   }
   ```

2. **Review Security Configuration**

   - Security features are now enabled by default
   - Configure CORS explicitly for production
   - Set up audit logging if needed

3. **Update Server Configuration**

   ```typescript
   // Old (v0.x)
   const server = createServer({
     port: 3000,
     auth: { jwtSecret: 'secret' },
   });

   // New (v1.0.0) - Same code works, but with added security!
   const server = createServer({
     port: 3000,
     auth: { jwtSecret: 'secret' },
     // Optional: Customize security
     security: {
       /* ... */
     },
     cors: { origins: ['https://yourdomain.com'] },
   });
   ```

4. **Adopt New Validation** (Recommended)

   ```typescript
   // Replace custom validation with Joi schemas
   import { validate, Joi } from 'stellar-js';

   router.post('/user', validate(Joi.object({ email: Joi.string().email() })), handler);
   ```

### 🎯 Roadmap for v1.1.0

- Database encryption at rest
- Advanced threat detection
- Redis-based rate limiting
- Distributed audit logging
- OAuth2 support
- Two-factor authentication (2FA)
- WebSocket security
- GraphQL security middleware

### 🙏 Acknowledgments

This release brings StellarJS to production-ready status with enterprise-grade security. Special thanks to the community for feedback and suggestions.

### 📝 Notes

- All security features are battle-tested and based on industry standards
- Documentation includes comprehensive examples and best practices
- Security auditing recommended before deploying to production
- Regular updates will be provided for security patches

---

## [0.1.0] - 2023-XX-XX

### Initial Release

- Basic server setup with Express
- React integration
- Simple authentication
- Basic middleware
- CLI tools for project creation
- TypeScript support

---

For more details, see the [documentation](./docs/) or visit [https://stellarjs.dev](https://stellarjs.dev).

## Support

- [GitHub Issues](https://github.com/rahmanazhar/StellarJS/issues)
- [Discussions](https://github.com/rahmanazhar/StellarJS/discussions)
- [Discord](https://discord.gg/stellarjs)
- [Twitter](https://twitter.com/StellarJSdev)
