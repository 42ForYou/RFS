import * as DOMTopLevelEventTypes from "./domTopLevelEventType.js";
import { DiscreteEvent, UserBlockingEvent, ContinuousEvent } from "../../const/CEventPriority.js";
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

    //TODO: extractEvents가 필요하면 구현
};

export default SimpleEventPlugin;
