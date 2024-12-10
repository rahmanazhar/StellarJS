# useService Hook API Reference

The `useService` hook provides a convenient way to interact with StellarJS services in your React components.

## Import

```typescript
import { useService } from 'stellar-js/hooks';
```

## Type Definition

```typescript
function useService<T = any>(
  serviceName: string,
  method: string,
  options?: UseServiceOptions
): UseServiceResult<T>;

interface UseServiceOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseServiceResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  execute: (...args: any[]) => Promise<ServiceResponse<T>>;
  reset: () => void;
}

interface ServiceResponse<T> {
  data?: T;
  error?: string;
  status: number;
}
```

## Parameters

### `serviceName`
- Type: `string`
- Required: `true`
- Description: The name of the service to use

### `method`
- Type: `string`
- Required: `true`
- Description: The name of the method to call on the service

### `options`
- Type: `UseServiceOptions`
- Required: `false`
- Description: Configuration options for the hook

#### Options Object

| Option | Type | Description |
|--------|------|-------------|
| `immediate` | `boolean` | Whether to execute the service call immediately when the component mounts |
| `onSuccess` | `(data: any) => void` | Callback function called when the service call succeeds |
| `onError` | `(error: Error) => void` | Callback function called when the service call fails |

## Return Value

The hook returns an object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `data` | `T \| null` | The data returned from the service call |
| `error` | `Error \| null` | Any error that occurred during the service call |
| `loading` | `boolean` | Whether the service call is in progress |
| `execute` | `(...args: any[]) => Promise<ServiceResponse<T>>` | Function to manually execute the service call |
| `reset` | `() => void` | Function to reset the hook's state |

## Examples

### Basic Usage

```typescript
function UserList() {
  const { data, loading, error } = useService('user', 'getUsers');

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
```

### Manual Execution

```typescript
function CreateUser() {
  const { execute, loading } = useService('user', 'createUser');

  const handleSubmit = async (userData) => {
    try {
      const result = await execute(userData);
      console.log('User created:', result.data);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  return (
    <button onClick={() => handleSubmit({ name: 'John' })} disabled={loading}>
      Create User
    </button>
  );
}
```

### With Options

```typescript
function UserDashboard() {
  const { data, loading } = useService('user', 'getProfile', {
    immediate: true,
    onSuccess: (data) => {
      console.log('Profile loaded:', data);
    },
    onError: (error) => {
      console.error('Failed to load profile:', error);
    }
  });

  return (
    <div>
      {loading ? (
        <div>Loading profile...</div>
      ) : (
        <div>
          <h1>Welcome, {data?.name}</h1>
          <p>Email: {data?.email}</p>
        </div>
      )}
    </div>
  );
}
```

### With TypeScript

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile() {
  const { data, loading } = useService<User>('user', 'getProfile', {
    immediate: true
  });

  if (loading) return <div>Loading...</div>;

  return data ? (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  ) : null;
}
```

### Reset State

```typescript
function UserSearch() {
  const { data, loading, execute, reset } = useService('user', 'searchUsers');

  const handleSearch = async (query: string) => {
    if (!query) {
      reset(); // Clear previous results
      return;
    }
    await execute(query);
  };

  return (
    <div>
      <input
        type="text"
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search users..."
      />
      {loading ? (
        <div>Searching...</div>
      ) : (
        <ul>
          {data?.map(user => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Best Practices

1. **Type Safety**
   - Always use TypeScript generics to specify the expected data type
   - Define interfaces for your service responses

2. **Error Handling**
   - Always handle potential errors in your components
   - Provide user-friendly error messages
   - Use the onError callback for global error handling

3. **Loading States**
   - Show loading indicators during service calls
   - Disable form submissions while loading
   - Consider using skeleton loaders for better UX

4. **State Management**
   - Use the reset function when cleaning up
   - Consider the immediate option for data that should load with the component
   - Handle component unmounting properly

## Related

- [useAuth Hook](./use-auth.md)
- [Services Guide](../guide/services.md)
- [TypeScript Usage](../guide/typescript.md)
