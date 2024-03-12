import { push, pop, peek } from "./schedulerMinHeap.js";
import {
    requestHostCallback,
    requestHostTimeout,
    cancelHostTimeout,
    shouldYieldToHost,
    getCurrentTime,
    requestPaint,
} from "./schedulerHostConfig.js";

import {
    ImmediatePriority,
    UserBlockingPriority,
    NormalPriority,
    LowPriority,
    IdlePriority,
} from "../const/CSchedulerPriority.js";

import {
    IMMEDIATE_PRIORITY_TIMEOUT,
    USER_BLOCKING_PRIORITY_TIMEOUT,
    NORMAL_PRIORITY_TIMEOUT,
    LOW_PRIORITY_TIMEOUT,
    IDLE_PRIORITY_TIMEOUT,
} from "../const/CSchedulerTimeout.js";

//태스크 큐를 모아두는 공간
const taskQueue = [];

//타이머 큐를 모아두는 공간
//callback을 스케쥴 해야된든 책임이 있음
//타이머큐의 이유 :
// 주요 이점은 스케줄러가
// 스케줄러의 `메시지` 이벤트 처리기
// 가 처리해야 하는 네이티브 브라우저 타이머의 수를 줄이는 것입니다.
// 프레임이 끝나면 스케줄러가 메인 스레드에 대한 제어권을 더 빨리 되찾을 수 있습니다.
// 브라우저에 양보하지 않고 타이머 대기열을 플러시할 수 있기 때문에
// 타이머 이벤트에 양보하지 않고도 타이머 대기열을 플러시할 수 있기 때문에 작업 전환 오버헤드도 줄어듭니다(
// isInputPending`이 없는 경우, 이는 대부분 이론적인 승리입니다.
// 매 프레임마다 양보해야 하기 때문에 이론적으로는 대부분 승리입니다).

// 지연되지 않은 작업의 대기열이 비어 있지 않은 경우, 즉 다음과 같은 경우
// 보류 중인 CPU 바운드 작업 - 스케줄러는 브라우저 타이머를 피할 수 있습니다.
// 를 완전히 피할 수 있습니다.
// 작업(`메시지` 이벤트 핸들러 내부)을 플러시하는 동안 자체 타이머 큐를 주기적으로 확인하여 브라우저 타이머를 완전히 피할 수 있습니다. CPU를 사용하는 작업이
// 완료된 후에도 여전히 대기 중인 지연 작업이 있는 경우, 스케줄러는
// 가장 빠른 지연이 경과하면 실행되는 단일 브라우저 타이머를 예약합니다.
// 가 경과하면 실행되는 단일 브라우저 타이머를 예약합니다.

//가장 간단하게는 setTimeOut의 호출을 줄여서 Io작업을 줄일 수 있음

//지연된 작업을 수행하는데 사용되는 타이머큐
const timerQueue = [];

//해당 일을 하고 있는 task의 Id를 저장하는 변수:setTimeOut을 통해 생성된 task의 id를 저장
let taskIDCounter = 1;

let currentTask = null;
let currentPriorityLevel = NormalPriority;

//workLoop를 수행중인지에 대한 플래그
let isPerformingWork = false;

///콜백이 등록이되어있는지, 타임아웃이 예약되어 있는지에 대한 플래그
let isHostCallbackScheduled = false;
let isHostTimeoutScheduled = false;

/**
 *
 * @param {import("../../type/TExpirationTime.js").TExpirationTime} currentTime
 * @description Timer를 전진시키는데, 더이상 취소가 되어있거나, 태스크 큐에 넣어야되는 상황이 안나올떄까지 반복한다.
 * @description 가장 주된 사용처는 타이머 큐를 전진시키는데에 있고 이는 setTimeout에 의해서 여러개의 타이머를 생성시키는게 아니라
 * @description 내부적으로 하나의 타이머를 사용해서 여러개의 타이머를 관리하는데에 있다.
 * @description 사용에 있어서는 가장 최신 만료된 타이머를 태스크로 이동시켜 peek을 하기 위해 준비하는데 사용된다.
 */
const advanceTimers = (currentTime) => {
    // Check for tasks that are no longer delayed and add them to the queue.
    //타이머 큐로부터 타이머 하나집어오고
    let timer = peek(timerQueue);
    while (timer !== null) {
        //타이머의 콜백이 null이면 취소된 타이머이다.-> 그냥 뺴고 다음꺼 진행
        if (timer.callback === null) {
            pop(timerQueue);
        } else if (timer.startTime <= currentTime) {
            //타이머가 만료됨-> 뺴고, 그걸 태스크큐에 넣어야되는데 타이머와
            //태스크큐가 정렬방식이 다름으로 sortIndex를 expirationTime으로 설정하고
            //태스크큐에 넣는다.
            pop(timerQueue);
            timer.sortIndex = timer.expirationTime;
            push(taskQueue, timer);
        } else {
            //전진완료
            // Remaining timers are pending.
            return;
        }
        //전진
        timer = peek(timerQueue);
    }
};

/**
 *
 * @param {import("../../type/TExpirationTime.js").TExpirationTime} currentTime
 * @description 현재 시간에 대해서 타임아웃을 처리하는 함수
 * @description 타이머를 전진시켜 만료된 모든 작업을 태스크 큐로 넣는다.
 */
const handleTimeout = (currentTime) => {
    //타임아웃을 처리할 거기 떄문에 이제 타임아웃 예약플래그를 false로 바꾼다.
    isHostTimeoutScheduled = false;
    //타이머를 전진시켜서, 타이머 큐에서 태스크 큐로 만료된 작업을 넣는다.
    advanceTimers(currentTime);

    //만약 콜백이 스케쥴 되어 있따면 early return
    if (isHostCallbackScheduled) return;
    if (peek(taskQueue) !== null) {
        //스케쥴 플래그를 키고
        isHostCallbackScheduled = true;
        //flushWork를 요청한다, flushWork는 requestHostCallback api를 통해서 호출된다.
        requestHostCallback(flushWork);
    } else {
        //타이머 큐에서 집어서
        const firstTimer = peek(timerQueue);
        //만약 잔료되지 않은작업이 존재한다면
        if (firstTimer !== null) {
            //TODO:여기가 캔슬되면 어떻게되는지
            //타임아웃을 진행시킨다. handleTimeout은 requestHostTimeout api를 통해서 호출된다.
            //advancedTime를 진행했는데도 taskQueue가 비어 있다면
            //취소된 tiemoutTask로 인해 handleTimeout이 호출된 것이므로 다음 타임아웃을 요청한다.
            //여기서 플래그를 키지 않은이유는 내부적으로 처리되고 있는거고, 외부에서 처리되는게 아니기 때문이다.
            requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
        }
    }
};

/**
 *
 * @param {boolean} hasTimeRemaining
 * @param {import("../../type/TExpirationTime.js").TExpirationTime} initialTime
 * @returns {boolean} 해당 callback이 더 일을 수행해야된다면 true를 반환한다.
 * @description 실제 태스크큐가 작업이 일어나는 곳이다. loop를 돌면서 시분할 수행을 할 수 있고, 작업이 남을때까지 반복한다.
 */
const workLoop = (hasTimeRemaining, initialTime) => {
    let currentTime = initialTime;
    advanceTimers(currentTime);
    currentTask = peek(taskQueue);
    while (currentTask !== null) {
        if (currentTask.expirationTime > currentTime && (!hasTimeRemaining || shouldYieldToHost())) {
            //현재 시간이 만료시간보다 작고, 시간이 남아있지 않거나, 호스트에 양보해야된다면(deadline에 도착)
            //양보해야된다-> 이는 hasMoreWork를 통해 일이 더 남았다라고 전달
            break;
        }
        const callback = currentTask.callback;
        if (callback !== null) {
            //callback 소비할 것 임으로 null로 바꾼다.
            currentTask.callback = null;
            currentPriorityLevel = currentTask.priorityLevel;
            //callback에게 줘야되는 인자가 타임아웃이었는지 아닌지에 대한 것이다.
            const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
            const continuationCallback = callback(didUserCallbackTimeout);
            currentTime = getCurrentTime();
            if (typeof continuationCallback === "function") {
                currentTask.callback = continuationCallback;
            } else {
                //계속해야 될 것이 아니라는 것은 태스크가 끝났다는 것이다.
                //현재 태스크를 뺀다.
                if (currentTask === peek(taskQueue)) {
                    pop(taskQueue);
                }
            }
            advanceTimers(currentTime);
        } else {
            pop(taskQueue);
        }
        currentTask = peek(taskQueue);
    }
    // Return whether there's additional work
    if (currentTask !== null) {
        //할일 이 더 남아있다면 true를 반환
        return true;
    } else {
        //작업은 끝났고, 타이머큐에 남은 작업은 비동기적으로 돌리고 작업은 완수했다고 반환
        const firstTimer = peek(timerQueue);
        if (firstTimer !== null) {
            requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
        }
        return false;
    }
};

/**
 *
 * @param {boolean} hasTimeRemaining
 * @param {import("../../type/TExpirationTime.js").TExpirationTime} initialTime
 * @returns {boolean} 해당 callback이 더 일을 수행해야된다면 true를 반환한다.
 * @description workLoop를 돌리는 함수이다.
 */
const flushWork = (hasTimeRemaining, initialTime) => {
    // We'll need a host callback the next time work is scheduled.
    //flushWork가 호출되었음으로 hostCallbackScheduled를 false로 바꾼다.
    isHostCallbackScheduled = false;
    if (isHostTimeoutScheduled) {
        //이전의 hostCallback에 의한 타임아웃이 예약되어 있다면
        //모두 초기화
        isHostTimeoutScheduled = false;
        cancelHostTimeout();
    }

    //workLoop진행 전에 performWork플래그를 킨다
    isPerformingWork = true;
    const previousPriorityLevel = currentPriorityLevel;
    try {
        return workLoop(hasTimeRemaining, initialTime);
    } finally {
        currentTask = null;
        currentPriorityLevel = previousPriorityLevel;
        isPerformingWork = false;
    }
};

// https://github.com/facebook/react/pull/13720
/**
 *
 * @param {import("../../type/TSchedulerPriority.js").TSchedulerPriority} priorityLevel
 * @param {lambda} eventHandler
 * @returns {lambda()} lamda의 반환값을 반환한다.
 * @description 해당 함수는 우선순위에 따라서 실행을 하는 함수이다. 하지만 스케쥴러의 현재 흐름을
 * @description 잠시 인터럽트해서 시킴으로 현재 실행되고 있는 priorityLevel역시 잠시 변경된다.
 */
const runWithPriorityImpl = (priorityLevel, eventHandler) => {
    switch (priorityLevel) {
        case ImmediatePriority:
        case UserBlockingPriority:
        case NormalPriority:
        case LowPriority:
        case IdlePriority:
            break;
        default:
            priorityLevel = NormalPriority;
    }

    const previousPriorityLevel = currentPriorityLevel;
    currentPriorityLevel = priorityLevel;
    try {
        return eventHandler();
    } finally {
        currentPriorityLevel = previousPriorityLevel;
    }
};

/**
 *
 * @param {import("../../type/TSchedulerPriority.js").TSchedulerPriority} priorityLevel
 * @returns {import("../../type/TSchedulerTimeout.js").TSchedulerTimeout} 해당 우선순위에 맞는 타임아웃을 반환한다.
 * @description 해당 함수는 우선순위에 따라서 타임아웃을 반환하는 함수이다.
 */
const timeoutForPriorityLevel = (priorityLevel) => {
    switch (priorityLevel) {
        case ImmediatePriority:
            return IMMEDIATE_PRIORITY_TIMEOUT;
        case UserBlockingPriority:
            return USER_BLOCKING_PRIORITY_TIMEOUT;
        case IdlePriority:
            return IDLE_PRIORITY_TIMEOUT;
        case LowPriority:
            return LOW_PRIORITY_TIMEOUT;
        case NormalPriority:
        default:
            return NORMAL_PRIORITY_TIMEOUT;
    }
};

/**
 *
 * @param {import("../../type/TSchedulerPriority.js").TSchedulerPriority} priorityLevel
 * @param {lambda} callback
 * @param {*} options
 * @returns {import("../../type/TSchedulerTask.js").TSchedulerTask} 새로 생성된 태스크를 반환한다.
 * @description 해당 함수는 스케쥴러 모듈에게 새로운 태스크를 스케쥴링하도록 하는 함수이다.
 */
const scheduleCallbackImpl = (priorityLevel, callback, options) => {
    const currentTime = getCurrentTime();

    let startTime;
    let timeout;
    //option에 delay, timeout이 들어있음
    //startTime과 timeout을 지정
    if (typeof options === "object" && options !== null) {
        const delay = options.delay;
        if (typeof delay === "number" && delay > 0) {
            startTime = currentTime + delay;
        } else {
            startTime = currentTime;
        }
        //만료시간을 지정
        timeout =
            typeof options.timeout === "number"
                ? options.timeout
                : //만약 타임아웃이 없으면 현재 priorityLevel에 맞는 타임아웃을 설정
                  timeoutForPriorityLevel(priorityLevel);
    } else {
        //option이 없으면 현재 시간을 시작시간으로 설정
        startTime = currentTime;
        //현재 priorityLevel에 맞는 타임아웃을 설정
        timeout = timeoutForPriorityLevel(priorityLevel);
    }
    //만료시간을 설정
    const expirationTime = startTime + timeout;

    const newTask = {
        id: taskIDCounter++,
        callback,
        priorityLevel,
        startTime,
        expirationTime,
        sortIndex: -1,
    };

    //타이머큐를 수행해야됨
    //startTime이 현재 시간 보다 크면 지연된 작업이다.
    if (startTime > currentTime) {
        //This is a delayed task.
        newTask.sortIndex = startTime;
        push(timerQueue, newTask);
        //태스크큐에 작업이 없고, 타이머큐에 있는 작업이 현재 작업이라면
        //타이머가 가장 우선순위가 되버린것
        if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
            // All tasks are delayed, and this is the task with the earliest delay.
            //타이머의 일이 예약되어 있다면 우선순위가 바꼈음으로 기존 껄 취소해야됨
            if (isHostTimeoutScheduled) {
                cancelHostTimeout();
            } else {
                isHostTimeoutScheduled = true;
            }
            // 새로 우선순위가 1등이된 타이머를 hostTimeout으로 실행시켜야됨
            requestHostTimeout(handleTimeout, startTime - currentTime);
        }
    } else {
        //taskQueue를 수행해야됨
        newTask.sortIndex = expirationTime;
        push(taskQueue, newTask);
        // Schedule a host callback, if needed. If we're already performing work,
        // wait until the next time we yield.
        if (!isHostCallbackScheduled && !isPerformingWork) {
            //만약에 현재 작업이 없고, hostCallback이 예약되어 있지 않다면
            //hostCallback을 예약해야됨
            isHostCallbackScheduled = true;
            requestHostCallback(flushWork);
        }
    }
    return newTask;
};

/**
 *
 * @param {import("../../type/TSchedulerTask.js").TSchedulerTask} task
 * @description 해당 함수는 태스크를 취소하는 함수이다.
 */
const cancelCallbackImpl = (task) => {
    //task.callback 만 null로 바꿔두면 heap에는 남아 있지만 실행될떄 알아서 빠지게 된다.
    taks.callback = null;
};

/**
 *
 * @returns {import("../../type/TSchedulerPriority.js").TSchedulerPriority}
 * @description 현재 우선순위를 반환하는 함수이다.
 */
const getCurrentPriorityLevelImpl = () => {
    return currentPriorityLevel;
};

/**
 * @description 현재 브라우저에게 양보해야될지에 대한 여부를 반환하는 함수이다.
 * @returns {boolean}
 */
const shouldYieldImpl = () => {
    const currentTime = getCurrentTime();
    advanceTimers(currentTime);
    const firstTask = peek(taskQueue);
    return (
        //advancedTime를 통해 삽입된 task던, reconciler에게 삽입된 task던 새롭게 삽입된 task가 우선순위가 더 높고
        //currentTask도 존재하고, firstTask또한 callback을 가지고 있음
        //그런데 firstTask는 실행해야될 시간이 지남.
        (firstTask !== currentTask &&
            currentTask !== null &&
            firstTask !== null &&
            firstTask.callback !== null &&
            firstTask.startTime <= currentTime &&
            firstTask.expirationTime < currentTask.expirationTime) ||
        shouldYieldToHost()
    );
};

const requestPaintImpl = requestPaint;

export {
    runWithPriorityImpl,
    scheduleCallbackImpl,
    cancelCallbackImpl,
    shouldYieldImpl,
    requestPaintImpl,
    getCurrentPriorityLevelImpl,
    getCurrentTime as nowImpl,
    ImmediatePriority as ImmediatePriorityImpl,
    UserBlockingPriority as UserBlockingPriorityImpl,
    NormalPriority as NormalPriorityImpl,
    LowPriority as LowPriorityImpl,
    IdlePriority as IdlePriorityImpl,
};
