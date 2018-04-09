(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

let ShimDOMException;
const phases = {
    NONE: 0,
    CAPTURING_PHASE: 1,
    AT_TARGET: 2,
    BUBBLING_PHASE: 3
};

if (typeof DOMException === 'undefined') {
    // Todo: Better polyfill (if even needed here)
    ShimDOMException = function DOMException (msg, name) { // No need for `toString` as same as for `Error`
        const err = new Error(msg);
        err.name = name;
        return err;
    };
} else {
    ShimDOMException = DOMException;
}

const ev = new WeakMap();
const evCfg = new WeakMap();

// Todo: Set _ev argument outside of this function
/**
* We use an adapter class rather than a proxy not only for compatibility but also since we have to clone
* native event properties anyways in order to properly set `target`, etc.
* @note The regular DOM method `dispatchEvent` won't work with this polyfill as it expects a native event
*/
const ShimEvent = function Event (type) { // eslint-disable-line no-native-reassign
    // For WebIDL checks of function's `length`, we check `arguments` for the optional arguments
    this[Symbol.toStringTag] = 'Event';
    this.toString = () => {
        return '[object Event]';
    };
    let evInit = arguments[1];
    let _ev = arguments[2];
    if (!arguments.length) {
        throw new TypeError("Failed to construct 'Event': 1 argument required, but only 0 present.");
    }
    evInit = evInit || {};
    _ev = _ev || {};

    const _evCfg = {};
    if ('composed' in evInit) {
        _evCfg.composed = evInit.composed;
    }

    // _evCfg.isTrusted = true; // We are not always using this for user-created events
    // _evCfg.timeStamp = new Date().valueOf(); // This is no longer a timestamp, but monotonic (elapsed?)

    ev.set(this, _ev);
    evCfg.set(this, _evCfg);
    this.initEvent(type, evInit.bubbles, evInit.cancelable);
    Object.defineProperties(this,
        ['target', 'currentTarget', 'eventPhase', 'defaultPrevented'].reduce((obj, prop) => {
            obj[prop] = {
                get () {
                    return (/* prop in _evCfg && */ _evCfg[prop] !== undefined) ? _evCfg[prop] : (
                        prop in _ev ? _ev[prop] : (
                            // Defaults
                            prop === 'eventPhase' ? 0 : (prop === 'defaultPrevented' ? false : null)
                        )
                    );
                }
            };
            return obj;
        }, {})
    );
    const props = [
        // Event
        'type',
        'bubbles', 'cancelable', // Defaults to false
        'isTrusted', 'timeStamp',
        'initEvent',
        // Other event properties (not used by our code)
        'composedPath', 'composed'
    ];
    if (this.toString() === '[object CustomEvent]') {
        props.push('detail', 'initCustomEvent');
    }

    Object.defineProperties(this, props.reduce((obj, prop) => {
        obj[prop] = {
            get () {
                return prop in _evCfg ? _evCfg[prop] : (prop in _ev ? _ev[prop] : (
                    ['bubbles', 'cancelable', 'composed'].includes(prop) ? false : undefined
                ));
            }
        };
        return obj;
    }, {}));
};

ShimEvent.prototype.preventDefault = function () {
    if (!(this instanceof ShimEvent)) {
        throw new TypeError('Illegal invocation');
    }
    const _ev = ev.get(this);
    const _evCfg = evCfg.get(this);
    if (this.cancelable && !_evCfg._passive) {
        _evCfg.defaultPrevented = true;
        if (typeof _ev.preventDefault === 'function') { // Prevent any predefined defaults
            _ev.preventDefault();
        }
    }
};
ShimEvent.prototype.stopImmediatePropagation = function () {
    const _evCfg = evCfg.get(this);
    _evCfg._stopImmediatePropagation = true;
};
ShimEvent.prototype.stopPropagation = function () {
    const _evCfg = evCfg.get(this);
    _evCfg._stopPropagation = true;
};
ShimEvent.prototype.initEvent = function (type, bubbles, cancelable) { // Chrome currently has function length 1 only but WebIDL says 3
    // const bubbles = arguments[1];
    // const cancelable = arguments[2];
    const _evCfg = evCfg.get(this);

    if (_evCfg._dispatched) {
        return;
    }

    _evCfg.type = type;
    if (bubbles !== undefined) {
        _evCfg.bubbles = bubbles;
    }
    if (cancelable !== undefined) {
        _evCfg.cancelable = cancelable;
    }
};
['type', 'target', 'currentTarget'].forEach((prop) => {
    Object.defineProperty(ShimEvent.prototype, prop, {
        enumerable: true,
        configurable: true,
        get () {
            throw new TypeError('Illegal invocation');
        }
    });
});
['eventPhase', 'defaultPrevented', 'bubbles', 'cancelable', 'timeStamp'].forEach((prop) => {
    Object.defineProperty(ShimEvent.prototype, prop, {
        enumerable: true,
        configurable: true,
        get () {
            throw new TypeError('Illegal invocation');
        }
    });
});
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
ShimEvent[Symbol.toStringTag] = 'Function';
ShimEvent.prototype[Symbol.toStringTag] = 'EventPrototype';
Object.defineProperty(ShimEvent, 'prototype', {
    writable: false
});

const ShimCustomEvent = function CustomEvent (type) {
    let evInit = arguments[1];
    const _ev = arguments[2];
    ShimEvent.call(this, type, evInit, _ev);
    this[Symbol.toStringTag] = 'CustomEvent';
    this.toString = () => {
        return '[object CustomEvent]';
    };
    // var _evCfg = evCfg.get(this);
    evInit = evInit || {};
    this.initCustomEvent(
        type,
        evInit.bubbles,
        evInit.cancelable,
        'detail' in evInit ? evInit.detail : null
    );
};
Object.defineProperty(ShimCustomEvent.prototype, 'constructor', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: ShimCustomEvent
});
ShimCustomEvent.prototype.initCustomEvent = function (type, bubbles, cancelable, detail) {
    if (!(this instanceof ShimCustomEvent)) {
        throw new TypeError('Illegal invocation');
    }
    const _evCfg = evCfg.get(this);
    ShimCustomEvent.call(this, type, {
        bubbles: bubbles, cancelable: cancelable, detail: detail
    }, arguments[4]);

    if (_evCfg._dispatched) {
        return;
    }

    if (detail !== undefined) {
        _evCfg.detail = detail;
    }
    Object.defineProperty(this, 'detail', {
        get () {
            return _evCfg.detail;
        }
    });
};
ShimCustomEvent[Symbol.toStringTag] = 'Function';
ShimCustomEvent.prototype[Symbol.toStringTag] = 'CustomEventPrototype';

Object.defineProperty(ShimCustomEvent.prototype, 'detail', {
    enumerable: true,
    configurable: true,
    get () {
        throw new TypeError('Illegal invocation');
    }
});
Object.defineProperty(ShimCustomEvent, 'prototype', {
    writable: false
});

function copyEvent (ev) {
    if ('detail' in ev) {
        return new ShimCustomEvent(
            ev.type, {bubbles: ev.bubbles, cancelable: ev.cancelable, detail: ev.detail}, ev
        );
    }
    return new ShimEvent(ev.type, {bubbles: ev.bubbles, cancelable: ev.cancelable}, ev);
}

function getListenersOptions (listeners, type, options) {
    let listenersByType = listeners[type];
    if (listenersByType === undefined) listeners[type] = listenersByType = [];
    options = typeof options === 'boolean' ? {capture: options} : (options || {});
    const stringifiedOptions = JSON.stringify(options);
    const listenersByTypeOptions = listenersByType.filter((obj) => {
        return stringifiedOptions === JSON.stringify(obj.options);
    });
    return {listenersByTypeOptions: listenersByTypeOptions, options: options, listenersByType: listenersByType};
}

const methods = {
    addListener (listeners, listener, type, options) {
        const listenerOptions = getListenersOptions(listeners, type, options);
        const listenersByTypeOptions = listenerOptions.listenersByTypeOptions;
        options = listenerOptions.options;
        const listenersByType = listenerOptions.listenersByType;

        if (listenersByTypeOptions.some((l) => {
            return l.listener === listener;
        })) return;
        listenersByType.push({listener: listener, options: options});
    },

    removeListener (listeners, listener, type, options) {
        const listenerOptions = getListenersOptions(listeners, type, options);
        const listenersByType = listenerOptions.listenersByType;
        const stringifiedOptions = JSON.stringify(listenerOptions.options);

        listenersByType.some((l, i) => {
            if (l.listener === listener && stringifiedOptions === JSON.stringify(l.options)) {
                listenersByType.splice(i, 1);
                if (!listenersByType.length) delete listeners[type];
                return true;
            }
        });
    },

    hasListener (listeners, listener, type, options) {
        const listenerOptions = getListenersOptions(listeners, type, options);
        const listenersByTypeOptions = listenerOptions.listenersByTypeOptions;
        return listenersByTypeOptions.some((l) => {
            return l.listener === listener;
        });
    }
};

function EventTarget$1 () {
    throw new TypeError('Illegal constructor');
}

Object.assign(EventTarget$1.prototype, ['Early', '', 'Late', 'Default'].reduce(function (obj, listenerType) {
    ['add', 'remove', 'has'].forEach(function (method) {
        obj[method + listenerType + 'EventListener'] = function (type, listener) {
            const options = arguments[2]; // We keep the listener `length` as per WebIDL
            if (arguments.length < 2) throw new TypeError('2 or more arguments required');
            if (typeof type !== 'string') {
                throw new ShimDOMException('UNSPECIFIED_EVENT_TYPE_ERR', 'UNSPECIFIED_EVENT_TYPE_ERR');
            }
            if (listener.handleEvent) { listener = listener.handleEvent.bind(listener); }
            const arrStr = '_' + listenerType.toLowerCase() + (listenerType === '' ? 'l' : 'L') + 'isteners';
            if (!this[arrStr]) {
                Object.defineProperty(this, arrStr, {value: {}});
            }
            return methods[method + 'Listener'](this[arrStr], listener, type, options);
        };
    });
    return obj;
}, {}));

Object.assign(EventTarget$1.prototype, {
    __setOptions (customOptions) {
        customOptions = customOptions || {};
        // Todo: Make into event properties?
        this._defaultSync = customOptions.defaultSync;
        this._extraProperties = customOptions.extraProperties || [];
        if (customOptions.legacyOutputDidListenersThrowFlag) { // IndexedDB
            this._legacyOutputDidListenersThrowCheck = true;
            this._extraProperties.push('__legacyOutputDidListenersThrowError');
        }
    },
    dispatchEvent (ev) {
        return this._dispatchEvent(ev, true);
    },
    _dispatchEvent (ev, setTarget) {
        ['early', '', 'late', 'default'].forEach((listenerType) => {
            const arrStr = '_' + listenerType + (listenerType === '' ? 'l' : 'L') + 'isteners';
            if (!this[arrStr]) {
                Object.defineProperty(this, arrStr, {value: {}});
            }
        });

        let _evCfg = evCfg.get(ev);
        if (_evCfg && setTarget && _evCfg._dispatched) {
            throw new ShimDOMException('The object is in an invalid state.', 'InvalidStateError');
        }

        let eventCopy;
        if (_evCfg) {
            eventCopy = ev;
        } else {
            eventCopy = copyEvent(ev);
            _evCfg = evCfg.get(eventCopy);
            _evCfg._dispatched = true;
            this._extraProperties.forEach((prop) => {
                if (prop in ev) {
                    eventCopy[prop] = ev[prop]; // Todo: Put internal to `ShimEvent`?
                }
            });
        }
        const {type} = eventCopy;

        function finishEventDispatch () {
            _evCfg.eventPhase = phases.NONE;
            _evCfg.currentTarget = null;
            delete _evCfg._children;
        }
        function invokeDefaults () {
            // Ignore stopPropagation from defaults
            _evCfg._stopImmediatePropagation = undefined;
            _evCfg._stopPropagation = undefined;
            // We check here for whether we should invoke since may have changed since timeout (if late listener prevented default)
            if (!eventCopy.defaultPrevented || !_evCfg.cancelable) { // 2nd check should be redundant
                _evCfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke default listeners
                eventCopy.target.invokeCurrentListeners(eventCopy.target._defaultListeners, eventCopy, type);
            }
            finishEventDispatch();
        }
        const continueEventDispatch = () => {
            // Ignore stop propagation of user now
            _evCfg._stopImmediatePropagation = undefined;
            _evCfg._stopPropagation = undefined;
            if (!this._defaultSync) {
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

        switch (eventCopy.eventPhase) {
        default: case phases.NONE:

            _evCfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke early listeners
            this.invokeCurrentListeners(this._earlyListeners, eventCopy, type);
            if (!this.__getParent) {
                _evCfg.eventPhase = phases.AT_TARGET;
                return this._dispatchEvent(eventCopy, false);
            }

            let par = this;
            let root = this;
            while (par.__getParent && (par = par.__getParent()) !== null) {
                if (!_evCfg._children) {
                    _evCfg._children = [];
                }
                _evCfg._children.push(root);
                root = par;
            }
            root._defaultSync = this._defaultSync;
            _evCfg.eventPhase = phases.CAPTURING_PHASE;
            return root._dispatchEvent(eventCopy, false);
        case phases.CAPTURING_PHASE:
            if (_evCfg._stopPropagation) {
                return continueEventDispatch();
            }
            this.invokeCurrentListeners(this._listeners, eventCopy, type);
            const child = _evCfg._children && _evCfg._children.length && _evCfg._children.pop();
            if (!child || child === eventCopy.target) {
                _evCfg.eventPhase = phases.AT_TARGET;
            }
            if (child) child._defaultSync = this._defaultSync;
            return (child || this)._dispatchEvent(eventCopy, false);
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
            if (_evCfg._stopPropagation) {
                return continueEventDispatch();
            }
            const parent = this.__getParent && this.__getParent();
            if (!parent) {
                return continueEventDispatch();
            }
            parent.invokeCurrentListeners(parent._listeners, eventCopy, type, true);
            parent._defaultSync = this._defaultSync;
            return parent._dispatchEvent(eventCopy, false);
        }
    },
    invokeCurrentListeners (listeners, eventCopy, type, checkOnListeners) {
        const _evCfg = evCfg.get(eventCopy);
        _evCfg.currentTarget = this;

        const listOpts = getListenersOptions(listeners, type, {});
        const listenersByType = listOpts.listenersByType.concat();
        const dummyIPos = listenersByType.length ? 1 : 0;

        listenersByType.some((listenerObj, i) => {
            const onListener = checkOnListeners ? this['on' + type] : null;
            if (_evCfg._stopImmediatePropagation) return true;
            if (i === dummyIPos && typeof onListener === 'function') {
                // We don't splice this in as could be overwritten; executes here per
                //    https://html.spec.whatwg.org/multipage/webappapis.html#event-handler-attributes:event-handlers-14
                this.tryCatch(eventCopy, () => {
                    const ret = onListener.call(eventCopy.currentTarget, eventCopy);
                    if (ret === false) {
                        eventCopy.preventDefault();
                    }
                });
            }
            const options = listenerObj.options;
            const {
                once, // Remove listener after invoking once
                passive, // Don't allow `preventDefault`
                capture // Use `_children` and set `eventPhase`
            } = options;

            _evCfg._passive = passive;

            if ((capture && eventCopy.target !== eventCopy.currentTarget && eventCopy.eventPhase === phases.CAPTURING_PHASE) ||
                (eventCopy.eventPhase === phases.AT_TARGET ||
                (!capture && eventCopy.target !== eventCopy.currentTarget && eventCopy.eventPhase === phases.BUBBLING_PHASE))
            ) {
                const listener = listenerObj.listener;
                this.tryCatch(eventCopy, () => {
                    listener.call(eventCopy.currentTarget, eventCopy);
                });
                if (once) {
                    this.removeEventListener(type, listener, options);
                }
            }
        });
        this.tryCatch(eventCopy, () => {
            const onListener = checkOnListeners ? this['on' + type] : null;
            if (typeof onListener === 'function' && listenersByType.length < 2) {
                const ret = onListener.call(eventCopy.currentTarget, eventCopy); // Won't have executed if too short
                if (ret === false) {
                    eventCopy.preventDefault();
                }
            }
        });

        return !eventCopy.defaultPrevented;
    },
    tryCatch (ev, cb) {
        try {
            // Per MDN: Exceptions thrown by event handlers are reported
            //    as uncaught exceptions; the event handlers run on a nested
            //    callstack: they block the caller until they complete, but
            //    exceptions do not propagate to the caller.
            cb();
        } catch (err) {
            this.triggerErrorEvent(err, ev);
        }
    },
    triggerErrorEvent (err, ev) {
        let error = err;
        if (typeof err === 'string') {
            error = new Error('Uncaught exception: ' + err);
        }

        let triggerGlobalErrorEvent;
        let useNodeImpl = false;
        if (typeof window === 'undefined' || typeof ErrorEvent === 'undefined' || (
            window && typeof window === 'object' && !window.dispatchEvent
        )) {
            useNodeImpl = true;
            triggerGlobalErrorEvent = () => {
                setTimeout(() => { // Node won't be able to catch in this way if we throw in the main thread
                    // console.log(err); // Should we auto-log for user?
                    throw error; // Let user listen to `process.on('uncaughtException', (err) => {});`
                });
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
                    message: error.message || '',
                    // We can't get the actually useful user's values!
                    filename: error.fileName || '',
                    lineno: error.lineNumber || 0,
                    colno: error.columnNumber || 0
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
            ev.__legacyOutputDidListenersThrowError = error;
        }
    }
});
EventTarget$1.prototype[Symbol.toStringTag] = 'EventTargetPrototype';

Object.defineProperty(EventTarget$1, 'prototype', {
    writable: false
});

const ShimEventTarget = EventTarget$1;
const EventTargetFactory = {
    createInstance (customOptions) {
        function EventTarget () {
            this.__setOptions(customOptions);
        }
        EventTarget.prototype = ShimEventTarget.prototype;
        return new EventTarget();
    }
};

EventTarget$1.ShimEvent = ShimEvent;
EventTarget$1.ShimCustomEvent = ShimCustomEvent;
EventTarget$1.ShimDOMException = ShimDOMException;
EventTarget$1.ShimEventTarget = EventTarget$1;
EventTarget$1.EventTargetFactory = EventTargetFactory;

/* globals expect */
/* eslint-env node, mocha */
/* eslint-disable no-unused-expressions */
let testTypesArr;
if (typeof Event !== 'undefined') {
    testTypesArr = ['polyfill', 'nativeEvent'];
} else {
    testTypesArr = ['polyfill'];
}
const EventTarget = EventTarget$1;

testTypesArr.forEach(function (evClass) {
    function newEvent (type, evInit) {
        return (evClass === 'nativeEvent'
            ? new Event(type, evInit) // This event will either be the native or, for Node, our exported shim
            : new EventTarget.ShimEvent(type, evInit)); // This event will either be the native or, for Node, our exported shim
    }

    function Car () {}
    Car.prototype = EventTarget.EventTargetFactory.createInstance();
    Car.prototype.start = function (init) {
        const ev = newEvent('start', init);
        this.dispatchEvent(ev);
    };
    Car.prototype.fire = function (type, init) {
        const ev = newEvent(type, init);
        this.dispatchEvent(ev);
    };

    let capturedCategories = [];
    let bubbledCategories = [];
    function CategoryTree (name, childCategories) {
        this.name = name;
        this.children = [];
        this.addEventListener('capt', function () {
            capturedCategories.push(name);
        }, true);
        this.addEventListener('bubbl', function () {
            bubbledCategories.push(name);
        });
        (childCategories || []).forEach(function (childCategory) {
            const childTree = new CategoryTree(childCategory[0], childCategory[1]);
            childTree._parent = this;
            this.children.push(childTree);
        }, this);
    }
    CategoryTree.prototype = EventTarget.EventTargetFactory.createInstance();
    CategoryTree.prototype.capture = function () {
        const ev = newEvent('capt', {cancelable: true});
        this.dispatchEvent(ev);
    };
    CategoryTree.prototype.bubble = function () {
        const ev = newEvent('bubbl', {bubbles: true, cancelable: true});
        this.dispatchEvent(ev);
    };
    CategoryTree.prototype.__getParent = function () {
        return this._parent || null;
    };

    describe('EventTarget (' + evClass + ')', function () {
        beforeEach(function () {
            capturedCategories = [];
            bubbledCategories = [];
        });
        describe('addEventListener', function () {
            it('should throw properly with invalid arguments', function () {
                expect(function () {
                    const car = new Car();
                    car.addEventListener('sometype');
                }).to.throw(TypeError, /2 or more arguments required/);
                const car = new Car();
                // DOMException doesn't seem to work with expect().to.throw
                try {
                    car.addEventListener(null, function (event) {});
                } catch (err) {
                    expect(err instanceof (typeof DOMException !== 'undefined' ? DOMException : Error)).to.be.true;
                    expect(err.message).equal('UNSPECIFIED_EVENT_TYPE_ERR');
                }
            });
            it('should allow firing then removal of listener via `once` option', function () {
                const car = new Car();
                const func = function () {};
                expect(car.hasEventListener('start', func, { once: true })).to.be.false;

                car.addEventListener('start', func, {once: true});

                expect(car.hasEventListener('start', func, { once: true })).to.be.true;
                car.start();
                expect(car.hasEventListener('start', func, { once: true })).to.be.false;
            });
            it('should not remove the listener if `once` is not set', function () {
                const car = new Car();
                const func = function () {};
                expect(car.hasEventListener('start', func)).to.be.false;

                car.addEventListener('start', func);

                expect(car.hasEventListener('start', func)).to.be.true;
                car.start();
                expect(car.hasEventListener('start', func)).to.be.true;
            });
            it('should not fire multiple times with a single event dispatch', function () {
                const car = new Car();
                let ct = 0;
                const func = function () {
                    ct++;
                };
                car.addEventListener('start', func);
                car.start();
                expect(ct).equal(1);
            });
            it('should fire multiple times with the same or different events', function () {
                const car = new Car();
                let ct = 0;
                const func = function () {
                    ct++;
                };
                car.addEventListener('start', func);
                car.start();
                car.start({bubbles: true, cancelable: true});
                car.start();
                expect(ct).equal(3);
            });

            it('should add distinct copies if different in type, listener, or options', function () {
                const car = new Car();

                const type1 = 'something1';
                const type2 = 'something2';

                let ct1 = 0;
                let ct2 = 0;
                const func1 = function () {
                    ct1++;
                };
                const func2 = function () {
                    ct2++;
                };

                const options1 = {passive: true};
                const options2 = {passive: false};

                expect(car.hasEventListener(type1, func1)).to.be.false;
                expect(car.hasEventListener(type2, func2)).to.be.false;

                car.addEventListener(type1, func1);
                car.addEventListener(type2, func2);

                expect(car.hasEventListener(type1, func1)).to.be.true;
                expect(car.hasEventListener(type2, func2)).to.be.true;

                car.fire(type1);
                expect(ct1).equal(1);
                expect(ct2).equal(0);

                car.fire(type2);
                expect(ct1).equal(1);
                expect(ct2).equal(1);

                car.addEventListener(type1, func1, options1);
                car.addEventListener(type1, func1, options2);
                car.fire(type1);
                expect(ct1).equal(4);
            });
            it('should not add duplicate copies of the same listener', function () {
                const car = new Car();
                let ct = 0;
                const func = function () {
                    ct++;
                };
                car.addEventListener('start', func);
                car.addEventListener('start', func);
                car.start();
                expect(ct).equal(1);
            });
        });
        describe('removeEventListener', function () {
            it('should throw properly with invalid arguments', function () {
                expect(function () {
                    const car = new Car();
                    car.removeEventListener('sometype');
                }).to.throw(TypeError, /2 or more arguments required/);
                // DOMException doesn't seem to work with expect().to.throw
                const car = new Car();
                try {
                    car.removeEventListener(null, function (event) {});
                } catch (err) {
                    expect(err instanceof (typeof DOMException !== 'undefined' ? DOMException : Error)).to.be.true;
                    expect(err.message).equal('UNSPECIFIED_EVENT_TYPE_ERR');
                }
            });
            it('should successfully remove added listener of same type, options, and listener', function () {
                const car = new Car();
                const func = function () {};

                expect(car.hasEventListener('start', func)).to.be.false;
                car.addEventListener('start', func);
                expect(car.hasEventListener('start', func)).to.be.true;
                car.removeEventListener('start', func);
                expect(car.hasEventListener('start', func)).to.be.false;

                expect(car.hasEventListener('start', func, {once: true})).to.be.false;
                car.addEventListener('start', func, {once: true});
                expect(car.hasEventListener('start', func, {once: true})).to.be.true;
                car.removeEventListener('start', func, {once: true});
                expect(car.hasEventListener('start', func, {once: true})).to.be.false;

                expect(car.hasEventListener('start', func, {capture: true, passive: false})).to.be.false;
                car.addEventListener('start', func, {capture: true, passive: false});
                expect(car.hasEventListener('start', func, {capture: true, passive: false})).to.be.true;
                car.removeEventListener('start', func, {capture: true, passive: false});
                expect(car.hasEventListener('start', func, {capture: true, passive: false})).to.be.false;
            });
            it('should not remove added listener of different type', function () {
                const car = new Car();
                const type1 = 'something1';
                const type2 = 'something2';
                const func1 = function () {};

                expect(car.hasEventListener(type1, func1)).to.be.false;
                expect(car.hasEventListener(type2, func1)).to.be.false;
                car.addEventListener(type1, func1);
                car.addEventListener(type2, func1);
                expect(car.hasEventListener(type1, func1)).to.be.true;
                expect(car.hasEventListener(type2, func1)).to.be.true;
                car.removeEventListener(type2, func1);
                expect(car.hasEventListener(type1, func1)).to.be.true;
                expect(car.hasEventListener(type2, func1)).to.be.false;
            });
            it('should not remove added listener of different listener or options', function () {
                const car = new Car();
                const type1 = 'something1';
                const func1 = function () {};
                const func2 = function () {};
                const options1 = {passive: true};
                const options2 = {passive: false};

                expect(car.hasEventListener(type1, func1)).to.be.false;
                expect(car.hasEventListener(type1, func2)).to.be.false;
                car.addEventListener(type1, func1);
                car.addEventListener(type1, func2);
                expect(car.hasEventListener(type1, func1)).to.be.true;
                expect(car.hasEventListener(type1, func2)).to.be.true;
                car.removeEventListener(type1, func1);
                expect(car.hasEventListener(type1, func1)).to.be.false;
                expect(car.hasEventListener(type1, func2)).to.be.true;

                expect(car.hasEventListener(type1, func1, options1)).to.be.false;
                expect(car.hasEventListener(type1, func1, options2)).to.be.false;
                car.addEventListener(type1, func1, options1);
                car.addEventListener(type1, func1, options2);
                expect(car.hasEventListener(type1, func1, options1)).to.be.true;
                expect(car.hasEventListener(type1, func1, options2)).to.be.true;
                car.removeEventListener(type1, func1, options1);
                expect(car.hasEventListener(type1, func1, options1)).to.be.false;
                expect(car.hasEventListener(type1, func1, options2)).to.be.true;
            });
        });
        describe('dispatchEvent', function () {
            it('should throw properly with invalid arguments', function () {
                const car = new Car();
                try {
                    car.fire();
                } catch (err) {
                    expect(err instanceof TypeError).to.be.true;
                    expect(err.message).equal('Invalid type');
                }
                try {
                    car.fire(5);
                } catch (err) {
                    expect(err instanceof TypeError).to.be.true;
                    expect(err.message).equal('Invalid type');
                }
            });
            it('should throw properly with events dispatched multiple times', function () {
                // DOMException doesn't seem to work with expect().to.throw
                const car = new Car();
                const ev = newEvent('something');
                car.dispatchEvent(ev);
                try {
                    car.dispatchEvent(ev);
                } catch (err) {
                    expect(err instanceof (typeof DOMException !== 'undefined' ? DOMException : Error)).to.be.true;
                    expect(err.name).equal('InvalidStateError');
                }
            });
            it('should get proper event properties and `this` value', function (done) {
                const car = new Car();
                car.addEventListener('start', function (ev) {
                    expect(ev.type).equal('start');

                    expect(ev.target).equal(car);
                    expect(ev.currentTarget).equal(car);

                    expect(ev.NONE).equal(0);
                    expect(ev.CAPTURING_PHASE).equal(1);
                    expect(ev.AT_TARGET).equal(2);
                    expect(ev.BUBBLING_PHASE).equal(3);
                    expect(ev.eventPhase).equal(2);

                    expect(ev.bubbles).equal(false);
                    expect(ev.cancelable).equal(false);
                    expect(ev.defaultPrevented).equal(false);
                    expect(this).equal(car);
                    done();
                });
                car.start();
            });
            it('should get proper bubbles and cancelable event properties when set', function (done) {
                const car = new Car();
                car.addEventListener('start', function (event) {
                    expect(event.bubbles).equal(true);
                    expect(event.cancelable).equal(true);
                    done();
                });
                car.start({bubbles: true, cancelable: true});
            });
            it('should execute multiple listeners of the same type on the same target, regardless of capturing', function () {
                const car = new Car();
                const actual = [];
                const expected = [1, 2, 3];
                car.addEventListener('start', function (event) {
                    actual.push(1);
                });
                car.addEventListener('start', function (event) {
                    actual.push(2);
                });
                car.addEventListener('start', function (event) {
                    actual.push(3);
                }, {capture: true});
                car.start();
                expect(actual).to.deep.equal(expected);
            });
            describe('Propagation (bubbling, capturing, and stopping propagation)', function () {
                it('should allow bubbling events without hierarchical functions and behavior', function (done) {
                    const car = new Car();
                    car.addEventListener('start', function (event) {
                        expect(event.eventPhase).equal(2);
                        done();
                    });
                    car.start({bubbles: true});
                });
                it('should propagate down a capturing chain', function () {
                    const expected = ['root', 'childB', 'grandchildB1'];
                    const catTree = new CategoryTree('root', [
                        ['childA', [['grandchildA1'], ['grandchildA2']]],
                        ['childB', [['grandchildB1'], ['grandchildB2']]]
                    ]);
                    catTree.children[1].children[0].capture(); // 'grandchildB1'
                    expect(capturedCategories).deep.equal(expected);
                });
                it('should capture whether `capture` option stated as boolean or object property', function (done) {
                    const parent = {__getParent: function () { return null; }};
                    const child = {
                        __getParent: function () {
                            return parent;
                        }
                    };
                    Object.setPrototypeOf(parent, EventTarget.EventTargetFactory.createInstance());
                    Object.setPrototypeOf(child, EventTarget.EventTargetFactory.createInstance());
                    let caught1 = false;
                    parent.addEventListener('type1', function () {
                        caught1 = true;
                    }, true);
                    parent.addEventListener('type1', function () {
                        expect(caught1).equal(true);
                        done();
                    }, {capture: true});
                    const ev = newEvent('type1');
                    child.dispatchEvent(ev);
                });
                it('should allow bubbling in order up a parent chain', function () {
                    const expected = ['grandchildB1', 'childB', 'root'];
                    const catTree = new CategoryTree('root', [
                        ['childA', [['grandchildA1'], ['grandchildA2']]],
                        ['childB', [['grandchildB1'], ['grandchildB2']]]
                    ]);
                    catTree.children[1].children[0].bubble(); // 'grandchildB1'
                    expect(bubbledCategories).deep.equal(expected);
                });
                it('should allow stopping immediate propagation', function (done) {
                    const car = new Car();
                    const actual = [];
                    const expected = [1, 2];
                    car.addEventListener('start', function (e) {
                        actual.push(1);
                    });
                    car.addEventListener('start', function (e) {
                        e.stopImmediatePropagation();
                        actual.push(2);
                    }, {capture: true});
                    car.addEventListener('start', function (e) {
                        actual.push(3);
                    });
                    car.addLateEventListener('start', function (e) {
                        expect(actual).to.deep.equal(expected);
                        done();
                    });
                    car.start();
                });
                it('should allow stopping propagation during capture', function (done) {
                    const expected = ['root', 'childB'];
                    const catTree = new CategoryTree('root', [
                        ['childA', [['grandchildA1'], ['grandchildA2']]],
                        ['childB', [['grandchildB1'], ['grandchildB2']]]
                    ]);
                    catTree.children[1].addEventListener('capt', function (e) {
                        e.stopPropagation();
                    }, true);
                    catTree.children[1].children[0].addLateEventListener('capt', function () {
                        expect(capturedCategories).deep.equal(expected);
                        done();
                    }, true);
                    catTree.children[1].children[0].capture(); // 'grandchildB1'
                });
                it('should allow stopping propagation during bubbling', function (done) {
                    const expected = ['grandchildB1', 'childB'];
                    const catTree = new CategoryTree('root', [
                        ['childA', [['grandchildA1'], ['grandchildA2']]],
                        ['childB', [['grandchildB1'], ['grandchildB2']]]
                    ]);
                    catTree.children[1].addEventListener('bubbl', function (e) {
                        e.stopPropagation();
                    });
                    catTree.children[1].children[0].addLateEventListener('bubbl', function () {
                        expect(bubbledCategories).deep.equal(expected);
                        done();
                    });
                    catTree.children[1].children[0].bubble(); // 'grandchildB1'
                });
                it('should get proper target, currentTarget, and eventPhase event properties when set', function (done) {
                    const grandparent = {__getParent: function () { return null; }};
                    const parent = {__getParent: function () { return grandparent; }};
                    const child = {
                        __getParent: function () {
                            return parent;
                        }
                    };
                    let caught1 = false;
                    let caught2 = false;
                    let caught3 = false;
                    Object.setPrototypeOf(grandparent, EventTarget.EventTargetFactory.createInstance());
                    Object.setPrototypeOf(parent, EventTarget.EventTargetFactory.createInstance());
                    Object.setPrototypeOf(child, EventTarget.EventTargetFactory.createInstance());
                    grandparent.addEventListener('type1', function (e) {
                        caught1 = true;
                        expect(e.target).equal(child);
                        expect(e.currentTarget).equal(grandparent);
                        expect(e.eventPhase).equal(1);
                    }, true);
                    child.addEventListener('type1', function (e) {
                        caught2 = true;
                        expect(e.target).equal(child);
                        expect(e.currentTarget).equal(child);
                        expect(e.eventPhase).equal(2);
                    });
                    parent.addEventListener('type1', function (e) {
                        expect(e.target).equal(child);
                        expect(e.currentTarget).equal(parent);
                        expect(e.eventPhase).equal(3);
                        caught3 = true;
                    });
                    grandparent.addEventListener('type1', function (e) {
                        expect(e.target).equal(child);
                        expect(e.currentTarget).equal(grandparent);
                        expect(e.eventPhase).equal(3);
                        expect(caught1).equal(true);
                        expect(caught2).equal(true);
                        expect(caught3).equal(true);
                        done();
                    });
                    const ev = newEvent('type1', {bubbles: true});
                    expect(ev.eventPhase).equal(0);
                    child.dispatchEvent(ev);
                });
                it('user handlers should not be able to stop propagation of default or late listeners', function (done) {
                    const car = new Car();
                    let caught1 = false;
                    car.addLateEventListener('start', function (e) {
                        caught1 = true;
                    });
                    car.addDefaultEventListener('start', function (e) {
                        expect(caught1).to.be.true;
                    });
                    car.addEventListener('start', function (e) {
                        e.stopPropagation();
                        done();
                    });
                    car.start({bubbles: true});
                });
            });
        });

        describe('on* events', function () {
            it('`return false` should prevent default but not stop propagation', function (done) {
                let propagated = false;
                const expected = ['grandchildB1', 'childB', 'root'];
                const catTree = new CategoryTree('root', [
                    ['childA', [['grandchildA1'], ['grandchildA2']]],
                    ['childB', [['grandchildB1'], ['grandchildB2']]]
                ]);
                catTree.children[1].onbubbl = function (e) {
                    return false;
                };
                catTree.addEventListener('bubbl', function (e) {
                    propagated = true;
                    expect(e.defaultPrevented).to.be.true;
                });
                catTree.children[1].children[0].addLateEventListener('bubbl', function (e) {
                    expect(propagated).to.be.true;
                    expect(bubbledCategories).deep.equal(expected);
                    done();
                });
                catTree.children[1].children[0].bubble(); // 'grandchildB1'
            });
        });

        describe('hasEventListener', function () {
            it('should throw properly with invalid arguments', function () {
                expect(function () {
                    const car = new Car();
                    car.hasEventListener('sometype');
                }).to.throw(TypeError, /2 or more arguments required/);
                try {
                    const car = new Car();
                    car.hasEventListener(null, function (event) {});
                } catch (err) {
                    expect(err instanceof (typeof DOMException !== 'undefined' ? DOMException : Error)).to.be.true;
                    expect(err.name).equal('UNSPECIFIED_EVENT_TYPE_ERR');
                }
            });
            it('should successfully detect added listener of same type, options, and listener', function () {
                const car = new Car();

                const type1 = 'something1';

                const func1 = function () {
                };
                const func2 = function () {
                };

                const options1 = {passive: true};
                const options2 = {passive: false};

                expect(car.hasEventListener(type1, func1)).to.be.false;
                car.addEventListener(type1, func1);
                expect(car.hasEventListener(type1, func1)).to.be.true;

                expect(car.hasEventListener(type1, func2)).to.be.false;
                car.addEventListener(type1, func2);
                expect(car.hasEventListener(type1, func2)).to.be.true;

                expect(car.hasEventListener(type1, func1, options1)).to.be.false;
                car.addEventListener(type1, func1, options1);
                expect(car.hasEventListener(type1, func1, options1)).to.be.true;

                expect(car.hasEventListener(type1, func1, options2)).to.be.false;
                car.addEventListener(type1, func1, options2);
                expect(car.hasEventListener(type1, func1, options2)).to.be.true;
            });
            it('should not detect added listener of different type, listener, or options', function () {
                const car = new Car();

                const type1 = 'something1';
                const type2 = 'something2';

                const func1 = function () {
                };
                const func2 = function () {
                };

                const options1 = {passive: true};
                const options2 = {passive: false};

                car.addEventListener(type1, func1);
                expect(car.hasEventListener(type2, func1)).to.be.false;
                expect(car.hasEventListener(type1, func2)).to.be.false;

                car.addEventListener(type1, func1, options1);
                expect(car.hasEventListener(type1, func1, options2)).to.be.false;
            });
        });

        describe('Early event listeners', function () {
            it('should trigger before other event listener types', function (done) {
                const car = new Car();
                let ct = 0;
                car.addDefaultEventListener('start', function () {
                    ct++;
                    expect(ct).equal(4);
                    done();
                });
                car.addLateEventListener('start', function () {
                    ct++;
                });
                car.addEventListener('start', function () {
                    ct++;
                });
                car.addEarlyEventListener('start', function () {
                    ct++;
                    expect(ct).equal(1);
                });
                car.start();
            });
            it('should not undergo capture or bubbling', function (done) {
                const parent = {__getParent: function () { return null; }};
                const child = {
                    __getParent: function () {
                        return parent;
                    }
                };
                Object.setPrototypeOf(parent, EventTarget.EventTargetFactory.createInstance());
                Object.setPrototypeOf(child, EventTarget.EventTargetFactory.createInstance());
                let caught1 = false;
                let caught2 = false;
                child.addLateEventListener('type1', function () {
                    expect(caught1).to.be.false;
                    expect(caught2).to.be.false;
                    done();
                });
                parent.addEarlyEventListener('type1', function () {
                    caught1 = true;
                });
                parent.addEarlyEventListener('type1', function () {
                    caught2 = true;
                }, true);
                parent.addEventListener('type1', function () {
                    expect(caught1).to.be.false;
                }, {capture: true});
                const ev = newEvent('type1', {bubbles: true});
                child.dispatchEvent(ev);
            });
            it('should allow stopping propagation on normal events or prevent default', function (done) {
                const expected = [];
                const catTree = new CategoryTree('root', [
                    ['childA', [['grandchildA1'], ['grandchildA2']]],
                    ['childB', [['grandchildB1'], ['grandchildB2']]]
                ]);
                let ranDefault = false;
                catTree.children[1].children[0].__setOptions({defaultSync: true});
                catTree.children[1].children[0].addEarlyEventListener('capt', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                }, true);
                catTree.children[1].children[0].addDefaultEventListener('capt', function () {
                    ranDefault = true;
                });
                catTree.children[1].children[0].addLateEventListener('capt', function (e) {
                    // expect(e.defaultPrevented).to.be.true;
                    expect(ranDefault).to.be.false;
                    expect(capturedCategories).deep.equal(expected);
                    done();
                }, true);
                catTree.children[1].children[0].capture(); // 'grandchildB1'
            });
            it('should allow stopping immediate propagation', function (done) {
                const car = new Car();
                const actual = [];
                const expected = [1, 2];
                car.addEarlyEventListener('start', function (e) {
                    actual.push(1);
                });
                car.addEarlyEventListener('start', function (e) {
                    e.stopImmediatePropagation();
                    actual.push(2);
                }, {capture: true});
                car.addEarlyEventListener('start', function (e) {
                    actual.push(3);
                });
                car.addLateEventListener('start', function (e) {
                    expect(actual).to.deep.equal(expected);
                    done();
                });
                car.start();
            });
        });

        describe('Default event listeners', function () {
            it('should trigger after other event listener types', function (done) {
                const car = new Car();
                let ct = 0;
                car.addDefaultEventListener('start', function () {
                    ct++;
                    expect(ct).equal(4);
                    done();
                });
                car.addLateEventListener('start', function () {
                    ct++;
                });
                car.addEventListener('start', function () {
                    ct++;
                });
                car.addEarlyEventListener('start', function () {
                    ct++;
                });
                car.start();
            });
            it('should not undergo capture or bubbling', function (done) {
                const parent = {__getParent: function () { return null; }};
                const child = {
                    __getParent: function () {
                        return parent;
                    }
                };
                Object.setPrototypeOf(parent, EventTarget.EventTargetFactory.createInstance());
                Object.setPrototypeOf(child, EventTarget.EventTargetFactory.createInstance());
                let caught1 = false;
                let caught2 = false;
                child.__setOptions({defaultSync: true});
                child.addLateEventListener('type1', function () {
                    expect(caught1).to.be.false;
                    expect(caught2).to.be.false;
                    done();
                });
                parent.addDefaultEventListener('type1', function () {
                    caught1 = true;
                });
                parent.addDefaultEventListener('type1', function () {
                    caught2 = true;
                }, true);
                parent.addEventListener('type1', function () {
                    expect(caught1).to.be.false;
                }, {capture: true});
                const ev = newEvent('type1', {bubbles: true});
                child.dispatchEvent(ev);
            });
            it('should allow stopping immediate propagation', function (done) {
                const car = new Car();
                const actual = [];
                const expected = [1, 2];
                car.__setOptions({defaultSync: true});
                car.addDefaultEventListener('start', function (e) {
                    actual.push(1);
                });
                car.addDefaultEventListener('start', function (e) {
                    e.stopImmediatePropagation();
                    actual.push(2);
                }, {capture: true});
                car.addDefaultEventListener('start', function (e) {
                    actual.push(3);
                });
                car.addLateEventListener('start', function (e) {
                    expect(actual).to.deep.equal(expected);
                    done();
                });
                car.start();
            });
            it('should not allow stopping propagation (when async) even to late listeners (as will occur afterward)', function (done) {
                const car = new Car();
                let ranLateEventListener = false;
                let ranNormalEventListener = false;
                let ranEarlyEventListener = false;
                car.addDefaultEventListener('start', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    expect(ranEarlyEventListener).to.be.true;
                    expect(ranNormalEventListener).to.be.true;
                    expect(ranLateEventListener).to.be.true;
                    done();
                });
                car.addLateEventListener('start', function (e) {
                    ranLateEventListener = true;
                });
                car.addEarlyEventListener('start', function (e) {
                    ranEarlyEventListener = true;
                });
                car.addEventListener('start', function (e) {
                    ranNormalEventListener = true;
                });
                car.start({bubbles: true});
            });
            it('should allow stopping propagation when sync to late listeners', function (done) {
                const car = new Car();
                car.__setOptions({defaultSync: true});
                let ranLateEventListener = false;
                let ranNormalEventListener = false;
                let ranEarlyEventListener = false;
                car.addDefaultEventListener('start', function (e) {
                    e.stopPropagation();
                    setTimeout(function () {
                        expect(ranEarlyEventListener).to.be.true;
                        expect(ranNormalEventListener).to.be.true;
                        expect(ranLateEventListener).to.be.false;
                        done();
                    }, 30);
                });
                car.addLateEventListener('start', function (e) {
                    ranLateEventListener = true;
                });
                car.addEarlyEventListener('start', function (e) {
                    ranEarlyEventListener = true;
                });
                car.addEventListener('start', function (e) {
                    ranNormalEventListener = true;
                });
                car.start({bubbles: true});
            });
            it('should allow successful use of `preventDefault` with cancelable event from non-passive listener', function (done) {
                const car = new Car();
                let ranDefaultEventListener = false;
                car.addEventListener('start', function (e) {
                    e.preventDefault();
                    setTimeout(function () {
                        expect(ranDefaultEventListener).to.be.false;
                        done();
                    }, 30);
                });
                car.addDefaultEventListener('start', function (e) {
                    ranDefaultEventListener = true;
                });
                car.start({bubbles: true, cancelable: true});
            });
            it('should not allow successful use of `preventDefault` (or setting of `defaultPrevented`) with non-`cancelable` event even with non-passive listener', function (done) {
                const car = new Car();
                let ranDefaultEventListener = false;
                car.addEventListener('start', function (e) {
                    e.preventDefault();
                    expect(e.defaultPrevented).to.be.false;
                    setTimeout(function () {
                        expect(ranDefaultEventListener).to.be.true;
                        done();
                    }, 30);
                });
                car.addDefaultEventListener('start', function (e) {
                    ranDefaultEventListener = true;
                });
                car.start({bubbles: true});
            });
            it('should not allow successful use of `preventDefault` (or setting of `defaultPrevented`) by `passive` event listener even with cancelable event listener', function (done) {
                const car = new Car();
                let ranDefaultEventListener = false;
                car.addEventListener('start', function (e) {
                    e.preventDefault();
                    expect(e.defaultPrevented).to.be.false;
                    setTimeout(function () {
                        expect(ranDefaultEventListener).to.be.true;
                        done();
                    }, 30);
                }, {passive: true});
                car.addDefaultEventListener('start', function (e) {
                    ranDefaultEventListener = true;
                });
                car.start({bubbles: true, cancelable: true});
            });
            it('should get proper defaultPrevented event properties when set', function (done) {
                const car = new Car();
                car.addEventListener('start', function (e) {
                    e.preventDefault();
                    expect(e.defaultPrevented).to.be.true;
                    done();
                });
                car.addDefaultEventListener('start', function (e) {
                    //
                });
                car.start({bubbles: true, cancelable: true});
            });
            it('`return false` on addEventListener should not prevent default', function (done) {
                const car = new Car();
                let ranDefaultEventListener = false;
                car.addEventListener('start', function (e) {
                    setTimeout(function () {
                        expect(ranDefaultEventListener).to.be.true;
                        done();
                    }, 30);
                    return false;
                });
                car.addDefaultEventListener('start', function (e) {
                    expect(e.defaultPrevented).to.be.false;
                    ranDefaultEventListener = true;
                });
                car.start({bubbles: true, cancelable: true});
            });
            it('should occur before late listeners with custom `defaultSync` option set to true', function (done) {
                const car = new Car();
                let ct = 0;
                car.__setOptions({defaultSync: true});
                car.addDefaultEventListener('start', function () {
                    ct++;
                    expect(ct).equal(1);
                });
                car.addLateEventListener('start', function () {
                    ct++;
                    expect(ct).equal(2);
                    done();
                });
                car.start();
            });
            it('should occur after late listeners with custom `defaultSync` option unset', function (done) {
                const car = new Car();
                let ct = 0;
                car.addDefaultEventListener('start', function () {
                    ct++;
                    expect(ct).equal(2);
                });
                car.addLateEventListener('start', function () {
                    ct++;
                    expect(ct).equal(1);
                    done();
                });
                car.start();
            });
        });

        describe('Late event listeners', function () {
            it('should trigger after other event listener types (except asynchronous defaults)', function (done) {
                const car = new Car();
                let ct = 0;
                car.__setOptions({defaultSync: true});
                car.addDefaultEventListener('start', function () {
                    ct++;
                    expect(ct).equal(3);
                });
                car.addLateEventListener('start', function () {
                    ct++;
                    expect(ct).equal(4);
                    done();
                });
                car.addEventListener('start', function () {
                    ct++;
                });
                car.addEarlyEventListener('start', function () {
                    ct++;
                });
                car.start();
            });
            it('should not undergo capture or bubbling', function (done) {
                const parent = {__getParent: function () { return null; }};
                const child = {
                    __getParent: function () {
                        return parent;
                    }
                };
                Object.setPrototypeOf(parent, EventTarget.EventTargetFactory.createInstance());
                Object.setPrototypeOf(child, EventTarget.EventTargetFactory.createInstance());
                let caught1 = false;
                let caught2 = false;
                let ct = 0;
                child.addDefaultEventListener('type1', function () {
                    expect(caught1).to.be.false;
                    expect(caught2).to.be.false;
                    expect(ct).equal(1);
                    done();
                }, true);
                parent.addLateEventListener('type1', function () {
                    caught1 = true;
                });
                parent.addLateEventListener('type1', function () {
                    caught2 = true;
                }, true);
                parent.addEventListener('type1', function () {
                    ct++;
                    expect(caught1).equal(false);
                }, {capture: true});
                const ev = newEvent('type1', {bubbles: true});
                child.dispatchEvent(ev);
            });
            it('should not allow stopping propagation or preventing default with sync defaults (since should execute before)', function (done) {
                const car = new Car();
                let ranDefaultEventListener = false;
                let ranNormalEventListener = false;
                let ranEarlyEventListener = false;
                car.__setOptions({defaultSync: true});
                car.addLateEventListener('start', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    expect(ranEarlyEventListener).to.be.true;
                    expect(ranNormalEventListener).to.be.true;
                    expect(ranDefaultEventListener).to.be.true;
                    done();
                });
                car.addDefaultEventListener('start', function (e) {
                    ranDefaultEventListener = true;
                });
                car.addEarlyEventListener('start', function (e) {
                    ranEarlyEventListener = true;
                });
                car.addEventListener('start', function (e) {
                    ranNormalEventListener = true;
                });
                car.start({bubbles: true});
            });
            it('should not allow stopPropagation to prevent default with async defaults', function (done) {
                const car = new Car();
                let ranDefaultEventListener = false;
                car.addLateEventListener('start', function (e) {
                    e.stopPropagation();
                    expect(ranDefaultEventListener).to.be.false;
                });
                car.addDefaultEventListener('start', function (e) {
                    ranDefaultEventListener = true;
                    done();
                });
                car.start({bubbles: true, cancelable: true});
            });
            it('should allow preventing default with async defaults', function (done) {
                const car = new Car();
                let ranDefaultEventListener = false;
                car.addLateEventListener('start', function (e) {
                    e.preventDefault();
                    setTimeout(function () {
                        expect(ranDefaultEventListener).to.be.false;
                        done();
                    }, 30);
                });
                car.addDefaultEventListener('start', function (e) {
                    ranDefaultEventListener = true;
                });
                car.start({bubbles: true, cancelable: true});
            });
            it('should allow stopping immediate propagation', function (done) {
                const car = new Car();
                const actual = [];
                const expected = [1, 2];
                car.addLateEventListener('start', function (e) {
                    actual.push(1);
                });
                car.addLateEventListener('start', function (e) {
                    e.stopImmediatePropagation();
                    actual.push(2);
                }, {capture: true});
                car.addLateEventListener('start', function (e) {
                    actual.push(3);
                });
                car.addDefaultEventListener('start', function (e) {
                    expect(actual).to.deep.equal(expected);
                    done();
                });
                car.start();
            });
        });

        describe('Error handling', function () {
            if (typeof window === 'undefined') {
                let listeners;
                beforeEach(function () {
                    listeners = process.listeners('uncaughtException');
                    process.removeAllListeners('uncaughtException');
                });

                afterEach(function () {
                    listeners.forEach(function (listener) {
                        process.on('uncaughtException', listener);
                    });
                });
            }

            it('should trigger window.onerror', function (done) {
                let ct = 0;
                let ct2 = 0;
                function handler (err) {
                    if (ct === 0) {
                        expect(err.message).to.equal('Uncaught exception: Oops');
                    } else {
                        expect(err.message).to.equal('Oops again');
                        expect(ct).to.equal(1);
                        if (typeof window !== 'undefined') {
                            expect(ct2).to.equal(2);
                            window.removeEventListener('error', handler);
                        }
                        done();
                        return;
                    }
                    ct++;
                }
                if (typeof window === 'undefined') {
                    process.on('uncaughtException', handler);
                } else {
                    window.onerror = function (msg) {
                        if (ct2 === 0) {
                            expect(msg).to.equal('Uncaught exception: Oops');
                        } else {
                            expect(msg).to.equal('Oops again');
                            expect(ct2).to.equal(1);
                        }
                        ct2++;
                    };
                    window.addEventListener('error', handler);
                }

                const car = new Car();
                const func = function () {
                    throw 'Oops'; // eslint-disable-line no-throw-literal
                };
                const func2 = function () {
                    throw new Error('Oops again');
                };
                car.addEventListener('start', func);
                car.addEventListener('start', func2);
                car.start();
            });
            if (evClass !== 'nativeEvent') {
                it('should set `__legacyOutputDidListenersThrowError`', function (done) {
                    function handler () {
                        if (typeof window !== 'undefined') {
                            window.removeEventListener('error', handler);
                        }
                    }
                    if (typeof window === 'undefined') {
                        process.on('uncaughtException', handler);
                    } else {
                        window.onerror = function (msg) {
                        };
                        window.addEventListener('error', handler);
                    }

                    const car = new Car();
                    const func = function () {
                        throw 'Oops'; // eslint-disable-line no-throw-literal
                    };
                    const func2 = function () {
                        throw new Error('Oops again');
                    };
                    let errCt = 0;
                    car.__userErrorEventHandler = function (errorObj) {
                        errCt++;
                        if (errCt > 2) {
                            return;
                        }
                        if (errCt === 1) {
                            expect(errorObj.message).to.equal('Uncaught exception: Oops');
                        } else {
                            expect(errorObj.message).to.equal('Uncaught exception: Oops again');
                            if (typeof window !== 'undefined') {
                                window.removeEventListener('error', handler);
                            }
                            done();
                        }
                    };
                    car.addEventListener('start1', func);
                    car.addEventListener('start1', func2);
                    car.__setOptions({legacyOutputDidListenersThrowFlag: true});

                    const ev = newEvent('start1');
                    car.dispatchEvent(ev);
                    expect(ev.__legacyOutputDidListenersThrowError instanceof Error).to.equal(true);
                    done();
                });
            }
        });
    });
});

})));
