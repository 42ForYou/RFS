// DOM 노드에서 텍스트 콘텐츠를 추적하고, 특정 이벤트(예: 사용자의 입력)
//전후에 노드의 텍스트 콘텐츠가 어떻게 변화하는지 비교하는 데 사용되는 유틸리티 함수들의 모음입니다.
//특히, 입력 과정에서 발생할 수 있는 "composition" 이벤트를 처리하는 컨텍스트에서 사용됩니다.
// 이는 다양한 언어의 입력을 처리할 때 특히 유용하며, 입력 메서드 에디터(IMF)를 통해 문자가 조합되는 과정을
// 추적할 때 사용할 수 있습니다.
/**
 * 이 변수는 대상 노드의 텍스트 콘텐츠에 대한 정보를 저장합니다,
 * 특정 이벤트 전후의 콘텐츠를 비교할 수 있습니다.
 *
 현재 선택이 시작되는 노드를 식별한 다음, * 해당 노드의 텍스트 콘텐츠와
 * 텍스트 콘텐츠와 DOM 내 현재 위치를 모두 관찰합니다. 이후
 브라우저는 컴포지션 중에 기본적으로 대상 노드를 대체할 수 있으므로, * 그 위치를 사용하여
 * 그 위치를 사용하여 대체물을 찾을 수 있습니다.
 *
 *
 */
let root = null;
let startText = null;
let fallbackText = null;

/**
 *
 * @returns {string} 현재 root 노드의 텍스트 콘텐츠를 가져옵니다.
 * root 노드가 input이나 textarea와 같은 폼 요소인 경우 value 속성을,
 *  그렇지 않은 경우 textContent를 사용하여 텍스트를 반환합니다.
 */
export const getText = () => {
    if ("value" in root) {
        return root.value;
    }
    return root.textContent;
};

/**
 *
 * @param {*} nativeEventTarget
 * @returns {boolean}
 * @description 입력 이벤트가 시작되는 대상 노드(nativeEventTarget)를 초기화하고,
 *  시점의 텍스트 콘텐츠를 startText에 저장합니다. root 변수는 이벤트 대상 노드를 참조합니다.
 */
export const initialize = (nativeEventTarget) => {
    root = nativeEventTarget;
    startText = getText();
    return true;
};

/**
 * @description root, startText,
 *  그리고 fallbackText 변수를 null로 설정하여 초기화합니다.
 * 이는 다음 입력 이벤트 처리를 위해 상태를 초기 상태로 되돌립니다.
 */
export const reset = () => {
    root = null;
    startText = null;
    fallbackText = null;
};

/**
 *
 * @returns {string}
 * @description
 * 초기화 시점(startText)과 현재 시점의 텍스트(getText()의 결과)를 비교하여,
 * 이벤트 처리 전후에 변경된 텍스트만을 추출합니다. 변경된 텍스트는 fallbackText에 저장되며,
 * 이 함수는 fallbackText를 반환합니다.
 */
export const getData = () => {
    if (fallbackText) {
        return fallbackText;
    }

    let start;
    const startValue = startText;
    const startLength = startValue.length;
    let end;
    const endValue = getText();
    const endLength = endValue.length;

    for (start = 0; start < startLength; start++) {
        if (startValue[start] !== endValue[start]) {
            break;
        }
    }

    const minEnd = startLength - start;
    for (end = 1; end <= minEnd; end++) {
        if (startValue[startLength - end] !== endValue[endLength - end]) {
            break;
        }
    }

    const sliceTail = end > 1 ? 1 - end : undefined;
    fallbackText = endValue.slice(start, sliceTail);
    return fallbackText;
};
