/**
 *
 * @param {*} nativeEvent
 * @returns {number}
 * @description 네이티브 이벤트의 문자 코드를 반환합니다.
 */
const getEventCharCode = (nativeEvent) => {
    let charCode;
    const keyCode = nativeEvent.keyCode;

    if ("charCode" in nativeEvent) {
        charCode = nativeEvent.charCode;
        if (charCode === 0 && keyCode === 13) {
            charCode = 13;
        }
    } else {
        // IE8은 `charCode`를 구현하지 않지만, `keyCode`는 올바른 값을 가짐.
        charCode = keyCode;
    }

    // IE, Edge(Windows), Chrome/Safari(Windows, Linux)는
    // ctrl이 눌렸을 때 Enter를 charCode 10으로 보고함.
    if (charCode === 10) {
        charCode = 13;
    }

    // 일부 비인쇄 키는 `charCode`/`keyCode`에서 보고됨, 이를 제외함.
    // 단, Enter키는 제외하지 않음.
    if (charCode >= 32 || charCode === 13) {
        return charCode;
    }

    return 0;
};

export default getEventCharCode;
