# useGun

A hook for initializing and managing a GunDB instance with enhanced connection monitoring and error handling.

## API Reference

### Signature

```typescript
useGun(
  Gun: any, 
  options?: GunOptions
): IGunInstance
```

### Parameters

- `Gun` - The Gun constructor
- `options` - Gun configuration options (peers, localStorage, etc.)

### Return Type

```typescript
IGunInstance  // Configured Gun instance with connection monitoring
```

### Gun Options Interface

```typescript
interface GunOptions {
  peers?: string[];        // Array of peer URLs
  localStorage?: boolean;  // Enable localStorage persistence
  sessionStorage?: boolean; // Enable sessionStorage persistence
  radisk?: boolean;       // Enable radisk storage
  file?: string;          // File path for server-side storage
  web?: any;              // Web server instance
  [key: string]: any;     // Additional Gun options
}
```

## Basic Usage

### Simple Gun Instance

```typescript
import React from 'react';
import { useGun, useGunConnection } from '@altrx/gundb-react-hooks';
import Gun from 'gun';

export const BasicGunApp: React.FC = () => {
  // Initialize Gun with basic peer configuration
  const gun = useGun(Gun, { 
    peers: ['http://localhost:8765/gun'] 
  });
  
  const { isConnected, connectionError } = useGunConnection(gun);

  if (connectionError) {
    return (
      <div className="connection-error">
        <h3>Connection Error</h3>
        <p>{connectionError.err}</p>
        <button onClick={() => window.location.reload()}>
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="gun-app">
      <h3>Gun Database Connected</h3>
      
      <div className="connection-status">
        <p><strong>Status:</strong> {isConnected ? 'Connected' : 'Disconnected'}</p>
        <p><strong>Gun Instance:</strong> {gun ? 'Ready' : 'Not Ready'}</p>
      </div>

      {gun && <MainApp gun={gun} />}
    </div>
  );
};

const MainApp: React.FC<{ gun: any }> = ({ gun }) => {
  return (
    <div>
      <h4>Main Application</h4>
      <p>Gun instance is ready for use!</p>
    </div>
  );
};
```

### Multiple Peer Configuration

```typescript
import React from 'react';
import { useGun, useGunConnection } from '@altrx/gundb-react-hooks';
import Gun from 'gun';

export const MultiPeerGunApp: React.FC = () => {
  // Configure multiple peers for redundancy
  const gun = useGun(Gun, {
    peers: [
      'http://localhost:8765/gun',
      'https://gun-manhattan.herokuapp.com/gun',
      'https://peer1.example.com/gun',
      'https://peer2.example.com/gun'
    ],
    localStorage: true,  // Enable local persistence
    radisk: true        // Enable radisk for better performance
  });

  const { isConnected, peerCount, connectionError } = useGunConnection(gun);

  if (connectionError) {
    return (
      <div className="multi-peer-error">
        <h3>Multi-Peer Connection Error</h3>
        <p><strong>Error:</strong> {connectionError.err}</p>
        <p>Trying to connect to multiple peers...</p>
        
        <div className="retry-options">
          <button onClick={() => window.location.reload()}>
            Retry All Peers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="multi-peer-app">
      <h3>Multi-Peer Gun Database</h3>
      
      <div className="connection-details">
        <div className="status-card">
          <h4>Connection Status</h4>
          <p><strong>Status:</strong> {isConnected ? 'Connected' : 'Disconnected'}</p>
          <p><strong>Connected Peers:</strong> {peerCount || 0}</p>
          <p><strong>Local Storage:</strong> Enabled</p>
          <p><strong>Radisk:</strong> Enabled</p>
        </div>
        
        <div className="peer-list">
          <h4>Configured Peers:</h4>
          <ul>
            <li>localhost:8765 (Local)</li>
            <li>gun-manhattan.herokuapp.com (Public)</li>
            <li>peer1.example.com (Custom)</li>
            <li>peer2.example.com (Custom)</li>
          </ul>
        </div>
      </div>

      {gun && <PeerMonitoringApp gun={gun} />}
    </div>
  );
};

const PeerMonitoringApp: React.FC<{ gun: any }> = ({ gun }) => {
  const [peerStats, setPeerStats] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Monitor peer connections
    if (gun && gun.on) {
      gun.on('hi', (peer: any) => {
        console.log('Peer connected:', peer);
        setPeerStats(prev => [...prev, { peer, connectedAt: new Date() }]);
      });
      
      gun.on('bye', (peer: any) => {
        console.log('Peer disconnected:', peer);
        setPeerStats(prev => prev.filter(p => p.peer !== peer));
      });
    }
  }, [gun]);

  return (
    <div className="peer-monitoring">
      <h4>Peer Monitoring</h4>
      <p>Active Connections: {peerStats.length}</p>
      
      {peerStats.map((stat, index) => (
        <div key={index} className="peer-stat">
          <p>Peer {index + 1} - Connected at {stat.connectedAt.toLocaleTimeString()}</p>
        </div>
      ))}
    </div>
  );
};
```

## Advanced Usage

### Environment-Aware Configuration

```typescript
import React from 'react';
import { useGun } from '@altrx/gundb-react-hooks';
import Gun from 'gun';

const getGunConfig = (environment: string): GunOptions => {
  switch (environment) {
    case 'development':
      return {
        peers: ['http://localhost:8765/gun'],
        localStorage: true,
        radisk: true
      };
      
    case 'staging':
      return {
        peers: [
          'https://staging-gun-1.example.com/gun',
          'https://staging-gun-2.example.com/gun'
        ],
        localStorage: true,
        radisk: true
      };
      
    case 'production':
      return {
        peers: [
          'https://gun-1.example.com/gun',
          'https://gun-2.example.com/gun',
          'https://gun-3.example.com/gun',
          'https://gun-manhattan.herokuapp.com/gun'
        ],
        localStorage: true,
        radisk: true,
        sessionStorage: false  // Disable in production for security
      };
      
    default:
      return {
        peers: ['https://gun-manhattan.herokuapp.com/gun'],
        localStorage: true
      };
  }
};

export const EnvironmentAwareGunApp: React.FC = () => {
  const environment = process.env.NODE_ENV || 'development';
  const gunConfig = getGunConfig(environment);
  
  const gun = useGun(Gun, gunConfig);
  const { isConnected, connectionError } = useGunConnection(gun);

  return (
    <div className="env-aware-app">
      <h3>Environment-Aware Gun App</h3>
      
      <div className="environment-info">
        <h4>Environment: {environment.toUpperCase()}</h4>
        <div className="config-display">
          <h5>Gun Configuration:</h5>
          <pre>{JSON.stringify(gunConfig, null, 2)}</pre>
        </div>
      </div>

      <div className="connection-status">
        {connectionError ? (
          <div className="error">
            <p>Connection Error: {connectionError.err}</p>
          </div>
        ) : (
          <div className="success">
            <p>Status: {isConnected ? 'Connected' : 'Connecting...'}</p>
          </div>
        )}
      </div>

      {gun && <EnvironmentSpecificFeatures gun={gun} environment={environment} />}
    </div>
  );
};

const EnvironmentSpecificFeatures: React.FC<{ 
  gun: any; 
  environment: string; 
}> = ({ gun, environment }) => {
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';

  return (
    <div className="env-features">
      <h4>Environment Features</h4>
      
      {isDevelopment && (
        <div className="dev-features">
          <h5>Development Mode</h5>
          <ul>
            <li>Local Gun peer</li>
            <li>Debug logging enabled</li>
            <li>Hot reloading support</li>
            <li>All storage options enabled</li>
          </ul>
        </div>
      )}
      
      {isProduction && (
        <div className="prod-features">
          <h5>Production Mode</h5>
          <ul>
            <li>Multiple redundant peers</li>
            <li>Optimized for performance</li>
            <li>Enhanced security settings</li>
            <li>Error reporting enabled</li>
          </ul>
        </div>
      )}
    </div>
  );
};
```

### Gun with Custom Storage

```typescript
import React from 'react';
import { useGun } from '@altrx/gundb-react-hooks';
import Gun from 'gun';
import 'gun/lib/radix';
import 'gun/lib/radisk';
import 'gun/lib/store';
import 'gun/lib/rindexed';

export const CustomStorageGunApp: React.FC = () => {
  // Configure Gun with custom storage options
  const gun = useGun(Gun, {
    peers: ['http://localhost:8765/gun'],
    localStorage: true,     // Browser localStorage
    sessionStorage: false,  // Disable session storage
    radisk: true,          // Enable radisk for performance
    file: 'data.json',     // Server-side file storage (if applicable)
    // Custom storage adapter
    store: (key: string, data: any, cb: Function) => {
      // Custom storage implementation
      try {
        if (data === undefined) {
          // Read operation
          const stored = localStorage.getItem(`custom_gun_${key}`);
          cb(null, stored ? JSON.parse(stored) : undefined);
        } else {
          // Write operation
          localStorage.setItem(`custom_gun_${key}`, JSON.stringify(data));
          cb(null, data);
        }
      } catch (error) {
        cb(error);
      }
    }
  });

  const { isConnected, connectionError } = useGunConnection(gun);

  const checkStorageUsage = () => {
    try {
      const gunKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('gun/') || key.startsWith('custom_gun_')
      );
      
      const usage = gunKeys.reduce((total, key) => {
        return total + localStorage.getItem(key)!.length;
      }, 0);
      
      console.log(`Gun storage usage: ${(usage / 1024).toFixed(2)} KB`);
      console.log(`Gun keys count: ${gunKeys.length}`);
    } catch (error) {
      console.error('Failed to check storage usage:', error);
    }
  };

  return (
    <div className="custom-storage-app">
      <h3>Custom Storage Gun App</h3>
      
      <div className="storage-config">
        <h4>Storage Configuration:</h4>
        <ul>
          <li>LocalStorage: Enabled</li>
          <li>SessionStorage: Disabled</li>
          <li>Radisk: Enabled (Performance)</li>
          <li>Custom Storage Adapter: Active</li>
        </ul>
      </div>

      <div className="storage-controls">
        <button onClick={checkStorageUsage}>
          Check Storage Usage
        </button>
        <button onClick={() => {
          if (confirm('Clear all Gun storage data?')) {
            Object.keys(localStorage)
              .filter(key => key.startsWith('gun/') || key.startsWith('custom_gun_'))
              .forEach(key => localStorage.removeItem(key));
            window.location.reload();
          }
        }}>
          Clear Storage
        </button>
      </div>

      {connectionError ? (
        <div className="error">
          <p>Connection Error: {connectionError.err}</p>
        </div>
      ) : (
        <div className="status">
          <p>Status: {isConnected ? 'Connected' : 'Connecting...'}</p>
        </div>
      )}

      {gun && <StorageTestApp gun={gun} />}
    </div>
  );
};

const StorageTestApp: React.FC<{ gun: any }> = ({ gun }) => {
  const [testData, setTestData] = React.useState<string>('');
  const [storedValue, setStoredValue] = React.useState<string>('');

  const saveToStorage = () => {
    if (!testData.trim()) return;
    
    gun.get('storage_test').put({
      data: testData,
      timestamp: new Date().toISOString()
    });
    
    setTestData('');
  };

  const loadFromStorage = () => {
    gun.get('storage_test').once((data: any) => {
      if (data) {
        setStoredValue(`${data.data} (saved at ${data.timestamp})`);
      } else {
        setStoredValue('No data found');
      }
    });
  };

  return (
    <div className="storage-test">
      <h4>Storage Test</h4>
      
      <div className="test-controls">
        <input
          type="text"
          placeholder="Enter test data"
          value={testData}
          onChange={(e) => setTestData(e.target.value)}
        />
        <button onClick={saveToStorage}>Save</button>
        <button onClick={loadFromStorage}>Load</button>
      </div>
      
      {storedValue && (
        <div className="stored-value">
          <h5>Stored Value:</h5>
          <p>{storedValue}</p>
        </div>
      )}
    </div>
  );
};
```

## Error Handling Patterns

### Connection Retry Logic

```typescript
const GunWithRetry: React.FC = () => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const gun = useGun(Gun, { 
    peers: ['http://localhost:8765/gun'] 
  });
  
  const { isConnected, connectionError } = useGunConnection(gun);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    
    // Reload the app to reinitialize Gun
    window.location.reload();
  };

  if (connectionError && !isRetrying) {
    return (
      <div className="connection-retry">
        <h3>Connection Failed</h3>
        <p>{connectionError.err}</p>
        <p>Retry attempts: {retryCount}</p>
        
        <button 
          onClick={handleRetry}
          disabled={retryCount >= 5}
        >
          {retryCount >= 5 ? 'Max Retries Reached' : 'Retry Connection'}
        </button>
        
        {retryCount >= 5 && (
          <div className="fallback-options">
            <h4>Alternative Options:</h4>
            <button onClick={() => window.location.reload()}>
              Try Different Peers
            </button>
            <button onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}>
              Clear Cache & Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Connecting...'}</p>
      {gun && <div>Gun ready!</div>}
    </div>
  );
};
```

## Migration from v0.9.x

### Before (v0.9.x)

```typescript
// Simple Gun initialization without connection monitoring
const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });

// No built-in error handling or connection status
if (gun) {
  // Assume Gun is ready to use
}
```

### After (v1.0.0)

```typescript
// Enhanced Gun initialization with connection monitoring
const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
const { isConnected, connectionError } = useGunConnection(gun);

// Comprehensive connection status handling
if (connectionError) {
  return <ConnectionErrorComponent error={connectionError} />;
}

if (!isConnected) {
  return <ConnectingComponent />;
}

// Gun is ready and connected
return <MainApp gun={gun} />;
```

## Best Practices

1. **Multiple Peers** - Configure multiple peers for redundancy
2. **Environment Configuration** - Use different configs for dev/staging/prod
3. **Connection Monitoring** - Always monitor connection status
4. **Error Handling** - Implement retry logic for connection failures
5. **Storage Options** - Enable appropriate storage for your use case
6. **Performance** - Use radisk for better performance
7. **Security** - Disable sessionStorage in production if not needed
8. **Monitoring** - Track peer connections and health

## Configuration Options

### Development

```typescript
const devConfig: GunOptions = {
  peers: ['http://localhost:8765/gun'],
  localStorage: true,
  radisk: true,
  // Enable debug logging in development
  debug: true
};
```

### Production

```typescript
const prodConfig: GunOptions = {
  peers: [
    'https://gun-1.example.com/gun',
    'https://gun-2.example.com/gun',
    'https://gun-3.example.com/gun'
  ],
  localStorage: true,
  radisk: true,
  sessionStorage: false,  // Security consideration
  // Production optimizations
  timeout: 15000,
  retry: 3
};
```
