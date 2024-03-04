import {
    NoContext,
    BatchedContext,
    EventContext,
    RenderContext,
    CommitContext,
    LegacyUnbatchedContext,
} from "../type/TExecutionContext.js";
import { RootIncomplete, RootCompleted } from "../type/TRootExitStatus.js";
import { expirationTimeToMs, msToExpirationTime, computeAsyncExpiration } from "../fiber/fiberExiprationTime.js";
import { markRootUpdatedAtTime } from "../fiber/fiberRoot.js";
import { TFiberRoot } from "../type/TFiberRoot.js";
import { NoWork, Sync, Idle } from "../type/TExpirationTime.js";
import { createWorkInProgress } from "../fiber/fiber.js";
import {
    // scheduleCallback,
    // cancelCallback,
    getCurrentPriorityLevel,
    runWithPriority,
    shouldYield,
    requestPaint,
    now,
    NoPriority,
    ImmediatePriority,
    UserBlockingPriority,
    NormalPriority,
    LowPriority,
    IdlePriority,
    //TODO: implementFlushSyncCallbackQueue,scheduleSyncCallback
    // flushSyncCallbackQueue,
    // scheduleSyncCallback,
} from "../scheduler/schedulerInterface.js";
/**
 * @description WorkLoop내부에서 nested하게 업데이트가 계속 반복되는걸 관리하는 객체입니다.
 * @description moduleScope로 관리되는 객체입니다.
 */
const nestedUpdate = {
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
    //TODO: 좀더 정확한 이해가 필요함
    workInProgressRootLatestProcessedExpirationTime: Sync,
};

/**
 * @description 현재 렌더링중인 루트에 대해서 컴포넌트가 남긴 작업이 있을떄
 * @description currentWorkContext에 처리되지 않은 다음 업데이트를 마킹합니다.
 * @param {TExpirationTime} expirationTime @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
 */
export const markUnprocessedUpdateTime = (expirationTime) => {
    if (expirationTime > workInProgressRootNextUnprocessedUpdateTime) {
        workInProgressRootNextUnprocessedUpdateTime = expirationTime;
    }
};

const checkForNestedUpdates = () => {
    if (nestedUpdate.checkForNestedUpdates()) {
        nestedUpdate.clear();
        throw new Error("Maximum update depth exceeded. shouldeDebugThis");
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
        //TODO: cancelTimeout
        //TODO: noTimeout
        root.timeoutHandle = noTimeout;
        cancelTimeout(timeoutHandle);
    }

    //파이버 스택을 초기화합니다.
    if (currentWorkContext.workInProgress !== null) {
        let interruptedWork = currentWorkContext.workInProgress.return;
        while (interruptedWork !== null) {
            //TODO: unwindInterruptedWork implement
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

    //Batched : https://github.com/facebook/react/pull/15502
    //하나의 이벤트 핸들러안에 있는 여러개의 setState같은 건 배치처리를 이미 하고 있으나
    //외부시스템에 의한 업데이트 등에 대한 일괄 처리는 진행되고 있지 않음
    //그런데 이거에 대한 대처 방안은 사실 concurrent모드가 이를 해결함:
    //그러나 동기적인 모드에서는 concurrent모드가 아니기 때문에 이를 처리해야함
    //그거떄문에 이상적으로 배치모드라는 sync이외의 모드가 존재함
    //이를 이용해서 배치모드는 모든 업데이트를 다음 React이벤트로 연기하는 일괄처리 기본모드를 활성화함
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
            //TODO: implement computeInteractiveExpiration
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
 *
 * @param {TFiberRoot} root
 * @description 해당함수는 동기 task의 집임점 함수입니다.
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
        //TODO: implement commitRoot
        commitRoot(root);
    } else {
        //TODO: flushPassiveEffects
        //모아진 passiveEffect를 모두 수행합니다.
        //React의 작동순서를 보면
        //Render -> ReactUpdateDOM->cleanup LayoutEffects
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
            //TODO: pushDispatcher
            const prevDispatcher = pushDispatcher(root);

            //TODO: implement workLoopSync
            //TODO: 만약 error처리 로직이 필요하면 try로직으로 리팩
            workLoopSync();

            //TODO: 필요한지확인
            //resetContextDependencies();
            currentWorkContext.executionContext = prevExecutionContext;
            //TODO: popDispatcher
            popDispatcher(prevDispatcher);

            root.finishedWork = root.current.alternate;
            root.finishedExpirationTime = expirationTime;
            //커밋을 시작하는 코드
            //TODO: implement finishSyncRender
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
    //이전 우선순위가 notWork이 아니라면 lastExpiredTime을 반환합니다.
    //아니라면 firstPendingTime을 반환합니다.->이는 이후 이벤트가 발생했을 때
    //다음 해야될 우선순위 관련된걸 firstPendingTime에 저장하기 때문입니다.
    const lastExpiredTime = root.lastExpiredTime;
    if (lastExpiredTime !== NoWork) {
        return lastExpiredTime;
    }
    return root.firstPendingTime;
};

/**
 * @description ExpirationTime을 구하는 방식에 의하면 event는 배치가 될수가 없습니다.
 * @description 그렇다면 임의적으로 event와 관련된 우선순위를 따로 묶어줄 수 있는 방법이 필요합니다
 * @description 이를 위한 변수입니다.
 * @description 생애주기가 currentWorkContext와 다름으로 다른 객체로 관리합니다.
 * @type {TExpirationTime} @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
 */
// 만료 시간은 현재 시간(시작 시간)에 더하여 계산됩니다.
// 시간)을 더하여 계산합니다. 그러나 동일한 이벤트 내에서 두 개의 업데이트가 예약된 경우에는
// 실제 시계가 첫 번째 호출과 두 번째 호출 사이에 진행되었더라도 시작 시간을 동시에 처리해야 합니다.
// 첫 번째 호출과 두 번째 호출 사이에 시간이 앞당겨지더라도 시작 시간을 동시에 처리해야 합니다.

// 즉, 만료 시간에 따라 업데이트가 일괄 처리되는 방식이 결정되기 때문입니다,
// 동일한 이벤트 내에서 발생하는 동일한 우선순위의 모든 업데이트가 동일한 만료 시간을
// 동일한 만료 시간을 받기를 원합니다.
// 예를 들면 현재 리엑트가 idle상태일때 여러 이벤트가 idle상태에서 한번에 들어왔을 때
// 우리는 이벤트를 일괄적으로 처리하고 싶습니다.(배치처리) 이를 위해서는 이벤트가 동일한 만료시간을 받아야합니다.
let currentEventTime = NoWork;
export const requestCurrentTimeForUpdate = () => {
    if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
        //이벤트가 발생한 경우
        //이벤트가 발생한 경우에는 이벤트의 만료시간을 반환합니다.
        //TODO:: implement now();
        return msToExpirationTime(now());
    }
    //rfs상태가 아닌, 우리가 브라우저 이벤트 context에서 일어나는 경우
    if (currentEventTime !== NoWork) {
        // 우리가 rfs Context로 오기까지 모든 이벤트에 대해서 똑같은 만료시간을 반환합니다.
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
        //예) 일반적으로 처음으로 Root를 스케줄링할떄는 동기로 일어나는게 효율적
        //예)//timeout관련된 코드 타임아웃 나면 리액트에서 lastExpiredTime을 설정함
        root.callbackExpirationTime = Sync;

        //TODO:  scheduler 모듈에서 priority를 명세하고 구현할 예정입니다.
        root.callbackPriority = ImmediatePriority;

        //TODO: scheduleSyncCallback
        //해당 함수는 schedule 모듈에서 구현할 예정입니다.
        root.callbackNode = scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
        return;
    }
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

    const currentTime = requestCurrentTimeForUpdate();
    //TODO: scheduler 관련 처리에서 같이 진행할예정입니다.
    const priorityLevel = inferPriorityFromExpirationTime(currentTime, expirationTime);

    //루트에는 하나의 작업만 존재해야합니다.
    //만약 루트에 작업이 존재한다면 어떤 작업을 수행해야할지 결정합니다.
    if (existingCallbackNode !== null) {
        const existingCallbackPriority = root.callbackPriority;
        const existingCallbackExpirationTime = root.callbackExpirationTime;
        //만약 expirationTime이 동일하고 우선순위가 기존 콜백이 더 높다면 작업을 수행하지 않습니다.
        if (existingCallbackExpirationTime === expirationTime && existingCallbackPriority >= priorityLevel) {
            return;
        }
        //TODO: cancelCallback
        //callback을 취소하고 새로운 callback을 준비합니다.
        cancelCallback(existingCallbackNode);
    }
    root.callbackExpirationTime = expirationTime;
    root.callbackPriority = priorityLevel;
    let callbackNode;
    if (expirationTime === Sync) {
        // 동기적으로 스케쥴링 되어야하는 경우, 동기 큐에 schedule합니다.
        //TODO: scheduleSyncCallback
        callbackNode = scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    } else {
        //TODO: scheduleCallback
        //비동기로 스케쥴링 되어야하는 경우, 비동기 큐에 schedule합니다.
        callbackNode = scheduleCallback(
            priorityLevel,
            performConcurrentWorkOnRoot.bind(null, root),
            //TODO: 이 밑 부분 정확히 해야됨
            { timeout: expirationTimeToMs(expirationTime) - now() }
        );
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
        //TODO: 현재 주석과 관련된거 LegacyRender를 위한 것으로 보임 확정되면 주석 코드 제거
        //TODO: 관련된 부분 C
        //C begin
        // if (
        //     // Check if we're inside unbatchedUpdates
        //     executionContext & (LegacyUnbatchedContext !== NoContext) &&
        //     (executionContext & (RenderContext | CommitContext)) === NoContext
        // ) {

        //     //TODO: performSyncWorkOnRoot
        //     performSyncWorkOnRoot(root);
        // } else {
        //C end
        //TODO: implement ensureRootIsScheduled
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

    if ((executionContext & DiscreteEventContext) !== NoContext) {
        //TODO: 이부분은 이벤트와 관련된 부분이다. 이부분을 나중에 구현해야함
    }
};
export const scheduleWork = scheduleUpdateOnFiber;
