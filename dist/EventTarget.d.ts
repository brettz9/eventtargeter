export type Integer = number;
export type InvokeCurrentListeners = (listeners: AllListeners, eventCopy: EventWithProps, type: string, checkOnListeners?: boolean) => boolean;
export type CustomOptions = {
    defaultSync?: boolean;
    extraProperties?: string[];
    legacyOutputDidListenersThrowFlag?: boolean;
};
export type AddOrRemoveListenerMethod = (type: string, listener: Listener | {
    handleEvent: Listener;
}, options?: boolean | ListenerOptions) => void;
export type HasListenerMethod = (type: string, listener: Listener | {
    handleEvent: Listener;
}, options?: boolean | ListenerOptions) => boolean;
export type EventTargetInstance = {
    _defaultSync?: boolean;
    _extraProperties?: string[];
    _legacyOutputDidListenersThrowCheck?: boolean;
    _earlyListeners?: AllListeners;
    _listeners?: AllListeners;
    _lateListeners?: AllListeners;
    _defaultListeners?: AllListeners;
    _parent?: EventTargetInstance | null;
    __getParent?: () => EventTargetInstance | null;
    tryCatch: (evt: EventWithProps, cb: () => void) => void;
    triggerErrorEvent: (err: unknown, evt: EventWithProps) => void;
    invokeCurrentListeners: InvokeCurrentListeners;
    dispatchEvent: (e: EventWithProps) => boolean;
    _dispatchEvent: (e: EventWithProps, setTarget: boolean) => boolean;
    __setOptions: (customOptions?: CustomOptions) => void;
    addEventListener: AddOrRemoveListenerMethod;
    removeEventListener: AddOrRemoveListenerMethod;
    hasEventListener: HasListenerMethod;
    addEarlyEventListener: AddOrRemoveListenerMethod;
    removeEarlyEventListener: AddOrRemoveListenerMethod;
    hasEarlyEventListener: HasListenerMethod;
    addLateEventListener: AddOrRemoveListenerMethod;
    removeLateEventListener: AddOrRemoveListenerMethod;
    hasLateEventListener: HasListenerMethod;
    addDefaultEventListener: AddOrRemoveListenerMethod;
    removeDefaultEventListener: AddOrRemoveListenerMethod;
    hasDefaultEventListener: HasListenerMethod;
    [key: string]: any;
};
export type EventWithProps = {
    __legacyOutputDidListenersThrowError?: unknown;
    target?: EventTargetInstance;
    composed?: boolean;
    currentTarget?: EventTargetInstance | null;
    eventPhase?: 0 | 1 | 2 | 3;
    defaultPrevented?: boolean;
    type?: string;
    bubbles?: boolean;
    cancelable?: boolean;
    isTrusted?: boolean;
    timeStamp?: Integer;
    initEvent?: (type: string, bubbles: boolean, cancelable: boolean) => void;
    preventDefault?: () => void;
    composedPath?: () => void;
    detail?: any;
    initCustomEvent?: (type: string, canBubble: boolean, cancelable: boolean, detail: any) => void;
    [key: string]: any;
};
declare const ShimDOMException: {
    new (message?: string, name?: string): DOMException;
    prototype: DOMException;
    readonly INDEX_SIZE_ERR: 1;
    readonly DOMSTRING_SIZE_ERR: 2;
    readonly HIERARCHY_REQUEST_ERR: 3;
    readonly WRONG_DOCUMENT_ERR: 4;
    readonly INVALID_CHARACTER_ERR: 5;
    readonly NO_DATA_ALLOWED_ERR: 6;
    readonly NO_MODIFICATION_ALLOWED_ERR: 7;
    readonly NOT_FOUND_ERR: 8;
    readonly NOT_SUPPORTED_ERR: 9;
    readonly INUSE_ATTRIBUTE_ERR: 10;
    readonly INVALID_STATE_ERR: 11;
    readonly SYNTAX_ERR: 12;
    readonly INVALID_MODIFICATION_ERR: 13;
    readonly NAMESPACE_ERR: 14;
    readonly INVALID_ACCESS_ERR: 15;
    readonly VALIDATION_ERR: 16;
    readonly TYPE_MISMATCH_ERR: 17;
    readonly SECURITY_ERR: 18;
    readonly NETWORK_ERR: 19;
    readonly ABORT_ERR: 20;
    readonly URL_MISMATCH_ERR: 21;
    readonly QUOTA_EXCEEDED_ERR: 22;
    readonly TIMEOUT_ERR: 23;
    readonly INVALID_NODE_TYPE_ERR: 24;
    readonly DATA_CLONE_ERR: 25;
} | ((msg: string, name: string) => Error);
/**
 * We use an adapter class rather than a proxy not only for compatibility
 * but also since we have to clone native event properties anyways in order
 * to properly set `target`, etc.
 * The regular DOM method `dispatchEvent` won't work with this polyfill as
 * it expects a native event.
 * @class
 * @param {string} type
 * @this {EventWithProps}
 */
declare const ShimEvent: {
    (this: EventWithProps, type: string): void;
    [Symbol.toStringTag]: string;
    readonly prototype: any;
};
/**
 * @class
 * @param {string} type
 * @this {EventWithProps}
 */
declare const ShimCustomEvent: {
    (this: EventWithProps, type: string): void;
    [Symbol.toStringTag]: string;
    readonly prototype: any;
};
export type ListenerOptions = {
    /**
     * Remove listener after invoking once
     */
    once?: boolean;
    /**
     * Don't allow `preventDefault`
     */
    passive?: boolean;
    /**
     * Use `_children` and set `eventPhase`
     */
    capture?: boolean;
};
export type ListenerAndOptions = {
    listener: Listener;
    options: ListenerOptions;
};
export type ListenerInfo = {
    listenersByTypeOptions: ListenerAndOptions[];
    options: ListenerOptions;
    listenersByType: ListenerAndOptions[];
};
export type Listener = (e: EventWithProps) => boolean | void;
export type Listeners = {
    [key: string]: Listener[];
};
export type AllListeners = {
    [type: string]: ListenerAndOptions[];
};
/**
 * @class
 * @throws {TypeError}
 */
declare function EventTarget(): void;
declare namespace EventTarget {
    export { ShimEvent };
    export { ShimCustomEvent };
    export { ShimDOMException };
    export { EventTarget as ShimEventTarget };
    export { EventTargetFactory };
}
export type ListenerName = "addEarlyEventListener" | "removeEarlyEventListener" | "hasEarlyEventListener" | "addEventListener" | "removeEventListener" | "hasEventListener" | "addLateEventListener" | "removeLateEventListener" | "hasLateEventListener" | "addDefaultEventListener" | "removeDefaultEventListener" | "hasDefaultEventListener";
declare const EventTargetFactory: {
    /**
     * @param {CustomOptions} [customOptions]
     * @returns {EventTarget}
     */
    createInstance(customOptions?: CustomOptions): EventTarget;
};
/**
 * @returns {void}
 */
declare function setPrototypeOfCustomEvent(): void;
export { setPrototypeOfCustomEvent, EventTargetFactory, EventTarget as ShimEventTarget, ShimEvent, ShimCustomEvent, ShimDOMException };
//# sourceMappingURL=EventTarget.d.ts.map