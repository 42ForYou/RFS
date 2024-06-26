import {
    NoContext,
    BatchedContext,
    EventContext,
    RenderContext,
    CommitContext,
    DiscreteEventContext,
} from "../const/CExecutionContext.js";
import { unwindInterruptedWork } from "./unwindWork.js";
import { RootIncomplete, RootCompleted } from "../const/CRootExitStatus.js";
import {
    expirationTimeToMs,
    msToExpirationTime,
    computeAsyncExpiration,
    computeInteractiveExpiration,
    inferPriorityFromExpirationTime,
} from "../fiber/fiberExiprationTime.js";
import { markRootUpdatedAtTime, markRootExpiredAtTime, markRootFinishedAtTime } from "../fiber/fiberRoot.js";
import { NoWork, Sync, Idle, Never } from "../const/CExpirationTime.js";
import { createWorkInProgress } from "../fiber/fiber.js";
import {
    scheduleCallback,
    cancelCallback,
    getCurrentPriorityLevel,
    runWithPriority,
    shouldYield,
    requestPaint,
    now,
    flushSyncCallbackQueue,
    scheduleSyncCallback,
} from "../scheduler/schedulerInterface.js";
import { beginWork } from "../work/beginWork.js";
import { resetContextDependencies } from "../context/newContext.js";
import {
    commitPassiveHookEffects,
    commitPlacement,
    commitDetachRef,
    commitResetTextContent,
    commitWork,
    commitDeletion,
    commitBeforeMutationLifeCycles as commitLayoutEffectOnFiber,
    commitAttachRef,
} from "../work/commitWork.js";
import { completeWork } from "../work/completeWork.js";
import {
    NoPriority,
    ImmediatePriority,
    UserBlockingPriority,
    NormalPriority,
    LowPriority,
    IdlePriority,
} from "../const/CRfsPriorityLevel.js";
import { PerformedWork } from "../const/CSideEffectFlags.js";
import { prepareForCommit, resetAfterCommit, cancelTimeout, noTimeout } from "../dom/core/domHost.js";

import { currentDispatcher as rfsCurrentDispatcher } from "../core/currentDispatcher.js";

/**
 * @description WorkLoop내부에서 nested하게 업데이트가 계속 반복되는걸 관리하는 객체입니다.
 * @description moduleScope로 관리되는 객체입니다.
 */
const nestedUpdate = {
    NESTED_PASSIVE_UPDATE_LIMIT: 50,
    nestedPassiveUpdateCount: 0,
    NESTED_UPDATE_LIMIT: 50,
    nestedUpdateCount: 0,
    /**
     * @type{TFiberRoot | null} @see 파일경로: [TFiberRoot.js](srcs/type/TFiberRoot.js)
     */
    rootWithNestedUpdates: null,
    clear: () => {
        nestedUpdateCount = 0;
        rootWithNestedUpdates = null;
    },
    checkForNestedUpdates: () => {
        if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
            return true;
        }
        return false;
    },
    checkforNsetedPassiveUpdates: () => {
        if (nestedPassiveUpdateCount > NESTED_PASSIVE_UPDATE_LIMIT) {
            return true;
        }
        return false;
    },
};

/**
 * @description 해당 객체는 WorkLoop내에서 현재 Loop문맥을 관리하는 객체입니다
 */
export const currentWorkContext = {
    /**
     * @description 현재 실행되고 있는 Rfs의 실행컨텍스트를 나타냅니다.
     * @type {TExecutionContext} @see 파일경로: [TExecutionContext.js](srcs/type/TExecutionContext.js)
     */
    executionContext: NoContext,
    /**
     * @description 현재 실행되고 있는 Rfs의 root를 나타냅니다.
     * @type {TFiberRoot | null} @see 파일경로: [TFiberRoot.js](srcs/type/TFiberRoot.js)
     */
    workInProgressRoot: null,
    /**
     * @description 현재 실행되고 있는 Rfs의 파이버를 나타냅니다.
     * @type {TFiber | null} @see 파일경로: [TFiber.js](srcs/type/TFiber.js)
     */
    workInProgress: null,
    /**
     * @description 현재 렌더를 하고 있는 파이버의 expirationTime을 나타냅니다.(우선순위)
     * @type {TExpirationTime} @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
     */
    renderExpirationTime: NoWork,
    /**
     * @description 현재 WorkInProgressRoot의 ExitStatus를 나타냅니다.
     * @type {TRootExitStatus} @see 파일경로: [TRootExitStatus.js](srcs/type/TRootExitStatus.js)
     */
    workInProgressRootExitStatus: RootIncomplete,

    /**
     * @description 현재 렌더링중인 루트에 대해서 컴포넌트가 남간 작업(업데이트가)있을떄 관련 ExpirationTime을 나타냅니다.
     * @description bailOut은 관련이 없고, 오직 unprocessed된 update만 의미합니다
     * @description markUnprocessedUpdateTime와 관련이 있습니다.
     *@type {TExpirationTime} @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
     */
    workInProgressRootNextUnprocessedUpdateTime: NoWork,

    /**
     * @description 이 렌더링 동안 처리된 업데이트 중 가장 최근 이벤트 시간입니다.
     *@description  개념적으로는 타임스탬프이지만 ExpirationTime으로 표현했습니다.
     *@description 핫 경로에서 주로 만료 시간을 처리하기 때문에, 이렇게 하면
     *@description 핫 경로에서 발생하는 변환을 방지합니다.
     *@type {TExpirationTime} @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
     */
    workInProgressRootLatestProcessedExpirationTime: Sync,
};

/**
 * @description workLoop모듈내에서 passiveEffect를 관리하는 객체입니다.
 */
const currentPassiveEffectContext = {
    /**
     * @description 햔재루트가 passiveEffect를 가지고 있는지 여부를 나타냅니다.
     */
    rootDoesHavePassiveEffects: false,
    /**
     * @description passiveEffect가 등록된 root를 나타냅니다.
     * @type {TFiberRoot | null} @see 파일경로: [TFiberRoot.js](srcs/type/TFiberRoot.js)
     */
    rootWithPendingPassiveEffects: null,
    /**
     * @description passiveeffect가 등록된 root의 priorityLevel
     * @type {TRfsPriorityLevel} @see 파일경로: [TRfsPriorityLevel.js](srcs/type/TRfsPriorityLevel.js)
     */
    pendingPassiveEffectsRenderPriority: NoPriority,
    /**
     * @description passiveEffect가 등록된 root의 expirationTime
     * @type {TExpirationTime} @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
     */
    pendingPassiveEffectsExpirationTime: NoWork,

    /**
     * @description 현재 workLoop에서 다음에 다룰 effect를 나타냅니다.
     @ type {TFiber | null} @see 파일경로: [TFiber.js](srcs/type/TFiber.js) 
    */
    nextEffect: null,
};

/**
 * @description ExpirationTime을 구하는 방식에 의하면 event는 배치가 될수가 없습니다.
 * @description 그렇다면 임의적으로 event와 관련된 우선순위를 따로 묶어줄 수 있는 방법이 필요합니다
 * @description 이를 위한 변수입니다.
 * @description 생애주기가 currentWorkContext와 다름으로 다른 객체로 관리합니다.
 * @description requestCurrentTimeForUpdate과 깊은 연관이 있습니다.(performConcurrentWork에서도 사용됨)
 * @type {TExpirationTime} @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
 */
let currentEventTime = NoWork;

/**
 * @type {map<TFiberRoot,TExpirationTime>} @see 파일경로: [TFiberRoot.js](srcs/type/TFiberRoot.js)
 * @description 현재 discrete한 업데이트를 기다리고 있는 루트를 보관하는 map입니다.
 */
let rootsWithPendingDiscreteUpdates = null;
/**
 * @description 현재 렌더링중인 루트에 대해서 컴포넌트가 남긴 작업이 있을떄
 * @description currentWorkContext에 처리되지 않은 다음 업데이트를 마킹합니다.
 * @param {TExpirationTime} expirationTime @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
 */
export const markUnprocessedUpdateTime = (expirationTime) => {
    if (expirationTime > currentWorkContext.workInProgressRootNextUnprocessedUpdateTime) {
        currentWorkContext.workInProgressRootNextUnprocessedUpdateTime = expirationTime;
    }
};

/**
 *
 * @param {TExpirationTime} expirationTime @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
 * @description 마지막으로 processed된 루트의 ExpirationTime을 설정함
 */
export const markRenderEventTimeAndConfig = (expirationTime) => {
    if (expirationTime < currentWorkContext.workInProgressRootLatestProcessedExpirationTime && expirationTime > Idle) {
        currentWorkContext.workInProgressRootLatestProcessedExpirationTime = expirationTime;
    }
};

const checkForNestedUpdates = () => {
    if (nestedUpdate.checkForNestedUpdates()) {
        nestedUpdate.clear();
        console.log("Maximum update depth exceeded. nested update shouldeDebugThis");
        throw new Error("Maximum update depth exceeded. shouldeDebugThis");
    }
    if (nestedUpdate.checkforNsetedPassiveUpdates()) {
        nestedUpdate.nestedPassiveUpdateCount = 0;
        console.error("Maximum update depth exceeded. nestedPassiveEffect");
    }
};
/**
 *
 * @param {TFiber} fiber @see 파일경로: [TFiber.js](srcs/type/TFiber.js)
 * @param {TExpirationTime} expirationTime @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
 * @description 이벤트가 발생하거나 스케듈링이 필요한경우 expirationTime의 마킹을 기반으로 우선순위를 새겨야합니다
 * @description 여기서 리액트는 기본적으로 bailOut를 통해서 불필요한 렌더링을 방지하는데
 * @description 이를 위해 자식에서만 업데이트가 일어나는 경우 자식의 expirationTime만을 수정하여 구별이 가능해야합니다.
 * @description 해당 함수에서의 ExpiredTime은 reconciler에서의 이벤트 발생시간을 의미합니다.
 * @return {TFiberRoot | null} @see 파일경로: [TFiberRoot.js](srcs/type/TFiberRoot.js)
 */
//order
// 현재 파이버에 expirationTime을 마킹합니다.
// -*- 부모로 순회하면서 childExpirationTime을 수정합니다.
// -*- root에 update가 있음을 알립니다.
// -*- -*- 만약 root가 현재 렌더링중인 루트라면 markUnprocessedUpdateTime을 호출합니다.
//
const markUpdateTimeFromFiberToRoot = (fiber, expirationTime) => {
    //현 파이버에 expirationTime을 마킹합니다.
    if (fiber.expirationTime < expirationTime) {
        fiber.expirationTime = expirationTime;
    }
    let alternate = fiber.alternate;
    if (alternate !== null && alternate.expirationTime < expirationTime) {
        alternate.expirationTime = expirationTime;
    }

    //순회
    //목포: 부모의 childExpirationTime을 수정
    let node = fiber.return;
    let root = null;
    //현 파이버가 hostRoot인 경우 root를 현 파이버의 stateNode로 설정합니다.
    if (node === null && fiber.tag === HostRoot) {
        root = fiber.stateNode;
    } else {
        //순회 시작
        while (node !== null) {
            //alternate와 current모두 childExpirationTime을 수정합니다.
            //alternate의 수정부분을 A라고 합니다
            alternate = node.alternate;
            if (node.childExpirationTime < expirationTime) {
                node.childExpirationTime = expirationTime;
                //A
                if (alternate !== null && alternate.childExpirationTime < expirationTime) {
                    alternate.childExpirationTime = expirationTime;
                }
            } else if (alternate !== null && alternate.childExpirationTime < expirationTime) {
                //A
                alternate.childExpirationTime = expirationTime;
            }
            //만약 현 노드가 hostRoot인 경우 root를 현 노드의 stateNode로 설정하고 순회를 종료합니다.
            if (node.return === null && node.tag === HostRoot) {
                root = node.stateNode;
                break;
            }
            node = node.return;
        }
    }

    if (root !== null) {
        if (currentWorkContext.workInProgressRoot === root) {
            //현재 렌더링 중인 트리에 대한 업데이트를 받았음.
            //처리되지 않은 work(업데이트)가 있으니 플래그를 켜서 따로 처리하도록 합니다.
            markUnprocessedUpdateTime(expirationTime);
        }

        //루트에 마크합니다. 새로운 업데이트가 있음을 알립니다.
        markRootUpdatedAtTime(root, expirationTime);
    }
    return root;
};

/**
 *
 * @param {TFiberRoot} root @see 파일경로: [TFiberRoot.js](srcs/type/TFiberRoot.js)
 * @param {TExpirationTime} expirationTime @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
 * @description 해당함수는 currentWorkContext를 초기화하고 새로운 스택을 준비합니다.
 */
const prepareFreshStack = (root, expirationTime) => {
    //커밋과 관련된 이전 작업을 초기화합니다.
    root.finishedWork = null;
    root.finishedExpirationTime = NoWork;

    //이전 태스크에 타임아웃으로 스케줄링된 작업을 취소합니다.
    const timeoutHandle = root.timeoutHandle;
    if (timeoutHandle !== noTimeout) {
        root.timeoutHandle = noTimeout;
        cancelTimeout(timeoutHandle);
    }

    //파이버 스택을 초기화합니다.
    if (currentWorkContext.workInProgress !== null) {
        let interruptedWork = currentWorkContext.workInProgress.return;
        while (interruptedWork !== null) {
            unwindInterruptedWork(interruptedWork);
            interruptedWork = interruptedWork.return;
        }
    }
    //현재 작업 컨텍스트를 초기화합니다.
    currentWorkContext.workInProgressRoot = root;
    //Root를 기반으로 새로운 WorkInProgress를 만듭니다.
    currentWorkContext.workInProgress = createWorkInProgress(root.current, null, expirationTime);
    currentWorkContext.renderExpirationTime = expirationTime;
    currentWorkContext.workInProgressRootExitStatus = RootIncomplete;
    currentWorkContext.workInProgressRootLatestProcessedExpirationTime = Sync;
    currentWorkContext.workInProgressRootNextUnprocessedUpdateTime = NoWork;
};

const pushDispatcher = (root) => {
    const prevDispatcher = rfsCurrentDispatcher.current;
    rfsCurrentDispatcher.current = ContextOnlyDispatcher;
    if (prevDispatcher === null) {
        console.error("prevDispatcher is null");
    } else {
        return prevDispatcher;
    }
};

const popDispatcher = (prevDispatcher) => {
    rfsCurrentDispatcher.current = prevDispatcher;
};

/**
 *
 * @param {TExpirationTime} currentTime @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
 * @param {TFiber} fiber @see 파일경로: [TFiber.js](srcs/type/TFiber.js)
 * @description 현재 ExpirationTIme을 기반으로 이친구가 진짜 이시간에 끝나야 되는
 * @description 만료시간을 계산하는 함수임
 * @description 현재 만료되어야 되는 시간을 얻을떄 concurrent가 아니면 스케줄러가 작동이 즉시가 아니면
 * @description batched처리한다
 */
export const computeExpirationForFiber = (currentTime, fiber) => {
    const mode = fiber.mode;

    //Batched : https://github.com/facebook/rfs/pull/15502
    //하나의 이벤트 핸들러안에 있는 여러개의 setState같은 건 배치처리를 이미 하고 있으나
    //외부시스템에 의한 업데이트 등에 대한 일괄 처리는 진행되고 있지 않음
    //그런데 이거에 대한 대처 방안은 사실 concurrent모드가 이를 해결함:
    //그러나 동기적인 모드에서는 concurrent모드가 아니기 때문에 이를 처리해야함
    //그거떄문에 이상적으로 배치모드라는 sync이외의 모드가 존재함
    //이를 이용해서 배치모드는 모든 업데이트를 다음 rfs이벤트로 연기하는 일괄처리 기본모드를 활성화함
    const priorityLevel = getCurrentPriorityLevel();
    if ((mode & ConcurrentMode) === NoMode) {
        return priorityLevel === ImmediatePriority ? Sync : Batched;
    }

    //여기부터는 항상 ConcurrentMode이다.
    //concurrentMode이면서 현재 문맥이 렌더링중이라면, 해당 renderExpirationTime을 반환합니다.
    //이유?: 만약 a->를 렌더링중이라고 하자 그런데 a의 자식중 b가 존재한다라고 가정했을떄
    //dispatchAction에 의해 트리거 되면 computeExpirationForFiber에 의해 update에 expirationTime이 설정됩니다.
    //그런데 그건 당연히 a를 렌더링하고 있던 중이니까 a를 렌더하면서 b도 그 영향을 받길 원합니다.
    //그렇다면 renderExpirationTime을 반환하는게 맞습니다.
    if ((currentWorkContext.executionContext & RenderContext) !== NoContext) {
        return currentWorkContext.renderExpirationTime;
    }

    //여기부터는 concurrentMode이면서 현재 문맥이 렌더링중이 아닌 경우입니다.
    //여기 부터는 이미 랜더링이 아닌 상태임
    //그렇다면 이 친구가 만료되어야 되는 시간 을 어떻게 구하냐 ?
    //즉시해야되는 일이면 즉시해야된다라고 알려준다.
    //만약에 normalPriority를 가지고 있으면 computeAsyncExpiration을 기반으로
    //현재 시간 보다 얼마나 비동기적으로 여유가 있는지를 computeAsyncExpiration을 기반으로 계산한다.
    let expirationTime;
    switch (priorityLevel) {
        case ImmediatePriority:
            expirationTime = Sync;
            break;
        case UserBlockingPriority:
            expirationTime = computeInteractiveExpiration(currentTime);
            break;
        case NormalPriority:
        case LowPriority:
            expirationTime = computeAsyncExpiration(currentTime);
            break;
        case IdlePriority:
            expirationTime = Idle;
            break;
        default:
            console.error("Unknown priority level. .");
            throw new Error("Unknown priority level. ");
    }

    // If we're in the middle of rendering a tree, do not update at the same
    // expiration time that is already rendering.
    //만약에 위에서 계산된 값이 현재 랜더링 중인 값과 같다면
    //렌더링보다는 한 우선순위 이후로 배치해야한다. 왜냐하면 렌더링 문맥중에 일어난 것은 아니기 떄문에 한 사이클 뒤에 일어나야한다.
    if (currentWorkContext.workInProgressRoot !== null && expirationTime < currentWorkContext.renderExpirationTime) {
        expirationTime -= 1;
    }
    return expirationTime;
};

/**
 * @description 예약되어 있는 passiveEffectPriorty가 noPriority가 아닌 경우 우선순위함께 실행합니다.
 * @description 기본적으로 NormalPriority보다 큰 우선순위를 가진것도 NormalPriority로 실행됩니다.
 * @returns {boolean}
 */
export const flushPassiveEffects = () => {
    if (currentPassiveEffectContext.pendingPassiveEffectsRenderPriority !== NoPriority) {
        //동기보다 우선순위가 높으면 flushPassive같은경우는 NormalPriority로 수행됩니다.
        const priorityLevel =
            currentPassiveEffectContext.pendingPassiveEffectsRenderPriority > NormalPriority
                ? NormalPriority
                : currentPassiveEffectContext.pendingPassiveEffectsRenderPriority;
        currentPassiveEffectContext.pendingPassiveEffectsRenderPriority = NoPriority;
        return runWithPriority(priorityLevel, flushPassiveEffectsImpl);
    }
};
/**
 * @description flushPassiveEffects의 구현체입니다.
 * @description 해당함수는 모아진 passiveEffect를 모두 수행합니다.
 * @description flush하면서 syncCallback이 쌓여있으면 수행합니다.
 * @returns {boolean}
 */
const flushPassiveEffectsImpl = () => {
    if (currentPassiveEffectContext.rootWithPendingPassiveEffects === null) {
        return false;
    }
    const root = currentPassiveEffectContext.rootWithPendingPassiveEffects;
    const expirationTime = currentPassiveEffectContext.pendingPassiveEffectsExpirationTime;
    currentPassiveEffectContext.rootWithPendingPassiveEffects = null;
    currentPassiveEffectContext.pendingPassiveEffectsExpirationTime = NoWork;

    const prevExecutionContext = currentWorkContext.executionContext;
    currentWorkContext.executionContext |= CommitContext;

    let effect = root.current.firstEffect;
    while (effect !== null) {
        //현 effect = fiber(sideEffect)에 updateQueue에 있는 PassiveHookEffectList를 커밋합니다.
        commitPassiveHookEffects(effect);
        const nextNextEffect = effect.nextEffect;
        // nextEffect를 가비지콜렉팅하기 위해 null로 만듭니다.
        effect.nextEffect = null;
        effect = nextNextEffect;
    }

    currentWorkContext.executionContext = prevExecutionContext;

    //commit과정에서 syncCallback이 쌓여있으면 수행합니다.
    //Detail:
    //commitPassiveHookEffects에 create(),destroy() 에 의해
    //내부적으로 다시 setState가 불려서
    //ensureRootIsScheduled이 호출되어서
    //scheduleSyncCallback이 호출되어 sync가 생겨서 해당일을 처리해야될 수 있음
    flushSyncCallbackQueue();

    nestedUpdate.nestedPassiveUpdateCount = rootWithPendingPassiveEffects = null
        ? 0
        : nestedUpdate.nestedPassiveUpdateCount + 1;
    return true;
};
const resetChildExpirationTime = (completedWork) => {
    if (currentWorkContext.renderExpirationTime !== Never && completedWork.childExpirationTime === Never) {
        // The children of this component are hidden. Don't bubble their
        // expiration times.
        return;
    }

    let newChildExpirationTime = NoWork;

    // Bubble up the earliest expiration time.

    let child = completedWork.child;
    while (child !== null) {
        const childUpdateExpirationTime = child.expirationTime;
        const childChildExpirationTime = child.childExpirationTime;
        if (childUpdateExpirationTime > newChildExpirationTime) {
            newChildExpirationTime = childUpdateExpirationTime;
        }
        if (childChildExpirationTime > newChildExpirationTime) {
            newChildExpirationTime = childChildExpirationTime;
        }
        child = child.sibling;
    }

    completedWork.childExpirationTime = newChildExpirationTime;
};
/**
 * @description leaf를 반환 받은 경우 해당 파이버의 작업을 마무리(effect를 전달하거나, htmlElement를 만들거나, 변경된 부분을 기록합니다.)
 * @description 이후 찾을수 있다면 형제를 반환합니다. 없다면 null을 반환합니다.
 * @param {TFiber} unitOfWork @see 파일경로: [TFiber.js](srcs/type/TFiber.js)
 */
const completeUnitOfWork = (unitOfWork) => {
    currentWorkContext.workInProgress = unitOfWork;
    do {
        const current = currentWorkContext.workInProgress.alternate;
        const returnFiber = currentWorkContext.workInProgress.return;

        //호스트 환경과 관련된 부분의 대한 일을 처리합니다.
        const next = completeWork(current, currentWorkContext.workInProgress, currentWorkContext.renderExpirationTime);
        resetChildExpirationTime(currentWorkContext.workInProgress);
        //이 파이버에 대해서 새로운 work를 만드는데 완수했습니다. 다음에 이어서 작업을 할 수 있도록 반환합니다.
        if (next !== null) {
            return next;
        }
        //이제 후위 순회로 수거해야될 타이밍. if(next===null)이면 leaf이므로 부모로 effect를 올려야됨
        if (returnFiber !== null) {
            // 하위 트리와 이 파이버의 모든 효과를 이펙트에 추가합니다.
            // 부모 목록에 추가합니다. 하위 트리의 완료 순서는 부모 트리의
            // 부수 효과 순서에 영향을 줍니다.

            //만약 헤드가 없다면 wip의 헤드를 부모의 헤드로 설정
            if (returnFiber.firstEffect === null) {
                returnFiber.firstEffect = currentWorkContext.workInProgress.firstEffect;
            }

            //서브트리의 effectlist를 부모의 effectlist에 연결합니다.
            if (currentWorkContext.workInProgress.lastEffect !== null) {
                if (returnFiber.lastEffect !== null) {
                    returnFiber.lastEffect.nextEffect = currentWorkContext.workInProgress.firstEffect;
                }
                returnFiber.lastEffect = currentWorkContext.workInProgress.lastEffect;
            }

            // 만약 이 Fiber 노드에 사이드 이펙트가 존재한다면,
            // 해당 사이드 이펙트는 자식 노드들의 사이드 이펙트가 처리된 후에 추가됩니다.
            // 필요한 경우, 우리는 effect 리스트를 여러 번 순회하며 사이드 이펙트를 보다 조기에 처리할 수 있습니다.
            //  그러나 우리는 우리 자신의 사이드 이펙트를 자신의 리스트에 바로 스케줄링하고자 하지 않습니다.
            // 이유는, 자식 노드들을 재사용하는 경우에
            // 우리는 결국 이 사이드 이펙트를 자기 자신에게 스케줄링하게 될 것이기 때문입니다

            //자신도 sideeffect가 있으면 부모의 effectlist에 연결해야합니다.
            //performedWork updateFunctionComponent에서 커스텀 컴포넌트를 호출한 후에 달아줌.
            //커스텀 컴포넌트 호출이외에 sideEeffect가 발생한다면 자신을 effect로 간주하고 위로 올려야합니다.
            //sideEffect가 있다라는것은 performedWork보다 크다라는것을 의미합니다.
            const effectTag = currentWorkContext.workInProgress.effectTag;
            if (effectTag > PerformedWork) {
                if (returnFiber.lastEffect !== null) {
                    returnFiber.lastEffect.nextEffect = currentWorkContext.workInProgress;
                } else {
                    returnFiber.firstEffect = currentWorkContext.workInProgress;
                }
                returnFiber.lastEffect = currentWorkContext.workInProgress;
            }
        }
        //후위 순회 임으로 형제가 있으면 형제를 먼저 반환합니다.
        const siblingFiber = currentWorkContext.workInProgress.sibling;
        if (siblingFiber !== null) {
            // 만약에 이 파이버에 형제가 있다면 형제를 반환합니다.
            return siblingFiber;
        }
        // 형제가 없다면 부모로 올라갑니다.
        currentWorkContext.workInProgress = returnFiber;
    } while (currentWorkContext.workInProgress !== null);

    //TODO: RootINcomplete필요한지 확인
    if (currentWorkContext.workInProgressRootExitStatus === RootIncomplete) {
        //만약에 현재 루트가 완료되지 않았다면 완료되었다고 표시합니다.
        currentWorkContext.workInProgressRootExitStatus = RootCompleted;
    }
    return null;
};
/**
 * @param {TFiber} unitOfWork  @see 파일경로: [TFiber.js](srcs/type/TFiber.js)
 * @description workLoopSync의 order부분을 확인하시면 됩니다.
 * @description beginwork를 수행하고 만약 leaf이면 completeUnitOfWork를 수행합니다.
 */
const performUnitOfWork = (unitOfWork) => {
    const current = unitOfWork.alternate;

    //beginwork를 수행해서 다음 수행할 작업을 반환합니다.
    //beginwork에서 bailout이나, update~로 분기됩니다. 만약 next가 leaf이면 null을 반환합니다.
    let next = beginWork(current, unitOfWork, currentWorkContext.renderExpirationTime);

    //props를 이제 pendingProps를 이제 사용했고, 이제 memoizedProps로 바꿉니다.
    unitOfWork.memoizedProps = unitOfWork.pendingProps;
    //leaf인 경우 effect를 부모로 전달하고, 형제를 찾을 수 있으면 형제를 반환합니다. 없으면 null을 반환합니다.
    if (next === null) {
        next = completeUnitOfWork(unitOfWork);
    }
    return next;
};

/** @noinline */
/**
 * @description workLoop를 동기적으로 진행합니다.
 * @description 동기적으로 진행하기 때문에 shouldYield가 없습니다.
 * @description workLoop는 hot path이기 떄문에 이 해당 클로저를 가만히 놨두면 최적화를 해서 코드가 커집니다.
 * @description 이러한 최적화를 안하기 위해서는 @noinline을 사용합니다.
 * @description detail:해당 함수들은 단순히 loop를 돌리는데, 여기서 주의점은 workLoopConcurrent가
 * @description  해당 작업을 다음 프레임, 다음으로 넘기는 방법은 ensureRootIsScheduled를 통해서 이뤄집니다.
 * @description  그리고 @noinline같은 경우는 기본적으로 V8engine같은 경우는
 * @description  ignition과 turbofan으로 이뤄져있습니다. ignition이 만든 코드가 hotPath(굉장히 많이사용되면)
 * @description  turbofan이 메모리를 좀더 쓴 코드로 최적화하여 코드를 바꿔두게 됩니다. 여기서 noinline은 해당부분을
 * @description  원하지 않는다는 부분입니다. turbofan에게 해당부분을 바꾸지 말라고 합니다.
 * @description Order
 * @description WorkLoopSync:work시작
 * @description -*- performUnitOfWork:work시작과 마무리(effect리스트 전달)을 모두 진행합니다. 일반적으로 fiber가 리턴됩니다.(null인 경우 끝)
 * @description -*- -*- beginWork: 해당 파이버의 작업을 시작합니다. 여기선 bailout상황과 update~~상태로 분리됩니다.
 * @description -*- -*- -*- update~: 컴포넌트의 diff를 보고 업데이트가 되었으면 업데이트를 적용하고 만약 functionComponent와 같은 경우에 rfsElement를 내뱉습니다 이후 reconciliation을 진행합니다.
 * @description -*- -*- -*- -*- reconcileChildren: 반환 rfsElement를 기반으로 새로운 파이버를 만들어 반환합니다
 * @description -*- -*- -*- bailoutOnAlreadyFinishedWork: 만약에 자손의 상태가 변경된 경우(자신이아니라) 자손의 workinprogress를 만들어 반환합니다.
 * @description -*- -*- completeUnitOfWork: null(leaft)일 경우 해당 파이버의 작업을 마무리합니다. work를 마무리 및 부모로 effect를 전달합니다. 그리고 이제 형제로 넘어갑니다.
 * @description -*- -* - -*- completework: 마운트라면 htmlelement를 만들고 업데이트라면 변경된 부분을 기록하여 work를 마무리합니다.
 */
const workLoopSync = () => {
    while (currentWorkContext.workInProgress !== null) {
        currentWorkContext.workInProgress = performUnitOfWork(currentWorkContext.workInProgress);
    }
};

/** @noinline */
/**
 * @description workLoop를 비동기적으로 진행합니다.
 * @description 비동기적으로 진행하기 때문에 shouldYield가 있습니다.
 */
const workLoopConcurrent = () => {
    while (currentWorkContext.workInProgress !== null && !shouldYield()) {
        currentWorkContext.workInProgress = performUnitOfWork(currentWorkContext.workInProgress);
    }
};

/**
 *
 * @param {TFiber} fiber
 * @returns {TExpirationTime}
 * @description 해당함수는 파이버의 만료시간을 반환합니다.해당 만료시간은 자식과 현재 파이버의 만료시간을 비교하여
 * @description 더 우선순위가 높은 것을 반환합니다.
 */
const getRemainingExpirationTime = (fiber) => {
    const updateExpirationTime = fiber.expirationTime;
    const childExpirationTime = fiber.childExpirationTime;
    return updateExpirationTime > childExpirationTime ? updateExpirationTime : childExpirationTime;
};

/**
 *
 * @param {TFiberRoot} root
 * @param {TExpirationTime} committedExpirationTime
 * @description 해당 함수는 레이아웃 효과를 커밋합니다.
 * @description 자세히는 현 effectFiber 하나하나 layouteffect를 커밋하고(commitLifeCycle's alias)를 호출합니다.
 * @description Ref와 관련된 attach를 커밋합니다.
 */
const commitLayoutEffects = (root, committedExpirationTime) => {
    while (currentPassiveEffectContext.nextEffect !== null) {
        const effect = currentPassiveEffectContext.nextEffect;
        const effectTag = effect.effectTag;

        //layOutEffect를 커밋합니다.
        if ((effectTag & (Update | Callback)) !== NoEffect) {
            //commitLifeCycle의 alias를 호출합니다.
            const current = effect.alternate;
            commitLayoutEffectOnFiber(root, current, effect, committedExpirationTime);
        }

        //ref를 attach해주는 sideEffect를 처리합니다.
        if ((effectTag & Ref) !== NoEffect) {
            //Ref와 관련된 attach를 커밋합니다.
            commitAttachRef(effect);
        }
        currentPassiveEffectContext.nextEffect = effect.nextEffect;
    }
};

/**
 *
 * @param {TFiberRoot} root
 * @param {TExpirationTime} renderExpirationTime
 * @description 해당 함수는 sideEffect 그 중에서도 dominstance와 관련된 sideEffect를 처리합니다.
 */
const commitMutationEffects = (root, renderPriorityLevel) => {
    while (currentPassiveEffectContext.nextEffect !== null) {
        const effect = currentPassiveEffectContext.nextEffect;
        const effectTag = effect.effectTag;

        //Text가 리셋되어야 되는 sideEffect를 처리합니다.
        if ((effectTag & ContentReset) !== NoEffect) {
            commitResetTextContent(effect);
        }

        //Ref관련된 정보를 갱신해야되는 sideEffect를 처리합니다.
        if ((effectTag & Ref) !== NoEffect) {
            const current = effect.alternate;
            //만약 현재 파이버가 null이 아니라면 detachRef를 호출합니다.
            if (current !== null) {
                commitDetachRef(effect);
            }
        }
        // 다음 스위치 문은 placement,update,deletion과만 관련있음.
        // 가능한 모든 비트맵 값에 대해 대소문자를 추가할 필요가 없도록 하려면
        // 비트맵 값에 대해 대소문자를 추가할 필요가 없도록, 효과 태그에서 보조 효과를 제거하고
        // 해당 값을 만을 사용하도록 함.
        const primaryEffectTag = effectTag & (Placement | Update | Deletion);
        switch (primaryEffectTag) {
            case Placement: {
                //placement
                commitPlacement(effect);
                // 효과 태그에서 "placement"를 지워서 이것이
                // 삽입된 것을 알 수 있도록, componentDidMount와 같은 라이프사이클이 호출되기 전에 말입니다.
                effect.effectTag &= ~Placement;
                break;
            }
            case PlacementAndUpdate: {
                //placement
                commitPlacement(effect);
                // 효과 태그에서 "placement"를 지워서 이것이
                // 삽입된 것을 알 수 있도록, componentDidMount와 같은 라이프사이클이 호출되기 전에 말입니다.
                effect.effectTag &= ~Placement;

                //update
                const current = effect.alternate;
                //dom관련된 update커밋을 처리합니다.
                commitWork(current, effect);
                break;
            }
            case Update: {
                const current = effect.alternate;
                //dom관련된 update커밋을 처리합니다.
                commitWork(current, effect);
                break;
            }
            case Deletion: {
                commitDeletion(root, effect, renderPriorityLevel);
                break;
            }
        }
        currentPassiveEffectContext.nextEffect = effect.nextEffect;
    }
};

/**
 * @description 해당 함수는 MutationEffects가 일어나기 전에 처리되어야할 commitEffect를 처리합니다.
 * @description passivehookEffect를 다음 tick으로 미루기 위해 스케줄링을 합니다.
 * @description 만약 다음 커밋까지 처리가 되지 않으면 commitRootImpl에 do while문에서 처리합니다.
 */
const commitBeforeMutationEffects = () => {
    while (currentPassiveEffectContext.nextEffect !== null) {
        const effect = currentPassiveEffectContext.nextEffect;
        const effectTag = effect.effectTag;
        if ((effectTag & Passive) !== NoEffect) {
            // NOTE: passiveEffect를 현 tick에서 처리하지 않고 다음 tick에서 처리하기 위해
            // NOTE: scheduleing으로 미루는 것이다.
            if (!currentPassiveEffectContext.rootDoesHavePassiveEffects) {
                currentPassiveEffectContext.rootDoesHavePassiveEffects = true;
                scheduleCallback(NormalPriority, () => {
                    flushPassiveEffects();
                    return null;
                });
            }
        }
        currentPassiveEffectContext.nextEffect = effect.nextEffect;
    }
};

/**
 * @param {TFiberRoot} root @see 파일경로: [TFiberRoot.js](srcs/type/TFiberRoot.js)
 * @param {TRfsPriorityLevel} renderPriorityLevel @see 파일경로: [TRfsPriorityLevel.js](srcs/type/TRfsPriorityLevel.js)
 * @description 해당함수는 root를 커밋합니다.
 */
const commitRootImpl = (root, renderPriorityLevel) => {
    //NOTE: 밀어둔 passiveEffect가 아직 처리가 안되있으면 처리합니다.
    do {
        // flush synchronous work at the end, to avoid factoring hazards like this.
        // 이게 implicit하게는 rootWithPendingPassiveEffects가 flushPassiveEffects가 끝나면 무조건
        // null이 되여야되지만
        //flushSyncUPdateQueue에 의해 commitRoot나 이런게 다시 호출되면
        //rootWithPendingPassiveEffects가 다시 생길 수 있다.
        //이걸 다시 처리하기 위해서 do while문을 사용하는 것이다.
        //NOTE:만약 passiveEffect를 스케줄링을 통해 다음 tick으로 미뤘는데 다음
        //NOTE:commitRootImpl까지도 처리가 안되어 있다면 그걸 처리하고 다시 진행한다.
        flushPassiveEffects();
    } while (currentWorkContext.rootWithPendingPassiveEffects !== null);

    if (currentWorkContext.executionContext & ((RenderContext | CommitContext) !== NoContext)) {
        console.error("Should not already be working. in commitRootImpl.");
        throw new Error("Should not already be working. in commitRootImpl.");
    }

    //커밋할 파이버와 ExpirationTime을 가져옵니다.
    const finishedWork = root.finishedWork;
    const expirationTime = root.finishedExpirationTime;

    //할일이 없으면 early return
    if (finishedWork === null) {
        return null;
    }

    //진행할 커밋관련 데이터를 초기화 합니다.
    root.finishedWork = null;
    root.finishedExpirationTime = NoWork;
    if (finishedWork === root.current) {
        console.error(
            "Cannot commit the same tree as before. This is probably a bug related to the return field. in commitRootImpl."
        );
        throw new Error(
            "Cannot commit the same tree as before. This is probably a bug related to the return field. in commitRootImpl."
        );
    }

    //commitRoot는 continuation을 리턴할 일이 없음 (continuation은 performConcurrentWorkOnRoot에서 계속 수행되기 위해 사용됨으로)
    //이것은 항상 동기적으로 수행됩니다. 그러므로 새로운 콜백을 클리어합니다.
    root.callbackNode = null;
    root.callbackExpirationTime = NoWork;
    root.callbackPriority = NoPriority;

    // 남아잇는 ExpirationTime을 가져오고, 대기 작업(pendingTime)을 RemaingExpirationTime으로 설정합니다.
    const remainingExpirationTimeBeforeCommit = getRemainingExpirationTime(finishedWork);
    markRootFinishedAtTime(root, expirationTime, remainingExpirationTimeBeforeCommit);

    if (root === currentWorkContext.workInProgressRoot) {
        //현재 렌더링중인 루트가 커밋할 루트라면
        //현재 렌더링중인 루트를 초기화합니다.
        currentWorkContext.workInProgressRoot = null;
        currentWorkContext.workInProgress = null;
        currentWorkContext.renderExpirationTime = NoWork;
    } else {
        // 이것은 우리가 마지막으로 작업한 루트와 지금 커밋하는 루트가
        // 지금 커밋하는 루트와 다르다는 것을 나타냅니다.
        //NOTE: rfs에서는 일어날 수 없는 일로 추측됨. ->multiRoot를 지원하지 않음
        console.error("Cannot commit a root that is not working on. in commitRootImpl.");
        throw new Error("Cannot commit a root that is not working on. in commitRootImpl.");
    }

    //NOTE: 기본적으로 본인의 sideEffectList는 자기자신을 포함시키지 않는데 이제 commit을 처리하는 과정에서는
    //NOTE: 이를 포함시켜야합니다.
    let firstEffect;
    if (finishedWork.effectTag > PerformedWork) {
        //파이버 구조는 기본적으로 자기 자신은 sideEffectlist에 포함시키지 않기 떄문에
        //만약 루트가 effect를 가지고 있다라면 해당 effect를 sideEffectlist에 포함시킵니다.
        //기본적으로 가장 마지막에 수행되는 것이다.
        if (finishedWork.lastEffect !== null) {
            finishedWork.lastEffect.nextEffect = finishedWork;
            firstEffect = finishedWork.firstEffect;
        } else {
            firstEffect = finishedWork;
        }
    } else {
        //만약 루트가 effect를 가지고 있지 않다면
        //firstEffect는 단순히 sideEffectlist의 firstEffect가 됩니다.
        firstEffect = finishedWork.firstEffect;
    }

    //NOTE: effect 처리
    if (firstEffect !== null) {
        const prevExecutionContext = currentWorkContext.executionContext;
        currentWorkContext.executionContext |= CommitContext;

        // 커밋 단계는 여러 하위 단계로 나뉩니다. 각 단계마다 별도의 pass를 수행합니다.
        //NOTE: 앞선 말은 firstEffect를 계속 각 단계에 맞춰서 처음부터 끝까지 그 단계로 적용한후
        //NOTE: 다음단계를 다시 처음부터 끝까지 적용하는 것을 의미합니다.
        // 각 단계에 대한 효과 목록의 모든 mutation effect가 모든
        // 모든 layoutEffect이전에 수행되어야 합니다.

        // 첫 번째 단계는 "mutationBefore" 단계입니다. 이 단계에서는 mutation 직전 호스트 트리의
        // 호스트 트리의 상태를 읽는 데 사용되는 모든 effect를 수행합니다. 예를 들어 passiveEffect를
        // 스케줄링하는것이 여기에 해당됩니다.

        //해당 단계를 진행하기전에 commit을 준비합니다.
        //이벤트 활성화 상태를 비활성화 하고 selection관련 정보를 저장합니다.
        //이는 이벤트 활성화를 막어 커밋단계에서의 사이드 이펙트를 막고, selection상태를 돔업데이트 이후에
        //복원하는데 사용하기 위함입니다.
        prepareForCommit(root.containerInfo);

        //이제 처리할 nextEffect를 firstEffect로 설정합니다.
        currentPassiveEffectContext.nextEffect = firstEffect;
        try {
            //첫번쨰 phase인 mutationBefore단계입니다. 이 단계에서는 passiveEffect들을 스케줄링합니다.
            commitBeforeMutationEffects();
        } catch (error) {
            console.error("commitBeforeMutationEffects in CommitRootImpl, 관련 훅을 디버깅", error);
            throw error;
        }

        //2번쨰 페이즈 mutation단계입니다. 이 단계에서는 mutation effect를 수행합니다.
        currentPassiveEffectContext.nextEffect = firstEffect;
        try {
            commitMutationEffects(root, renderPriorityLevel);
        } catch (error) {
            console.error("commitMutationEffects in CommitRootImpl, 관련 dom요소를 디버깅", error);
            throw error;
        }
        //commit을 위해 멈춰두었던 이벤트활성화와 백업해둔 selection상태를 복원합니다.
        resetAfterCommit(root.containerInfo);

        // 이제 wipTree가 currentTree가 되어야 합니다. 이것은 항상 mutation phase이후에 일어나야합니다.
        //왜냐하면 componentWillUnmount를 하는 중에는 previous tree가 current여야 되기 떄문이고
        //layoutphase전에 일어나야합니다. 이는 finishwork가 componentDidMount에서
        //current여야 하기떄문입니다.
        root.current = finishedWork;

        //3번쨰 phase는 layoutphase입니다. host tree가 바뀌고 나서 불려야 되는 sideeffect가 있는 곳입니다.
        //layoutEffect와 class Component lifecycles이 여기서 일어남
        cuurentPassiveEffectContext.nextEffect = firstEffect;
        try {
            commitLayoutEffects(root, expirationTime);
        } catch (error) {
            console.error("commitLayoutEffects in CommitRootImpl, 관련 훅(layoutEffect)을 디버깅", error);
            throw error;
        }

        //effect관련 phase가 끝났음으로 effect를 초기화합니다.
        currentPassiveEffectContext.nextEffect = null;

        //작업이 끝났음으로 스케줄러에게 paint를 하라고 요청합니다.
        requestPaint();
        currentWorkContext.executionContext = prevExecutionContext;
    } else {
        //effect가 없는 상황입니다.
        //단순히 wiptree를 currentTree로 바꿉니다.
        root.current = finishedWork;
    }

    const rootDidHavePassiveEffects = currentPassiveEffectContext.rootDoesHavePassiveEffects;

    //만약 passiveEffect가 남아있다면 root의 참조를 가지고 있어야 됩니다. 나중에 처리해야되기 떄문에
    //하지만 passiveEffect가 더 처리 됬다면 gc를 통해 effect부분을 다 참조를 해제합니다.
    if (rootDidHavePassiveEffects) {
        //나중에 passiveEffect를 처리하기 위한 모든 정보들을 잡아둡니다.
        currentPassiveEffectContext.rootDoesHavePassiveEffects = false;
        currentPassiveEffectContext.rootWithPendingPassiveEffects = root;
        currentPassiveEffectContext.pendingPassiveEffectsExpirationTime = expirationTime;
        currentPassiveEffectContext.pendingPassiveEffectsRenderPriority = renderPriorityLevel;
    } else {
        //해당 이펙트를 다 처리했기 떄문에 gc가 메모리를 해제할 수 있도록 null로 만듭니다.
        nextEffect = firstEffect;
        while (nextEffect !== null) {
            const nextNextEffect = nextEffect.nextEffect;
            nextEffect.nextEffect = null;
            nextEffect = nextNextEffect;
        }
    }

    const remainingExpirationTime = root.firstPendingTime;

    //만약 남은 expirationTime이 sync라면(즉시 수행) 바로 nested하게 업데이트 됨으로
    //nestedUpdateCount를 증가시킵니다.
    if (remainingExpirationTime === Sync) {
        if (root === nestedUpdate.rootWithNestedUpdates) {
            nestedUpdate.nestedUpdateCount++;
        } else {
            nestedUpdate.nestedUpdateCount = 0;
            nestedUpdate.rootWithNestedUpdates = root;
        }
    } else {
        nestedUpdate.nestedUpdateCount = 0;
    }

    //항상 commitRoot이후에 추가 작업이 있는지 확인하기 위하여 ensureRootIsScheduled을 호출합니다.
    ensureRootIsScheduled(root);

    //NOTE: Legacyunbatched 처리해야되면 추가해야 될 로직 여기 에 있음

    //만약 layoutWork가 스케쥴  되어 있으면 flush한다
    //NOTE: commit도중에 발생한 모든 동기적인 작업을 처리하도록 보장하는 것이다.
    flushSyncCallbackQueue();
    return null;
};

/**
 *
 * @param {TFiberRoot} root @see 파일경로: [TFiberRoot.js](srcs/type/TFiberRoot.js)
 * @description 스케쥴러에게 즉시 commitRoot를 요청합니다.
 */
const commitRoot = (root) => {
    const renderPriorityLevel = getCurrentPriorityLevel();
    runWithPriority(ImmediatePriority, commitRootImpl.bind(null, root, renderPriorityLevel));
};

/**
 *
 * @param {TFiberRoot} root @see 파일경로: [TFiberRoot.js](srcs/type/TFiberRoot.js)
 * @description 해당함수는 concurrent렌더를 마무리짓습니다. 이는 커밋을 진행합니다.
 */
//TODO: msUntillTime in RootComplete부분 코드 뺴도 되는지 확인
const finishConcurrentRender = (root) => {
    currentWorkContext.workInProgressRoot = null;
    commitRoot(root);
};

/**
 *
 * @param {TFiberRoot} root
 * @param {boolean} didTimeout
 * @returns {null | lambda(performConcurrentWorkOnRoot)}
 * @description 비동기적으로 root부터 작업을 수행합니다.
 */
export const performConcurrentWorkOnRoot = (root, didTimeout) => {
    //새로운 비동기 사이클을 시작했음으로(rfsEvent로 들어옴) currentEvent타임을 초기화해야된다
    //그래야 next Update가 새로운 new Event타임으로 계산됩니다.
    currentEventTime = NoWork;

    if (didTimeout) {
        //렌더 작업이 완수가 너무 길어져서, 만료시간이 넘어 버렸음.
        //현재 루트가 만료됬다라고 마크를 남기고, 동기적으로 작업을 수행하도록하게함.
        //이 문맥에서 currentTime이 무조건 NoWork가 아니라
        //root.lastExpiredTime으로 설정됨으로
        //ensureRootIsScheduled에서 동기적으로 작업을 수행하게 됩니다.
        const currentTime = requestCurrentTimeForUpdate();
        markRootExpiredAtTime(root, currentTime);
        ensureRootIsScheduled(root);
        return null;
    }

    //다음 할 일의 expirationTime을 얻습니다.
    const expirationTime = getNextRootExpirationTimeToWorkOn(root);
    //할일이 없으면 null을 반환합니다.
    if (expirationTime === NoWork) {
        return null;
    }
    //기존 callbackNode를 저장합니다.
    const originalCallbackNode = root.callbackNode;

    //passive sideEffect를 flush합니다.
    flushPassiveEffects();

    //만약 루트가 현재 렌더링중인 루트가 아니거나, 새로 배정된 expirationTime(우선순위)가
    //현재 렌더링중인 expirationTime와 다르다면 새로운 스택을 준비하고 아니면 이전 스택을 사용합니다.
    if (root !== currentWorkContext.workInProgressRoot || expirationTime !== currentWorkContext.renderExpirationTime) {
        prepareFreshStack(root, expirationTime);
    }

    //workInprogress가 존재하지 않는다면 렌더를 하지않고 null을 반환합니다.
    if (currentWorkContext.workInProgress === null) {
        return null;
    }
    //workInprogress가 존재한다면 작업을 수행합니다.
    //이 경우는 root가 생성됬건, 이전 작업이 남아있던 거기부터 시작합니다.
    //렌더를 시작합니다.
    //현재 작업 컨텍스트를 초기화합니다.
    const prevExecutionContext = currentWorkContext.executionContext;
    currentWorkContext.executionContext |= RenderContext;
    const prevDispatcher = pushDispatcher(root);
    //만약 try로 래핑 필요하면 리팩
    workLoopConcurrent();
    resetContextDependencies();
    currentWorkContext.executionContext = prevExecutionContext;
    popDispatcher(prevDispatcher);
    //모든 작업을 마무리했다면
    if (currentWorkContext.workInProgress === null) {
        //일을 마무리 지었음으로 커밋을 진행할 파이버와 ExpirationTime을 설정합니다.
        //커밋할 fiber 는 wip에 해당함으로 root.current.alternate입니다.
        const finishedWork = (root.finishedWork = root.current.alternate);
        root.finishedExpirationTime = expirationTime;
        //커밋을 시작하는 코드
        finishConcurrentRender(root, finishedWork, expirationTime);
    }

    // 다시 비동기로 루트를 스케쥴링합니다.
    ensureRootIsScheduled(root);
    //POINT X:에 해당하는 부분 이 경우에는 그대로 우선순위에서 밀려서 root의 콜백이 기존의 콜백을 이용하게 됨
    //아마 스케줄러에서 해결되는 부분으로 보임
    if (originalCallbackNode === root.callbackNode) {
        return performConcurrentWorkOnRoot.bind(null, root);
    }
    return null;
};

const finishSyncRender = (root, exitStatus, expirationTime) => {
    currentWorkContext.workInProgress = null;
    commitRoot(root);
};
/**
 *
 * @param {TFiberRoot} root
 * @description 해당함수는 동기 task의 집임점 함수입니다.
 * @description 동기로 work를 수행합니다.
 * @description 이후 호출되는 ensureRootIsScheduled를 통해 나머지 작업을 다음으로 연기합니다.
 */
export const performSyncWorkOnRoot = (root) => {
    //lastExpiredTime->timeout이 일어났을떄 마크됨
    const lastExpiredTime = root.lastExpiredTime;
    const expirationTime = lastExpiredTime !== NoWork ? lastExpiredTime : Sync;
    if (root.finishedExpirationTime === expirationTime) {
        // There's already a pending commit at this expiration time.
        //root.lastExpiredTime에 의해서 얻어지는건 Timeout과 관련된거라 바로 수행해야되는 것들이라 바로 이 함수가
        //바로 실행해야되는 것들을 가지고 온건데
        //그것이 root.finishedExpirationTime이랑 같다라는건 이게 커밋이 일어나야 된다라는 것이고
        //이게 바로 수행되어야 된다라는 것이다.
        commitRoot(root);
    } else {
        //모아진 passiveEffect를 모두 수행합니다.
        //rfs의 작동순서를 보면
        //Render -> rfsUpdateDOM->cleanup LayoutEffects
        //->RunLayoutEffects->Browser paints screen->
        //cleanup Effects -> RunEffects의 순환임으로 perform에서
        //cleanup Effects-> RunEffects가 먼저 수행되어야 합니다.
        flushPassiveEffects();
        //만약 root가 현재 렌더링중인 루트가 아니거나 expirationTime이 바뀌었으면 다시 렌더링을 시작합니다.
        //이는 currentWorkContext바뀌어야 됨을 의미합니다.
        //만약 앞선 조건이 아니면 이전 currentWorkContext를 사용합니다.
        if (
            root !== currentWorkContext.workInProgressRoot ||
            expirationTime !== currentWorkContext.renderExpirationTime
        ) {
            //만약 root가 현재 렌더링중인 루트가 아니거나 expirationTime이 바뀌었으면 다시 렌더링을 시작합니다.
            //이는 currentWorkContext바뀌어야 됨을 의미합니다.
            prepareFreshStack(root, expirationTime);
        }

        //현재 WorkInprogress를 기반으로 렌더링을 시작합니다.
        if (currentWorkContext.workInProgress !== null) {
            const prevExecutionContext = currentWorkContext.executionContext;
            currentWorkContext.executionContext |= RenderContext;
            const prevDispatcher = pushDispatcher(root);

            workLoopSync();

            resetContextDependencies();
            currentWorkContext.executionContext = prevExecutionContext;
            popDispatcher(prevDispatcher);

            root.finishedWork = root.current.alternate;
            root.finishedExpirationTime = expirationTime;
            //커밋을 시작하는 코드
            finishSyncRender(root, currentWorkContext.workInProgressRootExitStatus, expirationTime);

            /// Before exiting, make sure there's a callback scheduled for the next
            // pending level.
            ensureRootIsScheduled(root);
        }
    }
};

/**
 *
 * @param {TFiberRoot} root @see 파일경로: [TFiberRoot.js](srcs/type/TFiberRoot.js)
 * @returns {TExpirationTime} expirationTime @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
 * @description     스케쥴 단계에서 ExpiredTime은 lastExpiredTime과
 * @description firstPendingTime을 기준으로 결정합니다.
 * @description 이전 우선순위가 notWork이 아니라면 lastExpiredTime을 반환합니다.
 * @description 아니라면 firstPendingTime을 반환합니다.->이는 이후 이벤트가 발생했을 때
 * @description 다음 해야될 우선순위 관련된걸 firstPendingTime에 저장하기 때문입니다.
 */
const getNextRootExpirationTimeToWorkOn = (root) => {
    //스케쥴 단계에서 ExpiredTime은 lastExpiredTime과
    //firstPendingTime을 기준으로 결정합니다.
    //이전 우선순위가 noWork이 아니라면 lastExpiredTime을 반환합니다.
    //아니라면 firstPendingTime을 반환합니다.->이는 이후 이벤트가 발생했을 때
    //다음 해야될 우선순위 관련된걸 firstPendingTime에 저장하기 때문입니다.
    const lastExpiredTime = root.lastExpiredTime;
    if (lastExpiredTime !== NoWork) {
        return lastExpiredTime;
    }
    return root.firstPendingTime;
};

/**
 * @description 이 함수는 현재 시간을 계산합니다.->(현재시간을 ExpirationTime으로 변환합니다.)
 * @returns {TExpirationTime} expirationTime @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
 * @description  만료 시간은 현재 시간(시작 시간)에 더하여 계산됩니다.
 * @description  시간)을 더하여 계산합니다. 그러나 동일한 이벤트 내에서 두 개의 업데이트가 예약된 경우에는
 * @description  실제 시계가 첫 번째 호출과 두 번째 호출 사이에 진행되었더라도 시작 시간을 동시에 처리해야 합니다.
 * @description  첫 번째 호출과 두 번째 호출 사이에 시간이 앞당겨지더라도 시작 시간을 동시에 처리해야 합니다*
 * @description  즉, 만료 시간에 따라 업데이트가 일괄 처리되는 방식이 결정되기 때문입니다,
 * @description  동일한 이벤트 내에서 발생하는 동일한 우선순위의 모든 업데이트가 동일한 만료 시간을
 * @description  동일한 만료 시간을 받기를 원합니다.
 * @description  예를 들면 현재 리엑트가 idle상태일때 여러 이벤트가 idle상태에서 한번에 들어왔을 때
 * @description  우리는 이벤트를 일괄적으로 처리하고 싶습니다.(배치처리) 이를 위해서는 이벤트가 동일한 currentTIme을 받아야합니다.
 */
export const requestCurrentTimeForUpdate = () => {
    if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        //렌더링이나 커밋인 상황인 경우 현재 시간은 now()를 기반으로 합니다.
        return msToExpirationTime(now());
    }
    //rfs상태가 아닌, 우리가 브라우저 이벤트 context에서 일어나는 경우
    if (currentEventTime !== NoWork) {
        // 우리가 rfs Context로 오기까지 모든 이벤트에 대해서 똑같은 currenTime을 반환합니다.
        return currentEventTime;
    }
    //첫번쨰 이벤트 타임을 셋팅하는 경우
    currentEventTime = msToExpirationTime(now());
    return currentEventTime;
};
/**
 * @param {TFiberRoot} root @see 파일경로: [TFiberRoot.js](srcs/type/TFiberRoot.js)
 * @description 이 함수는 root의 task를 스케줄링합니다.
 * @description 루트당 오직 하나의 task만을 가질 수 있습니다.
 * @description 이 함수는 매번 업데이트할떄마다 그리고 작업을 종료하기 직전에 호출되어야합니다.
 * @description 해당 함수에서의 ExpiredTime은 sheduler에서의 task만료로써, workLoop에서의 비동기적인 작업의 만료시간을 의미합니다.
 * @description 작동 순서
 * @description 1. 동기적으로 일어나야되는 일인지 확인하고 동기적으로 일어나야 되는 일이라면 동기적으로 일어나게 합니다.(performSyncWorkOnRoot)
 * @description 2. 비동기적으로 일어나야되는 일이면 root에 작업이 있는지 확인하고 판단하고 새로운 작업을 스케줄링해야되면 그 전작업을 취소하고 스케줄링합니다.
 */
const ensureRootIsScheduled = (root) => {
    //ExpiredTime은 두가지 문맥이 존재하는데 scheduler에서는 task의 만료,
    //reconciler에서는 이벤트의 발생시간을 의미합니다.
    //그런데 해당 work와는 scheduler의 문맥과 가까움으로 이를 task의 만료시간으로 생각하고 작성합니다.
    //그렇다라는 것은 즉슨 workLoop에서 비동기적으로 수행하고 나서 일이 남긴 상태에서 만료된 시간을 의미합니다.
    const lastExpiredTime = root.lastExpiredTime;
    //이전 만료시간이
    if (lastExpiredTime !== NoWork) {
        // Special case: Expired work should flush synchronously.
        //정확히는 동기적으로 한번에 처리하고 싶을때 해당 lastExpiredTime을 설정함
        //markRootExpiredAtTime에 의하여 사용됨
        //좀더 정확히는 performConcurrentWorkOnRoot에서 didTimeout이면
        //lastExpiredTime을 설정함->타임아웃이 될때
        //그럼이걸 동기적으로 무조건 수행하길원함
        //예) 일반적으로 처음으로 Root를 스케줄링할떄는 동기로 일어나는게 효율적
        //예)//timeout관련된 코드 타임아웃 나면 리액트에서 lastExpiredTime을 설정함
        root.callbackExpirationTime = Sync;
        root.callbackPriority = ImmediatePriority;

        //해당 함수는 schedule 모듈에서 구현할 예정입니다.
        root.callbackNode = scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
        return;
    }
    //ExpirationTime결정  lastExpiredTime이 없다면, firstPendingTime을 기준으로 결정합니다.
    //여기선 firstPendingTime을 가져와서 어떤 expirationTime이 기다리고 있었는지를 바라봅니다.
    const expirationTime = getNextRootExpirationTimeToWorkOn(root);
    const existingCallbackNode = root.callbackNode;
    //schedule할게 없는 경우
    if (expirationTime === NoWork) {
        //할일이 없습니다. 그렇다면 callback관련된것을 초기화합니다.
        if (existingCallbackNode !== null) {
            root.callbackNode = null;
            root.callbackExpirationTime = NoWork;
            root.callbackPriority = NoPriority;
        }
        return;
    }
    //currentTime을 얻어옵니다.
    const currentTime = requestCurrentTimeForUpdate();
    //currentTime과 expirationTime을 기반으로 우선순위를 결정합니다.
    const priorityLevel = inferPriorityFromExpirationTime(currentTime, expirationTime);

    //루트에는 하나의 작업만 존재해야합니다.
    //만약 루트에 작업이 존재한다면 어떤 작업을 수행해야할지 결정합니다.
    if (existingCallbackNode !== null) {
        const existingCallbackPriority = root.callbackPriority;
        const existingCallbackExpirationTime = root.callbackExpirationTime;
        //POINT X:root.calbackkNode === originalCallbackNode
        //만약 expirationTime이 동일하고 우선순위가 기존 콜백이 더 높다면 작업을 수행하지 않습니다.
        if (existingCallbackExpirationTime === expirationTime && existingCallbackPriority >= priorityLevel) {
            return;
        }
        //만약우선순위가 기존것보다 높다면 하던걸 멈추고 갈아치워야함
        //callback을 취소하고 새로운 callback을 준비합니다.
        cancelCallback(existingCallbackNode);
    }
    root.callbackExpirationTime = expirationTime;
    root.callbackPriority = priorityLevel;
    let callbackNode;
    if (expirationTime === Sync) {
        // 동기적으로 스케쥴링 되어야하는 경우, 동기 큐에 schedule합니다.
        callbackNode = scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    } else {
        //비동기로 스케쥴링 되어야하는 경우, 비동기 큐에 schedule합니다.
        callbackNode = scheduleCallback(priorityLevel, performConcurrentWorkOnRoot.bind(null, root), {
            timeout: expirationTimeToMs(expirationTime) - now(),
        });
    }
    root.callbackNode = callbackNode;
};
/**
 *
 * @param {TFiber} fiber @see 파일경로: [TFiber.js](srcs/type/TFiber.js)
 * @param {TExpirationTime} expirationTime @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
 * @description 해당 함수는 파이버에 대한 업데이트를 스케줄링합니다.
 * @description 기본적으로 해당 함수는 현 파이버를 기준으로 root까지 순회하면서 expirationTime을 수정합니다.
 * @description 그리고 만약 현재 expirationTime이 sync라면 비동기와 같이 ensureRootIsScheduled를 호출하고 Reconciler
 * @description 가 놀고있는 경우 Work를 바로 실행합니다.
 * @description 만약 현재 expirationTime이 sync가 아니라면 ensureRootIsScheduled를 호출합니다.(비동기 work)
 */
export const scheduleUpdateOnFiber = (fiber, expirationTime) => {
    checkForNestedUpdates();

    const root = markUpdateTimeFromFiberToRoot(fiber, expirationTime);

    const priorityLevel = getCurrentPriorityLevel();
    const executionContext = currentWorkContext.executionContext;
    //expirationTime이 가장 높은 우선순위
    if (expirationTime === Sync) {
        ensureRootIsScheduled(root);
        //Reconciler가 놀고있는 경우 Work를 바로 실행
        if (executionContext === NoContext) {
            flushSyncCallbackQueue();
        }
        // } C
    } else {
        //expirationTime이 sync가 아님으로 비동기전용 work가 스케줄링
        ensureRootIsScheduled(root);
    }

    // DiscreteEvent (이산 이벤트)는 우선 순위가 0으로 가장 높다.
    // 이산 이벤트는 사용자의 직접적인 상호작용에 응답해야 하는 이벤트이며,
    // 예를 들어, 클릭(onClick), 키 입력(onKeyPress) 등이 여기에 해당한다.
    // 사용자의 행동에 대한 즉각적인 피드백이 필요하기 때문에 가장 높은 우선 순위를 갖는다.

    // UserBlockingEvent (사용자 차단 이벤트)는 우선 순위가 1이다.
    // 사용자 차단 이벤트는 애플리케이션의 반응성을 유지하기 위해 신속하게 처리되어야 하지만,
    //  이산 이벤트만큼 즉각적인 반응을 요구하지 않는 이벤트이다. 예를 들어, 입력 필드에서의 텍스트 입력과 같이 사용자가 연속적인 행동을 취할 때 발생하는 이벤트가 이에 해당할 수 있다.

    // ContinuousEvent (연속 이벤트)는 우선 순위가 2로 가장 낮다.
    //  연속 이벤트는 사용자와의 상호작용 중 연속적으로 발생할 수 있는 이벤트이며, 예를 들어, 스크롤(onScroll), 마우스 이동(onMouseMove), 윈도우 리사이징(onResize) 등이 여기에 해당한다. 이러한 이벤트는 애플리케이션의 성능에 영향을 미칠 수 있으므로, 필요에 따라 업데이트 빈도를 조절하여 처리된다.

    // 이러한 맥락에서, 이산 이벤트는 바로 처리되어야 함에도 불구하고, 실행 중인 우선 순위 레벨이 UserBlockingPriority보다
    // 높은 경우에만 펜딩으로 진행됨을 의미한다. 이는 rfs가 다양한 우선 순위의 이벤트를 효과적으로 관리하고 사용자 경험을 최적화하기 위한 메커니즘의 일부이다.
    if (
        (executionContext & DiscreteEventContext) !== NoContext &&
        (priorityLevel === UserBlockingPriority || priorityLevel === ImmediatePriority)
    ) {
    }
    {
        //이산 이벤트를 기다리고 있는 이벤트가 없으면 map을 생성하고 expirationTime을 설정합니다.
        if (rootsWithPendingDiscreteUpdates === null) {
            rootsWithPendingDiscreteUpdates = new Map([[root, expirationTime]]);
        } else {
            const lastDiscreteTime = rootsWithPendingDiscreteUpdates.get(root);
            // 해당 루트에 대한 lastDiscreteTime이 우선순위가 더 낮다면 expirationTime을 설정합니다. 만약 그렇지 않다면
            // expirationTime을 설정하지 않습니다.
            if (lastDiscreteTime === undefined || lastDiscreteTime > expirationTime) {
                rootsWithPendingDiscreteUpdates.set(root, expirationTime);
            }
        }
    }
};
export const scheduleWork = scheduleUpdateOnFiber;

/**
 *
 * @param {lambda} fn
 * @param {*} a
 * @param {*} b
 * @param {*} c
 * @param {*} d
 * @returns {any}
 * @description] 이산 이벤트를 이산 이벤트 문맥 내에서 실행시킴.
 * @description 우선순위는 userBlockingPriority로 설정되고
 * @description 이전 실행문맥이 없고, 이산 이벤트 문맥에서 동기적인 작업이 발생해야 하는 상황이라면
 * @description flush를 수행합니다.
 */
export const discreteUpdates = (fn, a, b, c, d) => {
    const previousExecutionContext = currentWorkContext.executionContext;
    currentWorkContext.executionContext |= DiscreteEventContext;
    try {
        return runWithPriority(UserBlockingPriority, fn.bind(null, a, b, c, d));
    } finally {
        currentWorkContext.executionContext = previousExecutionContext;
        //이전에 하던 작업이 없고, discreteUpdates에 의해 동기 작업이 일어나야되는 상황이라면
        //flush를 수행합니다.
        if (currentWorkContext.executionContext === NoContext) {
            flushSyncCallbackQueue();
        }
    }
};

const flushPendingDiscreteUpdates = () => {
    if (rootsWithPendingDiscreteUpdates !== null) {
        // For each root with pending discrete updates, schedule a callback to
        // immediately flush them.
        const roots = rootsWithPendingDiscreteUpdates;
        rootsWithPendingDiscreteUpdates = null;
        roots.forEach((expirationTime, root) => {
            markRootExpiredAtTime(root, expirationTime);
            ensureRootIsScheduled(root);
        });
        // Now flush the immediate queue.
        flushSyncCallbackQueue();
    }
};

export const flushDiscreteUpdates = () => {
    // However, `act` uses `batchedUpdates`, so there's no way to distinguish
    // those two cases. Need to fix this before exposing flushDiscreteUpdates
    // as a public API.
    if ((currentWorkContext.executionContext & (BatchedContext | RenderContext | CommitContext)) !== NoContext) {
        // We're already rendering, so we can't synchronously flush pending work.
        // This is probably a nested event dispatch triggered by a lifecycle/effect,
        // like `el.focus()`. Exit.
        return;
    }
    flushPendingDiscreteUpdates();
    // If the discrete updates scheduled passive effects, flush them now so that
    // they fire before the next serial event.
    flushPassiveEffects();
};
