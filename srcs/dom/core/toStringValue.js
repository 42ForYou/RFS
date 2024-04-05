export const toString = (value) => {
    return "" + value;
};

export const getToStringValue = (value) => {
    switch (typeof value) {
        case "boolean":
        case "number":
        case "object":
        case "string":
        case "undefined":
            return value;
        default:
            // function, symbol are assigned as empty strings
            return "";
    }
};

/**
 * @description
 * 요소 속성으로 toString 메서드가 있는 객체를 전달하거나 위험하게SetInnerHTML로 전달할 수 있습니다.
 * 로 전달하고 값이 안전한지 유효성 검사를 수행합니다. 유효성 검사를 수행한 후에는 객체 대신 유효성이 검사된
 * 값을 사용할 수 있습니다(object.toString은 다음 호출에서 다른 값을 반환할 수 있으므로).
 *
 * 애플리케이션이 신뢰할 수 있는 유형을 사용하는 경우 신뢰할 수 있는 값을 문자열화하지 않고 객체로 보존합니다.
 */
export const toStringOrTrustedType = toString;
