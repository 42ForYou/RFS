import { prepareToReadContext, propagateContextChange, pushProvider, readContext } from "../context/newContext.js";
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
    ForwardRef,
} from "../const/CWorkTag.js";
import { Placement, PerformedWork } from "../const/CSideEffectFlags.js";
import { Update as UpdateEffect, Passive as PassiveEffect } from "../const/CSideEffectFlags.js";
import { cloneChildFibers, reconcileChildFibers, mountChildFibers } from "../fiber/childFiber.js";
import renderWithHooks from "../hooks/core/renderWithHooks.js";
import { shallowEqual } from "../shared/sharedEqual.js";
import { markUnprocessedUpdateTime } from "./workloop.js";
import { pushHostContainer, pushHostContext } from "../fiber/fiberHostContext.js";
import { processUpdateQueue } from "../core/UpdateQueue.js";

import is from "../shared/objectIs.js";

/**
 *
 * @param {TFiber|null} current
 * @param {TFiber} workInProgress
 * @param {any} nextChildren
 * @param {TExpirationTime} renderExpirationTime
 * @description 해당함수는 현재 파이버의 자식을 재조정하는 함수입니다.
 */
export const reconcileChildren = (current, workInProgress, nextChildren, renderExpirationTime) => {
    if (current === null) {
        //TODO: mountChildFibers 구현
        // 아직 렌더링되지 않은 새 컴포넌트인 경우, 우리는
        // 최소한의 sideEffect을 적용하여 자식 집합을 업데이트하지 않습니다. 대신
        // 렌더링되기 전에 자식에 모두 추가합니다(모든 사이드 이펙트를 가함). 즉
        // 부작용을 추적하지 않음으로써 이 조정 패스를 최적화할 수 있습니다.
        workInProgress.child = mountChildFibers(workInProgress, null, nextChildren, renderExpirationTime);
    } else {
        //TODO: reconcileChildFibers 구현
        // 현재 자식이 진행 중인 작업과 동일하면 다음을 의미합니다.
        // 아직 이 자식에 대한 작업을 시작하지 않았다는 뜻입니다. 따라서 우리는
        // 복제 알고리즘을 사용하여 현재 모든 자식의 복사본을 만듭니다.

        // 이미 진행 중인 작업이 있다면 이 시점에서는 유효하지 않으므로
        // 버리겠습니다.
        workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren, renderExpirationTime);
    }
};
/**
 * @param {TFiber} current
 * @param {TFiber} workInProgress
 * @param {TFiber} renderExpirationTime
 * @returns {TFiber|null}
 * @description HostRootComponent를 업데이트하는 함수
 */
const updateHostRoot = (current, workInProgress, renderExpirationTime) => {
    //파이버스택에 현재 파이버루트의 컨텍스트를 넣어준다.
    pushHostRootContext(workInProgress);
    const updateQueue = workInProgress.updateQueue;
    const nextProps = workInProgress.pendingProps;

    //updateQueue에서(processUpdateQueue)에서 기록한 state를 보관하고 있음
    const prevState = workInProgress.memoizedState;
    //updateContainer에서 update.payload = {element}이런식으로 payload를 보관하고
    //process되면 memoizedState가 이 updateState를 가르킬텐데-> 그렇게 되면
    //prevState.element에는 payload의 element:element이런식으로 프로퍼티 형태로 들어가있음
    const prevChildren = prevState !== null ? prevState.element : null;

    //updateQueue를 처리한다
    processUpdateQueue(workInProgress, updateQueue, nextProps, renderExpirationTime);
    //updateQueue를 처리한 후에는 memoizedState가 바뀌었을 수 있으므로 다시 가져온다.
    const nextState = workInProgress.memoizedState;
    const nextChildren = nextState.element;
    //이전 자식과 같으면 bailout
    if (nextChildren === prevChildren) {
        return bailoutOnAlreadyFinishedWork(current, workInProgress, renderExpirationTime);
    }
    reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime);
    return workInProgress.child;
};

/**
 *
 * @param {TFiber} current
 * @param {TFiber} workInProgress
 * @description ref가 교체 되었으면 effectTag에 Ref를 업데이트 해야된다라고 마킹하는 함수
 */
const markRef = (current, workInProgress) => {
    const ref = workInProgress.ref;
    if ((current === null && ref !== null) || (current !== null && current.ref !== ref)) {
        workInProgress.effectTag |= Ref;
    }
};

/**
 *
 * @param {TFiber} current
 * @param {TFiber} workInProgress
 * @param {TExpirationTime} renderExpirationTime
 * @returns {TFiber | null}
 * @description HostComponent를 업데이트하는 함수 호스트 컴포넌트는 문자열하나만 자식으로 가지고 있을떄 특수처리합니다.
 */
const updateHostComponent = (current, workInProgress, renderExpirationTime) => {
    //파이버스택에 현재 hostContext를 푸시한다.
    pushHostContext(workInProgress);

    const type = workInProgress.type;
    const nextProps = workInProgress.pendingProps;
    const prevProps = current !== null ? current.memoizedProps : null;

    let nextChildren = nextProps.children;
    //TODO: shouldSetTextContent 구현 DOM모듈에서
    //호스트 컴포넌트는 자식으로 문자열 하나만 가지고 있을떄 해당 문자열을 파이버로 만들지 않음.
    //TODO: 위에 설명확인
    const isDirectTextChild = shouldSetTextContent(type, nextProps);
    if (isDirectTextChild) {
        //이것은 문자열을 파이버로 만들지 않기 위해 초기화합니다.
        // 호스트 노드의 직접 텍스트 자식을 특수 처리합니다. 이것은 일반적인
        // 케이스입니다. 재정의된 자식으로 처리하지 않습니다. 대신 이 프로퍼티에 액세스할 수 있는 호스트 환경에서
        // 이 프로퍼티에 액세스할 수 있는 호스트 환경에서 처리합니다. 그
        // 다른 HostText 파이버를 할당하고 순회하는 것을 방지합니다.
        nextChildren = null;
    } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
        // 직접 텍스트 자식에서 일반 자식으로 전환하는 경우 또는
        // 비어있는 경우 텍스트 콘텐츠가 재설정되도록 예약해야 합니다.

        //여기서 문자열이 아닌 다음 자식을 삽입하기전에 current가 문자열만 가졌다면
        //제거해주고 삭제해야됨
        //그러나 fiber로 따로 만들지 않았기 떄문에 삭제 로직을 타지 않는데
        //이를 따로 처리해주기 위해 ContentReset을 마킹해준다.
        workInProgress.effectTag |= ContentReset;
    }

    //hostComponent가 업데이트 되면 ref도 업데이트되기 떄문에 마킹
    markRef(current, workInProgress);

    //NOTE: check OffScreen 구현해야 되는지 확인

    reconcileChildren(current, workInProgress, nextChildren, renderExpirationTime);
    return workInProgress.child;
};
/**
 *
 * @param {TFiber | null} _current @see 파일경로: /type/TFiber.js
 * @param {TFiber} workInProgress @see 파일경로: /type/TFiber.js
 * @param {lambda} Component
 * @param {TExpirationTime} renderExpirationTime @see 파일경로: /type/TExpirationTime.js
 * @returns {TFiber|null} @see 파일경로: /type/TFiber.js
 * @description function Component를 마운트하는 함수
 */
const mountIndeterminateComponent = (_current, workInProgress, Component, renderExpirationTime) => {
    if (_current !== null) {
        //NOTE: 오직 susPense가 일어난 상황에서만 일어나는 로직 - 빼야되는지 확인
        // An indeterminate component only mounts if it suspended inside a non-
        // concurrent tree, in an inconsistent state. We want to treat it like
        // a new mount, even though an empty version of it already committed.
        // Disconnect the alternate pointers.
        _current.alternate = null;
        workInProgress.alternate = null;
        // Since this is conceptually a new fiber, schedule a Placement effect
        workInProgress.effectTag |= Placement;
    }

    const props = workInProgress.pendingProps;

    //context를 사용하기 전에 context의 해당 값들을 초기화 해주는 함수
    prepareToReadContext(workInProgress, renderExpirationTime);
    const value = renderWithHooks(null, workInProgress, Component, props, null, renderExpirationTime);

    workInProgress.effectTag |= PerformedWork;

    if (
        typeof value === "object" &&
        value !== null &&
        typeof value.render === "function" &&
        value.$$typeof === undefined
    ) {
        console.error("not supported ClassComponent in mountIndeterminateComponent");
        throw new Error("not supported ClassComponent in mountIndeterminateComponent");
    } else {
        workInProgress.tag = FunctionComponent;
        reconcileChildren(null, workInProgress, value, renderExpirationTime);
        return workInProgress.child;
    }
};

/**
 *
 * @param {TFiber} current
 * @param {TFiber} workInProgress
 * @param {TExpirationTime} expirationTime
 * @description update를 하게되면 component를 실행시키게 되는데 업데이트가 안되면 그 전 관련
 * @description 훅작업을 취소 시켜야됨 그것의 역할을 하는 함수
 */
const bailoutHooks = (current, workInProgress, expirationTime) => {
    //훅의 잔여물을 제거하는 역할
    workInProgress.updateQueue = current.updateQueue;
    //passiveEffect랑 updateEffect를 제거하는 역할
    workInProgress.effectTag &= ~(PassiveEffect | UpdateEffect);
    //현재 expirationTime보다 이후것 생겼으면 잔여물->제거
    if (current.expirationTime <= expirationTime) {
        current.expirationTime = NoWork;
    }
};

/**
 * @param {TFiber | null} _current
 * @param {TFiber} workInProgress
 * @param {lambda} Component
 * @param {any} nextProps
 * @param {TExpirationTime} renderExpirationTime
 * @returns {TFiber|null}
 * @description function Component를 업데이트하는 함수
 */
const updateFunctionComponent = (_current, workInProgress, Component, nextProps, renderExpirationTime) => {
    prepareToReadContext(workInProgress, renderExpirationTime);
    const nextChildren = renderWithHooks(_current, workInProgress, Component, nextProps, null, renderExpirationTime);

    // beginWork()에서 확인한 결과 props는 변경되지 않았다.
    // 하지만 업데이트가 발생한 컴포넌트이므로 호출되어야 한다.
    // 컴포넌트 호출 후에도 didReceiveUpdate는 여전히 false임을 미루어보아 컴포넌트 상태 또한 변경되지 않았다.
    // props, state 모두 변경되지 않았다면 서브 트리 또한 변경될 부분이 없으므로 Work를 여기서 끊어주게 될 경우 불필요한 작업을 하지 않아도 된다.
    // 문제는 컴포넌트가 한번은 호출되었기 때문에 라이프 사이클 훅(useEffect(), useLayoutEffect())의 잔여물이 fiber에 남아있다.
    // 잔여물을 제거하고 bailoutOnAlreadyFinishedWork()를 진행한다. 만약 자손에서 업데이트 컴포넌트가 있다면 자식 workInProgress가 반환되어 계속해서 밑으로 Work가 진행될 것이지만, 없다면 여기서 Work는 종료된다.
    if (_current !== null && !didReceiveUpdate) {
        bailoutHooks(_current, workInProgress, renderExpirationTime);
        return bailoutOnAlreadyFinishedWork(_current, workInProgress, renderExpirationTime);
    }

    workInProgress.effectTag |= PerformedWork;
    reconcileChildren(_current, workInProgress, nextChildren, renderExpirationTime);
    return workInProgress.child;
};
/**
 *
 * @param {TFiber|null} _current
 * @param {TFiber} workInProgress
 * @param {lambda} Component
 * @param {any} nextProps
 * @param {TExpirationTime} renderExpirationTime
 * @returns {TFiber|null}
 * @description forwardRef를 업데이트하는 함수 updateFunctionComponent와 로직이 거의 일치하는데
 * @description ref를 인자로 받을 수 있도록 render라는 이름의 lambda를 통해 포팅하여 내부적으로 구현한다.
 */
const updateForwardRef = (_current, workInProgress, Component, nextProps, renderExpirationTime) => {
    //updateFunctionComponent랑 거의 일치하는 로직인데, 내부적으로
    //component부분에 ref라는 두번째 인자를 받을 수 있는 형식으로 render라는 Lambda로 포팅하여
    //lamda(render)를 받고 내부적으로 renderWithHooks를 넘겨줄떄 기본 방식의 props만 받는
    //Component를 넘겨주는게 아니라 포팅한 Render를 넣어줘서 ref를 인자로 받을 수 있게 해준다.
    const render = Component.render;
    const ref = workInProgress.ref;

    prepareToReadContext(workInProgress, renderExpirationTime);
    const nextChildren = renderWithHooks(_current, workInProgress, render, nextProps, ref, renderExpirationTime);
    if (_current !== null && !didReceiveUpdate) {
        bailoutHooks(_current, workInProgress, renderExpirationTime);
        return bailoutOnAlreadyFinishedWork(_current, workInProgress, renderExpirationTime);
    }
    workInProgress.effectTag |= PerformedWork;
    reconcileChildren(_current, workInProgress, nextChildren, renderExpirationTime);
    return workInProgress.child;
};
/**
 *
 * @param {TFiber|null} current @see 파일경로: /type/TFiber.js
 * @param {TFiber} workInProgress @see 파일경로: /type/TFiber.js
 * @param {TExpirationTime} renderExpirationTime @see 파일경로: /type/TExpirationTime.js
 * @description 1.컴포넌트의 props나 state가 변경되지 않았을 때
 * @description     1.a이미 처리된 작업의 결과를 재사용할 수 있을 때
 * @description         1.a.가)더 높은 우선순위의 작업이 있어서 현재 작업을 나중으로 미룰 필요가 있을 때
 * @description 사용 되며, 이전 작업을 재사용하고(자식의 childExtime도 update필요 없을떄), 필요하다면 자식만 clone하여 사용합니다.
 * @returns {TFiber|null} @see 파일경로: /type/TFiber.js
 */
const bailoutOnAlreadyFinishedWork = (current, workInProgress, renderExpirationTime) => {
    if (current !== null) {
        // Reuse previous dependencies
        //dependencies는 현재 파이버의 관련 contextList라할 수 있는데 그것을
        //current에 있는걸 그대로 가져온다.-> context리스트도 업데이트 되지 않으니까
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
        case ForwardRef: {
            const type = workInProgress.type;
            const resolvedProps = workInProgress.pendingProps;
            return updateForwardRef(current, workInProgress, type, resolvedProps, renderExpirationTime);
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
