import getEventCharCode from "./getEventCharCode.js";

/**
 * @description normalizeKey 객체
 * @description normalizeKey 객체는 HTML5에서 사용되는 key 값들의 구식 또는 비표준 이름을 최신 표준 이름으로 변환하는 데 사용됩니다.
 * @description 예를 들어, "Esc"는 "Escape"로, "Left"는 "ArrowLeft"로 변환됩니다. 이는 브라우저 간의 차이를 줄이고, 코드 내에서 일관된 key 값을 사용할 수 있게 해줍니다.
 */
const normalizeKey = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified",
};

/**
 * @description translateToKey 객체
 * @description translateToKey 객체는 구식 keyCode 값을 HTML5의 key 값으로 변환하는 데 사용됩니다. 예를 들어, keyCode 값이 13인 경우 "Enter"를 반환합니다.
 * @description 이 객체는 key 속성이 구현되지 않은 브라우저에서 키 이벤트를 처리할 때 유용합니다.
 */
const translateToKey = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta",
};

// getEventKey 함수
// getEventKey 함수는 주어진 네이티브 이벤트 객체를 기반으로 정규화된 key 값을 반환합니다.

// key 값 확인: 먼저 네이티브 이벤트 객체에서 key 값을 확인합니다. 이 값이 존재하고 "Unidentified"가 아니라면, normalizeKey 객체를 사용하여 이 값을 정규화합니다. Firefox에서 발생하는 "MozPrintableKey"와 같은 비표준 값을 처리하기 위한 단계입니다.

// keypress 이벤트 처리: key 속성이 없는 경우(구식 브라우저 또는 일부 특수 키에 대해), 이벤트 유형이 keypress인지 확인합니다. 이 경우 getEventCharCode 함수를 사용하여 charCode 값을 얻고, 이 값을 문자열로 변환하거나 "Enter"로 특별 처리합니다.

// keydown/keyup 이벤트 처리: 마지막으로, 이벤트 유형이 keydown 또는 keyup인 경우 translateToKey 객체를 사용하여 keyCode 값을 key 값으로 변환합니다.
/**
 * @param {object} nativeEvent Native browser event.
 * @description getEventKey 함수는 브라우저의 네이티브 키보드 이벤트에서 발생하는 key 값을 정규화하고,
 * @description 브라우저 간의 차이를 해결하기 위해 사용됩니다.
 * @description 이 함수는 key, charCode, keyCode 값을 사용하여 최종적으로 키 이벤트를 나타내는 문자열 값을 반환합니다.
 */
const getEventKey = (nativeEvent) => {
    if (nativeEvent.key) {
        // 브라우저에서 보고된 일관되지 않은 값을 정규화합니다.
        // 작업 초안 사양의 구현으로 인해 보고된 일관성 없는 값을 정상화합니다.

        // FireFox는 `key`를 구현하지만 모든 인쇄 가능한 문자에 대해 `MozPrintableKey`를 반환합니다.
        // 인쇄 가능한 문자(`Unidentified`로 정규화됨)에 대해서는 무시합니다.
        const key = normalizeKey[nativeEvent.key] || nativeEvent.key;
        if (key !== "Unidentified") {
            return key;
        }
    }

    // 브라우저는 `key`를 구현하지 않으며, 최대한 많이 폴리필합니다.
    if (nativeEvent.type === "keypress") {
        const charCode = getEventCharCode(nativeEvent);

        // 엔터 키는 기술적으로 인쇄할 수 있고 인쇄할 수 없는 키입니다.
        // 따라서 `키 누름`으로 캡처할 수 있으며, 인쇄할 수 없는 다른 키는 캡처해서는 안 됩니다.
        return charCode === 13 ? "Enter" : String.fromCharCode(charCode);
    }
    if (nativeEvent.type === "keydown" || nativeEvent.type === "keyup") {
        // 사용자 키보드 레이아웃에 따라 각 키의 실제 의미가 결정되지만
        // 키코드` 값의 실제 의미가 결정되지만, 거의 모든 기능 키는 범용 값을 갖습니다.
        return translateToKey[nativeEvent.keyCode] || "Unidentified";
    }
    return "";
};

export default getEventKey;
