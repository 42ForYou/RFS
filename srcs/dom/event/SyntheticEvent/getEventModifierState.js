const modifierKeyToProp = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey",
};

const modifierStateGetter = (keyArg) => {
    const syntheticEvent = this;
    const nativeEvent = syntheticEvent.nativeEvent;
    if (nativeEvent.getModifierState) {
        return nativeEvent.getModifierState(keyArg);
    }
    const keyProp = modifierKeyToProp[keyArg];
    return keyProp ? !!nativeEvent[keyProp] : false;
};

/**
 *
 * @param {*} nativeEvent
 * @description 이벤트 객체의 modifier 상태를 반환합니다.예) Shift, Control, Alt, Meta 키가 눌려있는지 여부를 반환합니다.
 */
const getEventModifierState = (nativeEvent) => {
    return modifierStateGetter;
};

export default getEventModifierState;
