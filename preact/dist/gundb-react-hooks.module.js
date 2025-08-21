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

function _catch(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }
  if (result && result.then) {
    return result.then(void 0, recover);
  }
  return result;
}
var encryptData = function encryptData(data, keys, sea) {
  try {
    return Promise.resolve(_catch(function () {
      return keys && sea ? Promise.resolve(keys && sea ? sea.encrypt(data, keys) : data) : keys && sea ? sea.encrypt(data, keys) : data;
    }, function (error) {
      console.warn('Failed to encrypt data:', error);
      return data;
    }));
  } catch (e) {
    return Promise.reject(e);
  }
};
var decryptData = function decryptData(data, keys, sea) {
  try {
    return Promise.resolve(_catch(function () {
      return keys && sea ? Promise.resolve(keys && sea ? sea.decrypt(data, keys) : data) : keys && sea ? sea.decrypt(data, keys) : data;
    }, function (error) {
      console.warn('Failed to decrypt data:', error);
      return data;
    }));
  } catch (e) {
    return Promise.reject(e);
  }
};
// Utility functions
var validateNodeID = function validateNodeID(nodeID) {
  if (!nodeID || typeof nodeID !== 'string' || nodeID.trim().length === 0) {
    throw new Error('Invalid nodeID: must be a non-empty string');
  }
};
var validateData = function validateData(data, context) {
  if (data === undefined) {
    throw new Error("Data cannot be undefined in " + context);
  }
};
var warnInDevelopment = function warnInDevelopment(condition, message) {
  // @ts-ignore
  if (typeof window !== 'undefined' && condition) {
    console.warn("[GunDB Hooks Warning] " + message);
  }
};
var debouncedUpdates = function debouncedUpdates(dispatcher, type, timeout) {
  if (type === void 0) {
    type = 'object';
  }
  if (timeout === void 0) {
    timeout = 100;
  }
  var updates = [];
  var handler;
  return function (update) {
    updates.push(update);
    if (!handler) {
      handler = setTimeout(function () {
        var newStateSlice = updates.reduce(function (previousState, _ref) {
          var id = _ref.id,
            data = _ref.data;
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
    return function () {
      clearTimeout(handler);
      updates = [];
      handler = null;
    };
  };
};
var useIsMounted = function useIsMounted() {
  var isMounted = useRef(false);
  useEffect(function () {
    isMounted.current = true;
    return function () {
      isMounted.current = false;
    };
  }, []);
  return isMounted;
};
var nodeReducer = function nodeReducer(state, _ref2) {
  var data = _ref2.data,
    type = _ref2.type;
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
var collectionReducer = function collectionReducer(state, _ref3) {
  var _state$collection4;
  var data = _ref3.data,
    type = _ref3.type;
  switch (type) {
    case 'add':
      if (Array.isArray(data)) {
        data.forEach(function (item) {
          var _state$collection;
          (_state$collection = state.collection) == null || _state$collection.set(item.nodeID, item);
        });
      } else {
        var _state$collection2;
        (_state$collection2 = state.collection) == null || _state$collection2.set(data.nodeID, data);
      }
      return _extends({}, state, {
        collection: state.collection
      });
    case 'update':
      if (!Array.isArray(data)) {
        var _state$collection3;
        (_state$collection3 = state.collection) == null || _state$collection3.set(data.nodeID, data);
      }
      return _extends({}, state, {
        collection: state.collection
      });
    case 'remove':
      (_state$collection4 = state.collection) == null || _state$collection4["delete"](data.nodeID);
      return _extends({}, state, {
        collection: state.collection
      });
    default:
      throw new Error("Unknown action type: " + type);
  }
};
var useSafeReducer = function useSafeReducer(reducer, initialState) {
  var _useReducer = useReducer(reducer, initialState),
    state = _useReducer[0],
    dispatch = _useReducer[1];
  var isMounted = useIsMounted();
  function safeDispatch(args) {
    if (isMounted.current) {
      dispatch(args);
    }
  }
  return [state, safeDispatch];
};
var useGun = function useGun(Gun, opts) {
  var _useState = useState(Gun(_extends({}, opts))),
    gun = _useState[0],
    setGun = _useState[1];
  useEffect(function () {
    if (opts) {
      setGun(Gun(_extends({}, opts)));
    }
  }, [Gun, opts]);
  return gun;
};
var useGunNamespace = function useGunNamespace(gun, soul) {
  var _useState2 = useState(soul ? gun.user(soul) : gun.user()),
    namespace = _useState2[0],
    setNamespace = _useState2[1];
  useEffect(function () {
    if (gun && !namespace) {
      setNamespace(soul ? gun.user(soul) : gun.user());
    }
  }, [namespace, gun, soul]);
  return namespace;
};
var useGunKeyAuth = function useGunKeyAuth(gun, keys, triggerAuth) {
  if (triggerAuth === void 0) {
    triggerAuth = true;
  }
  // Will attempt to perform a login (when triggerAuth is set to true),
  // or, if false, returns a namespaced gun node
  var namespacedGraph = useGunNamespace(gun);
  var _useState3 = useState(false),
    isLoggedIn = _useState3[0],
    setIsLoggedIn = _useState3[1];
  var _useState4 = useState(null),
    error = _useState4[0],
    setError = _useState4[1];
  useEffect(function () {
    if (!gun) return;
    // @ts-ignore - Gun types are not properly defined
    var cleanup = gun.on('auth', function () {
      setIsLoggedIn(true);
      setError(null);
    });
    return cleanup;
  }, [gun]);
  useEffect(function () {
    if (namespacedGraph && !namespacedGraph.is && keys && triggerAuth) {
      try {
        namespacedGraph.auth(keys, function (ack) {
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
var useGunKeys = function useGunKeys(sea, existingKeys) {
  var _useState5 = useState(existingKeys),
    newKeys = _useState5[0],
    setNewKeys = _useState5[1];
  useEffect(function () {
    var getKeySet = function getKeySet() {
      try {
        return Promise.resolve(sea.pair()).then(function (pair) {
          setNewKeys(pair);
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };
    if (!newKeys && !existingKeys) {
      getKeySet();
    }
    if (existingKeys) {
      setNewKeys(existingKeys);
    }
  }, [existingKeys, newKeys, sea]);
  return newKeys;
};
var useGunOnNodeUpdated = function useGunOnNodeUpdated(ref, opts, cb, cleanup) {
  if (opts === void 0) {
    opts = {
      appKeys: '',
      sea: null,
      useOpen: false
    };
  }
  var _opts = opts,
    appKeys = _opts.appKeys,
    sea = _opts.sea,
    useOpen = _opts.useOpen;
  var handler = useRef(null);
  var isMounted = useIsMounted();
  useEffect(function () {
    if (!ref || !isMounted.current) return;
    var gunCb = function gunCb(encryptedField, nodeID, message, event) {
      try {
        var _temp2 = function _temp2() {
          if (!handler.current && event != null && event.off) {
            handler.current = function () {
              return event.off();
            };
          }
        };
        if (!isMounted.current) return Promise.resolve();
        var _temp = _catch(function () {
          return Promise.resolve(decryptData(encryptedField, appKeys, sea)).then(function (decryptedField) {
            cb(decryptedField, nodeID);
          });
        }, function (error) {
          console.warn('Failed to decrypt data in useGunOnNodeUpdated:', error);
        });
        return Promise.resolve(_temp && _temp.then ? _temp.then(_temp2) : _temp2(_temp));
      } catch (e) {
        return Promise.reject(e);
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
    return function () {
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
var useGunState = function useGunState(ref, opts) {
  if (opts === void 0) {
    opts = {
      appKeys: '',
      sea: null,
      interval: 100,
      useOpen: false
    };
  }
  var _opts2 = opts,
    appKeys = _opts2.appKeys,
    sea = _opts2.sea,
    _opts2$interval = _opts2.interval,
    interval = _opts2$interval === void 0 ? 100 : _opts2$interval;
  var _useSafeReducer = useSafeReducer(nodeReducer, {}),
    fields = _useSafeReducer[0],
    dispatch = _useSafeReducer[1];
  var _useState6 = useState(null),
    error = _useState6[0],
    setError = _useState6[1];
  var _useState7 = useState(true),
    isLoading = _useState7[0],
    setIsLoading = _useState7[1];
  var _useState8 = useState(false),
    isConnected = _useState8[0],
    setIsConnected = _useState8[1];
  var debouncedHandlers = useRef([]);
  var isMounted = useIsMounted();
  // Development warnings
  useEffect(function () {
    warnInDevelopment(!ref, 'useGunState: ref is undefined');
    warnInDevelopment(!!(appKeys && !sea), 'useGunState: appKeys provided but no SEA instance');
  }, [ref, appKeys, sea]);
  // Memoized updater
  var updater = useMemo(function () {
    return debouncedUpdates(function (data) {
      if (isMounted.current) {
        dispatch({
          type: 'add',
          data: data
        });
        setIsLoading(false);
        setIsConnected(true);
        setError(null);
      }
    }, 'object', interval);
  }, [interval, isMounted]);
  // Connection timeout
  useEffect(function () {
    var connectionTimeout = setTimeout(function () {
      if (isLoading) {
        setError({
          err: 'Connection timeout - no data received',
          context: 'useGunState connection'
        });
        setIsLoading(false);
      }
    }, 5000); // 5 second timeout
    return function () {
      return clearTimeout(connectionTimeout);
    };
  }, [isLoading]);
  useGunOnNodeUpdated(ref, opts, function (item) {
    try {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(function (key) {
          var cleanFn = updater({
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
  }, function () {
    if (debouncedHandlers.current.length) {
      //cleanup timeouts
      debouncedHandlers.current.forEach(function (c) {
        return c();
      });
      debouncedHandlers.current = [];
    }
  });
  // Enhanced put with validation and error handling
  var put = useCallback(function (data) {
    try {
      return Promise.resolve(_catch(function () {
        validateData(data, 'useGunState.put');
        setError(null);
        return Promise.resolve(encryptData(data, appKeys, sea)).then(function (encryptedData) {
          return Promise.resolve(new Promise(function (resolve, reject) {
            return ref.put(encryptedData, function (ack) {
              if (ack.err) {
                var _error = {
                  err: ack.err,
                  context: 'useGunState.put'
                };
                setError(_error);
                reject(_error);
              } else {
                resolve();
              }
            });
          })).then(function () {});
        });
      }, function (err) {
        var error = {
          err: err instanceof Error ? err.message : 'Unknown error',
          context: 'useGunState.put'
        };
        setError(error);
        throw error;
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  }, [ref, appKeys, sea]);
  // Enhanced remove with validation
  var remove = useCallback(function (field) {
    try {
      return Promise.resolve(_catch(function () {
        validateNodeID(field);
        setError(null);
        return Promise.resolve(new Promise(function (resolve, reject) {
          return ref.put(null, function (ack) {
            if (ack.err) {
              var _error2 = {
                err: ack.err,
                context: 'useGunState.remove'
              };
              setError(_error2);
              reject(_error2);
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
          });
        })).then(function () {});
      }, function (err) {
        var error = {
          err: err instanceof Error ? err.message : 'Unknown error',
          context: 'useGunState.remove'
        };
        setError(error);
        throw error;
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  }, [ref, isMounted]);
  return {
    fields: fields,
    put: put,
    remove: remove,
    error: error,
    isLoading: isLoading,
    isConnected: isConnected
  };
};
var useGunCollectionState = function useGunCollectionState(ref, opts) {
  if (opts === void 0) {
    opts = {
      appKeys: '',
      sea: null,
      interval: 100,
      useOpen: false
    };
  }
  var _opts3 = opts,
    appKeys = _opts3.appKeys,
    sea = _opts3.sea,
    _opts3$interval = _opts3.interval,
    interval = _opts3$interval === void 0 ? 100 : _opts3$interval;
  var _useSafeReducer2 = useSafeReducer(collectionReducer, {
      collection: new Map()
    }),
    collection = _useSafeReducer2[0].collection,
    dispatch = _useSafeReducer2[1];
  var _useState9 = useState(null),
    error = _useState9[0],
    setError = _useState9[1];
  var _useState10 = useState(true),
    isLoading = _useState10[0],
    setIsLoading = _useState10[1];
  var debouncedHandlers = useRef([]);
  var isMounted = useIsMounted();
  // Development warnings
  useEffect(function () {
    warnInDevelopment(!ref, 'useGunCollectionState: ref is undefined');
    warnInDevelopment(!!(appKeys && !sea), 'useGunCollectionState: appKeys provided but no SEA instance');
  }, [ref, appKeys, sea]);
  // Memoized updater
  var updater = useMemo(function () {
    return debouncedUpdates(function (data) {
      if (isMounted.current) {
        dispatch({
          type: 'add',
          data: data
        });
        setIsLoading(false);
        setError(null);
      }
    }, 'map', interval);
  }, [interval, isMounted]);
  // Connection timeout
  useEffect(function () {
    var connectionTimeout = setTimeout(function () {
      if (isLoading) {
        setError({
          err: 'Connection timeout - no data received',
          context: 'useGunCollectionState connection'
        });
        setIsLoading(false);
      }
    }, 5000);
    return function () {
      return clearTimeout(connectionTimeout);
    };
  }, [isLoading]);
  useGunOnNodeUpdated(ref.map(), opts, function (item, nodeID) {
    if (item && typeof item === 'object') {
      try {
        setError(null);
        var cleanFn = updater({
          id: nodeID,
          data: _extends({}, item, {
            nodeID: nodeID
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
  }, function () {
    if (debouncedHandlers.current.length) {
      //cleanup timeouts
      debouncedHandlers.current.forEach(function (c) {
        return c();
      });
      debouncedHandlers.current = [];
    }
  });
  // Working with Sets - Enhanced CRUD operations
  var updateInSet = useCallback(function (nodeID, data) {
    try {
      return Promise.resolve(_catch(function () {
        validateNodeID(nodeID);
        validateData(data, 'useGunCollectionState.updateInSet');
        setError(null);
        return Promise.resolve(encryptData(data, appKeys, sea)).then(function (encryptedData) {
          return Promise.resolve(new Promise(function (resolve, reject) {
            return ref.get(nodeID).put(encryptedData, function (ack) {
              if (ack.err) {
                var _error3 = {
                  err: ack.err,
                  context: 'useGunCollectionState.updateInSet'
                };
                setError(_error3);
                reject(_error3);
              } else {
                if (isMounted.current) {
                  dispatch({
                    type: 'update',
                    data: _extends({
                      nodeID: nodeID
                    }, data)
                  });
                }
                resolve();
              }
            });
          })).then(function () {});
        });
      }, function (err) {
        var error = {
          err: err instanceof Error ? err.message : 'Unknown error',
          context: 'useGunCollectionState.updateInSet'
        };
        setError(error);
        throw error;
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  }, [ref, appKeys, sea, isMounted]);
  var addToSet = useCallback(function (data, nodeID) {
    try {
      return Promise.resolve(_catch(function () {
        validateData(data, 'useGunCollectionState.addToSet');
        setError(null);
        return Promise.resolve(encryptData(data, appKeys, sea)).then(function (encryptedData) {
          var promise = nodeID ? new Promise(function (resolve, reject) {
            return ref.get(nodeID).put(encryptedData, function (ack) {
              return ack.err ? reject(new Error(ack.err)) : resolve();
            });
          }) : new Promise(function (resolve, reject) {
            return ref.set(encryptedData, function (ack) {
              return ack.err ? reject(new Error(ack.err)) : resolve();
            });
          });
          return Promise.resolve(promise).then(function () {});
        });
      }, function (err) {
        var error = {
          err: err instanceof Error ? err.message : 'Unknown error',
          context: 'useGunCollectionState.addToSet'
        };
        setError(error);
        throw error;
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  }, [ref, appKeys, sea]);
  var removeFromSet = useCallback(function (nodeID) {
    try {
      return Promise.resolve(_catch(function () {
        validateNodeID(nodeID);
        setError(null);
        return Promise.resolve(new Promise(function (resolve, reject) {
          return ref.get(nodeID).put(null, function (ack) {
            if (ack.err) {
              var _error4 = {
                err: ack.err,
                context: 'useGunCollectionState.removeFromSet'
              };
              setError(_error4);
              reject(_error4);
            } else {
              if (isMounted.current) {
                dispatch({
                  type: 'remove',
                  data: {
                    nodeID: nodeID
                  }
                });
              }
              resolve();
            }
          });
        })).then(function () {});
      }, function (err) {
        var error = {
          err: err instanceof Error ? err.message : 'Unknown error',
          context: 'useGunCollectionState.removeFromSet'
        };
        setError(error);
        throw error;
      }));
    } catch (e) {
      return Promise.reject(e);
    }
  }, [ref, isMounted]);
  // Convert Map to Array for easier consumption
  var items = useMemo(function () {
    return collection ? Array.from(collection.values()) : [];
  }, [collection]);
  var count = useMemo(function () {
    return (collection == null ? void 0 : collection.size) || 0;
  }, [collection]);
  return {
    collection: collection,
    items: items,
    addToSet: addToSet,
    updateInSet: updateInSet,
    removeFromSet: removeFromSet,
    error: error,
    isLoading: isLoading,
    count: count
  };
};
// Auth Context and Provider
var AuthContext = createContext(null);
var AuthProvider = function AuthProvider(_ref4) {
  var Gun = _ref4.Gun,
    sea = _ref4.sea,
    _ref4$keyFieldName = _ref4.keyFieldName,
    keyFieldName = _ref4$keyFieldName === void 0 ? 'keys' : _ref4$keyFieldName,
    storage = _ref4.storage,
    gunOpts = _ref4.gunOpts,
    children = _ref4.children;
  if (!sea || !Gun || !gunOpts) {
    throw new Error('Provide gunOpts, Gun and sea');
  }
  var _useState11 = useState({
      isReadyToAuth: '',
      existingKeys: null,
      keyStatus: ''
    }),
    _useState11$ = _useState11[0],
    isReadyToAuth = _useState11$.isReadyToAuth,
    existingKeys = _useState11$.existingKeys,
    keyStatus = _useState11$.keyStatus,
    setStatuses = _useState11[1];
  var gun = useGun(Gun, gunOpts);
  // new keypair
  var newKeys = useGunKeys(sea);
  var _useGunKeyAuth = useGunKeyAuth(gun, existingKeys || undefined, isReadyToAuth === 'ready'),
    user = _useGunKeyAuth[0],
    isLoggedIn = _useGunKeyAuth[1];
  useEffect(function () {
    if (isLoggedIn && existingKeys && keyStatus === 'new') {
      var storeKeys = function storeKeys() {
        try {
          return Promise.resolve(storage.setItem(keyFieldName, JSON.stringify(existingKeys))).then(function () {});
        } catch (e) {
          return Promise.reject(e);
        }
      };
      storeKeys();
    }
  }, [isLoggedIn, existingKeys, keyFieldName, storage, keyStatus]);
  useEffect(function () {
    if (!existingKeys) {
      var getKeys = function getKeys() {
        try {
          var _temp3 = _catch(function () {
            return Promise.resolve(storage.getItem(keyFieldName)).then(function (k) {
              var ks = JSON.parse(k || 'null');
              setStatuses({
                isReadyToAuth: 'ready',
                existingKeys: ks,
                keyStatus: ks ? 'existing' : 'new'
              });
            });
          }, function (error) {
            console.warn('Failed to retrieve keys from storage:', error);
            setStatuses({
              isReadyToAuth: 'ready',
              existingKeys: null,
              keyStatus: 'new'
            });
          });
          return Promise.resolve(_temp3 && _temp3.then ? _temp3.then(function () {}) : void 0);
        } catch (e) {
          return Promise.reject(e);
        }
      };
      getKeys();
    }
  }, [storage, keyFieldName, existingKeys]);
  var login = useCallback(function (keys) {
    try {
      // use keys sent by the user or a new set
      setStatuses({
        isReadyToAuth: 'ready',
        existingKeys: keys || newKeys || null,
        keyStatus: 'new'
      });
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }, [setStatuses, newKeys]);
  var logout = useCallback(function (onLoggedOut) {
    var removeKeys = function removeKeys() {
      try {
        var _temp4 = _catch(function () {
          return Promise.resolve(storage.removeItem(keyFieldName)).then(function () {
            setStatuses({
              isReadyToAuth: '',
              existingKeys: null,
              keyStatus: ''
            });
            if (user) {
              user.leave();
            }
            if (onLoggedOut) {
              onLoggedOut();
            }
          });
        }, function (error) {
          console.warn('Failed to remove keys from storage:', error);
        });
        return Promise.resolve(_temp4 && _temp4.then ? _temp4.then(function () {}) : void 0);
      } catch (e) {
        return Promise.reject(e);
      }
    };
    removeKeys();
  }, [keyFieldName, storage, user]);
  var newGunInstance = useCallback(function (opts) {
    if (opts === void 0) {
      opts = gunOpts;
    }
    return Gun(opts);
  }, [Gun, gunOpts]);
  var value = useMemo(function () {
    return {
      gun: gun,
      user: user,
      login: login,
      logout: logout,
      sea: sea,
      appKeys: existingKeys || newKeys,
      isLoggedIn: isLoggedIn,
      newGunInstance: newGunInstance
    };
  }, [gun, user, login, logout, sea, newKeys, existingKeys, isLoggedIn, newGunInstance]);
  return React.createElement(AuthContext.Provider, {
    value: value
  }, children);
};
var useAuth = function useAuth() {
  var context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
// Context provider for Gun instance
var GunContext = createContext(null);
var GunProvider = function GunProvider(_ref5) {
  var gun = _ref5.gun,
    options = _ref5.options,
    children = _ref5.children;
  var gunInstance = useMemo(function () {
    try {
      return gun(options);
    } catch (err) {
      console.error('Failed to initialize Gun instance:', err);
      return null;
    }
  }, [gun, JSON.stringify(options)]);
  return React.createElement(GunContext.Provider, {
    value: gunInstance
  }, children);
};
var useGunContext = function useGunContext() {
  var context = useContext(GunContext);
  if (!context) {
    throw new Error('useGunContext must be used within a GunProvider');
  }
  return context;
};
// Debug utility hook
var useGunDebug = function useGunDebug(ref, label, enabled) {
  if (enabled === void 0) {
    enabled = true;
  }
  useEffect(function () {
    if (!enabled || !ref) return;
    console.log("[GunDB Debug - " + label + "] Listening to:", ref);
    var cleanup = ref.on(function (data, key) {
      console.log("[" + label + "] Update:", {
        key: key,
        data: data,
        timestamp: new Date().toISOString()
      });
    });
    return cleanup;
  }, [ref, label, enabled]);
};
// Connection status hook
var useGunConnection = function useGunConnection(ref) {
  var _useState12 = useState(false),
    isConnected = _useState12[0],
    setIsConnected = _useState12[1];
  var _useState13 = useState(null),
    lastSeen = _useState13[0],
    setLastSeen = _useState13[1];
  var _useState14 = useState(null),
    error = _useState14[0],
    setError = _useState14[1];
  useEffect(function () {
    if (!ref) return;
    var timeoutId;
    var resetTimeout = function resetTimeout() {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(function () {
        setIsConnected(false);
        setError({
          err: 'Connection timeout',
          context: 'useGunConnection'
        });
      }, 10000); // 10 second timeout
    };
    var cleanup = ref.on(function () {
      setIsConnected(true);
      setLastSeen(new Date());
      setError(null);
      resetTimeout();
    });
    // Initial timeout
    resetTimeout();
    return function () {
      clearTimeout(timeoutId);
      if (cleanup) cleanup();
    };
  }, [ref]);
  return {
    isConnected: isConnected,
    lastSeen: lastSeen,
    error: error
  };
};

export { AuthContext, AuthProvider, GunContext, GunProvider, collectionReducer, debouncedUpdates, decryptData, encryptData, nodeReducer, useAuth, useGun, useGunCollectionState, useGunConnection, useGunContext, useGunDebug, useGunKeyAuth, useGunKeys, useGunNamespace, useGunOnNodeUpdated, useGunState, useIsMounted, useSafeReducer };
//# sourceMappingURL=gundb-react-hooks.module.js.map
