import getNodeForCharacterOffset from "./getNodeForCharacterOffset.js";
import { TEXT_NODE } from "../shared/HTMLNodeType";
/**
 *
 * @param {*} outerNode
 * @param {*} anchorNode
 * @param {*} anchorOffset
 * @param {*} focusNode
 * @param {*} focusOffset
 * @returns {object|null}
 * @description  이 함수는 주어진 노드(outerNode)
 * 내에서 시작 지점(anchorNode, anchorOffset)과 끝 지점(focusNode,
 * focusOffset)을 기반으로 실제 텍스트 콘텐츠의 오프셋을 계산합니다. 반환값은 {start, end} 객체로, start는 선택 영역의 시작 오프셋, end는 종료 오프셋입니다.
 * 함수는 주어진 outerNode를 시작점으로 하여 DOM 트리를 순회하며, anchorNode와 focusNode에 해당하는 오프셋을 찾아낸 후, 이를
 * 기반으로 전체 텍스트 내에서의 상대적 위치를 계산합니다.
 * 이 함수는 복잡한 DOM 구조 내에서도 사용자의 선택 영역을 정확하게 식별할 수 있게 해줍니다.
 */
export const getModernOffsetsFromPoints = (outerNode, anchorNode, anchorOffset, focusNode, focusOffset) => {
    let length = 0;
    let start = -1;
    let end = -1;
    let indexWithinAnchor = 0;
    let indexWithinFocus = 0;
    let node = outerNode;
    let parentNode = null;

    outer: while (true) {
        let next = null;

        while (true) {
            if (node === anchorNode && (anchorOffset === 0 || node.nodeType === TEXT_NODE)) {
                start = length + anchorOffset;
            }
            if (node === focusNode && (focusOffset === 0 || node.nodeType === TEXT_NODE)) {
                end = length + focusOffset;
            }

            if (node.nodeType === TEXT_NODE) {
                length += node.nodeValue.length;
            }

            if ((next = node.firstChild) === null) {
                break;
            }
            // Moving from `node` to its first child `next`.
            parentNode = node;
            node = next;
        }

        while (true) {
            if (node === outerNode) {
                // `외부 노드`에 자식이 있는 경우, 항상 두 번째로 방문합니다.
                // 그것을 방문합니다. 자식이 없는 경우 여전히 첫 번째 루프이며, 유일한
                // 유효한 선택은 앵커노드와 포커스노드가 모두 이 노드와 같고 // 둘 다 오프셋이 0인 경우입니다.
                // 둘 다 오프셋이 0이며, 이 경우 위에서 처리했을 것입니다..
                break outer;
            }
            if (parentNode === anchorNode && ++indexWithinAnchor === anchorOffset) {
                start = length;
            }
            if (parentNode === focusNode && ++indexWithinFocus === focusOffset) {
                end = length;
            }
            if ((next = node.nextSibling) !== null) {
                break;
            }
            node = parentNode;
            parentNode = node.parentNode;
        }

        // Moving from `node` to its next sibling `next`.
        node = next;
    }

    if (start === -1 || end === -1) {
        // This should never happen. (Would happen if the anchor/focus nodes aren't
        // actually inside the passed-in node.)
        return null;
    }

    return {
        start: start,
        end: end,
    };
};

/**
 * @param {DOMElement} outerNode
 * @return {object|null}
 * @description 이 함수는 주어진 outerNode 내의 현재 선택 영역에 대한 정보를 반환합니다.
 * window.getSelection()을 사용하여 현재 선택된 텍스트의 시작 노드(anchorNode),
 * 시작 오프셋(anchorOffset), 종료 노드(focusNode), 종료 오프셋(focusOffset)을 가져옵니다.
 * 선택 영역이 존재하면, getModernOffsetsFromPoints 함수를 호출하여 해당 영역의 오프셋을 계산하고 반환합니다.
 */
export const getOffsets = (outerNode) => {
    const { ownerDocument } = outerNode;
    const win = (ownerDocument && ownerDocument.defaultView) || window;
    const selection = win.getSelection && win.getSelection();

    if (!selection || selection.rangeCount === 0) {
        return null;
    }

    const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;

    // Firefox에서 앵커노드와 포커스노드는 "익명 div"가 될 수 있습니다.
    // <입력 유형="숫자">의 위/아래 버튼. 익명 디브는
    // 프로퍼티를 노출하지 않으므로 해당 프로퍼티에 액세스하면
    // 속성에 액세스하면 "권한 거부 오류"가 발생합니다. 오류를 피할 수 있는 유일한 방법은
    // 일반적으로 익명이 아닌 디비에서 작동하는 프로퍼티에 액세스하고
    // 그렇지 않으면 발생할 수 있는 모든 오류를 잡는 것입니다. 다음을 참조하세요.
    // https://bugzilla.mozilla.org/show_bug.cgi?id=208427
    try {
        /* eslint-disable no-unused-expressions */
        anchorNode.nodeType;
        focusNode.nodeType;
        /* eslint-enable no-unused-expressions */
    } catch (e) {
        return null;
    }

    return getModernOffsetsFromPoints(outerNode, anchorNode, anchorOffset, focusNode, focusOffset);
};

/**
 * @param {DOMElement|DOMTextNode} node
 * @param {object} offsets
 * @description 이 함수는 주어진 노드와 오프셋을 기반으로 선택 영역을 설정합니다.
 * @description 주어진 노드(node)에 대하여 offsets 객체에 명시된 시작(start)과
 *  끝(end) 오프셋을 기반으로 선택 영역을 설정합니다. 이 함수는 프로그래밍 방식으로
 * 특정 텍스트 영역을 선택할 때 사용됩니다.
 * 내부적으로 getNodeForCharacterOffset 함수를 사용하여 오프셋에 해당하는
 * 노드와 노드 내 오프셋을 찾아내고, document.createRange()와 selection.addRange(range)를
 * 통해 실제 선택 영역을 설정합니다.
 */
export const setOffsets = (node, offsets) => {
    const doc = node.ownerDocument || document;
    const win = (doc && doc.defaultView) || window;

    if (!win.getSelection) {
        return;
    }

    const selection = win.getSelection();
    const length = node.textContent.length;
    let start = Math.min(offsets.start, length);
    let end = offsets.end === undefined ? start : Math.min(offsets.end, length);

    if (!selection.extend && start > end) {
        const temp = end;
        end = start;
        start = temp;
    }

    const startMarker = getNodeForCharacterOffset(node, start);
    const endMarker = getNodeForCharacterOffset(node, end);

    if (startMarker && endMarker) {
        if (
            selection.rangeCount === 1 &&
            selection.anchorNode === startMarker.node &&
            selection.anchorOffset === startMarker.offset &&
            selection.focusNode === endMarker.node &&
            selection.focusOffset === endMarker.offset
        ) {
            return;
        }
        const range = doc.createRange();
        range.setStart(startMarker.node, startMarker.offset);
        selection.removeAllRanges();

        if (start > end) {
            selection.addRange(range);
            selection.extend(endMarker.node, endMarker.offset);
        } else {
            range.setEnd(endMarker.node, endMarker.offset);
            selection.addRange(range);
        }
    }
};
