# useGunCollectionState

A hook that provides access to Gun Sets (collections) with comprehensive CRUD operations, error handling, and TypeScript support.

## API Reference

### Signature

```typescript
useGunCollectionState<T>(ref: GunRef, opts?: Options): UseGunCollectionReturn<T>
```

### Return Type

```typescript
interface UseGunCollectionReturn<T> {
  collection: Map<string, NodeT<T>> | undefined; // Raw Map collection
  items: NodeT<T>[]; // Array for easy iteration
  addToSet: (data: T, nodeID?: string) => Promise<void>; // Add item
  updateInSet: (nodeID: string, data: Partial<T>) => Promise<void>; // Update item
  removeFromSet: (nodeID: string) => Promise<void>; // Remove item
  error: GunError | null; // Error state
  isLoading: boolean; // Loading state
  count: number; // Item count
}
```

### Data Type

```typescript
type NodeT<T> = T & {
  nodeID: string; // Unique identifier for each item
  [key: string]: any;
};
```

## Basic Usage

### Simple Todo List

```typescript
import React from 'react';
import { useGun, useGunCollectionState } from '@altrx/gundb-react-hooks';
import Gun from 'gun';

interface TodoItem {
  text: string;
  completed: boolean;
  createdAt: string;
}

export const TodoApp: React.FC = () => {
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });

  const {
    items: todos,
    addToSet: addTodo,
    updateInSet: updateTodo,
    removeFromSet: removeTodo,
    error,
    isLoading,
    count
  } = useGunCollectionState<TodoItem>(gun.get('todos'));

  // Handle loading state
  if (isLoading) {
    return <div>Loading todos...</div>;
  }

  // Handle errors
  if (error) {
    return (
      <div className="error">
        <h3>Error loading todos</h3>
        <p>{error.err}</p>
        {error.context && <small>Context: {error.context}</small>}
      </div>
    );
  }

  const handleAddTodo = async () => {
    try {
      await addTodo({
        text: `New todo ${Date.now()}`,
        completed: false,
        createdAt: new Date().toISOString()
      });
      console.log('Todo added successfully');
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const handleToggleTodo = async (todo: NodeT<TodoItem>) => {
    try {
      await updateTodo(todo.nodeID, {
        completed: !todo.completed
      });
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDeleteTodo = async (nodeID: string) => {
    try {
      await removeTodo(nodeID);
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  return (
    <div>
      <h1>Todo List ({count} items)</h1>

      <button onClick={handleAddTodo} className="add-button">
        Add Todo
      </button>

      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.nodeID} className={todo.completed ? 'completed' : ''}>
            <span
              onClick={() => handleToggleTodo(todo)}
              style={{
                textDecoration: todo.completed ? 'line-through' : 'none',
                cursor: 'pointer'
              }}
            >
              {todo.text}
            </span>
            <button onClick={() => handleDeleteTodo(todo.nodeID)}>
              Delete
            </button>
            <small>Created: {new Date(todo.createdAt).toLocaleDateString()}</small>
          </li>
        ))}
      </ul>

      {todos.length === 0 && (
        <p>No todos yet. Add one above!</p>
      )}
    </div>
  );
};
```

## Advanced Usage

### Real-time Chat with Authentication

```typescript
import React, { useState } from 'react';
import {
  useGun,
  useGunCollectionState,
  useGunKeyAuth,
  useGunKeys
} from '@altrx/gundb-react-hooks';
import Gun from 'gun';
import SEA from 'gun/sea';

interface ChatMessage {
  text: string;
  author: string;
  timestamp: string;
  encrypted?: boolean;
}

export const ChatApp: React.FC = () => {
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
  const appKeys = useGunKeys(SEA);
  const [user, isLoggedIn, authError] = useGunKeyAuth(gun, appKeys!);

  if (authError) {
    return <div>Auth Error: {authError.err}</div>;
  }

  if (!appKeys || !isLoggedIn) {
    return <div>Authenticating...</div>;
  }

  return <ChatRoom user={user} appKeys={appKeys} />;
};

const ChatRoom: React.FC<{ user: any; appKeys: any }> = ({ user, appKeys }) => {
  const [messageText, setMessageText] = useState('');

  const {
    items: messages,
    addToSet: sendMessage,
    error,
    isLoading,
    count
  } = useGunCollectionState<ChatMessage>(
    user.get('chat').get('room1'),
    { appKeys, sea: SEA } // Encrypted messages
  );

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      await sendMessage({
        text: messageText,
        author: appKeys.pub.slice(0, 8), // Short public key as username
        timestamp: new Date().toISOString(),
        encrypted: true
      });
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (isLoading) return <div>Loading chat...</div>;
  if (error) return <div>Chat Error: {error.err}</div>;

  // Sort messages by timestamp
  const sortedMessages = messages.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="chat-room">
      <h2>Encrypted Chat Room ({count} messages)</h2>

      <div className="messages">
        {sortedMessages.map(message => (
          <div key={message.nodeID} className="message">
            <strong>{message.author}:</strong> {message.text}
            <small>{new Date(message.timestamp).toLocaleTimeString()}</small>
            {message.encrypted && <span>🔒</span>}
          </div>
        ))}
      </div>

      <div className="message-input">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};
```

### Advanced Shopping Cart

```typescript
import React from 'react';
import { useGunCollectionState, useGunContext } from '@altrx/gundb-react-hooks';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  addedAt: string;
}

export const ShoppingCart: React.FC = () => {
  const gun = useGunContext();

  const {
    items: cartItems,
    addToSet: addToCart,
    updateInSet: updateCartItem,
    removeFromSet: removeFromCart,
    error,
    isLoading,
    count
  } = useGunCollectionState<CartItem>(gun.get('user').get('cart'));

  // Calculate total price
  const totalPrice = cartItems.reduce((total, item) =>
    total + (item.price * item.quantity), 0
  );

  const handleAddProduct = async (product: Omit<CartItem, 'addedAt'>) => {
    try {
      await addToCart({
        ...product,
        addedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleUpdateQuantity = async (nodeID: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(nodeID);
    } else {
      try {
        await updateCartItem(nodeID, { quantity: newQuantity });
      } catch (error) {
        console.error('Failed to update quantity:', error);
      }
    }
  };

  if (isLoading) return <div>Loading cart...</div>;
  if (error) return <div>Cart Error: {error.err}</div>;

  return (
    <div className="shopping-cart">
      <h2>Shopping Cart ({count} items)</h2>

      {cartItems.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map(item => (
              <div key={item.nodeID} className="cart-item">
                <h4>{item.name}</h4>
                <p>Price: ${item.price}</p>
                <div className="quantity-controls">
                  <button onClick={() =>
                    handleUpdateQuantity(item.nodeID, item.quantity - 1)
                  }>
                    -
                  </button>
                  <span>Qty: {item.quantity}</span>
                  <button onClick={() =>
                    handleUpdateQuantity(item.nodeID, item.quantity + 1)
                  }>
                    +
                  </button>
                </div>
                <p>Subtotal: ${(item.price * item.quantity).toFixed(2)}</p>
                <button onClick={() => removeFromCart(item.nodeID)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Total: ${totalPrice.toFixed(2)}</h3>
            <button className="checkout-button">Checkout</button>
          </div>
        </>
      )}

      {/* Example add product buttons */}
      <div className="product-examples">
        <h3>Sample Products</h3>
        <button onClick={() => handleAddProduct({
          productId: '1',
          name: 'Coffee Mug',
          price: 12.99,
          quantity: 1
        })}>
          Add Coffee Mug ($12.99)
        </button>
        <button onClick={() => handleAddProduct({
          productId: '2',
          name: 'Notebook',
          price: 8.50,
          quantity: 1
        })}>
          Add Notebook ($8.50)
        </button>
      </div>
    </div>
  );
};
```

## Error Handling Patterns

### Comprehensive Error Handling

```typescript
const TodoListWithErrorHandling: React.FC = () => {
  const [retryCount, setRetryCount] = useState(0);

  const {
    items,
    addToSet,
    error,
    isLoading
  } = useGunCollectionState<TodoItem>(ref);

  // Retry mechanism
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload(); // Simple retry
  };

  // Different error handling strategies
  if (error) {
    if (error.context === 'useGunCollectionState connection') {
      return (
        <div className="connection-error">
          <h3>Connection Error</h3>
          <p>Unable to connect to the Gun network</p>
          <button onClick={handleRetry}>Retry Connection</button>
        </div>
      );
    }

    if (error.context?.includes('addToSet')) {
      return (
        <div className="operation-error">
          <h3>Failed to Add Item</h3>
          <p>{error.err}</p>
          <button onClick={handleRetry}>Try Again</button>
        </div>
      );
    }

    // Generic error fallback
    return (
      <div className="generic-error">
        <h3>Something went wrong</h3>
        <p>{error.err}</p>
        <details>
          <summary>Error Details</summary>
          <p>Context: {error.context}</p>
          <p>Code: {error.code}</p>
          <p>Retry count: {retryCount}</p>
        </details>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  return <div>{/* Normal component */}</div>;
};
```

## Migration from v0.9.x

### Before (v0.9.x)

```typescript
const { collection, addToSet, updateInSet, removeFromSet } =
  useGunCollectionState(ref);

// Manual array conversion
const items = collection ? Array.from(collection.values()) : [];
const count = collection?.size || 0;

// No error handling
addToSet(data); // Could fail silently
```

### After (v1.0.0)

```typescript
const {
  collection,           // Still available as Map
  items,               // NEW: Direct array access
  addToSet,
  updateInSet,
  removeFromSet,
  error,               // NEW: Error state
  isLoading,           // NEW: Loading state
  count                // NEW: Built-in count
} = useGunCollectionState(ref);

// Explicit error handling
if (error) {
  console.error('Collection error:', error.err);
}

// Use items directly (no manual conversion needed)
items.map(item => <div key={item.nodeID}>{item.name}</div>)

// Async operations with error handling
try {
  await addToSet(data);
} catch (error) {
  console.error('Failed to add:', error);
}
```

## Performance Tips

### Optimization Strategies

```typescript
import { useMemo, useCallback } from 'react';

const OptimizedCollection: React.FC = () => {
  const { items, addToSet } = useGunCollectionState<TodoItem>(ref);

  // Memoize filtered/sorted data
  const completedTodos = useMemo(() =>
    items.filter(todo => todo.completed),
    [items]
  );

  const sortedTodos = useMemo(() =>
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [items]
  );

  // Memoize event handlers
  const handleAddTodo = useCallback(async (text: string) => {
    await addToSet({
      text,
      completed: false,
      createdAt: new Date().toISOString()
    });
  }, [addToSet]);

  return (
    <div>
      <h3>Completed: {completedTodos.length}</h3>
      {sortedTodos.map(todo => (
        <TodoItem key={todo.nodeID} todo={todo} onAdd={handleAddTodo} />
      ))}
    </div>
  );
};
```

## Best Practices

1. **Use TypeScript interfaces** for your collection item types
2. **Handle errors explicitly** - Always check the `error` state
3. **Show loading states** - Use `isLoading` for better UX
4. **Use `items` for iteration** - More convenient than Map conversion
5. **Validate inputs** - Check data before calling `addToSet`/`updateInSet`
6. **Handle async operations** - Use try-catch with CRUD operations
7. **Optimize with memoization** - Use `useMemo` for expensive filtering/sorting
8. **Monitor collection size** - Use the built-in `count` property
