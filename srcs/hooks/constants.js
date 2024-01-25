/**
 * @module const
 * @description This file defines the constants used in the hooks.
 * @file const.js
 */

/**
 * @description Symbol for the useEffect tag.
 */
export const ONCE = Symbol.for("ONCE");
export const EXEC_EFFECT = Symbol.for("USEEFFECT");
export const NO_CHANGES = Symbol.for("NOCHANGES");

/**
 * @property {Object | Value} memoizedState
 * @property {Object} queue
 * @property {Hook} next
 */
export const defaultHook = Object.freeze({
    memoizedState: null,
    queue: null,
    next: null,
});

/**
 * @property {Symbol} tag
 * @property {Function} create
 * @property {Function} destroy
 * @property {Array} deps
 * @property {effectValue} next
 */
export const effectValue = Object.freeze({
    tag: null,
    create: null,
    destroy: null,
    deps: null,
    next: null,
});
