// @ts-ignore
import React, {
  useState,
  useEffect,
  useReducer,
  useRef,
  useMemo,
  useCallback,
  useContext,
  createContext,
} from 'react';

export interface IGunChainReference<T = any> {
  get(key: string): IGunChainReference<T>;
  put(
    data: T,
    callback?: (ack: { err?: string; ok?: any }) => void,
  ): IGunChainReference<T>;
  on(
    callback: (data: T, key: string, message?: any, event?: any) => void,
  ): () => void;
  once(callback: (data: T, key: string) => void): void;
  set(
    data: T,
    callback?: (ack: { err?: string; ok?: any }) => void,
  ): IGunChainReference<T>;
  map(): IGunChainReference<T>;
  open?(
    callback: (data: T, key: string, message?: any, event?: any) => void,
  ): void;
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

export type GunStatic = any;
export type GunRef = IGunChainReference | null;
export type NamespacedRef = IGunUserReference;

export type KeyPair = {
  pub: string;
  priv: string;
  epub: string;
  epriv: string;
};

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

export interface CollectionState<T> {
  collection: Map<string, T>;
  sorted?: T[];
  infiniteScrolling?: {
    isFetching: boolean;
    lastFetched: string;
    reverse: boolean;
  };
}

export interface UseGunStateReturn<T> {
  fields: T;
  put: (data: Partial<T>) => Promise<void>;
  remove: (field: string) => Promise<void>;
  error: GunError | null;
  isLoading: boolean;
  isConnected: boolean;
}

export interface UseGunCollectionReturn<T> {
  collection: Map<string, NodeT<T>>;
  items: NodeT<T>[];
  addToSet: (data: T, nodeID?: string) => Promise<void>;
  updateInSet: (nodeID: string, data: Partial<T>) => Promise<void>;
  removeFromSet: (nodeID: string) => Promise<void>;
  error: GunError | null;
  isLoading: boolean;
  count: number;
}

export interface PaginationOptions<T> extends Options {
  pageSize?: number;
  currentPage?: number;
  sortBy?: keyof T | ((a: NodeT<T>, b: NodeT<T>) => number);
  sortOrder?: 'asc' | 'desc';
  filter?: (item: NodeT<T>) => boolean;
  preloadPages?: number;
}

export interface UsePaginatedCollectionReturn<T>
  extends UseGunCollectionReturn<T> {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  pageSize: number;

  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;

  currentPageItems: NodeT<T>[];
  currentPageCount: number;

  isLoadingPage: boolean;
  preloadedPages: Set<number>;
}

export const encryptData = async (
  data: any,
  keys: undefined | string | KeyPair,
  sea: any,
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
  sea: any,
) => {
  try {
    return keys && sea ? await sea.decrypt(data, keys) : data;
  } catch (error) {
    console.warn('Failed to decrypt data:', error);
    return data;
  }
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
};

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
  if (typeof window !== 'undefined' && condition) {
    console.warn(`[GunDB Hooks Warning] ${message}`);
  }
};

export const debouncedUpdates = (
  dispatcher: any,
  type = 'object',
  timeout = 100,
) => {
  let updates: any[] = [];
  let handler: any;

  const updateFunction = (update: UpdateType) => {
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
          type === 'object' ? {} : new Map(),
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

  updateFunction.cleanup = () => {
    if (handler) {
      clearTimeout(handler);
      updates = [];
      handler = null;
    }
  };

  return updateFunction;
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
  { data, type }: ActionType<T>,
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
  { data, type }: ActionType<T>,
): CollectionState<T> => {
  switch (type) {
    case 'add':
      const newCollectionForAdd = new Map(state.collection);
      if (Array.isArray(data)) {
        data.forEach((item: NodeT<T>) => {
          newCollectionForAdd.set(item.nodeID, item);
        });
      } else {
        newCollectionForAdd.set(data.nodeID, data);
      }
      return {
        ...state,
        collection: newCollectionForAdd,
      };
    case 'update':
      if (!Array.isArray(data)) {
        const newCollectionForUpdate = new Map(state.collection);
        newCollectionForUpdate.set(data.nodeID, data);
        return {
          ...state,
          collection: newCollectionForUpdate,
        };
      }
      return state;
    case 'remove':
      const newCollectionForRemove = new Map(state.collection);
      newCollectionForRemove.delete(data.nodeID);
      return {
        ...state,
        collection: newCollectionForRemove,
      };
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
};

export const useSafeReducer = <T>(
  reducer: any,
  initialState: T,
): [T, Function] => {
  const [state, dispatch] = useReducer<React.Reducer<T, ActionType<T>>>(
    reducer,
    initialState,
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
    gun && soul ? gun.user(soul) : gun ? gun.user() : null,
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
  triggerAuth: boolean = true,
) => {
  // Will attempt to perform a login (when triggerAuth is set to true),
  // or, if false, returns a namespaced gun node
  const namespacedGraph = useGunNamespace(gun);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<GunError | null>(null);

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
      } else if (typeof (gun as any).off === 'function') {
        try {
          (gun as any).off();
        } catch (e) {}
      }
    };
  }, [gun]);

  useEffect(() => {
    if (!keys || !triggerAuth) {
      setIsLoggedIn(false);
      setError(null);
    }
  }, [keys, triggerAuth]);

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
        namespacedGraph.auth(keys, (ack: any) => {
          if (ack.err) {
            setError({
              err: ack.err,
              context: 'useGunKeyAuth.auth',
            });
          }
        });
      } catch (err) {
        setError({
          err: err instanceof Error ? err.message : 'Authentication failed',
          context: 'useGunKeyAuth',
        });
      }
    }
  }, [triggerAuth, namespacedGraph, keys]);

  return [namespacedGraph, isLoggedIn, error] as const;
};

export const useGunKeys = (
  sea: any,
  existingKeys?: KeyPair | undefined | null,
) => {
  const [newKeys, setNewKeys] = useState<KeyPair | undefined | null>(
    existingKeys,
  );

  useEffect(() => {
    const getKeySet = async () => {
      const pair: KeyPair = await sea.pair();
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

export const useGunOnNodeUpdated = <T>(
  ref: GunRef,
  opts: Options = {
    appKeys: '',
    sea: null,
    useOpen: false,
  },
  cb: (data: T, nodeID: string) => void,
  cleanup?: () => void,
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
      event: any,
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
  },
): UseGunStateReturn<T> => {
  const { appKeys, sea, interval = 100, useOpen } = opts;

  // Memoize the options to prevent unnecessary re-renders
  const memoizedOpts = useMemo(
    () => ({
      appKeys,
      sea,
      interval,
      useOpen,
    }),
    [appKeys, sea, interval, useOpen],
  );

  const [fields, dispatch] = useSafeReducer<T>(nodeReducer, {} as T);
  const [error, setError] = useState<GunError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const debouncedHandlers = useRef<Function[]>([]);
  const isMounted = useIsMounted();

  useEffect(() => {
    warnInDevelopment(!ref, 'useGunState: ref is undefined');
    warnInDevelopment(
      !!(appKeys && !sea),
      'useGunState: appKeys provided but no SEA instance',
    );
  }, [ref, appKeys, sea]);

  const updater = useCallback(
    debouncedUpdates(
      (data: any) => {
        if (isMounted.current) {
          dispatch({ type: 'add', data });
          setIsLoading(false);
          setIsConnected(true);
          setError(null);
        }
      },
      'object',
      interval,
    ),
    [interval, isMounted],
  );

  useEffect(() => {
    const connectionTimeout = setTimeout(() => {
      if (isLoading) {
        setError({
          err: 'Connection timeout - no data received',
          context: 'useGunState connection',
        });
        setIsLoading(false);
      }
    }, 5000);

    return () => clearTimeout(connectionTimeout);
  }, [isLoading]);

  const nodeUpdateCallback = useCallback(
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
          context: 'useGunState data processing',
        });
      }
    },
    [updater],
  );

  const cleanupCallback = useCallback(() => {
    if (debouncedHandlers.current.length) {
      debouncedHandlers.current.forEach((c) => c());
      debouncedHandlers.current = [];
    }
  }, []);

  useGunOnNodeUpdated(ref, memoizedOpts, nodeUpdateCallback, cleanupCallback);

  const put = useCallback(
    async (data: Partial<T>): Promise<void> => {
      if (!ref) {
        throw new Error('useGunState: ref is undefined');
      }

      try {
        validateData(data, 'useGunState.put');
        setError(null);

        let encryptedData = await encryptData(data, appKeys, sea);

        await new Promise<void>((resolve, reject) =>
          ref.put(encryptedData, (ack: any) => {
            if (ack.err) {
              const error: GunError = {
                err: ack.err,
                context: 'useGunState.put',
              };
              setError(error);
              reject(error);
            } else {
              resolve();
            }
          }),
        );
      } catch (err) {
        const error: GunError = {
          err: err instanceof Error ? err.message : 'Unknown error',
          context: 'useGunState.put',
        };
        setError(error);
        throw error;
      }
    },
    [ref, appKeys, sea],
  );

  const remove = useCallback(
    async (field: string): Promise<void> => {
      if (!ref) {
        throw new Error('useGunState: ref is undefined');
      }

      try {
        validateNodeID(field);
        setError(null);

        await new Promise<void>((resolve, reject) =>
          ref.put(null, (ack: any) => {
            if (ack.err) {
              const error: GunError = {
                err: ack.err,
                context: 'useGunState.remove',
              };
              setError(error);
              reject(error);
            } else {
              if (isMounted.current) {
                dispatch({ type: 'remove', data: { nodeID: field } });
              }
              resolve();
            }
          }),
        );
      } catch (err) {
        const error: GunError = {
          err: err instanceof Error ? err.message : 'Unknown error',
          context: 'useGunState.remove',
        };
        setError(error);
        throw error;
      }
    },
    [ref, isMounted],
  );

  return {
    fields,
    put,
    remove,
    error,
    isLoading,
    isConnected,
  };
};

export const useGunCollectionState = <T extends Record<string, any>>(
  ref: GunRef,
  opts: Options = {
    appKeys: '',
    sea: null,
    interval: 100,
    useOpen: false,
  },
): UseGunCollectionReturn<T> => {
  const { appKeys, sea, interval = 100, useOpen } = opts;

  const memoizedOpts = useMemo(
    () => ({
      appKeys,
      sea,
      interval,
      useOpen,
    }),
    [appKeys, sea, interval, useOpen],
  );

  const [{ collection }, dispatch] = useSafeReducer<CollectionState<NodeT<T>>>(
    collectionReducer,
    {
      collection: new Map(),
    },
  );

  const [error, setError] = useState<GunError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const debouncedHandlers = useRef<Function[]>([]);
  const isMounted = useIsMounted();

  const hasValidRef = Boolean(ref);

  useEffect(() => {
    warnInDevelopment(!ref, 'useGunCollectionState: ref is undefined');
    warnInDevelopment(
      !!(appKeys && !sea),
      'useGunCollectionState: appKeys provided but no SEA instance',
    );
  }, [ref, appKeys, sea]);

  useEffect(() => {
    if (!hasValidRef) {
      setIsLoading(false);
    }
  }, [hasValidRef]);

  const updater = useCallback(
    debouncedUpdates(
      (dataMap: Map<string, NodeT<T>>) => {
        if (isMounted.current) {
          const items = Array.from(dataMap.values());
          dispatch({ type: 'add', data: items });
          setIsLoading(false);
          setError(null);
        }
      },
      'map',
      interval,
    ),
    [interval, isMounted],
  );

  useEffect(() => {
    const connectionTimeout = setTimeout(() => {
      if (isLoading) {
        setError({
          err: 'Connection timeout - no data received',
          context: 'useGunCollectionState connection',
        });
        setIsLoading(false);
      }
    }, 5000);

    return () => clearTimeout(connectionTimeout);
  }, [isLoading]);

  const nodeUpdateCallback = useCallback(
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
            context: 'useGunCollectionState data processing',
          });
        }
      }
    },
    [updater],
  );

  const cleanupCallback = useCallback(() => {
    if (debouncedHandlers.current.length) {
      debouncedHandlers.current.forEach((c) => c());
      debouncedHandlers.current = [];
    }
  }, []);

  useGunOnNodeUpdated(
    ref ? ref.map() : null,
    memoizedOpts,
    nodeUpdateCallback,
    cleanupCallback,
  );

  const updateInSet = useCallback(
    async (nodeID: string, data: Partial<T>): Promise<void> => {
      if (!ref) {
        throw new Error('useGunCollectionState: ref is undefined');
      }

      try {
        validateNodeID(nodeID);
        validateData(data, 'useGunCollectionState.updateInSet');
        setError(null);

        let encryptedData = await encryptData(data, appKeys, sea);
        await new Promise<void>((resolve, reject) =>
          ref.get(nodeID).put(encryptedData, (ack: any) => {
            if (ack.err) {
              const error: GunError = {
                err: ack.err,
                context: 'useGunCollectionState.updateInSet',
              };
              setError(error);
              reject(error);
            } else {
              if (isMounted.current) {
                dispatch({
                  type: 'update',
                  data: { nodeID, ...data } as NodeT<T>,
                });
              }
              resolve();
            }
          }),
        );
      } catch (err) {
        const error: GunError = {
          err: err instanceof Error ? err.message : 'Unknown error',
          context: 'useGunCollectionState.updateInSet',
        };
        setError(error);
        throw error;
      }
    },
    [ref, appKeys, sea, isMounted],
  );

  const addToSet = useCallback(
    async (data: T, nodeID?: string): Promise<void> => {
      if (!ref) {
        throw new Error('useGunCollectionState: ref is undefined');
      }

      try {
        validateData(data, 'useGunCollectionState.addToSet');
        setError(null);

        let encryptedData = await encryptData(data, appKeys, sea);

        const promise = nodeID
          ? new Promise<void>((resolve, reject) =>
              ref
                .get(nodeID)
                .put(encryptedData, (ack: any) =>
                  ack.err ? reject(new Error(ack.err)) : resolve(),
                ),
            )
          : new Promise<void>((resolve, reject) =>
              ref.set(encryptedData, (ack: any) =>
                ack.err ? reject(new Error(ack.err)) : resolve(),
              ),
            );

        await promise;
      } catch (err) {
        const error: GunError = {
          err: err instanceof Error ? err.message : 'Unknown error',
          context: 'useGunCollectionState.addToSet',
        };
        setError(error);
        throw error;
      }
    },
    [ref, appKeys, sea],
  );

  const removeFromSet = useCallback(
    async (nodeID: string): Promise<void> => {
      if (!ref) {
        throw new Error('useGunCollectionState: ref is undefined');
      }

      try {
        validateNodeID(nodeID);
        setError(null);

        await new Promise<void>((resolve, reject) =>
          ref.get(nodeID).put(null, (ack: any) => {
            if (ack.err) {
              const error: GunError = {
                err: ack.err,
                context: 'useGunCollectionState.removeFromSet',
              };
              setError(error);
              reject(error);
            } else {
              if (isMounted.current) {
                dispatch({ type: 'remove', data: { nodeID } });
              }
              resolve();
            }
          }),
        );
      } catch (err) {
        const error: GunError = {
          err: err instanceof Error ? err.message : 'Unknown error',
          context: 'useGunCollectionState.removeFromSet',
        };
        setError(error);
        throw error;
      }
    },
    [ref, isMounted],
  );

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
    count,
  };
};

export const useGunCollectionStatePaginated = <T extends Record<string, any>>(
  ref: GunRef,
  paginationOpts: PaginationOptions<T> = {},
): UsePaginatedCollectionReturn<T> => {
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
    useOpen = false,
  } = paginationOpts;

  // Extract Options for the base collection hook - memoize to prevent infinite re-renders
  const opts: Options = useMemo(
    () => ({
      appKeys,
      sea,
      interval,
      useOpen,
    }),
    [appKeys, sea, interval, useOpen],
  );

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentPageItems, setCurrentPageItems] = useState<NodeT<T>[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  const pageCache = useRef<Map<number, NodeT<T>[]>>(new Map());
  const cacheTimestamps = useRef<Map<number, number>>(new Map());
  const CACHE_TTL = 5 * 60 * 1000;

  const baseCollection = useGunCollectionState<T>(ref, opts);

  const getCachedPage = useCallback((page: number): NodeT<T>[] | null => {
    const cached = pageCache.current.get(page);
    const timestamp = cacheTimestamps.current.get(page);

    if (cached && timestamp && Date.now() - timestamp < CACHE_TTL) {
      return cached;
    }
    return null;
  }, []);

  const setCachedPage = useCallback((page: number, items: NodeT<T>[]) => {
    pageCache.current.set(page, items);
    cacheTimestamps.current.set(page, Date.now());
  }, []);

  const processedItems = useMemo(() => {
    const allItems = Array.from(baseCollection.collection.values());

    let filteredItems = filter ? allItems.filter(filter) : allItems;

    if (sortBy) {
      filteredItems = [...filteredItems].sort((a, b) => {
        if (typeof sortBy === 'function') {
          return sortOrder === 'asc' ? sortBy(a, b) : sortBy(b, a);
        }
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return filteredItems;
  }, [baseCollection.collection, filter, sortBy, sortOrder]);

  useEffect(() => {
    setTotalItems(processedItems.length);
    pageCache.current.clear();
    cacheTimestamps.current.clear();
  }, [processedItems]);

  const loadPage = useCallback(
    async (page: number) => {
      if (page < 0) return;

      setIsLoadingPage(true);

      try {
        const cached = getCachedPage(page);
        if (cached) {
          setCurrentPageItems(cached);
          setIsLoadingPage(false);
          return;
        }

        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;
        const pageItems = processedItems.slice(startIndex, endIndex);

        setCachedPage(page, pageItems);
        setCurrentPageItems(pageItems);

        for (let i = 1; i <= preloadPages; i++) {
          const nextPage = page + i;
          const prevPage = page - i;

          setTimeout(() => {
            if (
              nextPage * pageSize < processedItems.length &&
              !getCachedPage(nextPage)
            ) {
              const nextStartIndex = nextPage * pageSize;
              const nextEndIndex = nextStartIndex + pageSize;
              const nextPageItems = processedItems.slice(
                nextStartIndex,
                nextEndIndex,
              );
              setCachedPage(nextPage, nextPageItems);
            }
          }, 50 * i);

          setTimeout(() => {
            if (prevPage >= 0 && !getCachedPage(prevPage)) {
              const prevStartIndex = prevPage * pageSize;
              const prevEndIndex = prevStartIndex + pageSize;
              const prevPageItems = processedItems.slice(
                prevStartIndex,
                prevEndIndex,
              );
              setCachedPage(prevPage, prevPageItems);
            }
          }, 50 * i);
        }
      } catch (error) {
        console.error('Failed to load page:', error);
      } finally {
        setIsLoadingPage(false);
      }
    },
    [pageSize, processedItems, preloadPages, getCachedPage, setCachedPage],
  );

  const totalPages = useMemo(
    () => Math.ceil(totalItems / pageSize),
    [totalItems, pageSize],
  );
  const hasNextPage = useMemo(
    () => currentPage < totalPages - 1,
    [currentPage, totalPages],
  );
  const hasPrevPage = useMemo(() => currentPage > 0, [currentPage]);

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

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 0 && page < totalPages) {
        setCurrentPage(page);
        loadPage(page);
      }
    },
    [totalPages, loadPage],
  );

  const setNewPageSize = useCallback(
    (size: number) => {
      if (size <= 0) return;

      const currentItemIndex = currentPage * pageSize;
      const newPage = Math.floor(currentItemIndex / size);

      setCurrentPage(newPage);
      pageCache.current.clear();
      cacheTimestamps.current.clear();
      loadPage(newPage).catch(console.error);
    },
    [currentPage, pageSize, loadPage],
  );

  useEffect(() => {
    if (totalPages > 0) {
      if (currentPage >= totalPages) {
        const newPage = Math.max(0, totalPages - 1);
        setCurrentPage(newPage);
        loadPage(newPage).catch(console.error);
      } else {
        loadPage(currentPage).catch(console.error);
      }
    } else if (processedItems.length > 0) {
      loadPage(currentPage).catch(console.error);
    }
  }, [currentPage, totalPages, loadPage, processedItems.length]);

  useEffect(() => {
    if (processedItems.length > 0) {
      loadPage(currentPage).catch(console.error);
    }
  }, [processedItems.length]);

  const updatePageCache = useMemo(
    () =>
      debounce((updatedItem: NodeT<T>) => {
        pageCache.current.forEach((page, pageNum) => {
          const itemIndex = page.findIndex(
            (item) => item.nodeID === updatedItem.nodeID,
          );
          if (itemIndex !== -1) {
            page[itemIndex] = updatedItem;
            if (pageNum === currentPage) {
              setCurrentPageItems([...page]);
            }
          }
        });
      }, 100),
    [currentPage],
  );

  useEffect(() => {
    if (baseCollection.collection) {
      Array.from(baseCollection.collection.values()).forEach((item) => {
        updatePageCache(item);
      });
    }
  }, [baseCollection.collection, updatePageCache]);

  const preloadedPages = useMemo(
    () => new Set(Array.from(pageCache.current.keys())),
    [],
  );

  return {
    ...baseCollection,
    items: currentPageItems,
    count: totalItems,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    pageSize,
    nextPage,
    prevPage,
    goToPage,
    setPageSize: setNewPageSize,
    currentPageItems,
    currentPageCount: currentPageItems.length,
    isLoadingPage,
    preloadedPages,
  };
};

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
  const newKeys = useGunKeys(sea);
  const [user, isLoggedIn] = useGunKeyAuth(
    gun,
    existingKeys || undefined,
    isReadyToAuth === 'ready',
  );

  useEffect(() => {
    if (isLoggedIn && existingKeys && keyStatus === 'new') {
      const storeKeysEffect = async () => {
        try {
          await storage.setItem(keyFieldName, JSON.stringify(existingKeys));
        } catch (error) {
          console.error('Failed to store keys:', error);
        }
      };

      storeKeysEffect();
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
    (keys?: undefined | string | KeyPair) => {
      setStatuses({
        isReadyToAuth: 'ready',
        existingKeys: (keys as KeyPair) || newKeys || null,
        keyStatus: 'new',
      });
    },
    [setStatuses, newKeys],
  );

  const logout = useCallback(
    (onLoggedOut?: () => void) => {
      const removeKeys = async () => {
        try {
          // Call user.leave() first to properly logout from Gun
          if (user && user.leave) {
            user.leave();
          }

          // Remove keys from storage
          await storage.removeItem(keyFieldName);

          // Reset the authentication state
          setStatuses({
            isReadyToAuth: '',
            existingKeys: null,
            keyStatus: '',
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
    },
    [keyFieldName, storage, user],
  );

  const newGunInstance = useCallback(
    (opts: GunOptions = gunOpts) => {
      return Gun(opts);
    },
    [Gun, gunOpts],
  );

  const value = useMemo<AuthContextType>(
    () => ({
      gun,
      user,
      login,
      logout,
      sea,
      appKeys: existingKeys || newKeys,
      isLoggedIn,
      newGunInstance,
    }),
    [
      gun,
      user,
      login,
      logout,
      sea,
      newKeys,
      existingKeys,
      isLoggedIn,
      newGunInstance,
    ],
  );

  return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const GunContext = createContext<IGunChainReference | null>(null);

const safeStringifyOptions = (options: GunOptions): string => {
  try {
    return JSON.stringify(options, (key, value) => {
      // Skip circular references and functions
      if (
        typeof value === 'function' ||
        (typeof value === 'object' &&
          value !== null &&
          value.constructor?.name?.includes('Gun'))
      ) {
        return '[Circular/Function]';
      }
      return value;
    });
  } catch (err) {
    return String(Math.random());
  }
};

export const GunProvider: React.FC<{
  gun: GunStatic;
  options: GunOptions;
  children: React.ReactNode;
}> = ({ gun, options, children }) => {
  const memoizedOptions = useMemo(
    () => safeStringifyOptions(options),
    [options],
  );
  const gunInstance = useMemo(() => {
    try {
      return gun(memoizedOptions);
    } catch (err) {
      console.error('Failed to initialize Gun instance:', err);
      return null;
    }
  }, [gun, memoizedOptions]);

  return React.createElement(
    GunContext.Provider,
    { value: gunInstance },
    children,
  );
};

export const useGunContext = (): IGunChainReference => {
  const context = useContext(GunContext);
  if (!context) {
    throw new Error('useGunContext must be used within a GunProvider');
  }
  return context;
};

export const useGunDebug = (
  ref: IGunChainReference | null,
  label: string,
  enabled: boolean = true,
): void => {
  useEffect(() => {
    if (!enabled || !ref) return;

    console.log(`[GunDB Debug - ${label}] Listening to:`, ref);

    const off = ref.on((data, key) => {
      console.log(`[${label}] Update:`, {
        key,
        data,
        timestamp: new Date().toISOString(),
      });
    });

    return () => {
      if (typeof off === 'function') {
        try {
          off();
        } catch (e) {}
      } else if (typeof (ref as any).off === 'function') {
        try {
          (ref as any).off();
        } catch (e) {}
      }
    };
  }, [ref, label, enabled]);
};

export const useGunConnection = (
  ref: IGunChainReference,
): {
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
          context: 'useGunConnection',
        });
      }, 10000);
    };

    const off = ref.on(() => {
      setIsConnected(true);
      setLastSeen(new Date());
      setError(null);
      resetTimeout();
    });

    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      if (typeof off === 'function') {
        try {
          off();
        } catch (e) {}
      } else if (typeof (ref as any).off === 'function') {
        try {
          (ref as any).off();
        } catch (e) {}
      }
    };
  }, [ref]);

  return { isConnected, lastSeen, error };
};
