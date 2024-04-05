import * as Scheduler from "./schedulerImpl.js";

//이렇게 분리한 이유는 Interface와 구현 채를 분리하여, 구현체를 바꿀 수 있게 하기 위함이다.
const {
    runWithPriorityImpl: schedulerRunWithPriority,
    scheduleCallbackImpl: schedulerScheduleCallback,
    cancelCallbackImpl: schedulerCancelCallback,
    shouldYieldImpl: schedulerShouldYield,
    requestPaintImpl: schedulerRequestPaint,
    nowImpl: schedulerNow,
    ImmediatePriorityImpl: schedulerImmediatePriority,
    UserBlockingPriorityImpl: schedulerUserBlockingPriority,
    NormalPriorityImpl: schedulerNormalPriority,
    LowPriorityImpl: schedulerLowPriority,
    IdlePriorityImpl: schedulerIdlePriority,
    getCurrentPriorityLevelImpl: schedulerGetCurrentPriorityLevel,
} = Scheduler;

import {
    ImmediatePriority,
    UserBlockingPriority,
    NormalPriority,
    LowPriority,
    IdlePriority,
} from "../const/CRfsPriorityLevel.js";

export const shouldYield = schedulerShouldYield;
export const requestPaint = schedulerRequestPaint;

const fakeCallbackNode = {};
let syncQueue = null;
let immediateQueueCallbackNode = null;
let isFlushingSyncQueue = false;
export const now = schedulerNow;
/**
 * @returns {TRfsPriorityLevel}
 * @description 현재 스케줄러 모듈 내에서의 current priority level을 가져온다.
 * @description 이건 주로 computeExpirationForFiber에서 사용된다.
 * @description 해당 부분에서 schedulerNoPriority가 나오면 이는 에러를 던진다.
 */
export const getCurrentPriorityLevel = () => {
    switch (schedulerGetCurrentPriorityLevel()) {
        case schedulerImmediatePriority:
            return ImmediatePriority;
        case schedulerUserBlockingPriority:
            return UserBlockingPriority;
        case schedulerNormalPriority:
            return NormalPriority;
        case schedulerLowPriority:
            return LowPriority;
        case schedulerIdlePriority:
            return IdlePriority;
        default:
            console.error("Unknown priority level.");
            throw new Error("Unknown priority level.");
    }
};

/**
 *
 * @param {TRfsPriorityLevel} reactPriorityLevel
 * @returns TODO:해당 타입정의
 * @description 해당 함수는 스케줄 impl모듈에게 스케줄 고유의 priority level을 넘겨주기 위한 함수이다.
 */
export const rfsPriorityToSchedulerPriority = (reactPriorityLevel) => {
    switch (reactPriorityLevel) {
        case ImmediatePriority:
            return schedulerImmediatePriority;
        case UserBlockingPriority:
            return schedulerUserBlockingPriority;
        case NormalPriority:
            return schedulerNormalPriority;
        case LowPriority:
            return schedulerLowPriority;
        case IdlePriority:
            return schedulerIdlePriority;
        default:
            console.error("Unknown priority level.");
            throw new Error("Unknown priority level.");
    }
};

/**
 *
 * @param {TRfsPriorityLevel} reactPriorityLevel
 * @param {Lamda} fn
 * @returns {Lamda's Return Type}
 * @description 해당 함수는 스케줄러 모듈에게 priority를 기반으로 해당 lamda를 실행하도록 하는 함수이다.
 */
export const runWithPriority = (reactPriorityLevel, fn) => {
    const priorityLevel = rfsPriorityToSchedulerPriority(reactPriorityLevel);
    return schedulerRunWithPriority(priorityLevel, fn);
};

export const scheduleCallback = (reactPriorityLevel, callback, options) => {
    const priorityLevel = rfsPriorityToSchedulerPriority(reactPriorityLevel);
    return schedulerScheduleCallback(priorityLevel, callback, options);
};
const flushSyncCallbackQueueImpl = () => {
    if (!isFlushingSyncQueue && syncQueue !== null) {
        // Prevent re-entrancy.
        isFlushingSyncQueue = true;
        let i = 0;
        try {
            const isSync = true;
            const queue = syncQueue;
            runWithPriority(ImmediatePriority, () => {
                for (; i < queue.length; i++) {
                    let callback = queue[i];
                    do {
                        callback = callback(isSync);
                    } while (callback !== null);
                }
            });
            syncQueue = null;
        } catch (error) {
            // If something throws, leave the remaining callbacks on the queue.
            if (syncQueue !== null) {
                syncQueue = syncQueue.slice(i + 1);
            }
            // Resume flushing in the next tick
            Scheduler_scheduleCallback(Scheduler_ImmediatePriority, flushSyncCallbackQueue);
            throw error;
        } finally {
            isFlushingSyncQueue = false;
        }
    }
};

export const scheduleSyncCallback = (callback) => {
    // 이 콜백을 내부 대기열로 푸시합니다. 다음 틱에 플러시하거나
    // 다음 틱에 플러시하거나 `flushSyncCallbackQueue`를 호출하는 경우 더 일찍 플러시합니다.
    if (syncQueue === null) {
        syncQueue = [callback];
        // 빠르면 다음 틱에 대기열을 플러시합니다.
        immediateQueueCallbackNode = schedulerScheduleCallback(schedulerImmediatePriority, flushSyncCallbackQueueImpl);
    } else {
        // 기존 대기열에 푸시합니다. 콜백을 예약할 필요가 없습니다.
        // 대기열을 만들 때 이미 예약했기 때문입니다.
        syncQueue.push(callback);
    }
    return fakeCallbackNode;
};

export const cancelCallback = (callbackNode) => {
    if (callbackNode !== fakeCallbackNode) {
        schedulerCancelCallback(callbackNode);
    }
};

export const flushSyncCallbackQueue = () => {
    if (immediateQueueCallbackNode !== null) {
        const node = immediateQueueCallbackNode;
        immediateQueueCallbackNode = null;
        schedulerCancelCallback(node);
    }
    flushSyncCallbackQueueImpl();
};
