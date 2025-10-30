/**
 * StellarJS Usage Examples
 * 
 * This file demonstrates how to use various features of the StellarJS framework
 */

// ============================================================================
// 1. BASIC SERVER SETUP
// ============================================================================

import { 
  createServer, 
  createAuthService,
  createUserService,
  requestLogger,
  errorHandler,
  securityHeaders
} from 'stellar-js';

// Create a basic server
const server = createServer({
  port: 3000,
  auth: {
    jwtSecret: 'your-secret-key',
    tokenExpiration: '24h'
  }
});

// Add middleware
server.use(requestLogger);
server.use(securityHeaders);

// Register services
const authService = createAuthService({
  jwtSecret: 'your-secret-key',
  tokenExpiration: '24h'
});

const userService = createUserService();

server.registerService({
  name: 'auth',
  routes: [
    { path: '/login', method: 'POST', handler: authService.login.bind(authService) },
    { path: '/register', method: 'POST', handler: authService.register.bind(authService) }
  ]
});

server.registerService({
  name: 'users',
  routes: [
    { path: '/', method: 'GET', handler: userService.getUsers.bind(userService) },
    { path: '/:id', method: 'GET', handler: userService.getUserById.bind(userService) },
    { path: '/', method: 'POST', handler: userService.createUser.bind(userService) },
    { path: '/:id', method: 'PUT', handler: userService.updateUser.bind(userService) },
    { path: '/:id', method: 'DELETE', handler: userService.deleteUser.bind(userService) }
  ]
});

// ============================================================================
// 2. DATABASE INTEGRATION
// ============================================================================

import { initDatabase } from 'stellar-js';

async function setupDatabase() {
  await initDatabase({
    uri: 'mongodb://localhost:27017/myapp',
    autoConnect: true
  });
}

// ============================================================================
// 3. API DOCUMENTATION
// ============================================================================

import { createApiDocGenerator } from 'stellar-js';

const docGenerator = createApiDocGenerator({
  title: 'My API Documentation',
  version: '1.0.0',
  baseUrl: 'http://localhost:3000'
});

// Register services with doc generator
docGenerator.registerService({
  name: 'auth',
  routes: [
    { path: '/login', method: 'POST', handler: () => {} },
    { path: '/register', method: 'POST', handler: () => {} }
  ]
});

// Setup documentation endpoints
const app = server.getApp();
docGenerator.setupDocEndpoint(app, '/api/docs');

// ============================================================================
// 4. VALIDATION
// ============================================================================

import { validate, validateRequest, commonSchemas } from 'stellar-js';

// Validate data
const result = validate(
  { email: 'test@example.com', password: 'password123' },
  commonSchemas.login
);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

// Use as middleware
app.post('/api/register', validateRequest(commonSchemas.register), (req, res) => {
  // Request body is validated
  res.json({ success: true });
});

// ============================================================================
// 5. CUSTOM ERROR HANDLING
// ============================================================================

import { 
  NotFoundError, 
  ValidationError, 
  AuthenticationError 
} from 'stellar-js';

app.get('/api/resource/:id', (req, res, next) => {
  const resource = null; // fetch from database
  
  if (!resource) {
    throw new NotFoundError('Resource not found');
  }
  
  res.json({ data: resource });
});

// Add error handler at the end
server.use(errorHandler);

// ============================================================================
// 6. REACT FRONTEND
// ============================================================================

import React from 'react';
import { 
  StellarApp, 
  useService, 
  useAuth,
  useAsync,
  useLocalStorage 
} from 'stellar-js';

// App configuration
const config = {
  apiUrl: 'http://localhost:3000',
  auth: {
    jwtSecret: 'your-secret-key'
  },
  services: {}
};

// Main App component
function App() {
  return (
    <StellarApp config={config}>
      <UserListComponent />
    </StellarApp>
  );
}

// Using service hook
function UserListComponent() {
  const { data, loading, error, execute } = useService('users', 'getUsers', {
    immediate: true
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// Using auth hook
function LoginComponent() {
  const { login, isLoading, error } = useAuth();

  const handleLogin = async () => {
    try {
      await login({ email: 'test@example.com', password: 'password' });
      // Redirect or update state
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <button onClick={handleLogin} disabled={isLoading}>
      {isLoading ? 'Logging in...' : 'Login'}
    </button>
  );
}

// Using async hook
function DataFetchComponent() {
  const fetchData = async () => {
    const response = await fetch('/api/data');
    return response.json();
  };

  const { execute, data, isPending, isError } = useAsync(fetchData);

  return (
    <div>
      <button onClick={execute}>Fetch Data</button>
      {isPending && <div>Loading...</div>}
      {isError && <div>Error loading data</div>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}

// Using localStorage hook
function PreferencesComponent() {
  const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
      <button onClick={() => setTheme('light')}>Light Mode</button>
      <button onClick={removeTheme}>Reset</button>
    </div>
  );
}

// ============================================================================
// 7. UTILITY FUNCTIONS
// ============================================================================

import { 
  createLogger,
  retry,
  debounce,
  deepClone,
  randomString 
} from 'stellar-js';

// Logger
const logger = createLogger('MyApp');
logger.info('Application started');
logger.error('An error occurred', new Error('test'));

// Retry with exponential backoff
const fetchWithRetry = async () => {
  return retry(
    async () => {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Request failed');
      return response.json();
    },
    {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000
    }
  );
};

// Debounce function
const debouncedSearch = debounce((query: string) => {
  console.log('Searching for:', query);
}, 500);

// Deep clone
const original = { a: 1, b: { c: 2 } };
const cloned = deepClone(original);

// Generate random string
const token = randomString(32);

// ============================================================================
// 8. CONFIGURATION MANAGEMENT
// ============================================================================

import { 
  loadConfig,
  validateServerConfig,
  isDevelopment,
  isProduction 
} from 'stellar-js';

const baseConfig = {
  port: 3000,
  auth: {
    jwtSecret: 'dev-secret'
  }
};

const envConfigs = {
  production: {
    port: 8080,
    auth: {
      jwtSecret: process.env.JWT_SECRET || ''
    }
  }
};

const finalConfig = loadConfig(baseConfig, envConfigs);

if (validateServerConfig(finalConfig)) {
  console.log('Config is valid');
}

if (isDevelopment()) {
  console.log('Running in development mode');
}

// ============================================================================
// 9. START THE SERVER
// ============================================================================

async function startApp() {
  try {
    // Setup database
    await setupDatabase();
    
    // Start server
    await server.start();
    
    console.log('Application is running!');
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Only run if this is the main module
if (require.main === module) {
  startApp();
}

export { server, startApp };
