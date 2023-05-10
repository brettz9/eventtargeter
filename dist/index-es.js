function _typeof(obj) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, _typeof(obj);
}

/* eslint-disable n/no-sync -- Want sync naming */
/* eslint-disable no-restricted-syntax -- Instanceof checks */
/* eslint-disable unicorn/no-this-assignment -- TS */

/**
 * @typedef {number} Integer
 */

/**
 * @callback InvokeCurrentListeners
 * @param {AllListeners} listeners
 * @param {EventWithProps} eventCopy
 * @param {string} type
 * @param {boolean} [checkOnListeners]
 * @returns {boolean}
 */

/**
 * @typedef {{
 *   defaultSync?: boolean,
 *   extraProperties?: string[],
 *   legacyOutputDidListenersThrowFlag?: boolean
 * }} CustomOptions
 */
/**
 * @typedef {{
 *   __legacyOutputDidListenersThrowError: unknown,
 *   target: EventTarget & {
 *     invokeCurrentListeners: InvokeCurrentListeners,
 *     _earlyListeners: AllListeners,
 *     _listeners: AllListeners,
 *     _lateListeners: AllListeners,
 *     _defaultListeners: AllListeners
 *   },
 *   composed: boolean,
 *   currentTarget: EventTarget,
 *   eventPhase: 0|1|2|3
 *   defaultPrevented: boolean,
 *   type: string,
 *   bubbles: boolean,
 *   cancelable: boolean,
 *   isTrusted: boolean,
 *   timeStamp: Integer,
 *   initEvent: (type: string, bubbles: boolean, cancelable: boolean) => void,
 *   preventDefault: () => void,
 *   composedPath: () => void,
 *   detail: any,
 *   initCustomEvent: (
 *     type: string, canBubble: boolean, cancelable: boolean,
 *     detail: any
 *   ) => void
 * }} EventWithProps
 */

// Todo: Switch to ES6 classes

var phases = {
  NONE: 0,
  CAPTURING_PHASE: 1,
  AT_TARGET: 2,
  BUBBLING_PHASE: 3
};
var ShimDOMException = typeof DOMException === 'undefined'
// Todo: Better polyfill (if even needed here)
/* eslint-disable no-shadow -- Polyfill */
// eslint-disable-next-line operator-linebreak -- TS/JSDoc needs
?
/**
 * @param {string} msg
 * @param {string} name
 * @returns {Error}
 */
function DOMException(msg, name) {
  // No need for `toString` as same as for `Error`
  /* eslint-enable no-shadow -- Polyfill */
  var err = new Error(msg);
  err.name = name;
  return err;
} : DOMException;
var ev = new WeakMap();
var evCfg = new WeakMap();

// Todo: Set _ev argument outside of this function

/* eslint-disable func-name-matching -- Shim vs. Polyfill */
/* eslint-disable no-shadow -- Polyfilling */
/**
* We use an adapter class rather than a proxy not only for compatibility
* but also since we have to clone native event properties anyways in order
* to properly set `target`, etc.
* The regular DOM method `dispatchEvent` won't work with this polyfill as
* it expects a native event.
* @class
* @param {string} type
*/
var ShimEvent = /** @type {unknown} */function Event(type) {
  var _this = this;
  /* eslint-enable func-name-matching -- Shim vs. Polyfill */
  /* eslint-enable no-shadow -- Polyfilling */
  // For WebIDL checks of function's `length`, we check `arguments` for the optional arguments
  // @ts-expect-error
  this[Symbol.toStringTag] = 'Event';
  this.toString = function () {
    return '[object Event]';
  };
  // eslint-disable-next-line prefer-rest-params -- Don't want to change signature
  var _arguments = Array.prototype.slice.call(arguments),
    evInit = _arguments[1],
    _ev = _arguments[2];
  if (!arguments.length) {
    throw new TypeError("Failed to construct 'Event': 1 argument required, but only 0 present.");
  }
  evInit = evInit || {};
  _ev = _ev || {};

  /** @type {EventWithProps} */
  var _evCfg = {};
  if ('composed' in evInit) {
    _evCfg.composed = evInit.composed;
  }

  // _evCfg.isTrusted = true; // We are not always using this for user-created events
  // _evCfg.timeStamp = new Date().valueOf(); // This is no longer a timestamp, but monotonic (elapsed?)

  ev.set(this, _ev);
  evCfg.set(this, _evCfg);
  var that = /** @type {unknown} */this;
  /** @type {ShimEvent} */
  that.initEvent(type, evInit.bubbles, evInit.cancelable);
  ['target', 'currentTarget', 'eventPhase', 'defaultPrevented'].forEach(function (pr) {
    var prop = /** @type {"target"|"currentTarget"|"eventPhase"|"defaultPrevented"} */
    pr;
    Object.defineProperty(_this, prop, {
      get: function get() {
        return (/* prop in _evCfg && */_evCfg[prop] !== undefined ? _evCfg[prop] : prop in _ev ? _ev[prop] :
          // Defaults
          prop === 'eventPhase' ? 0 : prop === 'defaultPrevented' ? false : null
        );
      }
    });
  });
  var props = [
  // Event
  'type', 'bubbles', 'cancelable',
  // Defaults to false
  'isTrusted', 'timeStamp', 'initEvent',
  // Other event properties (not used by our code)
  'composedPath', 'composed'];
  if (this.toString() === '[object CustomEvent]') {
    props.push('detail', 'initCustomEvent');
  }
  Object.defineProperties(this, props.reduce(function (obj, pr) {
    var prop =
    /**
     * @type {"type"|"bubbles"|"cancelable"|"isTrusted"|
     *   "timeStamp"|"initEvent"|"composedPath"|"composed"|
     *   "detail"|"initCustomEvent"
     * }
     */
    pr;
    obj[prop] = {
      get: function get() {
        return prop in _evCfg ? _evCfg[prop] : prop in _ev ? _ev[prop] : ['bubbles', 'cancelable', 'composed'].includes(prop) ? false : undefined;
      }
    };
    return obj;
  }, /** @type {{[key: string]: any}} */{}));
};

// @ts-expect-error Casting doesn't work
ShimEvent.prototype.preventDefault = function () {
  // @ts-expect-error Needed for exporting
  if (!(this instanceof ShimEvent)) {
    throw new TypeError('Illegal invocation');
  }
  var _ev = ev.get(this);
  var _evCfg = evCfg.get(this);
  if (this.cancelable && !_evCfg._passive) {
    _evCfg.defaultPrevented = true;
    if (typeof _ev.preventDefault === 'function') {
      // Prevent any predefined defaults
      _ev.preventDefault();
    }
  }
};

// @ts-expect-error Casting doesn't work
ShimEvent.prototype.stopImmediatePropagation = function () {
  var _evCfg = evCfg.get(this);
  _evCfg._stopImmediatePropagation = true;
};

// @ts-expect-error Casting doesn't work
ShimEvent.prototype.stopPropagation = function () {
  var _evCfg = evCfg.get(this);
  _evCfg._stopPropagation = true;
};

// @ts-expect-error Casting doesn't work
ShimEvent.prototype.initEvent = function (type, bubbles, cancelable) {
  // Chrome currently has function length 1 only but WebIDL says 3
  // const bubbles = arguments[1];
  // const cancelable = arguments[2];
  var _evCfg = evCfg.get(this);
  if (_evCfg._dispatched) {
    return;
  }
  Object.defineProperty(this, 'type', {
    enumerable: true,
    configurable: true,
    get: function get() {
      return type;
    }
  });
  Object.defineProperty(this, 'bubbles', {
    enumerable: true,
    configurable: true,
    get: function get() {
      return bubbles;
    }
  });
  Object.defineProperty(this, 'cancelable', {
    enumerable: true,
    configurable: true,
    get: function get() {
      return cancelable;
    }
  });
  _evCfg.type = type;
  if (bubbles !== undefined) {
    _evCfg.bubbles = bubbles;
  }
  if (cancelable !== undefined) {
    _evCfg.cancelable = cancelable;
  }
};
['type', 'target', 'currentTarget'].forEach(function (prop) {
  // @ts-expect-error Casting doesn't work
  Object.defineProperty(ShimEvent.prototype, prop, {
    enumerable: true,
    configurable: true,
    get: function get() {
      throw new TypeError('Illegal invocation');
    }
  });
});
['eventPhase', 'defaultPrevented', 'bubbles', 'cancelable', 'timeStamp'].forEach(function (prop) {
  // @ts-expect-error Casting doesn't work
  Object.defineProperty(ShimEvent.prototype, prop, {
    enumerable: true,
    configurable: true,
    get: function get() {
      throw new TypeError('Illegal invocation');
    }
  });
});
['NONE', 'CAPTURING_PHASE', 'AT_TARGET', 'BUBBLING_PHASE'].forEach(function (prop, i) {
  Object.defineProperty(ShimEvent, prop, {
    enumerable: true,
    writable: false,
    value: i
  });
  // @ts-expect-error Casting doesn't work
  Object.defineProperty(ShimEvent.prototype, prop, {
    writable: false,
    value: i
  });
});
// @ts-expect-error Casting doesn't work
ShimEvent[Symbol.toStringTag] = 'Function';

// @ts-expect-error Casting doesn't work
ShimEvent.prototype[Symbol.toStringTag] = 'EventPrototype';
Object.defineProperty(ShimEvent, 'prototype', {
  writable: false
});

/* eslint-disable func-name-matching -- Polyfill */
/* eslint-disable no-shadow -- Polyfill */
/**
 * @class
 * @param {string} type
 */
var ShimCustomEvent = /** @type {unknown} */function CustomEvent(type) {
  /* eslint-enable func-name-matching -- Polyfill */
  /* eslint-enable no-shadow -- Polyfill */

  // eslint-disable-next-line prefer-rest-params -- Keep signature
  var _arguments2 = Array.prototype.slice.call(arguments),
    evInit = _arguments2[1],
    _ev = _arguments2[2];
  // @ts-expect-error Casting doesn't work
  ShimEvent.call(this, type, evInit, _ev);
  // @ts-expect-error
  this[Symbol.toStringTag] = 'CustomEvent';
  this.toString = function () {
    return '[object CustomEvent]';
  };
  // var _evCfg = evCfg.get(this);
  evInit = evInit || {};
  // @ts-ignore
  this.initCustomEvent(type, evInit.bubbles, evInit.cancelable, 'detail' in evInit ? evInit.detail : null);
};
// @ts-expect-error Casting doesn't work
Object.defineProperty(ShimCustomEvent.prototype, 'constructor', {
  enumerable: false,
  writable: true,
  configurable: true,
  value: ShimCustomEvent
});
// @ts-expect-error Casting doesn't work
ShimCustomEvent.prototype.initCustomEvent = function (type, bubbles, cancelable, detail) {
  // @ts-expect-error Needed for exporting
  if (!(this instanceof ShimCustomEvent)) {
    throw new TypeError('Illegal invocation');
  }
  var _evCfg = evCfg.get(this);
  // @ts-expect-error Casting doesn't work
  ShimCustomEvent.call(this, type, {
    bubbles: bubbles,
    cancelable: cancelable,
    detail: detail
    // eslint-disable-next-line prefer-rest-params -- Keep signature
  }, arguments[4]);
  if (_evCfg._dispatched) {
    return;
  }
  if (detail !== undefined) {
    _evCfg.detail = detail;
  }
  Object.defineProperty(this, 'detail', {
    get: function get() {
      return _evCfg.detail;
    }
  });
};
// @ts-expect-error Casting doesn't work
ShimCustomEvent[Symbol.toStringTag] = 'Function';
// @ts-expect-error Casting doesn't work
ShimCustomEvent.prototype[Symbol.toStringTag] = 'CustomEventPrototype';

// @ts-expect-error Casting doesn't work
Object.defineProperty(ShimCustomEvent.prototype, 'detail', {
  enumerable: true,
  configurable: true,
  get: function get() {
    throw new TypeError('Illegal invocation');
  }
});
Object.defineProperty(ShimCustomEvent, 'prototype', {
  writable: false
});

/**
 *
 * @param {EventWithProps} e
 * @returns {EventWithProps}
 */
function copyEvent(e) {
  var bubbles = e.bubbles,
    cancelable = e.cancelable,
    detail = e.detail,
    type = e.type;
  if ('detail' in e) {
    // @ts-expect-error Casting doesn't work
    return new ShimCustomEvent(type, {
      bubbles: bubbles,
      cancelable: cancelable,
      detail: detail
    }, e);
  }
  // @ts-expect-error Casting doesn't work
  return new ShimEvent(type, {
    bubbles: bubbles,
    cancelable: cancelable
  }, e);
}

/**
* @typedef {object} ListenerOptions
* @property {boolean} [once] Remove listener after invoking once
* @property {boolean} [passive] Don't allow `preventDefault`
* @property {boolean} [capture] Use `_children` and set `eventPhase`
*/

/**
* @typedef {object} ListenerAndOptions
* @property {Listener} listener
* @property {ListenerOptions} options
*/

/**
* @typedef {object} ListenerInfo
* @property {ListenerAndOptions[]} listenersByTypeOptions
* @property {ListenerOptions} options
* @property {ListenerAndOptions[]} listenersByType
*/

/**
* @callback Listener
* @param {EventWithProps} e
* @returns {boolean}
*/

/**
 * Keys are event types.
 * @typedef {{[key: string]: Listener[]}} Listeners
 */

/**
 * @typedef {{
 *   [type: string]: ListenerAndOptions[]
 * }} AllListeners
 */

/**
 *
 * @param {AllListeners} listeners
 * @param {string} type
 * @param {boolean|ListenerOptions} options
 * @returns {ListenerInfo}
 */
function getListenersOptions(listeners, type, options) {
  var listenersByType = listeners[type];
  if (listenersByType === undefined) listeners[type] = listenersByType = [];
  var opts = typeof options === 'boolean' ? {
    capture: options
  } : options || {};
  var stringifiedOptions = JSON.stringify(opts);
  var listenersByTypeOptions = listenersByType.filter(function (obj) {
    return stringifiedOptions === JSON.stringify(obj.options);
  });
  return {
    listenersByTypeOptions: listenersByTypeOptions,
    options: opts,
    listenersByType: listenersByType
  };
}
var methods = {
  /**
   * @param {AllListeners} listeners
   * @param {Listener} listener
   * @param {string} type
   * @param {boolean|ListenerOptions} options
   * @returns {void}
   */
  addListener: function addListener(listeners, listener, type, options) {
    var listenersOptions = getListenersOptions(listeners, type, options);
    var listenersByTypeOptions = listenersOptions.listenersByTypeOptions;
    options = listenersOptions.options;
    var listenersByType = listenersOptions.listenersByType;
    if (listenersByTypeOptions.some(function (l) {
      return l.listener === listener;
    })) return;
    listenersByType.push({
      listener: listener,
      options: options
    });
  },
  /**
   * @param {AllListeners} listeners
   * @param {Listener} listener
   * @param {string} type
   * @param {boolean|ListenerOptions} options
   * @returns {void}
   */
  removeListener: function removeListener(listeners, listener, type, options) {
    var listenersOptions = getListenersOptions(listeners, type, options);
    var listenersByType = listenersOptions.listenersByType;
    var stringifiedOptions = JSON.stringify(listenersOptions.options);
    listenersByType.some(function (l, i) {
      if (l.listener === listener && stringifiedOptions === JSON.stringify(l.options)) {
        listenersByType.splice(i, 1);
        if (!listenersByType.length) delete listeners[type];
        return true;
      }
      return false;
    });
  },
  /**
   *
   * @param {AllListeners} listeners
   * @param {Listener} listener
   * @param {string} type
   * @param {boolean|ListenerOptions} options
   * @returns {boolean}
   */
  hasListener: function hasListener(listeners, listener, type, options) {
    var listenersOptions = getListenersOptions(listeners, type, options);
    var listenersByTypeOptions = listenersOptions.listenersByTypeOptions;
    return listenersByTypeOptions.some(function (l) {
      return l.listener === listener;
    });
  }
};

/* eslint-disable no-shadow -- Polyfill */
/**
 * @class
 */
function EventTarget() {
  /* eslint-enable no-shadow -- Polyfill */
  throw new TypeError('Illegal constructor');
}

/**
 * @typedef {"addEarlyEventListener"|"removeEarlyEventListener"|"hasEarlyEventListener"|
 *   "addEventListener"|"removeEventListener"|"hasEventListener"|
 *   "addLateEventListener"|"removeLateEventListener"|"hasLateEventListener"|
 *   "addDefaultEventListener"|"removeDefaultEventListener"|"hasDefaultEventListener"
 * } ListenerName
 */
Object.assign(EventTarget.prototype, ['Early', '', 'Late', 'Default'].reduce(function ( /** @type {{[key: string]: Function}} */
obj, listenerType) {
  ['add', 'remove', 'has'].forEach(function (method) {
    var mainMethod = /** @type {ListenerName} */method + listenerType + 'EventListener';
    /**
     * @param {string} type
     * @param {Listener|{handleEvent: Listener}} listener
     * @this {EventTarget & {
     *   _earlyListeners: AllListeners,
     *   _listeners: AllListeners,
     *   _lateListeners: AllListeners,
     *   _defaultListeners: AllListeners,
     * }}
     * @returns {boolean|void}
     */
    obj[mainMethod] = function (type, listener) {
      // eslint-disable-next-line prefer-rest-params -- Keep signature
      var options = arguments[2]; // We keep the listener `length` as per WebIDL
      if (arguments.length < 2) throw new TypeError('2 or more arguments required');
      if (typeof type !== 'string') {
        // @ts-expect-error It's ok to construct
        throw new ShimDOMException('UNSPECIFIED_EVENT_TYPE_ERR', 'UNSPECIFIED_EVENT_TYPE_ERR');
      }
      try {
        // As per code such as the following, handleEvent may throw,
        //  but is uncaught
        // https://github.com/web-platform-tests/wpt/blob/master/IndexedDB/fire-error-event-exception.html#L54-L56
        if ('handleEvent' in listener && listener.handleEvent.bind) {
          listener = listener.handleEvent.bind(listener);
        }
      } catch (err) {
        // eslint-disable-next-line no-console -- Feedback to user
        console.log('Uncaught `handleEvent` error', err);
      }
      var arrStr = /** @type {"_earlyListeners"|"_listeners"|"_lateListeners"|"_defaultListeners"} */
      '_' + listenerType.toLowerCase() + (listenerType === '' ? 'l' : 'L') + 'isteners';
      if (!this[arrStr]) {
        Object.defineProperty(this, arrStr, {
          value: {}
        });
      }
      var meth = /** @type {"addListener"|"removeListener"|"hasListener"} */
      method + 'Listener';
      return methods[meth](this[arrStr], /** @type {Listener} */listener, type, options);
    };
  });
  return obj;
}, {}));
Object.assign(EventTarget.prototype, {
  _legacyOutputDidListenersThrowCheck: undefined,
  /**
   * @param {CustomOptions} customOptions
   * @this {EventTarget.prototype}
   * @returns {void}
   */
  __setOptions: function __setOptions(customOptions) {
    customOptions = customOptions || {};
    // Todo: Make into event properties?
    this._defaultSync = customOptions.defaultSync;
    this._extraProperties = customOptions.extraProperties || [];
    if (customOptions.legacyOutputDidListenersThrowFlag) {
      // IndexedDB
      this._legacyOutputDidListenersThrowCheck = true;
      this._extraProperties.push('__legacyOutputDidListenersThrowError');
    }
  },
  /**
   * @param {ShimEvent} e
   * @this {EventTarget & {
   *   _dispatchEvent: (e: ShimEvent|ShimCustomEvent, setTarget: boolean) => boolean,
  * }}
   * @returns {boolean}
   */
  dispatchEvent: function dispatchEvent(e) {
    return this._dispatchEvent(e, true);
  },
  /**
   * @param {EventWithProps} e
   * @param {boolean} setTarget
   * @this {EventTarget.prototype & {
   *   _earlyListeners: AllListeners,
   *   _listeners: AllListeners,
   *   _lateListeners: AllListeners,
   *   _defaultListeners: AllListeners,
   * }}
   * @returns {boolean}
   */
  _dispatchEvent: function _dispatchEvent(e, setTarget) {
    var _this2 = this;
    ['early', '', 'late', 'default'].forEach(function (listenerType) {
      var arrStr = /** @type {"_earlyListeners"|"_listeners"|"_lateListeners"|"_defaultListeners"} */
      '_' + listenerType + (listenerType === '' ? 'l' : 'L') + 'isteners';
      if (!_this2[arrStr]) {
        Object.defineProperty(_this2, arrStr, {
          value: {}
        });
      }
    });
    var _evCfg = evCfg.get(e);
    if (_evCfg && setTarget && _evCfg._dispatched) {
      // @ts-expect-error It's ok to construct
      throw new ShimDOMException('The object is in an invalid state.', 'InvalidStateError');
    }

    /** @type {EventWithProps} */
    var eventCopy;
    if (_evCfg) {
      eventCopy = e;
    } else {
      eventCopy = copyEvent(e);
      _evCfg = evCfg.get(eventCopy);
      _evCfg._dispatched = true;

      /** @type {string[]} */
      this._extraProperties.forEach(function (prop) {
        if (prop in e) {
          /** @type {{[key: string]: any}} */eventCopy[prop] = /** @type {{[key: string]: any}} */e[prop]; // Todo: Put internal to `ShimEvent`?
        }
      });
    }

    var _eventCopy = eventCopy,
      type = _eventCopy.type;

    /**
     *
     * @returns {void}
     */
    function finishEventDispatch() {
      _evCfg.eventPhase = phases.NONE;
      _evCfg.currentTarget = null;
      delete _evCfg._children;
    }
    /**
     *
     * @returns {void}
     */
    function invokeDefaults() {
      // Ignore stopPropagation from defaults
      _evCfg._stopImmediatePropagation = undefined;
      _evCfg._stopPropagation = undefined;
      // We check here for whether we should invoke since may have changed since timeout (if late listener prevented default)
      if (!eventCopy.defaultPrevented || !_evCfg.cancelable) {
        // 2nd check should be redundant
        _evCfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke default listeners
        eventCopy.target.invokeCurrentListeners(eventCopy.target._defaultListeners, eventCopy, type);
      }
      finishEventDispatch();
    }
    var continueEventDispatch = function continueEventDispatch() {
      // Ignore stop propagation of user now
      _evCfg._stopImmediatePropagation = undefined;
      _evCfg._stopPropagation = undefined;
      if (!_this2._defaultSync) {
        setTimeout(invokeDefaults, 0);
      } else invokeDefaults();
      _evCfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke late listeners
      // Sync default might have stopped
      if (!_evCfg._stopPropagation) {
        _evCfg._stopImmediatePropagation = undefined;
        _evCfg._stopPropagation = undefined;
        // We could allow stopPropagation by only executing upon (_evCfg._stopPropagation)
        eventCopy.target.invokeCurrentListeners(eventCopy.target._lateListeners, eventCopy, type);
      }
      finishEventDispatch();
      return !eventCopy.defaultPrevented;
    };
    if (setTarget) _evCfg.target = this;
    switch ('eventPhase' in eventCopy && eventCopy.eventPhase) {
      case phases.CAPTURING_PHASE:
        {
          if (_evCfg._stopPropagation) {
            return continueEventDispatch();
          }
          this.invokeCurrentListeners(this._listeners, eventCopy, type);
          var child = _evCfg._children && _evCfg._children.length && _evCfg._children.pop();
          if (!child || child === eventCopy.target) {
            _evCfg.eventPhase = phases.AT_TARGET;
          }
          if (child) child._defaultSync = this._defaultSync;
          return (child || this)._dispatchEvent(eventCopy, false);
        }
      case phases.AT_TARGET:
        if (_evCfg._stopPropagation) {
          return continueEventDispatch();
        }
        this.invokeCurrentListeners(this._listeners, eventCopy, type, true);
        if (!_evCfg.bubbles) {
          return continueEventDispatch();
        }
        _evCfg.eventPhase = phases.BUBBLING_PHASE;
        return this._dispatchEvent(eventCopy, false);
      case phases.BUBBLING_PHASE:
        {
          if (_evCfg._stopPropagation) {
            return continueEventDispatch();
          }
          var parent = this.__getParent && this.__getParent();
          if (!parent) {
            return continueEventDispatch();
          }
          parent.invokeCurrentListeners(parent._listeners, eventCopy, type, true);
          parent._defaultSync = this._defaultSync;
          return parent._dispatchEvent(eventCopy, false);
        }
      case phases.NONE:
      default:
        {
          _evCfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke early listeners
          this.invokeCurrentListeners(this._earlyListeners, eventCopy, type);
          if (!('__getParent' in this)) {
            _evCfg.eventPhase = phases.AT_TARGET;
            return this._dispatchEvent(eventCopy, false);
          }

          /* eslint-disable consistent-this -- Readability */
          var par = this;
          var root_ = this;
          /* eslint-enable consistent-this -- Readability */
          while (par.__getParent && (par = par.__getParent()) !== null) {
            if (!_evCfg._children) {
              _evCfg._children = [];
            }
            _evCfg._children.push(root_);
            root_ = par;
          }
          root_._defaultSync = this._defaultSync;
          _evCfg.eventPhase = phases.CAPTURING_PHASE;
          return root_._dispatchEvent(eventCopy, false);
        }
    }
  },
  /**
   * @type {InvokeCurrentListeners}
   * @this {EventTarget.prototype & {[key: string]: Listener}}
   */
  invokeCurrentListeners: function invokeCurrentListeners(listeners, eventCopy, type, checkOnListeners) {
    var _this3 = this;
    var _evCfg = evCfg.get(eventCopy);
    _evCfg.currentTarget = this;
    var listOpts = getListenersOptions(listeners, type, {});
    // eslint-disable-next-line unicorn/prefer-spread -- Performance?
    var listenersByType = listOpts.listenersByType.concat();
    var dummyIPos = listenersByType.length ? 1 : 0;
    listenersByType.some(function (listenerObj, i) {
      var onListener = checkOnListeners ? _this3['on' + type] : null;
      if (_evCfg._stopImmediatePropagation) return true;
      if (i === dummyIPos && typeof onListener === 'function') {
        // We don't splice this in as could be overwritten; executes here per
        //    https://html.spec.whatwg.org/multipage/webappapis.html#event-handler-attributes:event-handlers-14
        _this3.tryCatch(eventCopy, function () {
          var ret = onListener.call(eventCopy.currentTarget, eventCopy);
          if (ret === false) {
            eventCopy.preventDefault();
          }
        });
      }
      var options = listenerObj.options;
      var once = options.once,
        passive = options.passive,
        capture = options.capture;
      _evCfg._passive = passive;
      if (capture && eventCopy.target !== eventCopy.currentTarget && eventCopy.eventPhase === phases.CAPTURING_PHASE || eventCopy.eventPhase === phases.AT_TARGET || !capture && eventCopy.target !== eventCopy.currentTarget && eventCopy.eventPhase === phases.BUBBLING_PHASE) {
        var listener = listenerObj.listener;
        _this3.tryCatch(eventCopy, function () {
          listener.call(eventCopy.currentTarget, eventCopy);
        });
        if (once) {
          _this3.removeEventListener(type, listener, options);
        }
      }
      return false;
    });
    this.tryCatch(eventCopy, function () {
      var onListener = checkOnListeners ? _this3['on' + type] : null;
      if (typeof onListener === 'function' && listenersByType.length < 2) {
        var ret = onListener.call(eventCopy.currentTarget, eventCopy); // Won't have executed if too short
        if (ret === false) {
          eventCopy.preventDefault();
        }
      }
    });
    return !eventCopy.defaultPrevented;
  },
  /* eslint-disable promise/prefer-await-to-callbacks -- Try-catch */
  /**
   * @param {EventWithProps} evt
   * @param {() => void} cb
   * @returns {void}
   */
  tryCatch: function tryCatch(evt, cb) {
    /* eslint-enable promise/prefer-await-to-callbacks -- Try-catch */
    try {
      // Per MDN: Exceptions thrown by event handlers are reported
      //    as uncaught exceptions; the event handlers run on a nested
      //    callstack: they block the caller until they complete, but
      //    exceptions do not propagate to the caller.
      // eslint-disable-next-line promise/prefer-await-to-callbacks, n/callback-return --  Try-catch
      cb();
    } catch (err) {
      this.triggerErrorEvent(err, evt);
    }
  },
  /**
   * @param {unknown} err
   * @param {EventWithProps} evt
   * @returns {void}
   */
  triggerErrorEvent: function triggerErrorEvent(err, evt) {
    var error = err;
    if (typeof err === 'string') {
      error = new Error('Uncaught exception: ' + err);
    }
    var triggerGlobalErrorEvent;
    var useNodeImpl = false;
    if (typeof window === 'undefined' || typeof ErrorEvent === 'undefined' || window && (typeof window === "undefined" ? "undefined" : _typeof(window)) === 'object' && !window.dispatchEvent) {
      useNodeImpl = true;
      triggerGlobalErrorEvent = function triggerGlobalErrorEvent() {
        setTimeout(function () {
          // Node won't be able to catch in this way if we throw in the main thread
          // console.log(err); // Should we auto-log for user?
          throw error; // Let user listen to `process.on('uncaughtException', (err) => {});`
        });
      };
    } else {
      triggerGlobalErrorEvent = function triggerGlobalErrorEvent() {
        // See https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
        //     and https://github.com/w3c/IndexedDB/issues/49

        // Note that a regular Event will properly trigger
        //     `window.addEventListener('error')` handlers, but it will not trigger
        //     `window.onerror` as per https://html.spec.whatwg.org/multipage/webappapis.html#handler-onerror
        // Note also that the following line won't handle `window.addEventListener` handlers
        //        if (window.onerror) window.onerror(error.message, err.fileName, err.lineNumber, error.columnNumber, error);

        // `ErrorEvent` properly triggers `window.onerror` and `window.addEventListener('error')` handlers
        var errEv = new ErrorEvent('error', {
          error: err,
          message: /** @type {Error} */error.message || '',
          // We can't get the actually useful user's values!
          filename: /** @type {Error & {fileName: string}} */error.fileName || '',
          lineno: /** @type {Error & {lineNumber: Integer}} */error.lineNumber || 0,
          colno: /** @type {Error & {columnNumber: Integer}} */error.columnNumber || 0
        });
        window.dispatchEvent(errEv);
        // console.log(err); // Should we auto-log for user?
      };
    }

    // Todo: This really should always run here but as we can't set the global
    //     `window` (e.g., using jsdom) since `setGlobalVars` becomes unable to
    //     shim `indexedDB` in such a case currently (apparently due to
    //     <https://github.com/axemclion/IndexedDBShim/issues/280>), we can't
    //     avoid the above Node implementation (which, while providing some
    //     fallback mechanism, is unstable)
    if (!useNodeImpl || !this._legacyOutputDidListenersThrowCheck) triggerGlobalErrorEvent();

    // See https://dom.spec.whatwg.org/#concept-event-listener-inner-invoke and
    //    https://github.com/w3c/IndexedDB/issues/140 (also https://github.com/w3c/IndexedDB/issues/49 )
    if (this._legacyOutputDidListenersThrowCheck) {
      evt.__legacyOutputDidListenersThrowError = error;
    }
  }
});
EventTarget.prototype[Symbol.toStringTag] = 'EventTargetPrototype';
Object.defineProperty(EventTarget, 'prototype', {
  writable: false
});
var ShimEventTarget = EventTarget;
var EventTargetFactory = {
  /**
   * @param {CustomOptions} customOptions
   * @returns {EventTarget}
   */
  createInstance: function createInstance(customOptions) {
    /* eslint-disable func-name-matching -- Shim vs. Polyfill */
    /* eslint-disable no-shadow -- Polyfill */
    /**
     * @class
     * @this {typeof ShimEventTarget.prototype}
     */
    var ET = /** @type {unknown} */function EventTarget() {
      /* eslint-enable no-shadow -- Polyfill */
      /* eslint-enable func-name-matching -- Shim vs. Polyfill */
      this.__setOptions(customOptions);
    };
    // @ts-expect-error Casting doesn't work
    ET.prototype = ShimEventTarget.prototype;
    // @ts-expect-error Casting doesn't work
    return new ET();
  }
};
EventTarget.ShimEvent = ShimEvent;
EventTarget.ShimCustomEvent = ShimCustomEvent;
EventTarget.ShimDOMException = ShimDOMException;
EventTarget.ShimEventTarget = EventTarget;
EventTarget.EventTargetFactory = EventTargetFactory;

/**
 * @returns {void}
 */
function setPrototypeOfCustomEvent() {
  // TODO: IDL needs but reported as slow!
  Object.setPrototypeOf(ShimCustomEvent, /** @type {object} */ShimEvent);
  // @ts-expect-error How to overcome?
  Object.setPrototypeOf(ShimCustomEvent.prototype, ShimEvent.prototype);
}

export { EventTargetFactory, ShimCustomEvent, ShimDOMException, ShimEvent, EventTarget as ShimEventTarget, setPrototypeOfCustomEvent };
