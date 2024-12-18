(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('preact/hooks')) :
  typeof define === 'function' && define.amd ? define(['exports', 'preact/hooks'], factory) :
  (global = global || self, factory(global["@altrx/gundb-react-hooks"] = {}, global.hooks));
})(this, (function (exports, hooks) {
  function _extends() {
    return _extends = Object.assign ? Object.assign.bind() : function (n) {
      for (var e = 1; e < arguments.length; e++) {
        var t = arguments[e];
        for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
      }
      return n;
    }, _extends.apply(null, arguments);
  }

  var encryptData = function encryptData(data, keys, sea) {
    try {
      return Promise.resolve(keys && sea ? sea.encrypt(data, keys) : data);
    } catch (e) {
      return Promise.reject(e);
    }
  };
  var decryptData = function decryptData(data, keys, sea) {
    try {
      return Promise.resolve(keys && sea ? sea.decrypt(data, keys) : data);
    } catch (e) {
      return Promise.reject(e);
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
    var isMounted = hooks.useRef(false);
    hooks.useEffect(function () {
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
    var _state$collection2, _state$collection3;
    var data = _ref3.data,
      type = _ref3.type;
    switch (type) {
      case 'add':
        data.forEach(function (data) {
          var _state$collection;
          (_state$collection = state.collection) == null || _state$collection.set(data.nodeID, data);
        });
        return _extends({}, state, {
          collection: state.collection
        });
      case 'update':
        (_state$collection2 = state.collection) == null || _state$collection2.set(data.nodeID, data);
        return _extends({}, state, {
          collection: state.collection
        });
      case 'remove':
        (_state$collection3 = state.collection) == null || _state$collection3["delete"](data.nodeID);
        return _extends({}, state, {
          collection: state.collection
        });
      default:
        throw new Error();
    }
  };
  var useSafeReducer = function useSafeReducer(reducer, initialState) {
    var _useReducer = hooks.useReducer(reducer, initialState),
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
    var _useState = hooks.useState(Gun(_extends({}, opts))),
      gun = _useState[0],
      setGun = _useState[1];
    hooks.useEffect(function () {
      if (opts) {
        setGun(Gun(_extends({}, opts)));
      }
    }, [Gun, opts]);
    return gun;
  };
  var useGunNamespace = function useGunNamespace(gun, soul) {
    var _useState2 = hooks.useState(soul ? gun.user(soul) : gun.user()),
      namespace = _useState2[0],
      setNamespace = _useState2[1];
    hooks.useEffect(function () {
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
    var _useState3 = hooks.useState(false),
      isLoggedIn = _useState3[0],
      setIsLoggedIn = _useState3[1];
    gun.on('auth', function () {
      setIsLoggedIn(true);
    });
    hooks.useEffect(function () {
      if (namespacedGraph && !namespacedGraph.is && keys && triggerAuth) {
        namespacedGraph.auth(keys);
      }
    }, [triggerAuth, namespacedGraph, keys]);
    return [namespacedGraph, isLoggedIn];
  };
  var useGunKeys = function useGunKeys(sea, existingKeys) {
    var _useState4 = hooks.useState(existingKeys),
      newKeys = _useState4[0],
      setNewKeys = _useState4[1];
    hooks.useEffect(function () {
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
    var handler = hooks.useRef(null);
    var isMounted = useIsMounted();
    hooks.useEffect(function () {
      if (isMounted.current) {
        var gunCb = function gunCb(encryptedField, nodeID, message, event) {
          return Promise.resolve(decryptData(encryptedField, appKeys, sea)).then(function (decryptedField) {
            cb(decryptedField, nodeID);
            if (!handler.current) {
              handler.current = event;
            }
          });
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
      return function () {
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
    var debouncedHandlers = [];
    var updater = debouncedUpdates(function (data) {
      dispatch({
        type: 'add',
        data: data
      });
    }, 'object', interval);
    useGunOnNodeUpdated(ref, opts, function (item) {
      Object.keys(item).forEach(function (key) {
        var cleanFn = updater({
          id: key,
          data: item[key]
        });
        debouncedHandlers.push(cleanFn);
      });
    }, function () {
      if (debouncedHandlers.length) {
        //cleanup timeouts
        debouncedHandlers.forEach(function (c) {
          return c();
        });
      }
    });
    // Working with root node fields
    var put = function put(data) {
      return Promise.resolve(encryptData(data, appKeys, sea)).then(function (encryptedData) {
        return Promise.resolve(new Promise(function (resolve, reject) {
          return ref.put(encryptedData, function (ack) {
            return ack.err ? reject(ack.err) : resolve(data);
          });
        })).then(function () {});
      });
    };
    var remove = function remove(field) {
      try {
        return Promise.resolve(new Promise(function (resolve, reject) {
          return ref.put(null, function (ack) {
            return ack.err ? reject(ack.err) : resolve(field);
          });
        })).then(function () {
          dispatch({
            type: 'remove',
            data: {
              nodeID: field
            }
          });
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };
    return {
      fields: fields,
      put: put,
      remove: remove
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
    var debouncedHandlers = [];
    var updater = debouncedUpdates(function (data) {
      dispatch({
        type: 'add',
        data: data
      });
    }, 'map', interval);
    useGunOnNodeUpdated(ref.map(), opts, function (item, nodeID) {
      if (item) {
        var cleanFn = updater({
          id: nodeID,
          data: _extends({}, item, {
            nodeID: nodeID
          })
        });
        debouncedHandlers.push(cleanFn);
      }
    }, function () {
      if (debouncedHandlers.length) {
        //cleanup timeouts
        debouncedHandlers.forEach(function (c) {
          return c();
        });
      }
    });
    // Working with Sets
    var updateInSet = function updateInSet(nodeID, data) {
      return Promise.resolve(encryptData(data, appKeys, sea)).then(function (encryptedData) {
        return Promise.resolve(new Promise(function (resolve, reject) {
          return ref.get(nodeID).put(encryptedData, function (ack) {
            return ack.err ? reject(ack.err) : resolve(data);
          });
        })).then(function () {
          dispatch({
            type: 'update',
            data: _extends({
              nodeID: nodeID
            }, data)
          });
        });
      });
    };
    var addToSet = function addToSet(data, nodeID) {
      return Promise.resolve(encryptData(data, appKeys, sea)).then(function (encryptedData) {
        var _temp = function () {
          if (!nodeID) {
            return Promise.resolve(new Promise(function (resolve, reject) {
              return ref.set(encryptedData, function (ack) {
                return ack.err ? reject(ack.err) : resolve(data);
              });
            })).then(function () {});
          } else {
            return Promise.resolve(new Promise(function (resolve, reject) {
              return ref.get(nodeID).put(encryptedData, function (ack) {
                return ack.err ? reject(ack.err) : resolve(data);
              });
            })).then(function () {});
          }
        }();
        if (_temp && _temp.then) return _temp.then(function () {});
      });
    };
    var removeFromSet = function removeFromSet(nodeID) {
      try {
        return Promise.resolve(new Promise(function (resolve, reject) {
          return ref.get(nodeID).put(null, function (ack) {
            return ack.err ? reject(ack.err) : resolve(nodeID);
          });
        })).then(function () {
          dispatch({
            type: 'remove',
            data: {
              nodeID: nodeID
            }
          });
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };
    return {
      collection: collection,
      addToSet: addToSet,
      updateInSet: updateInSet,
      removeFromSet: removeFromSet
    };
  };

  exports.collectionReducer = collectionReducer;
  exports.debouncedUpdates = debouncedUpdates;
  exports.decryptData = decryptData;
  exports.encryptData = encryptData;
  exports.nodeReducer = nodeReducer;
  exports.useGun = useGun;
  exports.useGunCollectionState = useGunCollectionState;
  exports.useGunKeyAuth = useGunKeyAuth;
  exports.useGunKeys = useGunKeys;
  exports.useGunNamespace = useGunNamespace;
  exports.useGunOnNodeUpdated = useGunOnNodeUpdated;
  exports.useGunState = useGunState;
  exports.useIsMounted = useIsMounted;
  exports.useSafeReducer = useSafeReducer;

}));
//# sourceMappingURL=gundb-react-hooks.umd.js.map
