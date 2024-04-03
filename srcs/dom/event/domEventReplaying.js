// * **Replayable**(재생가능)이벤트
// 	- 이벤트를 Replay한다라는 것:
// 		- 특정 조건하에서 이미 발생한 이벤트를 다시 처리.
// 	- eventPooling과 event delegation과 크게 관련 있슴
// 	- why?
// 		- 이벤트 Replay의 필요성
// 			- 비동기 로직 처리
// 				- ex)
// 					- 사용자 입력을 처리하는 동안 데이터를 비동기적으로 불러와야 할 필요가 있을 때, 이벤트 처리를 잠시 지연 시킨후 데이터 로딩이 완료후 처리.
// 						- 그렇다라는 것은 이벤트의 모든 정보를 보존한 상태로 처리 로직을 "Replay"할 수 있어야함
// 	- 어떤 것들이 재생가능한가?
// 		- 사용자와 웹 애플리케이션이 상호 작용하는 과정에서 발생하는 것들 인데, 즉각적으로 실행되야 하는 것들은 아닌것들
// 		- ex)
// 			- `click, keydown, submit`
// 	- 재생 불가능한 이벤트는 ?
// 		- 실시간으로 처리해야 되는 이벤트
// 			- `scroll`
// 				- `scroll` 이벤트는 빈번하게 발생하며, 나중에 다시 처리하는 것보다 실시간으로 처리해야 됨.
// 			- `resize`
// 				- 브라우저의 창 크기 변경 되는 이벤트
// 				- 이 역시 실시간으로 처리되야함
// 			- `load`
// 				- 데이터 로드 요청을 바로 시켜놔야됨 해당 이벤트는 오래걸리기 떄문에 기다려야되니가
// 				- 이역시 실시간으로 처리되야함
import {
    runWithPriorityImpl as runWithPriority,
    scheduleCallbackImpl as scheduleCallback,
    NormalPriorityImpl as NormalPriority,
    getCurrentPriorityLevelImpl as getCurrentPriorityLevel,
} from "../../scheduler/schedulerImpl.js";

import { getNearestMountedFiber } from "../../Reconciler/fiberTreeReflection.js";
import { attemptToDispatchEvent } from "./domEventListener.js";
import { getInstanceFromNode, getClosestInstanceFromNode } from "../core/domComponentConnection.js";
import { HostRoot } from "../../const/CWorkTag.js";

import {
    TOP_MOUSE_DOWN,
    TOP_MOUSE_UP,
    TOP_TOUCH_CANCEL,
    TOP_TOUCH_END,
    TOP_TOUCH_START,
    TOP_AUX_CLICK,
    TOP_DOUBLE_CLICK,
    TOP_POINTER_CANCEL,
    TOP_POINTER_DOWN,
    TOP_POINTER_UP,
    TOP_DRAG_END,
    TOP_DRAG_START,
    TOP_DROP,
    TOP_COMPOSITION_END,
    TOP_COMPOSITION_START,
    TOP_KEY_DOWN,
    TOP_KEY_PRESS,
    TOP_KEY_UP,
    TOP_INPUT,
    TOP_TEXT_INPUT,
    TOP_CLOSE,
    TOP_CANCEL,
    TOP_COPY,
    TOP_CUT,
    TOP_PASTE,
    TOP_CLICK,
    TOP_CHANGE,
    TOP_CONTEXT_MENU,
    TOP_RESET,
    TOP_SUBMIT,
    TOP_DRAG_ENTER,
    TOP_DRAG_LEAVE,
    TOP_MOUSE_OVER,
    TOP_MOUSE_OUT,
    TOP_POINTER_OVER,
    TOP_POINTER_OUT,
    TOP_GOT_POINTER_CAPTURE,
    TOP_LOST_POINTER_CAPTURE,
    TOP_FOCUS,
    TOP_BLUR,
} from "./domTopLevelEventType.js";
import { IS_REPLAYED } from "../../const/CEventSystemFlags.js";

/**
 * @typedef {topLevelType: TTopLevelType, eventSystemFlags: TEventSystemFlags, nativeEvent: TNativeEvent} TReplayableEvent
 */

const hasScheduledReplayAttempt = false;

/**
 * @type {Array<TReplayableEvent>}
 * @description 재생가능한 이벤트들을 저장하는 큐

 */
const queuedDiscreteEvents = [];

/**
 * @description bailot를 위한 continous event 타겟이 null이 아닌지 여부를 나타냅니다.
 */
const hasAnyQueuedContinuousEvents = false;

// The last of each continuous event type. We only need to replay the last one
let queuedFocus = null;
let queuedDrag = null;
let queuedMouse = null;
const queuedPointers = new Map();
const queuedPointerCaptures = new Map();

/**
 *
 * @returns {boolean}
 * @description 재생가능한 이벤트(discrete)가 큐에 있는지 여부를 나타냅니다.
 */
export const hasQueuedDiscreteEvents = () => {
    return queuedDiscreteEvents.length > 0;
};

/**
 *
 * @returns {boolean}
 * @description 재생가능한 이벤트(continuous)가 있는지 여부를 나타냅니다.
 */
export const hasQueuedContinuousEvents = () => {
    return hasAnyQueuedContinuousEvents;
};

const discreteReplayableEvents = [
    TOP_MOUSE_DOWN,
    TOP_MOUSE_UP,
    TOP_TOUCH_CANCEL,
    TOP_TOUCH_END,
    TOP_TOUCH_START,
    TOP_AUX_CLICK,
    TOP_DOUBLE_CLICK,
    TOP_POINTER_CANCEL,
    TOP_POINTER_DOWN,
    TOP_POINTER_UP,
    TOP_DRAG_END,
    TOP_DRAG_START,
    TOP_DROP,
    TOP_COMPOSITION_END,
    TOP_COMPOSITION_START,
    TOP_KEY_DOWN,
    TOP_KEY_PRESS,
    TOP_KEY_UP,
    TOP_INPUT,
    TOP_TEXT_INPUT,
    TOP_CLOSE,
    TOP_CANCEL,
    TOP_COPY,
    TOP_CUT,
    TOP_PASTE,
    TOP_CLICK,
    TOP_CHANGE,
    TOP_CONTEXT_MENU,
    TOP_RESET,
    TOP_SUBMIT,
];

const continuousReplayableEvents = [
    TOP_FOCUS,
    TOP_BLUR,
    TOP_DRAG_ENTER,
    TOP_DRAG_LEAVE,
    TOP_MOUSE_OVER,
    TOP_MOUSE_OUT,
    TOP_POINTER_OVER,
    TOP_POINTER_OUT,
    TOP_GOT_POINTER_CAPTURE,
    TOP_LOST_POINTER_CAPTURE,
];

/**
 * @param {TTopLevelType} eventType
 * @returns {boolean}
 * @description 재생가능한 이벤트인지 여부를 나타냅니다.
 */
export const isReplayableDiscreteEvent = (eventType) => {
    return discreteReplayableEvents.indexOf(eventType) > -1;
};

/**
 *
 * @param {TTopLevelType} topLevelType
 * @param {*} nativeEvent
 * @description continuous관련 큐를 비웁니다.
 */
export const clearIfContinuousEvent = (topLevelType, nativeEvent) => {
    switch (topLevelType) {
        case TOP_FOCUS:
        case TOP_BLUR:
            queuedFocus = null;
            break;
        case TOP_DRAG_ENTER:
        case TOP_DRAG_LEAVE:
            queuedDrag = null;
            break;
        case TOP_MOUSE_OVER:
        case TOP_MOUSE_OUT:
            queuedMouse = null;
            break;
        case TOP_POINTER_OVER:
        case TOP_POINTER_OUT: {
            const pointerId = nativeEvent.pointerId;
            queuedPointers.delete(pointerId);
            break;
        }
        case TOP_GOT_POINTER_CAPTURE:
        case TOP_LOST_POINTER_CAPTURE: {
            const pointerId = nativeEvent.pointerId;
            queuedPointerCaptures.delete(pointerId);
            break;
        }
    }
};

/**
 *
 * @param {*} topLevelType
 * @param {*} eventSystemFlags
 * @param {*} nativeEvent
 * @returns {TReplayableEvent}
 * @description 재생가능한 이벤트를 생성합니다.
 */
const createQueuedReplayableEvent = (topLevelType, eventSystemFlags, nativeEvent) => {
    return {
        topLevelType,
        eventSystemFlags: eventSystemFlags | IS_REPLAYED,
        nativeEvent,
    };
};

/**
 *
 * @param {TTopLevelType} topLevelType
 * @param {TEventSystemFlags} eventSystemFlags
 * @param {*} nativeEvent
 * @description discrete 이벤트를 큐에 넣습니다.
 */
export const queueDiscreteEvent = (topLevelType, eventSystemFlags, nativeEvent) => {
    const queuedEvent = createQueuedReplayableEvent(topLevelType, eventSystemFlags, nativeEvent);
    queuedDiscreteEvents.push(queuedEvent);
};

const accumulateOrCreateContinuousQueuedReplayableEvent = (
    existingQueuedEvent,
    topLevelType,
    eventSystemFlags,
    nativeEvent
) => {
    if (existingQueuedEvent === null || existingQueuedEvent.nativeEvent !== nativeEvent) {
        return createQueuedReplayableEvent(topLevelType, eventSystemFlags, nativeEvent);
    }
    // If we have already queued this exact event, then it's because
    // the different event systems have different DOM event listeners.
    // We can accumulate the flags and store a single event to be
    // replayed.
    existingQueuedEvent.eventSystemFlags |= eventSystemFlags;
    return existingQueuedEvent;
};

export const queueIfContinuousEvent = (topLevelType, eventSystemFlags, nativeEvent) => {
    // These set relatedTarget to null because the replayed event will be treated as if we
    // moved from outside the window (no target) onto the target once it hydrates.
    // Instead of mutating we could clone the event.
    switch (topLevelType) {
        case TOP_FOCUS: {
            const focusEvent = nativeEvent;
            queuedFocus = accumulateOrCreateContinuousQueuedReplayableEvent(
                queuedFocus,
                topLevelType,
                eventSystemFlags,
                focusEvent
            );
            return true;
        }
        case TOP_DRAG_ENTER: {
            const dragEvent = nativeEvent;
            queuedDrag = accumulateOrCreateContinuousQueuedReplayableEvent(
                queuedDrag,
                topLevelType,
                eventSystemFlags,
                dragEvent
            );
            return true;
        }
        case TOP_MOUSE_OVER: {
            const mouseEvent = nativeEvent;
            queuedMouse = accumulateOrCreateContinuousQueuedReplayableEvent(
                queuedMouse,
                topLevelType,
                eventSystemFlags,
                mouseEvent
            );
            return true;
        }
        case TOP_POINTER_OVER: {
            const pointerEvent = nativeEvent;
            const pointerId = pointerEvent.pointerId;
            queuedPointers.set(
                pointerId,
                accumulateOrCreateContinuousQueuedReplayableEvent(
                    queuedPointers.get(pointerId) || null,
                    topLevelType,
                    eventSystemFlags,
                    pointerEvent
                )
            );
            return true;
        }
        case TOP_GOT_POINTER_CAPTURE: {
            const pointerEvent = nativeEvent;
            const pointerId = pointerEvent.pointerId;
            queuedPointerCaptures.set(
                pointerId,
                accumulateOrCreateContinuousQueuedReplayableEvent(
                    queuedPointerCaptures.get(pointerId) || null,
                    topLevelType,
                    eventSystemFlags,
                    pointerEvent
                )
            );
            return true;
        }
    }
    return false;
};
