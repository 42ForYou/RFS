/**
 * @module useStateImpl
 * @description - This module implements the useState hook.
 */

import is from "../../shared/objectIs.js";
import { createHookUpdate, createHookUpdateQueue } from "../constructor/index.js";
import hookCore from "../core/hookCore.js";
import { mountWorkInProgressHook } from "../core/workInProgressHook.js";
import enqueueRenderPhaseUpdate from "../shared/enqueueRenderPhaseUpdate.js";
import { updateReducer } from "../useReducer/useReducerImpl.js";

/**
 *
 * @param {any} state
 * @param {any} action
 * @description - This function is a basic state reducer.
 * useState에서 사용되는 기본적인 state reducer입니다.
 * 만약 action이 function 이라면 state를 인자로 넣고 실행합니다.
 * 이는 setState에 함수를 넣는 경우 사용될 수 있습니다.
 * .e.g. setState(prevState => prevState + 1)
 * @returns
 */
const basicStateReducer = (state, action) => {
    return typeof action === "function" ? action(state) : action;
};

/**
 *
 * @param {import("../../fiber/type").Tfiber} fiber
 * @param {import("../types/THookUpdateQueue").THookUpdateQueue} queue
 * @param {any} action
 * @description - This function dispatches an action to the reducer.
 * useReducer의 dispatch와 다르게 eagerState를 사용합니다.
 * 이는 useState에서는 useReducer와 달리 로직이 단순할 것을 기대하기 때문에 eagerState를 사용합니다.
 * client가 단순한 상태 변경이라면 useState를 사용하고, 복잡한 상태 변경이라면 useReducer를 사용하도록 권장합니다.
 * @see dispatchReducerAction
 * @returns
 */
const dispatchSetState = (fiber, queue, action) => {
    const update = createHookUpdate(action, false, null, null);
    enqueueRenderPhaseUpdate(queue, update);
    const lastRenderedReducer = queue.lastRenderedReducer;
    const currentState = queue.lastRenderedState;
    const eagerState = lastRenderedReducer(currentState, action);

    update.hasEagerState = true;
    update.eagerState = eagerState;
    if (is(eagerState, currentState)) {
        return;
    }

    // TODO: Implement this function.
    scheduleUpdateOnFiber(fiber);
};

/**
 *
 * @param {any} initialState
 * @description - This function updates the state.
 * useReducer의 내부구현에 사용되는 updateReducer를 사용합니다.
 * 해당 함수는 basitStateReducer를 reducer로 사용합니다.
 * @see updateReducer
 * @returns
 */
export const updateState = (initialState) => {
    return updateReducer(basicStateReducer, initialState);
};

/**
 *
 * @param {any} initialState
 * @description - This function mounts the state.
 * hook 객체를 생성하고, 초기값을 설정합니다.
 * 만약 initialState가 Function 이라면 실행하여 초기값을 설정합니다.
 * @returns
 */
const mountStateImpl = (initialState) => {
    const hook = mountWorkInProgressHook();
    if (typeof initialState === "function") {
        const initialStateInitializer = initialState;

        initialState = initialStateInitializer();
    }
    hook.memoizedState = initialState;
    const queue = createHookUpdateQueue(null, null, basicStateReducer, initialState);
    hook.queue = queue;
    return hook;
};

/**
 *
 * @param {any} initialState
 * @description - This function mounts the state.
 * useState의 mount내부 구현입니다.
 * 해당 함수는 초기값을 설정하고, dispatch를 생성합니다.
 * @see mountStateImpl
 * @see dispatchSetState
 * @returns
 */
export const mountState = (initialState) => {
    const hook = mountStateImpl(initialState);
    const queue = hook.queue;
    const dispatch = dispatchSetState.bind(null, hookCore.currentlyRenderingFiber, queue);
    queue.dispatch = dispatch;
    return [hook.memoizedState, dispatch];
};
