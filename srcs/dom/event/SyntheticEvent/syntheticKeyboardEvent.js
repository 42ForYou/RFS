import SyntheticUIEvent from "./syntheticUIEvent";
import getEventCharCode from "./getEventCharCode";
import getEventKey from "./getEventKey";
import getEventModifierState from "./getEventModifierState";
/**
 * @description 키보드 이벤트를 위한 SyntheticEvent 확장. 키 관련 정보를 포함합니다.
 */
const SyntheticKeyboardEvent = SyntheticUIEvent.extend({
    // key: 이벤트에 의해 활성화된 키의 값을 반환합니다. getEventKey 함수를 사용하여 이 값을 구합니다. 키 값은 Enter, Escape와 같이 키보드의 실제 키 값을 나타내는 문자열입니다.

    // location: 키 이벤트가 발생한 위치입니다. 현재 null로 설정되어 있으며, 키보드의 특정 위치(예: 왼쪽 Shift와 오른쪽 Shift 구분)를 나타내기 위해 사용될 수 있습니다.

    // ctrlKey: Ctrl 키가 이벤트와 함께 눌려있는지 여부를 나타냅니다. null로 초기화되어 있으며, 이벤트 처리 중 해당 값이 설정됩니다.

    // shiftKey: Shift 키가 이벤트와 함께 눌려있는지 여부를 나타냅니다.

    // altKey: Alt 키가 이벤트와 함께 눌려있는지 여부를 나타냅니다.

    // metaKey: Meta 키(Windows 키나 Command 키 등)가 이벤트와 함께 눌려있는지 여부를 나타냅니다.

    // repeat: 키가 반복해서 눌려지고 있는지 여부를 나타냅니다. 예를 들어, 키를 길게 누르고 있을 때 true가 될 수 있습니다.

    // locale: 이벤트가 발생한 로케일을 나타냅니다. 현재 null로 설정되어 있습니다.

    // getModifierState: 특정 수정자 키(Shift, Alt, Ctrl, Meta)의 상태를 확인하는 함수입니다.
    key: getEventKey,
    location: null,
    ctrlKey: null,
    shiftKey: null,
    altKey: null,
    metaKey: null,
    repeat: null,
    locale: null,
    getModifierState: getEventModifierState,
    /**
     * 
     * @param {} event 
     * @returns {number}
     * @description (레거시 인터페이스): keypress 이벤트 결과로 발생하는 실제 인쇄 가능한 문자의 값을 나타냅니다. 
    // 이 값은 getEventCharCode 함수를 사용하여 구합니다.
     */
    charCode: (event) => {
        if (event.type === "keypress") {
            return getEventCharCode(event);
        }
        return 0;
    },
    /**
     *
     * @param {*} event
     * @returns {number}
     * @description (레거시 인터페이스): keydown 또는 keyup 이벤트 결과로, 물리적인 키보드 키의 값을 나타냅니다.
     * @description 사용자의 키보드 레이아웃에 따라 값의 실제 의미가 달라질 수 있으며, 이 값은 주로 레거시 목적으로 사용됩니다.
     */
    keyCode: (event) => {
        // `keyCode` is the result of a KeyDown/Up event and represents the value of
        // physical keyboard key.

        // The actual meaning of the value depends on the users' keyboard layout
        // which cannot be detected. Assuming that it is a US keyboard layout
        // provides a surprisingly accurate mapping for US and European users.
        // Due to this, it is left to the user to implement at this time.
        if (event.type === "keydown" || event.type === "keyup") {
            return event.keyCode;
        }
        return 0;
    },
    /**
     *
     * @param {} event
     * @returns
     * @description  which (레거시 인터페이스): keyCode 또는 charCode의 별칭으로, 이벤트 유형에 따라 달라집니다.
     * @description keydown 또는 keyup 이벤트의 경우 keyCode 값을, keypress 이벤트의 경우 charCode 값을 반환합니다.
     */
    which: (event) => {
        // `which` is an alias for either `keyCode` or `charCode` depending on the
        // type of the event.
        if (event.type === "keypress") {
            return getEventCharCode(event);
        }
        if (event.type === "keydown" || event.type === "keyup") {
            return event.keyCode;
        }
        return 0;
    },
});

export default SyntheticKeyboardEvent;
