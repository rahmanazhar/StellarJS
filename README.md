# StellarJS Framework

<div align="center">
  <h1>StellarJS</h1>
  <p><strong>A fullstack JavaScript framework combining React with Express microservices</strong></p>
  <p>
    <a href="https://github.com/rahmanazhar/StellarJS/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/rahmanazhar/StellarJS" alt="License">
    </a>
    <a href="https://www.npmjs.com/package/@rahmanazhar/stellar-js">
      <img src="https://img.shields.io/npm/v/@rahmanazhar/stellar-js" alt="npm version">
    </a>
    <a href="https://github.com/rahmanazhar/StellarJS/stargazers">
      <img src="https://img.shields.io/github/stars/rahmanazhar/StellarJS" alt="GitHub Stars">
    </a>
  </p>
</div>

## Features

- **Integrated Frontend & Backend** — React frontend + Express server in one package
- **Built-in Authentication** — MongoDB-backed login/register with bcrypt hashing, JWT tokens, password reset, and role-based access control
- **Microservices Architecture** — `ServiceRegistry` for service discovery and `InterServiceClient` for service-to-service HTTP calls with retries
- **Enterprise Security** — Helmet, rate limiting, XSS protection, NoSQL injection prevention, HPP, CORS, and input sanitization via Joi
- **Audit Logging** — Queryable audit trail for authentication, data access, and security events
- **CLI Tools** — Scaffold projects and generate components/services from the terminal
- **TypeScript** — First-class TypeScript support with full type exports
- **Custom Hooks** — `useService` and `useStellarPhp` for data fetching and state management

## Requirements

- Node.js >= 14
- MongoDB (required for `AuthService` and `UserService`)

## Installation

```bash
# Create a new project (recommended)
npx @rahmanazhar/stellar-js create my-app

# Or install globally
npm install -g @rahmanazhar/stellar-js
stellar create my-app
```

## Quick Start

```bash
npx @rahmanazhar/stellar-js create my-app
cd my-app
npm run dev
```

Frontend runs at `http://localhost:3001`, backend at `http://localhost:3000`.

## Server Setup

```typescript
import { createServer, initDatabase } from '@rahmanazhar/stellar-js';

// Connect MongoDB first
await initDatabase({ uri: process.env.MONGODB_URI! });

const server = createServer({
  port: 3000,
  auth: {
    jwtSecret: process.env.JWT_SECRET!,
    tokenExpiration: '24h',
  },
  security: {
    helmet: true,
    rateLimit: true,
    xss: true,
    noSqlInjection: true,
    hpp: true,
    sanitization: true,
  },
  cors: {
    origins: ['https://yourdomain.com'],
    credentials: true,
  },
});

await server.start();
```

## Authentication

`AuthService` uses MongoDB (`UserModel`) for all operations. No stubs — passwords are bcrypt-hashed, tokens are JWT-signed.

```typescript
import { createServer, createAuthService, initDatabase } from '@rahmanazhar/stellar-js';

await initDatabase({ uri: process.env.MONGODB_URI! });

const server = createServer({ port: 3000, auth: { jwtSecret: process.env.JWT_SECRET! } });
const auth = createAuthService({ jwtSecret: process.env.JWT_SECRET! });

server.registerService({
  name: 'auth',
  routes: [
    { path: '/login', method: 'POST', handler: auth.login.bind(auth) },
    { path: '/register', method: 'POST', handler: auth.register.bind(auth) },
    { path: '/forgot-password', method: 'POST', handler: auth.forgotPassword.bind(auth) },
    { path: '/reset-password', method: 'POST', handler: auth.resetPassword.bind(auth) },
  ],
});

// Protect a route
server.registerService({
  name: 'profile',
  routes: [
    {
      path: '/me',
      method: 'GET',
      middleware: [auth.authenticateToken.bind(auth)],
      handler: (req, res) => res.json({ user: (req as any).user }),
    },
  ],
});
```

### Auth endpoints

| Method | Path                        | Description                        |
| ------ | --------------------------- | ---------------------------------- |
| `POST` | `/api/auth/login`           | Returns JWT + user object          |
| `POST` | `/api/auth/register`        | Creates user, returns JWT          |
| `POST` | `/api/auth/forgot-password` | Issues a 10-min reset token        |
| `POST` | `/api/auth/reset-password`  | Validates token, sets new password |

## Microservices

```typescript
import {
  initServiceRegistry,
  createInterServiceClient,
  createServer,
} from '@rahmanazhar/stellar-js';

// Register services on startup
const registry = initServiceRegistry();
registry.register({ name: 'payments', version: '1.0.0', host: 'localhost', port: 4001 });
registry.register({ name: 'notifications', version: '1.0.0', host: 'localhost', port: 4002 });

// Call another service from a route handler
const client = createInterServiceClient(registry);

server.registerService({
  name: 'orders',
  routes: [
    {
      path: '/',
      method: 'POST',
      handler: async (req, res) => {
        const order = req.body;
        // Inter-service call with automatic retries
        await client.post('payments', '/api/charge', { amount: order.total });
        await client.post('notifications', '/api/email', { to: order.email });
        res.status(201).json({ order });
      },
    },
  ],
});
```

The registry periodically health-checks each registered service (`GET /health`) and marks unhealthy instances so `InterServiceClient` can skip them.

## React Hooks

```typescript
import { useService } from '@rahmanazhar/stellar-js';

function UserList() {
  const { data, loading, error } = useService('user', 'getUsers', { immediate: true });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.map((user: any) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## CLI Commands

```bash
# Scaffold a new project
stellar create my-app
stellar create my-app --typescript

# Generate files
stellar generate component UserList
stellar generate component UserList --php   # with PHP API client
stellar generate service  Payments

# Development
stellar dev               # starts frontend (port 3001) + backend (port 3000)
stellar dev --port 4000   # custom port

# Production
stellar build
stellar deploy apache  --domain example.com
stellar deploy nginx   --domain example.com
```

## Security

All security features are enabled when `NODE_ENV=production` with no configuration required:

| Feature                    | Default (prod) | Description                             |
| -------------------------- | -------------- | --------------------------------------- |
| Helmet                     | on             | Secure HTTP headers                     |
| Rate limiting              | on             | 100 req / 15 min per IP                 |
| XSS protection             | on             | Sanitize request bodies                 |
| NoSQL injection prevention | on             | Strip `$` and `.` from inputs           |
| HPP                        | on             | HTTP Parameter Pollution protection     |
| Input sanitization         | on             | Whitespace trim and encoding            |
| CORS                       | configurable   | Whitelist, wildcard, or dynamic origins |

See [docs/SECURITY.md](./docs/SECURITY.md) for advanced configuration.

## User Model

`UserModel` is a Mongoose model exported directly for use in your own code:

```typescript
import { UserModel } from '@rahmanazhar/stellar-js';

const user = await UserModel.findOne({ email: 'user@example.com' });
const allAdmins = await UserModel.find({ roles: 'admin' });
```

Fields: `email`, `name`, `roles` (default `['user']`), `isActive`, `lastLogin`, `passwordResetToken`, `passwordResetExpires`, `createdAt`, `updatedAt`.
Password is always `select: false` — use `user.comparePassword(candidate)` to verify.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, etc.)
4. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

## License

Copyright © 2024 [Rahman Azhar](https://github.com/rahmanazhar).
MIT licensed — see [LICENSE](LICENSE).
