import React, { createContext, useRef, useEffect, useReducer, useState, useMemo, useCallback, useContext } from 'preact/hooks';

function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}

const encryptData = async (data, keys, sea) => {
  try {
    return keys && sea ? await sea.encrypt(data, keys) : data;
  } catch (error) {
    console.warn('Failed to encrypt data:', error);
    return data;
  }
};
const decryptData = async (data, keys, sea) => {
  try {
    return keys && sea ? await sea.decrypt(data, keys) : data;
  } catch (error) {
    console.warn('Failed to decrypt data:', error);
    return data;
  }
};
// Utility functions
const debounce = (func, wait) => {
  let timeout = null;
  return (...args) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
};
const validateNodeID = nodeID => {
  if (!nodeID || typeof nodeID !== 'string' || nodeID.trim().length === 0) {
    throw new Error('Invalid nodeID: must be a non-empty string');
  }
};
const validateData = (data, context) => {
  if (data === undefined) {
    throw new Error(`Data cannot be undefined in ${context}`);
  }
};
const warnInDevelopment = (condition, message) => {
  // @ts-ignore
  if (typeof window !== 'undefined' && condition) {
    console.warn(`[GunDB Hooks Warning] ${message}`);
  }
};
const debouncedUpdates = (dispatcher, type = 'object', timeout = 100) => {
  let updates = [];
  let handler;
  const updateFunction = update => {
    updates.push(update);
    if (!handler) {
      handler = setTimeout(() => {
        let newStateSlice = updates.reduce((previousState, {
          id,
          data
        }) => {
          if (type === 'object') {
            previousState[id] = data;
          } else {
            previousState.set(id, data);
          }
          return previousState;
        }, type === 'object' ? {} : new Map());
        dispatcher(newStateSlice);
        updates = [];
        handler = null;
      }, timeout);
    }
    return () => {
      clearTimeout(handler);
      updates = [];
      handler = null;
    };
  };
  // Add cleanup method to the function
  updateFunction.cleanup = () => {
    if (handler) {
      clearTimeout(handler);
      updates = [];
      handler = null;
    }
  };
  return updateFunction;
};
const useIsMounted = () => {
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  return isMounted;
};
const nodeReducer = (state, {
  data,
  type
}) => {
  switch (type) {
    case 'add':
      return _extends({}, state, data);
    case 'remove':
      delete state[data.nodeID];
      return _extends({}, state);
    default:
      throw new Error();
  }
};
const collectionReducer = (state, {
  data,
  type
}) => {
  switch (type) {
    case 'add':
      const newCollectionForAdd = new Map(state.collection);
      if (Array.isArray(data)) {
        data.forEach(item => {
          newCollectionForAdd.set(item.nodeID, item);
        });
      } else {
        newCollectionForAdd.set(data.nodeID, data);
      }
      return _extends({}, state, {
        collection: newCollectionForAdd
      });
    case 'update':
      if (!Array.isArray(data)) {
        const newCollectionForUpdate = new Map(state.collection);
        newCollectionForUpdate.set(data.nodeID, data);
        return _extends({}, state, {
          collection: newCollectionForUpdate
        });
      }
      return state;
    case 'remove':
      const newCollectionForRemove = new Map(state.collection);
      newCollectionForRemove.delete(data.nodeID);
      return _extends({}, state, {
        collection: newCollectionForRemove
      });
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
};
const useSafeReducer = (reducer, initialState) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const isMounted = useIsMounted();
  function safeDispatch(args) {
    if (isMounted.current) {
      dispatch(args);
    }
  }
  return [state, safeDispatch];
};
const useGun = (Gun, opts) => {
  const [gun, setGun] = useState(Gun(_extends({}, opts)));
  useEffect(() => {
    if (opts) {
      setGun(Gun(_extends({}, opts)));
    }
  }, [Gun, opts]);
  return gun;
};
const useGunNamespace = (gun, soul) => {
  const [namespace, setNamespace] = useState(gun && soul ? gun.user(soul) : gun ? gun.user() : null);
  useEffect(() => {
    if (gun && !namespace) {
      setNamespace(soul ? gun.user(soul) : gun.user());
    }
  }, [namespace, gun, soul]);
  return namespace;
};
const useGunKeyAuth = (gun, keys, triggerAuth = true) => {
  // Will attempt to perform a login (when triggerAuth is set to true),
  // or, if false, returns a namespaced gun node
  const namespacedGraph = useGunNamespace(gun);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!gun) return;
    // @ts-ignore - Gun types are not properly defined
    const off = gun.on('auth', () => {
      setIsLoggedIn(true);
      setError(null);
    });
    // Ensure we always return a function for cleanup
    return () => {
      if (typeof off === 'function') {
        try {
          off();
        } catch (e) {}
      } else if (typeof gun.off === 'function') {
        try {
          gun.off();
        } catch (e) {}
      }
    };
  }, [gun]);
  // Reset isLoggedIn when keys are cleared or triggerAuth is false
  useEffect(() => {
    if (!keys || !triggerAuth) {
      setIsLoggedIn(false);
      setError(null);
    }
  }, [keys, triggerAuth]);
  // Check if user is still authenticated
  useEffect(() => {
    if (namespacedGraph && namespacedGraph.is) {
      setIsLoggedIn(true);
    } else if (namespacedGraph && !namespacedGraph.is && isLoggedIn) {
      setIsLoggedIn(false);
    }
  }, [namespacedGraph, isLoggedIn]);
  useEffect(() => {
    if (namespacedGraph && !namespacedGraph.is && keys && triggerAuth) {
      try {
        namespacedGraph.auth(keys, ack => {
          if (ack.err) {
            setError({
              err: ack.err,
              context: 'useGunKeyAuth.auth'
            });
          }
        });
      } catch (err) {
        setError({
          err: err instanceof Error ? err.message : 'Authentication failed',
          context: 'useGunKeyAuth'
        });
      }
    }
  }, [triggerAuth, namespacedGraph, keys]);
  return [namespacedGraph, isLoggedIn, error];
};
const useGunKeys = (sea, existingKeys) => {
  const [newKeys, setNewKeys] = useState(existingKeys);
  useEffect(() => {
    const getKeySet = async () => {
      const pair = await sea.pair();
      setNewKeys(pair);
    };
    if (!newKeys && !existingKeys) {
      getKeySet().catch(console.error);
    }
    if (existingKeys) {
      setNewKeys(existingKeys);
    }
  }, [existingKeys, newKeys, sea]);
  return newKeys;
};
const useGunOnNodeUpdated = (ref, opts = {
  appKeys: '',
  sea: null,
  useOpen: false
}, cb, cleanup) => {
  const {
    appKeys,
    sea,
    useOpen
  } = opts;
  const handler = useRef(null);
  const isMounted = useIsMounted();
  useEffect(() => {
    if (!ref || !isMounted.current) return;
    const gunCb = async (encryptedField, nodeID, message, event) => {
      if (!isMounted.current) return;
      try {
        let decryptedField = await decryptData(encryptedField, appKeys, sea);
        cb(decryptedField, nodeID);
      } catch (error) {
        console.warn('Failed to decrypt data in useGunOnNodeUpdated:', error);
      }
      if (!handler.current && event != null && event.off) {
        handler.current = () => event.off();
      }
    };
    if (useOpen) {
      if (!ref.open) {
        throw new Error('Please include gun/lib/open.');
      } else {
        ref.open(gunCb);
      }
    } else {
      ref.on(gunCb);
    }
    return () => {
      if (handler.current) {
        //cleanup gun .on listener
        handler.current();
        handler.current = null;
      }
      if (cleanup) {
        cleanup();
      }
    };
  }, [ref, appKeys, sea, useOpen, cb, cleanup, isMounted]);
};
const useGunState = (ref, opts = {
  appKeys: '',
  sea: null,
  interval: 100,
  useOpen: false
}) => {
  const {
    appKeys,
    sea,
    interval = 100,
    useOpen
  } = opts;
  // Memoize the options to prevent unnecessary re-renders
  const memoizedOpts = useMemo(() => ({
    appKeys,
    sea,
    interval,
    useOpen
  }), [appKeys, sea, interval, useOpen]);
  const [fields, dispatch] = useSafeReducer(nodeReducer, {});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const debouncedHandlers = useRef([]);
  const isMounted = useIsMounted();
  // Development warnings
  useEffect(() => {
    warnInDevelopment(!ref, 'useGunState: ref is undefined');
    warnInDevelopment(!!(appKeys && !sea), 'useGunState: appKeys provided but no SEA instance');
  }, [ref, appKeys, sea]);
  // Memoized updater - stabilize with useCallback
  const updater = useCallback(debouncedUpdates(data => {
    if (isMounted.current) {
      dispatch({
        type: 'add',
        data
      });
      setIsLoading(false);
      setIsConnected(true);
      setError(null);
    }
  }, 'object', interval), [interval, isMounted]);
  // Connection timeout
  useEffect(() => {
    const connectionTimeout = setTimeout(() => {
      if (isLoading) {
        setError({
          err: 'Connection timeout - no data received',
          context: 'useGunState connection'
        });
        setIsLoading(false);
      }
    }, 5000); // 5 second timeout
    return () => clearTimeout(connectionTimeout);
  }, [isLoading]);
  // Memoized callback to prevent infinite re-renders
  const nodeUpdateCallback = useCallback(item => {
    try {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(key => {
          let cleanFn = updater({
            id: key,
            data: item[key]
          });
          debouncedHandlers.current.push(cleanFn);
        });
      }
    } catch (err) {
      setError({
        err: err instanceof Error ? err.message : 'Unknown error',
        context: 'useGunState data processing'
      });
    }
  }, [updater]);
  // Memoized cleanup callback
  const cleanupCallback = useCallback(() => {
    if (debouncedHandlers.current.length) {
      //cleanup timeouts
      debouncedHandlers.current.forEach(c => c());
      debouncedHandlers.current = [];
    }
  }, []);
  useGunOnNodeUpdated(ref, memoizedOpts, nodeUpdateCallback, cleanupCallback);
  // Enhanced put with validation and error handling
  const put = useCallback(async data => {
    if (!ref) {
      throw new Error('useGunState: ref is undefined');
    }
    try {
      validateData(data, 'useGunState.put');
      setError(null);
      let encryptedData = await encryptData(data, appKeys, sea);
      await new Promise((resolve, reject) => ref.put(encryptedData, ack => {
        if (ack.err) {
          const error = {
            err: ack.err,
            context: 'useGunState.put'
          };
          setError(error);
          reject(error);
        } else {
          resolve();
        }
      }));
    } catch (err) {
      const error = {
        err: err instanceof Error ? err.message : 'Unknown error',
        context: 'useGunState.put'
      };
      setError(error);
      throw error;
    }
  }, [ref, appKeys, sea]);
  // Enhanced remove with validation
  const remove = useCallback(async field => {
    if (!ref) {
      throw new Error('useGunState: ref is undefined');
    }
    try {
      validateNodeID(field);
      setError(null);
      await new Promise((resolve, reject) => ref.put(null, ack => {
        if (ack.err) {
          const error = {
            err: ack.err,
            context: 'useGunState.remove'
          };
          setError(error);
          reject(error);
        } else {
          if (isMounted.current) {
            dispatch({
              type: 'remove',
              data: {
                nodeID: field
              }
            });
          }
          resolve();
        }
      }));
    } catch (err) {
      const error = {
        err: err instanceof Error ? err.message : 'Unknown error',
        context: 'useGunState.remove'
      };
      setError(error);
      throw error;
    }
  }, [ref, isMounted]);
  return {
    fields,
    put,
    remove,
    error,
    isLoading,
    isConnected
  };
};
const useGunCollectionState = (ref, opts = {
  appKeys: '',
  sea: null,
  interval: 100,
  useOpen: false
}) => {
  const {
    appKeys,
    sea,
    interval = 100,
    useOpen
  } = opts;
  // Memoize the options to prevent unnecessary re-renders
  const memoizedOpts = useMemo(() => ({
    appKeys,
    sea,
    interval,
    useOpen
  }), [appKeys, sea, interval, useOpen]);
  const [{
    collection
  }, dispatch] = useSafeReducer(collectionReducer, {
    collection: new Map()
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const debouncedHandlers = useRef([]);
  const isMounted = useIsMounted();
  // Early return if ref is null/undefined
  const hasValidRef = Boolean(ref);
  // Development warnings
  useEffect(() => {
    warnInDevelopment(!ref, 'useGunCollectionState: ref is undefined');
    warnInDevelopment(!!(appKeys && !sea), 'useGunCollectionState: appKeys provided but no SEA instance');
  }, [ref, appKeys, sea]);
  // Set loading to false if no valid ref
  useEffect(() => {
    if (!hasValidRef) {
      setIsLoading(false);
    }
  }, [hasValidRef]);
  // Memoized updater - stabilize with useCallback
  const updater = useCallback(debouncedUpdates(dataMap => {
    if (isMounted.current) {
      // Convert Map to array of items for batch dispatch
      const items = Array.from(dataMap.values());
      dispatch({
        type: 'add',
        data: items
      });
      setIsLoading(false);
      setError(null);
    }
  }, 'map', interval), [interval, isMounted]);
  // Connection timeout
  useEffect(() => {
    const connectionTimeout = setTimeout(() => {
      if (isLoading) {
        setError({
          err: 'Connection timeout - no data received',
          context: 'useGunCollectionState connection'
        });
        setIsLoading(false);
      }
    }, 5000);
    return () => clearTimeout(connectionTimeout);
  }, [isLoading]);
  // Memoized callback to prevent infinite re-renders
  const nodeUpdateCallback = useCallback((item, nodeID) => {
    if (item && typeof item === 'object') {
      try {
        setError(null);
        let cleanFn = updater({
          id: nodeID,
          data: _extends({}, item, {
            nodeID
          })
        });
        debouncedHandlers.current.push(cleanFn);
      } catch (err) {
        setError({
          err: err instanceof Error ? err.message : 'Unknown error',
          context: 'useGunCollectionState data processing'
        });
      }
    }
  }, [updater]);
  // Memoized cleanup callback
  const cleanupCallback = useCallback(() => {
    if (debouncedHandlers.current.length) {
      //cleanup timeouts
      debouncedHandlers.current.forEach(c => c());
      debouncedHandlers.current = [];
    }
  }, []);
  useGunOnNodeUpdated(ref ? ref.map() : null, memoizedOpts, nodeUpdateCallback, cleanupCallback);
  // Working with Sets - Enhanced CRUD operations
  const updateInSet = useCallback(async (nodeID, data) => {
    if (!ref) {
      throw new Error('useGunCollectionState: ref is undefined');
    }
    try {
      validateNodeID(nodeID);
      validateData(data, 'useGunCollectionState.updateInSet');
      setError(null);
      let encryptedData = await encryptData(data, appKeys, sea);
      await new Promise((resolve, reject) => ref.get(nodeID).put(encryptedData, ack => {
        if (ack.err) {
          const error = {
            err: ack.err,
            context: 'useGunCollectionState.updateInSet'
          };
          setError(error);
          reject(error);
        } else {
          if (isMounted.current) {
            dispatch({
              type: 'update',
              data: _extends({
                nodeID
              }, data)
            });
          }
          resolve();
        }
      }));
    } catch (err) {
      const error = {
        err: err instanceof Error ? err.message : 'Unknown error',
        context: 'useGunCollectionState.updateInSet'
      };
      setError(error);
      throw error;
    }
  }, [ref, appKeys, sea, isMounted]);
  const addToSet = useCallback(async (data, nodeID) => {
    if (!ref) {
      throw new Error('useGunCollectionState: ref is undefined');
    }
    try {
      validateData(data, 'useGunCollectionState.addToSet');
      setError(null);
      let encryptedData = await encryptData(data, appKeys, sea);
      const promise = nodeID ? new Promise((resolve, reject) => ref.get(nodeID).put(encryptedData, ack => ack.err ? reject(new Error(ack.err)) : resolve())) : new Promise((resolve, reject) => ref.set(encryptedData, ack => ack.err ? reject(new Error(ack.err)) : resolve()));
      await promise;
    } catch (err) {
      const error = {
        err: err instanceof Error ? err.message : 'Unknown error',
        context: 'useGunCollectionState.addToSet'
      };
      setError(error);
      throw error;
    }
  }, [ref, appKeys, sea]);
  const removeFromSet = useCallback(async nodeID => {
    if (!ref) {
      throw new Error('useGunCollectionState: ref is undefined');
    }
    try {
      validateNodeID(nodeID);
      setError(null);
      await new Promise((resolve, reject) => ref.get(nodeID).put(null, ack => {
        if (ack.err) {
          const error = {
            err: ack.err,
            context: 'useGunCollectionState.removeFromSet'
          };
          setError(error);
          reject(error);
        } else {
          if (isMounted.current) {
            dispatch({
              type: 'remove',
              data: {
                nodeID
              }
            });
          }
          resolve();
        }
      }));
    } catch (err) {
      const error = {
        err: err instanceof Error ? err.message : 'Unknown error',
        context: 'useGunCollectionState.removeFromSet'
      };
      setError(error);
      throw error;
    }
  }, [ref, isMounted]);
  // Convert Map to Array for easier consumption
  const items = useMemo(() => Array.from(collection.values()), [collection]);
  const count = useMemo(() => collection.size, [collection]);
  return {
    collection,
    items,
    addToSet,
    updateInSet,
    removeFromSet,
    error,
    isLoading,
    count
  };
};
// Paginated Collection Hook with Optimizations
const useGunCollectionStatePaginated = (ref, paginationOpts = {}) => {
  const {
    pageSize = 20,
    sortBy,
    sortOrder = 'asc',
    filter,
    preloadPages = 1,
    currentPage: initialPage = 0,
    appKeys = '',
    sea = null,
    interval = 100,
    useOpen = false
  } = paginationOpts;
  // Extract Options for the base collection hook - memoize to prevent infinite re-renders
  const opts = useMemo(() => ({
    appKeys,
    sea,
    interval,
    useOpen
  }), [appKeys, sea, interval, useOpen]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentPageItems, setCurrentPageItems] = useState([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  // Sync currentPage state with initialPage prop when it changes
  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);
  // Cache for pages
  const pageCache = useRef(new Map());
  const cacheTimestamps = useRef(new Map());
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  // Use original hook for basic collection management
  const baseCollection = useGunCollectionState(ref, opts);
  // Cache utilities - memoize to prevent re-creation
  const getCachedPage = useCallback(page => {
    const cached = pageCache.current.get(page);
    const timestamp = cacheTimestamps.current.get(page);
    if (cached && timestamp && Date.now() - timestamp < CACHE_TTL) {
      return cached;
    }
    return null;
  }, []);
  const setCachedPage = useCallback((page, items) => {
    pageCache.current.set(page, items);
    cacheTimestamps.current.set(page, Date.now());
  }, []);
  // Process and sort all items - memoize with stable dependencies
  const processedItems = useMemo(() => {
    const allItems = Array.from(baseCollection.collection.values());
    // Apply filtering
    let filteredItems = filter ? allItems.filter(filter) : allItems;
    // Apply sorting
    if (sortBy) {
      filteredItems = [...filteredItems].sort((a, b) => {
        if (typeof sortBy === 'function') {
          return sortOrder === 'asc' ? sortBy(a, b) : sortBy(b, a);
        }
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        let comparison = 0;
        if (aVal < bVal) comparison = -1;else if (aVal > bVal) comparison = 1;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }
    return filteredItems;
  }, [baseCollection.collection, filter, sortBy, sortOrder]);
  // Update total items when processed items change
  useEffect(() => {
    setTotalItems(processedItems.length);
    // Clear cache when data changes significantly
    pageCache.current.clear();
    cacheTimestamps.current.clear();
  }, [processedItems]);
  // Load specific page - memoize to prevent unnecessary recreations
  const loadPage = useCallback(async page => {
    if (page < 0) return;
    setIsLoadingPage(true);
    try {
      // Check cache first
      const cached = getCachedPage(page);
      if (cached) {
        setCurrentPageItems(cached);
        setIsLoadingPage(false);
        return;
      }
      // Extract page from processed items
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      const pageItems = processedItems.slice(startIndex, endIndex);
      // Cache the page
      setCachedPage(page, pageItems);
      setCurrentPageItems(pageItems);
      // Preload adjacent pages
      for (let i = 1; i <= preloadPages; i++) {
        const nextPage = page + i;
        const prevPage = page - i;
        setTimeout(() => {
          if (nextPage * pageSize < processedItems.length && !getCachedPage(nextPage)) {
            const nextStartIndex = nextPage * pageSize;
            const nextEndIndex = nextStartIndex + pageSize;
            const nextPageItems = processedItems.slice(nextStartIndex, nextEndIndex);
            setCachedPage(nextPage, nextPageItems);
          }
        }, 50 * i);
        setTimeout(() => {
          if (prevPage >= 0 && !getCachedPage(prevPage)) {
            const prevStartIndex = prevPage * pageSize;
            const prevEndIndex = prevStartIndex + pageSize;
            const prevPageItems = processedItems.slice(prevStartIndex, prevEndIndex);
            setCachedPage(prevPage, prevPageItems);
          }
        }, 50 * i);
      }
    } catch (error) {
      console.error('Failed to load page:', error);
    } finally {
      setIsLoadingPage(false);
    }
  }, [pageSize, processedItems, preloadPages, getCachedPage, setCachedPage]);
  // Pagination calculations - memoize to prevent recalculations
  const totalPages = useMemo(() => Math.ceil(totalItems / pageSize), [totalItems, pageSize]);
  const hasNextPage = useMemo(() => currentPage < totalPages - 1, [currentPage, totalPages]);
  const hasPrevPage = useMemo(() => currentPage > 0, [currentPage]);
  // Pagination controls - memoize to prevent re-creation
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      loadPage(newPage);
    }
  }, [currentPage, hasNextPage, loadPage]);
  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      loadPage(newPage);
    }
  }, [currentPage, hasPrevPage, loadPage]);
  const goToPage = useCallback(page => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
      loadPage(page);
    }
  }, [totalPages, loadPage]);
  const setNewPageSize = useCallback(size => {
    if (size <= 0) return;
    // Calculate which item we're currently viewing
    const currentItemIndex = currentPage * pageSize;
    // Calculate new page number to maintain position
    const newPage = Math.floor(currentItemIndex / size);
    setCurrentPage(newPage);
    pageCache.current.clear(); // Clear cache since page size changed
    cacheTimestamps.current.clear();
    loadPage(newPage).catch(console.error);
  }, [currentPage, pageSize, loadPage]);
  // Load current page when page changes or data updates
  useEffect(() => {
    if (totalPages > 0) {
      // Ensure current page is valid
      if (currentPage >= totalPages) {
        const newPage = Math.max(0, totalPages - 1);
        setCurrentPage(newPage);
        loadPage(newPage).catch(console.error);
      } else {
        loadPage(currentPage).catch(console.error);
      }
    } else if (processedItems.length > 0) {
      // Even if totalPages calculation isn't ready, try to load the current page
      loadPage(currentPage).catch(console.error);
    }
  }, [currentPage, totalPages, loadPage, processedItems.length]);
  // Initial load effect - ensure pagination happens on mount
  useEffect(() => {
    if (processedItems.length > 0) {
      loadPage(currentPage).catch(console.error);
    }
  }, [processedItems.length]); // Only depend on length to avoid infinite re-renders
  // Real-time updates - update cache when base collection changes
  // Memoize and debounce this to prevent excessive updates
  const updatePageCache = useMemo(() => debounce(updatedItem => {
    // Only update pages that might contain this item
    pageCache.current.forEach((page, pageNum) => {
      const itemIndex = page.findIndex(item => item.nodeID === updatedItem.nodeID);
      if (itemIndex !== -1) {
        page[itemIndex] = updatedItem;
        // Trigger re-render only for current page
        if (pageNum === currentPage) {
          setCurrentPageItems([...page]);
        }
      }
    });
  }, 100), [currentPage]);
  // Watch for changes in base collection to update cache
  useEffect(() => {
    if (baseCollection.collection) {
      Array.from(baseCollection.collection.values()).forEach(item => {
        updatePageCache(item);
      });
    }
  }, [baseCollection.collection, updatePageCache]);
  // Memoize preloaded pages to prevent object recreation
  const preloadedPages = useMemo(() => new Set(Array.from(pageCache.current.keys())), []);
  return _extends({}, baseCollection, {
    // Override items to return paginated items instead of all items
    items: currentPageItems,
    // Override count to return total filtered items count
    count: totalItems,
    // Pagination state
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    pageSize,
    // Pagination actions
    nextPage,
    prevPage,
    goToPage,
    setPageSize: setNewPageSize,
    // Current page data
    currentPageItems,
    currentPageCount: currentPageItems.length,
    // Optimizations
    isLoadingPage,
    preloadedPages
  });
};
// Auth Context and Provider
const AuthContext = createContext(null);
const AuthProvider = ({
  Gun,
  sea,
  keyFieldName: _keyFieldName = 'keys',
  storage,
  gunOpts,
  children
}) => {
  if (!sea || !Gun || !gunOpts) {
    throw new Error('Provide gunOpts, Gun and sea');
  }
  const [{
    isReadyToAuth,
    existingKeys,
    keyStatus
  }, setStatuses] = useState({
    isReadyToAuth: '',
    existingKeys: null,
    keyStatus: ''
  });
  const gun = useGun(Gun, gunOpts);
  // new keypair
  const newKeys = useGunKeys(sea);
  const [user, isLoggedIn] = useGunKeyAuth(gun, existingKeys || undefined, isReadyToAuth === 'ready');
  useEffect(() => {
    if (isLoggedIn && existingKeys && keyStatus === 'new') {
      const storeKeysEffect = async () => {
        try {
          await storage.setItem(_keyFieldName, JSON.stringify(existingKeys));
        } catch (error) {
          console.error('Failed to store keys:', error);
        }
      };
      storeKeysEffect();
    }
  }, [isLoggedIn, existingKeys, _keyFieldName, storage, keyStatus]);
  useEffect(() => {
    if (!existingKeys) {
      const getKeys = async () => {
        try {
          const k = await storage.getItem(_keyFieldName);
          const ks = JSON.parse(k || 'null');
          setStatuses({
            isReadyToAuth: 'ready',
            existingKeys: ks,
            keyStatus: ks ? 'existing' : 'new'
          });
        } catch (error) {
          console.warn('Failed to retrieve keys from storage:', error);
          setStatuses({
            isReadyToAuth: 'ready',
            existingKeys: null,
            keyStatus: 'new'
          });
        }
      };
      getKeys();
    }
  }, [storage, _keyFieldName, existingKeys]);
  const login = useCallback(keys => {
    // use keys sent by the user or a new set
    setStatuses({
      isReadyToAuth: 'ready',
      existingKeys: keys || newKeys || null,
      keyStatus: 'new'
    });
  }, [setStatuses, newKeys]);
  const logout = useCallback(onLoggedOut => {
    const removeKeys = async () => {
      try {
        // Call user.leave() first to properly logout from Gun
        if (user && user.leave) {
          user.leave();
        }
        // Remove keys from storage
        await storage.removeItem(_keyFieldName);
        // Reset the authentication state
        setStatuses({
          isReadyToAuth: '',
          existingKeys: null,
          keyStatus: ''
        });
        // Call the callback if provided
        if (onLoggedOut) {
          onLoggedOut();
        }
      } catch (error) {
        console.warn('Failed to remove keys from storage:', error);
        // Still call the callback even if storage removal fails
        if (onLoggedOut) {
          onLoggedOut();
        }
      }
    };
    removeKeys();
  }, [_keyFieldName, storage, user]);
  const newGunInstance = useCallback((opts = gunOpts) => {
    return Gun(opts);
  }, [Gun, gunOpts]);
  const value = useMemo(() => ({
    gun,
    user,
    login,
    logout,
    sea,
    appKeys: existingKeys || newKeys,
    isLoggedIn,
    newGunInstance
  }), [gun, user, login, logout, sea, newKeys, existingKeys, isLoggedIn, newGunInstance]);
  return React.createElement(AuthContext.Provider, {
    value
  }, children);
};
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
// Context provider for Gun instance
const GunContext = createContext(null);
const safeStringifyOptions = options => {
  try {
    return JSON.stringify(options, (key, value) => {
      var _value$constructor;
      // Skip circular references and functions
      if (typeof value === 'function' || typeof value === 'object' && value !== null && (_value$constructor = value.constructor) != null && (_value$constructor = _value$constructor.name) != null && _value$constructor.includes('Gun')) {
        return '[Circular/Function]';
      }
      return value;
    });
  } catch (err) {
    return String(Math.random()); // Force re-render if serialization fails
  }
};
const GunProvider = ({
  gun,
  options,
  children
}) => {
  const memoizedOptions = useMemo(() => safeStringifyOptions(options), [options]);
  const gunInstance = useMemo(() => {
    try {
      return gun(memoizedOptions);
    } catch (err) {
      console.error('Failed to initialize Gun instance:', err);
      return null;
    }
  }, [gun, memoizedOptions]);
  return React.createElement(GunContext.Provider, {
    value: gunInstance
  }, children);
};
const useGunContext = () => {
  const context = useContext(GunContext);
  if (!context) {
    throw new Error('useGunContext must be used within a GunProvider');
  }
  return context;
};
// Debug utility hook
const useGunDebug = (ref, label, enabled = true) => {
  useEffect(() => {
    if (!enabled || !ref) return;
    console.log(`[GunDB Debug - ${label}] Listening to:`, ref);
    // subscribe
    const off = ref.on((data, key) => {
      console.log(`[${label}] Update:`, {
        key,
        data,
        timestamp: new Date().toISOString()
      });
    });
    // cleanup
    return () => {
      if (typeof off === 'function') {
        try {
          off();
        } catch (e) {}
      } else if (typeof ref.off === 'function') {
        try {
          ref.off();
        } catch (e) {}
      }
    };
  }, [ref, label, enabled]);
};
// Connection status hook
const useGunConnection = ref => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!ref) return;
    let timeoutId;
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setIsConnected(false);
        setError({
          err: 'Connection timeout',
          context: 'useGunConnection'
        });
      }, 10000); // 10 second timeout
    };
    // subscribe
    const off = ref.on(() => {
      setIsConnected(true);
      setLastSeen(new Date());
      setError(null);
      resetTimeout();
    });
    // Initial timeout
    resetTimeout();
    return () => {
      clearTimeout(timeoutId);
      if (typeof off === 'function') {
        try {
          off();
        } catch (e) {}
      } else if (typeof ref.off === 'function') {
        try {
          ref.off();
        } catch (e) {}
      }
    };
  }, [ref]);
  return {
    isConnected,
    lastSeen,
    error
  };
};

export { AuthContext, AuthProvider, GunContext, GunProvider, collectionReducer, debouncedUpdates, decryptData, encryptData, nodeReducer, useAuth, useGun, useGunCollectionState, useGunCollectionStatePaginated, useGunConnection, useGunContext, useGunDebug, useGunKeyAuth, useGunKeys, useGunNamespace, useGunOnNodeUpdated, useGunState, useIsMounted, useSafeReducer };
//# sourceMappingURL=gundb-react-hooks.modern.mjs.map
