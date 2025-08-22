# GunDB React Hooks

[![npm version](https://badge.fury.io/js/%40altrx%2Fgundb-react-hooks.svg)](https://badge.fury.io/js/%40altrx%2Fgundb-react-hooks)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Type-safe, performant GunDB hooks for React/Preact with comprehensive error handling, loading states, and debugging utilities.

## Live Example
https://gun-react-todoapp.vercel.app/

Repo available at: https://github.com/alterx/gun-react-todoapp

## Features

- **Type-safe** - Comprehensive TypeScript definitions
- **Performant** - Optimized with memoization and proper cleanup
- **Reliable** - Built-in error handling and loading states
- **Developer-friendly** - Debug utilities and development warnings
- **Zero memory leaks** - Proper listener cleanup and memory management
- **React & Preact** - Support for both frameworks
- **Real-time** - Live updates with efficient debouncing
- **Authentication** - Built-in auth provider with key management and storage
- **Pagination** - High-performance paginated collections with smart caching

## Quick Start

### Installing

```bash
npm install @altrx/gundb-react-hooks
# or
yarn add @altrx/gundb-react-hooks
# or
pnpm add @altrx/gundb-react-hooks
```

### Basic Usage

```typescript
import React from 'react';
import Gun from 'gun';
import { useGun, useGunState, useGunCollectionState } from '@altrx/gundb-react-hooks';

function App() {
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });

  return <UserProfile gun={gun} />;
}

function UserProfile({ gun }) {
  const {
    fields: profile,
    put,
    error,
    isLoading
  } = useGunState(gun.get('user').get('profile'));

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.err}</div>;

  return (
    <div>
      <h1>{profile.name || 'Anonymous'}</h1>
      <button onClick={() => put({ name: 'John Doe' })}>
        Update Name
      </button>
    </div>
  );
}
```

### With Authentication

```typescript
import { AuthProvider, useAuth } from '@altrx/gundb-react-hooks';

function App() {
  return (
    <AuthProvider
      Gun={Gun}
      sea={Gun.SEA}
      storage={localStorage}
      gunOpts={{ peers: ['http://localhost:8765/gun'] }}
    >
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function AuthenticatedApp() {
  const { user, login, logout, isLoggedIn, appKeys } = useAuth();

  const { fields: profile, put } = useGunState(
    user?.get('profile'),
    { appKeys }
  );

  if (!isLoggedIn) {
    return (
      <div>
        <button onClick={() => login()}>Login</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {profile.name || 'User'}!</h1>
      <input
        value={profile.name || ''}
        onChange={(e) => put({ name: e.target.value })}
        placeholder="Enter your name"
      />
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}
```

### With Error Handling & TypeScript

```typescript
interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

interface TodoItem {
  text: string;
  completed: boolean;
  createdAt: string;
}

function TypeSafeApp() {
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });

  // Type-safe user profile
  const {
    fields: profile,
    put: updateProfile,
    error: profileError,
    isLoading: profileLoading
  } = useGunState<UserProfile>(gun.get('user').get('profile'));

  // Type-safe todo collection with pagination
  const {
    currentPageItems: todos,
    addToSet: addTodo,
    removeFromSet: removeTodo,
    updateInSet: updateTodo,
    error: todosError,
    totalItems: todoCount,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    pageSize,
    setPageSize
  } = useGunCollectionStatePaginated<TodoItem>(gun.get('todos'), {
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    preloadPages: 1
  });

  const handleAddTodo = async () => {
    try {
      await addTodo({
        text: 'New todo',
        completed: false,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  if (profileError || todosError) {
    return <ErrorComponent error={profileError || todosError} />;
  }

  return (
    <div>
      <h1>{profile.name}'s Todos ({todoCount})</h1>

      {/* Pagination Controls */}
      <div>
        <span>Page {currentPage + 1} of {totalPages}</span>
        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
        </select>
      </div>

      {/* Todo Items */}
      {todos.map(todo => (
        <TodoItem
          key={todo.nodeID}
          todo={todo}
          onToggle={() => updateTodo(todo.nodeID, { completed: !todo.completed })}
          onRemove={() => removeTodo(todo.nodeID)}
        />
      ))}

      {/* Pagination Navigation */}
      <div>
        <button onClick={prevPage} disabled={currentPage === 0}>
          Previous
        </button>
        <button onClick={nextPage} disabled={currentPage >= totalPages - 1}>
          Next
        </button>
      </div>

      <button onClick={handleAddTodo}>Add Todo</button>
    </div>
  );
}
```

## API Reference

## API Reference

### Core Hooks

#### `useGun(Gun, options)`

Initialize a Gun instance.

```typescript
const gun = useGun(Gun, {
  peers: ['http://localhost:8765/gun'],
  localStorage: true,
});
```

#### `useGunState<T>(ref, options)`

Manage state for a Gun node with error handling and loading states.

```typescript
const {
  fields, // T: The current state
  put, // (data: Partial<T>) => Promise<void>
  remove, // (field: string) => Promise<void>
  error, // GunError | null
  isLoading, // boolean
  isConnected, // boolean
} = useGunState<T>(ref, options);
```

#### `useGunCollectionState<T>(ref, options)`

Manage collections (Sets) with comprehensive CRUD operations.

```typescript
const {
  collection, // Map<string, NodeT<T>>
  items, // NodeT<T>[] - Array for easy iteration
  addToSet, // (data: T, nodeID?: string) => Promise<void>
  updateInSet, // (nodeID: string, data: Partial<T>) => Promise<void>
  removeFromSet, // (nodeID: string) => Promise<void>
  error, // GunError | null
  isLoading, // boolean
  count, // number
} = useGunCollectionState<T>(ref, options);
```

#### `useGunCollectionStatePaginated<T>(ref, options)`

High-performance paginated collections with smart caching and real-time updates.

```typescript
const {
  currentPageItems, // NodeT<T>[] - Current page items
  currentPage, // number - Current page index (0-based)
  totalPages, // number - Total number of pages
  pageSize, // number - Items per page
  setPageSize, // (size: number) => void
  nextPage, // () => void
  prevPage, // () => void
  goToPage, // (page: number) => void
  hasNextPage, // boolean
  hasPrevPage, // boolean
  isLoadingPage, // boolean
  totalItems, // number - Total items in collection
  // ... all useGunCollectionState methods
  addToSet, // (data: T, nodeID?: string) => Promise<void>
  updateInSet, // (nodeID: string, data: Partial<T>) => Promise<void>
  removeFromSet, // (nodeID: string) => Promise<void>
  error, // GunError | null
  preloadedPages, // Set<number> - Cached pages
} = useGunCollectionStatePaginated<T>(ref, options);
```

#### `useGunKeyAuth(gun, keys, triggerAuth?)`

Handle authentication with key pairs.

```typescript
const [
  namespacedGraph, // IGunUserReference
  isLoggedIn, // boolean
  authError, // GunError | null
] = useGunKeyAuth(gun, keyPair, true);
```

#### `useGunKeys(sea, existingKeys?)`

Generate or use existing key pairs.

```typescript
const keyPair = useGunKeys(SEA, existingKeys);
```

### Utility Hooks

#### `useGunDebug(ref, label, enabled?)`

Debug hook for development - logs all updates.

```typescript
// Only active in development
useGunDebug(userRef, 'UserProfile', process.env.NODE_ENV === 'development');
```

#### `useGunConnection(ref)`

Monitor connection status and health.

```typescript
const { isConnected, lastSeen, error } = useGunConnection(gun);
```

### Context Providers

#### `GunProvider`

Provide Gun instance through React context.

```typescript
<GunProvider gun={Gun} options={{ peers: ['http://localhost:8765/gun'] }}>
  <App />
</GunProvider>
```

#### `useGunContext()`

Access Gun instance from context.

```typescript
const gun = useGunContext();
```

#### `AuthProvider`

Comprehensive authentication provider with key management.

```typescript
<AuthProvider
  Gun={Gun}
  sea={Gun.SEA}
  storage={localStorage}
  gunOpts={{ peers: ['http://localhost:8765/gun'] }}
>
  <App />
</AuthProvider>
```

#### `useAuth()`

Access authentication state and methods.

```typescript
const {
  user, // IGunUserReference
  login, // (keys?: KeyPair) => void
  logout, // (callback?: () => void) => void
  isLoggedIn, // boolean
  appKeys, // KeyPair | undefined
  gun, // IGunChainReference
} = useAuth();
```

### Types

```typescript
interface GunError {
  err: string;
  code?: string | number;
  context?: string;
}

interface NodeData<T> {
  nodeID: string;
  // ... your data
}

interface UseGunStateReturn<T> {
  fields: T;
  put: (data: Partial<T>) => Promise<void>;
  remove: (field: string) => Promise<void>;
  error: GunError | null;
  isLoading: boolean;
  isConnected: boolean;
}
```

## Advanced Usage

### Error Handling Patterns

```typescript
function MyComponent() {
  const { fields, put, error } = useGunState(ref);

  // Global error handling
  if (error) {
    return <ErrorBoundary error={error} />;
  }

  // Operation-specific error handling
  const handleSave = async () => {
    try {
      await put(data);
      showSuccessMessage();
    } catch (error) {
      showErrorMessage(error.err);
    }
  };
}
```

### Development Debugging

```typescript
function DebuggedComponent() {
  const gun = useGunContext();
  const userRef = gun.user().get('profile');

  // Debug all updates in development
  useGunDebug(userRef, 'UserProfile');

  const { fields } = useGunState(userRef);
  return <div>{fields.name}</div>;
}
```

### Performance Optimization

```typescript
// Memoize expensive operations
const expensiveData = useMemo(() => {
  return items
    .filter((item) => item.category === selectedCategory)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}, [items, selectedCategory]);

// Use callback for event handlers
const handleAddItem = useCallback(
  async (item) => {
    await addToSet(item);
  },
  [addToSet],
);
```

## Migration from v0.9.x

### New Pagination Hook

v1.0.0 introduces `useGunCollectionStatePaginated` for high-performance collection management:

```typescript
// Before: Basic collection
const { items, addToSet } = useGunCollectionState(ref);

// After: Paginated with optimization
const { currentPageItems, addToSet, nextPage, totalPages } =
  useGunCollectionStatePaginated(ref, {
    pageSize: 20,
    sortBy: 'createdAt',
    preloadPages: 2,
  });
```

### Performance Benefits

- **Memory Efficient**: Only loads current page + preloaded pages
- **Smart Caching**: 5-minute page cache with automatic invalidation
- **Real-time Updates**: Debounced live synchronization
- **Type Safety**: Full TypeScript support with inference

For detailed migration instructions and compatibility information, see the detailed documentation for each hook.

## Development & Testing

### Debug Mode

```typescript
// Enable debug logging for specific components
useGunDebug(ref, 'ComponentName', true);

// Connection monitoring
const { isConnected, lastSeen } = useGunConnection(gun);
```

### Error Boundaries

```typescript
function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <GunProvider gun={Gun} options={opts}>
        <App />
      </GunProvider>
    </ErrorBoundary>
  );
}
```

## Examples & Documentation

- [useGun](https://github.com/alterx/gundb-react-hooks/blob/master/docs/useGun.md)
- [useGunNamespace](https://github.com/alterx/gundb-react-hooks/blob/master/docs/useGunNamespace.md)
- [useGunKeyAuth](https://github.com/alterx/gundb-react-hooks/blob/master/docs/useGunKeyAuth.md)
- [useGunKeys](https://github.com/alterx/gundb-react-hooks/blob/master/docs/useGunKeys.md)
- [useGunOnNodeUpdated](https://github.com/alterx/gundb-react-hooks/blob/master/docs/useGunOnNodeUpdated.md)
- [useGunState](https://github.com/alterx/gundb-react-hooks/blob/master/docs/useGunState.md)
- [useGunCollectionState](https://github.com/alterx/gundb-react-hooks/blob/master/docs/useGunCollectionState.md)
- [useGunCollectionStatePaginated](https://github.com/alterx/gundb-react-hooks/blob/master/docs/useGunCollectionStatePaginated.md)
- [useAuth](https://github.com/alterx/gundb-react-hooks/blob/master/docs/useAuth.md)
- [AuthProvider](https://github.com/alterx/gundb-react-hooks/blob/master/docs/AuthProvider.md)

## Contributing

We welcome contributions! Please see our contributing guidelines and:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Add tests** for your changes
4. **Ensure type safety** with TypeScript
5. **Submit a pull request**

## License

Licensed under [MIT](https://github.com/alterx/gundb-react-hooks/blob/master/LICENSE.md).

## Acknowledgments

- [GunDB](https://gun.eco/) for the decentralized database
- [React](https://reactjs.org/) and [Preact](https://preactjs.com/) communities
