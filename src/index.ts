import React, { useState, useEffect, useReducer, useRef } from 'react';

export type GunStatic = any;

export type GunRef = any;

export type NamespacedRef = any;

export type KeyPair = {
  pub: string;
  priv: string;
  epub: string;
  epriv: string;
};

export type Options = {
  appKeys?: undefined | string | KeyPair;
  sea?: any;
  interval?: number;
  useOpen?: boolean;
};

export type NodeT<T> = T & { nodeID: string; [key: string]: any };

export type ActionType<T> =
  | { type: 'add'; data: NodeT<T> }
  | { type: 'update'; data: NodeT<T> }
  | { type: 'remove'; data: NodeT<T> };

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

export const encryptData = async (
  data: any,
  keys: undefined | string | KeyPair,
  sea: any
) => {
  return keys && sea ? sea.encrypt(data, keys) : Promise.resolve(data);
};

export const decryptData = async (
  data: any,
  keys: undefined | string | KeyPair,
  sea: any
) => {
  return keys && sea ? sea.decrypt(data, keys) : Promise.resolve(data);
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
      data.forEach((data: NodeT<T>) => {
        state.collection?.set(data.nodeID, data);
      });
      return {
        ...state,
        collection: state.collection,
      };
    case 'update':
      state.collection?.set(data.nodeID, data);
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
      throw new Error();
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

  gun.on('auth', () => {
    setIsLoggedIn(true);
  });

  useEffect(() => {
    if (namespacedGraph && !namespacedGraph.is && keys && triggerAuth) {
      namespacedGraph.auth(keys);
    }
  }, [triggerAuth, namespacedGraph, keys]);

  return [namespacedGraph, isLoggedIn];
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
  const handler = useRef(null);
  const isMounted = useIsMounted();

  useEffect(() => {
    if (isMounted.current) {
      const gunCb = async (
        encryptedField: any,
        nodeID: string,
        message: any,
        event: any
      ) => {
        let decryptedField = await decryptData(encryptedField, appKeys, sea);
        cb(decryptedField, nodeID);

        if (!handler.current) {
          handler.current = event;
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
    }

    return () => {
      if (handler.current) {
        //cleanup gun .on listener
        handler.current.off();
      }
      if (cleanup) {
        cleanup();
      }
    };
  }, [ref]);
};

export const useGunState = <T>(
  ref: GunRef,
  opts: Options = {
    appKeys: '',
    sea: null,
    interval: 100,
    useOpen: false,
  }
) => {
  const { appKeys, sea, interval = 100 } = opts;
  const [fields, dispatch] = useSafeReducer<T>(nodeReducer, {} as T);

  const debouncedHandlers: Function[] = [];
  const updater = debouncedUpdates(
    (data: any) => {
      dispatch({ type: 'add', data });
    },
    'object',
    interval
  );

  useGunOnNodeUpdated(
    ref,
    opts,
    (item: any) => {
      Object.keys(item).forEach((key) => {
        let cleanFn = updater({ id: key, data: item[key] });
        debouncedHandlers.push(cleanFn);
      });
    },
    () => {
      if (debouncedHandlers.length) {
        //cleanup timeouts
        debouncedHandlers.forEach((c) => c());
      }
    }
  );

  // Working with root node fields
  const put = async (data: T) => {
    let encryptedData = await encryptData(data, appKeys, sea);
    await new Promise((resolve, reject) =>
      ref.put(encryptedData, (ack: any) =>
        ack.err ? reject(ack.err) : resolve(data)
      )
    );
  };

  const remove = async (field: string) => {
    await new Promise((resolve, reject) =>
      ref.put(null, (ack: any) => (ack.err ? reject(ack.err) : resolve(field)))
    );
    dispatch({ type: 'remove', data: { nodeID: field } });
  };

  return { fields, put, remove };
};

export const useGunCollectionState = <T>(
  ref: GunRef,
  opts: Options = {
    appKeys: '',
    sea: null,
    interval: 100,
    useOpen: false,
  }
) => {
  const { appKeys, sea, interval = 100 } = opts;
  const [{ collection }, dispatch] = useSafeReducer<CollectionState<T>>(
    collectionReducer,
    {
      collection: new Map(),
    }
  );

  const debouncedHandlers: Function[] = [];
  const updater = debouncedUpdates(
    (data: T) => {
      dispatch({ type: 'add', data });
    },
    'map',
    interval
  );

  useGunOnNodeUpdated(
    ref.map(),
    opts,
    (item: T, nodeID) => {
      if (item) {
        let cleanFn = updater({
          id: nodeID,
          data: { ...item, nodeID },
        });
        debouncedHandlers.push(cleanFn);
      }
    },
    () => {
      if (debouncedHandlers.length) {
        //cleanup timeouts
        debouncedHandlers.forEach((c) => c());
      }
    }
  );

  // Working with Sets

  const updateInSet = async (nodeID: string, data: T) => {
    let encryptedData = await encryptData(data, appKeys, sea);
    await new Promise((resolve, reject) =>
      ref
        .get(nodeID)
        .put(encryptedData, (ack: any) =>
          ack.err ? reject(ack.err) : resolve(data)
        )
    );
    dispatch({ type: 'update', data: { nodeID, ...data } });
  };

  const addToSet = async (data: T, nodeID?: string) => {
    let encryptedData = await encryptData(data, appKeys, sea);
    if (!nodeID) {
      await new Promise((resolve, reject) =>
        ref.set(encryptedData, (ack: any) =>
          ack.err ? reject(ack.err) : resolve(data)
        )
      );
    } else {
      await new Promise((resolve, reject) =>
        ref
          .get(nodeID)
          .put(encryptedData, (ack: any) =>
            ack.err ? reject(ack.err) : resolve(data)
          )
      );
    }
  };

  const removeFromSet = async (nodeID: string) => {
    await new Promise((resolve, reject) =>
      ref
        .get(nodeID)
        .put(null, (ack: any) => (ack.err ? reject(ack.err) : resolve(nodeID)))
    );
    dispatch({ type: 'remove', data: { nodeID } });
  };

  return { collection, addToSet, updateInSet, removeFromSet };
};
