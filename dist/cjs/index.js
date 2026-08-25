(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.EventTargeter = {}));
})(this, (function (exports) { 'use strict';

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
     * @typedef {(
     *   type: string, listener: Listener|{handleEvent: Listener}, options?: boolean|ListenerOptions
     * ) => void} AddOrRemoveListenerMethod
     */
    /**
     * @typedef {(
     *   type: string, listener: Listener|{handleEvent: Listener}, options?: boolean|ListenerOptions
     * ) => boolean} HasListenerMethod
     */

    /**
     * @typedef {{
     *   _defaultSync?: boolean,
     *   _extraProperties?: string[],
     *   _legacyOutputDidListenersThrowCheck?: boolean,
     *   _earlyListeners?: AllListeners,
     *   _listeners?: AllListeners,
     *   _lateListeners?: AllListeners,
     *   _defaultListeners?: AllListeners,
     *   _parent?: EventTargetInstance|null,
     *   __getParent?: () => EventTargetInstance|null,
     *   tryCatch: (evt: EventWithProps, cb: () => void) => void,
     *   triggerErrorEvent: (err: unknown, evt: EventWithProps) => void,
     *   invokeCurrentListeners: InvokeCurrentListeners,
     *   dispatchEvent: (e: EventWithProps) => boolean,
     *   _dispatchEvent: (e: EventWithProps, setTarget: boolean) => boolean,
     *   __setOptions: (customOptions?: CustomOptions) => void,
     *   addEventListener: AddOrRemoveListenerMethod,
     *   removeEventListener: AddOrRemoveListenerMethod,
     *   hasEventListener: HasListenerMethod,
     *   addEarlyEventListener: AddOrRemoveListenerMethod,
     *   removeEarlyEventListener: AddOrRemoveListenerMethod,
     *   hasEarlyEventListener: HasListenerMethod,
     *   addLateEventListener: AddOrRemoveListenerMethod,
     *   removeLateEventListener: AddOrRemoveListenerMethod,
     *   hasLateEventListener: HasListenerMethod,
     *   addDefaultEventListener: AddOrRemoveListenerMethod,
     *   removeDefaultEventListener: AddOrRemoveListenerMethod,
     *   hasDefaultEventListener: HasListenerMethod,
     *   [key: string]: any
     * }} EventTargetInstance
     */
    /**
     * @typedef {{
     *   __legacyOutputDidListenersThrowError?: unknown,
     *   target?: EventTargetInstance,
     *   composed?: boolean,
     *   currentTarget?: EventTargetInstance|null,
     *   eventPhase?: 0|1|2|3
     *   defaultPrevented?: boolean,
     *   type?: string,
     *   bubbles?: boolean,
     *   cancelable?: boolean,
     *   isTrusted?: boolean,
     *   timeStamp?: Integer,
     *   initEvent?: (type: string, bubbles: boolean, cancelable: boolean) => void,
     *   preventDefault?: () => void,
     *   composedPath?: () => void,
     *   detail?: any,
     *   initCustomEvent?: (
     *     type: string, canBubble: boolean, cancelable: boolean,
     *     detail: any
     *   ) => void,
     *   [key: string]: any
     * }} EventWithProps
     */

    // Todo: Switch to ES6 classes

    /** @type {{NONE: 0, CAPTURING_PHASE: 1, AT_TARGET: 2, BUBBLING_PHASE: 3}} */
    const phases = {
      NONE: 0,
      CAPTURING_PHASE: 1,
      AT_TARGET: 2,
      BUBBLING_PHASE: 3
    };
    const ShimDOMException = typeof DOMException === 'undefined'
    // Todo: Better polyfill (if even needed here)
    /* eslint-disable no-shadow -- Polyfill */
    // eslint-disable-next-line @stylistic/operator-linebreak -- TS/JSDoc needs
    ?
    /**
     * @param {string} msg
     * @param {string} name
     * @returns {Error}
     */
    function DOMException(msg, name) {
      // No need for `toString` as same as for `Error`
      /* eslint-enable no-shadow -- Polyfill */
      const err = new Error(msg);
      Object.defineProperty(err, 'name', {
        value: name,
        writable: true,
        configurable: true
      });
      return err;
    } : DOMException;

    /** @type {WeakMap<object, any>} */
    const ev = new WeakMap();
    /** @type {WeakMap<object, EventWithProps>} */
    const evCfg = new WeakMap();

    /**
     * Retrieves the internal config bag for an event known to have already
     * been registered in `evCfg` (i.e., not the very first, possibly-unset
     * lookup on an incoming event).
     * @param {object} key
     * @returns {EventWithProps}
     */
    function getEvCfg(key) {
      return /** @type {EventWithProps} */evCfg.get(key);
    }

    // Todo: Set _ev argument outside of this function

    /**
     * Defines own-property getters on `instance` for each named prop, each
     *   preferring `_evCfg`'s own value (e.g. set by `initEvent`), falling
     *   back to whatever the wrapped `_ev` (a real native event, or another
     *   `Event` this one is copying, per `copyEvent`) has, and finally a
     *   spec-shaped default. Shared by `Event`'s own base properties and, via
     *   its own extra call, `CustomEvent`'s `detail`/`initCustomEvent` --
     *   factored out so neither needs any special-casing of the other to know
     *   which extra properties to define.
     * @param {EventWithProps} instance
     * @param {string[]} props
     * @param {EventWithProps} _evCfg
     * @param {EventWithProps} _ev
     * @returns {void}
     */
    function definePassthroughProps(instance, props, _evCfg, _ev) {
      Object.defineProperties(instance, props.reduce((obj, pr) => {
        const prop =
        /**
         * @type {"type"|"bubbles"|"cancelable"|"isTrusted"|
         *   "timeStamp"|"initEvent"|"composedPath"|"composed"|
         *   "detail"|"initCustomEvent"
         * }
         */
        pr;
        obj[prop] = {
          configurable: true,
          get() {
            return Object.hasOwn(_evCfg, prop) ? _evCfg[prop] : Reflect.has(_ev, prop) ? _ev[prop] : ['bubbles', 'cancelable', 'composed'].includes(prop) ? false : undefined;
          }
        };
        return obj;
      }, /** @type {{[key: string]: any}} */{}));
    }

    /**
     * The shared setup behind `Event`'s own constructor: populates the
     *   WeakMap-backed internal state and defines the base `Event` own-
     *   property getters on `instance`. Kept as a plain, reusable function
     *   (not just inlined into the constructor) so
     *   `CustomEvent.prototype.initCustomEvent` -- which, per the legacy DOM
     *   Level 3 `initEvent`-family API, must remain callable *after*
     *   construction to reinitialize an existing instance, not only from
     *   within the constructor -- can re-run this directly on an existing
     *   instance without trying to re-invoke a class constructor (illegal
     *   outside of `new`/`super()`).
     * @param {EventWithProps} instance
     * @param {string} type
     * @param {EventInit} [evInit]
     * @param {EventWithProps} [_ev]
     * @returns {void}
     */
    function initEventInternal(instance, type, evInit, _ev) {
      evInit ||= {};
      _ev ||= {};

      /** @type {EventWithProps} */
      const _evCfg = {};
      if ('composed' in evInit) {
        _evCfg.composed = evInit.composed;
      }

      // _evCfg.isTrusted = true; // We are not always using this for user-created events
      // _evCfg.timeStamp = new Date().valueOf(); // This is no longer a timestamp, but monotonic (elapsed?)

      ev.set(instance, _ev);
      evCfg.set(instance, _evCfg);
      /** @type {(type: string, bubbles?: boolean, cancelable?: boolean) => void} */
      instance.initEvent(type, evInit.bubbles, evInit.cancelable);
      ['target', 'currentTarget', 'eventPhase', 'defaultPrevented'].forEach(pr => {
        const prop = /** @type {"target"|"currentTarget"|"eventPhase"|"defaultPrevented"} */
        pr;
        Object.defineProperty(instance, prop, {
          configurable: true,
          get() {
            return (/* prop in _evCfg && */_evCfg[prop] !== undefined) ? _evCfg[prop] : Reflect.has(_ev, prop) ? _ev[prop] :
            // Defaults
            prop === 'eventPhase' ? 0 : prop === 'defaultPrevented' ? false : null;
          }
        });
      });

      // Legacy alias of `.defaultPrevented`/`.preventDefault()`; not backed by
      //   `_evCfg` like the rest since it's derived, not stored.
      Object.defineProperty(instance, 'returnValue', {
        enumerable: true,
        configurable: true,
        get() {
          return !instance.defaultPrevented;
        },
        set(val) {
          if (val === false) {
            /** @type {() => void} */instance.preventDefault();
          }
        }
      });
      definePassthroughProps(instance, [
      // Event
      'type', 'bubbles', 'cancelable',
      // Defaults to false
      'isTrusted', 'timeStamp',
      // `initEvent` deliberately excluded: it's an *operation*, not a data
      //   attribute -- shadowing it here (the same way `type`/`bubbles`/
      //   etc. legitimately need to reflect a wrapped/copied event) would
      //   permanently replace the real, callable prototype method with a
      //   plain data getter (returning `undefined` for any event not
      //   wrapping a native one with its own `initEvent`), breaking both
      //   re-callability and idlharness's "operation" conformance checks.
      // Other event properties (not used by our code)
      'composed'], _evCfg, _ev);
    }

    /* eslint-disable no-shadow -- Polyfilling */
    /**
     * We use an adapter class rather than a proxy not only for compatibility
     * but also since we have to clone native event properties anyways in order
     * to properly set `target`, etc.
     * The regular DOM method `dispatchEvent` won't work with this polyfill as
     * it expects a native event.
     */
    class Event {
      /* eslint-enable no-shadow -- Polyfilling */
      /**
       * @param {string} type
       */
      constructor(type) {
        // eslint-disable-next-line consistent-this -- TS constructors can't use `@this`
        const me = /** @type {EventWithProps} */ /** @type {unknown} */this;
        // @ts-expect-error Symbol not part of the string index signature
        me[Symbol.toStringTag] = 'Event';
        me.toString = () => {
          return '[object Event]';
        };
        // For WebIDL checks of function's `length`, we check `arguments` for the optional arguments
        // eslint-disable-next-line prefer-rest-params -- Don't want to change signature
        const [, evInit, _ev] = arguments;
        if (!arguments.length) {
          throw new TypeError("Failed to construct 'Event': 1 argument required, but only 0 present.");
        }
        initEventInternal(me, type, evInit, _ev);
      }
    }
    const ShimEvent = Event;

    // Named function expressions (rather than anonymous ones assigned via
    //   member-expression `=`, which per spec never get an inferred `.name`)
    //   so `.name` matches the WebIDL operation identifier, e.g. for
    //   `idlharness.js`'s "property has wrong .name" checks.

    // A real class's own declared shape doesn't include methods added to its
    //   `.prototype` afterward (unlike the plain-function `.prototype` this
    //   used to be, which TS treats far more loosely) -- assigning through
    //   this untyped alias, rather than `ShimEvent.prototype` directly, keeps
    //   that dynamic-augmentation pattern working without a `@ts-expect-error`
    //   on every single line below.
    /** @type {any} */
    const ShimEventProto = ShimEvent.prototype;

    /** @this {EventWithProps} */
    ShimEventProto.preventDefault = function preventDefault() {
      if (!(this instanceof ShimEvent)) {
        throw new TypeError('Illegal invocation');
      }
      const _ev = ev.get(this);
      const _evCfg = getEvCfg(this);
      if (this.cancelable && !_evCfg._passive) {
        _evCfg.defaultPrevented = true;
        if (typeof _ev.preventDefault === 'function') {
          // Prevent any predefined defaults
          _ev.preventDefault();
        }
      }
    };

    /**
     * Per spec, returns the empty list once dispatch has finished (or hasn't
     *   started); while an event is actively being dispatched, returns the
     *   full target-to-root propagation path computed once up front by
     *   `_dispatchEvent` (see there), regardless of which phase dispatch is
     *   currently in.
     * @this {EventWithProps}
     * @returns {EventTargetInstance[]}
     */
    ShimEventProto.composedPath = function composedPath() {
      if (!(this instanceof ShimEvent)) {
        throw new TypeError('Illegal invocation');
      }
      const _evCfg = getEvCfg(this);
      if (!_evCfg._dispatchFlag || !_evCfg._path) {
        return [];
      }
      return [..._evCfg._path];
    };

    /** @this {EventWithProps} */
    ShimEventProto.stopImmediatePropagation = function stopImmediatePropagation() {
      const _evCfg = getEvCfg(this);
      _evCfg._stopImmediatePropagation = true;
    };

    /** @this {EventWithProps} */
    ShimEventProto.stopPropagation = function stopPropagation() {
      const _evCfg = getEvCfg(this);
      _evCfg._stopPropagation = true;
    };

    /**
     * @param {string} type
     * @param {boolean} [bubbles]
     * @param {boolean} [cancelable]
     * @this {EventWithProps}
     */
    ShimEventProto.initEvent = function initEvent(type, bubbles = false, cancelable = false) {
      // WebIDL's optional args (defaulted here) keep `.length` at 1, matching real browsers
      const _evCfg = getEvCfg(this);
      if (_evCfg._dispatched) {
        return;
      }
      Object.defineProperties(this, {
        type: {
          enumerable: true,
          configurable: true,
          get() {
            return type;
          }
        },
        bubbles: {
          enumerable: true,
          configurable: true,
          get() {
            return bubbles;
          }
        },
        cancelable: {
          enumerable: true,
          configurable: true,
          get() {
            return cancelable;
          }
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
    // These attribute getters exist on the prototype only so idlharness-style
    //   interface checks find them there (matching real DOM implementations,
    //   where these are shared prototype accessors, not per-instance ones);
    //   accessing one directly on the prototype itself (rather than a real
    //   instance, which shadows these with the working per-instance getters
    //   set up in the constructor above) throws, same as a real browser's
    //   native accessor would for an unbound `this`. Each throw-stub's `.name`
    //   is set explicitly to `"get " + prop` since `{get () {...}}` -- a
    //   literal `get` key, not `get`-shorthand syntax -- names the function
    //   `"get"`, not `"get " + prop`.
    ['type', 'target', 'currentTarget', 'eventPhase', 'defaultPrevented', 'bubbles', 'cancelable', 'timeStamp', 'composed'].forEach(prop => {
      const get = function () {
        throw new TypeError('Illegal invocation');
      };
      Object.defineProperty(get, 'name', {
        value: 'get ' + prop,
        configurable: true
      });
      Object.defineProperty(ShimEvent.prototype, prop, {
        enumerable: true,
        configurable: true,
        get
      });
    });
    {
      const get = function () {
        throw new TypeError('Illegal invocation');
      };
      // Setters are always spec'd with one formal parameter, so `.length`
      //   must be 1 even though this throws unconditionally.
      /**
       * @param {boolean} _val
       */
      // eslint-disable-next-line no-unused-vars -- Needed for `.length`
      const set = function (_val) {
        throw new TypeError('Illegal invocation');
      };
      Object.defineProperty(get, 'name', {
        value: 'get returnValue',
        configurable: true
      });
      Object.defineProperty(set, 'name', {
        value: 'set returnValue',
        configurable: true
      });
      Object.defineProperty(ShimEvent.prototype, 'returnValue', {
        enumerable: true,
        configurable: true,
        get,
        set
      });
    }
    ['NONE', 'CAPTURING_PHASE', 'AT_TARGET', 'BUBBLING_PHASE'].forEach((prop, i) => {
      Object.defineProperty(ShimEvent, prop, {
        enumerable: true,
        writable: false,
        value: i
      });
      Object.defineProperty(ShimEvent.prototype, prop, {
        writable: false,
        value: i
      });
    });
    // @ts-expect-error Not part of the class body itself
    ShimEvent[Symbol.toStringTag] = 'Function';
    ShimEventProto[Symbol.toStringTag] = 'EventPrototype';
    // A real class's own `.prototype` is already non-writable/non-configurable
    //   per spec, so no explicit freeze is needed here.

    /* eslint-disable no-shadow -- Polyfill */
    /**
     * `CustomEvent extends Event` via a real `class`: `super()`'s call into
     *   `Event`'s own constructor already gives this the correct prototype
     *   chain (`CustomEvent.prototype.__proto__ === Event.prototype`) and
     *   `new.target` propagation for any further subclass.
     */
    class CustomEvent extends Event {
      /* eslint-enable no-shadow -- Polyfill */
      /**
       * @param {string} type
       */
      constructor(type) {
        // eslint-disable-next-line prefer-const, prefer-rest-params -- Keep signature
        let [, evInit, _ev] = arguments;
        // @ts-expect-error Casting doesn't work
        super(type, evInit, _ev);
        // eslint-disable-next-line consistent-this -- TS constructors can't use `@this`
        const me = /** @type {EventWithProps} */ /** @type {unknown} */this;
        // @ts-expect-error Symbol not part of the string index signature
        me[Symbol.toStringTag] = 'CustomEvent';
        me.toString = () => {
          return '[object CustomEvent]';
        };
        evInit ||= {};
        // @ts-ignore
        me.initCustomEvent(type, evInit.bubbles, evInit.cancelable, 'detail' in evInit ? evInit.detail : null);
      }
    }
    const ShimCustomEvent = CustomEvent;
    /** @type {any} */
    const ShimCustomEventProto = ShimCustomEvent.prototype;
    /**
     * @param {string} type
     * @param {boolean} [bubbles]
     * @param {boolean} [cancelable]
     * @param {any} [detail]
     * @this {EventWithProps}
     */
    ShimCustomEventProto.initCustomEvent = function initCustomEvent(type, bubbles = false, cancelable = false, detail = null) {
      // WebIDL's optional args (defaulted here) keep `.length` at 1
      if (!(this instanceof ShimCustomEvent)) {
        throw new TypeError('Illegal invocation');
      }
      const _evCfg = getEvCfg(this);
      // @ts-expect-error `detail` isn't part of `EventInit`, only used internally here
      // eslint-disable-next-line prefer-rest-params -- Keep signature
      initEventInternal(this, type, {
        bubbles,
        cancelable,
        detail
      }, arguments[4]);
      if (_evCfg._dispatched) {
        return;
      }
      if (detail !== undefined) {
        _evCfg.detail = detail;
      }
      // `initCustomEvent` deliberately excluded -- see the matching comment
      //   in `initEventInternal` for `initEvent`, above; the same reasoning
      //   applies here.
      definePassthroughProps(this, ['detail'], _evCfg, ev.get(this));
    };
    // @ts-expect-error Not part of the class body itself
    ShimCustomEvent[Symbol.toStringTag] = 'Function';
    ShimCustomEventProto[Symbol.toStringTag] = 'CustomEventPrototype';
    {
      const get = function () {
        throw new TypeError('Illegal invocation');
      };
      Object.defineProperty(get, 'name', {
        value: 'get detail',
        configurable: true
      });
      Object.defineProperty(ShimCustomEvent.prototype, 'detail', {
        enumerable: true,
        configurable: true,
        get
      });
    }
    // A real class's own `.prototype` is already non-writable/non-configurable
    //   per spec, so no explicit freeze is needed here.

    /**
     *
     * @param {EventWithProps} e
     * @returns {EventWithProps}
     */
    function copyEvent(e) {
      const {
        bubbles,
        cancelable,
        detail,
        type
      } = e;
      if ('detail' in e) {
        // @ts-expect-error Casting doesn't work
        return new ShimCustomEvent(type, {
          bubbles,
          cancelable,
          detail
        }, e);
      }
      // @ts-expect-error Casting doesn't work
      return new ShimEvent(type, {
        bubbles,
        cancelable
      }, e);
    }

    /**
     * @typedef {object} ListenerOptions
     * @property {boolean} [once] Remove listener after invoking once
     * @property {boolean} [passive] Don't allow `preventDefault`
     * @property {boolean} [capture] Use `_children` and set `eventPhase`
     * @property {AbortSignal} [signal] Remove the listener when this aborts
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
     * @returns {boolean|void}
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
      let listenersByType = listeners[type];
      if (listenersByType === undefined) {
        listeners[type] = listenersByType = [];
      }
      const opts = typeof options === 'boolean' ? {
        capture: options
      } : options || {};
      const stringifiedOptions = JSON.stringify(opts);
      const listenersByTypeOptions = listenersByType.filter(obj => {
        return stringifiedOptions === JSON.stringify(obj.options);
      });
      return {
        listenersByTypeOptions,
        options: opts,
        listenersByType
      };
    }
    const methods = {
      /**
       * @param {AllListeners} listeners
       * @param {Listener} listener
       * @param {string} type
       * @param {boolean|ListenerOptions} options
       * @returns {void}
       */
      addListener(listeners, listener, type, options) {
        const listenersOptions = getListenersOptions(listeners, type, options);
        const {
          listenersByTypeOptions
        } = listenersOptions;
        ({
          options
        } = listenersOptions);
        const {
          listenersByType
        } = listenersOptions;
        if (listenersByTypeOptions.some(l => {
          return l.listener === listener;
        })) {
          return;
        }
        listenersByType.push({
          listener,
          options
        });
      },
      /**
       * @param {AllListeners} listeners
       * @param {Listener} listener
       * @param {string} type
       * @param {boolean|ListenerOptions} options
       * @returns {void}
       */
      removeListener(listeners, listener, type, options) {
        const listenersOptions = getListenersOptions(listeners, type, options);
        const {
          listenersByType
        } = listenersOptions;
        const stringifiedOptions = JSON.stringify(listenersOptions.options);
        listenersByType.some((l, i) => {
          if (l.listener === listener && stringifiedOptions === JSON.stringify(l.options)) {
            listenersByType.splice(i, 1);
            if (!listenersByType.length) {
              delete listeners[type];
            }
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
      hasListener(listeners, listener, type, options) {
        const listenersOptions = getListenersOptions(listeners, type, options);
        const {
          listenersByTypeOptions
        } = listenersOptions;
        return listenersByTypeOptions.some(l => {
          return l.listener === listener;
        });
      }
    };

    /* eslint-disable no-shadow -- Polyfill */
    /**
     * A real, constructible, subclassable `EventTarget`: `new EventTarget()`
     *   works directly, and so does `class Foo extends EventTarget {}` (its
     *   `super()` call runs this same constructor body, with `new.target` set
     *   to `Foo`, which is all a plain, non-`class` base needs to support
     *   subclassing correctly -- the engine already gives `this` the
     *   subclass's own prototype).
     */
    class EventTarget {
      /* eslint-enable no-shadow -- Polyfill */
      /**
       * Per WebIDL (`constructor();`), this takes no arguments -- declaring a
       *   formal parameter here (even an optional one) would give
       *   `EventTarget.length` the wrong value for idlharness.js's own
       *   "interface object length" check. `EventTargetFactory.createInstance`
       *   (the only place custom, non-standard per-instance options are
       *   actually used) never calls this constructor at all -- it borrows
       *   this class's `.prototype` directly for its own separate function --
       *   so there's no internal caller that needs to pass options through
       *   here either.
       */
      constructor() {
        // eslint-disable-next-line consistent-this -- TS constructors can't use `@this`
        const me = /** @type {EventTargetInstance} */ /** @type {unknown} */this;
        me.__setOptions();
      }
    }

    /**
     * @typedef {"addEarlyEventListener"|"removeEarlyEventListener"|"hasEarlyEventListener"
     *   |"addEventListener"|"removeEventListener"|"hasEventListener"
     *   |"addLateEventListener"|"removeLateEventListener"|"hasLateEventListener"
     *   |"addDefaultEventListener"|"removeDefaultEventListener"|"hasDefaultEventListener"
     * } ListenerName
     */
    Object.assign(EventTarget.prototype, ['Early', '', 'Late', 'Default'].reduce(function (/** @type {{[key: string]: Function}} */
    obj, listenerType) {
      ['add', 'remove', 'has'].forEach(function (method) {
        const mainMethod = /** @type {ListenerName} */method + listenerType + 'EventListener';
        /**
         * @param {string} type
         * @param {Listener|{handleEvent: Listener}} listener
         * @this {EventTargetInstance}
         * @returns {boolean|void}
         */
        obj[mainMethod] = function (type, listener) {
          if (!(this instanceof EventTarget)) {
            throw new TypeError('Illegal invocation');
          }
          if (arguments.length < 2) {
            throw new TypeError('2 or more arguments required');
          }
          if (typeof type !== 'string') {
            // @ts-expect-error It's ok to construct
            throw new ShimDOMException('UNSPECIFIED_EVENT_TYPE_ERR', 'UNSPECIFIED_EVENT_TYPE_ERR');
          }
          // eslint-disable-next-line prefer-rest-params -- Keep signature
          const options = arguments[2]; // We keep the listener `length` as per WebIDL
          try {
            // `listener` is nullable per WebIDL (`EventListener?`), and
            //   the `in` operator throws for a `null`/non-object RHS,
            //   so only look for `handleEvent` on an actual object.
            // As per code such as the following, handleEvent may throw,
            //  but is uncaught
            // https://github.com/web-platform-tests/wpt/blob/master/IndexedDB/fire-error-event-exception.html#L54-L56
            if (listener && typeof listener === 'object' && 'handleEvent' in listener && listener.handleEvent.bind) {
              listener = listener.handleEvent.bind(listener);
            }
          } catch (err) {
            // eslint-disable-next-line no-console -- Feedback to user
            console.log('Uncaught `handleEvent` error', err);
          }
          const arrStr = /** @type {"_earlyListeners"|"_listeners"|"_lateListeners"|"_defaultListeners"} */
          '_' + listenerType.toLowerCase() + (listenerType === '' ? 'l' : 'L') + 'isteners';
          if (!Object.hasOwn(this, arrStr)) {
            Object.defineProperty(this, arrStr, {
              value: {}
            });
          }
          const meth = /** @type {"addListener"|"removeListener"|"hasListener"} */
          method + 'Listener';
          if (method === 'add' && options && typeof options === 'object' && options.signal) {
            const {
              signal
            } = options;
            if (signal.aborted) {
              return undefined;
            }
            const removeMethod = /** @type {"removeEventListener"|"removeEarlyEventListener"|"removeLateEventListener"|"removeDefaultEventListener"} */
            'remove' + listenerType + 'EventListener';
            signal.addEventListener('abort', () => {
              this[removeMethod](type, listener, options);
            }, {
              once: true
            });
          }
          return methods[meth](/** @type {AllListeners} */this[arrStr], /** @type {Listener} */listener, type, options);
        };
        // Assigned via a computed (`obj[mainMethod] = ...`) member
        // expression, so per spec it never gets an inferred `.name` --
        // matters for idlharness.js's "property has wrong .name" checks on
        // e.g. `addEventListener`/`removeEventListener`.
        Object.defineProperty(obj[mainMethod], 'name', {
          value: mainMethod,
          configurable: true
        });
      });
      return obj;
    }, {}));
    Object.assign(EventTarget.prototype, {
      _legacyOutputDidListenersThrowCheck: undefined,
      /**
       * @param {CustomOptions} [customOptions]
       * @this {EventTargetInstance}
       * @returns {void}
       */
      __setOptions(customOptions) {
        customOptions ||= {};
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
       * @param {EventWithProps} e
       * @this {EventTargetInstance & {
       *   _dispatchEvent: (e: EventWithProps, setTarget: boolean) => boolean,
       * }}
       * @returns {boolean}
       */
      dispatchEvent(e) {
        return this._dispatchEvent(e, true);
      },
      /**
       * @param {EventWithProps} e
       * @param {boolean} setTarget
       * @this {EventTargetInstance}
       * @returns {boolean}
       */
      _dispatchEvent(e, setTarget) {
        ['early', '', 'late', 'default'].forEach(listenerType => {
          const arrStr = /** @type {"_earlyListeners"|"_listeners"|"_lateListeners"|"_defaultListeners"} */
          '_' + listenerType + (listenerType === '' ? 'l' : 'L') + 'isteners';
          if (!Object.hasOwn(this, arrStr)) {
            Object.defineProperty(this, arrStr, {
              value: {}
            });
          }
        });
        let _evCfg = evCfg.get(e);
        if (_evCfg && setTarget && _evCfg._dispatched) {
          // @ts-expect-error It's ok to construct
          throw new ShimDOMException('The object is in an invalid state.', 'InvalidStateError');
        }

        /** @type {EventWithProps} */
        let eventCopy;
        if (_evCfg) {
          eventCopy = e;
        } else {
          eventCopy = copyEvent(e);
          _evCfg = getEvCfg(eventCopy);
          _evCfg._dispatched = true;

          /** @type {string[]} */
          this._extraProperties.forEach(prop => {
            if (Reflect.has(e, prop)) {
              /** @type {{[key: string]: any}} */eventCopy[prop] = /** @type {{[key: string]: any}} */e[prop]; // Todo: Put internal to `ShimEvent`?
            }
          });
        }
        const {
          type: rawType
        } = eventCopy;
        const type = /** @type {string} */rawType;
        const cfg = getEvCfg(eventCopy);

        /**
         * @returns {EventTargetInstance}
         */
        function getTarget() {
          return /** @type {EventTargetInstance} */eventCopy.target;
        }

        /**
         *
         * @returns {void}
         */
        function finishEventDispatch() {
          cfg.eventPhase = phases.NONE;
          cfg.currentTarget = null;
          cfg._dispatchFlag = false;
          delete cfg._children;
        }
        /**
         *
         * @returns {void}
         */
        function invokeDefaults() {
          // Ignore stopPropagation from defaults
          cfg._stopImmediatePropagation = undefined;
          cfg._stopPropagation = undefined;
          // We check here for whether we should invoke since may have changed since timeout (if late listener prevented default)
          if (!eventCopy.defaultPrevented || !cfg.cancelable) {
            // 2nd check should be redundant
            cfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke default listeners
            getTarget().invokeCurrentListeners(/** @type {AllListeners} */getTarget()._defaultListeners, eventCopy, type);
          }
          finishEventDispatch();
        }
        const continueEventDispatch = () => {
          // Ignore stop propagation of user now
          cfg._stopImmediatePropagation = undefined;
          cfg._stopPropagation = undefined;
          if (!this._defaultSync) {
            setTimeout(invokeDefaults, 0);
          } else {
            invokeDefaults();
          }
          cfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke late listeners
          // Sync default might have stopped
          if (!cfg._stopPropagation) {
            cfg._stopImmediatePropagation = undefined;
            cfg._stopPropagation = undefined;
            // We could allow stopPropagation by only executing upon (cfg._stopPropagation)
            getTarget().invokeCurrentListeners(/** @type {AllListeners} */getTarget()._lateListeners, eventCopy, type);
          }
          finishEventDispatch();
          return !eventCopy.defaultPrevented;
        };
        if (setTarget) {
          cfg.target = this;
        }
        switch ('eventPhase' in eventCopy && eventCopy.eventPhase) {
          case phases.CAPTURING_PHASE:
            {
              if (cfg._stopPropagation) {
                return continueEventDispatch();
              }
              this.invokeCurrentListeners(/** @type {AllListeners} */this._listeners, eventCopy, type);
              const child = cfg._children && cfg._children.length && cfg._children.pop();
              if (!child || child === eventCopy.target) {
                cfg.eventPhase = phases.AT_TARGET;
              }
              if (child) {
                child._defaultSync = this._defaultSync;
              }
              return (child || this)._dispatchEvent(eventCopy, false);
            }
          case phases.AT_TARGET:
            if (cfg._stopPropagation) {
              return continueEventDispatch();
            }
            this.invokeCurrentListeners(/** @type {AllListeners} */this._listeners, eventCopy, type, true);
            if (!cfg.bubbles) {
              return continueEventDispatch();
            }
            cfg.eventPhase = phases.BUBBLING_PHASE;
            return this._dispatchEvent(eventCopy, false);
          case phases.BUBBLING_PHASE:
            {
              if (cfg._stopPropagation) {
                return continueEventDispatch();
              }
              const parent = this.__getParent && this.__getParent();
              if (!parent) {
                return continueEventDispatch();
              }
              parent.invokeCurrentListeners(/** @type {AllListeners} */parent._listeners, eventCopy, type, true);
              parent._defaultSync = this._defaultSync;
              return parent._dispatchEvent(eventCopy, false);
            }
          case phases.NONE:
          default:
            {
              // The full target-to-root path, computed once up front (used
              //   by `composedPath()`) -- kept separate from `cfg._children`
              //   below, which is consumed as a stack while walking back
              //   down during the capturing phase.
              /* eslint-disable consistent-this -- Readability */
              /** @type {EventTargetInstance[]} */
              const path = [this];
              /** @type {EventTargetInstance|null} */
              let pathNode = this;
              /* eslint-enable consistent-this -- Readability */
              while (pathNode.__getParent && (pathNode = pathNode.__getParent()) !== null) {
                path.push(pathNode);
              }
              cfg._path = path;
              cfg._dispatchFlag = true;
              cfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke early listeners
              this.invokeCurrentListeners(/** @type {AllListeners} */this._earlyListeners, eventCopy, type);
              if (!('__getParent' in this)) {
                cfg.eventPhase = phases.AT_TARGET;
                return this._dispatchEvent(eventCopy, false);
              }

              /* eslint-disable consistent-this -- Readability */
              /** @type {EventTargetInstance|null} */
              let par = this;
              let root_ = this;
              /* eslint-enable consistent-this -- Readability */
              while (par.__getParent && (par = par.__getParent()) !== null) {
                if (!cfg._children) {
                  cfg._children = [];
                }
                cfg._children.push(root_);
                root_ = par;
              }
              root_._defaultSync = this._defaultSync;
              cfg.eventPhase = phases.CAPTURING_PHASE;
              return root_._dispatchEvent(eventCopy, false);
            }
        }
      },
      /**
       * @param {AllListeners} listeners
       * @param {EventWithProps} eventCopy
       * @param {string} type
       * @param {boolean} [checkOnListeners]
       * @this {EventTargetInstance}
       * @returns {boolean}
       */
      invokeCurrentListeners(listeners, eventCopy, type, checkOnListeners) {
        const _evCfg = getEvCfg(eventCopy);
        _evCfg.currentTarget = this;
        const listOpts = getListenersOptions(listeners, type, {});
        // eslint-disable-next-line unicorn/prefer-spread -- Performance?
        const listenersByType = listOpts.listenersByType.concat();
        const dummyIPos = listenersByType.length ? 1 : 0;

        // eslint-disable-next-line unicorn/no-unused-array-method-return -- Shortcircuiting
        listenersByType.some((listenerObj, i) => {
          if (_evCfg._stopImmediatePropagation) {
            return true;
          }
          const onListener = checkOnListeners ? this['on' + type] : null;
          if (i === dummyIPos && typeof onListener === 'function') {
            // We don't splice this in as could be overwritten; executes here per
            //    https://html.spec.whatwg.org/multipage/webappapis.html#event-handler-attributes:event-handlers-14
            this.tryCatch(eventCopy, () => {
              const ret = onListener.call(eventCopy.currentTarget, eventCopy);
              if (ret === false) {
                /** @type {() => void} */eventCopy.preventDefault();
              }
            });
          }
          const {
            options
          } = listenerObj;
          const {
            once,
            passive,
            capture
          } = options;
          _evCfg._passive = passive;
          if (capture && eventCopy.target !== eventCopy.currentTarget && eventCopy.eventPhase === phases.CAPTURING_PHASE || eventCopy.eventPhase === phases.AT_TARGET || !capture && eventCopy.target !== eventCopy.currentTarget && eventCopy.eventPhase === phases.BUBBLING_PHASE) {
            const {
              listener
            } = listenerObj;
            this.tryCatch(eventCopy, () => {
              listener.call(eventCopy.currentTarget, eventCopy);
            });
            if (once) {
              this.removeEventListener(type, listener, options);
            }
          }
          return false;
        });
        this.tryCatch(eventCopy, () => {
          const onListener = checkOnListeners ? this['on' + type] : null;
          if (typeof onListener === 'function' && listenersByType.length < 2) {
            const ret = onListener.call(eventCopy.currentTarget, eventCopy); // Won't have executed if too short
            if (ret === false) {
              /** @type {() => void} */eventCopy.preventDefault();
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
      tryCatch(evt, cb) {
        /* eslint-enable promise/prefer-await-to-callbacks -- Try-catch */
        try {
          // Per MDN: Exceptions thrown by event handlers are reported
          //    as uncaught exceptions; the event handlers run on a nested
          //    callstack: they block the caller until they complete, but
          //    exceptions do not propagate to the caller.
          // eslint-disable-next-line promise/prefer-await-to-callbacks --  Try-catch
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
      triggerErrorEvent(err, evt) {
        const error = typeof err === 'string' ? new Error('Uncaught exception: ' + err) : err;
        let triggerGlobalErrorEvent;
        let useNodeImpl = false;
        if (typeof window === 'undefined' || typeof ErrorEvent === 'undefined' || window && typeof window === 'object' && !window.dispatchEvent) {
          useNodeImpl = true;
          triggerGlobalErrorEvent = () => {
            setTimeout(() => {
              // Node won't be able to catch in this way if we throw in the main thread
              // console.log(err); // Should we auto-log for user?
              throw error; // Let user listen to `process.on('uncaughtException', (err) => {});`
            }, 0);
          };
        } else {
          triggerGlobalErrorEvent = () => {
            // See https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
            //     and https://github.com/w3c/IndexedDB/issues/49

            // Note that a regular Event will properly trigger
            //     `window.addEventListener('error')` handlers, but it will not trigger
            //     `window.onerror` as per https://html.spec.whatwg.org/multipage/webappapis.html#handler-onerror
            // Note also that the following line won't handle `window.addEventListener` handlers
            //        if (window.onerror) window.onerror(error.message, err.fileName, err.lineNumber, error.columnNumber, error);

            // `ErrorEvent` properly triggers `window.onerror` and `window.addEventListener('error')` handlers
            const errEv = new ErrorEvent('error', {
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
        if (!useNodeImpl || !this._legacyOutputDidListenersThrowCheck) {
          triggerGlobalErrorEvent();
        }

        // See https://dom.spec.whatwg.org/#concept-event-listener-inner-invoke and
        //    https://github.com/w3c/IndexedDB/issues/140 (also https://github.com/w3c/IndexedDB/issues/49 )
        if (this._legacyOutputDidListenersThrowCheck) {
          evt.__legacyOutputDidListenersThrowError = error;
        }
      }
    });
    // @ts-expect-error Not part of the class body itself
    EventTarget.prototype[Symbol.toStringTag] = 'EventTargetPrototype';
    // A real class's own `.prototype` is already non-writable/non-configurable
    //   per spec, so no explicit freeze is needed here (unlike `ShimEvent`/
    //   `ShimCustomEvent`, which remain plain functions for now).

    const ShimEventTarget = EventTarget;
    const EventTargetFactory = {
      /**
       * @param {CustomOptions} [customOptions]
       * @returns {EventTarget}
       */
      createInstance(customOptions) {
        /* eslint-disable func-name-matching -- Shim vs. Polyfill */
        /* eslint-disable no-shadow -- Polyfill */
        /**
         * @class
         * @this {EventTargetInstance}
         */
        const ET = function EventTarget() {
          /* eslint-enable no-shadow -- Polyfill */
          /* eslint-enable func-name-matching -- Shim vs. Polyfill */
          this.__setOptions(customOptions);
        };
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

    exports.EventTargetFactory = EventTargetFactory;
    exports.ShimCustomEvent = ShimCustomEvent;
    exports.ShimDOMException = ShimDOMException;
    exports.ShimEvent = ShimEvent;
    exports.ShimEventTarget = EventTarget;

}));
