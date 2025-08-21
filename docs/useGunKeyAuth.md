# useGunKeyAuth

A hook that handles user authentication using Gun key pairs with comprehensive error handling and status monitoring.

## API Reference

### Signature

```typescript
useGunKeyAuth(
  gun: GunRef, 
  keys: KeyPair, 
  triggerAuth?: boolean
): [IGunUserReference, boolean, GunError | null]
```

### Parameters

- `gun` - Gun instance
- `keys` - Key pair for authentication
- `triggerAuth` - Whether to trigger authentication immediately (default: `true`)

### Return Type

```typescript
[
  namespacedGraph: IGunUserReference,  // Authenticated user reference
  isLoggedIn: boolean,                 // Authentication status
  authError: GunError | null           // Authentication error
]
```

### Key Pair Type

```typescript
interface KeyPair {
  pub: string;    // Public key
  priv: string;   // Private key
  epub: string;   // Encrypted public key
  epriv: string;  // Encrypted private key
}
```

## Basic Usage

### Simple Authentication

```typescript
import React from 'react';
import { useGun, useGunKeyAuth, useGunKeys } from '@altrx/gundb-react-hooks';
import Gun from 'gun';
import SEA from 'gun/sea';

export const AuthApp: React.FC = () => {
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
  const appKeys = useGunKeys(SEA);
  const [user, isLoggedIn, authError] = useGunKeyAuth(gun, appKeys!);

  // Handle authentication errors
  if (authError) {
    return (
      <div className="auth-error">
        <h3>Authentication Failed</h3>
        <p><strong>Error:</strong> {authError.err}</p>
        {authError.context && (
          <p><strong>Context:</strong> {authError.context}</p>
        )}
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  // Handle key generation
  if (!appKeys) {
    return (
      <div className="key-generation">
        <h3>Generating Keys...</h3>
        <p>Creating your secure key pair</p>
      </div>
    );
  }

  // Handle authentication in progress
  if (!isLoggedIn) {
    return (
      <div className="authenticating">
        <h3>Authenticating...</h3>
        <p>Logging you in securely</p>
      </div>
    );
  }

  // Successful authentication
  return (
    <div className="authenticated">
      <h2>Welcome! You're authenticated</h2>
      <p><strong>Public Key:</strong> {appKeys.pub}</p>
      <UserDashboard user={user} />
    </div>
  );
};

const UserDashboard: React.FC<{ user: any }> = ({ user }) => {
  return (
    <div>
      <h3>User Dashboard</h3>
      <p>You can now access encrypted data and perform authenticated operations.</p>
      <button onClick={() => user.leave()}>Logout</button>
    </div>
  );
};
```

## Advanced Usage

### Conditional Authentication

```typescript
import React, { useState } from 'react';
import { useGunKeyAuth, useGunKeys } from '@altrx/gundb-react-hooks';

export const ConditionalAuthApp: React.FC = () => {
  const [shouldAuth, setShouldAuth] = useState(false);
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
  const appKeys = useGunKeys(SEA);
  
  // Only authenticate when user explicitly wants to
  const [user, isLoggedIn, authError] = useGunKeyAuth(gun, appKeys!, shouldAuth);

  if (authError) {
    return (
      <div>
        <h3>Authentication Error</h3>
        <p>{authError.err}</p>
        <button onClick={() => setShouldAuth(false)}>Cancel</button>
        <button onClick={() => setShouldAuth(true)}>Retry</button>
      </div>
    );
  }

  if (!appKeys) return <div>Generating keys...</div>;

  if (!shouldAuth) {
    return (
      <div>
        <h2>Welcome to the App</h2>
        <p>Click below to authenticate and access your data</p>
        <button onClick={() => setShouldAuth(true)}>
          Login with Gun
        </button>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div>
        <p>Authenticating...</p>
        <button onClick={() => setShouldAuth(false)}>Cancel</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Authenticated Successfully!</h2>
      <button onClick={() => {
        user.leave();
        setShouldAuth(false);
      }}>
        Logout
      </button>
    </div>
  );
};
```

### Authentication with User Registration

```typescript
import React, { useState } from 'react';
import { useGun, useGunKeyAuth, useGunState } from '@altrx/gundb-react-hooks';
import SEA from 'gun/sea';

interface UserProfile {
  username: string;
  email: string;
  createdAt: string;
}

export const AuthWithRegistration: React.FC = () => {
  const [isNewUser, setIsNewUser] = useState(false);
  const [storedKeys, setStoredKeys] = useState<KeyPair | null>(null);
  
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
  
  // Generate new keys or use stored keys
  const keys = useGunKeys(SEA, storedKeys);
  const [user, isLoggedIn, authError] = useGunKeyAuth(gun, keys!);

  const handleCreateAccount = async () => {
    if (!keys) return;
    
    try {
      // Store keys locally for future use (in real app, use secure storage)
      localStorage.setItem('gunKeys', JSON.stringify(keys));
      setStoredKeys(keys);
      setIsNewUser(true);
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };

  const handleLogin = () => {
    const savedKeys = localStorage.getItem('gunKeys');
    if (savedKeys) {
      setStoredKeys(JSON.parse(savedKeys));
    } else {
      alert('No saved keys found. Please create an account first.');
    }
  };

  if (authError) {
    return (
      <div className="auth-error">
        <h3>Authentication Error</h3>
        <p>{authError.err}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!keys) return <div>Generating keys...</div>;

  if (!storedKeys && !isLoggedIn) {
    return (
      <div className="auth-choice">
        <h2>Welcome to Gun App</h2>
        <button onClick={handleCreateAccount}>Create New Account</button>
        <button onClick={handleLogin}>Login with Existing Keys</button>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <div>Authenticating...</div>;
  }

  return (
    <AuthenticatedApp user={user} keys={keys} isNewUser={isNewUser} />
  );
};

const AuthenticatedApp: React.FC<{ 
  user: any; 
  keys: KeyPair; 
  isNewUser: boolean; 
}> = ({ user, keys, isNewUser }) => {
  const { 
    fields: profile, 
    put: updateProfile,
    error: profileError 
  } = useGunState<UserProfile>(user.get('profile'));

  const [username, setUsername] = useState('');

  const handleSetupProfile = async () => {
    if (!username.trim()) return;
    
    try {
      await updateProfile({
        username,
        email: '', // Can be added later
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to setup profile:', error);
    }
  };

  if (profileError) {
    return <div>Profile Error: {profileError.err}</div>;
  }

  if (isNewUser && !profile.username) {
    return (
      <div className="profile-setup">
        <h2>Setup Your Profile</h2>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button onClick={handleSetupProfile}>Save Profile</button>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <h2>Welcome, {profile.username || 'User'}!</h2>
      <div className="user-info">
        <p><strong>Public Key:</strong> {keys.pub.slice(0, 20)}...</p>
        <p><strong>Member since:</strong> {
          profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'
        }</p>
      </div>
      <button onClick={() => {
        user.leave();
        localStorage.removeItem('gunKeys');
        window.location.reload();
      }}>
        Logout
      </button>
    </div>
  );
};
```

## Error Handling Patterns

### Comprehensive Error Handling

```typescript
const AuthWithErrorHandling: React.FC = () => {
  const [retryCount, setRetryCount] = useState(0);
  const [manualRetry, setManualRetry] = useState(false);
  
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
  const keys = useGunKeys(SEA);
  const [user, isLoggedIn, authError] = useGunKeyAuth(gun, keys!, !manualRetry);

  // Handle different types of authentication errors
  const handleAuthError = (error: GunError) => {
    switch (error.context) {
      case 'useGunKeyAuth.auth':
        return (
          <div className="auth-failed">
            <h3>Authentication Failed</h3>
            <p>Your credentials could not be verified.</p>
            <button onClick={() => {
              setRetryCount(prev => prev + 1);
              setManualRetry(false);
            }}>
              Retry Authentication ({retryCount} attempts)
            </button>
          </div>
        );
        
      case 'useGunKeyAuth':
        return (
          <div className="auth-error">
            <h3>Authentication Error</h3>
            <p>{error.err}</p>
            <button onClick={() => window.location.reload()}>
              Restart App
            </button>
          </div>
        );
        
      default:
        return (
          <div className="unknown-error">
            <h3>Unknown Authentication Error</h3>
            <p>{error.err}</p>
            <details>
              <summary>Error Details</summary>
              <pre>{JSON.stringify(error, null, 2)}</pre>
            </details>
            <button onClick={() => setManualRetry(true)}>
              Disable Auto-Auth
            </button>
          </div>
        );
    }
  };

  if (authError) {
    return handleAuthError(authError);
  }

  // ... rest of component
};
```

## Migration from v0.9.x

### Before (v0.9.x)

```typescript
const [user, isLoggedIn] = useGunKeyAuth(gun, keys);

// No error handling - authentication failures were silent or thrown exceptions
if (isLoggedIn) {
  // Proceed with authenticated user
}
```

### After (v1.0.0)

```typescript
const [user, isLoggedIn, authError] = useGunKeyAuth(gun, keys);

// Explicit error handling
if (authError) {
  console.error('Authentication failed:', authError.err);
  // Handle error appropriately
  return <AuthErrorComponent error={authError} />;
}

if (isLoggedIn) {
  // Proceed with authenticated user
}
```

## Security Best Practices

### Key Storage and Management

```typescript
// Don't store keys in plain text
localStorage.setItem('keys', JSON.stringify(keys));

// Use secure storage methods
const storeKeysSecurely = async (keys: KeyPair) => {
  // In a real app, use:
  // - Encrypted local storage
  // - Hardware security modules
  // - Secure key management services
  
  const encrypted = await SEA.encrypt(keys, userPassword);
  localStorage.setItem('encryptedKeys', encrypted);
};

// Validate keys before use
const validateKeys = (keys: KeyPair): boolean => {
  return !!(keys.pub && keys.priv && keys.epub && keys.epriv);
};
```

### Authentication State Management

```typescript
const SecureAuthFlow: React.FC = () => {
  const [authAttempts, setAuthAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  
  const [user, isLoggedIn, authError] = useGunKeyAuth(gun, keys!);
  
  useEffect(() => {
    if (authError) {
      setAuthAttempts(prev => prev + 1);
      
      // Lock after 3 failed attempts
      if (authAttempts >= 3) {
        setIsLocked(true);
        setTimeout(() => setIsLocked(false), 60000); // 1 minute lockout
      }
    }
  }, [authError, authAttempts]);
  
  if (isLocked) {
    return <div>Too many failed attempts. Please wait 1 minute.</div>;
  }
  
  // ... rest of component
};
```

## Best Practices

1. **Always handle authentication errors** - Check the `authError` state
2. **Implement retry mechanisms** - Allow users to retry failed authentications
3. **Store keys securely** - Never store keys in plain text
4. **Validate key pairs** - Ensure keys are complete before authentication
5. **Monitor authentication attempts** - Implement lockout mechanisms for security
6. **Provide clear feedback** - Show users what's happening during authentication
7. **Handle network issues** - Authentication can fail due to connectivity problems
8. **Use conditional authentication** - Don't always authenticate immediately
