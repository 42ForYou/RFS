import getActiveElement from "./getActiveElement.js";

import { ELEMENT_NODE, TEXT_NODE } from "../../../const/CDomNodeType.js";
import { getOffsets, setOffsets } from "../domSelection.js";
const isTextNode = (node) => {
    return node && node.nodeType === TEXT_NODE;
};

/**
 *
 * @param {*} outerNode
 * @param {*} innerNode
 * @returns {boolean}
 * @description outerNode가 innerNode를 포함하고 있는지 여부를 반환합니다.
 */
const containsNode = (outerNode, innerNode) => {
    if (!outerNode || !innerNode) {
        return false;
    } else if (outerNode === innerNode) {
        return true;
    } else if (isTextNode(outerNode)) {
        return false;
    } else if (isTextNode(innerNode)) {
        return containsNode(outerNode, innerNode.parentNode);
    } else if ("contains" in outerNode) {
        return outerNode.contains(innerNode);
    } else if (outerNode.compareDocumentPosition) {
        //비트마스크 통하여 하나라도 일치하면 true 반환
        return !!(outerNode.compareDocumentPosition(innerNode) & 16);
    } else {
        return false;
    }
};

/**
 *
 * @param {*} node
 * @returns {boolean}
 * @description node가 문서에 포함되어 있는지 여부를 반환합니다.
 */
const isInDocument = (node) => {
    return node && node.ownerDocument && containsNode(node.ownerDocument.documentElement, node);
};
/**
 *
 * @param {*} iframe
 * @returns {boolean}
 * @description iframe이 같은 출처인지 여부를 반환합니다.
 */
const isSameOriginFrame = (iframe) => {
    try {
        // HTMLIframeElement의 contentDocument에 접근하면 브라우저에
        // 크로스 오리진 src 속성이 있는 경우와 같이 오류가 발생할 수 있습니다.
        // 접근 결과 "원본이 있는 프레임이 차단됨"이 발생하면 Safari는 콘솔에 오류를 표시합니다:
        // iframe.contentDocument.defaultView;
        // 안전한 방법은 교차 오리진 속성 중 하나에 액세스하는 것입니다: 창 또는 위치
        // 이 경우 "SecurityError" DOM 예외가 발생할 수 있으며 Safari와 호환됩니다.
        // https://html.spec.whatwg.org/multipage/browsers.html#integration-with-idl

        return typeof iframe.contentWindow.location.href === "string";
    } catch (err) {
        return false;
    }
};

/**
 *
 * @returns {Element}
 * @description 현재 활성화된 요소를 가져옵니다. 만약 활성 요소가 iframe 내부에 있다면,
 * 해당 iframe의 document 내에서 활성화된 요소를 재귀적으로 찾습니다.
 */
const getActiveElementDeep = () => {
    let win = window;
    let element = getActiveElement();
    while (element instanceof win.HTMLIFrameElement) {
        if (isSameOriginFrame(element)) {
            win = element.contentWindow;
        } else {
            return element;
        }
        element = getActiveElement(win.document);
    }
    return element;
};

/**
 *
 * @param {*} elem
 * @returns {boolean}
 * @description 주어진 요소가 선택 영역을 가질 수 있는지 확인합니다.
 * input, textarea, contentEditable 속성을 가진 요소들이 이에 해당합니다.
 */
export const hasSelectionCapabilities = (elem) => {
    const nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
    return (
        nodeName &&
        ((nodeName === "input" &&
            (elem.type === "text" ||
                elem.type === "search" ||
                elem.type === "tel" ||
                elem.type === "url" ||
                elem.type === "password")) ||
            nodeName === "textarea" ||
            elem.contentEditable === "true")
    );
};

/**
 *
 * @returns {object}
 * @description 현재 활성 요소와 그 선택 범위 정보를 객체로 반환합니다.
 */
export const getSelectionInformation = () => {
    const focusedElem = getActiveElementDeep();
    return {
        focusedElem: focusedElem,
        selectionRange: hasSelectionCapabilities(focusedElem) ? getSelection(focusedElem) : null,
    };
};

/**
 *
 * @param {*} input  : selection bounds를 가져올 textarea 또는 input 요소
 * @returns {object} : {start: selectionStart, end: selectionEnd}
 * @description 포커스된 textarea, input 또는 contentEditable 노드의 선택 영역을 가져옵니다.
 */
export const getSelection = (input) => {
    let selection;

    if ("selectionStart" in input) {
        // Modern browser with input or textarea.
        selection = {
            start: input.selectionStart,
            end: input.selectionEnd,
        };
    } else {
        selection = getOffsets(input);
    }

    return selection || { start: 0, end: 0 };
};

/**
 *
 * @param {*} input : selection bounds를 설정할 textarea 또는 input 요소
 * @param {*} offsets : get*에서 반환된 형태와 동일한 객체
 * @description textarea 또는 input의 선택 영역을 설정하고 해당 요소에 포커스를 맞춥니다.
 */
export const setSelection = (input, offsets) => {
    const { start, end } = offsets;
    if (end === undefined) {
        end = start;
    }

    if ("selectionStart" in input) {
        input.selectionStart = start;
        input.selectionEnd = Math.min(end, input.value.length);
    } else {
        setOffsets(input, offsets);
    }
};
/**
 *
 * @param {*} priorSelectionInformation
 * @description 이전에 저장된 선택 정보(priorSelectionInformation)를 사용해,
 * 선택 영역을 복원하고 해당 요소에 포커스를 맞춥니다.
 */
export const restoreSelection = (priorSelectionInformation) => {
    const curFocusedElem = getActiveElementDeep();
    const priorFocusedElem = priorSelectionInformation.focusedElem;
    const priorSelectionRange = priorSelectionInformation.selectionRange;
    if (curFocusedElem !== priorFocusedElem && isInDocument(priorFocusedElem)) {
        if (priorSelectionRange !== null && hasSelectionCapabilities(priorFocusedElem)) {
            setSelection(priorFocusedElem, priorSelectionRange);
        }

        // Focusing a node can change the scroll position, which is undesirable
        const ancestors = [];
        let ancestor = priorFocusedElem;
        while ((ancestor = ancestor.parentNode)) {
            if (ancestor.nodeType === ELEMENT_NODE) {
                ancestors.push({
                    element: ancestor,
                    left: ancestor.scrollLeft,
                    top: ancestor.scrollTop,
                });
            }
        }

        if (typeof priorFocusedElem.focus === "function") {
            priorFocusedElem.focus();
        }

        for (let i = 0; i < ancestors.length; i++) {
            const info = ancestors[i];
            info.element.scrollLeft = info.left;
            info.element.scrollTop = info.top;
        }
    }
};
