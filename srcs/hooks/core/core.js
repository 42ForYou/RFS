/**
 * @file core.js
 * @description This file defines the core hook object.
 * @module Hooks/Core
 */

/**
 * @property {Fiber} currentlyRenderingFiber current rendering Fiber node
 * @property {Hook} workInProgressHook Status of Hooks in the current rendering phase
 * @property {Hook} currentHook The list is the state of the component when it was last rendered.
 */
export default {
    currentlyRenderingFiber: null,
    workInProgressHook: null,
    currentHook: null,
};
