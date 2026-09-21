import {ShimEventTarget} from '../src/EventTarget.js';

/** @type {Record<string, unknown>} */ (/** @type {unknown} */ (globalThis)).ShimEventTarget = ShimEventTarget;
