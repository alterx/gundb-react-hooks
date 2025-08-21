# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-21

### Major Release - Complete Rewrite

This release represents a significant overhaul of the library with breaking changes, improved TypeScript support, and enhanced developer experience.
It also consolidates the hooks and providers available at https://github.com/alterx/gundb-react-auth to provide an all emcompasing solution for GunDB and React integration.

### Added

#### Type Safety

- **Comprehensive TypeScript definitions** for all GunDB operations
- **Proper interface definitions** (`IGunChainReference`, `IGunUserReference`)
- **Strong type constraints** with `ValidGunData` and `NodeData<T>`
- **Enhanced error types** with contextual information (`GunError`)

#### Error Handling & Reliability

- **Error states in all hooks** - hooks now return `{ error, isLoading, isConnected }`
- **Input validation** for all operations (validateNodeID, validateData)
- **Connection timeout handling** (5-second timeout with proper error reporting)
- **Graceful failure handling** with try-catch blocks and error recovery
- **Development warnings** for common misconfigurations

#### Performance Optimizations

- **Fixed memory leaks** in `useGunOnNodeUpdated` with proper cleanup tracking
- **Memoization** of expensive operations using `useMemo` and `useCallback`
- **Optimized re-renders** with better dependency management
- **Debounced handler cleanup** to prevent memory accumulation

#### New Hooks & Utilities

- **`useGunContext`** - Access Gun instance through React context
- **`useGunDebug`** - Development debugging with detailed logging
- **`useGunConnection`** - Monitor connection status and health
- **`GunProvider`** - Context provider for Gun instance management
- **`AuthProvider`** - Authentication provider with key management and storage (from https://github.com/alterx/gundb-react-auth)
- **`useAuth`** - Hook for accessing authentication state and methods (from https://github.com/alterx/gundb-react-auth)

#### Enhanced Existing Hooks

- **`useGunState`** now returns `{ fields, put, remove, error, isLoading, isConnected }`
- **`useGunCollectionState`** now returns `{ collection, items, addToSet, updateInSet, removeFromSet, error, isLoading, count }`
- **`useGunKeyAuth`** now returns `[namespace, isLoggedIn, error]` with proper error handling
- **`useGunOnNodeUpdated`** has improved memory management and error handling

#### Developer Experience

- **Comprehensive development warnings** for configuration issues
- **Better debugging capabilities** with timestamped logs and context
- **Improved error messages** with specific context about where errors occurred
- **Type-safe operations** with IDE autocomplete and error detection
- **Integrated authentication system** with automatic key storage and retrieval
- **Storage abstraction** for flexible key persistence (localStorage, AsyncStorage, etc.)

### Changed

#### Breaking Changes

- **Hook return types** now include error and loading states
- **`useGunKeyAuth`** now returns a tuple with error as third element
- **Collection hooks** now provide both `collection` (Map) and `items` (Array)
- **Error handling** is now explicit rather than silent failures

#### API Improvements

- **More intuitive return objects** with consistent naming
- **Better function signatures** with proper TypeScript constraints
- **Enhanced validation** for all user inputs
- **Consistent error reporting** across all hooks

### Fixed

#### Critical Fixes

- **Memory leaks** in listener cleanup (useGunOnNodeUpdated)
- **Race conditions** in mount/unmount scenarios
- **Silent failures** in async operations
- **Improper error propagation** from GunDB callbacks

#### Type Safety Fixes

- **Removed extensive use of `any` types** (reduced by ~90%)
- **Fixed generic type constraints** for better IDE support
- **Proper nullable types** for optional parameters
- **Enhanced type inference** for hook return values

### Infrastructure

#### Development Tools

- **Enhanced debugging utilities** for development workflow
- **Better error boundaries** and error handling patterns
- **Improved development warnings** system
- **Type-safe development helpers**

#### Build & Distribution

- **Updated package metadata** with new keywords and description
- **Better TypeScript integration** with proper type exports
- **Enhanced module resolution** for both React and Preact

### Documentation

#### New Documentation and Updated Examples

- **Migration documentation**
- **TypeScript examples** in all documentation
- **Error handling patterns** and best practices
- **Type-safe examples** with proper error handling
- **Real-world usage patterns** with context providers
- **Performance optimization examples**
- **Debugging and development workflows**

### 🔧 Migration Guide

#### From v0.9.x to v1.0.0

**1. Update Hook Usage:**

```typescript
// Before
const { fields, put, remove } = useGunState(ref);

// After
const { fields, put, remove, error, isLoading } = useGunState(ref);
if (error) {
  console.error('Gun operation failed:', error);
}
```

**2. Update Collection Usage:**

```typescript
// Before
const { collection, addToSet } = useGunCollectionState(ref);
const items = Object.values(collection);

// After
const { items, addToSet, error, count } = useGunCollectionState(ref);
// items is now directly available as an array
```

**3. Update Authentication:**

```typescript
// Before
const [user, isLoggedIn] = useGunKeyAuth(gun, keys);

// After
const [user, isLoggedIn, authError] = useGunKeyAuth(gun, keys);
if (authError) {
  console.error('Authentication failed:', authError);
}
```

**4. Optional: Use Context Provider:**

```typescript
// New pattern (optional)
<GunProvider gun={Gun} options={opts}>
  <App />
</GunProvider>

// Then in components:
const gun = useGunContext();
```

**5. New: Use Authentication Provider:**

```typescript
// Set up authentication
<AuthProvider
  Gun={Gun}
  sea={SEA}
  storage={localStorage}
  gunOpts={gunOptions}
>
  <App />
</AuthProvider>

// Then in components:
const { user, login, logout, isLoggedIn, appKeys } = useAuth();

// Login with new keys
await login();

// Login with existing keys
await login(savedKeys);

// Logout
logout(() => console.log('Logged out'));
```

### Performance Improvements

- **Reduced unnecessary re-renders** through better memoization and dependency management
- **Fixed memory leaks** in listener cleanup and component unmounting
- **Eliminated uncleaned timeout handlers** in continuous testing scenarios
- **Improved bundle size** with better tree shaking

### Development Experience

- **Significantly reduced common development errors** through TypeScript definitions
- **Enhanced IDE support** with proper TypeScript definitions
- **Better debugging capabilities** with contextual logging
- **Comprehensive error messages** with actionable information

---

## [0.9.8] - Previous Release

### Features

- Basic GunDB React hooks implementation
- Support for React and Preact
- Encryption/decryption utilities
- Real-time updates with debouncing
- Collection state management

### Known Issues (Fixed in v1.0.0)

- Memory leaks in listener cleanup
- Limited TypeScript support
- Silent error failures
- Missing development tools
- Performance optimization opportunities

---

## Migration Support

For detailed migration instructions and compatibility information, see the detailed documentation for each hook.
