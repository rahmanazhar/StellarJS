# Authentication API Reference

StellarJS provides a comprehensive authentication system through the `AuthService` and `useAuth` hook.

## AuthService

### Import

```typescript
import { AuthService, createAuthService } from 'stellar-js/services';
```

### Configuration

```typescript
interface AuthConfig {
  jwtSecret: string;
  tokenExpiration?: string;
  refreshToken?: boolean;
}
```

### Methods

#### `login(req: Request, res: Response)`

Handles user login requests.

```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    roles?: string[];
  };
}
```

Example:

```typescript
authService.login(req, res);
```

#### `register(req: Request, res: Response)`

Handles user registration requests.

```typescript
interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

interface RegisterResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}
```

Example:

```typescript
authService.register(req, res);
```

#### `authenticateToken(req: Request, res: Response, next: NextFunction)`

Middleware to verify JWT tokens.

Example:

```typescript
app.use('/api/protected', authService.authenticateToken);
```

#### `requireRoles(roles: string[])`

Middleware factory for role-based authorization.

Example:

```typescript
app.use('/api/admin', authService.requireRoles(['admin']));
```

## useAuth Hook

### Import

```typescript
import { useAuth } from 'stellar-js/hooks';
```

### Usage

```typescript
const { login, register, logout, user, isAuthenticated, isLoading, error } = useAuth();
```

### Return Value

| Property          | Type                                                        | Description                                        |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| `login`           | `(credentials: LoginCredentials) => Promise<LoginResponse>` | Function to log in a user                          |
| `register`        | `(data: RegisterData) => Promise<RegisterResponse>`         | Function to register a new user                    |
| `logout`          | `() => void`                                                | Function to log out the current user               |
| `user`            | `User \| null`                                              | The currently authenticated user                   |
| `isAuthenticated` | `boolean`                                                   | Whether a user is currently authenticated          |
| `isLoading`       | `boolean`                                                   | Whether an authentication operation is in progress |
| `error`           | `Error \| null`                                             | Any authentication error that occurred             |

## Examples

### Server-Side Setup

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
  tokenExpiration: '24h',
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
  name: 'users',
  routes: [
    {
      path: '/profile',
      method: 'GET',
      middleware: [authService.authenticateToken],
      handler: async (req, res) => {
        res.json(req.user);
      },
    },
    {
      path: '/admin',
      method: 'GET',
      middleware: [authService.authenticateToken, authService.requireRoles(['admin'])],
      handler: async (req, res) => {
        res.json({ message: 'Admin access granted' });
      },
    },
  ],
});
```

### Client-Side Authentication

#### Login Form

```typescript
function LoginForm() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      // Redirect or update UI
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error.message}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

#### Protected Route Component

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : null;
}
```

#### User Profile

```typescript
function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <button onClick={logout}>Logout</button>
      {user.roles?.includes('admin') && (
        <div>
          <h2>Admin Panel</h2>
          {/* Admin-only content */}
        </div>
      )}
    </div>
  );
}
```

## Best Practices

1. **Security**

   - Always use HTTPS in production
   - Implement proper password hashing
   - Use secure session management
   - Implement rate limiting for auth endpoints

2. **Token Management**

   - Store tokens securely
   - Implement token refresh mechanism
   - Clear tokens on logout
   - Handle token expiration

3. **Error Handling**

   - Provide clear error messages
   - Implement proper validation
   - Handle network errors
   - Log security events

4. **User Experience**
   - Show loading states
   - Provide feedback on actions
   - Implement remember me functionality
   - Handle session expiration gracefully

## Related

- [useService Hook](./use-service.md)
- [Security Guide](../guide/security.md)
- [Server Configuration](./stellar-server.md)
