import { TEXT_NODE } from "../../const/CDomNodeType.js";

/**
 *
 * @param {*} nativeEvent
 * @returns {DOMEventTarget}
 * @description : 브라우저의 네이티브 이벤트를 받아서 이벤트의 타겟을 가져오는 함수입니다.
 * @description : 만약 이벤트의 타겟이 텍스트 노드라면 부모노드로 설정합니다.->텍스트노드는 이벤트 핸들러를 가질수 없음
 */
export const getEventTarget = (nativeEvent) => {
    //nativeEvent.target -> 모던 브라우저의 event.target
    //nativeEvent.srcElement -> 옛날 브라우저의 event.target역할
    //둘다 없는경우 window를 target으로 설정
    let target = nativeEvent.target || nativeEvent.srcElement || window;

    //SVG <use> element 특수한 경우 대비
    if (target.correspondingUseElement) {
        target = target.correspondingUseElement;
    }

    //만약 텍스트 노드면 이벤트 핸들러를 가질수 없으므로 부모노드로 설정
    return target.nodeType === TEXT_NODE ? target.parentNode : target;
};
