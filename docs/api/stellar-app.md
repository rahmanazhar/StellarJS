# StellarApp API Reference

The `StellarApp` component is the core component of StellarJS that provides configuration and context to your application.

## Import

```typescript
import { StellarApp } from 'stellar-js';
```

## Props

### `config`

- Type: `AppConfig`
- Required: `true`

The main configuration object for your StellarJS application.

```typescript
interface AppConfig {
  apiUrl: string;
  auth: AuthConfig;
  services: Record<string, any>;
}

interface AuthConfig {
  jwtSecret: string;
  tokenExpiration?: string;
}
```

### `children`

- Type: `React.ReactNode`
- Required: `true`

The child components of your application.

## Example Usage

### Basic Setup

```typescript
import React from 'react';
import { StellarApp } from 'stellar-js';
import Router from './Router';

const config = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    tokenExpiration: '24h'
  },
  services: {
    // Your service configurations
  }
};

function App() {
  return (
    <StellarApp config={config}>
      <Router />
    </StellarApp>
  );
}

export default App;
```

### With Custom Services

```typescript
import React from 'react';
import { StellarApp } from 'stellar-js';
import { UserService } from './services/UserService';
import { ProductService } from './services/ProductService';

const config = {
  apiUrl: 'http://localhost:3000',
  auth: {
    jwtSecret: 'your-secret-key',
    tokenExpiration: '24h'
  },
  services: {
    user: new UserService(),
    product: new ProductService()
  }
};

function App() {
  return (
    <StellarApp config={config}>
      <div>
        <h1>My StellarJS App</h1>
        {/* Your app components */}
      </div>
    </StellarApp>
  );
}
```

### With Environment Variables

```typescript
import React from 'react';
import { StellarApp } from 'stellar-js';

const config = {
  apiUrl: process.env.REACT_APP_API_URL,
  auth: {
    jwtSecret: process.env.REACT_APP_JWT_SECRET,
    tokenExpiration: process.env.REACT_APP_TOKEN_EXPIRATION || '24h'
  },
  services: {
    // Service configurations
  }
};

function App() {
  return (
    <StellarApp config={config}>
      <div>
        {/* Your app components */}
      </div>
    </StellarApp>
  );
}
```

## Context Usage

The `StellarApp` component provides a context that can be accessed using the `useStellar` hook:

```typescript
import { useStellar } from 'stellar-js';

function MyComponent() {
  const { config } = useStellar();
  
  return (
    <div>
      <p>API URL: {config.apiUrl}</p>
    </div>
  );
}
```

## Error Handling

The `StellarApp` component includes error boundary functionality to catch and handle errors in your application:

```typescript
import { StellarApp } from 'stellar-js';

function App() {
  return (
    <StellarApp 
      config={config}
      onError={(error) => {
        // Handle error
        console.error('Application error:', error);
      }}
    >
      {/* Your app components */}
    </StellarApp>
  );
}
```

## Best Practices

1. **Configuration Management**
   - Keep sensitive information in environment variables
   - Use different configurations for development and production
   - Validate configuration at startup

2. **Service Organization**
   - Group related services together
   - Use meaningful service names
   - Initialize services with proper configuration

3. **Error Handling**
   - Implement proper error boundaries
   - Log errors appropriately
   - Provide user-friendly error messages

4. **Type Safety**
   - Use TypeScript interfaces for configuration
   - Define service types explicitly
   - Leverage type inference where possible

## Related

- [StellarProvider](./stellar-provider.md)
- [useService Hook](./use-service.md)
- [Authentication](./authentication.md)
