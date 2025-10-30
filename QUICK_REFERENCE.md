# StellarJS Quick Reference

## Installation

```bash
npm install stellar-js
```

## Create New Project

```bash
npx stellar-js create my-app
cd my-app
npm run dev
```

## Server Setup

```typescript
import { createServer } from 'stellar-js';

const server = createServer({
  port: 3000,
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret'
  }
});

await server.start();
```

## Register Service

```typescript
import { createAuthService } from 'stellar-js';

const authService = createAuthService({
  jwtSecret: 'your-secret'
});

server.registerService({
  name: 'auth',
  routes: [
    { path: '/login', method: 'POST', handler: authService.login.bind(authService) },
    { path: '/register', method: 'POST', handler: authService.register.bind(authService) }
  ]
});
```

## Add Middleware

```typescript
import { requestLogger, errorHandler, securityHeaders } from 'stellar-js';

server.use(requestLogger);
server.use(securityHeaders);
server.use(errorHandler);
```

## Database Connection

```typescript
import { initDatabase } from 'stellar-js';

await initDatabase({
  uri: 'mongodb://localhost:27017/myapp',
  autoConnect: true
});
```

## React App

```typescript
import { StellarApp } from 'stellar-js';

const config = {
  apiUrl: 'http://localhost:3000',
  auth: { jwtSecret: 'your-secret' },
  services: {}
};

function App() {
  return (
    <StellarApp config={config}>
      <YourComponents />
    </StellarApp>
  );
}
```

## Use Service Hook

```typescript
import { useService } from 'stellar-js';

function UserList() {
  const { data, loading, error } = useService('users', 'getUsers', {
    immediate: true
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error!</div>;
  
  return <ul>{data.map(user => <li>{user.name}</li>)}</ul>;
}
```

## Authentication

```typescript
import { useAuth } from 'stellar-js';

function Login() {
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    await login({ email: 'user@example.com', password: 'pass' });
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

## Validation

```typescript
import { validate, validateRequest, commonSchemas } from 'stellar-js';

// Validate data
const result = validate(data, {
  email: { type: 'email', required: true },
  password: { type: 'string', required: true, min: 8 }
});

// Use as middleware
app.post('/register', validateRequest(commonSchemas.register), handler);
```

## Custom Errors

```typescript
import { NotFoundError, ValidationError } from 'stellar-js';

if (!user) {
  throw new NotFoundError('User not found');
}

if (!isValid) {
  throw new ValidationError('Invalid data', errors);
}
```

## Logging

```typescript
import { createLogger } from 'stellar-js';

const logger = createLogger('MyApp');
logger.info('App started');
logger.error('Error occurred', error);
logger.debug('Debug info');
```

## Utilities

```typescript
import { retry, debounce, deepClone, randomString } from 'stellar-js';

// Retry with backoff
const result = await retry(asyncFn, { maxRetries: 3 });

// Debounce function
const debouncedFn = debounce(fn, 500);

// Deep clone
const cloned = deepClone(original);

// Random string
const token = randomString(32);
```

## Storage Hooks

```typescript
import { useLocalStorage, useSessionStorage } from 'stellar-js';

// Local storage
const [value, setValue, removeValue] = useLocalStorage('key', 'default');

// Session storage
const [session, setSession] = useSessionStorage('session', {});
```

## Async Hook

```typescript
import { useAsync } from 'stellar-js';

const { execute, data, isPending } = useAsync(async () => {
  const res = await fetch('/api/data');
  return res.json();
});

// Call when needed
execute();
```

## API Documentation

```typescript
import { createApiDocGenerator } from 'stellar-js';

const docGen = createApiDocGenerator({
  title: 'My API',
  version: '1.0.0',
  baseUrl: 'http://localhost:3000'
});

docGen.setupDocEndpoint(app, '/api/docs');
// Visit /api/docs for HTML documentation
// Visit /api/docs/json for JSON
// Visit /api/docs/openapi for OpenAPI spec
```

## CLI Commands

```bash
# Create project
stellar create my-app

# Generate component
stellar generate component UserCard

# Generate service  
stellar generate service User

# Start dev server
stellar dev

# Build for production
stellar build
```

## Environment Variables

```bash
PORT=3000
JWT_SECRET=your-secret-key
NODE_ENV=production
DATABASE_URI=mongodb://localhost:27017/mydb
```

## Configuration

```typescript
import { loadConfig, isDevelopment } from 'stellar-js';

const config = loadConfig(baseConfig, envConfigs);

if (isDevelopment()) {
  console.log('Dev mode');
}
```

## Testing

```typescript
import { renderWithProviders, createMockService } from 'stellar-js';

const mockService = createMockService({
  getUsers: jest.fn().mockResolvedValue([])
});

renderWithProviders(<Component />, { services: { users: mockService } });
```

---

For more details, see the full documentation at https://github.com/rahmanazhar/StellarJS
