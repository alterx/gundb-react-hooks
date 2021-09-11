import { useRef, useEffect, useReducer, useState } from 'preact/hooks';

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
const debouncedUpdates = (dispatcher, type = 'object', timeout = 100) => {
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
  var _state$collection2, _state$collection3;

  switch (type) {
    case 'add':
      data.forEach(data => {
        var _state$collection;

        (_state$collection = state.collection) == null ? void 0 : _state$collection.set(data.nodeID, data);
      });
      return _extends({}, state, {
        collection: state.collection
      });

    case 'update':
      (_state$collection2 = state.collection) == null ? void 0 : _state$collection2.set(data.nodeID, data);
      return _extends({}, state, {
        collection: state.collection
      });

    case 'remove':
      (_state$collection3 = state.collection) == null ? void 0 : _state$collection3.delete(data.nodeID);
      return _extends({}, state, {
        collection: state.collection
      });

    default:
      throw new Error();
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
  const [namespace, setNamespace] = useState(soul ? gun.user(soul) : gun.user());
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
  const [gunAppGraph] = useState(ref);
  const handler = useRef(null);
  const isMounted = useIsMounted();
  useEffect(() => {
    if (isMounted.current) {
      const gunCb = async (encryptedField, nodeID, message, event) => {
        let decryptedField = await decryptData(encryptedField, appKeys, sea);
        cb(decryptedField, nodeID);

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

      if (cleanup) {
        cleanup();
      }
    }; // We just need to set the listener once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
    interval = 100
  } = opts;
  const [gunAppGraph] = useState(ref);
  const [fields, dispatch] = useSafeReducer(nodeReducer, {});
  const debouncedHandlers = [];
  const updater = debouncedUpdates(data => {
    dispatch({
      type: 'add',
      data
    });
  }, 'object', interval);
  useGunOnNodeUpdated(gunAppGraph, opts, item => {
    Object.keys(item).forEach(key => {
      let cleanFn = updater({
        id: key,
        data: item[key]
      });
      debouncedHandlers.push(cleanFn);
    });
  }, () => {
    if (debouncedHandlers.length) {
      //cleanup timeouts
      debouncedHandlers.forEach(c => c());
    }
  }); // Working with root node fields

  const put = async data => {
    let encryptedData = await encryptData(data, appKeys, sea);
    await new Promise((resolve, reject) => gunAppGraph.put(encryptedData, ack => ack.err ? reject(ack.err) : resolve(data)));
  };

  const remove = async field => {
    await new Promise((resolve, reject) => gunAppGraph.put(null, ack => ack.err ? reject(ack.err) : resolve(field)));
    dispatch({
      type: 'remove',
      data: {
        nodeID: field
      }
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
    interval = 100
  } = opts;
  const [gunAppGraph] = useState(ref);
  const [{
    collection
  }, dispatch] = useSafeReducer(collectionReducer, {
    collection: new Map()
  });
  const debouncedHandlers = [];
  const updater = debouncedUpdates(data => {
    dispatch({
      type: 'add',
      data
    });
  }, 'map', interval);
  useGunOnNodeUpdated(gunAppGraph.map(), opts, (item, nodeID) => {
    if (item) {
      let cleanFn = updater({
        id: nodeID,
        data: _extends({}, item, {
          nodeID
        })
      });
      debouncedHandlers.push(cleanFn);
    }
  }, () => {
    if (debouncedHandlers.length) {
      //cleanup timeouts
      debouncedHandlers.forEach(c => c());
    }
  }); // Working with Sets

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
    dispatch({
      type: 'remove',
      data: {
        nodeID
      }
    });
  };

  return {
    collection,
    addToSet,
    updateInSet,
    removeFromSet
  };
};

export { collectionReducer, debouncedUpdates, decryptData, encryptData, nodeReducer, useGun, useGunCollectionState, useGunKeyAuth, useGunKeys, useGunNamespace, useGunOnNodeUpdated, useGunState, useIsMounted, useSafeReducer };
//# sourceMappingURL=gundb-react-hooks.modern.js.map
