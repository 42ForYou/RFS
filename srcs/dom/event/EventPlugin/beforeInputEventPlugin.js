// BeforeInputEventPlugin: 입력 이벤트가 발생하기 직전(before input)에 처리됩니다.
import {
    TOP_BLUR,
    TOP_COMPOSITION_START,
    TOP_COMPOSITION_END,
    TOP_COMPOSITION_UPDATE,
    TOP_KEY_DOWN,
    TOP_KEY_PRESS,
    TOP_KEY_UP,
    TOP_MOUSE_DOWN,
    TOP_TEXT_INPUT,
    TOP_PASTE,
} from "../domTopLevelEventType.js";
import {
    getData as FallbackCompositionStateGetData,
    initialize as FallbackCompositionStateInitialize,
    reset as FallbackCompositionStateReset,
} from "../fallbackCompositionState.js";
import SyntheticCompositionEvent from "../SyntheticEvent/syntheticCompositionEvent.js";
import SyntheticInputEvent from "../SyntheticEvent/syntheticInputEvent.js";

const END_KEYCODES = [9, 13, 27, 32]; // Tab, Return, Esc, Space
const START_KEYCODE = 229;

const canUseCompositionEvent = "CompositionEvent" in window;

let documentMode = null;
if (typeof document !== "undefined" && document.documentMode) {
    documentMode = document.documentMode;
}
// 웹킷은 다음과 같이 사용할 수 있는 매우 유용한 `textInput` 이벤트를 제공합니다.
// `beforeInput`을 직접 표현하는 데 사용할 수 있습니다. IE `textinput` 이벤트는 그다지
// 유용하지 않으므로 사용하지 않습니다.
const canUseTextInputEvent = "TextEvent" in window && !documentMode;

// IE9+에서는 컴포지션 이벤트에 액세스할 수 있지만 기본 컴포지션 종료 이벤트에서 제공된 데이터는
// 네이티브 컴포지션 종료 이벤트에서 제공된 데이터가 올바르지 않을 수 있습니다. 일본어 표의 문자
// 공백(예: \u3000)이 올바르게 기록되지 않을 수 있습니다.
const useFallbackCompositionData = !canUseCompositionEvent || (documentMode && documentMode > 8 && documentMode < 11);

const SPACEBAR_CODE = 32;
const SPACEBAR_CHAR = String.fromCharCode(SPACEBAR_CODE);

const eventTypes = {
    //     beforeInput
    // beforeInput 이벤트는 사용자가 입력을 하기 직전에 발생합니다. 이 이벤트는 사용자의 입력이 실제 DOM에 반영되기 전에 발생하므로, 입력을 처리하거나 검증하고 필요에 따라 변경하거나 취소할 수 있는 기회를 제공합니다.
    // 처리 시점: 사용자가 키보드로 글자를 입력하거나, 입력 필드에 텍스트를 붙여넣을 때 발생합니다.

    // compositionEnd
    // compositionEnd 이벤트는 IME(Input Method Editor)를 사용하는 언어 입력의 구성(조합) 과정이 끝났을 때 발생합니다. 예를 들어, 한글이나 일본어와 같이 여러 키 입력을 조합해 글자를 만드는 입력 방식에서, 전체 글자 조합이 완료되었을 때 이 이벤트가 발생합니다.
    // 처리 시점: 글자 조합이 끝나고 최종 입력 값이 결정되었을 때 발생합니다.

    // compositionStart
    // compositionStart 이벤트는 사용자가 IME를 사용하여 글자 입력의 조합을 시작할 때 발생합니다.
    // 처리 시점: 사용자가 조합 입력을 시작할 때 발생합니다.

    // compositionUpdate
    // compositionUpdate 이벤트는 사용자가 IME를 사용하여 입력하는 동안, 글자 조합이 업데이트될 때마다 발생합니다.
    // 처리 시점: 사용자가 조합 중인 입력 값이 변경될 때마다 발생합니다.
    beforeInput: {
        phasedRegistrationNames: {
            bubbled: "onBeforeInput",
            captured: "onBeforeInputCapture",
        },
        dependencies: [TOP_COMPOSITION_END, TOP_KEY_PRESS, TOP_TEXT_INPUT, TOP_PASTE],
    },
    compositionEnd: {
        phasedRegistrationNames: {
            bubbled: "onCompositionEnd",
            captured: "onCompositionEndCapture",
        },
        dependencies: [TOP_BLUR, TOP_COMPOSITION_END, TOP_KEY_DOWN, TOP_KEY_PRESS, TOP_KEY_UP, TOP_MOUSE_DOWN],
    },
    compositionStart: {
        phasedRegistrationNames: {
            bubbled: "onCompositionStart",
            captured: "onCompositionStartCapture",
        },
        dependencies: [TOP_BLUR, TOP_COMPOSITION_START, TOP_KEY_DOWN, TOP_KEY_PRESS, TOP_KEY_UP, TOP_MOUSE_DOWN],
    },
    compositionUpdate: {
        phasedRegistrationNames: {
            bubbled: "onCompositionUpdate",
            captured: "onCompositionUpdateCapture",
        },
        dependencies: [TOP_BLUR, TOP_COMPOSITION_UPDATE, TOP_KEY_DOWN, TOP_KEY_PRESS, TOP_KEY_UP, TOP_MOUSE_DOWN],
    },
};

// 스페이스키를 누른 적이 있는지 추적합니다.
let hasSpaceKeypress = false;

/**
 *
 * @param {@} nativeEvent
 * @description /**
 * 기본 키 누름 이벤트가 명령으로 간주되는지 여부를 반환합니다.
 * Firefox는 키 명령에 대해 `키 누르기` 이벤트를 발생시키기 때문에 이 값은 필수입니다.
 * (잘라내기, 복사, 모두 선택 등)에 대해 `키 누르기` 이벤트를 발생시키기 때문에 필요합니다.
 */
const isKeypressCommand = (nativeEvent) => {
    return (
        (nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) &&
        // ctrlKey && altKey is equivalent to AltGr, and is not a command.
        !(nativeEvent.ctrlKey && nativeEvent.altKey)
    );
};

/**
 * Translate native top level events into event types.
 *
 * @param {string} topLevelType
 * @return {object}
 * @description  * 기본 최상위 이벤트를 이벤트 유형으로 변환합니다.

 */
const getCompositionEventType = (topLevelType) => {
    switch (topLevelType) {
        case TOP_COMPOSITION_START:
            return eventTypes.compositionStart;
        case TOP_COMPOSITION_END:
            return eventTypes.compositionEnd;
        case TOP_COMPOSITION_UPDATE:
            return eventTypes.compositionUpdate;
    }
};

/**
 *
 * @param {string} topLevelType
 * @param {object} nativeEvent
 * @return {boolean}
 * @description * 폴백 베스트 추측 모델은 이 이벤트가 다음을 의미하는지에 대한 질의를 수행합니다.
 * 컴포지션이 시작되었습니다.
 */
const isFallbackCompositionStart = (topLevelType, nativeEvent) => {
    return topLevelType === TOP_KEY_DOWN && nativeEvent.keyCode === START_KEYCODE;
};

/**
 *
 * @param {string} topLevelType
 * @param {object} nativeEvent
 * @return {boolean}
 * @description * 폴백 모드가 이 이벤트를 컴포지션의 끝으로 간주하는지 여부를 반환합니다.
 */
const isFallbackCompositionEnd = (topLevelType, nativeEvent) => {
    switch (topLevelType) {
        case TOP_KEY_UP:
            //  Command 키는 IME 입력을 삽입하거나 지울 수 있습니다.
            return END_KEYCODES.indexOf(nativeEvent.keyCode) !== -1;
        case TOP_KEY_DOWN:
            // Ime Keycode는 각 keydown에서 예상됩니다. 다른 코드를 얻으면 이전에 나갔을 수 있습니다.
            return nativeEvent.keyCode !== START_KEYCODE;
        case TOP_KEY_PRESS:
        case TOP_MOUSE_DOWN:
        case TOP_BLUR:
            // Events are not possible without cancelling IME.
            return true;
        default:
            return false;
    }
};

/**
 *
 * @param {object} nativeEvent
 * @return {?string}
 * @description Google Input Tools는 CustomEvent를 통해 구성 데이터를 제공하며,
 * `detail` 객체에서 `data` 속성이 채워집니다. 이 이벤트 객체에서 사용할 수 있는 경우 사용하십시오.
 * 그렇지 않으면 이것은 일반적인 구성 이벤트이며 추출할 특별한 것이 없습니다.
 */
const getDataFromCustomEvent = (nativeEvent) => {
    const detail = nativeEvent.detail;
    if (typeof detail === "object" && "data" in detail) {
        return detail.data;
    }
    return null;
};

/**
 *
 * @param {object} nativeEvent
 * @return {boolean}
 * @description 한국어 IME로 구성 이벤트가 트리거되었는지 확인합니다.
 * 우리의 폴백 모드는 IE의 한국어 IME와 잘 작동하지 않으므로,
 * 한국어 IME가 사용될 때는 네이티브 구성 이벤트를 사용하십시오.
 * CompositionEvent.locale 속성은 사용이 중지되었지만
 * IE에서 사용할 수 있으며, 여기서 폴백 모드가 활성화됩니다.
 */
const isUsingKoreanIME = (nativeEvent) => {
    return nativeEvent.locale === "ko";
};

// 현재 IME 구성 상태를 추적합니다.
let isComposing = false;

/**
 * @return {?object} A SyntheticCompositionEvent.
 * @description CompositionEvent의 SyntheticCompositionEvent를 추출합니다.
 */
const extractCompositionEvent = (topLevelType, targetInst, nativeEvent, nativeEventTarget) => {
    let eventType;
    let fallbackData;

    if (canUseCompositionEvent) {
        eventType = getCompositionEventType(topLevelType);
    } else if (!isComposing) {
        if (isFallbackCompositionStart(topLevelType, nativeEvent)) {
            eventType = eventTypes.compositionStart;
        }
    } else if (isFallbackCompositionEnd(topLevelType, nativeEvent)) {
        eventType = eventTypes.compositionEnd;
    }

    if (!eventType) {
        return null;
    }

    if (useFallbackCompositionData && !isUsingKoreanIME(nativeEvent)) {
        // 현재 구성은 정적으로 저장되어 있으며 구성이 계속되는 동안 덮어쓰면 안됩니다.
        if (!isComposing && eventType === eventTypes.compositionStart) {
            isComposing = FallbackCompositionStateInitialize(nativeEventTarget);
        } else if (eventType === eventTypes.compositionEnd) {
            if (isComposing) {
                fallbackData = FallbackCompositionStateGetData();
            }
        }
    }

    const event = SyntheticCompositionEvent.getPooled(eventType, targetInst, nativeEvent, nativeEventTarget);

    if (fallbackData) {
        // Inject data가 fallback 경로에서 생성된 데이터를 합성 이벤트에 삽입합니다.
        // 이것은 네이티브 CompositionEventInterface의 속성과 일치합니다.
        event.data = fallbackData;
    } else {
        const customData = getDataFromCustomEvent(nativeEvent);
        if (customData !== null) {
            event.data = customData;
        }
    }

    //TODO: accumulateTwoPhaseDispatches 함수구현
    accumulateTwoPhaseDispatches(event);
    return event;
};

/**
 * @param {TopLevelType} topLevelType Number from `TopLevelType`.
 * @param {object} nativeEvent Native browser event.
 * @return {?string} The string corresponding to this `beforeInput` event.
 * @description 네이티브 `textInput` 이벤트가 사용 가능한 경우, 목표는
 * 그것을 사용하는 것입니다. 그러나 특별한 경우가 있습니다: 스페이스바 키.
 * Webkit에서 스페이스바 `textInput` 이벤트에서 기본 동작을 방지하면
 * 문자 삽입이 취소되지만 * 또한 * 브라우저를 페이지 스크롤의 기본 스페이스바 동작으로
 * 되돌립니다.
 */
const getNativeBeforeInputChars = (topLevelType, nativeEvent) => {
    switch (topLevelType) {
        case TOP_COMPOSITION_END:
            return getDataFromCustomEvent(nativeEvent);
        case TOP_KEY_PRESS:
            /**
             * 네이티브 `textInput` 이벤트를 사용할 수 있는 경우, 우리의 목표는
             * 를 사용하는 것입니다. 하지만 스페이스바 키라는 특별한 경우가 있습니다.
             * 웹킷에서 스페이스바 `textInput` 이벤트의 기본값을 방지하면
             * 를 사용하면 문자 삽입이 취소되지만, * 또한* 브라우저
             * 를 기본 스페이스바 동작인
             * 페이지로 돌아갑니다.
             *
             * 다음에서 추적 중입니다:
             * https://code.google.com/p/chromium/issues/detail?id=355103
             *
             * 이 문제를 방지하려면 키 프레스 이벤트를 `textInput`
             * 이벤트를 사용할 수 없는 것처럼 사용하세요.
             */

            const which = nativeEvent.which;
            if (which !== SPACEBAR_CODE) {
                return null;
            }

            hasSpaceKeypress = true;
            return SPACEBAR_CHAR;

        case TOP_TEXT_INPUT:
            // Record the characters to be added to the DOM.
            const chars = nativeEvent.data;

            // 스페이스바 문자인 경우, 이미 키 누름 수준에서 처리했다고 가정하고
            // 키 누르기 수준에서 이미 처리했다고 가정하고 즉시 종료합니다. 안드로이드 크롬
            // 는 키 코드를 제공하지 않으므로 무시해야 합니다.
            if (chars === SPACEBAR_CHAR && hasSpaceKeypress) {
                return null;
            }

            return chars;

        default:
            // For other native event types, do nothing.
            return null;
    }
};

/**
 *
 * @param {number} topLevelType Number from `TopLevelEventTypes`.
 * @param {object} nativeEvent Native browser event.
 * @return {?string} The fallback string for this `beforeInput` event.
 * @description `textInput` 이벤트를 제공하지 않는 브라우저에 대해,
 * 사용할 수 있는 적절한 문자열을 추출하여 SyntheticInputEvent에 사용합니다.
 */
const getFallbackBeforeInputChars = (topLevelType, nativeEvent) => {
    // 현재 작성 중(IME)이고 폴백을 사용하는 경우,
    // 폴백 객체에서 작성된 문자를 추출하려고 시도합니다.
    // 컴포지션 이벤트를 사용할 수 있는 경우, // 컴포지션 이벤트에서만 문자열을 추출합니다.
    // 컴포지션 이벤트에서만 문자열을 추출하고, 그렇지 않으면 폴백 이벤트에서 추출합니다.
    if (isComposing) {
        if (
            topLevelType === TOP_COMPOSITION_END ||
            (!canUseCompositionEvent && isFallbackCompositionEnd(topLevelType, nativeEvent))
        ) {
            const chars = FallbackCompositionStateGetData();
            FallbackCompositionStateReset();
            isComposing = false;
            return chars;
        }
        return null;
    }

    switch (topLevelType) {
        case TOP_PASTE:
            // If a paste event occurs after a keypress, throw out the input
            // chars. Paste events should not lead to BeforeInput events.
            return null;
        case TOP_KEY_PRESS:
            /**
             * v27부터 Firefox는 문자가 삽입되지 않은 경우에도 키 누르기 이벤트를 실행할 수 있습니다.
             * 가 삽입되지 않은 경우에도 키 누르기 이벤트를 발생시킬 수 있습니다. 몇 가지 가능성이 있습니다:
             *
             * - `어떤`은 `0`입니다. 화살표 키, Esc 키 등
             *
             * - `which`는 누른 키 코드이지만 사용할 수 있는 문자가 없습니다.
             * 예: 폴란드어로 'AltGr + d`. 다음에 대한 수정된 문자가 없습니다.
             * 이 키 조합에 대한 수정된 문자가 없으며
             * 문서에 삽입되지 않지만 FF는 어쨌든 문자 코드 `100`에 대한 키 누름을 실행합니다.
             * '입력' 이벤트가 발생하지 않습니다.
             *
             * - `어떤`은 누른 키 코드이지만 명령 조합이
             * 사용 중입니다. 예: `Cmd+C`. 문자가 삽입되지 않았으며
             * `입력` 이벤트가 발생합니다.
             */

            if (!isKeypressCommand(nativeEvent)) {
                // 사용자가 이모티콘을 입력하면 IE는 `keypress` 이벤트를 실행합니다.
                // 윈도우의 터치 키보드를 통해 이모티콘을 입력할 때 `키 누르기` 이벤트를 발생시킵니다.  이 경우 `char` 속성
                //에는 `\uD83D\uDE0A`와 같은 이모티콘 문자가 저장됩니다.  길이가
                // 길이가 2이므로 `어떤` 속성은 이모티콘을 올바르게 나타내지 않습니다.
                // 이러한 경우 `char` 속성을 직접 반환하는 대신
                // `which`를 사용합니다.
                if (nativeEvent.char && nativeEvent.char.length > 1) {
                    return nativeEvent.char;
                } else if (nativeEvent.which) {
                    return String.fromCharCode(nativeEvent.which);
                }
            }
            return null;
        case TOP_COMPOSITION_END:
            return useFallbackCompositionData && !isUsingKoreanIME(nativeEvent) ? null : nativeEvent.data;
        default:
            return null;
    }
};

/**
 * Extract a SyntheticInputEvent for `beforeInput`, based on either native
 * `textInput` or fallback behavior.
 *
 * @return {?object} A SyntheticInputEvent.
 * @description  * 네이티브 `beforeInput` 또는 폴백 동작에 따라
 * `beforeInput`에 대한 SyntheticInputEvent를 추출합니다.
 * 텍스트 입력` 또는 폴백 동작을 기반으로 `textInput`에 대한 합성 입력 이벤트를 추출합니다.
 */
const extractBeforeInputEvent = (topLevelType, targetInst, nativeEvent, nativeEventTarget) => {
    let chars;

    if (canUseTextInputEvent) {
        chars = getNativeBeforeInputChars(topLevelType, nativeEvent);
    } else {
        chars = getFallbackBeforeInputChars(topLevelType, nativeEvent);
    }
    if (!chars) {
        return null;
    }

    const event = SyntheticInputEvent.getPooled(eventTypes.beforeInput, targetInst, nativeEvent, nativeEventTarget);

    event.data = chars;
    accumulateTwoPhaseDispatches(event);
    return event;
};

/**
 * 일치할 `온비포입력` 이벤트를 생성합니다.
 * http://www.w3.org/TR/2013/WD-DOM-Level-3-Events-20131105/#events-inputevents.
 *
 * 이 이벤트 플러그인은 네이티브 `textInput` 이벤트를 기반으로 합니다.
 * Chrome, Safari, Opera 및 IE에서 사용할 수 있습니다. 이 이벤트는 다음 이후에 발생합니다.
 * 키 누름` 및 `온 컴포지션 종료` 이후, `온 입력` 이전에 발생합니다.
 *
 * `beforeInput`은 사양은 지정되어 있지만 어떤 브라우저에서도 구현되지 않습니다.
 * `input` 이벤트는 무엇이 추가되었는지에 대한 유용한 정보를 제공하지 않습니다.
 * 실제로 추가된 내용에 대한 유용한 정보를 제공하지 않습니다. 따라서 `textInput`은 문자를 식별하는 데 가장 좋은
 * 실제로 삽입된 문자를 식별하는 데 사용할 수 있는 최고의 이벤트입니다.
 대상 노드에 삽입된 문자를 식별하는 데 가장 적합한 * 이벤트입니다.
 *
 * 이 플러그인은 또한 '컴포지션' 이벤트를 발생시켜서
 * `beforeInput`과 `작성` 이벤트 유형 모두에 대한 컴포지션 폴백 코드를 공유할 수 있습니다.
 * 컴포지션` 이벤트 유형에 대한 컴포지션 폴백 코드를 공유할 수 있습니다.
 */

const BeforeInputEventPlugin = {
    eventTypes: eventTypes,

    /**
     *
     * @param {*} topLevelType
     * @param {*} targetInst
     * @param {*} nativeEvent
     * @param {*} nativeEventTarget
     * @param {*} eventSystemFlags
     * @returns {rfsSyntheticEvent[]}
     * @description BeforeInputEventPlugin은 두 가지 이벤트를 생성할 수 있습니다
     * 1. compositionEnd
     * 2. beforeInput
     * SyntheticCompositionEvent와 SyntheticInputEvent를 반환합니다.
     */
    extractEvents: (topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags) => {
        const composition = extractCompositionEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget);

        const beforeInput = extractBeforeInputEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget);

        if (composition === null) {
            return beforeInput;
        }

        if (beforeInput === null) {
            return composition;
        }

        return [composition, beforeInput];
    },
};

export default BeforeInputEventPlugin;
