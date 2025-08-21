# useGunOnNodeUpdated

A hook that subscribes to Gun node updates with comprehensive error handling, dependency tracking, and cleanup management.

## API Reference

### Signature

```typescript
useGunOnNodeUpdated<T>(
  node: IGunReference,
  dependencies: any[],
  onUpdate: (data: T, key?: string, msg?: any, ev?: any) => void,
  onCleanup?: () => void
): void
```

### Parameters

- `node` - Gun node reference to subscribe to
- `dependencies` - Array of dependencies that trigger re-subscription
- `onUpdate` - Callback function called when node updates
- `onCleanup` - Optional cleanup function called when subscription ends

### Update Callback Parameters

```typescript
onUpdate: (
  data: T,           // Updated data
  key?: string,      // Node key
  msg?: any,         // Gun message object
  ev?: any          // Event object
) => void
```

## Basic Usage

### Simple Node Subscription

```typescript
import React, { useState } from 'react';
import { useGun, useGunOnNodeUpdated, useGunState } from '@altrx/gundb-react-hooks';
import Gun from 'gun';

interface UserProfile {
  name: string;
  status: string;
  lastSeen: string;
}

export const UserProfileWatcher: React.FC = () => {
  const [userId] = useState('user_12345');
  const [updates, setUpdates] = useState<any[]>([]);
  
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
  const userNode = gun.get('users').get(userId);
  
  // Subscribe to user profile updates
  useGunOnNodeUpdated<UserProfile>(
    userNode,
    [userId], // Re-subscribe when userId changes
    (data, key, msg, ev) => {
      console.log('User profile updated:', data);
      
      // Track all updates
      setUpdates(prev => [{
        timestamp: new Date().toISOString(),
        data,
        key,
        type: 'profile_update'
      }, ...prev.slice(0, 9)]); // Keep last 10 updates
    },
    () => {
      console.log('User profile subscription cleaned up');
    }
  );

  const { fields: currentProfile, put: updateProfile } = useGunState<UserProfile>(userNode);

  const simulateUpdate = () => {
    updateProfile({
      name: 'John Doe',
      status: 'online',
      lastSeen: new Date().toISOString()
    });
  };

  return (
    <div className="user-profile-watcher">
      <h3>User Profile Watcher</h3>
      
      <div className="current-profile">
        <h4>Current Profile:</h4>
        <pre>{JSON.stringify(currentProfile, null, 2)}</pre>
        <button onClick={simulateUpdate}>
          Simulate Profile Update
        </button>
      </div>

      <div className="update-log">
        <h4>Update Log ({updates.length}/10):</h4>
        {updates.map((update, index) => (
          <div key={index} className="update-entry">
            <p><strong>Time:</strong> {new Date(update.timestamp).toLocaleTimeString()}</p>
            <p><strong>Data:</strong> {JSON.stringify(update.data, null, 2)}</p>
            {update.key && <p><strong>Key:</strong> {update.key}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Multi-Node Subscription

```typescript
import React, { useState, useCallback } from 'react';
import { useGun, useGunOnNodeUpdated } from '@altrx/gundb-react-hooks';

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
}

export const MultiChatWatcher: React.FC = () => {
  const [activeRooms, setActiveRooms] = useState<string[]>(['general', 'tech', 'random']);
  const [roomUpdates, setRoomUpdates] = useState<{[room: string]: ChatMessage[]}>({});
  
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });

  // Subscribe to each chat room
  activeRooms.forEach(roomId => {
    const roomNode = gun.get('chat').get(roomId);
    
    useGunOnNodeUpdated<ChatMessage>(
      roomNode,
      [roomId, gun], // Re-subscribe when room or gun changes
      useCallback((data: ChatMessage, key?: string) => {
        if (data && key) {
          setRoomUpdates(prev => ({
            ...prev,
            [roomId]: [
              { ...data, id: key },
              ...(prev[roomId] || []).slice(0, 19) // Keep last 20 messages
            ]
          }));
        }
      }, [roomId]),
      useCallback(() => {
        console.log(`Unsubscribed from room: ${roomId}`);
      }, [roomId])
    );
  });

  const addRoom = () => {
    const newRoom = prompt('Enter room name:');
    if (newRoom && !activeRooms.includes(newRoom)) {
      setActiveRooms(prev => [...prev, newRoom]);
    }
  };

  const removeRoom = (roomId: string) => {
    setActiveRooms(prev => prev.filter(id => id !== roomId));
    setRoomUpdates(prev => {
      const updated = { ...prev };
      delete updated[roomId];
      return updated;
    });
  };

  return (
    <div className="multi-chat-watcher">
      <h3>Multi-Chat Room Watcher</h3>
      
      <div className="room-controls">
        <button onClick={addRoom}>➕ Add Room</button>
      </div>

      <div className="chat-rooms">
        {activeRooms.map(roomId => (
          <div key={roomId} className="chat-room">
            <div className="room-header">
              <h4>#{roomId}</h4>
              <span className="message-count">
                {roomUpdates[roomId]?.length || 0} messages
              </span>
              <button onClick={() => removeRoom(roomId)}>❌</button>
            </div>
            
            <div className="room-messages">
              {(roomUpdates[roomId] || []).map((msg, index) => (
                <div key={index} className="message">
                  <strong>{msg.user}:</strong> {msg.message}
                  <small> - {new Date(msg.timestamp).toLocaleTimeString()}</small>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Advanced Usage

### Conditional Subscriptions

```typescript
import React, { useState } from 'react';
import { useGun, useGunOnNodeUpdated, useGunKeyAuth, useGunKeys } from '@altrx/gundb-react-hooks';
import SEA from 'gun/sea';

export const ConditionalSubscriptionExample: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
  const appKeys = useGunKeys(SEA);
  const [user, isLoggedIn] = useGunKeyAuth(gun, appKeys!);

  // Only subscribe when authenticated and monitoring is enabled
  const shouldSubscribe = isLoggedIn && isMonitoring && appKeys;
  
  if (shouldSubscribe) {
    // Subscribe to user's notifications
    useGunOnNodeUpdated(
      user.get('notifications'),
      [isLoggedIn, isMonitoring, appKeys], // Dependencies control subscription
      (data, key) => {
        if (data && key) {
          setNotifications(prev => [{
            id: key,
            ...data,
            receivedAt: new Date().toISOString()
          }, ...prev.slice(0, 49)]); // Keep last 50 notifications
        }
      },
      () => {
        console.log('Notification subscription cleaned up');
        setNotifications([]); // Clear notifications on cleanup
      }
    );

    // Subscribe to global announcements
    useGunOnNodeUpdated(
      gun.get('announcements'),
      [isLoggedIn, isMonitoring],
      (data, key) => {
        if (data && key) {
          // Show global announcements as special notifications
          setNotifications(prev => [{
            id: key,
            ...data,
            type: 'announcement',
            receivedAt: new Date().toISOString()
          }, ...prev]);
        }
      }
    );
  }

  if (!appKeys) {
    return <div>🔑 Generating keys...</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="auth-required">
        <h3>🔐 Authentication Required</h3>
        <p>Please log in to access notifications</p>
      </div>
    );
  }

  return (
    <div className="conditional-subscription">
      <h3>🔔 Notification Monitor</h3>
      
      <div className="monitor-controls">
        <label>
          <input
            type="checkbox"
            checked={isMonitoring}
            onChange={(e) => setIsMonitoring(e.target.checked)}
          />
          Enable Real-time Monitoring
        </label>
      </div>

      <div className="subscription-status">
        <p><strong>Status:</strong> 
          {shouldSubscribe ? 'Monitoring Active' : 'Monitoring Disabled'}
        </p>
        <p><strong>Notifications:</strong> {notifications.length}</p>
      </div>

      {isMonitoring && (
        <div className="notifications">
          <h4>📬 Live Notifications:</h4>
          {notifications.length === 0 ? (
            <p>No notifications yet...</p>
          ) : (
            notifications.map((notif, index) => (
              <div 
                key={index} 
                className={`notification ${notif.type === 'announcement' ? 'announcement' : ''}`}
              >
                <div className="notif-header">
                  <span className="notif-type">
                    {notif.type === 'announcement' ? '📢' : '🔔'}
                  </span>
                  <span className="notif-time">
                    {new Date(notif.receivedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="notif-content">
                  {JSON.stringify(notif, null, 2)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="test-controls">
        <button onClick={() => {
          if (user && isMonitoring) {
            user.get('notifications').set({
              message: 'Test notification',
              type: 'info',
              timestamp: new Date().toISOString()
            });
          }
        }}>
          Send Test Notification
        </button>
      </div>
    </div>
  );
};
```

### Error Handling and Monitoring

```typescript
import React, { useState, useCallback } from 'react';
import { useGun, useGunOnNodeUpdated } from '@altrx/gundb-react-hooks';

export const RobustSubscriptionExample: React.FC = () => {
  const [subscriptionStats, setSubscriptionStats] = useState({
    updates: 0,
    errors: 0,
    lastUpdate: null as Date | null,
    lastError: null as string | null
  });
  
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
  const dataNode = gun.get('monitoring_test');

  const handleUpdate = useCallback((data: any, key?: string, msg?: any, ev?: any) => {
    try {
      console.log('Update received:', { data, key, msg, ev });
      
      setSubscriptionStats(prev => ({
        ...prev,
        updates: prev.updates + 1,
        lastUpdate: new Date(),
        lastError: null // Clear error on successful update
      }));

      // Validate data structure
      if (data && typeof data === 'object') {
        // Process valid data
        console.log('Valid data processed:', data);
      } else {
        throw new Error('Invalid data format received');
      }
      
    } catch (error) {
      console.error('Error processing update:', error);
      
      setSubscriptionStats(prev => ({
        ...prev,
        errors: prev.errors + 1,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  const handleCleanup = useCallback(() => {
    console.log('Subscription cleanup executed');
    
    // Reset stats on cleanup
    setSubscriptionStats({
      updates: 0,
      errors: 0,
      lastUpdate: null,
      lastError: null
    });
  }, []);

  // Robust subscription with error handling
  useGunOnNodeUpdated(
    dataNode,
    [gun], // Re-subscribe if gun instance changes
    handleUpdate,
    handleCleanup
  );

  const generateTestData = () => {
    const testData = {
      id: Math.random().toString(36).substr(2, 9),
      message: `Test message ${Date.now()}`,
      timestamp: new Date().toISOString(),
      valid: true
    };
    
    dataNode.put(testData);
  };

  const generateInvalidData = () => {
    // Intentionally send invalid data to test error handling
    dataNode.put(null);
  };

  return (
    <div className="robust-subscription">
      <h3>Robust Subscription Example</h3>
      
      <div className="subscription-stats">
        <h4>Subscription Statistics:</h4>
        <div className="stats-grid">
          <div className="stat">
            <label>Updates Received:</label>
            <span className="value">{subscriptionStats.updates}</span>
          </div>
          <div className="stat">
            <label>Errors Encountered:</label>
            <span className={`value ${subscriptionStats.errors > 0 ? 'error' : ''}`}>
              {subscriptionStats.errors}
            </span>
          </div>
          <div className="stat">
            <label>Last Update:</label>
            <span className="value">
              {subscriptionStats.lastUpdate 
                ? subscriptionStats.lastUpdate.toLocaleTimeString()
                : 'Never'
              }
            </span>
          </div>
          {subscriptionStats.lastError && (
            <div className="stat error">
              <label>Last Error:</label>
              <span className="value">{subscriptionStats.lastError}</span>
            </div>
          )}
        </div>
      </div>

      <div className="test-controls">
        <h4>Test Controls:</h4>
        <button onClick={generateTestData}>
          Send Valid Data
        </button>
        <button onClick={generateInvalidData}>
          Send Invalid Data
        </button>
        <button onClick={() => {
          setSubscriptionStats({
            updates: 0,
            errors: 0,
            lastUpdate: null,
            lastError: null
          });
        }}>
          Reset Stats
        </button>
      </div>

      <div className="health-indicator">
        <h4>Subscription Health:</h4>
        <div className={`health-status ${
          subscriptionStats.errors === 0 ? 'healthy' : 
          subscriptionStats.errors < 5 ? 'warning' : 'critical'
        }`}>
          {subscriptionStats.errors === 0 ? 'Healthy' :
           subscriptionStats.errors < 5 ? 'Warning' : 'Critical'}
        </div>
        
        {subscriptionStats.updates > 0 && (
          <p>Success Rate: {
            ((subscriptionStats.updates / (subscriptionStats.updates + subscriptionStats.errors)) * 100).toFixed(1)
          }%</p>
        )}
      </div>
    </div>
  );
};
```

## Migration from v0.9.x

### Before (v0.9.x)

```typescript
// Basic subscription without comprehensive error handling
useGunOnNodeUpdated(
  user,
  { appKeys },
  (update) => {
    // Handle update
  },
  () => {
    // Basic cleanup
  }
);
```

### After (v1.0.0)

```typescript
// Enhanced subscription with proper dependency tracking and error handling
useGunOnNodeUpdated<UserData>(
  user,
  [appKeys, isLoggedIn], // Proper dependency array
  useCallback((data: UserData, key?: string, msg?: any, ev?: any) => {
    try {
      // Type-safe update handling
      if (data && isValidUserData(data)) {
        handleUserUpdate(data);
      }
    } catch (error) {
      console.error('Update processing error:', error);
    }
  }, [handleUserUpdate]),
  useCallback(() => {
    // Comprehensive cleanup
    console.log('User subscription cleaned up');
    clearUserCache();
  }, [clearUserCache])
);
```

## Best Practices

1. **Dependency Management** - Include all relevant dependencies in the dependency array
2. **Error Handling** - Always wrap update logic in try-catch blocks
3. **Cleanup** - Implement proper cleanup to prevent memory leaks
4. **Performance** - Use `useCallback` for update and cleanup functions
5. **Type Safety** - Use TypeScript generics for type-safe updates
6. **Validation** - Validate incoming data before processing
7. **Monitoring** - Track subscription health and performance
8. **Conditional Subscriptions** - Only subscribe when necessary

## Common Use Cases

1. **Real-time Chat** - Subscribe to chat room updates
2. **Live Data Feeds** - Monitor data streams and updates
3. **User Presence** - Track user online/offline status
4. **Notifications** - Real-time notification delivery
5. **Collaborative Editing** - Document change synchronization
6. **Gaming** - Real-time game state updates
7. **Monitoring** - System health and metrics tracking
8. **Social Feeds** - Live social media updates

## Performance Considerations

- **Memory Management**: Automatic cleanup prevents memory leaks
- **Re-subscription**: Dependencies control when to re-subscribe
- **Update Frequency**: Consider throttling high-frequency updates
- **Data Validation**: Validate data early to prevent processing errors
- **Batch Updates**: Group related updates when possible
