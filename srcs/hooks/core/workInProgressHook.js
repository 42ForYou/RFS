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
 * firstWorkInProgressHook는 말 그대로 첫번째 workInProgressHook을 가리킵니다.
 * 주요 로직은 아래 주석을 참고하시기 바랍니다.
 */
const pushBackHookList = (newHook) => {
    if (hookCore.workInProgressHook === null) {
        // This is the first hook in the list.
        hookCore.firstWorkInProgressHook = hookCore.workInProgressHook = newHook;
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
    const hook = createHookObject(null, null, null, null, null);
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
 * 16.12.0ver 기준으로 firstWorkInProgressHook, nextWorkInProgressHook, nextCurrentHook, currentHook이
 * 업데이트되었는데 모두 해당 함수 updateWorkInProgressHook에서 관리됩니다.
 * nextWorkInProgressHook은 말 그대로 다음 workInProgressHook을 가리킵니다.
 * 처음에는 firstWorkInProgressHook을 넣어 관리합니다. @see renderWithHooks
 */
export const updateWorkInProgressHook = () => {
    if (hookCore.nextWorkInProgressHook !== null) {
        // There's already a work-in-progress. Reuse it.
        hookCore.workInProgressHook = hookCore.nextWorkInProgressHook;

        hookCore.nextWorkInProgressHook = hookCore.workInProgressHook.next;
        hookCore.currentHook = hookCore.nextCurrentHook;
        hookCore.nextCurrentHook = hookCore.currentHook !== null ? hookCore.currentHook.next : null;
    } else {
        // Clone from the current hook.
        // 여기에 왔다는 것은 현재 해당 fiber에 대한 hookObject가 없다는 것을 의미합니다.
        // 따라서 currentHook(이전 렌더링 hook)을 기반으로 새로운 hook을 만들어야 합니다.
        hookCore.currentHook = hookCore.nextCurrentHook;

        const newHook = createHookObject(
            hookCore.currentHook.memoizedState,
            hookCore.currentHook.baseState,
            hookCore.currentHook.baseUpdate,
            hookCore.currentHook.queue,
            null
        );
        pushBackHookList(newHook);
        hookCore.nextCurrentHook = hookCore.currentHook.next;
    }
    return hookCore.workInProgressHook;
};
