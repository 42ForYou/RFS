//element를 만들떄 namespace에 따라 생성하는 방식이 다름으로 그에 따른 namespace를 지정하기 위한 const들
const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const MATH_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

//namespace를 지정하기 위한 상수들
export const Namespaces = {
    html: HTML_NAMESPACE,
    mathml: MATH_NAMESPACE,
    svg: SVG_NAMESPACE,
};

/**
 *
 * @param {THostType} type @see 파일경로: type/THostType.js
 * @description 현재 타입이 HTMLNamespace에 있을 때 현재 namespace를 결정하는 함수
 */
export const getIntrinsicNamespace = (type) => {
    switch (type) {
        case "svg":
            return SVG_NAMESPACE;
        case "math":
            return MATH_NAMESPACE;
        default:
            return HTML_NAMESPACE;
    }
};

export const getChildNamespace = (parentNamespace, type) => {
    if (parentNamespace === null || parentNamespace === HTML_NAMESPACE) {
        // No (or default) parent namespace: potential entry point.
        return getIntrinsicNamespace(type);
    }
    if (parentNamespace === SVG_NAMESPACE && type === "foreignObject") {
        // We're leaving SVG.
        return HTML_NAMESPACE;
    }
    // By default, pass namespace below.
    return parentNamespace;
};
