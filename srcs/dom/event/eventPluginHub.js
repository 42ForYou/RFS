import { injectEventPluginOrder, injectEventPluginsByName, plugins } from "./eventPluginRegistry.js";
import { getFiberCurrentPropsFromNode } from "./eventPluginUtil.js";
import accumulateInto from "./accumulateInto.js";
import { runEventsInBatch } from "./eventBatching.js";

/**
 *
 * @param {*} tag
 * @returns {boolean}
 * @description * 버튼, 입력, 선택, 텍스트영역과 같은 상호작용 요소인지 여부를 반환합니다.
 */
const isInteractive = (tag) => {
    return tag === "button" || tag === "input" || tag === "select" || tag === "textarea";
};

/**
 *
 * @param {*} name
 * @param {*} type
 * @param {*} props
 * @returns {boolean}
 * @description * 이벤트가 발생해야 하는지 여부를 반환합니다.
 */
const shouldPreventMouseEvent = (name, type, props) => {
    switch (name) {
        case "onClick":
        case "onClickCapture":
        case "onDoubleClick":
        case "onDoubleClickCapture":
        case "onMouseDown":
        case "onMouseDownCapture":
        case "onMouseMove":
        case "onMouseMoveCapture":
        case "onMouseUp":
        case "onMouseUpCapture":
            return !!(props.disabled && isInteractive(type));
        default:
            return false;
    }
};
/**
 * 이벤트 플러그인을 설치하고 구성할 수 있는 통합 인터페이스입니다.
 *
 * 이벤트 플러그인은 다음 속성을 구현할 수 있습니다:
 *
 * `extractEvents` {function(문자열, DOMEventTarget, 문자열, 객체): *}
 * 필수입니다. 최상위 이벤트가 발생하면 이 메서드는 다음을 수행합니다.
 * 차례로 큐에 대기하고 디스패치할 합성 이벤트를 추출합니다.
 *
 * `eventTypes 유형` {객체}
 * 선택 사항, 이벤트를 실행하는 플러그인은 등록 매핑을 게시해야 합니다.
 * 리스너를 등록하는 데 사용되는 이름 매핑을 게시해야 합니다. 이 매핑의 값은 다음과 같아야 합니다.
 * 등록 이름` 또는 `단계별 등록 이름`을 포함하는 객체여야 합니다.
 *
 * executeDispatch` {함수(객체, 함수, 문자열)}.
 * 선택 사항으로, 플러그인이 이벤트 디스패치 방식을 재정의할 수 있습니다. By
 * 기본적으로 리스너가 단순히 호출됩니다.
 *
 * 이벤트 플러그인 허브`에 삽입된 각 플러그인은 즉시 작동할 수 있습니다.
 *
 * @public
 */

/**
 * 종속성을 주입하는 메소드.
 */

export const injection = {
    /**
     * @param {array} InjectedEventPluginOrder
     * @public
     */
    injectEventPluginOrder,

    /**
     * @param {object} injectedNamesToPlugins 이름에서 플러그인 모듈로 매핑합니다.
     */
    injectEventPluginsByName,
};

/**
 * @param {object} inst The instance, which is the source of events.
 * @param {string} registrationName Name of listener (e.g. `onClick`).
 * @return {?function} The stored callback.
 * @description * 저장된 콜백을 반환합니다.
 */
export const getListener = (inst, registrationName) => {
    const stateNode = inst.stateNode;
    if (!stateNode) {
        // Work in progress (ex: onload events in incremental mode).
        return null;
    }
    const props = getFiberCurrentPropsFromNode(stateNode);
    if (!props) {
        // Work in progress.
        return null;
    }
    const listener = props[registrationName];
    if (shouldPreventMouseEvent(registrationName, inst.type, props)) {
        return null;
    }
    return listener;
};

/**
 *
 * @return {*} An accumulation of synthetic events.
 * @description * 등록된 플러그인이 최상위에서 이벤트를 추출할 수 있는 기회를 제공합니다.
 */
const extractPluginEvents = (topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags) => {
    let events = null;
    for (let i = 0; i < plugins.length; i++) {
        const possiblePlugin = plugins[i];
        if (possiblePlugin) {
            const extractedEvents = possiblePlugin.extractEvents(
                topLevelType,
                targetInst,
                nativeEvent,
                nativeEventTarget,
                eventSystemFlags
            );
            if (extractedEvents) {
                events = accumulateInto(events, extractedEvents);
            }
        }
    }
    return events;
};

/**
 *
 * @param {*} topLevelType
 * @param {*} targetInst
 * @param {*} nativeEvent
 * @param {*} nativeEventTarget
 * @param {*} eventSystemFlags
 * @description * extractPluginEvents를 실행하고 이벤트를 일괄 처리합니다.
 * 이벤트를 추출하고 일괄 처리합니다.
 */
export const runExtractedPluginEventsInBatch = (
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags
) => {
    const events = extractPluginEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags);
    runEventsInBatch(events);
};
