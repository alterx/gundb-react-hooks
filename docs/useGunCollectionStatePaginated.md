# useGunCollectionStatePaginated

A high-performance, memory-efficient hook for managing paginated GunDB collections with smart caching, real-time updates, and comprehensive filtering/sorting capabilities.

## Overview

`useGunCollectionStatePaginated` extends the functionality of `useGunCollectionState` by adding optimized pagination features designed for large datasets. It provides intelligent caching, preloading, and memory management while maintaining real-time synchronization with the GunDB network.

## Features

- **Memory Efficient** - Only loads current page + preloaded pages
- **Smart Caching** - Page-level caching with configurable TTL (default 5 minutes)
- **Real-time Updates** - Live synchronization with debounced updates
- **Preloading** - Configurable page preloading for smooth navigation
- **Filtering & Sorting** - Client-side data processing with type safety
- **Performance Monitoring** - Built-in cache statistics and performance metrics
- **Seamless Migration** - Drop-in replacement for `useGunCollectionState`

## Basic Usage

```typescript
import { useGunCollectionStatePaginated } from '@altrx/gundb-react-hooks';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

function PaginatedTodoList() {
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });

  const {
    currentPageItems,
    currentPage,
    totalPages,
    pageSize,
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
    hasNextPage,
    hasPrevPage,
    isLoadingPage,
    totalItems,
    addToSet,
    updateInSet,
    removeFromSet,
    error
  } = useGunCollectionStatePaginated<TodoItem>(
    gun.get('todos'),
    {
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
  );

  if (error) {
    return <div>Error: {error.err}</div>;
  }

  return (
    <div>
      <h2>Todos (Page {currentPage + 1} of {totalPages})</h2>

      {isLoadingPage ? (
        <div>Loading page...</div>
      ) : (
        <div>
          {currentPageItems.map(todo => (
            <div key={todo.nodeID}>
              <span>{todo.text}</span>
              <button onClick={() => updateInSet(todo.nodeID, {
                completed: !todo.completed
              })}>
                Toggle
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <button onClick={prevPage} disabled={!hasPrevPage}>
          Previous
        </button>
        <span>Page {currentPage + 1} of {totalPages}</span>
        <button onClick={nextPage} disabled={!hasNextPage}>
          Next
        </button>
      </div>
    </div>
  );
}
```

## API Reference

### Parameters

```typescript
useGunCollectionStatePaginated<T>(
  ref: IGunChainReference,
  options?: PaginationOptions<T>
)
```

#### `ref: IGunChainReference`

The GunDB reference to the collection/set to paginate.

#### `options: PaginationOptions<T>` (optional)

```typescript
interface PaginationOptions<T> {
  pageSize?: number; // Items per page (default: 10)
  sortBy?: keyof T; // Field to sort by
  sortOrder?: 'asc' | 'desc'; // Sort direction (default: 'asc')
  filter?: (item: T) => boolean; // Filter function
  preloadPages?: number; // Pages to preload ahead (default: 1)
  cacheTimeout?: number; // Cache TTL in ms (default: 300000 = 5min)
  debounceMs?: number; // Update debounce time (default: 100ms)
  appKeys?: KeyPair; // Encryption keys for private data
}
```

### Return Value

```typescript
interface UsePaginatedCollectionReturn<T> {
  // Current page data
  currentPageItems: NodeT<T>[]; // Items for current page
  currentPage: number; // Current page index (0-based)
  totalPages: number; // Total number of pages
  currentPageCount: number; // Items on current page

  // Pagination controls
  pageSize: number; // Current page size
  setPageSize: (size: number) => void; // Change page size
  nextPage: () => void; // Go to next page
  prevPage: () => void; // Go to previous page
  goToPage: (page: number) => void; // Go to specific page

  // Navigation state
  hasNextPage: boolean; // Can navigate forward
  hasPrevPage: boolean; // Can navigate backward
  isLoadingPage: boolean; // Page loading state

  // Collection info
  totalItems: number; // Total items in collection
  collection: Map<string, NodeT<T>>; // Complete collection map
  items: NodeT<T>[]; // All items (use with caution)

  // Collection operations (inherited from useGunCollectionState)
  addToSet: (data: T, nodeID?: string) => Promise<void>;
  updateInSet: (nodeID: string, data: Partial<T>) => Promise<void>;
  removeFromSet: (nodeID: string) => Promise<void>;

  // Error handling
  error: GunError | null; // Any errors that occurred

  // Performance monitoring
  preloadedPages: Set<number>; // Currently cached pages
  cacheStats: {
    // Cache performance metrics
    hits: number;
    misses: number;
    efficiency: number;
  };
}
```

## Advanced Usage

### Custom Filtering and Sorting

```typescript
function AdvancedTodoList() {
  const [priority, setPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortField, setSortField] = useState<keyof TodoItem>('createdAt');

  const {
    currentPageItems,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    setPageSize,
    pageSize
  } = useGunCollectionStatePaginated<TodoItem>(
    gun.get('todos'),
    {
      pageSize: 15,
      sortBy: sortField,
      sortOrder: 'desc',
      filter: (todo) => {
        if (priority === 'all') return true;
        return todo.priority === priority;
      },
      preloadPages: 2 // Preload 2 pages ahead
    }
  );

  return (
    <div>
      {/* Filter Controls */}
      <div>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
          <option value="createdAt">Created Date</option>
          <option value="text">Text</option>
          <option value="priority">Priority</option>
        </select>

        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {/* Items */}
      <div>
        {currentPageItems.map(todo => (
          <TodoItem key={todo.nodeID} todo={todo} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onNext={nextPage}
        onPrev={prevPage}
      />
    </div>
  );
}
```

### Performance Monitoring

```typescript
function PerformanceAwareList() {
  const {
    currentPageItems,
    preloadedPages,
    cacheStats,
    totalItems,
    totalPages,
    isLoadingPage
  } = useGunCollectionStatePaginated<TodoItem>(
    gun.get('todos'),
    {
      pageSize: 20,
      preloadPages: 3
    }
  );

  return (
    <div>
      {/* Performance Stats */}
      <div className="performance-stats">
        <h3>Performance Metrics</h3>
        <p>Total Items: {totalItems}</p>
        <p>Total Pages: {totalPages}</p>
        <p>Cached Pages: {preloadedPages.size}</p>
        <p>Cache Efficiency: {(cacheStats.efficiency * 100).toFixed(1)}%</p>
        <p>Cache Hits: {cacheStats.hits}</p>
        <p>Cache Misses: {cacheStats.misses}</p>
        {isLoadingPage && <p>Loading page...</p>}
      </div>

      {/* Items */}
      <div>
        {currentPageItems.map(item => (
          <div key={item.nodeID}>{item.text}</div>
        ))}
      </div>
    </div>
  );
}
```

### Real-time Updates with Authentication

```typescript
function AuthenticatedPaginatedList() {
  const { user, appKeys } = useAuth();

  const {
    currentPageItems,
    addToSet,
    updateInSet,
    removeFromSet,
    error
  } = useGunCollectionStatePaginated<TodoItem>(
    user?.get('todos'),
    {
      pageSize: 15,
      appKeys, // Enable encryption for private data
      sortBy: 'createdAt',
      sortOrder: 'desc',
      debounceMs: 150 // Slightly longer debounce for better performance
    }
  );

  const handleAddTodo = async () => {
    if (!user) return;

    try {
      await addToSet({
        id: `todo_${Date.now()}`,
        text: 'New encrypted todo',
        completed: false,
        createdAt: new Date().toISOString(),
        priority: 'medium'
      });
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  if (!user) {
    return <div>Please log in to view your todos.</div>;
  }

  if (error) {
    return <div>Error loading todos: {error.err}</div>;
  }

  return (
    <div>
      <button onClick={handleAddTodo}>Add Todo</button>

      {currentPageItems.map(todo => (
        <div key={todo.nodeID}>
          <span>{todo.text}</span>
          <button onClick={() => removeFromSet(todo.nodeID)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Migration from useGunCollectionState

The paginated hook is designed as a drop-in replacement with minimal code changes:

```typescript
// Before: useGunCollectionState
const {
  collection,
  items,
  addToSet,
  updateInSet,
  removeFromSet,
  error,
  isLoading,
  count,
} = useGunCollectionState<TodoItem>(ref);

// After: useGunCollectionStatePaginated
const {
  collection, // Same interface
  items, // Same interface (but use currentPageItems instead)
  currentPageItems, // New: items for current page
  addToSet, // Same interface
  updateInSet, // Same interface
  removeFromSet, // Same interface
  error, // Same interface
  isLoading, // Renamed to isLoadingPage
  count, // Renamed to totalItems
  // ... pagination-specific properties
} = useGunCollectionStatePaginated<TodoItem>(ref, {
  pageSize: 10,
});
```

### Key Changes

1. **Use `currentPageItems`** instead of `items` for rendering
2. **`isLoading`** becomes **`isLoadingPage`**
3. **`count`** becomes **`totalItems`**
4. **Add pagination options** to the second parameter

## Performance Guidelines

### Optimal Configuration

```typescript
// For small datasets (< 1000 items)
const pagination = useGunCollectionStatePaginated(ref, {
  pageSize: 25,
  preloadPages: 1,
});

// For medium datasets (1000-10000 items)
const pagination = useGunCollectionStatePaginated(ref, {
  pageSize: 50,
  preloadPages: 2,
  cacheTimeout: 300000, // 5 minutes
});

// For large datasets (> 10000 items)
const pagination = useGunCollectionStatePaginated(ref, {
  pageSize: 100,
  preloadPages: 1,
  cacheTimeout: 600000, // 10 minutes
  debounceMs: 200,
});
```

### Memory Management

- **Page Size**: 10-100 items per page depending on item complexity
- **Preloading**: 1-3 pages ahead (more for better UX, fewer for memory)
- **Cache Timeout**: 5-10 minutes for real-time apps, longer for static data
- **Debouncing**: 100-200ms for optimal real-time performance

### Best Practices

1. **Monitor Cache Efficiency**: Aim for >80% cache hit rate
2. **Adjust Page Size**: Based on item rendering complexity
3. **Use Filtering Wisely**: Client-side filtering is efficient up to ~10k items
4. **Consider Server-side**: For very large datasets, implement server-side pagination
5. **Profile Performance**: Use React DevTools to monitor re-renders

## Error Handling

```typescript
function RobustPaginatedList() {
  const {
    currentPageItems,
    error,
    isLoadingPage,
    addToSet
  } = useGunCollectionStatePaginated<TodoItem>(ref, {
    pageSize: 20
  });

  // Handle different error types
  if (error) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return <div>Network error. Retrying...</div>;
      case 'AUTH_ERROR':
        return <div>Authentication required.</div>;
      default:
        return <div>Error: {error.err}</div>;
    }
  }

  const handleAddWithErrorHandling = async (data: TodoItem) => {
    try {
      await addToSet(data);
    } catch (error) {
      // Handle operation-specific errors
      if (error.code === 'QUOTA_EXCEEDED') {
        alert('Storage quota exceeded');
      } else {
        console.error('Failed to add item:', error);
      }
    }
  };

  return (
    <div>
      {isLoadingPage && <div>Loading...</div>}

      {currentPageItems.map(item => (
        <div key={item.nodeID}>{item.text}</div>
      ))}

      <button onClick={() => handleAddWithErrorHandling(newTodo)}>
        Add Todo
      </button>
    </div>
  );
}
```

## TypeScript Support

The hook provides comprehensive TypeScript support with full type inference:

```typescript
interface CustomItem {
  title: string;
  description?: string;
  tags: string[];
  createdAt: Date;
  metadata: {
    author: string;
    version: number;
  };
}

// Full type safety
const {
  currentPageItems, // NodeT<CustomItem>[]
  addToSet, // (data: CustomItem, nodeID?: string) => Promise<void>
  updateInSet, // (nodeID: string, data: Partial<CustomItem>) => Promise<void>
} = useGunCollectionStatePaginated<CustomItem>(ref, {
  sortBy: 'createdAt', // Only accepts keyof CustomItem
  filter: (item) => {
    // item is typed as CustomItem
    return item.tags.includes('important');
  },
});
```
