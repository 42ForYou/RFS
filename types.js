/**
 * @file types.js
 * @description This file defines the types of the core object.
 */

// effectTag
// const ONCE = Symbol.for("ONCE");
// const EXEC_EFFECT = Symbol.for("USEEFFECT");
// const NO_CHANGES = Symbol.for("NOCHANGES");

/**
 * @property {any} action
 * @property {boolean} hasEagerState
 * @property {any} eagerState
 * @property {TUpdate | null} next
 */
const TUpdate = Object.freeze({
    action: null,
    // for optimization of useReducer not now
    /*
        if (update.hasEagerState) {
        // If this update is a state update (not a reducer) and was processed eagerly,
        // we can use the eagerly computed state
        newState = ((update.eagerState: any): S);
        } else {
          newState = reducer(newState, action);
        }
    */
    // hasEagerState: null,
    // eagerState: null,

    next: null,
});

/**
 * @property {TUpdate} pending
 * @property {function} dispatch
 * @property {function | baseicStateReducer} lastRenderedReducer
 * @property {any} lastRenderedState
 */
const TUpdateQueue = Object.freeze({
    pending: null,
    dispatch: null,
    lastRenderedReducer: null,
    lastRenderedState: null,
});

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
