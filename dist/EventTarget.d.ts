export type ListenerOptions = {
    /**
     * Remove listener after invoking once
     */
    once?: boolean | undefined;
    /**
     * Don't allow `preventDefault`
     */
    passive?: boolean | undefined;
    /**
     * Use `_children` and set `eventPhase`
     */
    capture?: boolean | undefined;
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
export type Listener = (e: EventWithProps) => boolean;
/**
 * Keys are event types.
 */
export type Listeners = {
    [key: string]: Listener[];
};
export type AllListeners = {
    [type: string]: ListenerAndOptions[];
};
export type Integer = number;
export type InvokeCurrentListeners = (listeners: AllListeners, eventCopy: EventWithProps, type: string, checkOnListeners?: boolean | undefined) => boolean;
export type CustomOptions = {
    defaultSync?: boolean;
    extraProperties?: string[];
    legacyOutputDidListenersThrowFlag?: boolean;
};
export type EventWithProps = {
    __legacyOutputDidListenersThrowError: unknown;
    target: EventTarget & {
        invokeCurrentListeners: InvokeCurrentListeners;
        _earlyListeners: AllListeners;
        _listeners: AllListeners;
        _lateListeners: AllListeners;
        _defaultListeners: AllListeners;
    };
    composed: boolean;
    currentTarget: EventTarget;
    eventPhase: 0 | 1 | 2 | 3;
    defaultPrevented: boolean;
    type: string;
    bubbles: boolean;
    cancelable: boolean;
    isTrusted: boolean;
    timeStamp: Integer;
    initEvent: (type: string, bubbles: boolean, cancelable: boolean) => void;
    preventDefault: () => void;
    composedPath: () => void;
    detail: any;
    initCustomEvent: (type: string, canBubble: boolean, cancelable: boolean, detail: any) => void;
};
export type ListenerName = "addEarlyEventListener" | "removeEarlyEventListener" | "hasEarlyEventListener" | "addEventListener" | "removeEventListener" | "hasEventListener" | "addLateEventListener" | "removeLateEventListener" | "hasLateEventListener" | "addDefaultEventListener" | "removeDefaultEventListener" | "hasDefaultEventListener";
/**
 * @returns {void}
 */
export function setPrototypeOfCustomEvent(): void;
export namespace EventTargetFactory {
    /**
     * @param {CustomOptions} customOptions
     * @returns {EventTarget}
     */
    function createInstance(customOptions: CustomOptions): EventTarget;
}
/**
 * @class
 */
declare function EventTarget(): void;
declare class EventTarget {
}
declare namespace EventTarget {
    export { ShimEvent };
    export { ShimCustomEvent };
    export { ShimDOMException };
    export { EventTarget as ShimEventTarget };
    export { EventTargetFactory };
}
export class ShimEvent {
    private constructor();
    preventDefault(): void;
    stopImmediatePropagation(): void;
    stopPropagation(): void;
    initEvent(type: any, bubbles: any, cancelable: any): void;
}
export class ShimCustomEvent {
    private constructor();
    initCustomEvent(type: any, bubbles: any, cancelable: any, detail: any, ...args: any[]): void;
    get detail(): any;
}
export const ShimDOMException: {
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
export { EventTarget as ShimEventTarget };
//# sourceMappingURL=EventTarget.d.ts.map