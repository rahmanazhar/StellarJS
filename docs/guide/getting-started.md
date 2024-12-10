# Getting Started with StellarJS

This guide will help you set up your first StellarJS project and understand the basics of the framework.

## Prerequisites

Before you begin, make sure you have:

- Node.js (version 14 or higher)
- npm or yarn package manager
- Basic knowledge of React and TypeScript

## Creating a New Project

The easiest way to get started with StellarJS is to create a new project using our CLI:

```bash
npx stellar-js create my-app
cd my-app
```

This command creates a new directory `my-app` with a basic project structure and all necessary dependencies.

## Project Structure

After creation, your project structure will look like this:

```
my-app/
├── src/
│   ├── components/     # React components
│   ├── services/      # Backend services
│   ├── pages/         # React pages/routes
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   └── types/         # TypeScript type definitions
├── public/            # Static files
├── tests/             # Test files
└── stellar.config.js  # Framework configuration
```

## Configuration

The `stellar.config.js` file in your project root contains your application configuration:

```javascript
module.exports = {
  // Server configuration
  server: {
    port: 3000,
    cors: {
      origin: '*'
    }
  },
  
  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    tokenExpiration: '24h'
  },
  
  // Service configuration
  services: {
    // Add your service configurations
  }
};
```

## Development Server

Start the development server:

```bash
npm run dev
```

This command starts both the frontend and backend servers:
- Frontend: [http://localhost:3001](http://localhost:3001)
- Backend: [http://localhost:3000](http://localhost:3000)

## Creating Your First Service

1. Generate a new service using the CLI:

```bash
stellar generate service user
```

2. This creates a new service in `src/services/user`:

```typescript
// src/services/user/UserService.ts
export class UserService {
  async getUsers() {
    // Implementation
    return [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' }
    ];
  }

  async createUser(userData: any) {
    // Implementation
    return { id: 3, ...userData };
  }
}
```

## Using Services in Components

1. Generate a new component:

```bash
stellar generate component UserList
```

2. Use the service in your component:

```typescript
// src/components/UserList/UserList.tsx
import React from 'react';
import { useService } from 'stellar-js/hooks';

export const UserList: React.FC = () => {
  const { data, loading, error } = useService('user', 'getUsers');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
};
```

## Authentication

StellarJS comes with built-in authentication. Here's how to use it:

1. Set up authentication configuration in `stellar.config.js`:

```javascript
module.exports = {
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    tokenExpiration: '24h'
  }
};
```

2. Use authentication in your components:

```typescript
import { useAuth } from 'stellar-js/hooks';

function LoginComponent() {
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    const result = await login({
      email: 'user@example.com',
      password: 'password'
    });

    if (result.success) {
      // Handle successful login
    }
  };

  return (
    <button onClick={handleLogin} disabled={isLoading}>
      {isLoading ? 'Logging in...' : 'Login'}
    </button>
  );
}
```

3. Protect your routes:

```typescript
import { authService } from 'stellar-js/services';

// Protect a route
app.use('/api/protected', authService.authenticateToken);

// Use role-based authorization
app.use('/api/admin', authService.requireRoles(['admin']));
```

## Building for Production

When you're ready to deploy your application:

```bash
npm run build
```

This creates an optimized production build in the `dist` directory.

## Next Steps

- Learn more about [Services](./services.md)
- Explore [Authentication](./authentication.md) features
- Understand [State Management](./state-management.md)
- Check out [Examples](../examples/index.md)

## Need Help?

- Check our [API Reference](../api/index.md)
- Join our [Discord Community](https://discord.gg/stellarjs)
- Report issues on [GitHub](https://github.com/rahmanazhar/StellarJS/issues)
