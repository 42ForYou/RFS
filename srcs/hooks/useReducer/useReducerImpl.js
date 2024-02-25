/**
 *  @module useReducerImpl
 *  @description - This module contains the implementation of the useReducer hook.
 */

import is from "../../shared/objectIs.js";
import hookCore from "../core/hookCore.js";
import { mountWorkInProgressHook, updateWorkInProgressHook } from "../core/workInProgressHook.js";

import { createHookUpdate, createUpdateQueue } from "../constructor/index.js";
import enqueueRenderPhaseUpdate from "../shared/enqueueRenderPhaseUpdate.js";

/**
 * @param {TFiber} fiber currentlyRenderingFiber
 * @param {THookUpdateQueue} queue
 * @param {any} action
 * @description - This function dispatches an action to the reducer.
 * 다음과 같은 이유로, useReducer에서는 eagerState를 사용하지 않습니다.
 * useReducer는 보다 복잡한 상태 로직을 관리할 때 사용되며,
 * 상태 업데이트 로직이 useState보다 더 복잡하거나 조건부 로직을 포함할 수 있기 때문에,
 * 선제적 계산을 기본 동작으로 사용하지 않습니다.
 *
 * 하지만 해당 dispatchReducerAction은 useState와 함께 사용할 예정이기 때문에
 * eagerState를 추가하여 useState에서 선제적 계산(eager)을 사용하도록 하였습니다.
 *
 *  현재 RFS의 schedule logic을 포괄적으로 파악하지 못하였기 때문에
 *  dispatch로 인해 scheduleUpdateOnFiber를 호출하는 것으로 대체하였습니다.
 *  해당 65번째 줄의 함수는 이후 구현에 따라 변경될 수 있습니다. react Source에서 render phase일 시에
 *  enqueueRenderPhaseUpdate를 호출하고 있습니다.
 */
const dispatchReducerAction = (fiber, queue, action) => {
    const update = createHookUpdate(action, false, null, null);
    enqueueRenderPhaseUpdate(queue, update);
    const lastRenderedReducer = queue.lastRenderedReducer;
    const currentState = queue.lastRenderedState;
    const eagerState = lastRenderedReducer(currentState, action);

    if (is(eagerState, currentState)) {
        return;
    }

    // TODO: Implement this function.
    scheduleUpdateOnFiber(fiber);
};

/**
 * @param {THookObject} hook
 * @param {THookObject} currentHook
 * @param {Function} reducer
 * @returns {[any, Function]} - [state, dispatch]
 *
 * @description - This function updates the reducer.
 * updateReducer는 rendering 시에 호출되며, 한번 mount된 Component에서 다시 호출되었을 때
 * 사용됩니다. 해당 함수를 useState와 함께 쓸 것을 고려하여 hasEagerState분기를 넣었습니다.
 * hasEagerState가 true일 경우, eagerState를 사용하여 state를 업데이트합니다.
 */
const updateReducerImpl = (hook, currentHook, reducer) => {
    const queue = hook.queue;
    queue.lastRenderedReducer = reducer;
    const lastRenderPhaseUpdate = queue.pending;
    let newState = currentHook.memoizedState;

    if (lastRenderPhaseUpdate !== null) {
        queue.pending = null;
        const first = lastRenderPhaseUpdate.next;
        let update = first;
        do {
            const action = update.action;
            if (update.hasEagerState) {
                // If this update is a state update (not a reducer) and was processed eagerly,
                // we can use the eagerly computed state
                newState = update.eagerState;
            } else {
                newState = reducer(newState, action);
            }
            update = update.next;
        } while (update !== first);
        hook.memoizedState = newState;
        queue.lastRenderedState = newState;
    }

    const dispatch = queue.dispatch;
    return [hook.memoizedState, dispatch];
};

/**
 *
 * @param {Function} reducer
 * @param {any} initialArg
 * @param {Function} init
 * @returns {[any, Function]} - [state, dispatch]
 * @description - This function update the reducer.
 * updateWorkInProgressHook과 updateReducerImpl을 사용하여
 * Component가 업데이트될 때 사용됩니다.
 *  1. props나 상태가 변경되어 재렌더링이 필요할 때.
 *  2. 액션이 dispatch될 때 (dispatch를 통해 상태를 변경할 때)
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
 * @description - This function mounts the reducer.
 * 해당 함수는 mount 시에 호출되며, 초기값을 설정하고, dispatch를 생성합니다.
 */
export const mountReducer = (reducer, initialArg, init) => {
    const hook = mountWorkInProgressHook();

    // init initialState
    let initialState;
    if (init !== undefined) {
        initialState = init(initialArg);
    } else {
        initialState = initialArg;
    }
    hook.memoizedState = initialState;
    const queue = createUpdateQueue(null, null, reducer, initialState);
    hook.queue = queue;

    // dispatchReducerAction함수는 이후 사용자가 dispatch를 호출할 때마다 호출되는 내부 구현입니다.
    // 해당 함수는 dispatch를 호출할 때마다 queue에 update를 추가하고, fiber를 이용해 re-render하기 때문에.
    // 인자를 fiber, queue, action으로 받습니다
    // 하지만 사용자는 내부 변수인 fiber와 queue를 알 필요가 없기 때문에,
    // 해당 함수는 호출할 때는 Action만 인자로 넣도록 dispatch를 bind를 이용해 생성합니다.
    const dispatch = dispatchReducerAction.bind(null, hookCore.currentlyRenderingFiber, queue);
    queue.dispatch = dispatch;
    return [hook.memoizedState, dispatch];
};
