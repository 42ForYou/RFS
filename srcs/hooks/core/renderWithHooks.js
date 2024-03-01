import { NoWork } from "../../type/TExpirationTime.js";
import hookCore from "./hookCore.js";
import hookExpirationTime from "./hookExpirationTime.js";
import hookRenderPhase from "./hookRenderPhase.js";
import { hookDispatcherOnMount, hookDispatcherOnUpdate } from "./hooksDispatcher.js";

/**
 *
 * @param {Ojbect} hookCore
 * @param {Object} hookExpirationTime
 * @description This function is used to finish rendering hooks.
 * 하나의 컴포넌트의 렌더링이 끝났기 때문에 hookCore에 존재하던 property들을 초기화합니다.
 * @see hookCore
 */
const finishRenderingHooks = (hookCore, hookExpirationTime) => {
    // finish hookCore
    hookCore.currentlyRenderingFiber = null;

    hookCore.currentHook = null;
    hookCore.nextCurrentHook = null;

    hookCore.firstWorkInProgressHook = null;
    hookCore.workInProgressHook = null;
    hookCore.nextWorkInProgressHook = null;

    hookCore.componentUpdateQueue = null;
    hookCore.sideEffectTag = 0;

    // finish hookExpirationTime
    // TODO: import NoWork
    hookExpirationTime.renderExpirationTime = NoWork;
    hookExpirationTime.remainingExpirationTime = NoWork;
};

/**
 * @function renderWithHooks
 * @description This function is used to render the component with hooks.
 * @param {TFiber | null} current
 * @param {TFiber} workInProgress
 * @param {Function} Component
 * @param {any} props
 * @param {ref | context} refOrContext
 * @param {ExpirationTime} nextRenderExpirationTime
 * @returns {any} children
 */
const renderWithHooks = (current, workInProgress, Component, props, refOrContext, nextRenderExpirationTime) => {
    hookExpirationTime.renderExpirationTime = nextRenderExpirationTime;
    hookCore.currentlyRenderingFiber = workInProgress;
    hookCore.nextCurrentHook = current !== null ? current.memoizedState : null;

    if (hookCore.nextCurrentHook === null) {
        hookCore.RfsCurrentDispatcher.current = hookDispatcherOnMount;
    } else {
        hookCore.RfsCurrentDispatcher.current = hookDispatcherOnUpdate;
    }

    // Component render
    // TODO: ?? 그러면 props랑 context랑 같이 들어오는데? 이게 뭐지.
    let children = Component(props, refOrContext);

    // render phase시에 update가 발생했다면 해당 Component를 다시 렌더링합니다.
    if (hookRenderPhase.didScheduleRenderPhaseUpdate) {
        do {
            hookRenderPhase.didScheduleRenderPhaseUpdate = false;
            hookRenderPhase.numberOfReRenders += 1;

            hookCore.nextCurrentHook = current !== null ? current.memoizedState : null;
            hookCore.nextWorkInProgressHook = hookCore.firstWorkInProgressHook;

            hookCore.currentHook = null;
            hookCore.workInProgressHook = null;
            hookCore.componentUpdateQueue = null;

            hookCore.RfsCurrentDispatcher.current = hookDispatcherOnUpdate;

            children = Component(props, refOrContext);
        } while (hookRenderPhase.didScheduleRenderPhaseUpdate);

        // reset hookRenderPhase
        hookRenderPhase.renderPhaseUpdates = null;
        hookRenderPhase.numberOfReRenders = 0;
    }

    // 이 과정에서는 hook이 불리면 안되는 상황이기 때문에 (이미 Component가 렌더링이 끝났기 때문에)
    // ContextOnlyDispatcher를 사용하여 만약 hook이 불렸을 경우 에러를 발생시킵니다.
    hookCore.RfsCurrentDispatcher.current = ContextOnlyDispatcher;

    const renderedWork = hookCore.currentlyRenderingFiber;

    // 이번 render에서 발생한 결과들을 fiber에 저장합니다.
    renderedWork.memoizedState = hookCore.firstWorkInProgressHook;
    renderedWork.expirationTime = hookExpirationTime.renderExpirationTime;
    renderedWork.updateQueue = hookCore.componentUpdateQueue;
    renderedWork.effectTag |= hookCore.sideEffectTag;

    // finish rendering hooks
    finishRenderingHooks(hookCore, hookExpirationTime);
    return children;
};

export default renderWithHooks;
