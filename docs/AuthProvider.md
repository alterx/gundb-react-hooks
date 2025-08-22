# AuthProvider

A React context provider that manages GunDB authentication state, key generation, and secure storage across your application.

## Overview

`AuthProvider` automatically handles key pair generation, secure storage, authentication flow, and cross-platform storage abstraction. It serves as the foundation for the authentication system in GunDB React applications.

## API Reference

### Props

#### Required Props

| Prop       | Type              | Description                                        |
| ---------- | ----------------- | -------------------------------------------------- |
| `Gun`      | `any`             | Gun constructor function                           |
| `sea`      | `any`             | SEA (Security, Encryption, Authorization) instance |
| `storage`  | `Storage`         | Storage implementation for key persistence         |
| `gunOpts`  | `GunOptions`      | Configuration options for Gun instance             |
| `children` | `React.ReactNode` | Child components to wrap                           |

#### Optional Props

| Prop           | Type     | Default  | Description                              |
| -------------- | -------- | -------- | ---------------------------------------- |
| `keyFieldName` | `string` | `'keys'` | Storage key name for persisting keypairs |

### Storage Interface

```typescript
interface Storage {
  getItem: (key: string) => any;
  setItem: (key: string, data: string) => any;
  removeItem: (key: string) => any;
}
```

## Basic Usage

### Simple Setup

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

## Advanced Usage

### Platform-Specific Storage

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

## Error Handling

### Comprehensive Error Management

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
    return this.state.hasError ? <ErrorComponent /> : this.props.children;
  }
}
```

## Migration from v0.9.x

### Before (v0.9.x)

```typescript
// Manual provider setup with limited features
import { GunProvider } from '@altrx/gundb-react-auth';

<GunProvider gun={Gun} options={gunOpts}>
  <App />
</GunProvider>
```

### After (v1.0.0)

```typescript
// Enhanced provider with built-in authentication
import { AuthProvider } from '@altrx/gundb-react-hooks';

<AuthProvider
  Gun={Gun}
  sea={Gun.SEA}
  storage={localStorage}
  gunOpts={gunOpts}
>
  <App />
</AuthProvider>
```
