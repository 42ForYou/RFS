/**
 *  @module useReducerImpl
 *  @description - This module contains the implementation of the useReducer hook.
 */

import is from "../../shared/objectIs.js";
import hookCore from "../core/hookCore.js";
import {
    mountWorkInProgressHook,
    updateWorkInProgressHook,
} from "../core/workInProgressHook.js";

/**
 *
 * @param {TUpdateQueue} queue
 * @param {TUpdate} update
 */
const enqueueRenderPhaseUpdate = (queue, update) => {
    const pending = queue.pending;
    if (pending === null) {
        // This is the first update. Create a circular list.
        update.next = update;
    } else {
        update.next = pending.next;
        pending.next = update;
    }
    queue.pending = update;
};

/**
 *
 * @param {TFiber} fiber
 * @param {TUpdateQueue} queue
 * @param {any} action
 */
const dispatchReducerAction = (fiber, queue, action) => {
    const update = {
        action,
        next: null,
    };
    enqueueRenderPhaseUpdate(queue, update);
    const lastRenderedReducer = queue.lastRenderedReducer;
    const lastRenderedState = queue.lastRenderedState;

    const currentState = lastRenderedReducer(lastRenderedState, action);
    if (is(currentState, lastRenderedState)) {
        return;
    }
    // NOTE: This is for debugging.
    if (__DEV__) {
        console.log("dispatchReducerAction: currentState", currentState);
        queue.lastRenderedState = currentState;
        return currentState;
    }
    // TODO: Implement this function.
    scheduleUpdateOnFiber(fiber);
};

/**
 * @param {THookObject} hook
 * @param {THookObject} currentHook
 * @param {Function} reducer
 * @returns {[any, Function]} - [state, dispatch]
 */
const updateReducerImpl = (hook, currentHook, reducer) => {
    const queue = hook.queue;
    const lastRenderPhaseUpdate = queue.pending;
    let newState = currentHook.memoizedState;

    if (lastRenderPhaseUpdate !== null) {
        queue.pending = null;
        const firstRenderPhaseUpdate = lastRenderPhaseUpdate.next;
        let update = firstRenderPhaseUpdate;
        do {
            const action = update.action;
            newState = reducer(newState, action);
            update = update.next;
        } while (update !== firstRenderPhaseUpdate);
        hook.memoizedState = newState;
        queue.lastRenderedState = newState;
    }

    const dispatch = queue.dispatch;
    return [newState, dispatch];
};

/**
 *
 * @param {Function} reducer
 * @param {any} initialArg
 * @param {Function} init
 * @returns {[any, Function]} - [state, dispatch]
 */
export const updateReducer = (reducer, _, __) => {
    const hook = updateWorkInProgressHook();
    return updateReducerImpl(hook, hookCore.currentHook, reducer);
};

/**
 *
 * @param {Function} reducer
 * @param {any} initialArg
 * @param {Function} init
 * @returns {[any, Function]} - [state, dispatch]
 */
export const mountReducer = (reducer, initialArg, init) => {
    const hook = mountWorkInProgressHook();
    let initialState;
    if (init !== undefined) {
        initialState = init(initialArg);
    } else {
        initialState = initialArg;
    }
    hook.memoizedState = initialState;
    const queue = {
        pending: null,
        dispatch: null,
        lastRenderedReducer: reducer,
        lastRenderedState: initialState,
    };
    hook.queue = queue;
    const dispatch = dispatchReducerAction.bind(
        null,
        hookCore.currentlyRenderingFiber,
        queue
    );
    queue.dispatch = dispatch;
    return [hook.memoizedState, dispatch];
};
