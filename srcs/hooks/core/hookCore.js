/**
 * @file hookCore.js
 * @description This file defines the core hook object.
 * @module Hooks/hookCore
 */

/**
 * @property {Fiber} currentlyRenderingFiber current rendering Fiber node
 * @property {THookObject} workInProgressHook Status of Hooks in the current rendering phase
 * @property {THookObject} currentHook The list is the state of the component when it was last rendered.
 * @property {Object} RfsCurrentDispatcher The current dispatcher object.
 */
export default {
    currentlyRenderingFiber: null,
    workInProgressHook: null,
    currentHook: null,
    RfsCurrentDispatcher: { current: null },
};
