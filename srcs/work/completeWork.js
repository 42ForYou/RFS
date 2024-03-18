import {
    HostRoot,
    HostComponent,
    IndeterminateComponent,
    SimpleMemoComponent,
    FunctionComponent,
    Fragment,
    ContextProvider,
} from "../const/CWorkTag.js";
import { popProvider } from "../context/newContext.js";
import { popHostContainer, popHostContext, getRootHostContainer, getHostContext } from "../fiber/fiberHostContext.js";
import { Ref } from "../const/CWorkTag.js";

/**
 *
 * @param {TFiber} workInProgress
 * @description 해당 wip에 Ref SideEffect를 마킹한다.
 */
const markRef = (workInProgress) => {
    workInProgress.effectTag |= Ref;
};
/**
 *
 * @param {TFiber} workInProgress
 * @description 해당 wip에 Update SideEffect를 마킹한다.
 */
const markUpdate = (workInProgress) => {
    workInProgress.effectTag |= Update;
};

/**
 *
 * @param {any} parent ->domInstance TODO:domInstance의 타입을 정의해야함
 * @param {TFiber} workInProgress
 * @description 한 레벨 내에 있는 모든 dom자식들을 새로 생성된 parent에 연결하는 함수이다.
 * @description dom의 레벨과 파이버의 레벨은 다를 수 있기 때문에 이를 수행할 수 있는 로직이 필요하다.
 * @description 관련 로직은 아래의 알고리즘에 정의되어 있다.
 */
const appendAllChildren = (parent, workInProgress) => {
    // 우리는 생성된 최상위 파이버만 가지고 있지만, 그 파이버의
    // 자식까지 재귀해야 모든 터미널 노드를 찾을 수 있습니다.

    //핵심은 한 레벨 아래의 자식들을 새로 생성된 parent에 연결하는 것인데,
    //파이버의 레벨과 dom구조의 레벨은 다를 수 있기 때문에
    //그것을 수행할 수 있는 로직이 필요합니다.
    //아래 알고리즘은 해당 로직을 수행하는 알고리즘입니다.
    let node = workInProgress.child;
    while (node !== null) {
        if (node.tag === HostComponent || node.tag === HostText) {
            //TODO: appendInitialChild 구현 ==>dom모듈
            //host관련 fiber일 경우 dom인스턴스를 parent에 연결한다.
            appendInitialChild(parent, node.stateNode);
        } else if (node.child !== null) {
            //NOTE: return을 node로 설정하는 이유는 제대로 설정이 되어있겠지만, 안전을 위해 설정한다.
            node.child.return = node;
            //한레벨 내의 dom자식을 못 찾았다면 다음 레벨로 내려간다.
            node = node.child;
            continue;
        }
        //순회를 맞추고 workInprogress로 돌아왔다면 종료한다.
        if (node === workInProgress) {
            return;
        }
        //해당 코드로 오는 경우의 수는 두가지 이다. 한 레벨 내에 dom을 찾아서 dom에 연결을 완료했거나
        //한 레벨 내에 dom을 찾지 못하고 다음 레벨로 내려가다가 child가 없는 leaf노드에 도달한 경우이다.
        //두가지 경우 모두 가능성 있는 선택지를 선택해야 되는데 형제가 없는 경우에만 위로 올라가야 한다.
        //형제가 없는 경우에만 위로 올라가야 하는 이유는 형제가 있다면 형제로 이동하여 같은 레벨의 다른 노드를 탐색해야 하기 때문이다.
        while (node.sibling === null) {
            if (node.return === null || node.return === workInProgress) {
                return;
            }
            node = node.return;
        }
        //형제가 있다면 형제로 이동한다.
        //NOTE: return을 node로 설정하는 이유는 제대로 설정이 되어있겠지만, 안전을 위해 설정한다.
        node.sibling.return = node.return;
        node = node.sibling;
    }
};

/**
 *
 * @param {TFiber} workInProgress
 * @param {string} oldText
 * @param {string} newText
 * @description oldText와 newText를 비교하여 HostText의 업데이트를 예약한다.
 */
const updateHostText = (workInProgress, oldText, newText) => {
    if (oldText !== newText) {
        markUpdate(workInProgress);
    }
};
/**
 *
 * @param {TFiber} current
 * @param {TFiber} workInProgress
 * @param {any} type : domElementType TODO:관련 타입을 dom모듈에서 정의해야함
 * @param {any} newProps : domProps TODO:관련 타입을 dom모듈에서 정의해야함
 * @param {TDOMContainer} rootContainerInstance @see 파일경로: type/TDomType.js
 */
const updateHostComponent = (current, workInProgress, type, newProps, rootContainerInstance) => {
    // wip.alternate가 있다면, 이는 업데이트이며 업데이트를 수행하려면
    // 업데이트를 수행하기 위해 사이드 이펙트를 예약해야 합니다.
    const oldProps = current.memoizedProps;
    if (oldProps === newProps) {
        //Mutation을 가해야 되는 상황에서 oldProps와 newProps가 같다면
        //bailout을 수행한다.
        //심지어 자식이 바뀐상황일지라도 이는 무시한다.
        //해당 부분은 부모의 props변경을 주지 않는 자식의 변경에 대한 최적화이기도 하다.
        //NOTE: 일반적으로, 컴포넌트의 자식 변경은 컴포넌트 자체의 업데이트를 트리거하지만,
        //NOTE: 왜냐하면 자식의 변경에 반응하여 다르게 렌더링해야 할 수도 있기 때문인데.
        //NOTE: 하지만, 이 코드 조각은 props 자체가 변경되지 않았다면,
        //NOTE: 자식이 변경되었다 하더라도 컴포넌트가 업데이트되지 않는 상황을 나타낸다.
        //NOTE: 이는 불필요한 렌더링과 비교를 피하기 위한 성능 최적화이다.
        //NOTE: 처음에는 자식의 변경이 부모 컴포넌트의 재렌더링을 필요로 한다고 예상할 수 있지만,
        //NOTE: 재조정 알고리즘은 특정 조건 하에서 부모 컴포넌트를 재렌더링하지 않고도
        //NOTE: 자식을 직접 DOM에 업데이트할 수 있을 만큼 충분히 똑똑함.
        //NOTE: 예) 예시로, 만약 당신이 TodoList 컴포넌트를 가지고 있고,
        //NOTE: 이 컴포넌트의 props로 todos 배열을 받는다고 가정.
        //NOTE: todos 배열 자체는 변경되지 않았지만, 배열 내의 특정 할 일 항목의 완료 상태만이 변경되었다면,
        //NOTE: React는 TodoList 컴포넌트 자체를 업데이트하지 않을 수 있습니다.
        //NOTE:이 최적화는 props(렌더 함수의 입력)가 변경되지 않았다면,
        //NOTE: 컴포넌트가 그 props의 "순수" 함수라고 가정할 때,
        //NOTE: 출력(렌더링된 자식)은 이론적으로 변경할 필요가 없다는 것을 근거로 함.
        //NOTE: 따라서 React는 컴포넌트 자체의 재조정 과정을 건너뛸 수 있지만,
        //NOTE: 자신의 props와 상태에 따라 필요에 따라 자식을 재조정하고 업데이트할 것.
        return;
    }

    // If we get updated because one of our children updated, we don't
    // have newProps so we'll have to reuse them. TODO: 해당 부분의 의미를 찾아볼 필요가 있음

    //update를 하기위해서 domInstance와 관련된 Context를 가져온다.
    const instance = workInProgress.stateNode;
    const currentHostContext = getHostContext();

    //TODO: prepareUpdate 구현
    //dom업데이트를 위한 payload를 준비한다.->dom연산 업데이트를 예약한다
    const updatePayload = prepareUpdate(instance, type, oldProps, newProps, rootContainerInstance, currentHostContext);
    //wip의 업데이트 큐를 dom업데이트를 위한 payload로 갱신한다.
    workInProgress.updateQueue = updatePayload;

    //만약 update가 존재한다면 해당 wip에 Update SideEffect를 마킹한다.
    if (updatePayload) {
        markUpdate(workInProgress);
    }
};
/**
 *
 * @param {TFiber|null} current
 * @param {TFiber} workInProgress
 * @param {TExpirationTime} renderExpirationTime
 * @returns {null} only return null in Rfs
 * @description host환경과 관련된 작업을 수행하는 함수이다. 여기서 관련된 작업이란 파이버 스택과 관련된 작업과
 * @description 돔연산의 예약(update)을 수행하거나, dom연산을 메모리에만 수행하는 것이다.
 * @description 여기서 핵심은 dom연산을 가해야 되는 상황도 memory에만 가해진다라는 것이다.
 * @description dom연산을 메모리에서 만 가한다라는 것은 domApi를 호출해 domInstance를 만드나
 * @description 실제 paint할떄 연결되는 document에는 연결하지 않는다는 것이다.
 * @description 그래서 일반적인 tag에서는 작업이 생략되고 파이버 스택과 관려된 작업을 해야하는 것만 fiber작업을 수행한다.
 * @description 돔과 밀접한 관련이 있는 작업만 따로 돔 작업을 수행하는데 이건 앞서 말한 것 처럼 두가지로 진행된다
 * @description 첫쨰로 해당 hostComponent나 hostText가 이미 document에 연결되어 있는 경우는 업데이트를 달아 두는 식으로
 * @description 커밋 단계에 수행하도록 준비하고(이는 여기서 돔연산을 수행해버리면 해당 연산결과가 바로 반영되기 때문이다)
 * @description 두번째로 해당 hostComponent나 hostText가 document에 연결되어 있지 않은 경우는 바로 dom연산을 수행해 해당 파이버에
 * @description 달아 둔다 이렇게 달아두더라도 document에는 연결이 되어있지 않기떄문에 브라우저 페인팅에 영향을 주지 않는다.
 */
export const completeWork = (current, workInProgress, renderExpirationTime) => {
    const newProps = workInProgress.pendingProps;

    switch (workInProgress.tag) {
        case IndeterminateComponent:
        case SimpleMemoComponent:
        case FunctionComponent:
            break;
        case HostRoot: {
            //HostRoot관련 Context들을 pop한다.
            popHostContainer();
            break;
        }
        case HostComponent: {
            //현재 HostComponent와 관련된 Context들을 pop한다.
            popHostContext(workInProgress);
            //현재 RootContainerInstance를 가져온다.
            const rootContainerInstance = getRootHostContainer();
            const type = workInProgress.type;
            //현재 current가 있고 이미 document에 연결되어 있다면 예약을 하는 방식으로 업데이트를 예약한다.
            if (current !== null && workInProgress.stateNode !== null) {
                //현재와 새로운 프롭스를 비교하여 업데이트를 예약한다.
                updateHostComponent(current, workInProgress, type, newProps, rootContainerInstance);
                //updateHostComponent에 의해 ref결과가 바뀌었다면 Ref관련된 사이드 이펙트를 수행한다.
                if (current.ref !== workInProgress.ref) {
                    markRef(workInProgress);
                }
            } else {
                //이미 document에 연결되어 있지 않으면 dom연산을 바로 수행하더라도
                //브라우저 렌더, 페인팅에 영향을 주지 않는다.
                if (!newProps) {
                    console.error("newProps is null in completeWork");
                    throw new Error("newProps is null in completeWork");
                }

                //현재 HostComponent와 관련된 Context들을 가져온다.
                const currentHostContext = getHostContext();

                //dom인스턴스를 생성한다.
                //TODO: createInstance 구현 dom모듈
                const instance = createInstance(
                    type,
                    newProps,
                    rootContainerInstance,
                    currentHostContext,
                    workInProgress
                );

                //만들어진 dom인스턴스를 workInProgress에 연결한다.
                //NOTE: 여기서 핵심은 completeWork는 자식부터 부모로 올라가면서 작업을 수행하는데
                //NOTE: 그렇다라는건 여기서 만들어지는 instance가 부모가 되고, 생성된 아래 자식들을 부모와 연결하는 작업을 수행한다는 것이다.
                appendAllChildren(instance, workInProgress);

                workInProgress.stateNode = instance;
                if (
                    //TODO: finalizeInitialChildren 구현 ==>dom모듈
                    //dom과 관련되서 수행해야되는 이벤트, 속성, 관련된 많은 작업들을 다 처리한다.
                    finalizeInitialChildren(instance, type, newProps, rootContainerInstance, currentHostContext)
                ) {
                    markUpdate(workInProgress);
                }

                //만약 workInProgress에 ref가 있다면 Ref SideEffect를 마킹한다.
                if (workInProgress.ref !== null) {
                    markRef(workInProgress);
                }
            }
            break;
        }
        case HostText: {
            const newText = newProps;
            //현재 HostText가 document에 연결되어 있다면 예약을 하는 방식으로 업데이트를 예약한다.
            if (current && workInProgress.stateNode !== null) {
                const oldText = current.memoizedProps;
                //현재와 새로운 프롭스를 비교하여 업데이트를 예약한다.
                updateHostText(workInProgress, oldText, newText);
            } else {
                if (typeof newText !== "string") {
                    console.error("newText is not string in completeWork");
                    throw new Error("newText is not string in completeWork");
                }
                //rootInstance를 가져온다.
                const rootContainerInstance = getRootHostContainer();
                //현재 HostText와 관련된 Context들을 가져온다.
                const currentHostContext = getHostContext();
                //TODO: createTextInstance 구현
                //dom인스턴스를 생성해서 workInProgress에 연결한다.
                workInProgress.stateNode = createTextInstance(
                    newText,
                    rootContainerInstance,
                    currentHostContext,
                    workInProgress
                );
            }
            break;
        }
        case Fragment: {
            break;
        }
        case ContextProvider: {
            //ContextProvider와 관련된 Context들을 pop한다.
            popProvider(workInProgress);
            break;
        }
        case MemoComponent: {
            break;
        }
        default: {
            console.error(`Not implemented tag :${workInProgress.tag} In completeWork`);
            throw new Error("Not implemented");
        }
    }

    return null;
};
