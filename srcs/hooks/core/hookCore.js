/**
 * @file hookCore.js
 * @description This file defines the core hook object.
 * @module Hooks/hookCore
 */

/**
 * @property {Fiber} currentlyRenderingFiber current rendering Fiber node -> points to WIP Fiber
 * @property {THookObject} workInProgressHook Status of Hooks in the current rendering phase
 * @property {THookObject} currentHook The list is the state of the component when it was last rendered.
 * @property {Object} RfsCurrentDispatcher The current dispatcher object.
 * @property {Object} componentUpdateQueue The update queue of the component.
 * @property {number} sideEffectTag The side effect tag of the component.
 * @description This object is the core of the hook.
 * Component를 렌더할 때 함께 hook들도 rendering되기 때문에 해당 문맥에서
 * hook들의 상태를 관리하기 위한 객체입니다. 각 프로퍼티는 위와 같은 역할을 합니다.
 * @see renderWithHooks
 * @see mountWorkInProgressHook
 * @see updateWorkInProgressHook
 */
export default {
    currentlyRenderingFiber: null,

    currentHook: null,
    nextCurrentHook: null,

    firstWorkInProgressHook: null,
    workInProgressHook: null,
    nextWorkInProgressHook: null,

    RfsCurrentDispatcher: { current: null },

    componentUpdateQueue: null,
    sideEffectTag: 0,
};
