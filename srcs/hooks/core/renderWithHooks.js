import { NoWork } from "../../const/CExpirationTime.js";
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
 * @param {ref | context} refOrContext NOTE:: 레거시컨텍스트 api에서 사용하는 방식에 context넣기 방식->우리는 사용하진 않음
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
    // NOTE: refOrContext를 넣어주는 이유는 ClassComponent 때문.
    let children = Component(props, refOrContext);

    // render phase시에 update가 발생했다면 해당 Component를 다시 렌더링합니다.
    // NOTE: renderphaseUpdate란 예를들어
    // NOTE: function component ({props}) {
    // NOTE:     const [state, setState] = useState(0);
    // NOTE:     setState(1);
    // NOTE:     setState(2);
    // NOTE:     return <div>{state}</div>
    // NOTE:  이런꼴일떄 컴포넌트 코드 안에 setState코드가 있어서 dispatchAction이 여기선 두번 불릴떄 일어나는 상황이다.
    if (hookRenderPhase.didScheduleRenderPhaseUpdate) {
        do {
            //NOTE: (daegulee)->여기서 만약에 무한으로 돌면 Throw던지는게 좋지 않을까요?? 예를 들어 40번정도면 에러로그를 찌
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
