// SelectEventPlugin: 사용자가 텍스트를 선택(select)할 때 발생하는 이벤트를 처리합니다.
import isTextInputElement from "../../core/isTextInputElement.js";
import { shallowEqual } from "../../../shared/sharedEqual.js";
import SyntheticEvent from "../SyntheticEvent/syntheticEvent.js";
import { hasSelectionCapabilities } from "../../core/element/inputSelection.js";
import { accumulateTwoPhaseDispatches } from "../eventPropagators.js";
import {
    TOP_BLUR,
    TOP_CONTEXT_MENU,
    TOP_DRAG_END,
    TOP_FOCUS,
    TOP_KEY_DOWN,
    TOP_KEY_UP,
    TOP_MOUSE_DOWN,
    TOP_MOUSE_UP,
    TOP_SELECTION_CHANGE,
} from "../domTopLevelEventType.js";
import { isListeningToAllDependencies } from "../eventEmmiter.js";
import { getNodeFromInstance } from "../../core/domComponentConnection.js";
import { DOCUMENT_NODE } from "../../../const/CDomNodeType.js";
import getActiveElement from "../../core/element/getActiveElement.js";
//selectionchange 이벤트의 비정상적인 동작을 회피하기 위한 플래그입니다. 이 브라우저들에서는 documentMode 속성을 사용하여
// 문서 호환성 모드를 확인할 수 있으며, 이를 통해 해당 이벤트를 건너뛸지 결정합니다.
const skipSelectionChangeEvent = document.documentMode && document.documentMode <= 11;
// rfs에서 onSelect 이벤트를 정규화하여,
//  다양한 폼 요소들에서 선택(select) 이벤트를 일관되게 처리하는
// SelectEventPlugin 플러그인의 구현부입니다. onSelect 이벤트는
//  사용자가 입력 필드 내부의 텍스트를 선택할 때 발생합니다.
// 이 플러그인은 input, textarea, contentEditable 요소에서 사용자의 선택 동작을 추적하고,
// rfs의 이벤트 시스템을 통해 해당 이벤트를 처리합니다.

const eventTypes = {
    select: {
        phasedRegistrationNames: {
            bubbled: "onSelect",
            captured: "onSelectCapture",
        },
        dependencies: [
            TOP_BLUR,
            TOP_CONTEXT_MENU,
            TOP_DRAG_END,
            TOP_FOCUS,
            TOP_KEY_DOWN,
            TOP_KEY_UP,
            TOP_MOUSE_DOWN,
            TOP_MOUSE_UP,
            TOP_SELECTION_CHANGE,
        ],
    },
};

const activeElement = null;
const activeElementInst = null;
const lastSelection = null;
const mouseDown = false;
/**
 *
 * @param {*} node
 * @returns {object}
 * @description 주어진 노드에 대한 현재 선택(selection)을 나타내는 객체를 반환합니다.
 * @description <input>이나 <textarea> 같은 요소에서는
 * @description selectionStart와 selectionEnd 속성을 사용할 수 있으며,
 * @description 다른 요소에서는 window.getSelection()을 사용하여 선택된 텍스트의 범위를 얻습니다.
 */
const getSelection = (node) => {
    //<input> 또는 <textarea>
    if ("selectionStart" in node && hasSelectionCapabilities(node)) {
        return {
            start: node.selectionStart,
            end: node.selectionEnd,
        };
    } else {
        const win = (node.ownerDocument && node.ownerDocument.defaultView) || window;
        const selection = win.getSelection();
        return {
            //속성들은 사용자가 텍스트를 선택(드래그)할 때,
            // 선택의 시작 지점(anchor)과 끝 지점(focus)을 나타내는 데 사용됩니다
            anchorNode: selection.anchorNode,
            anchorOffset: selection.anchorOffset,
            focusNode: selection.focusNode,
            focusOffset: selection.focusOffset,
        };
    }
};

/**
 *
 * @param {*} eventTarget
 * @returns {Document}
 * @description 주어진 이벤트 타겟의 document를 반환합니다.
 */
const getEventTargetDocument = (eventTarget) => {
    return eventTarget.window === eventTarget
        ? eventTarget.document
        : eventTarget.nodeType === DOCUMENT_NODE
          ? eventTarget
          : eventTarget.ownerDocument;
};

/**
 * Poll selection to see whether it's changed.
 *
 * @param {object} nativeEvent
 * @param {object} nativeEventTarget
 * @return {rfsSyntheticEvent}
 * @description 실제 onSelect 합성 이벤트를 구성합니다.
 * @description 이 함수는 마우스 클릭, 드래그 종료, 키보드 동작 등 사용자의 선택 동작이 변경되었을 때 호출됩니다. 선택이 변경되었는지를 확인하고, 변경되었다면 onSelect 합성 이벤트를 생성하여 반환합니다.
 */
const constructSelectEvent = (nativeEvent, nativeEventTarget) => {
    // 올바른 요소가 있는지, 그리고 사용자가
    // 선택하지 않았는지 확인합니다(이는 네이티브 `선택` 이벤트 동작과 일치합니다). HTML5에서는
    //는 입력과 텍스트 영역에서만 발생하므로 초점이 맞춰진 요소가 없으면
    //가 디스패치되지 않습니다.
    const doc = getEventTargetDocument(nativeEventTarget);

    //마우스가 클릭되어있거나 , 현재 활성화된 요소가 없거나, 현재 활성화된 요소가 실제 문서에서 활성화된 요소가 아닌 경우 생성x
    if (mouseDown || activeElement === null || activeElement !== getActiveElement(doc)) {
        return null;
    }

    // selection 객체를 가져옵니다.
    const currentSelection = getSelection(activeElement);
    // 마지막 선택과 현재 선택이 다른 경우에만 이벤트를 발생시킵니다.
    if (!lastSelection || !shallowEqual(lastSelection, currentSelection)) {
        lastSelection = currentSelection;

        const syntheticEvent = SyntheticEvent.getPooled(
            eventTypes.select,
            activeElementInst,
            nativeEvent,
            nativeEventTarget
        );

        syntheticEvent.type = "select";
        syntheticEvent.target = activeElement;

        //이벤트를 이벤트 흐름의 두 단계에 걸쳐 디스패치할 때 사용합니다.
        accumulateTwoPhaseDispatches(syntheticEvent);

        return syntheticEvent;
    }

    return null;
};

/**
 * 이 플러그인은 양식 요소에서 선택 이벤트를 정규화하는 `onSlect` 이벤트를 생성합니다.
 * 이벤트를 생성합니다.
 *
 * 지원되는 요소는 다음과 같습니다:
 * - input(`isTextInputElement` 참조)
 * - textarea
 * - contentEditable
 *
 * 다음과 같은 점에서 네이티브 브라우저 구현과 다릅니다:
 * - 입력뿐만 아니라 contentEditable 필드에서도 발생합니다.
 * - 접힌 선택에 대해 발생합니다.
 * - 사용자 입력 후 발생합니다.
 */
const SelectEventPlugin = {
    eventTypes: eventTypes,

    /**
     *
     * @param {*} topLevelType
     * @param {*} targetInst
     * @param {*} nativeEvent
     * @param {*} nativeEventTarget
     * @param {*} eventSystemFlags
     * @returns {rfsSyntheticEvent}
     * @description SelectEventPlugin 플러그인의 이벤트 추출 메서드입니다.->SyntheticEvent를 반환합니다.
     */
    extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags) {
        // 이벤트가 발생한요소의 document를 가져옵니다.
        const doc = getEventTargetDocument(nativeEventTarget);

        // document가 없거나 onSelect에 대한 모든 종속성을 청취하지 않는 경우 null을 반환합니다.
        if (!doc || !isListeningToAllDependencies("onSelect", doc)) {
            return null;
        }

        // 이벤트가 발생한 요소를 가져옵니다.
        const targetNode = targetInst ? getNodeFromInstance(targetInst) : window;

        switch (topLevelType) {
            // Track the input node that has focus.
            case TOP_FOCUS:
                if (isTextInputElement(targetNode) || targetNode.contentEditable === "true") {
                    // 사용자가 입력 가능한 요소에 포커스를 맞추면,
                    //  그 시점에서의 선택 상태를 추적하기 시작해야 합니다.
                    //  이 때 lastSelection을 null로 설정함으로써, 이전에 있었던 어떠한 선택 상태도 초기화되고,
                    //  새로운 선택 동작의 시작점을 마련합니다.
                    activeElement = targetNode;
                    activeElementInst = targetInst;
                    lastSelection = null;
                }
                break;
            case TOP_BLUR:
                //포커스가 해제될 때 (TOP_BLUR)
                // 사용자가 입력 요소에서 포커스를 잃었을 때,
                // 그 요소에 대한 선택 동작이 더 이상 유효하지 않게 됩니다.
                // 이 경우에도 lastSelection을 null로 설정하여,
                // 선택된 상태가 없음을 명확히 하고, 추후 발생할 수 있는 선택 동작에 영향을 주지 않도록 초기화합니다.
                activeElement = null;
                activeElementInst = null;
                lastSelection = null;
                break;
            case TOP_MOUSE_DOWN:
                mouseDown = true;
                break;
            case TOP_CONTEXT_MENU:
            case TOP_MOUSE_UP:
            case TOP_DRAG_END:
                mouseDown = false;
                // 마우스 클릭, 드래그 종료, 키보드 동작 등 사용자의 선택 동작이 변경되었을 때
                // onSelect 합성 이벤트를 생성합니다.
                return constructSelectEvent(nativeEvent, nativeEventTarget);
            // 선택 항목이 변경될 때 Chrome과 IE에서 비표준 이벤트가 발생합니다(그리고
            // 때로는 그렇지 않은 경우에도). IE의 이벤트는 다음과 관련하여 순서대로 발생하지 않습니다.
            // 삭제 시 키 및 입력 이벤트에 대한 이벤트가 발생하지 않으므로 삭제합니다.
            //
            // Firefox는 선택 변경을 지원하지 않으므로 각 키 입력 후 선택 상태를 확인합니다.
            // 각 키 입력 후에 선택 상태를 확인합니다. 선택은 키다운 후와 키업 전에 변경되지만
            // 키업 전에도 선택이 변경되지만, 여러 개의 키다운 이벤트가 발생한 경우 키다운 상태도 확인합니다.
            // 키를 누르고 있는 경우에도 키다운 이벤트가 여러 번 발생하지만 키업 이벤트는 한 번만 발생하는지 확인합니다.
            // 위와 같은 이유로 IE 처리 방식도 이와 같습니다.
            case TOP_SELECTION_CHANGE:
                if (skipSelectionChangeEvent) {
                    break;
                }
            case TOP_KEY_DOWN:
            case TOP_KEY_UP:
                // 선택 이벤트를 생성합니다.
                return constructSelectEvent(nativeEvent, nativeEventTarget);
        }

        return null;
    },
};

export default SelectEventPlugin;
