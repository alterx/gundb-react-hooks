# useAuth

A comprehensive authentication hook for GunDB applications that provides automatic key generation, storage management, and authentication state tracking.

## Overview

The `useAuth` hook provides a complete authentication solution for GunDB applications, managing user keys, authentication state, and secure storage automatically. It integrates seamlessly with the `AuthProvider` component to deliver a robust authentication system.

## API Reference

### Signature

```typescript
useAuth(): AuthContextType
```

### Return Type

```typescript
interface AuthContextType {
  gun: IGunChainReference; // Gun instance
  user: IGunUserReference; // Authenticated user reference
  login: (keys?: KeyPair | string) => void; // Login function
  logout: (onLoggedOut?: () => void) => void; // Logout function
  sea: any; // SEA instance
  appKeys: KeyPair | string | undefined; // Current keys
  isLoggedIn: boolean; // Authentication status
  newGunInstance: (opts?: GunOptions) => IGunChainReference; // Create new Gun instance
}
```

## Basic Usage

```typescript
import { AuthProvider, useAuth } from '@altrx/gundb-react-hooks';
import Gun from 'gun';
import 'gun/sea';

// Wrap your app with AuthProvider
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

// Use authentication in components
function AuthenticatedApp() {
  const {
    user,
    login,
    logout,
    isLoggedIn,
    appKeys,
    gun
  } = useAuth();

  return (
    <div>
      {isLoggedIn ? (
        <div>
          <p>Welcome! You are authenticated.</p>
          <p>Your public key: {appKeys?.pub}</p>
          <button onClick={() => logout()}>Logout</button>
        </div>
      ) : (
        <div>
          <p>Please log in</p>
          <button onClick={() => login()}>Login with new keys</button>
        </div>
      )}
    </div>
  );
}
```

## Advanced Usage

### Custom Storage Implementation

```typescript
// For React Native with AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const asyncStorage = {
  getItem: async (key: string) => {
    const value = await AsyncStorage.getItem(key);
    return value;
  },
  setItem: async (key: string, data: string) => {
    await AsyncStorage.setItem(key, data);
  },
  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key);
  }
};

<AuthProvider storage={asyncStorage} ... />
```

### Login with Existing Keys

```typescript
function LoginForm() {
  const { login } = useAuth();
  const [keyInput, setKeyInput] = useState('');

  const handleLogin = () => {
    try {
      const keys = JSON.parse(keyInput);
      login(keys);
    } catch (error) {
      console.error('Invalid key format:', error);
    }
  };

  return (
    <div>
      <textarea
        value={keyInput}
        onChange={(e) => setKeyInput(e.target.value)}
        placeholder="Paste your keys here..."
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
```

### Key Export/Import

```typescript
function KeyManagement() {
  const { appKeys, isLoggedIn } = useAuth();

  const exportKeys = () => {
    if (appKeys) {
      const keyString = JSON.stringify(appKeys, null, 2);
      navigator.clipboard.writeText(keyString);
      alert('Keys copied to clipboard');
    }
  };

  return (
    <div>
      {isLoggedIn && (
        <button onClick={exportKeys}>
          Export Keys
        </button>
      )}
    </div>
  );
}
```

### Logout with Callback

```typescript
function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout(() => {
      // Cleanup after logout
      console.log('User logged out successfully');
      // Redirect or update UI
      window.location.href = '/login';
    });
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

## Integration with Other Hooks

### Using with useGunState

```typescript
function UserProfile() {
  const { user, isLoggedIn } = useAuth();
  const { fields, put, error } = useGunState(
    user?.get('profile'),
    { appKeys: user?.is }
  );

  if (!isLoggedIn) return <div>Please log in</div>;

  return (
    <div>
      <input
        value={fields.name || ''}
        onChange={(e) => put({ name: e.target.value })}
      />
      {error && <div>Error: {error.err}</div>}
    </div>
  );
}
```

### Using with useGunCollectionState

```typescript
function UserPosts() {
  const { user, isLoggedIn } = useAuth();
  const { items, addToSet, error } = useGunCollectionState(
    user?.get('posts'),
    { appKeys: user?.is }
  );

  if (!isLoggedIn) return <div>Please log in</div>;

  return (
    <div>
      {items.map(post => (
        <div key={post.nodeID}>{post.title}</div>
      ))}
      <button onClick={() => addToSet({ title: 'New Post' })}>
        Add Post
      </button>
      {error && <div>Error: {error.err}</div>}
    </div>
  );
}
```

## Error Handling

The authentication system includes comprehensive error handling:

```typescript
function AuthStatus() {
  const { isLoggedIn, login } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
      // Handle authentication errors
    }
  };

  return (
    <div>
      <p>Status: {isLoggedIn ? 'Authenticated' : 'Not authenticated'}</p>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
```

## Migration from v0.9.x

### Before (v0.9.x)

```typescript
// Manual authentication management
const [keys, setKeys] = useState(null);
const [user, setUser] = useState(null);
const [isLoggedIn, setIsLoggedIn] = useState(false);

// Manual key storage
useEffect(() => {
  const storedKeys = localStorage.getItem('keys');
  if (storedKeys) {
    setKeys(JSON.parse(storedKeys));
  }
}, []);
```

### After (v1.0.0)

```typescript
// Automatic authentication with AuthProvider
function App() {
  return (
    <AuthProvider Gun={Gun} sea={Gun.SEA} storage={localStorage} gunOpts={opts}>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

// Simple hook usage
const { user, login, logout, isLoggedIn, appKeys } = useAuth();
```

## Best Practices

1. **Always wrap your app** with `AuthProvider` at the root level
2. **Use meaningful storage keys** when deploying multiple apps
3. **Handle storage failures** gracefully in your storage implementation
4. **Secure key storage** in production environments
5. **Validate imported keys** before using them
6. **Provide clear user feedback** during authentication processes

## TypeScript Support

All authentication features are fully typed:

```typescript
import type {
  KeyPair,
  AuthContextType,
  Storage,
} from '@altrx/gundb-react-hooks';

const customStorage: Storage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, data: string) => localStorage.setItem(key, data),
  removeItem: (key: string) => localStorage.removeItem(key),
};
```

## Common Patterns

### Protected Routes

```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <LoginForm />;
  }

  return <>{children}</>;
}
```

### Automatic Key Backup

```typescript
function AutoBackup() {
  const { appKeys, isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn && appKeys) {
      // Automatically backup keys to secure storage
      backupKeysToSecureStorage(appKeys);
    }
  }, [isLoggedIn, appKeys]);

  return null;
}
```
