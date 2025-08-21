# useGunState

A hook that provides access to a Gun node with comprehensive error handling, loading states, and TypeScript support.

## API Reference

### Signature

```typescript
useGunState<T>(ref: GunRef, opts?: Options): UseGunStateReturn<T>
```

### Return Type

```typescript
interface UseGunStateReturn<T> {
  fields: T;                                    // Current state data
  put: (data: Partial<T>) => Promise<void>;     // Update operation
  remove: (field: string) => Promise<void>;    // Remove field
  error: GunError | null;                      // Error state
  isLoading: boolean;                          // Loading state
  isConnected: boolean;                        // Connection status
}
```

### Error Type

```typescript
interface GunError {
  err: string;           // Error message
  code?: string | number; // Error code (if available)
  context?: string;      // Context where error occurred
}
```

## Basic Usage

### Simple State Management

```typescript
import React from 'react';
import { useGun, useGunState } from '@altrx/gundb-react-hooks';
import Gun from 'gun';

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

export const UserProfileComponent: React.FC = () => {
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
  
  const { 
    fields: profile, 
    put, 
    remove,
    error, 
    isLoading, 
    isConnected 
  } = useGunState<UserProfile>(gun.get('user').get('profile'));

  // Handle loading state
  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  // Handle connection issues
  if (!isConnected) {
    return <div>Connecting to Gun network...</div>;
  }

  // Handle errors
  if (error) {
    return (
      <div className="error">
        <h3>Error loading profile</h3>
        <p>{error.err}</p>
        {error.context && <small>Context: {error.context}</small>}
      </div>
    );
  }

  const handleUpdateProfile = async () => {
    try {
      await put({
        name: 'John Doe',
        email: 'john@example.com'
      });
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await remove('avatar');
      console.log('Avatar removed');
    } catch (error) {
      console.error('Failed to remove avatar:', error);
    }
  };

  return (
    <div>
      <h1>{profile.name || 'Anonymous User'}</h1>
      <p>Email: {profile.email || 'Not set'}</p>
      {profile.avatar && (
        <div>
          <img src={profile.avatar} alt="Avatar" />
          <button onClick={handleRemoveAvatar}>Remove Avatar</button>
        </div>
      )}
      <button onClick={handleUpdateProfile}>Update Profile</button>
    </div>
  );
};
```

## Advanced Usage

### With Authentication and Encryption

```typescript
import React from 'react';
import { useGun, useGunState, useGunKeyAuth, useGunKeys } from '@altrx/gundb-react-hooks';
import Gun from 'gun';
import SEA from 'gun/sea';

interface PrivateNote {
  title: string;
  content: string;
  createdAt: string;
}

export const EncryptedNotesApp: React.FC = () => {
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
  const appKeys = useGunKeys(SEA);
  const [user, isLoggedIn, authError] = useGunKeyAuth(gun, appKeys!);

  // Handle authentication errors
  if (authError) {
    return (
      <div className="auth-error">
        <h3>Authentication Error</h3>
        <p>{authError.err}</p>
      </div>
    );
  }

  if (!appKeys) return <div>Generating keys...</div>;
  if (!isLoggedIn) return <div>Logging in...</div>;

  return <NotesComponent user={user} appKeys={appKeys} />;
};

const NotesComponent: React.FC<{ user: any; appKeys: any }> = ({ user, appKeys }) => {
  const { 
    fields: notes, 
    put, 
    error, 
    isLoading 
  } = useGunState<PrivateNote>(
    user.get('private').get('notes'),
    { appKeys, sea: SEA } // Encrypted storage
  );

  const handleSaveNote = async () => {
    try {
      await put({
        title: 'My Secret Note',
        content: 'This content is encrypted!',
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  if (isLoading) return <div>Loading encrypted notes...</div>;
  if (error) return <div>Error: {error.err}</div>;

  return (
    <div>
      <h2>Private Notes</h2>
      {notes.title && (
        <div>
          <h3>{notes.title}</h3>
          <p>{notes.content}</p>
          <small>Created: {notes.createdAt}</small>
        </div>
      )}
      <button onClick={handleSaveNote}>Add Encrypted Note</button>
    </div>
  );
};
```

### With Context Provider

```typescript
import React from 'react';
import { GunProvider, useGunContext, useGunState } from '@altrx/gundb-react-hooks';
import Gun from 'gun';

// App with context provider
export const App: React.FC = () => (
  <GunProvider gun={Gun} options={{ peers: ['http://localhost:8765/gun'] }}>
    <UserDashboard />
  </GunProvider>
);

// Component using context
const UserDashboard: React.FC = () => {
  const gun = useGunContext();
  
  const { 
    fields: userStats, 
    put: updateStats,
    error,
    isLoading 
  } = useGunState(gun.get('user').get('stats'));

  if (error) return <div>Error: {error.err}</div>;
  if (isLoading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1>User Dashboard</h1>
      <p>Login count: {userStats.loginCount || 0}</p>
      <button onClick={() => updateStats({ 
        loginCount: (userStats.loginCount || 0) + 1,
        lastLogin: new Date().toISOString()
      })}>
        Increment Login Count
      </button>
    </div>
  );
};
```

## Error Handling Patterns

### Comprehensive Error Component

```typescript
import { GunError } from '@altrx/gundb-react-hooks';

const ErrorDisplay: React.FC<{ error: GunError; onRetry?: () => void }> = ({ 
  error, 
  onRetry 
}) => (
  <div className="error-container">
    <h3>Operation Failed</h3>
    <div className="error-details">
      <p><strong>Error:</strong> {error.err}</p>
      {error.context && <p><strong>Context:</strong> {error.context}</p>}
      {error.code && <p><strong>Code:</strong> {error.code}</p>}
    </div>
    {onRetry && (
      <button onClick={onRetry} className="retry-button">
        Try Again
      </button>
    )}
  </div>
);

// Usage in component
const MyComponent: React.FC = () => {
  const { fields, put, error } = useGunState(ref);
  
  if (error) {
    return <ErrorDisplay error={error} onRetry={() => window.location.reload()} />;
  }
  
  return <div>{/* Normal component */}</div>;
};
```

## Migration from v0.9.x

### Before (v0.9.x)

```typescript
const { fields, put, remove } = useGunState(ref);
// No error handling, silent failures
```

### After (v1.0.0)

```typescript
const { 
  fields, 
  put, 
  remove, 
  error,        // NEW: Explicit error handling
  isLoading,    // NEW: Loading state
  isConnected   // NEW: Connection status
} = useGunState(ref);

// Handle errors explicitly
if (error) {
  console.error('Gun operation failed:', error.err);
}
```

## Development & Debugging

### Debug Hook Integration

```typescript
import { useGunState, useGunDebug } from '@altrx/gundb-react-hooks';

const DebuggedComponent: React.FC = () => {
  const gun = useGunContext();
  const profileRef = gun.get('user').get('profile');
  
  // Debug all updates in development
  useGunDebug(profileRef, 'UserProfile', process.env.NODE_ENV === 'development');
  
  const { fields } = useGunState(profileRef);
  
  return <div>{fields.name}</div>;
};
```

## Performance Tips

### Memoization

```typescript
import { useMemo, useCallback } from 'react';

const OptimizedComponent: React.FC = () => {
  const { fields, put } = useGunState(ref);
  
  // Memoize expensive computations
  const processedData = useMemo(() => {
    return Object.keys(fields).map(key => ({
      key,
      value: fields[key],
      processed: true
    }));
  }, [fields]);
  
  // Memoize event handlers
  const handleUpdate = useCallback(async (newData) => {
    await put(newData);
  }, [put]);
  
  return (
    <div>
      {processedData.map(item => (
        <div key={item.key}>{item.value}</div>
      ))}
    </div>
  );
};
```

## Best Practices

1. **Always handle errors** - Check the `error` state and provide user feedback
2. **Show loading states** - Use `isLoading` for better UX
3. **Monitor connections** - Use `isConnected` for network status
4. **Use TypeScript** - Define interfaces for your data structures
5. **Validate inputs** - The hook validates automatically, but add your own validation
6. **Handle async operations** - Use try-catch with `put` and `remove`
7. **Optimize renders** - Use memoization for expensive operations
