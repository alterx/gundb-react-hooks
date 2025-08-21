# useGunKeys

A hook that creates or retrieves SEA key pairs for Gun authentication with secure generation and error handling.

## API Reference

### Signature

```typescript
useGunKeys(
  SEA: any, 
  initialValue?: KeyPair | null
): KeyPair | null
```

### Parameters

- `SEA` - The SEA instance for cryptographic operations
- `initialValue` - Optional existing key pair to use instead of generating new ones

### Return Type

```typescript
KeyPair | null  // Returns null while generating, KeyPair when ready
```

### Key Pair Interface

```typescript
interface KeyPair {
  pub: string;    // Public key
  priv: string;   // Private key  
  epub: string;   // Encrypted public key
  epriv: string;  // Encrypted private key
}
```

## Basic Usage

### Simple Key Generation

```typescript
import React from 'react';
import { useGunKeys } from '@altrx/gundb-react-hooks';
import SEA from 'gun/sea';

export const KeyGenerationExample: React.FC = () => {
  const keys = useGunKeys(SEA);

  if (!keys) {
    return (
      <div className="key-generation">
        <h3>Generating Keys...</h3>
        <p>Creating your secure cryptographic key pair</p>
        <div className="loading-spinner">⏳</div>
      </div>
    );
  }

  return (
    <div className="keys-ready">
      <h3>Keys Generated Successfully</h3>
      <div className="key-info">
        <p><strong>Public Key:</strong> {keys.pub.slice(0, 20)}...</p>
        <p><strong>Keys ready for authentication</strong></p>
      </div>
    </div>
  );
};
```

### Using Existing Keys

```typescript
import React, { useState, useEffect } from 'react';
import { useGunKeys } from '@altrx/gundb-react-hooks';
import SEA from 'gun/sea';

export const ExistingKeysExample: React.FC = () => {
  const [storedKeys, setStoredKeys] = useState<KeyPair | null>(null);
  
  // Load keys from secure storage on mount
  useEffect(() => {
    const loadKeys = async () => {
      try {
        const keysData = localStorage.getItem('userKeys');
        if (keysData) {
          const parsed = JSON.parse(keysData);
          setStoredKeys(parsed);
        }
      } catch (error) {
        console.error('Failed to load stored keys:', error);
      }
    };
    
    loadKeys();
  }, []);

  // Use existing keys or generate new ones
  const keys = useGunKeys(SEA, storedKeys);

  const handleSaveKeys = () => {
    if (keys) {
      try {
        localStorage.setItem('userKeys', JSON.stringify(keys));
        alert('Keys saved successfully!');
      } catch (error) {
        console.error('Failed to save keys:', error);
        alert('Failed to save keys');
      }
    }
  };

  const handleClearKeys = () => {
    localStorage.removeItem('userKeys');
    setStoredKeys(null);
    window.location.reload();
  };

  if (!keys) {
    return (
      <div>
        <h3>⏳ {storedKeys ? 'Loading keys...' : 'Generating new keys...'}</h3>
      </div>
    );
  }

  return (
    <div className="key-management">
      <h3>Key Management</h3>
      
      <div className="key-details">
        <h4>Key Information</h4>
        <p><strong>Public Key:</strong> {keys.pub}</p>
        <p><strong>Encrypted Public Key:</strong> {keys.epub}</p>
        <p><small>Private keys are securely stored and not displayed</small></p>
      </div>

      <div className="key-actions">
        {!storedKeys && (
          <button onClick={handleSaveKeys} className="save-keys">
            Save Keys for Later Use
          </button>
        )}
        
        {storedKeys && (
          <button onClick={handleClearKeys} className="clear-keys">
            Generate New Keys
          </button>
        )}
      </div>

      <div className="security-notice">
        <h4>Security Notice</h4>
        <p>Keys are stored locally. In production:</p>
        <ul>
          <li>Use encrypted storage</li>
          <li>Consider hardware security modules</li>
          <li>Implement secure backup mechanisms</li>
        </ul>
      </div>
    </div>
  );
};
```

## Advanced Usage

### Key Generation with Progress Tracking

```typescript
import React, { useState, useEffect } from 'react';
import { useGunKeys } from '@altrx/gundb-react-hooks';
import SEA from 'gun/sea';

export const KeyGenerationProgress: React.FC = () => {
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState<number>(0);
  
  const keys = useGunKeys(SEA);

  useEffect(() => {
    if (!keys) {
      setStartTime(Date.now());
      const interval = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [keys, startTime]);

  if (!keys) {
    return (
      <div className="key-progress">
        <h3>Generating Cryptographic Keys</h3>
        <div className="progress-info">
          <p>Time elapsed: {(elapsed / 1000).toFixed(1)}s</p>
          <p>Creating secure key pair...</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ 
              width: `${Math.min((elapsed / 3000) * 100, 95)}%` 
            }} />
          </div>
        </div>
        <div className="security-info">
          <h4>What's happening?</h4>
          <ul>
            <li>Generating cryptographically secure random numbers</li>
            <li>Creating public/private key pair</li>
            <li>Encrypting keys for secure storage</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="keys-complete">
      <h3>Keys Generated Successfully!</h3>
      <p>Generation completed in {(elapsed / 1000).toFixed(1)} seconds</p>
      <div className="key-summary">
        <p><strong>Public Key:</strong> {keys.pub.slice(0, 40)}...</p>
        <p><strong>Ready for authentication and encryption</strong></p>
      </div>
    </div>
  );
};
```

### Key Import/Export Functionality

```typescript
import React, { useState } from 'react';
import { useGunKeys } from '@altrx/gundb-react-hooks';
import SEA from 'gun/sea';

export const KeyImportExport: React.FC = () => {
  const [importKeys, setImportKeys] = useState<KeyPair | null>(null);
  const [importText, setImportText] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'json' | 'base64'>('json');
  
  const keys = useGunKeys(SEA, importKeys);

  const handleImport = () => {
    try {
      let parsed: KeyPair;
      
      if (importText.startsWith('{')) {
        // JSON format
        parsed = JSON.parse(importText);
      } else {
        // Base64 format
        const decoded = atob(importText);
        parsed = JSON.parse(decoded);
      }
      
      // Validate key structure
      if (!parsed.pub || !parsed.priv || !parsed.epub || !parsed.epriv) {
        throw new Error('Invalid key format');
      }
      
      setImportKeys(parsed);
      setImportText('');
    } catch (error) {
      alert('Invalid key format. Please check your input.');
    }
  };

  const handleExport = () => {
    if (!keys) return;
    
    try {
      let exported: string;
      
      if (exportFormat === 'json') {
        exported = JSON.stringify(keys, null, 2);
      } else {
        exported = btoa(JSON.stringify(keys));
      }
      
      navigator.clipboard.writeText(exported);
      alert(`Keys exported to clipboard in ${exportFormat} format!`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export keys');
    }
  };

  const handleReset = () => {
    setImportKeys(null);
    setImportText('');
    window.location.reload();
  };

  if (!keys) {
    return (
      <div className="key-loading">
        <h3>{importKeys ? 'Loading imported keys...' : 'Generating new keys...'}</h3>
      </div>
    );
  }

  return (
    <div className="key-import-export">
      <h3>Key Management</h3>
      
      <div className="current-keys">
        <h4>Current Keys</h4>
        <p><strong>Public Key:</strong> {keys.pub.slice(0, 20)}...</p>
        <p><strong>Status:</strong> {importKeys ? 'Imported' : 'Generated'}</p>
      </div>

      <div className="export-section">
        <h4>Export Keys</h4>
        <div className="export-options">
          <label>
            <input 
              type="radio" 
              value="json" 
              checked={exportFormat === 'json'}
              onChange={(e) => setExportFormat(e.target.value as 'json')}
            />
            JSON Format (Human Readable)
          </label>
          <label>
            <input 
              type="radio" 
              value="base64" 
              checked={exportFormat === 'base64'}
              onChange={(e) => setExportFormat(e.target.value as 'base64')}
            />
            Base64 Format (Compact)
          </label>
        </div>
        <button onClick={handleExport}>
          Copy Keys to Clipboard
        </button>
      </div>

      <div className="import-section">
        <h4>Import Keys</h4>
        <textarea
          placeholder="Paste your keys here (JSON or Base64 format)"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={6}
          style={{ width: '100%', fontFamily: 'monospace' }}
        />
        <div className="import-actions">
          <button onClick={handleImport} disabled={!importText.trim()}>
            Import Keys
          </button>
          <button onClick={handleReset}>
            Generate New Keys
          </button>
        </div>
      </div>

      <div className="security-warning">
        <h4>Security Guidelines</h4>
        <ul>
          <li><strong>Never share private keys</strong> - Only share public keys</li>
          <li><strong>Store keys securely</strong> - Use encrypted storage in production</li>
          <li><strong>Backup safely</strong> - Keep secure offline copies</li>
          <li><strong>Verify integrity</strong> - Ensure keys haven't been tampered with</li>
        </ul>
      </div>
    </div>
  );
};
```

## Integration Patterns

### With Authentication Flow

```typescript
import React, { useState, useEffect } from 'react';
import { useGunKeys, useGunKeyAuth, useGun } from '@altrx/gundb-react-hooks';
import Gun from 'gun';
import SEA from 'gun/sea';

export const CompleteAuthFlow: React.FC = () => {
  const [authStep, setAuthStep] = useState<'keys' | 'auth' | 'ready'>('keys');
  
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
  const keys = useGunKeys(SEA);
  const [user, isLoggedIn, authError] = useGunKeyAuth(gun, keys!, false);

  // Progress through authentication steps
  useEffect(() => {
    if (keys && authStep === 'keys') {
      setAuthStep('auth');
    }
  }, [keys, authStep]);

  useEffect(() => {
    if (isLoggedIn && authStep === 'auth') {
      setAuthStep('ready');
    }
  }, [isLoggedIn, authStep]);

  const startAuth = () => {
    if (keys) {
      // Trigger authentication
      setAuthStep('auth');
    }
  };

  switch (authStep) {
    case 'keys':
      return (
        <div className="step-keys">
          <h3>Step 1: Key Generation</h3>
          {!keys ? (
            <div>
              <p>Generating your cryptographic keys...</p>
              <div className="spinner">⏳</div>
            </div>
          ) : (
            <div>
              <p>Keys generated successfully!</p>
              <p><strong>Public Key:</strong> {keys.pub.slice(0, 30)}...</p>
              <button onClick={() => setAuthStep('auth')}>
                Continue to Authentication →
              </button>
            </div>
          )}
        </div>
      );

    case 'auth':
      return (
        <div className="step-auth">
          <h3>Step 2: Authentication</h3>
          {authError ? (
            <div className="auth-error">
              <p>Authentication failed: {authError.err}</p>
              <button onClick={() => setAuthStep('keys')}>
                ← Back to Keys
              </button>
              <button onClick={startAuth}>
                Retry Authentication
              </button>
            </div>
          ) : !isLoggedIn ? (
            <div>
              <p>Ready to authenticate with your keys</p>
              <button onClick={startAuth}>
                Authenticate Now
              </button>
              <button onClick={() => setAuthStep('keys')}>
                ← Back to Keys
              </button>
            </div>
          ) : (
            <div>
              <p>Authentication successful!</p>
              <button onClick={() => setAuthStep('ready')}>
                Continue to App →
              </button>
            </div>
          )}
        </div>
      );

    case 'ready':
      return (
        <div className="step-ready">
          <h3>Step 3: Ready to Use</h3>
          <p>You're now authenticated and ready to use the app!</p>
          <div className="user-info">
            <p><strong>Public Key:</strong> {keys!.pub}</p>
            <p><strong>Authenticated:</strong> Yes</p>
          </div>
          <button onClick={() => {
            user.leave();
            setAuthStep('keys');
            window.location.reload();
          }}>
            Logout
          </button>
        </div>
      );

    default:
      return null;
  }
};
```

## Migration from v0.9.x

### Before (v0.9.x)

```typescript
// Simple key generation without detailed state management
const keys = useGunKeys(SEA);

// Limited error handling or progress indication
if (!keys) {
  return <div>Loading...</div>;
}
```

### After (v1.0.0)

```typescript
// Enhanced key generation with proper state management
const keys = useGunKeys(SEA, existingKeys);

// Better UX with detailed loading and error states
if (!keys) {
  return (
    <div className="key-generation">
      <h3>Generating Keys...</h3>
      <p>Creating your secure cryptographic key pair</p>
      <ProgressIndicator />
    </div>
  );
}

// Full key management with import/export capabilities
return <KeyManagementInterface keys={keys} />;
```

## Best Practices

1. **Secure Storage** - Never store private keys in plain text
2. **Progress Indication** - Show users that key generation is in progress
3. **Key Validation** - Always validate imported keys before use
4. **Backup Strategy** - Implement secure key backup mechanisms
5. **Error Handling** - Handle key generation failures gracefully
6. **Performance** - Key generation can be CPU intensive, provide feedback
7. **Security Awareness** - Educate users about key security
8. **Initial Values** - Use initial values to restore existing keys efficiently

## Security Considerations

- **Key Generation**: Uses cryptographically secure random number generation
- **Storage**: Private keys should be encrypted when stored
- **Transport**: Never transmit private keys over unsecured channels
- **Lifecycle**: Implement proper key rotation and expiration policies
- **Backup**: Secure backup mechanisms are essential for key recovery
- **Validation**: Always validate key integrity and format
