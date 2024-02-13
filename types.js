/**
 * @file types.js
 * @description This file defines the types of the core object.
 */

// effectTag
// const ONCE = Symbol.for("ONCE");
// const EXEC_EFFECT = Symbol.for("USEEFFECT");
// const NO_CHANGES = Symbol.for("NOCHANGES");

/**
 * @property {Symbol} tag
 * @property {Function} create
 * @property {Function} destroy
 * @property {Array} deps
 * @property {effectValue} next
 */
const TEffect = Object.freeze({
    effectTag: null,
    create: null,
    destroy: null,
    deps: null,
    next: null,
});

/**
 * @property {any} memoizedState
 * @property {Object} queue
 * @property {Hook} next
 */
const THookObject = Object.freeze({
    memoizedState: null,
    queue: null,
    next: null,
});
