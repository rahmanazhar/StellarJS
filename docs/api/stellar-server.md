# StellarServer API Reference

The `StellarServer` class is the core server-side component of StellarJS that handles HTTP requests, services, and middleware integration.

## Import

```typescript
import { StellarServer, createServer } from 'stellar-js/server';
```

## Constructor

### `new StellarServer(config)`

Creates a new instance of StellarServer.

```typescript
interface ServerConfig {
  port: number;
  auth: AuthConfig;
  services?: Record<string, any>;
}

interface AuthConfig {
  jwtSecret: string;
  tokenExpiration?: string;
}
```

## Methods

### `registerService(serviceConfig)`

Registers a new service with the server.

```typescript
interface ServiceConfig {
  name: string;
  routes: Route[];
}

interface Route {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: (req: Request, res: Response) => void;
  middleware?: ((req: Request, res: Response, next: NextFunction) => void)[];
}
```

Example:

```typescript
server.registerService({
  name: 'users',
  routes: [
    {
      path: '/users',
      method: 'GET',
      handler: async (req, res) => {
        // Handle GET /api/users
      },
    },
  ],
});
```

### `use(middleware)`

Adds middleware to the server.

```typescript
use(middleware: (req: Request, res: Response, next: NextFunction) => void): void
```

Example:

```typescript
server.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### `start()`

Starts the server on the configured port.

```typescript
async start(): Promise<void>
```

Example:

```typescript
await server.start();
```

### `stop()`

Gracefully stops the server.

```typescript
async stop(): Promise<void>
```

Example:

```typescript
await server.stop();
```

### `getApp()`

Returns the underlying Express application instance.

```typescript
getApp(): Express
```

### `getService(name)`

Retrieves a registered service by name.

```typescript
getService(name: string): any
```

## Example Usage

### Basic Server Setup

```typescript
import { createServer } from 'stellar-js/server';

const server = createServer({
  port: 3000,
  auth: {
    jwtSecret: process.env.JWT_SECRET,
  },
});

// Register middleware
server.use(cors());
server.use(express.json());

// Start server
await server.start();
```

### Service Registration

```typescript
import { createServer } from 'stellar-js/server';
import { UserService } from './services/UserService';

const server = createServer({
  port: 3000,
  auth: {
    jwtSecret: process.env.JWT_SECRET,
  },
});

// Register user service
server.registerService({
  name: 'users',
  routes: [
    {
      path: '/users',
      method: 'GET',
      handler: async (req, res) => {
        const users = await UserService.getUsers();
        res.json(users);
      },
    },
    {
      path: '/users',
      method: 'POST',
      middleware: [authService.authenticateToken],
      handler: async (req, res) => {
        const user = await UserService.createUser(req.body);
        res.status(201).json(user);
      },
    },
  ],
});

await server.start();
```

### With Authentication

```typescript
import { createServer } from 'stellar-js/server';
import { createAuthService } from 'stellar-js/services';

const server = createServer({
  port: 3000,
  auth: {
    jwtSecret: process.env.JWT_SECRET,
  },
});

const authService = createAuthService({
  jwtSecret: process.env.JWT_SECRET,
});

// Register auth routes
server.registerService({
  name: 'auth',
  routes: [
    {
      path: '/login',
      method: 'POST',
      handler: authService.login,
    },
    {
      path: '/register',
      method: 'POST',
      handler: authService.register,
    },
  ],
});

// Protected route example
server.registerService({
  name: 'protected',
  routes: [
    {
      path: '/data',
      method: 'GET',
      middleware: [authService.authenticateToken],
      handler: async (req, res) => {
        res.json({ data: 'Protected data' });
      },
    },
  ],
});
```

## Error Handling

The server includes built-in error handling middleware:

```typescript
import { createServer } from 'stellar-js/server';

const server = createServer({
  port: 3000,
  auth: {
    jwtSecret: process.env.JWT_SECRET,
  },
});

// Custom error handler
server.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message,
  });
});
```

## Best Practices

1. **Service Organization**

   - Group related routes under a single service
   - Use meaningful service names
   - Implement proper error handling in route handlers

2. **Middleware Usage**

   - Apply authentication middleware where needed
   - Use middleware for request validation
   - Implement logging middleware for debugging

3. **Security**

   - Always use HTTPS in production
   - Implement rate limiting
   - Validate and sanitize input
   - Use proper CORS configuration

4. **Performance**
   - Implement caching where appropriate
   - Use compression middleware
   - Handle file uploads efficiently

## Related

- [Authentication](./authentication.md)
- [Middleware](../guide/middleware.md)
- [Services](../guide/services.md)
