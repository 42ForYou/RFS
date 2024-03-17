import { prepareToReadContext, propagateContextChange, pushProvider, readContext } from "../context/newContext.js";
import hasContextChanged from "../context/shared/hasContextChanged.js";
import is from "../shared/objectIs.js";

let didReceiveUpdate = false;

/**
 * @description - markWorkInProgressReceivedUpdate는 workInProgress가 update를 받았다는 것을 표시합니다.
 * 변수 didReceiveUpdate는 이후 frunction component를 update할 때 사용됩니다.
 *
 */
const markWorkInProgressReceivedUpdate = () => {
    didReceiveUpdate = true;
};

/**
 *
 * @param {TFiber} current
 * @param {TFiber} workInProgress
 * @param {TExpirationTime} renderExpirationTime
 *
 * @description - updateContextProvider의 목표는 consumer가 사용하는 값을 설정하는 것입니다.
 * 위의 목표를 달성하기 위해 Provider의 값을 update하는 과정을 수행합니다.
 * @returns
 */
const updateContextProvider = (current, workInProgress, renderExpirationTime) => {
    const providerType = workInProgress.type;
    const context = providerType._context;

    const newProps = workInProgress.pendingProps;
    const oldProps = workInProgress.memoizedProps;

    const newValue = newProps.value;

    // fiberStack에 새로운 value를 push합니다.
    pushProvider(workInProgress, newValue);

    if (oldProps !== null) {
        const oldValue = oldProps.value;

        if (is(oldValue, newValue)) {
            // No change. Bailout early if children are the same.
            if (oldProps.children === newProps.children && !hasContextChanged()) {
                return bailoutOnAlreadyFinishedWork(current, workInProgress, renderExpirationTime);
            }
        } else {
            // The context value changed. Search for matching consumers and schedule
            // them to update.
            // changedBits가 0이 아니라면, context가 변했다는 것을 의미합니다.
            // Provider의 값이 변경되었기 때문에 해당 Provider의 값을 사용하는 Consumer를 찾아서
            // re-render를 해야합니다.
            propagateContextChange(workInProgress, context, renderExpirationTime);
        }
    }

    const newChildren = newProps.children;
    reconcileChildren(current, workInProgress, newChildren, renderExpirationTime);
    return workInProgress.child;
};

/**
 *
 * @param {TFiber} current
 * @param {TFiber} workInProgress
 * @param {TExpirationTime} renderExpirationTime
 *
 * @description - beginWork에서 호출됩니다.
 * updateContextConsumer의 목표는 context 값을 읽어서 child component를 호출하여 re-render하는 것입니다.
 * @returns
 */
const updateContextConsumer = (current, workInProgress, renderExpirationTime) => {
    // wip fiber의 type에 context
    const context = workInProgress.type;

    const newProps = workInProgress.pendingProps;
    const render = newProps.children;

    // prepareToReadContext를 통해 context를 읽을 준비를 합니다.
    prepareToReadContext(workInProgress, renderExpirationTime);

    // readContext를 통해 context 값을 가져옵니다.
    const newValue = readContext(context);

    // child component를 context의 값을 넣어 호출합니다.
    const newChildren = render(newValue);

    // reconcileChildren을 통해 child component를 재조정합니다.
    reconcileChildren(current, workInProgress, newChildren, renderExpirationTime);
    return workInProgress.child;
};

/**
 *
 * @param {TFiber} current
 * @param {TFiber} workInProgress
 * @param {lambda} Component
 * @param {any} nextProps
 * @param {TExpirationTime} updateExpirationTime
 * @param {TExpirationTime} renderExpirationTime
 * @returns {TFiber}
 * @description - updateSimpleMemoComponent의 목표는 memo를 사용하여 최적화된 컴포넌트를 업데이트하는 것입니다.
 */
const updateSimpleMemoComponent = (
    current,
    workInProgress,
    Component,
    nextProps,
    updateExpirationTime,
    renderExpirationTime
) => {
    if (current !== null) {
        const prevProps = current.memoizedProps;
        if (shallowEqual(prevProps, nextProps) && current.ref === workInProgress.ref) {
            //update를 취소해야 함
            didReceiveUpdate = false;
            if (updateExpirationTime < renderExpirationTime) {
                // This will bail out and read the memoized state.
                return bailoutOnAlreadyFinishedWork(current, workInProgress, renderExpirationTime);
            }
        }
    }
    return updateFunctionComponent(current, workInProgress, Component, nextProps, renderExpirationTime);
};

/**
 *
 * @param {TFiber} workInProgress
 * @description - pushHostRootContext는 현재의 호스트 root 컨텍스트를 스택에 푸시합니다.
 */
const pushHostRootContext = (workInProgress) => {
    //FiberRoot
    const root = workInProgress.stateNode;
    //현재 루트를 가지고 파이버 스택에 RootInstanceContext(관련된것 모두)푸시
    pushHostContainer(workInProgress, root.containerInfo);
};

/**
 *
 * @param {TFiber} current
 * @param {TFiber} workInProgress
 * @returns {null}
 * @description 여기선 할일이 없습니다. 뒤의 Completionphase에서 처리합니다.
 */
const updateHostText = (current, workInProgress) => {
    return null;
};

/**
 *
 * @param {TFiber} current
 * @param {TFiber} workInProgress
 * @param {TExpirationTime} renderExpirationTime
 * @returns {TFiber|null}
 * @description Fragment를 업데이트하는 함수 단순히 reconcileChildren을 호출합니다.(단순 래퍼)
 */
const updateFragment = (current, workInProgress, renderExpirationTime) => {
    const nextChildren = workInProgress.pendingProps;
    reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime);
    return workInProgress.child;
};

/**
 * @param {TFiber|null} current @see 파일경로: /type/TFiber.js
 * @param {TFiber} workInProgress @see 파일경로: /type/TFiber.js
 * @param {TExpirationTime} renderExpirationTime @see 파일경로: /type/TExpirationTime.js
 * @returns {TFiber|null} @see 파일경로: /type/TFiber.js
 * @description 기본적으로 update류와 bailout류의 작업을 수행합니다.
 * @description update류의 작업은 해당 파이버의 태그에 따라서 다르게 동작합니다. 해당 파이버를 update하고 그 파이버의 자식을 반환합니다.
 * @description bailout류의 작업은 현재 파이버는 업데이트가 안됬을떄 작동하는 작업으로 자식이 업데이트 되어있으면
 * @description 자식을 클론떠서 wip로 만들어서 반환합니다.
 */
export const beginWork = (current, workInProgress, renderExpirationTime) => {
    const updateExpirationTime = workInProgress.expirationTime;

    if (current !== null) {
        const oldProps = current.memoizedProps;
        const newProps = workInProgress.pendingProps;

        //NOTE: hasLegacyContextChanged고려 아마 구버전 16.3v이전의 context를 고려하는 것으로 보임
        if (oldProps !== newProps) {
            // props가 있다면, 해당 파이버가 작업을 수행했다고 표시합니다.
            // 나중에 props가 동일하다고 판단되면 이 표시는 해제될 수 있습니다 (memo 사용 시).
            didReceiveUpdate = true;
        } else if (updateExpirationTime < renderExpirationTime) {
            // 이 이 의미에서의 bailout은 업데이트가 없다라는 것이 아니라 우선순위
            // 때문에 업데이트가 미뤄진다는 것을 의미합니다.
            // 이 파이버에는 pendingwork가 없습니다. Bailout 해야 합니다 비긴페이즈로 들어가지 않고
            // 이 최적화된 경로에서 아직 수행해야 할 몇 가지 작업이 남아 있습니다.

            // 이 최적화된 경로에서 대부분 스택에 작업을 푸시합니다.
            //bailout을 하기 전에 파이버 스택에 context자체는 넣어야 그걸
            //참조하는 로직을 수행할수 있다.
            didReceiveUpdate = false;
            switch (workInProgress.tag) {
                case HostRoot:
                    pushHostRootContext(workInProgress);
                    break;
                case HostComponent:
                    pushHostContext(workInProgress);
                    //NOTE: offScreen구현해야되는지 확실히 check
                    break;
                case ContextProvider:
                    const newValue = workInProgress.memoizedProps.value;
                    pushProvider(workInProgress, newValue);
                    break;
            }
            return bailoutOnAlreadyFinishedWork(current, workInProgress, renderExpirationTime);
        } else {
            // 이 파이버에 대한 업데이트가 예약되었지만 새 props이 없습니다.
            // 레거시 컨텍스트도 없습니다. 이 값을 false로 설정합니다. 업데이트 대기열 또는 컨텍스트
            // 소비자가 변경된 값을 생성하면 이 값을 true로 설정합니다. 그렇지 않으면
            // 컴포넌트는 자식이 변경되지 않은 것으로 간주하고 종료합니다.
            didReceiveUpdate = false;
        }
    } else {
        //current는 없고, workInProgress만 있는 경우
        //update가 일어나는 상황은 아님
        didReceiveUpdate = false;
    }

    // BeginPhase에 들어가기전에, expirationTime의 사용처는 다했음으로
    // 초기화 해준다.
    workInProgress.expirationTime = NoWork;

    //NOTE: 여기서 만약 consumer가 필요하면 case 추가
    switch (workInProgress.tag) {
        case IndeterminateComponent:
            //mount가 되는 상황 로직부분
            return mountIndeterminateComponent(current, workInProgress, workInProgress.type, renderExpirationTime);
        case FunctionComponent: {
            const Component = workInProgress.type;
            const resolvedProps = workInProgress.pendingProps;
            //NOTE: unresolvedProps를 통해서 resolveDefulat해야 되는지 확인 -> 왠만하면 lazy관련된거라 필요 없을것같음
            return updateFunctionComponent(current, workInProgress, Component, resolvedProps, renderExpirationTime);
        }
        case HostRoot:
            return updateHostRoot(current, workInProgress, renderExpirationTime);
        case HostComponent:
            return updateHostComponent(current, workInProgress, renderExpirationTime);
        case HostText:
            return updateHostText(current, workInProgress);
        case Fragment:
            return updateFragment(current, workInProgress, renderExpirationTime);
        case ContextProvider:
            return updateContextProvider(current, workInProgress, renderExpirationTime);
        case SimpleMemoComponent:
            return updateSimpleMemoComponent(
                current,
                workInProgress,
                workInProgress.type,
                workInProgress.pendingProps,
                updateExpirationTime,
                renderExpirationTime
            );
    }
    console.error("Unknown unit of work tag. This error is likely caused by a bug in rfs. Please file an issue.");
    throw new Error("Unknown unit of work tag. This error is likely caused by a bug in rfs. Please file an issue.");
};

export { markWorkInProgressReceivedUpdate, updateContextProvider, updateContextConsumer };
