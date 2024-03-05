//TODO: Implement the schedulerInterface.js
import * as Scheduler from "./shedulerImplementation.js";

//이렇게 분리한 이유는 Interface와 구현 채를 분리하여, 구현체를 바꿀 수 있게 하기 위함이다.
const {
    runWithPriorityImpl: schedulerRunWithPriority,
    scheduleCallbackImpl: schedulerScheduleCallback,
    cancelCallbackImpl: schedulerCancelCallback,
    shouldYieldImpl: schedulerShouldYield,
    requestPaintImpl: schedulerRequestPaint,
    nowImpl: schedulerNow,
    getCurrentTimeImpl: schedulerGetCurrentTime,
    ImmediatePriorityImpl: schedulerImmediatePriority,
    UserBlockingPriorityImpl: schedulerUserBlockingPriority,
    NormalPriorityImpl: schedulerNormalPriority,
    LowPriorityImpl: schedulerLowPriority,
    IdlePriorityImpl: schedulerIdlePriority,
} = Scheduler;

import {
    ImmediatePriority,
    UserBlockingPriority,
    NormalPriority,
    LowPriority,
    IdlePriority,
} from "../type/TRfsPriorityLevel.js";

export const shouldYield = schedulerShouldYield;
export const requestPaint = schedulerRequestPaint;

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
