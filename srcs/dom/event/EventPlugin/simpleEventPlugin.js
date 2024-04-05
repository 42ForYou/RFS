import * as DOMTopLevelEventTypes from "../domTopLevelEventType.js";
import { DiscreteEvent, UserBlockingEvent, ContinuousEvent } from "../../../const/CEventPriority.js";

import SyntheticEvent from "../SyntheticEvent/syntheticEvent.js";
import SyntheticAnimationEvent from "../SyntheticEvent/syntheticAnimationEvent.js";
import SyntheticClipboardEvent from "../SyntheticEvent/syntheticClipboardEvent.js";
import SyntheticFocusEvent from "../SyntheticEvent/syntheticFocusEvent.js";
import SyntheticKeyboardEvent from "../SyntheticEvent/syntheticKeyboardEvent.js";
import SyntheticMouseEvent from "../SyntheticEvent/syntheticMouseEvent.js";
import SyntheticPointerEvent from "../SyntheticEvent/syntheticPointerEvent.js";
import SyntheticDragEvent from "../SyntheticEvent/syntheticDragEvent.js";
import SyntheticTouchEvent from "../SyntheticEvent/syntheticTouchEvent.js";
import SyntheticTransitionEvent from "../SyntheticEvent/syntheticTransitionEvent.js";
import SyntheticUIEvent from "../SyntheticEvent/syntheticUIEvent.js";
import SyntheticWheelEvent from "../SyntheticEvent/syntheticWheelEvent.js";
import getEventCharCode from "./getEventCharCode";
/**
 * ex) --abort
 * ['abort', ...]
 * into
 * eventTypes = {
 *   'abort': {
 *     phasedRegistrationNames: {
 *       bubbled: 'onAbort',
 *       captured: 'onAbortCapture',
 *     },
 *     dependencies: [TOP_ABORT],
 *   },
 *   ...
 * };
 * topLevelEventsToDispatchConfig = new Map([
 *   [TOP_ABORT, { sameConfig }],
 * ]);
 */

/**
 * @type {[TTopLevelType, string, TEventPriority]} eventTuple
 * @type {Array(eventTuple)}
 */
const eventTuples = [
    // Discrete events
    [DOMTopLevelEventTypes.TOP_BLUR, "blur", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_CANCEL, "cancel", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_CLICK, "click", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_CLOSE, "close", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_CONTEXT_MENU, "contextMenu", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_COPY, "copy", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_CUT, "cut", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_AUX_CLICK, "auxClick", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_DOUBLE_CLICK, "doubleClick", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_DRAG_END, "dragEnd", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_DRAG_START, "dragStart", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_DROP, "drop", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_FOCUS, "focus", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_INPUT, "input", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_INVALID, "invalid", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_KEY_DOWN, "keyDown", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_KEY_PRESS, "keyPress", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_KEY_UP, "keyUp", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_MOUSE_DOWN, "mouseDown", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_MOUSE_UP, "mouseUp", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_PASTE, "paste", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_PAUSE, "pause", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_PLAY, "play", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_POINTER_CANCEL, "pointerCancel", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_POINTER_DOWN, "pointerDown", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_POINTER_UP, "pointerUp", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_RATE_CHANGE, "rateChange", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_RESET, "reset", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_SEEKED, "seeked", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_SUBMIT, "submit", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_TOUCH_CANCEL, "touchCancel", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_TOUCH_END, "touchEnd", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_TOUCH_START, "touchStart", DiscreteEvent],
    [DOMTopLevelEventTypes.TOP_VOLUME_CHANGE, "volumeChange", DiscreteEvent],

    // User-blocking events
    [DOMTopLevelEventTypes.TOP_DRAG, "drag", UserBlockingEvent],
    [DOMTopLevelEventTypes.TOP_DRAG_ENTER, "dragEnter", UserBlockingEvent],
    [DOMTopLevelEventTypes.TOP_DRAG_EXIT, "dragExit", UserBlockingEvent],
    [DOMTopLevelEventTypes.TOP_DRAG_LEAVE, "dragLeave", UserBlockingEvent],
    [DOMTopLevelEventTypes.TOP_DRAG_OVER, "dragOver", UserBlockingEvent],
    [DOMTopLevelEventTypes.TOP_MOUSE_MOVE, "mouseMove", UserBlockingEvent],
    [DOMTopLevelEventTypes.TOP_MOUSE_OUT, "mouseOut", UserBlockingEvent],
    [DOMTopLevelEventTypes.TOP_MOUSE_OVER, "mouseOver", UserBlockingEvent],
    [DOMTopLevelEventTypes.TOP_POINTER_MOVE, "pointerMove", UserBlockingEvent],
    [DOMTopLevelEventTypes.TOP_POINTER_OUT, "pointerOut", UserBlockingEvent],
    [DOMTopLevelEventTypes.TOP_POINTER_OVER, "pointerOver", UserBlockingEvent],
    [DOMTopLevelEventTypes.TOP_SCROLL, "scroll", UserBlockingEvent],
    [DOMTopLevelEventTypes.TOP_TOGGLE, "toggle", UserBlockingEvent],
    [DOMTopLevelEventTypes.TOP_TOUCH_MOVE, "touchMove", UserBlockingEvent],
    [DOMTopLevelEventTypes.TOP_WHEEL, "wheel", UserBlockingEvent],

    // Continuous events
    [DOMTopLevelEventTypes.TOP_ABORT, "abort", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_ANIMATION_END, "animationEnd", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_ANIMATION_ITERATION, "animationIteration", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_ANIMATION_START, "animationStart", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_CAN_PLAY, "canPlay", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_CAN_PLAY_THROUGH, "canPlayThrough", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_DURATION_CHANGE, "durationChange", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_EMPTIED, "emptied", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_ENCRYPTED, "encrypted", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_ENDED, "ended", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_ERROR, "error", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_GOT_POINTER_CAPTURE, "gotPointerCapture", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_LOAD, "load", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_LOADED_DATA, "loadedData", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_LOADED_METADATA, "loadedMetadata", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_LOAD_START, "loadStart", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_LOST_POINTER_CAPTURE, "lostPointerCapture", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_PLAYING, "playing", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_PROGRESS, "progress", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_SEEKING, "seeking", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_STALLED, "stalled", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_SUSPEND, "suspend", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_TIME_UPDATE, "timeUpdate", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_TRANSITION_END, "transitionEnd", ContinuousEvent],
    [DOMTopLevelEventTypes.TOP_WAITING, "waiting", ContinuousEvent],
];
const knownHTMLTopLevelTypes = [
    DOMTopLevelEventTypes.TOP_ABORT,
    DOMTopLevelEventTypes.TOP_CANCEL,
    DOMTopLevelEventTypes.TOP_CAN_PLAY,
    DOMTopLevelEventTypes.TOP_CAN_PLAY_THROUGH,
    DOMTopLevelEventTypes.TOP_CLOSE,
    DOMTopLevelEventTypes.TOP_DURATION_CHANGE,
    DOMTopLevelEventTypes.TOP_EMPTIED,
    DOMTopLevelEventTypes.TOP_ENCRYPTED,
    DOMTopLevelEventTypes.TOP_ENDED,
    DOMTopLevelEventTypes.TOP_ERROR,
    DOMTopLevelEventTypes.TOP_INPUT,
    DOMTopLevelEventTypes.TOP_INVALID,
    DOMTopLevelEventTypes.TOP_LOAD,
    DOMTopLevelEventTypes.TOP_LOADED_DATA,
    DOMTopLevelEventTypes.TOP_LOADED_METADATA,
    DOMTopLevelEventTypes.TOP_LOAD_START,
    DOMTopLevelEventTypes.TOP_PAUSE,
    DOMTopLevelEventTypes.TOP_PLAY,
    DOMTopLevelEventTypes.TOP_PLAYING,
    DOMTopLevelEventTypes.TOP_PROGRESS,
    DOMTopLevelEventTypes.TOP_RATE_CHANGE,
    DOMTopLevelEventTypes.TOP_RESET,
    DOMTopLevelEventTypes.TOP_SEEKED,
    DOMTopLevelEventTypes.TOP_SEEKING,
    DOMTopLevelEventTypes.TOP_STALLED,
    DOMTopLevelEventTypes.TOP_SUBMIT,
    DOMTopLevelEventTypes.TOP_SUSPEND,
    DOMTopLevelEventTypes.TOP_TIME_UPDATE,
    DOMTopLevelEventTypes.TOP_TOGGLE,
    DOMTopLevelEventTypes.TOP_VOLUME_CHANGE,
    DOMTopLevelEventTypes.TOP_WAITING,
];
//앞서 eventTuples이 dom내부의 이벤트들을 정의한 것이라면
//eventTypes에는 리액트 내부의 이벤트들을 정의한다.
//그리고 각각에 config를 담음으로써 리액트가 해당을 처리할떄 어떤 우선순위로 처리하는지, 의존성이 걸려있는 topLevelType이 무엇인지를 정의한다.
//리액트 내부에서 eventHandler를 props로 받을떄 어떤 이름으로 받을지 에 대해서 정의한다 phrasedRegistrationNames
//결국 eventTypes과 topLevelEventsToDispatchConfig에 리액트 내부시스템의 모든이벤트의 우선순위, 어떤식으로 다루는지에 대한 정보가 들어있음
//NOTE: eventTypes는 eventType(원래 이벤트 이름)이 key로 들어가고, config가 value로 들어간다.
const eventTypes = {};
//NOTE: topLevelEventsToDispatchConfig는 topLevelType이 key로 들어가고, config가 value로 들어간다.
const topLevelEventsToDispatchConfig = {};
for (let i = 0; i < eventTuples.length; i++) {
    //현재 eventTuple을 가져온다
    const eventTuple = eventTuples[i];
    //eventTuple에서 TopLevelType, eventType, eventPriority를 가져온다
    const [topLevelType, eventType, eventPriority] = eventTuple;

    //ex): click이벤트면 ->onClick으로 변환
    const capitalizedEvent = eventType[0].toUpperCase() + eventType.slice(1);
    const onEvent = "on" + capitalizedEvent;

    const config = {
        //rfs에서는 이벤트 핸들링을 위해 두 가지 전파 단계,
        // 즉 캡처링(capturing) 단계와 버블링(bubbling) 단계를 구분하여 사용.
        //  phasedRegistrationNames는 이 두 단계에서 사용할 수 있는 리스너의 이름을 정의
        // 합니다. 이를 통해 개발자는 필요에 따라 특정 단계에대한 리스너를 props로 전달 가능
        //NOTE: 예시:
        // class MyComponent extends React.Component {
        //     handleClick = () => {
        //       console.log('버블링 단계에서 클릭 이벤트 처리');
        //     };

        //     handleClickCapture = () => {
        //       console.log('캡처링 단계에서 클릭 이벤트 처리');
        //     };

        //     render() {
        //       return (
        //         <div onClick={this.handleClick} onClickCapture={this.handleClickCapture}>
        //           클릭하세요
        //         </div>
        //       );
        //     }
        //   }

        phasedRegistrationNames: {
            bubbled: onEvent,
            captured: onEvent + "Capture",
        },
        //이 이벤트 설정이 의존하는 topLevelType
        dependencies: [topLevelType],
        eventPriority,
    };
    eventTypes[eventType] = config;
    topLevelEventsToDispatchConfig[topLevelType] = config;
}

const SimpleEventPlugin = {
    eventTypes: eventTypes,

    /**
     *
     * @param {TTopLevelType} topLevelType @see DOMTopLevelEventTypes
     * @returns {TEventPriority} eventPriority @see CEventPriority
     * @description topLevelType에 해당하는 이벤트의 우선순위를 반환한다.
     */
    getEventPriority(topLevelType) {
        //NOTE: topLevelType에 해당하는 config를 가져온다
        const config = topLevelEventsToDispatchConfig[topLevelType];
        //NOTE: config가 존재하면 config.eventPriority를 반환하고, 존재하지 않으면 ContinuousEvent를 반환한다.
        return config !== undefined ? config.eventPriority : ContinuousEvent;
    },

    /**
     *
     * @param {TTopLevelType} topLevelType
     * @param {TFiber|null} targetInst
     * @param {*} nativeEvent
     * @param {*} nativeEventTarget
     * @param {TEventSystemPlags} eventSystemFlags
     * @returns {RfsSyntheticEvent|null}
     * @description 결론적으로 플러그인의 역할인 필요한 조건에 맞으면 조건에 맞는 SyntheticEvent를 반환한다.
     */
    extractEvents: (topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags) => {
        //먼저 topLevelType에 해당하는 이벤트 설정을 topLevelEventsToDispatchConfig에서 조회. 설정이 없으면 null을 반환하여 이벤트 처리를 중단.
        const dispatchConfig = topLevelEventsToDispatchConfig[topLevelType];
        if (!dispatchConfig) {
            return null;
        }
        // 해당 설정이 존재하면, topLevelType에 따라 적절한 EventConstructor를 선택
        // ex) 예를 들어, 키보드 이벤트(TOP_KEY_DOWN, TOP_KEY_PRESS, TOP_KEY_UP)의 경우 SyntheticKeyboardEvent가 선택.
        let EventConstructor;
        switch (topLevelType) {
            //NOTE: keydown, keypress, keyup 이벤트는 SyntheticKeyboardEvent로 생성
            case DOMTopLevelEventTypes.TOP_KEY_PRESS:
                // Firefox는 기능 키에 대한 키 누름 이벤트도 생성합니다. 이렇게 하면
                // 원치 않는 키 누름 이벤트를 제거합니다. 그러나 Enter는 인쇄 가능 및
                // 인쇄할 수 없습니다. Tab 키도 그럴 것이라고 예상할 수 있지만 그렇지 않습니다.
                if (getEventCharCode(nativeEvent) === 0) {
                    return null;
                }
            /* falls through */
            case DOMTopLevelEventTypes.TOP_KEY_DOWN:
            case DOMTopLevelEventTypes.TOP_KEY_UP:
                EventConstructor = SyntheticKeyboardEvent;
                break;

            //NOTE: focus, blur 이벤트는 SyntheticFocusEvent로 생성
            case DOMTopLevelEventTypes.TOP_BLUR:
            case DOMTopLevelEventTypes.TOP_FOCUS:
                EventConstructor = SyntheticFocusEvent;
                break;

            //NOTE: 마우스 이벤트는 SyntheticMouseEvent로 생성
            case DOMTopLevelEventTypes.TOP_CLICK:
                // Firefox는 마우스 오른쪽 클릭 시 클릭 이벤트를 생성합니다. 이렇게 하면
                // 원치 않는 클릭 이벤트를 제거합니다.
                if (nativeEvent.button === 2) {
                    return null;
                }
            /* falls through */
            case DOMTopLevelEventTypes.TOP_AUX_CLICK:
            case DOMTopLevelEventTypes.TOP_DOUBLE_CLICK:
            case DOMTopLevelEventTypes.TOP_MOUSE_DOWN:
            case DOMTopLevelEventTypes.TOP_MOUSE_MOVE:
            case DOMTopLevelEventTypes.TOP_MOUSE_UP:
            /* falls through */
            case DOMTopLevelEventTypes.TOP_MOUSE_OUT:
            case DOMTopLevelEventTypes.TOP_MOUSE_OVER:
            case DOMTopLevelEventTypes.TOP_CONTEXT_MENU:
                EventConstructor = SyntheticMouseEvent;
                break;

            //NOTE: 드래그 이벤트는 SyntheticDragEvent로 생성
            case DOMTopLevelEventTypes.TOP_DRAG:
            case DOMTopLevelEventTypes.TOP_DRAG_END:
            case DOMTopLevelEventTypes.TOP_DRAG_ENTER:
            case DOMTopLevelEventTypes.TOP_DRAG_EXIT:
            case DOMTopLevelEventTypes.TOP_DRAG_LEAVE:
            case DOMTopLevelEventTypes.TOP_DRAG_OVER:
            case DOMTopLevelEventTypes.TOP_DRAG_START:
            case DOMTopLevelEventTypes.TOP_DROP:
                EventConstructor = SyntheticDragEvent;
                break;

            //NOTE: 터치 이벤트는 SyntheticTouchEvent로 생성
            case DOMTopLevelEventTypes.TOP_TOUCH_CANCEL:
            case DOMTopLevelEventTypes.TOP_TOUCH_END:
            case DOMTopLevelEventTypes.TOP_TOUCH_MOVE:
            case DOMTopLevelEventTypes.TOP_TOUCH_START:
                EventConstructor = SyntheticTouchEvent;
                break;

            //NOTE: 애니메이션 SyntheticAnimationEvent
            case DOMTopLevelEventTypes.TOP_ANIMATION_END:
            case DOMTopLevelEventTypes.TOP_ANIMATION_ITERATION:
            case DOMTopLevelEventTypes.TOP_ANIMATION_START:
                EventConstructor = SyntheticAnimationEvent;
                break;

            //NOTE: transitionEnd 이벤트는 SyntheticTransitionEvent로 생성
            case DOMTopLevelEventTypes.TOP_TRANSITION_END:
                EventConstructor = SyntheticTransitionEvent;
                break;

            //NOTE: UI 이벤트는 SyntheticUIEvent로 생성
            case DOMTopLevelEventTypes.TOP_SCROLL:
                EventConstructor = SyntheticUIEvent;
                break;

            //NOTE: 휠 이벤트는 SyntheticWheelEvent로 생성
            case DOMTopLevelEventTypes.TOP_WHEEL:
                EventConstructor = SyntheticWheelEvent;
                break;

            //NOTE: 클립보드 이벤트는 SyntheticClipboardEvent로 생성
            case DOMTopLevelEventTypes.TOP_COPY:
            case DOMTopLevelEventTypes.TOP_CUT:
            case DOMTopLevelEventTypes.TOP_PASTE:
                EventConstructor = SyntheticClipboardEvent;
                break;

            //NOTE: 포인터 이벤트는 SyntheticPointerEvent로 생성
            case DOMTopLevelEventTypes.TOP_GOT_POINTER_CAPTURE:
            case DOMTopLevelEventTypes.TOP_LOST_POINTER_CAPTURE:
            case DOMTopLevelEventTypes.TOP_POINTER_CANCEL:
            case DOMTopLevelEventTypes.TOP_POINTER_DOWN:
            case DOMTopLevelEventTypes.TOP_POINTER_MOVE:
            case DOMTopLevelEventTypes.TOP_POINTER_OUT:
            case DOMTopLevelEventTypes.TOP_POINTER_OVER:
            case DOMTopLevelEventTypes.TOP_POINTER_UP:
                EventConstructor = SyntheticPointerEvent;
                break;
            default:
                if (knownHTMLTopLevelTypes.indexOf(topLevelType) === -1) {
                    console.error("SimpleEventPlugin: Unhandled event type, `%s`.", topLevelType);
                    throw new Error("SimpleEventPlugin: Unhandled event type, `" + topLevelType + "`.");
                }
                // HTML Events
                // @see http://www.w3.org/TR/html5/index.html#events-0
                EventConstructor = SyntheticEvent;
                break;
        }
        //NOTE: EventConstructor를 이용하여 SyntheticEvent를 생성
        const event = EventConstructor.getPooled(dispatchConfig, targetInst, nativeEvent, nativeEventTarget);
        //TODO: accumulateTwoPhaseDispatches구현
        //Rfs 이벤트 시스템의 일부로, 특정 이벤트에 대해 "두 단계 디스패치(two-phase dispatch)" 과정을 준비.
        accumulateTwoPhaseDispatches(event);
        return event;
    },
};

export default SimpleEventPlugin;
