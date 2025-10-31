# StellarJS Framework

<div align="center">
  <h1>⭐ StellarJS</h1>
  <p><strong>A modern fullstack JavaScript framework combining React with microservices architecture</strong></p>
  <p>
    <a href="https://github.com/rahmanazhar/StellarJS/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/rahmanazhar/StellarJS" alt="License">
    </a>
    <a href="https://www.npmjs.com/package/stellar-js">
      <img src="https://img.shields.io/npm/v/stellar-js" alt="npm version">
    </a>
    <a href="https://github.com/rahmanazhar/StellarJS/stargazers">
      <img src="https://img.shields.io/github/stars/rahmanazhar/StellarJS" alt="GitHub Stars">
    </a>
  </p>
</div>

## ✨ Features

- 🚀 **Integrated Frontend & Backend**: Seamlessly combine React frontend with Express-based microservices
- 🔒 **Enterprise-Grade Security**: Production-ready security with Helmet, rate limiting, XSS protection, CSRF tokens, and input sanitization
- 🌐 **Advanced CORS Management**: Flexible CORS configuration with whitelist, dynamic origins, and preset configurations
- 🛡️ **Input Validation**: Schema-based validation with Joi, automatic sanitization, and file upload validation
- 🔑 **Multiple Auth Options**: JWT authentication, API key validation, and role-based access control
- 📊 **Audit Logging**: Comprehensive audit trail for security events, authentication, and data access
- ⚡️ **Built-in Authentication**: Ready-to-use authentication service with JWT support and password policies
- 🎯 **TypeScript Support**: First-class TypeScript support out of the box
- 🔄 **Custom Hooks**: Powerful hooks for service integration and state management
- 🛠 **CLI Tools**: Efficient development workflow with project scaffolding and code generation
- 📦 **Microservices Architecture**: Built-in support for microservices development
- 🎨 **Customizable**: Flexible configuration and extensible architecture

## 📦 Installation

```bash
# Create a new project using npx (recommended)
npx stellar-js create my-app

# Or install globally
npm install -g stellar-js
stellar create my-app
```

## 🚀 Quick Start

```bash
# Create a new StellarJS project
npx stellar-js create my-app

# Navigate to project directory
cd my-app

# Start development server
npm run dev
```

Visit [http://localhost:3001](http://localhost:3001) to see your app in action!

### Secure by Default

StellarJS v1.0.0 comes with enterprise-grade security enabled out of the box:

```typescript
import { createServer } from 'stellar-js';

const server = createServer({
  port: 3000,
  auth: {
    jwtSecret: process.env.JWT_SECRET!,
  },
  // Security features enabled by default!
  security: {
    helmet: true, // Security headers
    rateLimit: true, // Rate limiting (100 req/15min)
    xss: true, // XSS protection
    noSqlInjection: true, // NoSQL injection prevention
    hpp: true, // HTTP Parameter Pollution protection
    sanitization: true, // Automatic input sanitization
  },
  cors: {
    origins: ['https://yourdomain.com'],
    credentials: true,
  },
});

await server.start();
```

See [Security Documentation](./docs/SECURITY.md) for advanced configurations.

## 📚 Documentation

For detailed documentation, visit our [Documentation Site](https://stellarjs.dev):

- [Getting Started Guide](https://stellarjs.dev/guide/getting-started)
- [Core Concepts](https://stellarjs.dev/guide/architecture)
- [API Reference](https://stellarjs.dev/api/)
- [Examples](https://stellarjs.dev/examples/)

## 🌟 Example Usage

### Service Definition

```typescript
// Define your service
class UserService {
  async getUsers() {
    return [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
    ];
  }
}
```

### React Component

```typescript
// Use in components
function UserList() {
  const { data, loading } = useService('user', 'getUsers');

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {data.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## 🛠 CLI Commands

```bash
# Create new project
stellar create my-app

# Generate components/services
stellar generate component UserList
stellar generate service User

# Development
stellar dev

# Production build
stellar build
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 💬 Community

- [GitHub Discussions](https://github.com/rahmanazhar/StellarJS/discussions)
- [Discord Server](https://discord.gg/stellarjs)
- [Twitter](https://twitter.com/StellarJSdev)

## � Security

StellarJS takes security seriously. Version 1.0.0 includes:

- ✅ **Helmet** - Secure HTTP headers
- ✅ **Rate Limiting** - Prevent brute force attacks
- ✅ **XSS Protection** - Sanitize inputs
- ✅ **NoSQL Injection Prevention** - Protect your database
- ✅ **CORS** - Flexible cross-origin configuration
- ✅ **Input Validation** - Schema-based with Joi
- ✅ **Audit Logging** - Track all security events
- ✅ **API Key Authentication** - Secure service-to-service communication

See [Security Documentation](./docs/SECURITY.md) for details.

## 📊 What's New in v1.0.0

🎉 **Major Release** - Production ready with enterprise-grade security!

- 🔒 Comprehensive security middleware (Helmet, XSS, rate limiting, etc.)
- 🌐 Advanced CORS management with presets and dynamic validation
- 🛡️ Schema-based validation with Joi
- 🔑 Multiple authentication strategies (JWT, API keys, RBAC)
- 📊 Audit logging system with queryable events
- 🔐 Security utilities (encryption, hashing, token generation)
- ⚡ Performance optimized with minimal overhead
- 📚 Extensive documentation and examples

See [CHANGELOG.md](./CHANGELOG.md) for complete details.

## �📝 License

Copyright © 2023 [Rahman Azhar](https://github.com/rahmanazhar).
This project is [MIT](LICENSE) licensed.
