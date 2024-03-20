import { NoEffect, Passive } from "../const/CSideEffectFlags.js";
import { FunctionComponent, HostComponent, HostText, SimpleMemoComponent } from "../const/CWorkTag.js";
import { NoHookEffect, UnmountPassive, MountPassive } from "../const/CHookEffectTag.js";

/**
 *
 * @param {THookEffectTag} unmountTag
 * @param {THookEffectTag} mountTag
 * @param {TFiber} finishedWork
 * @description 해당 함수는 hookEffectList를 커밋하는 함수이다.
 * @description NOTE: 주의 해야 될점은 여기서 updateQueue에 있는 effect들을 처리한 다라는 것이다.
 * @description 이 함수는 unmount할 tag와 mount할 tag를 인자로 받음으로 써
 * @description 좀 더 일반적으로 각각의 상황에서 unmount할 상황(tag)과 mount할 상황(tag)을
 * @description 지정하여 처리할 수 있도록 일반화 했다.
 * @description 기본적으로 destroy는 undefined로써 create가 동작하고 나서야 destroy들어가서
 * @description 다음 호출 부터 destroy가 동작하게 하는 방식으로 동작한다.
 */
const commitHookEffectList = (unmountTag, mountTag, finishedWork) => {
    const updateQueue = finishedWork.updateQueue;
    const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
    if (lastEffect !== null) {
        const firstEffect = lastEffect.next;
        let effect = firstEffect;
        do {
            if ((effect.tag & unmountTag) !== NoHookEffect) {
                //Unmount
                //NOTE :unmount를 소비해야되는데 소비했다라는 명시로 undefined로 처리한다
                //NOTE: 그리고 소비할 것이 undefined가 아니라면 destroy(cleanup)을 호출한다
                const destroy = effect.destroy;
                effect.destroy = undefined;
                if (destroy !== undefined) {
                    destroy();
                }
            }
            if ((effect.tag & mountTag) !== NoHookEffect) {
                // Mount
                //NOTE: mount될떄는 cleanUp을 부르지 않게 하기 위해
                //NOTE: effect.destroy를 undefined로 생성하는데
                //NOTE: create가 하고 나서는 destroy를 보관하고 있어야한다
                const create = effect.create;
                effect.destroy = create();
            }
            effect = effect.next;
        } while (effect !== firstEffect);
    }
};
/**
 *
 * @param {TFiber} finishedWork
 * @description passiveHookEffect를 커밋하는 함수이다
 * @description 이말은 해당 fiber(sideEffect)의 updateQueue(FunctionUpdateQueue)를 커밋하는 함수이다.
 * @description 만약 기존의 sync가 있다면 sync를 destroy하고
 * @description 새로운 sync를 create하는 방식으로 동작한다.
 */
export const commitPassiveHookEffects = (finishedWork) => {
    if ((finishedWork.effectTag & Passive) !== NoEffect) {
        switch (finishedWork.tag) {
            case FunctionComponent:
            case SimpleMemoComponent: {
                //HookEffect를 커밋하는 방식은 unMount할 HookEffectTag와, mount할 HookEffect를 지정하여 호출하는 방식이다.
                //기본적으로 commitPassiveHookEffect란, UnMountPassive가 마킹되어 있는 effect를 대상으로
                //처리하여, destroy(cleanup)을 수행시키고, MountPassive가 마킹되어 있는 effect에 대해서 create(sync)를
                //수행시킨후 cleanup을 destroy에 넣어두는것이 원하는 useEffect의 동작이다.
                //기본적으로 useEffect를 통해서 외부시스템과 새로운 sync를 시작하기전에 이전 sync를 끊는 작업이 필요한데 이는
                //sync(create)가 수행된 작업만 수행되는것이 타당하다.
                //commithookEffectList는 그러한 동작을 좀더 일반적으로 사용할 수 있도록 추상화한 함수이다.
                //해당 함수는 unMount하고 싶은 tag와  mount하고 싶은 tag를 인자로 받아서 처리하는 방식으로 일반화된 함수이다.
                commitHookEffectList(UnmountPassive, NoHookEffect, finishedWork);
                commitHookEffectList(NoHookEffect, MountPassive, finishedWork);
                break;
            }
            default:
                break;
        }
    }
};

/**
 *
 * @param {TFiber} finishedWork
 * @description 해당 함수는 해당 파이버의 ref를 attach하는 함수이다.(커밋)
 */
export const commitAttachRef = (finishedWork) => {
    const ref = finishedWork.ref;
    if (ref !== null) {
        const instance = finishedWork.stateNode;
        let instanceToUse;
        switch (finishedWork.tag) {
            case HostComponent:
                //TODO: implement getPublicInstance =>dom모듈
                instanceToUse = getPublicInstance(instance);
                break;
            default:
                instanceToUse = instance;
        }
        if (typeof ref === "function") {
            ref(instanceToUse);
        } else {
            ref.current = instanceToUse;
        }
    }
};
/**
 *
 * @param {TFiber} fiber
 * @returns {boolean}
 * @description 해당 파이버가 host부모가 될 수 있는지를 판단하는 함수이다.
 */
const isHostParent = (fiber) => {
    return fiber.tag === HostComponent || fiber.tag === HostRoot;
};

/**
 *
 * @param {TFiber} fiber
 * @returns {TFiber} fiber
 * @description 한레벨 위 즉 가장 가까운 host부모를 찾는 함수이다.
 * @description 파이버 구조와 dom구조의 레벨이 다르기 때문에 이를 고려하면서 찾아야한다.
 */
const getHostParentFiber = (fiber) => {
    let parent = fiber.return;
    while (parent !== null) {
        if (isHostParent(parent)) {
            return parent;
        }
        parent = parent.return;
    }

    //만약 host부모가 없다면 로직적으로 문제가 있는것이다.
    console.error("Can not find HostParentFiber in getHostParentFiber");
    throw new Error("Can not find HostParentFiber in getHostParentFiber");
};

/**
 *
 * @param {TFiber} fiber
 * @returns {TDOMInstance} domInstance TODO: domInstance를 정의해야한다.=>dom모듈
 * @description 해당 파이버의 한 레벨 위의 가장 가까운 오른쪽 현재를 찾는 알고리즘이다.
 * @description 일단 만족할 수 없는 조건으로는 placement가 명시 되어있으면 바뀔 수 있고(후위 순회라 이후에 처리)
 * @description 결과가 잘못 될 수 있기 때문에 이를 고려해서 placement가 before가 될 수 없다.
 * @description 기본적으로 트리를 순회하는 알고리즘으로 step a: 위로 이동, step b: 오른쪽으로 이동, step c: 아래로 이동이다.
 * @description 1. 현재 포인트에서 가능한 자식에 경우의 수를 모두 보고 다시 돌아와서
 * @description 2. 현재 포인트에서 가능한 형제에 경우의 수를 모두 보고 다시 돌아와서
 * @description 3. 현재 포인트에서 가능한 부모로 이동해서 1번 부터 다시 시작하는 방식으로 동작한다.
 */
const getHostSibling = (fiber) => {
    // 형제 호스트를 찾을 때까지 트리에서 앞으로 검색.
    // 노드를 찾을 때까지 트리를 앞으로 검색함.
    let node = fiber;
    sibiings: while (true) {
        //NOTE:  check a) 현재 포인트가 가능성이 없으면 레벨 위로 이동 step a)를 해야되면 a를 진행
        //NOTE: 위로 진행할떄는 형제가 없어야 가능.
        while (node.sibling === null) {
            //NOTE: finish) 오른쪽을 다 순회 했는데도 못찾고 step a)를 했을떄 부모로 도달=>before 없음
            if (node.return === null || isHostParent(node.return)) {
                //만약 node가 root거나 parent파이버에 도달했다면 lastSibiling이 였다는 것이고
                //원하는 sibling을 찾지 못했다는 것이다.
                return null;
            }
            //NOTE: step a)를 만들어냄 step a): 위로올라감
            node = node.return;
        }
        //NOTE: b) 형제를 탐색하러 이동하는 무빙
        node.sibling.return = node.return;
        //NOTE: step b)를 만들어냄 step b): 오른쪽으로 이동
        node = node.sibling;

        //NOTE: 해당 포인트가 가능성이 있는지 확인 하게 하기 위하여 stepC)를 해야될지 결정
        //NOTE: step C란 가능성 탐색을 하기 위해 자식으로 이동하는 것
        //NOTE: 만약 현재 포인트가 host일 가능성이 있으면 검사하는 로직(check)으로 감
        //NOTE: check c)
        while (node.tag !== HostComponent && node.tag !== HostText) {
            //NOTE: 해당 포인트에 placeMent가 있다면 해당 포인트로 파생된 친구들은 다 가능성이 없음
            //NOTE: 위로 올라갈지 check하는 check a)로 이동
            if (node.effectTag & Placement) {
                //NOTE: check a)로직으로 가서 위로 올라가는 무빙을 검사해야됨
                continue sibiings;
            }
            if (node.child === null) {
                //NOTE: 자식이 없으면 check a)로직으로 가서 위로 올라가는 무빙을 검사해야됨

                continue sibiings;
            } else {
                //NOTE: step c)를 만들어냄
                node.child.return = node;
                //NOTE: step c)를 만들어냄 step c): 아래로 이동 (자식포인트로 내려가는무빙)
                node = node.child;
            }
        }

        //NOTE: check find) 로직--> 이 친구가 before이 될 수 있는지(before이 되려면 placement가 아니여야 한다)
        if (!(node.effectTag & ContentReset)) {
            //찾았음
            return node.stateNode;
        }
    }
};
/**
 *
 * @param {TFiber} finishedWork
 * @description 해당 함수는 placeMent에 대한 커밋을 진행하는 함수로써
 * @description 기본적으로 배치와 관련된 일을 처리하는 함수이다.
 * @description 먼저 한 레벨위의 host기준 부모를 찾고, 그 부모에게 자식들을 붙이는 방식으로 동작한다.
 * @description 그리고 host기준 같은 레벨의 가장 인접한 오른쪽 형제를 (before)를 찾아서 그것 왼쪽에 붙이는 방식으로 동작한다.
 * @description 그리고 커밋을 하면서 붙이는 방식은 한 레벨 아래의 자식들만 부모에게 붙이는 것이다.
 * @description 이는 commitPlacement는 자식부터 진행되고, 그럼 부모에게 자식들을 한레벨 씩 붙이면
 * @description 재귀적으로 부모에게 붙이는것이 되기 때문이다.
 */
export const commitPlacement = (finishedWork) => {
    //재귀적으로 가장 가까운 한 레벨위의 host기준 부모를 찾는다.
    //이는 파이버 구조와 dom구조의 레벨이 다르기 때문에 이를 고려하면서 찾아야한다.
    const parentFiber = getHostParentFiber(finishedWork);

    let parent;
    let isContainer;
    const parentStateNode = parentFiber.stateNode;
    switch (parentFiber.tag) {
        case HostComponent:
            parent = parentStateNode;
            isContainer = false;
            break;
        case HostRoot:
            //hostRoot인 경우 stateNode에는 fiberRoot가 들어있고, containerInfo에는 해당 domInstance가 들어있다.
            parent = parentStateNode.containerInfo;
            isContainer = true;
            break;
        default:
            console.error("Invalid Host Parent in commitPlacement");
            throw new Error("Invalid Host Parent in commitPlacement");
    }
    //NOTE:자식을 처리하는 상황에서 reset을 처리하는 이유:
    //NOTE:기본적으로 textnode만 자식이 있을떄는 파이버로 만들지 않고 dom내부에서 관리하고
    //NOTE:그걸 관리하는 effectTag가 ContentReset인데,
    //NOTE: 기본적으로 commit과정은 자식부터 일어나는데 만약에 a라는 자식이 있고 자식 옆에 b라는 자식을 넣고
    //NOTE: 부모에서 자식을 지우면 돔 연산상 느려지기 떄문에 넣기 전에 삭제하고 넣는다
    //NOTE: 기본적으로 dom연산은 reflow가 오래걸리기 떄문에 reflow를 최소화하기 위한것이다.
    if (parentFiber.effectTag & ContentReset) {
        //TODO: implement resetTextContent =>dom모듈
        resetTextContent(parent);
        parentFiber.effectTag &= ~ContentReset;
    }

    //NOTE: 기본적으로 가장 뒤에 append하는게 best지만 만약
    //NOTE: 가만히 있는 친구들이 있고 새로 배치해야 되는 상황이라면 배치할떄 바로 오른쪽에 있는 즉
    //NOTE: before을 찾아야 한다.
    const before = getHostSibling(finishedWork);

    let node = finishedWork;
    //NOTE: 현재 finishedWork와 관련된 모든 subTree의 host부분을 처리하는데,
    //NOTE: 여기서 주의 해야될점은 한 레벨 아래의 자식들만 부모에게 붙이는 것이다.
    //NOTE: 해당 이유는 commitPlacement는 자식부터 진행되고, 그럼 부모에게 자식들을 한레벨 씩 붙이면
    //NOTE: 재귀적으로 부모에게 붙이는것이 되기 때문이다.
    while (true) {
        const isHost = node.tag === HostComponent || node.tag === HostText;
        if (isHost) {
            const stateNode = node.stateNode;
            if (before) {
                if (isContainer) {
                    //TODO: implement insertInContainerBefore =>dom모듈
                    insertInContainerBefore(parent, stateNode, before);
                } else {
                    //TODO: implement insertBefore =>dom모듈
                    insertBefore(parent, stateNode, before);
                }
            } else {
                if (isContainer) {
                    //TODO: implement appendChildToContainer =>dom모듈
                    appendChildToContainer(parent, stateNode);
                } else {
                    //TODO: implement appendChild =>dom모듈
                    appendChild(parent, stateNode);
                }
            }
        } else if (node.child !== null) {
            //placeMent가 check가 되어 있는데 host가 아니면
            //자식을 처리하는 상황까지 타고 내려가야 된다.
            node.child.return = node;
            node = node.child;
            continue;
        }
        //해당 상황은 Host가 아니면서 자식이 없는 상황이다.
        //그런데 만약 node가 finishedWork와 같다면 끝난것이다.
        if (node === finishedWork) {
            return;
        }
        //자신이 마지막 형제라면 부모로 올라가야 한다. 계속.
        while (node.sibling === null) {
            if (node.return === null || node.return === finishedWork) {
                return;
            }
            node = node.return;
        }
        //자신이 마지막 형제가 아니면 형제로 이동.
        node.sibling.return = node.return;
        node = node.sibling;
    }
};

/**
 *
 * @param {TFiber | null} current
 * @param {TFiber} finishedWork
 * @description 해당 함수는 dom(host)Instance가 update가 된것에 대해서 커밋하는게 주된 역할이다.
 * @description 주의 할 케이스로는 commitHookEffectList(UnmountMutation,...)을 호출하는 부분인데
 * @description 이는 UnmountMutation이 layoutEffect와 관련있고, 기본적으로 dom과 관련된 일이기 떄문이다.
 * @description host,dom과 관련된 연산을 커밋한다라고 보면 된다.
 */
export const commitWork = (current, finishedWork) => {
    switch (finishedWork.tag) {
        case FunctionComponent:
        case SimpleMemoComponent: {
            // NOTE: We currently never use MountMutation, but useLayout uses
            // UnmountMutation.
            // NOTE: layoutEffect도 dom과 관련된 연산이기 떄문에 여기서 처리한다.
            commitHookEffectList(UnmountMutation, MountMutation, finishedWork);
            return;
        }
        case HostComponent: {
            //domInstance를 가져온다
            const instance = finishedWork.stateNode;
            if (instance !== null) {
                //새로 커밋할 props를 가져온다.
                const newProps = finishedWork.memoizedProps;
                //props를 비교해야되는데 이전 것이 없으면 새로운 것을 사용한다.
                const oldProps = current !== null ? current.memoizedProps : newProps;

                //updateHostComponent에서 HostComponent에 넣었던 updatePayload를 가져온다.
                const updatePayload = finishedWork.updateQueue;
                //여기서 소비할것임으로 null로 만들어준다.
                finishedWork.updateQueue = null;
                if (updatePayload !== null) {
                    //update를 커밋한다.
                    //TODO: implement commitUpdate =>dom모듈
                    commitUpdate(instance, updatePayload, type, oldProps, newProps, finishedWork);
                }
            }
            return;
        }
        case HostText: {
            if (finishedWork.stateNode === null) {
                console.error(
                    "This should have a text node initialized. This error is likely caused by a bug in rfs. in commitWork"
                );
                throw new Error(
                    "This should have a text node initialized. This error is likely caused by a bug in rfs. in commitWork"
                );
            }
            //HostTextDomInstance를 가져온다.
            const textInstance = finishedWork.stateNode;
            //해당 새로 교체할 string을 가져온다.
            const newText = finishedWork.memoizedProps;

            //기존 텍스트를 가져온다.
            const oldText = current !== null ? current.memoizedProps : newText;
            //TextUpdate를 커밋한다.
            //TODO: implement commitTextUpdate =>dom모듈
            commitTextUpdate(textInstance, oldText, newText);
            return;
        }
        case HostRoot: {
            return;
        }
        default: {
            console.error(`This unit of work tag : ${finishedWork.tag} is not supported in commitWork`);
            throw new Error(`This unit of work tag : ${finishedWork.tag} is not supported in commitWork`);
        }
    }
};

/**
 *
 * @param {TFiber} current
 * @description 해당 함수는 current에 대응되는 domInstance인 stateNode를 참조해
 * @description 해당 domInstance의 textContent를 commit하는 함수이다.
 */
export const commitResetTextContent = (current) => {
    //TODO: implement resetTextContent =>dom모듈
    resetTextContent(current.stateNode);
};

// 함수 Ref
// 함수 ref는 React가 컴포넌트나 DOM 엘리먼트에 대한 참조를 얻을 때 호출되는 함수입니다.
//  이 함수는 참조 대상이 파라미터로 전달되며,
//  개발자는 이를 활용해 참조를 저장하거나 추가적인 작업을 수행할 수 있습니다.
//   함수 ref를 사용하면 컴포넌트 마운트 시점에 참조를 설정하고, 언마운트 시점에 참조를 정리할 수 있어서 매우 유용합니다.
//ex)
// //function MyFunctionalComponent() {
//   // 함수 ref를 사용해 DOM 엘리먼트에 접근
//   const setMyRef = useCallback(node => {
//     // `node`는 해당 DOM 엘리먼트의 참조입니다.
//     if (node !== null) {
//       console.log(node);
//     }
//   }, []);

//   return <div ref={setMyRef}>Hello, world!</div>;
// }
/**
 *
 * @param {TFiber} current
 * @description 해당 함수는 current와 연결된 ref를 detach하는 함수이다.
 * @description 주의 할점은 함수형 ref가 가능한데 이는 참조하는 대상을 파라미터로 받아서 처리하는 함수이다.
 * @description 그것을 초기화하는것은 null을 넣어주는것이다.
 */
export const commitDetachRef = (current) => {
    const currentRef = current.ref;
    if (currentRef !== null) {
        if (typeof currentRef === "function") {
            //기본적으로 함수 ref는 참조하는 대상을 파라미터로 받아서 처리하는 함수이다.
            //그것을 초기화하는것은 null을 넣어주는것이다.
            currentRef(null);
        }
    } else {
        currentRef.current = null;
    }
};

const detachRef = (current) => {
    const ref = current.ref;
    if (ref !== null) {
        if (typeof ref === "function") {
            ref(null);
        } else {
            ref.current = null;
        }
    }
};

/**
 *
 * @param {TFiberRoot} finishedRoot
 * @param {TFiber} root
 * @param {TRfsPriortyLevel} renderPriorityLevel
 */
const commitNestedUnmounts = (finishedRoot, root, renderPriorityLevel) => {
    // 제거된 호스트 노드 안에 있는 동안에는 내부 노드에서
    // 제거되었으므로 내부 노드에서 removeChild를 호출하고 싶지 않습니다.
    // 호출하고 싶지 않습니다. 또한 이 호스트 노드가 제거되기 전에 모든 컴포넌트에서 // componentWillUnmount를 호출하고 싶습니다.
    // 컴포넌트에서 컴포넌트 언마운트를 호출하고 싶습니다. 따라서
    // 호스트 노드 안에 있는 동안 내부 루프를 수행합니다.
    let node = root;
    //내부구조는 자식이 있으면 내려가고, 없으면 형제를 찾아서 내려가는 방식으로 동작한다.
    //그리고 내부적으로 모든 자식을 unmount했고 마지막 형제라면 한 레벨 위로 올라가서 행위를 반복한다.
    while (true) {
        commitUnmount(finishedRoot, node, renderPriorityLevel);
        if (node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
        }
        if (node === root) {
            return;
        }
        while (node.sibling === null) {
            if (node.return === null || node.return === root) {
                return;
            }
            node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
    }
};

/**
 *
 * @param {TFiberRoot} finishedRoot
 * @param {TFiber} current
 * @param {TRfsPriortyLevel} renderPriorityLevel
 * @description 현 한 레벨과 관련된 모든 didWillUnmount와 관련된것들을 실행합니다.
 */
const commitUnmount = (finishedRoot, current, renderPriorityLevel) => {
    switch (current.tag) {
        case FunctionComponent:
        case SimpleMemoComponent: {
            //기본적으로 functionComponent는 hookEffectList를 unmount시켜야 합니다.
            const updateQueue = current.updateQueue;
            if (updateQueue !== null) {
                const lastEffect = updateQueue.lastEffect;
                if (lastEffect !== null) {
                    const firstEffect = lastEffect.next;

                    const priorityLevel = renderPriorityLevel > NormalPriority ? NormalPriority : renderPriorityLevel;
                    runWithPriority(priorityLevel, () => {
                        let effect = firstEffect;
                        do {
                            const destroy = effect.destroy;
                            if (destroy !== undefined) {
                                destroy();
                            }
                            effect = effect.next;
                        } while (effect !== firstEffect);
                    });
                }
            }
            break;
        }
        case HostComponent: {
            detachRef(current);
            return;
        }
    }
};

/**
 *
 * @param {TFiberRoot} finishedRoot
 * @param {TFiber|null} current
 * @param {TFiber} finishedWork
 * @param {TExpirationTime} commitedExpirationTime
 * @description 해당 함수는 커밋할때 커밋할 lifeCycle을 커밋하는 함수이다.
 * @description TODO: layout문맥은 해결 되었는데 host문맥은 좀 더 dom모듈을 이해하고 해결해야한다.
 */
export const commitLifeCycles = (finishedRoot, current, finishedWork, commitedExpirationTime) => {
    switch (finishedWork.tag) {
        case FunctionComponent:
        case SimpleMemoComponent: {
            commitHookEffectList(UnmountLayout, MountLayout, finishedWork);
            break;
        }
        case HostRoot: {
            //TODO: 해당 문맥 dom모듈에서 정확히 이해하고 해결
            const updateQueue = finishedWork.updateQueue;
            if (updateQueue !== null) {
                let instance = null;
                if (finishedWork.child !== null) {
                    switch (finishedWork.child.tag) {
                        case HostComponent:
                            //TODO: implement getPublicInstance =>dom모듈
                            instance = getPublicInstance(finishedWork.child.stateNode);
                            break;
                    }
                }
                //TODO: implement commitUpdateQueue =>dom모듈
                commitUpdateQueue(finishedWork, updateQueue, instance, commitedExpirationTime);
            }
            return;
        }
        case HostComponent: {
            const instance = finishedWork.stateNode;
            if (current === null && finishedWork.effectTag & Update) {
                const type = finishedWork.type;
                const props = finishedWork.memoizedProps;
                //TODO: implement commitMount =>dom모듈
                commitMount(instance, type, props, finishedWork);
            }
            return;
        }
        case HostText: {
            //lifeCycle과 관련이 없음
            return;
        }
        default: {
            console.error(`This unit of work tag : ${finishedWork.tag} is not supported in commitLifeCycles`);
            throw new Error(`This unit of work tag : ${finishedWork.tag} is not supported in commitLifeCycles`);
        }
    }
};
/**
 *
 * @param {TFiberRoot} finishedRoot
 * @param {TFiber} current
 * @param {TRfsPriortyLevel} renderPriorityLevel
 * @description 현재 host부모가 될 수 있는 파이버를 찾고
 * @description 가능한 host부모 기준 한 레벨아래의 자식들을 다 찾아서
 * @description 삭제를 진행하는 함수이다. 해당 부분에서 삭제를 하기 전에 didWillUnmount와 관련된것들을(Cleanup)을
 * @description 다 실행하고 삭제한다. 여기서 만약 host라면 재귀적으로 관련된 서브트리를 다 unmount하고
 * @description 아니라면 현 레벨만 unmount하고 자식으로 내려간다.
 */
const unmountHostComponents = (finishedRoot, current, renderPriorityLevel) => {
    // 삭제된 최상위 파이버만 있지만 그 파이버의
    // 자식들을 재귀하여 모든 터미널 노드를 찾아야 합니다.
    const node = current;

    //NOTE: 포탈과 관련되서 포탈과 관련된 parent를 찾았으면 vaild하지 않으니까 돌려둘라고
    //NOTE: 있는것같긴함
    let currentParentIsValid = false;

    //현재 parent와 관련된 변수
    let currentParent;
    let currentParentIsContainer;
    while (true) {
        //만약 현재 currentParent를 찾지 못했다면 parent를 찾아야한다.
        //여기서 parent란 한 레벨 위의 host부모를 찾는것이다.
        if (!currentParentIsValid) {
            let parent = node.return;
            //parent를 찾는 label
            //host 기준 parent를 찾는다. 부모가 가능한 host가 될떄까지 한 레벨 위로 올라간다.
            findParent: while (true) {
                if (parent === null) {
                    console.error(
                        "Expected to find a host parent. This error is likely caused by a bug in rfs. in unmountHostComponents"
                    );
                    throw new Error(
                        "Expected to find a host parent. This error is likely caused by a bug in rfs. in unmountHostComponents"
                    );
                }
                const parentStateNode = parent.stateNode;
                switch (parent.tag) {
                    case HostComponent:
                        currentParent = parentStateNode;
                        currentParentIsContainer = false;
                        //가능한 부모를 찾았으면 현재 findParent를 빠져나간다.
                        break findParent;
                    case HostRoot:
                        currentParent = parentStateNode.containerInfo;
                        currentParentIsContainer = true;
                        //가능한 부모를 찾았으면 현재 findParent를 빠져나간다.
                        break findParent;
                }
                //부모가 host가 아니면 한 레벨 위로 올라간다.
                parent = parent.return;
            }
            currentParentIsValid = true;
        }

        //NOTE: 현재 노드 자체가 host관련 파이버여서 바로 삭제할 수 있는 상황이라면
        if (node.tag === HostComponent || node.tag === HostText) {
            //NOTE: 예를 들면 cleanUp과 같은, component가 unmount가 될떄 실행되어야 하는데
            //NOTE: didWillUnmount와 관련된것들을 재귀적으로 모든 서브트리에 대해서 다 실행
            //TODO: implement commitNestedUnmounts
            commitNestedUnmounts(finishedRoot, node, renderPriorityLevel);

            //재귀적으로 didWillUnmount와 관련된것들을 실행하고 난뒤는 이제 안전하게 트리에 삭제 가능하다.
            if (currentParentIsContainer) {
                //TODO: implement removeChildFromContainer =>dom모듈
                removeChildFromContainer(currentParent, node.stateNode);
            } else {
                //TODO: implement removeChild =>dom모듈
                removeChild(currentParent, node.stateNode);
            }
        } else {
            //NOTE: host가 아니라면 현 레벨에 대해서만 didWillUnmount와 관련된것들을 실행하고
            //NOTE: 한 레벨 아래로 내려간다. hostComponent를 찾기 위해서
            //TODO: implement commitUnmount
            commitUnmount(finishedRoot, node, renderPriorityLevel);
            if (node.child !== null) {
                //NOTE: 자식이 있다면 내려간다.
                node.child.return = node;
                node = node.child;
                continue;
            }
        }
        //여기에 오는 경우는 현재 host관련 파이버 였어서 서브 트리를 삭제를 다 진행했거나
        //한 레벨에 대해서만 삭제를 했는데, 자식이 없어서 내려가지 못하였을떄다

        //그 상황에서 현재 node가 current와 같다면 끝난것이다.
        if (node === current) {
            return;
        }

        //여기에 오는 경우는 현재 host관련 파이버 였어서 서브 트리를 삭제를 다 진행했거나
        //한 레벨에 대해서만 삭제를 했는데, 자식이 없어서 내려가지 못하였을떄다
        //그 상황에서는 지금 현재 node가 마지막 형제라면 마지막 형제가 아닐떄 까지 부모로 올라가야 한다.
        //만약 root에 도달하거나 current와 같다면 끝난것이다.
        while (node.sibling === null) {
            if (node.return === null || node.return === current) {
                return;
            }
            node = node.return;
        }
        //마지막 형제가 아니고 종료조건이 아닌 경우 형제로 이동하여 한 레벨아래의 가장 가까운 host자식을 찾는
        //과정을 반복한다.
        node.sibling.return = node.return;
        node = node.sibling;
    }
};

/**
 *
 * @param {TFiber} current
 * @description gc(가비지콜렉터)를 작동시키기 위해 현재 파이버와 관련된 참조를 다 끊어준다.
 * @description 이상적으로는 부모의 대체의 자식 포인터를 지워야하지만, 어느 부모가 현재 부모인지 확실히 알 수 없으므로
 * @description 부모인지 알 수 없으므로 이 자식의 하위 트리를 GC를하는 것으로 만족한다.
 */
const detachFiber = (current) => {
    const alternate = current.alternate;
    // 반환 포인터를 잘라 트리에서 연결을 끊습니다. 이상적으로는
    // 부모 대체의 자식 포인터를 지워야 합니다.
    // 하지만 어느 부모가 현재 부모인지 확실히 알 수 없으므로
    // 부모인지 알 수 없으므로 이 자식의 하위 트리를 GC:인하는 것으로 만족하겠습니다. 이 자식
    // 자체가 다음 번에 부모가 업데이트될 때 GC:ed됩니다.
    current.return = null;
    current.child = null;
    current.memoizedState = null;
    current.updateQueue = null;
    current.dependencies = null;
    current.alternate = null;
    current.firstEffect = null;
    current.lastEffect = null;
    current.pendingProps = null;
    current.memoizedProps = null;
    if (alternate !== null) {
        detachFiber(alternate);
    }
};
/**
 *
 * @param {TFiberRoot} finishedRoot
 * @param {TFiber} current
 * @param {TRfsPriortyLevel} renderPriorityLevel
 */
export const commitDeletion = (finishedRoot, current, renderPriorityLevel) => {
    // 부모에서 모든 호스트 노드를 재귀적으로 삭제합니다.
    // 참조를 분리하고 전체 서브트리에서 componentWillUnmount()를 호출합니다.(예)cleanup)
    unmountHostComponents(finishedRoot, current, renderPriorityLevel);
    //GC(가비지콜렉터)를 가동시키기 위해 현재 파이버와 관련된 참조를 다 끊어준다.
    detachFiber(current);
};
