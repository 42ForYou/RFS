/**
 * @module workInProgressHook
 * @description This module defines the workInProgressHook object function.
 */

import hookCore from "./hookCore.js";
import { createHookObject } from "../constructor/index.js";

/**
 * @function pushBackHookList
 * @param {import("../types/THookObject.js").THookObject} newHook
 * @global
 * @see currentlyRenderingFiber
 * @see workInProgressHook
 * @description This function pushes back the hook list.
 * update와 mount의 공통적인 로직을 추상화하여 하나의 함수로 만들었습니다.
 * 주요 로직은 아래 주석을 참고하시기 바랍니다.
 */
const pushBackHookList = (newHook) => {
    if (hookCore.workInProgressHook === null) {
        // This is the first hook in the list.
        hookCore.currentlyRenderingFiber.memoizedState = hookCore.workInProgressHook = newHook;
    } else {
        // Append to the end of the list.
        hookCore.workInProgressHook = hookCore.workInProgressHook.next = newHook;
    }
};

/**
 * @function mountWorkInProgressHook
 * @global
 * @see currentlyRenderingFiber
 * @see workInProgressHook
 * @returns {import("../types/THookObject.js").THookObject}
 * @description This function mounts the work-in-progress hook.
 * 해당 함수는 hookCore의 currentlyRenderingFiber에 새로운 hook을 추가하는 것에 중점을 두고 있습니다.
 * 만약 wip가 있다면 hookCore의 list에 append합니다.
 */
export const mountWorkInProgressHook = () => {
    const hook = createHookObject(null, null, null);
    pushBackHookList(hook);
    return hookCore.workInProgressHook;
};

/**
 * @function updateWorkInProgressHook
 * @global
 * @see currentlyRenderingFiber
 * @see workInProgressHook
 * @see currentHook
 * @returns {import("../types/THookObject.js").THookObject}
 * @description This function updates the work-in-progress hook.
 * 해당 함수는 hookCore의 currentHook과 workInProgressHook를 업데이트하는 것에 중점을 두고 있습니다.
 * 로직의 덩어리는 총 3군데이며,
 *  첫번째 nextCurrentHook을 결정.
 *  두번째 nextWorkInProgressHook을 결정.
 *  세번째 실제로 hookCore의 currentHook과 workInProgressHook을 업데이트.
 *      이 부분에서 이미 wip하고 있는 Hook이 존재한다면, 그것을 재사용하고, 그렇지 않다면 새로운 Hook을 생성하여 사용합니다.
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
        nextCurrentHook = hookCore.currentHook.next;
    }

    let nextWorkInProgressHook;
    if (hookCore.workInProgressHook === null) {
        nextWorkInProgressHook = hookCore.currentlyRenderingFiber.memoizedState;
    } else {
        nextWorkInProgressHook = hookCore.workInProgressHook.next;
    }

    // NOTE: 3번째 이후 update일 때 아래 로직이 불릴 것으로 추정.
    if (nextWorkInProgressHook !== null) {
        // There's already a work-in-progress. Reuse it.
        hookCore.workInProgressHook = nextWorkInProgressHook;

        nextWorkInProgressHook = hookCore.workInProgressHook.next;
        hookCore.currentHook = nextCurrentHook;
        throw Error("updateWorkInProgressHook error!!! OMG");
    } else {
        // Clone the current hook.
        hookCore.currentHook = nextCurrentHook;

        const newHook = createHookObject(hookCore.currentHook.memoizedState, hookCore.currentHook.queue, null);
        pushBackHookList(newHook);
    }
    return hookCore.workInProgressHook;
};
