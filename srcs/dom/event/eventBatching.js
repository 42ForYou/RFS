import { executeDispatchesInOrder } from "./eventPluginUtil.js";
import accumulateInto from "./accumulateInto.js";
import forEachAccumulated from "./forEachAccumulated.js";
/**
 * 디스패치가 누적된 이벤트의 내부 대기열로, 다음과 같습니다.
 * 디스패치가 실행되기를 기다리는 이벤트의 내부 큐입니다.
 */
/**
 * @type {Array<rfsSyntheticEvent> | rfsSyntheticEvent}
 */
let eventQueue = null;

/**
 *
 * @param {*} event
 * @description 이벤트를 디스패치하고, 이벤트가 영구적이지 않은 경우 풀로 다시 반환합니다.
 */
const executeDispatchesAndRelease = (event) => {
    if (event) {
        executeDispatchesInOrder(event);

        if (!event.isPersistent()) {
            event.constructor.release(event);
        }
    }
};
const executeDispatchesAndReleaseTopLevel = (e) => {
    return executeDispatchesAndRelease(e);
};

/**
 *
 * @param {*} events
 * @description 이벤트를 일괄로 실행합니다.(SyntheticEvent)
 */
export const runEventsInBatch = (events) => {
    if (events !== null) {
        eventQueue = accumulateInto(eventQueue, events);
    }

    // 이벤트를 처리하는 동안 더 많은 이벤트가 큐에 추가되는지 확인할 수 있도록
    // 이벤트를 처리하기 전에 `eventQueue`를 null로 설정합니다.
    const processingEventQueue = eventQueue;
    eventQueue = null;

    if (!processingEventQueue) {
        return;
    }

    forEachAccumulated(processingEventQueue, executeDispatchesAndReleaseTopLevel);
};
