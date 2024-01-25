/**
 * @module workInProgressHook
 * @description This module defines the workInProgressHook object function.
 */

import c from "./core";

/**
 * @function mountWorkInProgressHook
 * @returns {THookObject}
 * @global
 * @see currentlyRenderingFiber
 * @see workInProgressHook
 */
export const mountWorkInProgressHook = () => {
    const workInProgressHook = c.workInProgressHook;
    const hook = {
        memoizedState: null,
        queue: null,
        next: null,
    };

    if (workInProgressHook === null) {
        c.currentlyRenderingFiber.memoizedState = c.workInProgressHook = hook;
    } else {
        c.workInProgressHook = c.workInProgressHook.next = hook;
    }
    return c.workInProgressHook;
};

/**
 * @function updateWorkInProgressHook
 * @returns {THookObject}
 * @global
 * @see currentlyRenderingFiber
 * @see workInProgressHook
 * @see currentHook
 */
export const updateWorkInProgressHook = () => {
    let nextCurrentHook;
    if (c.currentHook === null) {
        const current = c.currentlyRenderingFiber.alternate;
        if (current !== null) {
            nextCurrentHook = current.memoizedState;
        } else {
            nextCurrentHook = null;
        }
    } else {
        nextCurrentHook = c.currentHook.next ?? c.currentHook;
    }
    c.currentHook = nextCurrentHook;

    const newHook = {
        memoizedState: c.currentHook.memoizedState,
        queue: c.currentHook.queue,
        next: null,
    };

    if (c.workInProgressHook === null) {
        c.currentlyRenderingFiber.memoizedState = c.workInProgressHook =
            newHook;
    } else {
        c.workInProgressHook = c.workInProgressHook.next = newHook;
    }

    return c.workInProgressHook;
};
