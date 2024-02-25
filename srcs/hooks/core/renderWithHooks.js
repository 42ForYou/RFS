import hookCore from "./hookCore";
import { hookDispatcherOnMount, hookDispatcherOnUpdate } from "./hooksDispatcher";

/**
 *
 * @param {Ojbect} hookCore
 * @description This function is used to finish rendering hooks.
 * 하나의 컴포넌트의 렌더링이 끝났기 때문에 hookCore에 존재하던 property들을 초기화합니다.
 * @see hookCore
 */
const finishRenderingHooks = (hookCore) => {
    hookCore.currentlyRenderingFiber = null;
    hookCore.workInProgressHook = null;
    hookCore.currentHook = null;
};

/**
 * @function renderWithHooks
 * @description This function is used to render the component with hooks.
 * @param {TFiber | null} current
 * @param {TFiber} workInProgress
 * @param {Function} Component
 * @param {any} props
 * @param {ref | context} secondArg
 * @returns {any} children
 */
export default renderWithHooks = (current, workInProgress, Component, props, secondArg) => {
    hookCore.currentlyRenderingFiber = workInProgress;

    workInProgress.memoizedState = null;
    workInProgress.updateQueue = null;

    if (current === null || current.memoizedState === null) {
        hookCore.RfsCurrentDispatcher.current = hookDispatcherOnMount;
    } else {
        hookCore.RfsCurrentDispatcher.current = hookDispatcherOnUpdate;
    }

    const children = Component(props, secondArg);
    finishRenderingHooks(hookCore);
    return children;
};
