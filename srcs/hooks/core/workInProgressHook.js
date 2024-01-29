/**
 * @module workInProgressHook
 * @description This module defines the workInProgressHook object function.
 */

import hookCore from "./hookCore.js";

/**
 * @function mountWorkInProgressHook
 * @returns {THookObject}
 * @global
 * @see currentlyRenderingFiber
 * @see workInProgressHook
 */
export const mountWorkInProgressHook = () => {
    const workInProgressHook = hookCore.workInProgressHook;
    const hook = {
        memoizedState: null,
        queue: null,
        next: null,
    };
    if (workInProgressHook === null) {
        hookCore.currentlyRenderingFiber.memoizedState =
            hookCore.workInProgressHook = hook;
    } else {
        hookCore.workInProgressHook = hookCore.workInProgressHook.next = hook;
    }
    return hookCore.workInProgressHook;
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
    if (hookCore.currentHook === null) {
        const current = hookCore.currentlyRenderingFiber.alternate;
        if (current !== null) {
            nextCurrentHook = current.memoizedState;
        } else {
            nextCurrentHook = null;
        }
    } else {
        nextCurrentHook = hookCore.currentHook.next ?? hookCore.currentHook;
    }
    hookCore.currentHook = nextCurrentHook;

    const newHook = {
        memoizedState: hookCore.currentHook.memoizedState,
        queue: hookCore.currentHook.queue,
        next: null,
    };

    if (hookCore.workInProgressHook === null) {
        hookCore.currentlyRenderingFiber.memoizedState =
            hookCore.workInProgressHook = newHook;
    } else {
        hookCore.workInProgressHook = hookCore.workInProgressHook.next =
            newHook;
    }

    return hookCore.workInProgressHook;
};
