import hookCore from "./hookCore";
import {
    hookDispatcherOnMount,
    hookDispatcherOnUpdate,
} from "./hooksDispatcher";
/**
 * @function renderWithHooks
 * @description This function is used to render the component with hooks.
 * @param {TFiber | null} current
 * @param {TFiber} workInProgress
 * @param {Function} Component
 * @param {any} props
 * @returns {any} children
 */
export default renderWithHooks = (
    current,
    workInProgress,
    Component,
    props
) => {
    hookCore.currentlyRenderingFiber = workInProgress;

    if (current === null || current.memoizedState === null) {
        hookCore.RfsCurrentDispatcher.current = hookDispatcherOnMount;
    } else {
        hookCore.RfsCurrentDispatcher.current = hookDispatcherOnUpdate;
    }

    const children = Component(props);
    hookCore.currentlyRenderingFiber = null;
    hookCore.workInProgressHook = null;
    hookCore.currentHook = null;
    return children;
};