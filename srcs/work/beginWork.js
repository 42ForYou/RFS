import { update } from "lodash";
import { prepareToReadContext, propagateContextChange, pushProvider, readContext } from "../context/newContext.js";
import calculateChangedBits from "../context/shared/calculateChangedBits.js";
import hasContextChanged from "../context/shared/hasContextChanged.js";
import {
    IndeterminateComponent,
    FunctionComponent,
    HostRoot,
    HostComponent,
    HostText,
    Fragment,
    ContextProvider,
    SimpleMemoComponent,
} from "../const/CWorkTag.js";
import { cloneChildFibers } from "../fiber/childFiber.js";

/**
 *
 * @param {TFiber|null} current @see 파일경로: /type/TFiber.js
 * @param {TFiber} workInProgress @see 파일경로: /type/TFiber.js
 * @param {TExpirationTime} renderExpirationTime @see 파일경로: /type/TExpirationTime.js
 * @description 컴포넌트의 props나 state가 변경되지 않았을 때
 * @description  이미 처리된 작업의 결과를 재사용할 수 있을 때
 * @description  더 높은 우선순위의 작업이 있어서 현재 작업을 나중으로 미룰 필요가 있을 때
 * @description 사용 되며, 이전 작업을 재사용하고(자식의 childExtime도 update필요 없을떄), 필요하다면 자식만 clone하여 사용합니다.
 * @returns {TFiber|null} @see 파일경로: /type/TFiber.js
 */
const bailoutOnAlreadyFinishedWork = (current, workInProgress, renderExpirationTime) => {
    //TODO: dependencies관련된 문맥을 이해 후 다시 코드 이해
    if (current !== null) {
        // Reuse previous dependencies
        workInProgress.dependencies = current.dependencies;
    }

    //update가 뒤로 밀린 상황이라면 나중에 처리하기 위해 mark를 해준다.
    const updateExpirationTime = workInProgress.expirationTime;
    if (updateExpirationTime !== NoWork) {
        markUnprocessedUpdateTime(updateExpirationTime);
    }

    const childExpirationTime = workInProgress.childExpirationTime;
    if (childExpirationTime < renderExpirationTime) {
        //자식들도 업데이트가 되지 않았음.
        return null;
    } else {
        // 이 파이버에는 작업이 없지만 그 하위 트리에는 작업이 있습니다. 자식
        // 파이버를 복제하고 계속합니다.
        cloneChildFibers(current, workInProgress);
        return workInProgress.child;
    }
};

// TODO: 다른 파일로 옮기기
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

        // calculateChangedBits를 통해 이전 값과 새로운 값이 변하였는지 계산합니다.
        const changedBits = calculateChangedBits(context, newValue, oldValue);
        if (changedBits === 0) {
            // No change. Bailout early if children are the same.
            if (oldProps.children === newProps.children && !hasContextChanged()) {
                // TODO: implement this function.
                return bailoutOnAlreadyFinishedWork(current, workInProgress, renderExpirationTime);
            }
        } else {
            // The context value changed. Search for matching consumers and schedule
            // them to update.
            // changedBits가 0이 아니라면, context가 변했다는 것을 의미합니다.
            // Provider의 값이 변경되었기 때문에 해당 Provider의 값을 사용하는 Consumer를 찾아서
            // re-render를 해야합니다.
            propagateContextChange(workInProgress, context, changedBits, renderExpirationTime);
        }
    }

    const newChildren = newProps.children;
    // TODO: implement this function.
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
    const newValue = readContext(context, newProps.unstable_observedBits);

    // child component를 context의 값을 넣어 호출합니다.
    const newChildren = render(newValue);

    // TODO: implement this function.
    // reconcileChildren을 통해 child component를 재조정합니다.
    reconcileChildren(current, workInProgress, newChildren, renderExpirationTime);
    return workInProgress.child;
};

//TODO: 명세랑 정확한 동작 정의
const pushHostRootContext = (workInProgress) => {
    //FiberRoot
    const root = workInProgress.stateNode;
    //TODO:: fiberStack이랑 연계되어야될듯
    //TODO: pushHostContainer 구현
    pushHostContainer(workInProgress, root.containerInfo);
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

        //TODO: hasLegacyContextChanged고려 아마 구버전 16.3v이전의 context를 고려하는 것으로 보임
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
            // TODO: 스택에 작업을 푸시하는게 무슨 의미인지 개발 컨텍스트 이해
            didReceiveUpdate = false;
            switch (workInProgress.tag) {
                case HostRoot:
                    //TODO: pushHostRootContext 문맥이해
                    pushHostRootContext(workInProgress);
                    break;
                case HostComponent:
                    //TODO: pushContext부분 문맥이해
                    //TODO: pushHostContext 구현
                    pushHostContext(workInProgress);
                    //TODO: offScreen구현해야되는지 확실히 check
                    break;
                case ContextProvider:
                    //TODO: 해당 문맥이해하기
                    const newValue = workInProgress.memoizedProps.value;
                    pushProvider(workInProgress, newValue);
                    break;
            }
            //TODO: bailoutOnAlreadyFinishedWork 구현
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

    switch (workInProgress.tag) {
        case IndeterminateComponent:
            //TODO: mountIndeterminateComponent 구현
            //mount가 되는 상황 로직부분
            return mountIndeterminateComponent(current, workInProgress, workInProgress.type, renderExpirationTime);
        case FunctionComponent: {
            const Component = workInProgress.type;
            const resolvedProps = workInProgress.pendingProps;
            //TODO: updateFunctionComponent 구현
            //TODO: unresolvedProps를 통해서 resolveDefulat해야 되는지 확인 -> 왠만하면 lazy관련된거라 필요 없을것같음
            return updateFunctionComponent(current, workInProgress, Component, resolvedProps, renderExpirationTime);
        }
        case HostRoot:
            //TODO: updateHostRoot 구현
            return updateHostRoot(current, workInProgress, renderExpirationTime);
        case HostComponent:
            //TODO: updateHostComponent 구현
            return updateHostComponent(current, workInProgress, renderExpirationTime);
        case HostText:
            //TODO: updateHostText 구현
            return updateHostText(current, workInProgress);
        case Fragment:
            //TODO: updateFragment 구현
            return updateFragment(current, workInProgress, renderExpirationTime);
        case ContextProvider:
            //TODO: updateContextProvider 구현
            return updateContextProvider(current, workInProgress, renderExpirationTime);
        case SimpleMemoComponent:
            //TODO: updateSimpleMemoComponent 구현
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
