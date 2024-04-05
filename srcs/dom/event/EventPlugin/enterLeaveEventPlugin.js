import { TOP_MOUSE_OUT, TOP_MOUSE_OVER, TOP_POINTER_OUT, TOP_POINTER_OVER } from "../domTopLevelEventType.js";
import { IS_REPLAYED } from "../../../const/CEventSystemFlags.js";
import SyntheticMouseEvent from "../SyntheticEvent/syntheticMouseEvent.js";
import SyntheticPointerEvent from "../SyntheticEvent/syntheticPointerEvent";
import { getClosestInstanceFromNode, getNodeFromInstance } from "../../core/domComponentConnection.js";
import { HostComponent, HostText } from "../../../const/CWorkTag.js";
import { getNearestMountedFiber } from "../../../Reconciler/fiberTreeReflection.js";

// EnterLeaveEventPlugin: 컴포넌트 간의 마우스 진입(enter) 및 떠남(leave) 이벤트를 처리합니다.
const eventTypes = {
    //RegisterationName과 TopLevelType을 dependincies를 통해 연결합니다.
    mouseEnter: {
        registrationName: "onMouseEnter",
        dependencies: [TOP_MOUSE_OUT, TOP_MOUSE_OVER],
    },
    mouseLeave: {
        registrationName: "onMouseLeave",
        dependencies: [TOP_MOUSE_OUT, TOP_MOUSE_OVER],
    },
    pointerEnter: {
        registrationName: "onPointerEnter",
        dependencies: [TOP_POINTER_OUT, TOP_POINTER_OVER],
    },
    pointerLeave: {
        registrationName: "onPointerLeave",
        dependencies: [TOP_POINTER_OUT, TOP_POINTER_OVER],
    },
};

// 마지막 네이티브 이벤트를 추적하여 동일한 네이티브 이벤트를 여러 번 처리할 때
// 동일한 네이티브 이벤트를 여러 번 처리하는 경우를 대비합니다,
// 조상이 여러 개 있을 때 발생할 수 있습니다.
// 중복 입력하지 않도록 합니다.
let lastNativeEvent;

const EnterLeaveEventPlugin = {
    eventTypes: eventTypes,

    /**
     *
     * @param {TTOPLevelType} topLevelType
     * @param {TFiber} targetInst
     * @param {*} nativeEvent
     * @param {*} nativeEventTarget
     * @param {*} eventSystemFlags
     * @returns {rfsSyntheticEvent[]}
     * @description EnterLeaveEventPlugin: 컴포넌트 간의 마우스 진입(enter) 및 떠남(leave) 이벤트를 처리합니다.
     * @description 해당 플러그인에서 합성 이벤트를 추출합니다.
     * @description 우리가 신경 쓰는 거의 모든 상호작용에는 최상위 레벨의
     * @description 마우스 오버`와 `마우스 아웃` 이벤트가 발생합니다. 중복 이벤트를 추출하지 않도록 `mouseout`만 사용하세요.
     * @description 중복 이벤트를 추출하지 않도록 합니다. 그러나 외부에서 브라우저로 마우스를 이동하면
     * @description 외부에서 브라우저로 마우스를 이동하면 `mouseout` 이벤트가 발생하지 않습니다. 이 경우, 우리는
     * @description 마우스 오버` 최상위 이벤트를 사용합니다.
     */
    //NOTE:
    //  중복 이벤트 추출 방지
    // 일반적으로 마우스 오버(mouseover)와 마우스 아웃(mouseout) 이벤트는 상호 보완적인 이벤트 쌍이다.
    // mouseover 이벤트는 마우스 포인터가 요소 경계 안으로 들어올 때 발생하고, mouseout 이벤트는 마우스 포인터가 요소 경계를 벗어날 때 발생. 그러나 이러한 이벤트들은 특정 상황에서 중복되어 발생할 수 있으며, 이를 효율적으로 관리하고 싶은것이 EnterLeaveEventPlugin의 목적이다.

    // rfs의 EnterLeaveEventPlugin은 이 문제를 해결하기 위해 주로 mouseout 이벤트를 사용하여 이벤트 중복을 최소화함. 즉, 요소 간에 마우스 포인터가 이동할 때 발생할 수 있는 여러 mouseover 및 mouseout 이벤트 중에서 mouseout 이벤트만을 사용하여 마우스 이동을 추적합니다.

    // 마우스가 외부에서 브라우저로 이동하는 경우->특수케이스:
    // 그러나 마우스 포인터가 웹 페이지의 외부에서 페이지 내로 이동하는 경우에는 mouseout 이벤트가 발생하지 않습니다. 이는 mouseout 이벤트가 요소의 경계를 벗어날 때만 발생하기 때문입니다. 이 경우에는 mouseover 이벤트를 사용하여 마우스 포인터의 진입을 감지. 이렇게 함으로써, rfs는 마우스 포인터가 페이지의 외부에서 내부로 이동할 때도 적절히 반응할 수 있다.
    // 요약: EnterLeaveEventPlugin은 마우스 진입과 떠남 이벤트를 효과적으로 처리하기 위해 mouseout 이벤트를 주로 사용하되, 마우스 포인터가 페이지 외부에서 내부로 이동하는 경우에는 mouseover 이벤트를 사용. 이는 이벤트 처리의 중복을 줄이고, 마우스 이동에 대한 정확한 반응을 보장하기 위한 방법.
    extractEvents: (topLevelType, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags) => {
        const isOverEvent = topLevelType === TOP_MOUSE_OVER || topLevelType === TOP_POINTER_OVER;
        const isOutEvent = topLevelType === TOP_MOUSE_OUT || topLevelType === TOP_POINTER_OUT;

        //NOTE: 주로 중복방지를 위해 mouseout 이벤트만 사용
        if (
            isOverEvent &&
            (eventSystemFlags & IS_REPLAYED) === 0 &&
            (nativeEvent.relatedTarget || nativeEvent.fromElement)
        ) {
            //마우스오버 이벤트이고
            //재생되지 않은 이벤트이고, relatedTarget이나 fromElement가 있는 경우
            //이미 다른 대상의 mouseout 이벤트에서 이벤트를 발송했습니다.
            return null;
        }

        if (!isOutEvent && !isOverEvent) {
            // 마우스 진입 또는 떠남 이벤트가 아닙니다.
            return null;
        }

        //이 부분은 이벤트가 발생한 대상의 윈도우 객체를 결정합니다. 이벤트 대상이 윈도우 객체일 수도 있고, 특정 DOM 요소일 수도 있습니다.
        let win;
        if (nativeEventTarget.window === nativeEventTarget) {
            // `nativeEventTarget` is probably a window object.
            win = nativeEventTarget;
        } else {
            const doc = nativeEventTarget.ownerDocument;
            if (doc) {
                win = doc.defaultView || doc.parentWindow;
            } else {
                win = window;
            }
        }

        //from과 to를 결정합니다.
        let from;
        let to;
        if (isOutEvent) {
            // 마우스/포인터가 요소를 떠날 때(isOutEvent), from은 이벤트가 발생한 요소(targetInst)로, to는 마우스가 이동한 대상으로 설정됩니다.

            //이벤트가 발생한요소: targetInst->즉 이벤트의 출발지
            from = targetInst;

            //nativeEvent.relatedTarget이 To
            const related = nativeEvent.relatedTarget || nativeEvent.toElement;
            to = related ? getClosestInstanceFromNode(related) : null;
            if (to !== null) {
                //To검사
                const nearestMounted = getNearestMountedFiber(to);
                if (to !== nearestMounted || (to.tag !== HostComponent && to.tag !== HostText)) {
                    to = null;
                }
            }
        } else {
            // 해당 로직은 마우스 또는 포인터가 윈도우 외부에서 현재 요소(targetInst)로 이동하는 경우
            from = null;
            to = targetInst;
        }

        if (from === to) {
            // 처리할 필요가 없음.
            return null;
        }

        let eventInterface, leaveEventType, enterEventType, eventTypePrefix;

        if (topLevelType === TOP_MOUSE_OUT || topLevelType === TOP_MOUSE_OVER) {
            eventInterface = SyntheticMouseEvent;
            leaveEventType = eventTypes.mouseLeave;
            enterEventType = eventTypes.mouseEnter;
            eventTypePrefix = "mouse";
        } else if (topLevelType === TOP_POINTER_OUT || topLevelType === TOP_POINTER_OVER) {
            eventInterface = SyntheticPointerEvent;
            leaveEventType = eventTypes.pointerLeave;
            enterEventType = eventTypes.pointerEnter;
            eventTypePrefix = "pointer";
        }

        const fromNode = from === null ? win : getNodeFromInstance(from);
        const toNode = to === null ? win : getNodeFromInstance(to);

        const leave = eventInterface.getPooled(leaveEventType, from, nativeEvent, nativeEventTarget);
        //type은 nativeEvent의 type로 관리합니다.
        leave.type = eventTypePrefix + "leave";
        leave.target = fromNode;
        leave.relatedTarget = toNode;

        const enter = eventInterface.getPooled(enterEventType, to, nativeEvent, nativeEventTarget);
        //type은 nativeEvent의 type으로 관리합니다.
        enter.type = eventTypePrefix + "enter";
        enter.target = toNode;
        enter.relatedTarget = fromNode;

        //TODO: accumulateEnterLeaveDispatches
        //요소를 떠나는 이벤트(leave)와 요소로 진입하는 이벤트(enter)를 관리하고, 적절한 순서로 이벤트를 디스패치하기 위한 준비
        accumulateEnterLeaveDispatches(leave, enter, from, to);

        //같은 원본 이벤트(nativeEvent)가 이미 처리되었다면(즉, nativeEvent가 lastNativeEvent와 동일하다면), 이후의 enter 이벤트는 무시하고
        // leave 이벤트만을 반환
        //이는 마우스 또는 포인터가 빠르게 여러 요소를 거치며 이동할 때, 불필요한 이벤트 처리를 최소화하기 위함
        if (nativeEvent === lastNativeEvent) {
            lastNativeEvent = null;
            return [leave];
        }
        lastNativeEvent = nativeEvent;

        //떠남과 진입 이벤트를 같이 반환합니다.
        return [leave, enter];
    },
};

export default EnterLeaveEventPlugin;
