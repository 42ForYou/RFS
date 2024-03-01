/**
 *  @module useReducerImpl
 *  @description - This module contains the implementation of the useReducer hook.
 */

import is from "../../shared/objectIs.js";
import hookCore from "../core/hookCore.js";
import hookRenderPhase from "../core/hookRenderPhase.js";
import { mountWorkInProgressHook, updateWorkInProgressHook } from "../core/workInProgressHook.js";
import { createHookUpdateQueue } from "../constructor/index.js";
import hookExpirationTime from "../core/hookExpirationTime.js";
import dispatchAction from "../shared/dispatchAction.js";

/**
 * @param {THookObject} hook
 * @param {Function} reducer
 * @returns {[any, Function]} - [state, dispatch]
 *
 * @description - This function updates the reducer.
 * updateReducer는 redner phase혹은 idle status일 때 호출되며
 * 한번 mount된 Component에서 다시 호출되었을 때 사용됩니다.
 * 전체적인 로직은
 *  1. render phase update가 있는지 확인합니다.
 *  2. idle status update가 있는지 확인합니다.
 *
 * 해당 함수를 useState와 함께 쓸 것을 고려하여 eagerState분기를 넣었습니다.
 * eagerReducer가 reducer와 같을 경우, eagerState를 사용하여 state를 업데이트합니다.
 */
const updateReducerImpl = (hook, reducer) => {
    const queue = hook.queue;
    queue.lastRenderedReducer = reducer;

    // render-phase update (1번째 분기)
    if (hookRenderPhase.numberOfReRenders > 0) {
        // render-phase update
        // This is a re-render. Apply the new reduer phase updates to the previous
        // work-in-progress hook.

        const dispatch = queue.dispatch;

        // 만약 render-phase update가 있다면, 해당 update를 적용해야한다.
        // renderPhaseUpdates는 Map으로 구성되어있으며, queue를 key로 가지고 있다.
        // 이를 linked list로 변환하여 순회한다.
        if (hookRenderPhase.renderPhaseUpdates !== null) {
            const firstRenderPhaseUpdate = hookRenderPhase.renderPhaseUpdates.get(queue);

            if (firstRenderPhaseUpdate !== undefined) {
                hookRenderPhase.renderPhaseUpdates.delete(queue);
                let newState = hook.memoizedState;
                let update = firstRenderPhaseUpdate;
                do {
                    const action = update.action;
                    newState = reducer(newState, action);
                    update = update.next;
                } while (update !== null);

                if (is(newState, hook.memoizedState) === false) {
                    // TODO: Implement this function.
                    // 함수 구현이 간단하긴 하지만 beginWork의 module scope를 참조해야 하기 때문에
                    // 이후 추가 구현을 위해 주석처리 하였습니다
                    markWorkInProgressReceivedUpdate();
                }

                hook.memoizedState = newState;

                // 모든 update를 resolve하였기 때문에, baseState를 마지막 update로 옮깁니다.
                if (hook.baseState === queue.last) {
                    hook.baseState = newState;
                }

                queue.lastRenderedState = newState;

                return [newState, dispatch];
            }
        }
        return [hook.memoizedState, dispatch];
    }

    // idle status update
    const last = queue.last;

    const baseUpdate = hook.baseUpdate;
    const baseState = hook.baseState;

    // check the update during the idle status
    let first;
    if (baseUpdate !== null) {
        if (last !== null) {
            // circular linked list 더는 head를 물고 있을 필요가 없으므로 연결을 끊어준다.
            last.next = null;
        }
        first = baseUpdate.next;
    } else {
        // last.next는 null이 아니라면 first를 가리킨다.
        first = last !== null ? last.next : null;
    }

    // (2번째 분기)
    if (first !== null) {
        let newState = baseState;
        let newBaseState = null;
        let newBaseUpdate = null;
        let prevUpdate = baseUpdate;
        let update = first;
        let didSkip = false;
        do {
            const updateExpirationTime = update.expirationTime;
            // expirationTime을 대소로 비교하는 조건문이 있을 때는 큰 숫자가 더 우선순위가 높다.
            if (updateExpirationTime < hookExpirationTime.renderExpirationTime) {
                if (!didSkip) {
                    didSkip = true;
                    newBaseUpdate = prevUpdate;
                    newBaseState = newState;
                }

                if (updateExpirationTime > hookExpirationTime.remainingExpirationTime) {
                    hookExpirationTime.remainingExpirationTime = updateExpirationTime;
                    // TODO: Implement this function.
                    markUnprocessedUpdateTime(hookExpirationTime.remainingExpirationTime);
                }
            } else {
                // This update does have sufficient priority.
                // TODO: implement this function.
                markRenderEventTimeAndConfig(updateExpirationTime, update.suspenseConfig);

                if (update.eagerReducer === reducer) {
                    newState = update.eagerState;
                } else {
                    const action = update.action;
                    newState = reducer(newState, action);
                }
            }
            prevUpdate = update;
            update = update.next;
        } while (update !== null && update !== first);

        if (!didSkip) {
            newBaseUpdate = prevUpdate;
            newBaseState = newState;
        }

        if (!is(newState, hook.memoizedState)) {
            // TODO: Implement this function.
            markWorkInProgressReceivedUpdate();
        }

        hook.memoizedState = newState;
        hook.baseUpdate = newBaseUpdate;
        hook.baseState = newBaseState;

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
 *  1. props나 상태가 변경되어 재렌더링이 필요할 때. (render phase update)
 *  2. 액션이 dispatch될 때 (dispatch를 통해 상태를 변경할 때) (idle status update)
 */
export const updateReducer = (reducer, _, __) => {
    const hook = updateWorkInProgressHook();
    return updateReducerImpl(hook, reducer);
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
    hook.memoizedState = hook.baseState = initialState;
    const queue = createHookUpdateQueue(null, null, reducer, initialState);
    hook.queue = queue;

    // dispatchReducerAction함수는 이후 사용자가 dispatch를 호출할 때마다 호출되는 내부 구현입니다.
    // 해당 함수는 dispatch를 호출할 때마다 queue에 update를 추가하고, fiber를 이용해 re-render하기 때문에.
    // 인자를 fiber, queue, action으로 받습니다
    // 하지만 사용자는 내부 변수인 fiber와 queue를 알 필요가 없기 때문에,
    // 해당 함수는 호출할 때는 Action만 인자로 넣도록 dispatch를 bind를 이용해 생성합니다.
    const dispatch = dispatchAction.bind(null, hookCore.currentlyRenderingFiber, queue);
    queue.dispatch = dispatch;
    return [hook.memoizedState, dispatch];
};
