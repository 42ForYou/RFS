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
import { popHostContainer, popHostContext, getRootHostContainer } from "../fiber/fiberHostContext.js";
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
                //TODO: updateHostComponent 구현
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

                //TODO: appendAllChildren 구현
                //만들어진 dom인스턴스를 workInProgress에 연결한다.
                appendAllChildren(instance, workInProgress, false, false);

                workInProgress.stateNode = instance;
                if (
                    //TODO: finalizeInitialChildren 구현
                    //dom과 관련되서 수행해야되는 이벤트, 속성, 관련된 많은 작업들을 다 처리한다.
                    finalizeInitialChildren(instance, type, newProps, rootContainerInstance, currentHostContext)
                ) {
                    markUpdate(workInProgress);
                }

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
                //TODO: updateHostText 구현
                //현재와 새로운 프롭스를 비교하여 업데이트를 예약한다.
                updateHostText(current, workInProgress, oldText, newText);
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
