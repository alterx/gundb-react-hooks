(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
  (global = global || self, factory(global["@altrx/gundb-react-hooks"] = {}, global.react));
})(this, (function (exports, React) {
  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

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
  var debounce = function debounce(func, wait) {
    var timeout = null;
    return function () {
      var _arguments = arguments;
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(function () {
        return func.apply(void 0, [].slice.call(_arguments));
      }, wait);
    };
  };
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
    var updateFunction = function updateFunction(update) {
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
    // Add cleanup method to the function
    updateFunction.cleanup = function () {
      if (handler) {
        clearTimeout(handler);
        updates = [];
        handler = null;
      }
    };
    return updateFunction;
  };
  var useIsMounted = function useIsMounted() {
    var isMounted = React.useRef(false);
    React.useEffect(function () {
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
    var data = _ref3.data,
      type = _ref3.type;
    switch (type) {
      case 'add':
        var newCollectionForAdd = new Map(state.collection);
        if (Array.isArray(data)) {
          data.forEach(function (item) {
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
          var newCollectionForUpdate = new Map(state.collection);
          newCollectionForUpdate.set(data.nodeID, data);
          return _extends({}, state, {
            collection: newCollectionForUpdate
          });
        }
        return state;
      case 'remove':
        var newCollectionForRemove = new Map(state.collection);
        newCollectionForRemove["delete"](data.nodeID);
        return _extends({}, state, {
          collection: newCollectionForRemove
        });
      default:
        throw new Error("Unknown action type: " + type);
    }
  };
  var useSafeReducer = function useSafeReducer(reducer, initialState) {
    var _useReducer = React.useReducer(reducer, initialState),
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
    var _useState = React.useState(Gun(_extends({}, opts))),
      gun = _useState[0],
      setGun = _useState[1];
    React.useEffect(function () {
      if (opts) {
        setGun(Gun(_extends({}, opts)));
      }
    }, [Gun, opts]);
    return gun;
  };
  var useGunNamespace = function useGunNamespace(gun, soul) {
    var _useState2 = React.useState(gun && soul ? gun.user(soul) : gun ? gun.user() : null),
      namespace = _useState2[0],
      setNamespace = _useState2[1];
    React.useEffect(function () {
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
    var _useState3 = React.useState(false),
      isLoggedIn = _useState3[0],
      setIsLoggedIn = _useState3[1];
    var _useState4 = React.useState(null),
      error = _useState4[0],
      setError = _useState4[1];
    React.useEffect(function () {
      if (!gun) return;
      // @ts-ignore - Gun types are not properly defined
      var off = gun.on('auth', function () {
        setIsLoggedIn(true);
        setError(null);
      });
      // Ensure we always return a function for cleanup
      return function () {
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
    React.useEffect(function () {
      if (!keys || !triggerAuth) {
        setIsLoggedIn(false);
        setError(null);
      }
    }, [keys, triggerAuth]);
    // Check if user is still authenticated
    React.useEffect(function () {
      if (namespacedGraph && namespacedGraph.is) {
        setIsLoggedIn(true);
      } else if (namespacedGraph && !namespacedGraph.is && isLoggedIn) {
        setIsLoggedIn(false);
      }
    }, [namespacedGraph, isLoggedIn]);
    React.useEffect(function () {
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
    var _useState5 = React.useState(existingKeys),
      newKeys = _useState5[0],
      setNewKeys = _useState5[1];
    React.useEffect(function () {
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
        getKeySet()["catch"](console.error);
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
    var handler = React.useRef(null);
    var isMounted = useIsMounted();
    React.useEffect(function () {
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
      interval = _opts2$interval === void 0 ? 100 : _opts2$interval,
      useOpen = _opts2.useOpen;
    // Memoize the options to prevent unnecessary re-renders
    var memoizedOpts = React.useMemo(function () {
      return {
        appKeys: appKeys,
        sea: sea,
        interval: interval,
        useOpen: useOpen
      };
    }, [appKeys, sea, interval, useOpen]);
    var _useSafeReducer = useSafeReducer(nodeReducer, {}),
      fields = _useSafeReducer[0],
      dispatch = _useSafeReducer[1];
    var _useState6 = React.useState(null),
      error = _useState6[0],
      setError = _useState6[1];
    var _useState7 = React.useState(true),
      isLoading = _useState7[0],
      setIsLoading = _useState7[1];
    var _useState8 = React.useState(false),
      isConnected = _useState8[0],
      setIsConnected = _useState8[1];
    var debouncedHandlers = React.useRef([]);
    var isMounted = useIsMounted();
    // Development warnings
    React.useEffect(function () {
      warnInDevelopment(!ref, 'useGunState: ref is undefined');
      warnInDevelopment(!!(appKeys && !sea), 'useGunState: appKeys provided but no SEA instance');
    }, [ref, appKeys, sea]);
    // Memoized updater - stabilize with useCallback
    var updater = React.useCallback(debouncedUpdates(function (data) {
      if (isMounted.current) {
        dispatch({
          type: 'add',
          data: data
        });
        setIsLoading(false);
        setIsConnected(true);
        setError(null);
      }
    }, 'object', interval), [interval, isMounted]);
    // Connection timeout
    React.useEffect(function () {
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
    // Memoized callback to prevent infinite re-renders
    var nodeUpdateCallback = React.useCallback(function (item) {
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
    }, [updater]);
    // Memoized cleanup callback
    var cleanupCallback = React.useCallback(function () {
      if (debouncedHandlers.current.length) {
        //cleanup timeouts
        debouncedHandlers.current.forEach(function (c) {
          return c();
        });
        debouncedHandlers.current = [];
      }
    }, []);
    useGunOnNodeUpdated(ref, memoizedOpts, nodeUpdateCallback, cleanupCallback);
    // Enhanced put with validation and error handling
    var put = React.useCallback(function (data) {
      try {
        if (!ref) {
          throw new Error('useGunState: ref is undefined');
        }
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
    var remove = React.useCallback(function (field) {
      try {
        if (!ref) {
          throw new Error('useGunState: ref is undefined');
        }
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
      interval = _opts3$interval === void 0 ? 100 : _opts3$interval,
      useOpen = _opts3.useOpen;
    // Memoize the options to prevent unnecessary re-renders
    var memoizedOpts = React.useMemo(function () {
      return {
        appKeys: appKeys,
        sea: sea,
        interval: interval,
        useOpen: useOpen
      };
    }, [appKeys, sea, interval, useOpen]);
    var _useSafeReducer2 = useSafeReducer(collectionReducer, {
        collection: new Map()
      }),
      collection = _useSafeReducer2[0].collection,
      dispatch = _useSafeReducer2[1];
    var _useState9 = React.useState(null),
      error = _useState9[0],
      setError = _useState9[1];
    var _useState10 = React.useState(true),
      isLoading = _useState10[0],
      setIsLoading = _useState10[1];
    var debouncedHandlers = React.useRef([]);
    var isMounted = useIsMounted();
    // Early return if ref is null/undefined
    var hasValidRef = Boolean(ref);
    // Development warnings
    React.useEffect(function () {
      warnInDevelopment(!ref, 'useGunCollectionState: ref is undefined');
      warnInDevelopment(!!(appKeys && !sea), 'useGunCollectionState: appKeys provided but no SEA instance');
    }, [ref, appKeys, sea]);
    // Set loading to false if no valid ref
    React.useEffect(function () {
      if (!hasValidRef) {
        setIsLoading(false);
      }
    }, [hasValidRef]);
    // Memoized updater - stabilize with useCallback
    var updater = React.useCallback(debouncedUpdates(function (dataMap) {
      if (isMounted.current) {
        // Convert Map to array of items for batch dispatch
        var _items = Array.from(dataMap.values());
        dispatch({
          type: 'add',
          data: _items
        });
        setIsLoading(false);
        setError(null);
      }
    }, 'map', interval), [interval, isMounted]);
    // Connection timeout
    React.useEffect(function () {
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
    // Memoized callback to prevent infinite re-renders
    var nodeUpdateCallback = React.useCallback(function (item, nodeID) {
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
    }, [updater]);
    // Memoized cleanup callback
    var cleanupCallback = React.useCallback(function () {
      if (debouncedHandlers.current.length) {
        //cleanup timeouts
        debouncedHandlers.current.forEach(function (c) {
          return c();
        });
        debouncedHandlers.current = [];
      }
    }, []);
    useGunOnNodeUpdated(ref ? ref.map() : null, memoizedOpts, nodeUpdateCallback, cleanupCallback);
    // Working with Sets - Enhanced CRUD operations
    var updateInSet = React.useCallback(function (nodeID, data) {
      try {
        if (!ref) {
          throw new Error('useGunCollectionState: ref is undefined');
        }
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
    var addToSet = React.useCallback(function (data, nodeID) {
      try {
        if (!ref) {
          throw new Error('useGunCollectionState: ref is undefined');
        }
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
    var removeFromSet = React.useCallback(function (nodeID) {
      try {
        if (!ref) {
          throw new Error('useGunCollectionState: ref is undefined');
        }
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
    var items = React.useMemo(function () {
      return Array.from(collection.values());
    }, [collection]);
    var count = React.useMemo(function () {
      return collection.size;
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
  // Paginated Collection Hook with Optimizations
  var useGunCollectionStatePaginated = function useGunCollectionStatePaginated(ref, paginationOpts) {
    if (paginationOpts === void 0) {
      paginationOpts = {};
    }
    var _paginationOpts = paginationOpts,
      _paginationOpts$pageS = _paginationOpts.pageSize,
      pageSize = _paginationOpts$pageS === void 0 ? 20 : _paginationOpts$pageS,
      sortBy = _paginationOpts.sortBy,
      _paginationOpts$sortO = _paginationOpts.sortOrder,
      sortOrder = _paginationOpts$sortO === void 0 ? 'asc' : _paginationOpts$sortO,
      filter = _paginationOpts.filter,
      _paginationOpts$prelo = _paginationOpts.preloadPages,
      preloadPages = _paginationOpts$prelo === void 0 ? 1 : _paginationOpts$prelo,
      _paginationOpts$curre = _paginationOpts.currentPage,
      initialPage = _paginationOpts$curre === void 0 ? 0 : _paginationOpts$curre,
      _paginationOpts$appKe = _paginationOpts.appKeys,
      appKeys = _paginationOpts$appKe === void 0 ? '' : _paginationOpts$appKe,
      _paginationOpts$sea = _paginationOpts.sea,
      sea = _paginationOpts$sea === void 0 ? null : _paginationOpts$sea,
      _paginationOpts$inter = _paginationOpts.interval,
      interval = _paginationOpts$inter === void 0 ? 100 : _paginationOpts$inter,
      _paginationOpts$useOp = _paginationOpts.useOpen,
      useOpen = _paginationOpts$useOp === void 0 ? false : _paginationOpts$useOp;
    // Extract Options for the base collection hook - memoize to prevent infinite re-renders
    var opts = React.useMemo(function () {
      return {
        appKeys: appKeys,
        sea: sea,
        interval: interval,
        useOpen: useOpen
      };
    }, [appKeys, sea, interval, useOpen]);
    var _useState11 = React.useState(initialPage),
      currentPage = _useState11[0],
      setCurrentPage = _useState11[1];
    var _useState12 = React.useState([]),
      currentPageItems = _useState12[0],
      setCurrentPageItems = _useState12[1];
    var _useState13 = React.useState(false),
      isLoadingPage = _useState13[0],
      setIsLoadingPage = _useState13[1];
    var _useState14 = React.useState(0),
      totalItems = _useState14[0],
      setTotalItems = _useState14[1];
    // Sync currentPage state with initialPage prop when it changes
    React.useEffect(function () {
      setCurrentPage(initialPage);
    }, [initialPage]);
    // Cache for pages
    var pageCache = React.useRef(new Map());
    var cacheTimestamps = React.useRef(new Map());
    var CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    // Use original hook for basic collection management
    var baseCollection = useGunCollectionState(ref, opts);
    // Cache utilities - memoize to prevent re-creation
    var getCachedPage = React.useCallback(function (page) {
      var cached = pageCache.current.get(page);
      var timestamp = cacheTimestamps.current.get(page);
      if (cached && timestamp && Date.now() - timestamp < CACHE_TTL) {
        return cached;
      }
      return null;
    }, []);
    var setCachedPage = React.useCallback(function (page, items) {
      pageCache.current.set(page, items);
      cacheTimestamps.current.set(page, Date.now());
    }, []);
    // Process and sort all items - memoize with stable dependencies
    var processedItems = React.useMemo(function () {
      var allItems = Array.from(baseCollection.collection.values());
      // Apply filtering
      var filteredItems = filter ? allItems.filter(filter) : allItems;
      // Apply sorting
      if (sortBy) {
        filteredItems = [].concat(filteredItems).sort(function (a, b) {
          if (typeof sortBy === 'function') {
            return sortOrder === 'asc' ? sortBy(a, b) : sortBy(b, a);
          }
          var aVal = a[sortBy];
          var bVal = b[sortBy];
          var comparison = 0;
          if (aVal < bVal) comparison = -1;else if (aVal > bVal) comparison = 1;
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      }
      return filteredItems;
    }, [baseCollection.collection, filter, sortBy, sortOrder]);
    // Update total items when processed items change
    React.useEffect(function () {
      setTotalItems(processedItems.length);
      // Clear cache when data changes significantly
      pageCache.current.clear();
      cacheTimestamps.current.clear();
    }, [processedItems]);
    // Load specific page - memoize to prevent unnecessary recreations
    var loadPage = React.useCallback(function (page) {
      try {
        if (page < 0) return Promise.resolve();
        setIsLoadingPage(true);
        try {
          // Check cache first
          var cached = getCachedPage(page);
          if (cached) {
            setCurrentPageItems(cached);
            setIsLoadingPage(false);
            return Promise.resolve();
          }
          // Extract page from processed items
          var startIndex = page * pageSize;
          var endIndex = startIndex + pageSize;
          var pageItems = processedItems.slice(startIndex, endIndex);
          // Cache the page
          setCachedPage(page, pageItems);
          setCurrentPageItems(pageItems);
          // Preload adjacent pages
          var _loop = function _loop() {
            var nextPage = page + i;
            var prevPage = page - i;
            setTimeout(function () {
              if (nextPage * pageSize < processedItems.length && !getCachedPage(nextPage)) {
                var nextStartIndex = nextPage * pageSize;
                var nextEndIndex = nextStartIndex + pageSize;
                var nextPageItems = processedItems.slice(nextStartIndex, nextEndIndex);
                setCachedPage(nextPage, nextPageItems);
              }
            }, 50 * i);
            setTimeout(function () {
              if (prevPage >= 0 && !getCachedPage(prevPage)) {
                var prevStartIndex = prevPage * pageSize;
                var prevEndIndex = prevStartIndex + pageSize;
                var prevPageItems = processedItems.slice(prevStartIndex, prevEndIndex);
                setCachedPage(prevPage, prevPageItems);
              }
            }, 50 * i);
          };
          for (var i = 1; i <= preloadPages; i++) {
            _loop();
          }
        } catch (error) {
          console.error('Failed to load page:', error);
        } finally {
          setIsLoadingPage(false);
        }
        return Promise.resolve();
      } catch (e) {
        return Promise.reject(e);
      }
    }, [pageSize, processedItems, preloadPages, getCachedPage, setCachedPage]);
    // Pagination calculations - memoize to prevent recalculations
    var totalPages = React.useMemo(function () {
      return Math.ceil(totalItems / pageSize);
    }, [totalItems, pageSize]);
    var hasNextPage = React.useMemo(function () {
      return currentPage < totalPages - 1;
    }, [currentPage, totalPages]);
    var hasPrevPage = React.useMemo(function () {
      return currentPage > 0;
    }, [currentPage]);
    // Pagination controls - memoize to prevent re-creation
    var nextPage = React.useCallback(function () {
      if (hasNextPage) {
        var newPage = currentPage + 1;
        setCurrentPage(newPage);
        loadPage(newPage);
      }
    }, [currentPage, hasNextPage, loadPage]);
    var prevPage = React.useCallback(function () {
      if (hasPrevPage) {
        var newPage = currentPage - 1;
        setCurrentPage(newPage);
        loadPage(newPage);
      }
    }, [currentPage, hasPrevPage, loadPage]);
    var goToPage = React.useCallback(function (page) {
      if (page >= 0 && page < totalPages) {
        setCurrentPage(page);
        loadPage(page);
      }
    }, [totalPages, loadPage]);
    var setNewPageSize = React.useCallback(function (size) {
      if (size <= 0) return;
      // Calculate which item we're currently viewing
      var currentItemIndex = currentPage * pageSize;
      // Calculate new page number to maintain position
      var newPage = Math.floor(currentItemIndex / size);
      setCurrentPage(newPage);
      pageCache.current.clear(); // Clear cache since page size changed
      cacheTimestamps.current.clear();
      loadPage(newPage)["catch"](console.error);
    }, [currentPage, pageSize, loadPage]);
    // Load current page when page changes or data updates
    React.useEffect(function () {
      if (totalPages > 0) {
        // Ensure current page is valid
        if (currentPage >= totalPages) {
          var newPage = Math.max(0, totalPages - 1);
          setCurrentPage(newPage);
          loadPage(newPage)["catch"](console.error);
        } else {
          loadPage(currentPage)["catch"](console.error);
        }
      } else if (processedItems.length > 0) {
        // Even if totalPages calculation isn't ready, try to load the current page
        loadPage(currentPage)["catch"](console.error);
      }
    }, [currentPage, totalPages, loadPage, processedItems.length]);
    // Initial load effect - ensure pagination happens on mount
    React.useEffect(function () {
      if (processedItems.length > 0) {
        loadPage(currentPage)["catch"](console.error);
      }
    }, [processedItems.length]); // Only depend on length to avoid infinite re-renders
    // Real-time updates - update cache when base collection changes
    // Memoize and debounce this to prevent excessive updates
    var updatePageCache = React.useMemo(function () {
      return debounce(function (updatedItem) {
        // Only update pages that might contain this item
        pageCache.current.forEach(function (page, pageNum) {
          var itemIndex = page.findIndex(function (item) {
            return item.nodeID === updatedItem.nodeID;
          });
          if (itemIndex !== -1) {
            page[itemIndex] = updatedItem;
            // Trigger re-render only for current page
            if (pageNum === currentPage) {
              setCurrentPageItems([].concat(page));
            }
          }
        });
      }, 100);
    }, [currentPage]);
    // Watch for changes in base collection to update cache
    React.useEffect(function () {
      if (baseCollection.collection) {
        Array.from(baseCollection.collection.values()).forEach(function (item) {
          updatePageCache(item);
        });
      }
    }, [baseCollection.collection, updatePageCache]);
    // Memoize preloaded pages to prevent object recreation
    var preloadedPages = React.useMemo(function () {
      return new Set(Array.from(pageCache.current.keys()));
    }, []);
    return _extends({}, baseCollection, {
      // Override items to return paginated items instead of all items
      items: currentPageItems,
      // Override count to return total filtered items count
      count: totalItems,
      // Pagination state
      currentPage: currentPage,
      totalPages: totalPages,
      hasNextPage: hasNextPage,
      hasPrevPage: hasPrevPage,
      pageSize: pageSize,
      // Pagination actions
      nextPage: nextPage,
      prevPage: prevPage,
      goToPage: goToPage,
      setPageSize: setNewPageSize,
      // Current page data
      currentPageItems: currentPageItems,
      currentPageCount: currentPageItems.length,
      // Optimizations
      isLoadingPage: isLoadingPage,
      preloadedPages: preloadedPages
    });
  };
  // Auth Context and Provider
  var AuthContext = React.createContext(null);
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
    var _useState15 = React.useState({
        isReadyToAuth: '',
        existingKeys: null,
        keyStatus: ''
      }),
      _useState15$ = _useState15[0],
      isReadyToAuth = _useState15$.isReadyToAuth,
      existingKeys = _useState15$.existingKeys,
      keyStatus = _useState15$.keyStatus,
      setStatuses = _useState15[1];
    var gun = useGun(Gun, gunOpts);
    // new keypair
    var newKeys = useGunKeys(sea);
    var _useGunKeyAuth = useGunKeyAuth(gun, existingKeys || undefined, isReadyToAuth === 'ready'),
      user = _useGunKeyAuth[0],
      isLoggedIn = _useGunKeyAuth[1];
    React.useEffect(function () {
      if (isLoggedIn && existingKeys && keyStatus === 'new') {
        var storeKeysEffect = function storeKeysEffect() {
          try {
            var _temp3 = _catch(function () {
              return Promise.resolve(storage.setItem(keyFieldName, JSON.stringify(existingKeys))).then(function () {});
            }, function (error) {
              console.error('Failed to store keys:', error);
            });
            return Promise.resolve(_temp3 && _temp3.then ? _temp3.then(function () {}) : void 0);
          } catch (e) {
            return Promise.reject(e);
          }
        };
        storeKeysEffect();
      }
    }, [isLoggedIn, existingKeys, keyFieldName, storage, keyStatus]);
    React.useEffect(function () {
      if (!existingKeys) {
        var getKeys = function getKeys() {
          try {
            var _temp4 = _catch(function () {
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
            return Promise.resolve(_temp4 && _temp4.then ? _temp4.then(function () {}) : void 0);
          } catch (e) {
            return Promise.reject(e);
          }
        };
        getKeys();
      }
    }, [storage, keyFieldName, existingKeys]);
    var login = React.useCallback(function (keys) {
      // use keys sent by the user or a new set
      setStatuses({
        isReadyToAuth: 'ready',
        existingKeys: keys || newKeys || null,
        keyStatus: 'new'
      });
    }, [setStatuses, newKeys]);
    var logout = React.useCallback(function (onLoggedOut) {
      var removeKeys = function removeKeys() {
        try {
          var _temp5 = _catch(function () {
            // Call user.leave() first to properly logout from Gun
            if (user && user.leave) {
              user.leave();
            }
            // Remove keys from storage
            return Promise.resolve(storage.removeItem(keyFieldName)).then(function () {
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
            });
          }, function (error) {
            console.warn('Failed to remove keys from storage:', error);
            // Still call the callback even if storage removal fails
            if (onLoggedOut) {
              onLoggedOut();
            }
          });
          return Promise.resolve(_temp5 && _temp5.then ? _temp5.then(function () {}) : void 0);
        } catch (e) {
          return Promise.reject(e);
        }
      };
      removeKeys();
    }, [keyFieldName, storage, user]);
    var newGunInstance = React.useCallback(function (opts) {
      if (opts === void 0) {
        opts = gunOpts;
      }
      return Gun(opts);
    }, [Gun, gunOpts]);
    var value = React.useMemo(function () {
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
    return React__default["default"].createElement(AuthContext.Provider, {
      value: value
    }, children);
  };
  var useAuth = function useAuth() {
    var context = React.useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  };
  // Context provider for Gun instance
  var GunContext = React.createContext(null);
  var safeStringifyOptions = function safeStringifyOptions(options) {
    try {
      return JSON.stringify(options, function (key, value) {
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
  var GunProvider = function GunProvider(_ref5) {
    var gun = _ref5.gun,
      options = _ref5.options,
      children = _ref5.children;
    var memoizedOptions = React.useMemo(function () {
      return safeStringifyOptions(options);
    }, [options]);
    var gunInstance = React.useMemo(function () {
      try {
        return gun(memoizedOptions);
      } catch (err) {
        console.error('Failed to initialize Gun instance:', err);
        return null;
      }
    }, [gun, memoizedOptions]);
    return React__default["default"].createElement(GunContext.Provider, {
      value: gunInstance
    }, children);
  };
  var useGunContext = function useGunContext() {
    var context = React.useContext(GunContext);
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
    React.useEffect(function () {
      if (!enabled || !ref) return;
      console.log("[GunDB Debug - " + label + "] Listening to:", ref);
      // subscribe
      var off = ref.on(function (data, key) {
        console.log("[" + label + "] Update:", {
          key: key,
          data: data,
          timestamp: new Date().toISOString()
        });
      });
      // cleanup
      return function () {
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
  var useGunConnection = function useGunConnection(ref) {
    var _useState16 = React.useState(false),
      isConnected = _useState16[0],
      setIsConnected = _useState16[1];
    var _useState17 = React.useState(null),
      lastSeen = _useState17[0],
      setLastSeen = _useState17[1];
    var _useState18 = React.useState(null),
      error = _useState18[0],
      setError = _useState18[1];
    React.useEffect(function () {
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
      // subscribe
      var off = ref.on(function () {
        setIsConnected(true);
        setLastSeen(new Date());
        setError(null);
        resetTimeout();
      });
      // Initial timeout
      resetTimeout();
      return function () {
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
      isConnected: isConnected,
      lastSeen: lastSeen,
      error: error
    };
  };

  exports.AuthContext = AuthContext;
  exports.AuthProvider = AuthProvider;
  exports.GunContext = GunContext;
  exports.GunProvider = GunProvider;
  exports.collectionReducer = collectionReducer;
  exports.debouncedUpdates = debouncedUpdates;
  exports.decryptData = decryptData;
  exports.encryptData = encryptData;
  exports.nodeReducer = nodeReducer;
  exports.useAuth = useAuth;
  exports.useGun = useGun;
  exports.useGunCollectionState = useGunCollectionState;
  exports.useGunCollectionStatePaginated = useGunCollectionStatePaginated;
  exports.useGunConnection = useGunConnection;
  exports.useGunContext = useGunContext;
  exports.useGunDebug = useGunDebug;
  exports.useGunKeyAuth = useGunKeyAuth;
  exports.useGunKeys = useGunKeys;
  exports.useGunNamespace = useGunNamespace;
  exports.useGunOnNodeUpdated = useGunOnNodeUpdated;
  exports.useGunState = useGunState;
  exports.useIsMounted = useIsMounted;
  exports.useSafeReducer = useSafeReducer;

}));
//# sourceMappingURL=gundb-react-hooks.umd.js.map
