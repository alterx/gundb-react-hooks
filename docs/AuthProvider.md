# AuthProvider

The `AuthProvider` component is a React context provider that manages GunDB authentication state, key generation, and secure storage across your application.

## Overview

`AuthProvider` automatically handles:

- Key pair generation and management
- Secure key storage and retrieval
- Automatic authentication with stored keys
- Cross-platform storage abstraction
- Error handling and recovery

## Basic Setup

```typescript
import { AuthProvider } from '@altrx/gundb-react-hooks';
import Gun from 'gun';
import 'gun/sea';

function App() {
  return (
    <AuthProvider
      Gun={Gun}
      sea={Gun.SEA}
      storage={localStorage}
      gunOpts={{
        peers: ['http://localhost:8765/gun'],
        localStorage: false
      }}
    >
      <YourApp />
    </AuthProvider>
  );
}
```

## Props

### Required Props

| Prop       | Type              | Description                                        |
| ---------- | ----------------- | -------------------------------------------------- |
| `Gun`      | `any`             | Gun constructor function                           |
| `sea`      | `any`             | SEA (Security, Encryption, Authorization) instance |
| `storage`  | `Storage`         | Storage implementation for key persistence         |
| `gunOpts`  | `GunOptions`      | Configuration options for Gun instance             |
| `children` | `React.ReactNode` | Child components to wrap                           |

### Optional Props

| Prop           | Type     | Default  | Description                              |
| -------------- | -------- | -------- | ---------------------------------------- |
| `keyFieldName` | `string` | `'keys'` | Storage key name for persisting keypairs |

## Storage Interface

The storage prop must implement this interface:

```typescript
interface Storage {
  getItem: (key: string) => any;
  setItem: (key: string, data: string) => any;
  removeItem: (key: string) => any;
}
```

## Platform-Specific Storage

### Web (localStorage)

```typescript
<AuthProvider
  storage={localStorage}
  // ... other props
/>
```

### React Native (AsyncStorage)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const asyncStorage = {
  getItem: async (key: string) => {
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, data: string) => {
    await AsyncStorage.setItem(key, data);
  },
  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key);
  }
};

<AuthProvider
  storage={asyncStorage}
  // ... other props
/>
```

### Node.js (File System)

```typescript
import fs from 'fs';
import path from 'path';

const fileStorage = {
  getItem: (key: string) => {
    try {
      const filePath = path.join(__dirname, `${key}.json`);
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return null;
    }
  },
  setItem: (key: string, data: string) => {
    const filePath = path.join(__dirname, `${key}.json`);
    fs.writeFileSync(filePath, data);
  },
  removeItem: (key: string) => {
    const filePath = path.join(__dirname, `${key}.json`);
    try {
      fs.unlinkSync(filePath);
    } catch {
      // File doesn't exist, ignore
    }
  }
};

<AuthProvider
  storage={fileStorage}
  // ... other props
/>
```

### Secure Storage (Encrypted)

```typescript
import CryptoJS from 'crypto-js';

const secureStorage = {
  getItem: (key: string) => {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, 'your-secret-key');
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  },
  setItem: (key: string, data: string) => {
    const encrypted = CryptoJS.AES.encrypt(data, 'your-secret-key').toString();
    localStorage.setItem(key, encrypted);
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
  }
};

<AuthProvider
  storage={secureStorage}
  // ... other props
/>
```

## Authentication Flow

The `AuthProvider` manages a sophisticated authentication flow:

```
1. Provider initializes
   ↓
2. Check storage for existing keys
   ↓
3. If keys exist → authenticate automatically
   ↓
4. If no keys → wait for login() call
   ↓
5. Generate new keys or use provided keys
   ↓
6. Authenticate with GunDB
   ↓
7. Store keys securely
   ↓
8. Update authentication state
```

## Advanced Configuration

### Multiple Apps with Different Keys

```typescript
// App 1
<AuthProvider
  keyFieldName="app1-keys"
  gunOpts={{ peers: ['http://app1.com/gun'] }}
  // ... other props
/>

// App 2
<AuthProvider
  keyFieldName="app2-keys"
  gunOpts={{ peers: ['http://app2.com/gun'] }}
  // ... other props
/>
```

### Custom Gun Configuration

```typescript
<AuthProvider
  Gun={Gun}
  sea={Gun.SEA}
  storage={localStorage}
  gunOpts={{
    peers: [
      'https://gun-relay-1.herokuapp.com/gun',
      'https://gun-relay-2.herokuapp.com/gun'
    ],
    localStorage: false,
    radisk: true,
    multicast: false,
    // Custom options
    retry: 3,
    timeout: 5000
  }}
>
  <App />
</AuthProvider>
```

### Environment-Based Configuration

```typescript
const gunOpts = {
  peers: process.env.NODE_ENV === 'production'
    ? ['https://prod-gun-server.com/gun']
    : ['http://localhost:8765/gun'],
  localStorage: process.env.NODE_ENV !== 'test'
};

<AuthProvider
  gunOpts={gunOpts}
  // ... other props
/>
```

## Error Handling

The `AuthProvider` includes comprehensive error handling:

```typescript
function AppWithErrorHandling() {
  return (
    <ErrorBoundary>
      <AuthProvider
        Gun={Gun}
        sea={Gun.SEA}
        storage={localStorage}
        gunOpts={gunOpts}
      >
        <App />
      </AuthProvider>
    </ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: any) {
    if (error.message.includes('Provide gunOpts, Gun and sea')) {
      console.error('AuthProvider configuration error:', error);
      // Handle configuration errors
    }
  }

  render() {
    // Error UI
  }
}
```

## Testing

### Mock Storage for Testing

```typescript
const mockStorage = {
  data: new Map(),
  getItem: (key: string) => mockStorage.data.get(key) || null,
  setItem: (key: string, data: string) => mockStorage.data.set(key, data),
  removeItem: (key: string) => mockStorage.data.delete(key)
};

// In tests
<AuthProvider
  storage={mockStorage}
  // ... other props
/>
```

### Test Helper

```typescript
export function createTestAuthProvider(overrides = {}) {
  const defaultProps = {
    Gun: MockGun,
    sea: MockSEA,
    storage: mockStorage,
    gunOpts: { peers: [] },
    ...overrides
  };

  return ({ children }: { children: React.ReactNode }) => (
    <AuthProvider {...defaultProps}>
      {children}
    </AuthProvider>
  );
}
```

## Performance Considerations

### Memoization

The `AuthProvider` automatically memoizes expensive operations:

```typescript
// Values are memoized based on dependencies
const value = useMemo(
  () => ({
    gun,
    user,
    login,
    logout,
    sea,
    appKeys: existingKeys || newKeys,
    isLoggedIn,
    newGunInstance,
  }),
  [
    gun,
    user,
    login,
    logout,
    sea,
    newKeys,
    existingKeys,
    isLoggedIn,
    newGunInstance,
  ],
);
```

### Avoiding Re-renders

```typescript
// Use callbacks to prevent unnecessary re-renders
const { login, logout } = useAuth();

// This won't cause re-renders when the component updates
const memoizedLogin = useCallback(() => {
  login();
}, [login]);
```

## Security Best Practices

1. **Use HTTPS** in production for Gun peers
2. **Encrypt sensitive storage** especially in web environments
3. **Validate storage data** before using retrieved keys
4. **Use secure key generation** (let SEA handle it)
5. **Clear keys on logout** to prevent unauthorized access

## Common Patterns

### Loading States

```typescript
function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  return (
    <AuthProvider onInitialized={() => setIsInitialized(true)}>
      {isInitialized ? <MainApp /> : <LoadingScreen />}
    </AuthProvider>
  );
}
```

### Multi-tenancy

```typescript
function MultiTenantApp({ tenantId }: { tenantId: string }) {
  const gunOpts = useMemo(() => ({
    peers: [`https://${tenantId}.myapp.com/gun`]
  }), [tenantId]);

  return (
    <AuthProvider
      keyFieldName={`keys-${tenantId}`}
      gunOpts={gunOpts}
    >
      <TenantApp />
    </AuthProvider>
  );
}
```

## Migration from Standalone Auth

If you're migrating from `@altrx/gundb-react-auth`:

```typescript
// Before
import { GunProvider, useAuth } from '@altrx/gundb-react-auth';

// After
import { AuthProvider, useAuth } from '@altrx/gundb-react-hooks';

// Usage is identical, just change the import and component name
<AuthProvider /* same props */ >
  <App />
</AuthProvider>
```
