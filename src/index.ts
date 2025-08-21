// @ts-ignore
import React, { useState, useEffect, useReducer, useRef, useMemo, useCallback, useContext, createContext } from 'react';

// Enhanced TypeScript definitions
export interface IGunChainReference<T = any> {
  get(key: string): IGunChainReference<T>;
  put(data: T, callback?: (ack: { err?: string; ok?: any }) => void): IGunChainReference<T>;
  on(callback: (data: T, key: string, message?: any, event?: any) => void): () => void;
  once(callback: (data: T, key: string) => void): void;
  set(data: T, callback?: (ack: { err?: string; ok?: any }) => void): IGunChainReference<T>;
  map(): IGunChainReference<T>;
  open?(callback: (data: T, key: string, message?: any, event?: any) => void): void;
  user(soul?: string): IGunUserReference;
  off(): void;
  toString(): string;
}

export interface IGunUserReference extends IGunChainReference {
  is: KeyPair | null;
  auth(keypair: KeyPair, callback?: (ack: any) => void): void;
  create(keypair: KeyPair, callback?: (ack: any) => void): void;
  leave(): void;
}

export interface GunError {
  err: string;
  code?: string | number;
  context?: string;
}

export type ValidGunData = string | number | boolean | object | null;

// Legacy types for backward compatibility
export type GunStatic = any;
export type GunRef = IGunChainReference;
export type NamespacedRef = IGunUserReference;

export type KeyPair = {
  pub: string;
  priv: string;
  epub: string;
  epriv: string;
};

// Auth-related types
export type Storage = {
  getItem: (key: string) => any;
  setItem: (key: string, data: string) => any;
  removeItem: (key: string) => any;
};

export type AuthContextType = {
  gun: IGunChainReference;
  user: IGunUserReference;
  login: (keys?: undefined | string | KeyPair) => void;
  logout: (onLoggedOut?: () => void) => void;
  sea: any;
  appKeys: undefined | string | KeyPair;
  isLoggedIn: boolean;
  newGunInstance: (opts?: GunOptions) => IGunChainReference;
};

export type AuthProviderOpts = {
  Gun: any;
  sea: any;
  keyFieldName?: string;
  storage: Storage;
  gunOpts: GunOptions;
  children: React.ReactNode;
};

export type Options = {
  appKeys?: undefined | string | KeyPair;
  sea?: any;
  interval?: number;
  useOpen?: boolean;
};

export type NodeData<T extends ValidGunData> = T & { 
  readonly nodeID: string; 
  readonly _?: { '#': string; '>': Record<string, number> };
};

// Enhanced legacy type for backward compatibility
export type NodeT<T> = T & { nodeID: string; [key: string]: any };

export type ActionType<T> =
  | { type: 'add'; data: NodeT<T> | NodeT<T>[] }
  | { type: 'update'; data: NodeT<T> }
  | { type: 'remove'; data: { nodeID: string } };

export type UpdateType = {
  id: string;
  data: any;
};

export interface GunOptions
  extends Partial<{
    file: string;
    web: any;
    s3: {
      key: any;
      secret: any;
      bucket: any;
    };
    peers: string[] | Record<string, {}>;
    radisk: boolean;
    localStorage: boolean;
    uuid(): string;
    [key: string]: any;
  }> {}

export interface CollectionState<T>
  extends Partial<{
    collection: Map<string, T>;
    sorted: T[];
    infiniteScrolling: {
      isFetching: boolean;
      lastFetched: string;
      reverse: boolean;
    };
  }> {}

// Hook return types
export interface UseGunStateReturn<T> {
  fields: T;
  put: (data: Partial<T>) => Promise<void>;
  remove: (field: string) => Promise<void>;
  error: GunError | null;
  isLoading: boolean;
  isConnected: boolean;
}

export interface UseGunCollectionReturn<T> {
  collection: Map<string, NodeT<T>> | undefined;
  items: NodeT<T>[];
  addToSet: (data: T, nodeID?: string) => Promise<void>;
  updateInSet: (nodeID: string, data: Partial<T>) => Promise<void>;
  removeFromSet: (nodeID: string) => Promise<void>;
  error: GunError | null;
  isLoading: boolean;
  count: number;
}

export const encryptData = async (
  data: any,
  keys: undefined | string | KeyPair,
  sea: any
) => {
  try {
    return keys && sea ? await sea.encrypt(data, keys) : data;
  } catch (error) {
    console.warn('Failed to encrypt data:', error);
    return data;
  }
};

export const decryptData = async (
  data: any,
  keys: undefined | string | KeyPair,
  sea: any
) => {
  try {
    return keys && sea ? await sea.decrypt(data, keys) : data;
  } catch (error) {
    console.warn('Failed to decrypt data:', error);
    return data;
  }
};

// Utility functions
const validateNodeID = (nodeID: string): void => {
  if (!nodeID || typeof nodeID !== 'string' || nodeID.trim().length === 0) {
    throw new Error('Invalid nodeID: must be a non-empty string');
  }
};

const validateData = <T>(data: T, context: string): void => {
  if (data === undefined) {
    throw new Error(`Data cannot be undefined in ${context}`);
  }
};

const warnInDevelopment = (condition: boolean, message: string): void => {
  // @ts-ignore
  if (typeof window !== 'undefined' && condition) {
    console.warn(`[GunDB Hooks Warning] ${message}`);
  }
};

export const debouncedUpdates = (
  dispatcher: any,
  type = 'object',
  timeout = 100
) => {
  let updates: any[] = [];
  let handler: any;
  return (update: UpdateType) => {
    updates.push(update);
    if (!handler) {
      handler = setTimeout(() => {
        let newStateSlice = updates.reduce(
          (previousState, { id, data }) => {
            if (type === 'object') {
              previousState[id] = data;
            } else {
              previousState.set(id, data);
            }
            return previousState;
          },
          type === 'object' ? {} : new Map()
        );
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
};

export const useIsMounted = () => {
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  return isMounted;
};

export const nodeReducer = <T>(
  state: NodeT<T>,
  { data, type }: ActionType<T>
): T => {
  switch (type) {
    case 'add':
      return { ...state, ...data };
    case 'remove':
      delete state[data.nodeID];
      return { ...state };
    default:
      throw new Error();
  }
};

export const collectionReducer = <T>(
  state: CollectionState<T>,
  { data, type }: ActionType<T>
): CollectionState<T> => {
  switch (type) {
    case 'add':
      if (Array.isArray(data)) {
        data.forEach((item: NodeT<T>) => {
          state.collection?.set(item.nodeID, item);
        });
      } else {
        state.collection?.set(data.nodeID, data);
      }
      return {
        ...state,
        collection: state.collection,
      };
    case 'update':
      if (!Array.isArray(data)) {
        state.collection?.set(data.nodeID, data);
      }
      return {
        ...state,
        collection: state.collection,
      };
    case 'remove':
      state.collection?.delete(data.nodeID);
      return {
        ...state,
        collection: state.collection,
      };
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
};

export const useSafeReducer = <T>(
  reducer: any,
  initialState: T
): [T, Function] => {
  const [state, dispatch] = useReducer<React.Reducer<T, ActionType<T>>>(
    reducer,
    initialState
  );
  const isMounted = useIsMounted();

  function safeDispatch(args: ActionType<T>) {
    if (isMounted.current) {
      dispatch(args);
    }
  }

  return [state, safeDispatch];
};

export const useGun = (Gun: GunStatic, opts: GunOptions) => {
  const [gun, setGun] = useState(Gun({ ...opts }));

  useEffect(() => {
    if (opts) {
      setGun(Gun({ ...opts }));
    }
  }, [Gun, opts]);

  return gun;
};

export const useGunNamespace = (gun: GunRef, soul?: string) => {
  const [namespace, setNamespace] = useState(
    soul ? gun.user(soul) : gun.user()
  );
  useEffect(() => {
    if (gun && !namespace) {
      setNamespace(soul ? gun.user(soul) : gun.user());
    }
  }, [namespace, gun, soul]);
  return namespace;
};

export const useGunKeyAuth = (
  gun: GunRef,
  keys: KeyPair,
  triggerAuth: boolean = true
) => {
  // Will attempt to perform a login (when triggerAuth is set to true),
  // or, if false, returns a namespaced gun node
  const namespacedGraph = useGunNamespace(gun);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<GunError | null>(null);

  useEffect(() => {
    if (!gun) return;
    
    // @ts-ignore - Gun types are not properly defined
    const cleanup = gun.on('auth', () => {
      setIsLoggedIn(true);
      setError(null);
    });

    return cleanup;
  }, [gun]);

  useEffect(() => {
    if (namespacedGraph && !namespacedGraph.is && keys && triggerAuth) {
      try {
        namespacedGraph.auth(keys, (ack: any) => {
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

  return [namespacedGraph, isLoggedIn, error] as const;
};

export const useGunKeys = (
  sea: any,
  existingKeys?: KeyPair | undefined | null
) => {
  const [newKeys, setNewKeys] = useState<KeyPair | undefined | null>(
    existingKeys
  );

  useEffect(() => {
    async function getKeySet() {
      const pair: KeyPair = await sea.pair();
      setNewKeys(pair);
    }

    if (!newKeys && !existingKeys) {
      getKeySet();
    }

    if (existingKeys) {
      setNewKeys(existingKeys);
    }
  }, [existingKeys, newKeys, sea]);

  return newKeys;
};

export const useGunOnNodeUpdated = <T>(
  ref: GunRef,
  opts: Options = {
    appKeys: '',
    sea: null,
    useOpen: false,
  },
  cb: (data: T, nodeID: string) => void,
  cleanup?: () => void
) => {
  const { appKeys, sea, useOpen } = opts;
  const handler = useRef<(() => void) | null>(null);
  const isMounted = useIsMounted();

  useEffect(() => {
    if (!ref || !isMounted.current) return;

    const gunCb = async (
      encryptedField: any,
      nodeID: string,
      message: any,
      event: any
    ) => {
      if (!isMounted.current) return;
      
      try {
        let decryptedField = await decryptData(encryptedField, appKeys, sea);
        cb(decryptedField, nodeID);
      } catch (error) {
        console.warn('Failed to decrypt data in useGunOnNodeUpdated:', error);
      }

      if (!handler.current && event?.off) {
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

export const useGunState = <T>(
  ref: GunRef,
  opts: Options = {
    appKeys: '',
    sea: null,
    interval: 100,
    useOpen: false,
  }
): UseGunStateReturn<T> => {
  const { appKeys, sea, interval = 100 } = opts;
  const [fields, dispatch] = useSafeReducer<T>(nodeReducer, {} as T);
  const [error, setError] = useState<GunError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const debouncedHandlers = useRef<Function[]>([]);
  const isMounted = useIsMounted();

  // Development warnings
  useEffect(() => {
    warnInDevelopment(!ref, 'useGunState: ref is undefined');
    warnInDevelopment(!!(appKeys && !sea), 'useGunState: appKeys provided but no SEA instance');
  }, [ref, appKeys, sea]);

  // Memoized updater
  const updater = useMemo(() => debouncedUpdates(
    (data: any) => {
      if (isMounted.current) {
        dispatch({ type: 'add', data });
        setIsLoading(false);
        setIsConnected(true);
        setError(null);
      }
    },
    'object',
    interval
  ), [interval, isMounted]);

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

  useGunOnNodeUpdated(
    ref,
    opts,
    (item: any) => {
      try {
        if (item && typeof item === 'object') {
          Object.keys(item).forEach((key) => {
            let cleanFn = updater({ id: key, data: item[key] });
            debouncedHandlers.current.push(cleanFn);
          });
        }
      } catch (err) {
        setError({
          err: err instanceof Error ? err.message : 'Unknown error',
          context: 'useGunState data processing'
        });
      }
    },
    () => {
      if (debouncedHandlers.current.length) {
        //cleanup timeouts
        debouncedHandlers.current.forEach((c) => c());
        debouncedHandlers.current = [];
      }
    }
  );

  // Enhanced put with validation and error handling
  const put = useCallback(async (data: Partial<T>): Promise<void> => {
    try {
      validateData(data, 'useGunState.put');
      setError(null);
      
      let encryptedData = await encryptData(data, appKeys, sea);
      
      await new Promise<void>((resolve, reject) =>
        ref.put(encryptedData, (ack: any) => {
          if (ack.err) {
            const error: GunError = {
              err: ack.err,
              context: 'useGunState.put'
            };
            setError(error);
            reject(error);
          } else {
            resolve();
          }
        })
      );
    } catch (err) {
      const error: GunError = {
        err: err instanceof Error ? err.message : 'Unknown error',
        context: 'useGunState.put'
      };
      setError(error);
      throw error;
    }
  }, [ref, appKeys, sea]);

  // Enhanced remove with validation
  const remove = useCallback(async (field: string): Promise<void> => {
    try {
      validateNodeID(field);
      setError(null);
      
      await new Promise<void>((resolve, reject) =>
        ref.put(null, (ack: any) => {
          if (ack.err) {
            const error: GunError = {
              err: ack.err,
              context: 'useGunState.remove'
            };
            setError(error);
            reject(error);
          } else {
            if (isMounted.current) {
              dispatch({ type: 'remove', data: { nodeID: field } });
            }
            resolve();
          }
        })
      );
    } catch (err) {
      const error: GunError = {
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

export const useGunCollectionState = <T extends Record<string, any>>(
  ref: GunRef,
  opts: Options = {
    appKeys: '',
    sea: null,
    interval: 100,
    useOpen: false,
  }
): UseGunCollectionReturn<T> => {
  const { appKeys, sea, interval = 100 } = opts;
  const [{ collection }, dispatch] = useSafeReducer<CollectionState<NodeT<T>>>(
    collectionReducer,
    {
      collection: new Map(),
    }
  );

  const [error, setError] = useState<GunError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const debouncedHandlers = useRef<Function[]>([]);
  const isMounted = useIsMounted();

  // Development warnings
  useEffect(() => {
    warnInDevelopment(!ref, 'useGunCollectionState: ref is undefined');
    warnInDevelopment(!!(appKeys && !sea), 'useGunCollectionState: appKeys provided but no SEA instance');
  }, [ref, appKeys, sea]);

  // Memoized updater
  const updater = useMemo(() => debouncedUpdates(
    (data: NodeT<T>) => {
      if (isMounted.current) {
        dispatch({ type: 'add', data });
        setIsLoading(false);
        setError(null);
      }
    },
    'map',
    interval
  ), [interval, isMounted]);

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

  useGunOnNodeUpdated(
    ref.map(),
    opts,
    (item: T, nodeID: string) => {
      if (item && typeof item === 'object') {
        try {
          setError(null);
          let cleanFn = updater({
            id: nodeID,
            data: { ...item, nodeID } as NodeT<T>,
          });
          debouncedHandlers.current.push(cleanFn);
        } catch (err) {
          setError({
            err: err instanceof Error ? err.message : 'Unknown error',
            context: 'useGunCollectionState data processing'
          });
        }
      }
    },
    () => {
      if (debouncedHandlers.current.length) {
        //cleanup timeouts
        debouncedHandlers.current.forEach((c) => c());
        debouncedHandlers.current = [];
      }
    }
  );

  // Working with Sets - Enhanced CRUD operations

  const updateInSet = useCallback(async (nodeID: string, data: Partial<T>): Promise<void> => {
    try {
      validateNodeID(nodeID);
      validateData(data, 'useGunCollectionState.updateInSet');
      setError(null);
      
      let encryptedData = await encryptData(data, appKeys, sea);
      await new Promise<void>((resolve, reject) =>
        ref
          .get(nodeID)
          .put(encryptedData, (ack: any) => {
            if (ack.err) {
              const error: GunError = {
                err: ack.err,
                context: 'useGunCollectionState.updateInSet'
              };
              setError(error);
              reject(error);
            } else {
              if (isMounted.current) {
                dispatch({ type: 'update', data: { nodeID, ...data } as NodeT<T> });
              }
              resolve();
            }
          })
      );
    } catch (err) {
      const error: GunError = {
        err: err instanceof Error ? err.message : 'Unknown error',
        context: 'useGunCollectionState.updateInSet'
      };
      setError(error);
      throw error;
    }
  }, [ref, appKeys, sea, isMounted]);

  const addToSet = useCallback(async (data: T, nodeID?: string): Promise<void> => {
    try {
      validateData(data, 'useGunCollectionState.addToSet');
      setError(null);
      
      let encryptedData = await encryptData(data, appKeys, sea);
      
      const promise = nodeID 
        ? new Promise<void>((resolve, reject) =>
            ref.get(nodeID).put(encryptedData, (ack: any) =>
              ack.err ? reject(new Error(ack.err)) : resolve()
            )
          )
        : new Promise<void>((resolve, reject) =>
            ref.set(encryptedData, (ack: any) =>
              ack.err ? reject(new Error(ack.err)) : resolve()
            )
          );
          
      await promise;
    } catch (err) {
      const error: GunError = {
        err: err instanceof Error ? err.message : 'Unknown error',
        context: 'useGunCollectionState.addToSet'
      };
      setError(error);
      throw error;
    }
  }, [ref, appKeys, sea]);

  const removeFromSet = useCallback(async (nodeID: string): Promise<void> => {
    try {
      validateNodeID(nodeID);
      setError(null);
      
      await new Promise<void>((resolve, reject) =>
        ref
          .get(nodeID)
          .put(null, (ack: any) => {
            if (ack.err) {
              const error: GunError = {
                err: ack.err,
                context: 'useGunCollectionState.removeFromSet'
              };
              setError(error);
              reject(error);
            } else {
              if (isMounted.current) {
                dispatch({ type: 'remove', data: { nodeID } });
              }
              resolve();
            }
          })
      );
    } catch (err) {
      const error: GunError = {
        err: err instanceof Error ? err.message : 'Unknown error',
        context: 'useGunCollectionState.removeFromSet'
      };
      setError(error);
      throw error;
    }
  }, [ref, isMounted]);

  // Convert Map to Array for easier consumption
  const items = useMemo(() => 
    collection ? Array.from(collection.values()) : [], 
    [collection]
  );

  const count = useMemo(() => collection?.size || 0, [collection]);

  return { 
    collection, 
    items, // More convenient array access
    addToSet, 
    updateInSet, 
    removeFromSet,
    error,
    isLoading,
    count
  };
};

// Auth Context and Provider
export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<AuthProviderOpts> = ({
  Gun,
  sea,
  keyFieldName = 'keys',
  storage,
  gunOpts,
  children,
}) => {
  if (!sea || !Gun || !gunOpts) {
    throw new Error('Provide gunOpts, Gun and sea');
  }

  const [{ isReadyToAuth, existingKeys, keyStatus }, setStatuses] = useState<{
    isReadyToAuth: string;
    existingKeys: KeyPair | null;
    keyStatus: string;
  }>({
    isReadyToAuth: '',
    existingKeys: null,
    keyStatus: '',
  });

  const gun = useGun(Gun, gunOpts);
  // new keypair
  const newKeys = useGunKeys(sea);
  const [user, isLoggedIn] = useGunKeyAuth(
    gun,
    existingKeys || undefined,
    isReadyToAuth === 'ready'
  );

  useEffect(() => {
    if (isLoggedIn && existingKeys && keyStatus === 'new') {
      const storeKeys = async () => {
        await storage.setItem(keyFieldName, JSON.stringify(existingKeys));
      };
      storeKeys();
    }
  }, [isLoggedIn, existingKeys, keyFieldName, storage, keyStatus]);

  useEffect(() => {
    if (!existingKeys) {
      const getKeys = async () => {
        try {
          const k = await storage.getItem(keyFieldName);
          const ks = JSON.parse(k || 'null');
          setStatuses({
            isReadyToAuth: 'ready',
            existingKeys: ks,
            keyStatus: ks ? 'existing' : 'new',
          });
        } catch (error) {
          console.warn('Failed to retrieve keys from storage:', error);
          setStatuses({
            isReadyToAuth: 'ready',
            existingKeys: null,
            keyStatus: 'new',
          });
        }
      };
      getKeys();
    }
  }, [storage, keyFieldName, existingKeys]);

  const login = useCallback(
    async (keys?: undefined | string | KeyPair) => {
      // use keys sent by the user or a new set
      setStatuses({
        isReadyToAuth: 'ready',
        existingKeys: (keys as KeyPair) || newKeys || null,
        keyStatus: 'new',
      });
    },
    [setStatuses, newKeys]
  );

  const logout = useCallback(
    (onLoggedOut?: () => void) => {
      const removeKeys = async () => {
        try {
          await storage.removeItem(keyFieldName);
          setStatuses({
            isReadyToAuth: '',
            existingKeys: null,
            keyStatus: '',
          });
          if (user) {
            user.leave();
          }
          if (onLoggedOut) {
            onLoggedOut();
          }
        } catch (error) {
          console.warn('Failed to remove keys from storage:', error);
        }
      };
      removeKeys();
    },
    [keyFieldName, storage, user]
  );

  const newGunInstance = useCallback((opts: GunOptions = gunOpts) => {
    return Gun(opts);
  }, [Gun, gunOpts]);

  const value = useMemo<AuthContextType>(() => ({
    gun,
    user,
    login,
    logout,
    sea,
    appKeys: existingKeys || newKeys,
    isLoggedIn,
    newGunInstance,
  }), [
    gun,
    user,
    login,
    logout,
    sea,
    newKeys,
    existingKeys,
    isLoggedIn,
    newGunInstance,
  ]);

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Context provider for Gun instance
export const GunContext = createContext<IGunChainReference | null>(null);

export const GunProvider: React.FC<{
  gun: GunStatic;
  options: GunOptions;
  children: React.ReactNode;
}> = ({ gun, options, children }) => {
  const gunInstance = useMemo(() => {
    try {
      return gun(options);
    } catch (err) {
      console.error('Failed to initialize Gun instance:', err);
      return null;
    }
  }, [gun, JSON.stringify(options)]);
  
  return React.createElement(
    GunContext.Provider,
    { value: gunInstance },
    children
  );
};

export const useGunContext = (): IGunChainReference => {
  const context = useContext(GunContext);
  if (!context) {
    throw new Error('useGunContext must be used within a GunProvider');
  }
  return context;
};

// Debug utility hook
export const useGunDebug = (
  ref: IGunChainReference, 
  label: string,
  enabled: boolean = true
): void => {
  useEffect(() => {
    if (!enabled || !ref) return;
    
    console.log(`[GunDB Debug - ${label}] Listening to:`, ref);
    
    const cleanup = ref.on((data, key) => {
      console.log(`[${label}] Update:`, { 
        key, 
        data, 
        timestamp: new Date().toISOString() 
      });
    });
    
    return cleanup;
  }, [ref, label, enabled]);
};

// Connection status hook
export const useGunConnection = (ref: IGunChainReference): {
  isConnected: boolean;
  lastSeen: Date | null;
  error: GunError | null;
} => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [error, setError] = useState<GunError | null>(null);

  useEffect(() => {
    if (!ref) return;

    let timeoutId: number;

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

    const cleanup = ref.on(() => {
      setIsConnected(true);
      setLastSeen(new Date());
      setError(null);
      resetTimeout();
    });

    // Initial timeout
    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      if (cleanup) cleanup();
    };
  }, [ref]);

  return { isConnected, lastSeen, error };
};
