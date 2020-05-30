import { useState, useEffect, useReducer, useRef } from 'react';

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
  appKeys: string | KeyPair;
  sea: any;
  interval?: number;
};

export type ActionType = {
  type: string;
  data: any;
};

export type UpdateType = {
  id: string;
  data: any;
};

export const encryptData = async (
  data: any,
  keys: string | KeyPair,
  sea: any
) => {
  return keys && sea ? sea.encrypt(data, keys) : Promise.resolve(data);
};

export const decryptData = async (
  data: any,
  keys: string | KeyPair,
  sea: any
) => {
  return keys && sea ? sea.decrypt(data, keys) : Promise.resolve(data);
};

export const debouncedUpdates = (dispatcher, timeout = 100) => {
  let updates: any[] = [];
  let handler;
  return (update: UpdateType) => {
    updates.push(update);
    if (!handler) {
      handler = setTimeout(() => {
        let newStateSlice = updates.reduce((previousState, { id, data }) => {
          previousState[id] = data;
          return previousState;
        }, {});
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

export const reducer = (state: {}, { data, type }: ActionType) => {
  switch (type) {
    case 'add':
      return { ...state, ...data };
    case 'update':
      return { ...state, [data.nodeID]: data };
    case 'remove':
      delete state[data];
      return { ...state };
    default:
      throw new Error();
  }
};

export const useIsMounted = () => {
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => (isMounted.current = false);
  }, []);
  return isMounted;
};

export const useSafeReducer = <T>(reducer, initialState): [T, Function] => {
  const [state, dispatch] = useReducer<T>(reducer, initialState);
  const isMounted = useIsMounted();

  function safeDispatch(args) {
    if (isMounted.current) {
      dispatch(args);
    }
  }

  return [state, safeDispatch];
};

export const useGun = (Gun: GunStatic, peerList: string[]) => {
  const [gun] = useState(
    Gun({
      peers: peerList,
    })
  );

  return [gun];
};

export const useGunNamespace = (gun: GunRef) => {
  const [namespace, setNamespace] = useState(null);
  if (!namespace) {
    setNamespace(gun.user());
  }
  return [namespace];
};

export const useGunKeyAuth = (
  gun: GunRef,
  keys: KeyPair,
  triggerAuth: boolean = true
) => {
  // Will attempt to perform a login (when triggerAuth is set to true),
  // or, if false, returns a namespaced gun node
  const [namespacedGraph] = useGunNamespace(gun);
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

export const useGunKeys = (sea: any, initialValue: any) => {
  const [keys, setKeys] = useState(initialValue);

  async function getKeySet() {
    const pair: KeyPair = await sea.pair();
    setKeys(pair);
  }

  if (!keys) {
    getKeySet();
  }

  return [keys, setKeys];
};

export const useGunState = <T>(
  ref: GunRef,
  opts: Options = {
    appKeys: '',
    sea: null,
    interval: 100,
  }
) => {
  const { appKeys, sea, interval = 100 } = opts;
  const [gunAppGraph] = useState(ref);
  const [fields, dispatch] = useSafeReducer<T>(reducer, {});
  const handler = useRef(null);
  const isMounted = useIsMounted();

  useEffect(() => {
    const debouncedHandlers: Function[] = [];
    if (isMounted.current) {
      const updater = debouncedUpdates((data) => {
        dispatch({ type: 'add', data });
      }, interval);

      gunAppGraph.on(async (encryptedField, nodeID, message, event) => {
        let decryptedField = await decryptData(encryptedField, appKeys, sea);
        Object.keys(decryptedField).forEach((key) => {
          let cleanFn = updater({ id: key, data: decryptedField[key] });
          debouncedHandlers.push(cleanFn);
        });

        if (!handler.current) {
          handler.current = event;
        }
      });
    }

    return () => {
      if (handler.current) {
        //cleanup gun .on listener
        handler.current.off();
      }
      if (debouncedHandlers.length) {
        //cleanup timeouts
        debouncedHandlers.forEach((c) => c());
      }
    };
    // We just need to set the listener once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Working with root node fields
  const put = async (data: T) => {
    let encryptedData = await encryptData(data, appKeys, sea);
    await new Promise((resolve, reject) =>
      gunAppGraph.put(encryptedData, (ack) =>
        ack.ok ? resolve() : reject(ack.err)
      )
    );
  };

  const remove = async (field: string) => {
    await new Promise((resolve, reject) =>
      gunAppGraph.put(null, (ack) => (ack.ok ? resolve() : reject(ack.err)))
    );
    dispatch({ type: 'remove', data: field });
  };

  return { fields, put, remove };
};

export const useGunCollectionState = <T>(
  ref: GunRef,
  opts: Options = {
    appKeys: '',
    sea: null,
    interval: 100,
  }
) => {
  const { appKeys, sea, interval = 100 } = opts;
  const [gunAppGraph] = useState(ref);
  const [collection, dispatch] = useSafeReducer<Record<string, T>>(reducer, {});
  const handler = useRef(null);
  const isMounted = useIsMounted();

  // Working with Sets
  useEffect(() => {
    const debouncedHandlers: Function[] = [];
    if (isMounted.current) {
      const updater = debouncedUpdates((data) => {
        dispatch({ type: 'add', data });
      }, interval);

      gunAppGraph.map().on(async (encryptedNode, nodeID, message, event) => {
        let item = await decryptData(encryptedNode, appKeys, sea);
        if (item) {
          let cleanFn = updater({
            id: nodeID,
            data: { ...item, nodeID },
          });
          debouncedHandlers.push(cleanFn);
        }

        if (!handler.current) {
          handler.current = event;
        }
      });
    }

    return () => {
      if (handler.current) {
        //cleanup gun .on listener
        handler.current.off();
      }
      if (debouncedHandlers.length) {
        //cleanup timeouts
        debouncedHandlers.forEach((c) => c());
      }
    };
    // We just need to set the listener once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateInSet = async (nodeID: string, data: T) => {
    let encryptedData = await encryptData(data, appKeys, sea);
    await new Promise((resolve, reject) =>
      gunAppGraph
        .get(nodeID)
        .put(encryptedData, (ack) => (ack.ok ? resolve() : reject(ack.err)))
    );
    dispatch({ type: 'update', data: { nodeID, ...data } });
  };

  const addToSet = async (data: T, nodeID?: string) => {
    let encryptedData = await encryptData(data, appKeys, sea);
    if (!nodeID) {
      await new Promise((resolve, reject) =>
        gunAppGraph.set(encryptedData, (ack) =>
          ack.ok ? resolve() : reject(ack.err)
        )
      );
    } else {
      await new Promise((resolve, reject) =>
        gunAppGraph
          .get(nodeID)
          .put(encryptedData, (ack) => (ack.ok ? resolve() : reject(ack.err)))
      );
    }
  };

  const removeFromSet = async (nodeID: string) => {
    await new Promise((resolve, reject) =>
      gunAppGraph
        .get(nodeID)
        .put(null, (ack) => (ack.ok ? resolve() : reject(ack.err)))
    );
  };

  return { collection, addToSet, updateInSet, removeFromSet };
};
