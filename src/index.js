import { useState, useEffect, useReducer, useRef } from 'react';

export const encryptData = async (data, encrypted, keys, sea) => {
  return encrypted ? sea.encrypt(data, keys) : Promise.resolve(data);
};

export const decryptData = async (data, encrypted, keys, sea) => {
  return encrypted ? sea.decrypt(data, keys) : Promise.resolve(data);
};

const debouncedUpdates = (dispatcher, timeout = 100) => {
  let actions = [];
  let handler;
  return (action) => {
    actions.push(action);
    if (!handler) {
      handler = setTimeout(() => {
        let newStateSlice = actions.reduce((previousState, { id, data }) => {
          previousState[id] = data;
          return previousState;
        }, {});
        dispatcher(newStateSlice);
        actions = [];
        handler = null;
      }, timeout);
    }

    return () => {
      clearTimeout(handler);
      actions = [];
      handler = null;
    };
  };
};

const reducer = (state, { data, type }) => {
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

const useIsMounted = () => {
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => (isMounted.current = false);
  }, []);
  return isMounted;
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

export const useGun = (Gun, peerList) => {
  const [gun] = useState(
    Gun({
      peers: peerList,
    })
  );

  return [gun];
};

export const useGunNamespace = (gun) => {
  const [namespace, setNamespace] = useState(null);
  if (!namespace) {
    setNamespace(gun.user());
  }
  return [namespace];
};

export const useGunKeyAuth = (gun, keys, triggerAuth = true) => {
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

export const useGunKeys = (sea, initialValue) => {
  const [keys, setKeys] = useState(initialValue);

  async function getKeySet() {
    const pair = await sea.pair();
    setKeys(pair);
  }

  if (!keys) {
    getKeySet();
  }

  return [keys, setKeys];
};

export const useGunState = (
  ref,
  { appKeys, sea, interval = 100, encrypted = true }
) => {
  const [gunAppGraph] = useState(ref);
  const [fields, dispatch] = useSafeReducer(reducer, {});
  const handler = useRef(null);
  const isMounted = useIsMounted();

  useEffect(() => {
    const debouncedHandlers = [];
    if (isMounted.current) {
      const updater = debouncedUpdates((data) => {
        dispatch({ type: 'add', data });
      }, interval);

      gunAppGraph.on(async (encryptedField, nodeID, message, event) => {
        let decryptedField = await decryptData(
          encryptedField,
          encrypted,
          appKeys,
          sea
        );
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
  const put = async (data) => {
    let encryptedData = await encryptData(data, encrypted, appKeys, sea);
    await gunAppGraph.put(encryptedData);
  };

  const remove = async (field) => {
    await gunAppGraph.put(null);
    dispatch({ type: 'remove', data: field });
  };

  return [
    fields,
    { put, remove },
    gunAppGraph, // the actual graph is sent in case something advanced needs to be done
  ];
};

export const useGunCollectionState = (
  ref,
  { appKeys, sea, interval = 100, encrypted = true }
) => {
  const [gunAppGraph] = useState(ref);
  const [collection, dispatch] = useSafeReducer(reducer, {});
  const handler = useRef(null);
  const isMounted = useIsMounted();

  // Working with Sets
  useEffect(() => {
    const debouncedHandlers = [];
    if (isMounted.current) {
      const updater = debouncedUpdates((data) => {
        dispatch({ type: 'add', data });
      }, interval);

      gunAppGraph.map().on(async (encryptedNode, nodeID, message, event) => {
        let item = await decryptData(encryptedNode, encrypted, appKeys, sea);
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

  const updateInSet = async (nodeID, data) => {
    let encryptedData = await encryptData(data, encrypted, appKeys, sea);
    await gunAppGraph.get(nodeID).put(encryptedData);
    dispatch({ type: 'update', data: { nodeID, ...data } });
  };

  const addToSet = async (data) => {
    let encryptedData = await encryptData(data, encrypted, appKeys, sea);
    await gunAppGraph.set(encryptedData);
  };

  const removeFromSet = async (nodeID) => {
    await gunAppGraph.get(nodeID).put(null);
    dispatch({ type: 'remove', data: nodeID });
  };

  return [
    collection,
    { addToSet, updateInSet, removeFromSet },
    gunAppGraph, // the actual graph is sent in case something advanced needs to be done
  ];
};
