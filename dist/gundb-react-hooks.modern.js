import { useRef, useEffect, useReducer, useState } from 'react';

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

const encryptData = async (data, keys, sea) => {
  return keys && sea ? sea.encrypt(data, keys) : Promise.resolve(data);
};
const decryptData = async (data, keys, sea) => {
  return keys && sea ? sea.decrypt(data, keys) : Promise.resolve(data);
};
const debouncedUpdates = (dispatcher, timeout = 100) => {
  let updates = [];
  let handler;
  return update => {
    updates.push(update);

    if (!handler) {
      handler = setTimeout(() => {
        let newStateSlice = updates.reduce((previousState, {
          id,
          data
        }) => {
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
const reducer = (state, {
  data,
  type
}) => {
  switch (type) {
    case 'add':
      return _extends({}, state, data);

    case 'update':
      return _extends({}, state, {
        [data.nodeID]: data
      });

    case 'remove':
      delete state[data];
      return _extends({}, state);

    default:
      throw new Error();
  }
};
const useIsMounted = () => {
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => isMounted.current = false;
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
const useGun = (Gun, opts) => {
  const [gun, setGun] = useState(Gun(opts));
  useEffect(() => {
    if (opts) {
      setGun(_extends({}, opts));
    }
  }, [Gun, opts]);
  return gun;
};
const useGunNamespace = (gun, soul) => {
  const [namespace, setNamespace] = useState(null);
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
const useGunKeys = (sea, existingKeys) => {
  const [newKeys, setNewKeys] = useState(existingKeys);
  useEffect(() => {
    async function getKeySet() {
      const pair = await sea.pair();
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
    useOpen = false
  } = opts;
  const [gunAppGraph] = useState(ref);
  const [fields, dispatch] = useSafeReducer(reducer, {});
  const handler = useRef(null);
  const isMounted = useIsMounted();
  useEffect(() => {
    const debouncedHandlers = [];

    if (isMounted.current) {
      const updater = debouncedUpdates(data => {
        dispatch({
          type: 'add',
          data
        });
      }, interval);

      const gunCb = async (encryptedField, nodeID, message, event) => {
        let decryptedField = await decryptData(encryptedField, appKeys, sea);
        Object.keys(decryptedField).forEach(key => {
          let cleanFn = updater({
            id: key,
            data: decryptedField[key]
          });
          debouncedHandlers.push(cleanFn);
        });

        if (!handler.current) {
          handler.current = event;
        }
      };

      if (useOpen) {
        if (!gunAppGraph.open) {
          throw new Error('Please include gun/lib/open.');
        } else {
          gunAppGraph.open(gunCb);
        }
      } else {
        gunAppGraph.on(gunCb);
      }
    }

    return () => {
      if (handler.current) {
        //cleanup gun .on listener
        handler.current.off();
      }

      if (debouncedHandlers.length) {
        //cleanup timeouts
        debouncedHandlers.forEach(c => c());
      }
    }; // We just need to set the listener once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Working with root node fields

  const put = async data => {
    let encryptedData = await encryptData(data, appKeys, sea);
    await new Promise((resolve, reject) => gunAppGraph.put(encryptedData, ack => ack.err ? reject(ack.err) : resolve(data)));
  };

  const remove = async field => {
    await new Promise((resolve, reject) => gunAppGraph.put(null, ack => ack.err ? reject(ack.err) : resolve(field)));
    dispatch({
      type: 'remove',
      data: field
    });
  };

  return {
    fields,
    put,
    remove
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
  const [gunAppGraph] = useState(ref);
  const [collection, dispatch] = useSafeReducer(reducer, {});
  const handler = useRef(null);
  const isMounted = useIsMounted(); // Working with Sets

  useEffect(() => {
    const debouncedHandlers = [];

    if (isMounted.current) {
      const updater = debouncedUpdates(data => {
        dispatch({
          type: 'add',
          data
        });
      }, interval);

      const gunCb = async (encryptedNode, nodeID, message, event) => {
        let item = await decryptData(encryptedNode, appKeys, sea);

        if (item) {
          let cleanFn = updater({
            id: nodeID,
            data: _extends({}, item, {
              nodeID
            })
          });
          debouncedHandlers.push(cleanFn);
        }

        if (!handler.current) {
          handler.current = event;
        }
      };

      if (useOpen) {
        if (!gunAppGraph.open) {
          throw new Error('Please include gun/lib/open.');
        } else {
          gunAppGraph.map().open(gunCb);
        }
      } else {
        gunAppGraph.map().on(gunCb);
      }
    }

    return () => {
      if (handler.current) {
        //cleanup gun .on listener
        handler.current.off();
      }

      if (debouncedHandlers.length) {
        //cleanup timeouts
        debouncedHandlers.forEach(c => c());
      }
    }; // We just need to set the listener once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateInSet = async (nodeID, data) => {
    let encryptedData = await encryptData(data, appKeys, sea);
    await new Promise((resolve, reject) => gunAppGraph.get(nodeID).put(encryptedData, ack => ack.err ? reject(ack.err) : resolve(data)));
    dispatch({
      type: 'update',
      data: _extends({
        nodeID
      }, data)
    });
  };

  const addToSet = async (data, nodeID) => {
    let encryptedData = await encryptData(data, appKeys, sea);

    if (!nodeID) {
      await new Promise((resolve, reject) => gunAppGraph.set(encryptedData, ack => ack.err ? reject(ack.err) : resolve(data)));
    } else {
      await new Promise((resolve, reject) => gunAppGraph.get(nodeID).put(encryptedData, ack => ack.err ? reject(ack.err) : resolve(data)));
    }
  };

  const removeFromSet = async nodeID => {
    await new Promise((resolve, reject) => gunAppGraph.get(nodeID).put(null, ack => ack.err ? reject(ack.err) : resolve(nodeID)));
  };

  return {
    collection,
    addToSet,
    updateInSet,
    removeFromSet
  };
};

export { debouncedUpdates, decryptData, encryptData, reducer, useGun, useGunCollectionState, useGunKeyAuth, useGunKeys, useGunNamespace, useGunState, useIsMounted, useSafeReducer };
//# sourceMappingURL=gundb-react-hooks.modern.js.map
