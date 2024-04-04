/**
 *
 * @param {string} eventNameSuffix
 * @returns {boolean}
 * @description 이벤트가 지원되는지 여부를 나타냅니다.
 */
const isEventSupported = (eventNameSuffix) => {
    const eventName = "on" + eventNameSuffix;
    let isSupported = eventName in document;

    if (!isSupported) {
        //없을떄 이중으로 확인
        const element = document.createElement("div");
        element.setAttribute(eventName, "return;");
        isSupported = typeof element[eventName] === "function";
    }

    return isSupported;
};

export default isEventSupported;
