// ChangeEventPlugin: 입력 필드의 값이 변경될 때 발생하는 변경(change) 이벤트를 처리합니다.
import { enqueueStateRestore } from "../controlledComponent.js";
import { batchedUpdates } from "../genericBatching.js";
import SyntheticEvent from "../SyntheticEvent/syntheticEvent.js";
import { runEventsInBatch } from "../eventBatching.js";
import {
    TOP_BLUR,
    TOP_CHANGE,
    TOP_CLICK,
    TOP_FOCUS,
    TOP_INPUT,
    TOP_KEY_DOWN,
    TOP_KEY_UP,
    TOP_SELECTION_CHANGE,
} from "../domTopLevelEventType.js";
import { getEventTarget } from "../getEventTarget.js";
import isEventSupported from "../isEventSupported.js";
import { getNodeFromInstance } from "../../core/domComponentConnection.js";
import isTextInputElement from "../../core/isTextInputElement.js";
const eventTypes = {
    change: {
        phasedRegistrationNames: {
            bubbled: "onChange",
            captured: "onChangeCapture",
        },
        //onChange 이벤트가 발생할 수 있는 이벤트들을 dependencies에 등록합니다.
        dependencies: [
            TOP_BLUR,
            TOP_CHANGE,
            TOP_CLICK,
            TOP_FOCUS,
            TOP_INPUT,
            TOP_KEY_DOWN,
            TOP_KEY_UP,
            TOP_SELECTION_CHANGE,
        ],
    },
};

/**
 *
 * @param {TFiber} inst
 * @param {*} nativeEvent
 * @param {*} target
 * @returns {rfsSyntheticEvent}
 * @description nativeEvent를 기반으로 SyntheticEvent를 생성하고 누적하고 이를 2단계 dispatches에 쌓는 함수입니다.
 */
const createAndAccumulateChangeEvent = (inst, nativeEvent, target) => {
    const event = SyntheticEvent.getPooled(eventTypes.change, inst, nativeEvent, target);
    event.type = "change";
    // Flag this event loop as needing state restore.
    enqueueStateRestore(target);
    //TODO: accumulateTwoPhaseDispatches구현
    accumulateTwoPhaseDispatches(event);
    return event;
};

const activeElement = null;
const activeElementInst = null;

//NOTE : handle 'change' event

/**
 *
 * @param {} elem
 * @returns {boolean}
 * @description change 이벤트를 사용해야 하는 요소의 유형을 결정합니다.
 * @description 예를 들어, <select> 요소나 파일 입력(<input type="file">)의 경우
 * @description 직접 change 이벤트를 사용합니다.
 */
const shouldUseChangeEvent = (elem) => {
    const nodeName = elem.nodeName && elem.nodeName.toLowerCase();
    return nodeName === "select" || (nodeName === "input" && elem.type === "file");
};

/**
 *
 * @param {*} nativeEvent
 * @description : 특정 조건 하에서 change 이벤트를 수동으로 디스패치.
 * @description 예를 들어, IE에서는 input 이벤트의 지원이 완벽하지 않기 때문에, 대체 메커니즘을 제공.
 */
const manualDispatchChangeEvent = (nativeEvent) => {
    const event = createAndAccumulateChangeEvent(activeElementInst, nativeEvent, getEventTarget(nativeEvent));
    batchedUpdates(runEventInBatch, event);
};

/**
 *
 * @param {*} event
 * @description 이벤트를 배치로 실행합니다.-inChangeEvents
 */
const runEventInBatch = (event) => {
    runEventsInBatch(event);
};

/**
 *
 * @param {} targetInst
 * @returns {TFiber|null}
 * @description change 이벤트를 위한 대상 인스턴스를 가져오는 함수입니다.
 * @description change 이벤트가 발생했을 때, 변경된 값이 있는 경우에만 인스턴스를 반환합니다.
 */
const getInstIfValueChanged = (targetInst) => {
    const targetNode = getNodeFromInstance(targetInst);
    //TODO: updateValueIfChanged구현
    if (updateValueIfChanged(targetNode)) {
        return targetInst;
    }
};

/**
 *
 * @param {TToplevelEvent} topLevelType
 * @param {*} targetInst
 * @returns {TFiber|null}
 * @description change 이벤트에 대한 대상 인스턴스를 가져옵니다.
 * @description 이 함수는 change 이벤트가 발생했을 때 해당 이벤트를 처리해야 하는 인스턴스를 결정하는 데 사용됩니다.
 */
const getTargetInstForChangeEvent = (topLevelType, targetInst) => {
    if (topLevelType === TOP_CHANGE) {
        return targetInst;
    }
};

//NOTE: handle 'input' event
/**
 * @description 입력 이벤트가 현재 브라우저에서 지원 되는지 특히 IE9 이하에서는 input 이벤트를 지원하지 않기 때문에 이를 확인하는 함수입니다.
 */
const isInputEventSupported = isEventSupported("input") && (!document.documentMode || document.documentMode > 9);

/**
 *
 * @param {*} targetInst
 * @param {*} targetNode
 * @description (IE <=9의 경우) 전달된 엘리먼트의 속성 변경 이벤트 추적을 시작합니다.
 * @description js에서의 밸류 변경과 사용자 이벤트를 구분할 수 있도록 밸류 속성을 재정의합니다.
 */
const startWatchingForValueChange = (targetInst, targetNode) => {
    activeElement = targetNode;
    activeElementInst = targetInst;
    activeElement.attachEvent("onpropertychange", handlePropertyChange);
};

/**
 *
 * @description (IE <=9의 경우) 현재 추적 중인 엘리먼트에서 이벤트 리스너를 제거합니다.
 */
const stopWatchingForValueChange = () => {
    if (!activeElement) {
        return;
    }
    activeElement.detachEvent("onpropertychange", handlePropertyChange);
    activeElement = null;
    activeElementInst = null;
};

/**
 *
 * @param {*} nativeEvent
 * @description (IE <=9의 경우) 속성 변경 이벤트를 처리하고, 활성 엘리먼트의 값이 변경되었을 때 `change` 이벤트를 전송합니다.
 */
const handlePropertyChange = (nativeEvent) => {
    if (nativeEvent.propertyName !== "value") {
        return;
    }
    if (getInstIfValueChanged(activeElementInst)) {
        manualDispatchChangeEvent(nativeEvent);
    }
};

/**
 *
 * @param {*} topLevelType
 * @param {*} target
 * @param {*} targetInst
 * @description input 이벤트와 관련된 처리를 위한 함수입니다.
 * @description IE9에서는 propertychange 이벤트가 특정 상황에서 제대로 발생하지 않으므로,
 * @description selectionchange 이벤트를 대신 사용하여 값을 변경하는 동작을 감지합니다.
 */
const handleEventsForInputEventPolyfill = (topLevelType, target, targetInst) => {
    if (topLevelType === TOP_FOCUS) {
        // IE9에서 속성 변경은 대부분의 입력 이벤트에 대해 실행되지만 버그가 있으며 텍스트가 다음과 같은 경우 실행되지 않습니다.
        // 삭제된 경우에는 발동하지 않지만, 편리하게도 나머지 모든 경우에 선택변경이 발동하는 것처럼 보이므로
        // 이를 포착하고 값이 변경된 경우 이벤트를 전달합니다.
        // 두 경우 모두 값이 목표 값과 동일한 경우 이벤트 핸들러를 호출하지 않으려 합니다.
        // 이벤트 핸들러를 호출하고 싶지 않습니다. 포커스 이벤트는 충분히 신뢰할 수 있습니다.
        // 선택 영역이 변경되거나 커서 위치가 변경되면 // '선택 변경' 이벤트가 발생합니다.
        // 이동할 때 발생합니다. 이 이벤트에는 타겟이 없으므로 이벤트에서 타겟을 결정해야 합니다.
        stopWatchingForValueChange();
        startWatchingForValueChange(targetInst, target);
    } else if (topLevelType === TOP_BLUR) {
        stopWatchingForValueChange();
    }
};

/**
 *
 * @param {*} topLevelType
 * @param {*} targetInst
 * @description selectionchange, keydown, keyup 이벤트에 대해 값을 변경했는지 확인하고, 변경되었다면 해당 인스턴스를 반환하는 함수입니다.
 */
const getTargetInstForInputEventPolyfill = (topLevelType, targetInst) => {
    if (topLevelType === TOP_SELECTION_CHANGE || topLevelType === TOP_KEY_DOWN || topLevelType === TOP_KEY_UP) {
        return getInstIfValueChanged(targetInst);
    }
};

//NOTE: handle 'click' event

/**
 *
 * @param {*} elem
 * @description 클릭 이벤트를 사용하여 체크박스와 라디오 버튼의 변경을 감지해야 하는 경우를 결정하는 함수입니다.
 * @description IE8에서는 change 이벤트가 blur 이벤트 후에 발생하지 않으므로, 클릭 이벤트를 사용합니다.
 */
const shouldUseClickEvent = (elem) => {
    // 클릭` 이벤트를 사용하여 체크박스 및 라디오 입력의 변경 사항을 감지합니다.
    // 이 접근 방식은 모든 브라우저에서 작동하지만, `change`는 IE8에서는
    // IE8에서는 `블러`까지 발생하지 않습니다.
    const nodeName = elem.nodeName;
    return nodeName && nodeName.toLowerCase() === "input" && (elem.type === "checkbox" || elem.type === "radio");
};

/**
 *
 * @param {*} topLevelType
 * @param {*} targetInst
 * @description 클릭 이벤트에 대한 대상 인스턴스를 가져오는 함수입니다.
 */
const getTargetInstForClickEvent = (topLevelType, targetInst) => {
    if (topLevelType === TOP_CLICK) {
        return getInstIfValueChanged(targetInst);
    }
};

/**
 *
 * @param {*} topLevelType
 * @param {*} targetInst
 * @description input 또는 change 이벤트에 대한 대상 인스턴스를 가져오는 함수입니다.
 */
const getTargetInstForInputOrChangeEvent = (topLevelType, targetInst) => {
    if (topLevelType === TOP_INPUT || topLevelType === TOP_CHANGE) {
        return getInstIfValueChanged(targetInst);
    }
};

/**
 * 이 플러그인은 양식 요소에서 변경 이벤트를 정규화하는 `onChange` 이벤트를 생성합니다.
 * 이벤트를 생성합니다. 이 이벤트는 다음과 같은 경우에 발생합니다.
 * 깜박임 없이 요소의 값을 변경할 수 있을 때 발생합니다.
 *
 * Supported elements are:
 * - input (see `isTextInputElement`)
 * - textarea
 * - select
 */
/**
 * @description ChangeEventPlugin: 입력 필드의 값이 변경될 때 발생하는 변경(change) 이벤트를 처리.
 */
const ChangeEventPlugin = {
    //hangeEventPlugin이 처리할 이벤트 유형의 구성을 정의. 이는 change 이벤트에 대한 메타데이터를 포함하며, 이벤트의 이름, 등록 이름(bubbled, captured),
    // 그리고 이 이벤트가 의존하는 다른 이벤트 유형들을 명시
    eventTypes: eventTypes,

    //현재 브라우저에서 input 이벤트를 지원하는지 확인. 특히 IE9 이하에서는 input 이벤트를 지원하지 않기 때문에 이를 확인하는 함수.
    _isInputEventSupported: isInputEventSupported,

    /**
     *
     * @param {*} topLevelType
     * @param {*} targetInst
     * @param {*} nativeEvent
     * @param {*} nativeEventTarget
     * @param {*} eventSystemFlags
     * @returns {rfsSyntheticEvent}
     * @description ChangeEventPlugin안에서 합성 이벤트를 추출합니다.
     */
    extractEvents: (topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags) => {
        //event대상 결정
        const targetNode = targetInst ? getNodeFromInstance(targetInst) : window;

        let getTargetInstFunc, handleEventFunc;
        if (shouldUseChangeEvent(targetNode)) {
            //change 이벤트를 사용해야 하는 요소의 유형을 결정합니다.
            getTargetInstFunc = getTargetInstForChangeEvent;
        } else if (isTextInputElement(targetNode)) {
            //만약 TextInputElement라면
            if (isInputEventSupported) {
                //input이벤트가 지원되는 브라우저라면
                getTargetInstFunc = getTargetInstForInputOrChangeEvent;
            } else {
                //input이벤트가 지원되지 않는 브라우저라면
                getTargetInstFunc = getTargetInstForInputEventPolyfill;
                handleEventFunc = handleEventsForInputEventPolyfill;
            }
        } else if (shouldUseClickEvent(targetNode)) {
            //클릭 이벤트를 사용해야 하는 경우
            getTargetInstFunc = getTargetInstForClickEvent;
        }

        //설정된 getTargetInstFunc가 있다면
        if (getTargetInstFunc) {
            //설정된 getTargetInstFunc를 통해 targetInst를 가져옵니다.
            const inst = getTargetInstFunc(topLevelType, targetInst);
            //inst가 있다면
            if (inst) {
                //createAndAccumulateChangeEvent를 통해 이벤트를 생성하고 누적합니다.
                const event = createAndAccumulateChangeEvent(inst, nativeEvent, nativeEventTarget);
                return event;
            }
        }

        //설정된 handleEventFunc가 있다면->구형 브라우저에서의 이벤트 처리
        //handleEventFunc를 실행합니다.
        if (handleEventFunc) {
            handleEventFunc(topLevelType, targetNode, targetInst);
        }
    },
};

export default ChangeEventPlugin;
