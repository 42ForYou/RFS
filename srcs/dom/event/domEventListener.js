import { DiscreteEvent, UserBlockingEvent, ContinuousEvent } from "../../const/CEventPriority.js";
import SimpleEventPlugin from "../event/EventPlugin/simpleEventPlugin.js";
import { getRawEventName } from "./domTopLevelEventType.js";
import { getEventTarget } from "./getEventTarget.js";
import { PLUGIN_EVENT_SYSTEM } from "../../const/CEventSystemFlags.js";
import * as Scheduler from "../../scheduler/schedulerImpl.js";
import { getClosestInstanceFromNode } from "../../dom/core/domComponentConnection.js";
import { getNearestMountedFiber } from "../../Reconciler/fiberTreeReflection.js";
const { UserBlockingPriorityImpl: UserBlockingPriority, runWithPriorityImpl: runWithPriority } = Scheduler;
import { HostComponent, HostRoot, HostText } from "../../const/CWorkTag.js";
const { getEventPriority } = SimpleEventPlugin;
import { batchedEventUpdates, flushDiscreteUpdatesIfNeeded } from "./genericBatching.js";
import {
    clearIfContinuousEvent,
    hasQueuedDiscreteEvents,
    isReplayableDiscreteEvent,
    queueDiscreteEvent,
} from "./domEventReplaying.js";
import { runExtractedPluginEventsInBatch } from "./eventPluginHub.js";
const CALLBACK_BOOKKEEPING_POOL_SIZE = 10;
const callbackBookKeepingPool = [];
/**
 * @description: 리액트는 commit중에는 이벤트 관련된 시스템을 끄는데 그것을 관리하는 변수입니다.
 */
export let _enabled = true;

//NOTE:!!!
// ReactBrowserEventEmitter: 문서 전체에 대한 최상위 이벤트 리스너를 첨부하는 데 사용됩니다. 예를 들어, 특정 ID에 onClick 이벤트 리스너를 등록하는 경우 등에 사용됩니다. 이벤트 시스템의 작동 방식을 이해하는 데 중요한 참조 점을 제공합니다.
// ReactEventListener: 최상위에서 이벤트를 캡처하며, 스크롤 값 모니터링, 버블링 및 캡처된 이벤트를 함정하는 메소드를 제공합니다.
// EventPluginHub: 이벤트 플러그인이 설치 및 구성될 수 있는 통합 인터페이스를 제공합니다. 이벤트를 추출하고, 큐에 넣고, 이벤트 큐를 처리하는 메소드를 포함합니다.
// 이벤트 플러그인
// SimpleEventPlugin: 네이티브 이벤트를 적절한 합성 이벤트로 변환합니다. 특정 브라우저 이벤트에 대한 처리를 담당합니다.
// ResponderEventPlugin: 제스처 응답자 시스템의 기반이 됩니다. 터치 이벤트의 복잡한 상호작용을 처리할 수 있습니다.
// TapEventPlugin: 터치가 탭으로 간주될 수 있는지 여부를 결정합니다. 거리(픽셀 단위)를 기준으로 판단합니다.
// EnterLeaveEventPlugin: mouseenter 및 mouseleave 이벤트를 정규화합니다. 윈도우 밖으로 마우스가 이동했다가 돌아올 때 특히 중요합니다.
// ChangeEventPlugin: 폼 요소에 걸쳐 변경 이벤트를 정규화하는 onChange 이벤트를 생성합니다.
// SelectEventPlugin: 폼 요소에 걸쳐 선택 이벤트를 정규화하는 onSelect 이벤트를 생성합니다.
// BeforeInputEventPlugin: onBeforeInput 이벤트를 생성하여 W3C 명세와 일치시킵니다. Chrome, Safari, Opera, IE에서 사용 가능한 네이티브 textInput 이벤트를 기반으로 합니다.
// 핵심 개념
// handleTopLevel: 최상위에서 발생한 이벤트를 EventPluginHub로 스트리밍하여, 플러그인이 ReactEvents를 생성하고 디스패치할 기회를 제공합니다.
// 이벤트 버블링과 캡처링: 리액트는 네이티브 DOM 이벤트의 버블링과 캡처링 메커니즘을 모방하여, 적절한 이벤트 처리 순서를 구현합니다.
// 제어 컴포넌트: 폼 요소의 상태를 리액트의 상태를 통해 제어하는 컴포넌트입니다. 이벤트 처리를 통해 상태 업데이트가 필요할 때 중요합니다.
// 리액트의 이벤트 시스템은 다양한 이벤트 플러그인과 함께 복잡한 상호작용을 처리할 수 있는 유연성을 제공합니다. 이 시스템을 통해 리액트는 DOM 이벤트를 효과적으로 추상화하고, 애플리케이션의 이벤트 처리 로직을 쉽게 구성할 수 있습니다.
//NOTE:

/**
 *
 * @param {boolean} enabled
 * * @description: 이벤트 관련된 시스템을 키고 끄는데 사용되는 함수입니다..
 */
export const setEnabled = (enabled) => {
    _enabled = !!enabled;
};

/**
 *
 * @returns {boolean}
 * @description: 이벤트 관련된 시스템이 켜져있는지 꺼져있는지를 확인하는 함수입니다.
 */
export const isEnabled = () => {
    return _enabled;
};

/**
 *
 * @param {THostInstance|THostContainer} element @see 파일경로: type/THostType.js
 * @param {string} eventType
 * @param {lambda} listener
 * @description: 실제 host환경에 이벤트 핸들러를 등록하는 함수입니다. (버블링 이벤트)
 */
export const addEventBubbleListener = (element, eventType, listener) => {
    element.addEventListener(eventType, listener, false);
};
/**
 *
 * @param {THostInstance|THostContainer} element @see 파일경로: type/THostType.js
 * @param {string} eventType
 * @param {lambda} listener
 * @description: 실제 host환경에 이벤트 핸들러를 등록하는 함수입니다. (캡쳐링 이벤트)
 */
export const addEventCaptureListener = (element, eventType, listener) => {
    element.addEventListener(eventType, listener, true);
};

/**
 *
 * @param {TTOPLevelType} topLevelType
 * @param {*} nativeEvent
 * @param {TFiber} targetInst
 * @param {*} eventSystemFlags
 * @returns {object}
 * @description: 이벤트를 디스패치할 때 사용되는 콜백북키퍼를 가져오는 함수입니다.-> 인자로 받은 친구를 넣어서 재사용합니다.
 */
const getTopLevelCallbackBookKeeping = (topLevelType, nativeEvent, targetInst, eventSystemFlags) => {
    if (callbackBookKeepingPool.length) {
        const instance = callbackBookKeepingPool.pop();
        instance.topLevelType = topLevelType;
        instance.eventSystemFlags = eventSystemFlags;
        instance.nativeEvent = nativeEvent;
        instance.targetInst = targetInst;
        return instance;
    }
    return {
        topLevelType,
        eventSystemFlags,
        nativeEvent,
        targetInst,
        //bubble path를 따라가면서 이벤트를 디스패치할 때 사용되는 변수->조상들도 디스패치를 해야하기 때문에 사용됩니다.
        //여기서 조상이란 보통 hostRoot를 의미합니다.
        ancestors: [],
    };
};

/**
 *
 * @param {TFiber} inst
 * @returns {THostContainer|null}
 * @description: inst의 조상중에서 가장 가까운 hostRoot를 찾아서 반환하는 함수입니다.
 */
const findRootContainerNode = (inst) => {
    if (inst.tag === HostRoot) {
        return inst.stateNode.containerInfo;
    }
    while (inst.return) {
        inst = inst.return;
    }
    if (inst.tag === HostRoot) {
        return inst.stateNode.containerInfo;
    }
    return null;
};

/**
 *
 * @param {} bookKeeping
 * @description topLevel에서 이벤트를 처리하는 함수입니다.
 */
const handleTopLevel = (bookKeeping) => {
    const targetInst = bookKeeping.targetInst;
    let ancestorInst = targetInst;
    do {
        if (!ancestorInst) {
            const ancestors = bookKeeping.ancestors;
            ancestors.push(ancestorInst);
            break;
        }
        const root = findRootContainerNode(ancestorInst);
        if (!root) {
            break;
        }
        const tag = ancestorInst.tag;
        if (tag === HostComponent || tag === HostText) {
            bookKeeping.ancestors.push(ancestorInst);
        }
        //포탈을 이나 서버사이드렌더, 등을 위한 것으로 보임 여러 조상을 찾는것으로 보임.
        ancestorInst = getClosestInstanceFromNode(root);
    } while (ancestorInst);
    for (let i = 0; i < bookKeeping.ancestors.length; i++) {
        const ancestorInst = bookKeeping.ancestors[i];
        const eventTarget = getEventTarget(bookKeeping.nativeEvent);
        const topLevelType = bookKeeping.topLevelType;
        const nativeEvent = bookKeeping.nativeEvent;
        runExtractedPluginEventsInBatch;
        runExtractedPluginEventsInBatch(
            topLevelType,
            nativeEvent,
            eventTarget,
            ancestorInst,
            bookKeeping.eventSystemFlags
        );
    }
};

/**
 *
 * @param {*} instance
 * @description: 콜백북키퍼의 pool에 해releaseTopLevelCallbackBookKeeping당 인스턴스를 반환하는 함수입니다.
 */
const releaseTopLevelCallbackBookKeeping = (instance) => {
    instance.topLevelType = null;
    instance.nativeEvent;
    instance.targetInst = null;
    instance.ancestors.length = 0;
    if (callbackBookKeepingPool.length < CALLBACK_BOOKKEEPING_POOL_SIZE) {
        callbackBookKeepingPool.push(instance);
    }
};
/**
 *
 * @param {TTOPLevelType} topLevelType
 * @param {TEventSystemFlags} eventSystemFlags
 * @param {*} nativeEvent
 * @param {*} targetInst
 * @description: 이벤트를 디스패치하는 함수입니다.
 * @description 실행부분을 하는 함수 입니다. 사용을 하고 나서는 releaseTopLevelCallbackBookKeeping를 사용하여 인스턴스를 반환해야합니다.
 */
const dispatchEventForPluginEventSystem = (topLevelType, eventSystemFlags, nativeEvent, targetInst) => {
    const bookKeeping = getTopLevelCallbackBookKeeping(topLevelType, nativeEvent, targetInst, eventSystemFlags);
    try {
        //handleTopLevel을 bookKeepping을 인자로하여 batchedEventUpdates로 실행합니다.
        batchedEventUpdates(handleTopLevel, bookKeeping);
    } finally {
        releaseTopLevelCallbackBookKeeping(bookKeeping);
    }
};
/**
 *
 * @param {TTOPLevelType} topLevelType
 * @param {TEventSystemFlags} eventSystemFlags @see CEventSystemFlags.js
 * @param {*} nativeEvent
 * @description: 이벤트를 디스패치하는 함수입니다.(시도해보는)
 */
export const attemptToDispatchEvent = (topLevelType, eventSystemFlags, nativeEvent) => {
    //이벤트의 타겟을 가져옵니다.
    const nativeEventTarget = getEventTarget(nativeEvent);
    //이벤트와 관련된 가장 가까운 인스턴스를 가져옵니다.
    let targetInst = getClosestInstanceFromNode(nativeEventTarget);

    if (targetInst !== null) {
        //마운트된 가장 가까운 파이버를 가져옵니다.
        const nearestMounted = getNearestMountedFiber(targetInst);
        if (nearestMounted === null) {
            //이 트리는 이미 언마운트 되었습니다.->타겟없이 디스패치함.
            targetInst = null;
        } else {
            const tag = nearestMounted.tag;
            if (tag === HostRoot) {
                targetInst = null;
            } else if (nearestMounted !== targetInst) {
                //mounted된 인스턴스가 타겟인스턴스와 다르다면 타겟 인스턴스는 아직 마운트되지 않았습니다.
                targetInst = null;
            }
        }
    }

    dispatchEventForPluginEventSystem(topLevelType, eventSystemFlags, nativeEvent, targetInst);
};
/**
 *
 * @param {TTOPLevelType} topLevelType
 * @param {TEventSystemFlags} eventSystemFlags @see CEventSystemFlags.js
 * @param {*} nativeEvent
 * @description: rfs내부 이벤트 시스템 안에서 이벤트를 디스패치하는 함수입니다.
 */
export const dispatchEvent = (topLevelType, eventSystemFlags, nativeEvent) => {
    //만약 이벤트 시스템이 꺼져있다면 아무것도 하지 않습니다.
    if (!_enabled) {
        return;
    }
    if (hasQueuedDiscreteEvents() && isReplayableDiscreteEvent(topLevelType)) {
        // 이미 개별 이벤트의 대기열이 있고 이것이 또 다른 개별(재생가능한)
        // 이벤트인 경우, 대상에 관계없이 디스패치할 수 없습니다.->이말은 바로 이친구만 따로 실행을 할 순 없다라는말.
        // 순서대로 디스패치해야 하기 때문입니다.
        //discreteEvent를 큐에 넣습니다.
        queueDiscreteEvent(topLevelType, eventSystemFlags, nativeEvent);
        return;
    }

    //이벤트를 디스패치를 시도합니다.
    attemptToDispatchEvent(topLevelType, eventSystemFlags, nativeEvent);
    clearIfContinuousEvent(topLevelType, nativeEvent);
};

/**
 *
 * @param {*} topLevelType
 * @param {*} eventSystemFlags
 * @param {*} nativeEvent
 * @description dispatchEventfmf userBlocking 우선순위로 디스패치하는 함수입니다.
 */
const dispatchUserBlockingUpdate = (topLevelType, eventSystemFlags, nativeEvent) => {
    runWithPriority(UserBlockingPriority, dispatchEvent.bind(null, topLevelType, eventSystemFlags, nativeEvent));
};

/**
 *
 * @param {*} topLevelType
 * @param {*} eventSystemFlags
 * @param {*} nativeEvent
 * @description 이산 이벤트를 디스패치하는 함수입니다.
 */
const dispatchDiscreteEvent = (topLevelType, eventSystemFlags, nativeEvent) => {
    flushDiscreteUpdatesIfNeeded(nativeEvent.timeStamp);
    dispatchEvent(topLevelType, eventSystemFlags, nativeEvent);
};
/**
 *
 * @param {THostInstance|THostContainer} element @see 파일경로: type/THostType.js
 * @param {TDOMTopLevelType} topLevelType
 * @param {boolean} capture로 사용되는지 여부를 확인하는 변수입니다.
 * @description eventHandler를 등록하는데 내부적으로 rfs에서 관리되는 이벤트 시스템을 사용합니다.
 * @description DiscreteEvent, UserBlockingEvent, ContinuousEvent로 나누어서 이벤트를 관리합니다.
 * @description 이산 이벤트는 사용자의 직접적인 상호작용에 응답해야 하는 이벤트이며,
 * @description 예를 들어, 클릭(onClick), 키 입력(onKeyPress) 등이 여기에 해당한다.
 * @description 사용자의 행동에 대한 즉각적인 피드백이 필요하기 때문에 가장 높은 우선 순위를 갖는* @description
 * @description UserBlockingEvent (사용자 차단 이벤트)는 우선 순위가 1이다.
 * @description 사용자 차단 이벤트는 애플리케이션의 반응성을 유지하기 위해 신속하게 처리되어야 하지만,
 * @description  이산 이벤트만큼 즉각적인 반응을 요구하지 않는 이벤트이다. 예를 들어, 입력 필드에서의 텍스트 입력과 같이 사용자가 연속적인 행동을 취할 때 발생하는 이벤트가 이에 해당할 수 있* @description
 * @description ContinuousEvent (연속 이벤트)는 우선 순위가 2로 가장 낮다.
 * @description  연속 이벤트는 사용자와의 상호작용 중 연속적으로 발생할 수 있는 이벤트이며, 예를 들어, 스크롤(onScroll), 마우스 이동(onMouseMove), 윈도우 리사이징(onResize) 등이 여기에 해당한다. 이러한 이벤트는 애플리케이션의 성능에 영향을 미칠 수 있으므로, 필요에 따라 업데이트 빈도를 조절하여 처리된다.
 * @description 이러한 이벤트종류를 디스패치 하는 각각의 함수를 listner로 하여 이벤트핸들러로 등록합니다.
 * @description 여기서 디스패치란 내부적으로 관리되는 이벤트 시스템에 이벤트가 관리 되는 것을 의미합니다.
 */
const trapEventForPluginEventSystem = (element, topLevelType, capture) => {
    let listener;
    //NOTE: topLevelType에 따라서 이벤트의 우선순위를 결정하고 그거에 맞는 디스패치 함수를 이벤트 핸들러로 등록합니다.
    switch (getEventPriority(topLevelType)) {
        case DiscreteEvent:
            listener = dispatchDiscreteEvent.bind(null, topLevelType, PLUGIN_EVENT_SYSTEM);
            break;
        case UserBlockingEvent:
            listener = dispatchUserBlockingUpdate.bind(null, topLevelType, PLUGIN_EVENT_SYSTEM);
            break;
        case ContinuousEvent:
        default:
            listener = dispatchEvent.bind(null, topLevelType, PLUGIN_EVENT_SYSTEM);
            break;
    }

    //topLevelType으로 부터 실제 이벤트 타입을 가져옵니다.
    const rawEventName = getRawEventName(topLevelType);
    if (capture) {
        addEventCaptureListener(element, rawEventName, listener);
    } else {
        addEventBubbleListener(element, rawEventName, listener);
    }
};
/**
 *
 * @param {TDOMTopLevelType} topLevelType
 * @param {THostInstance|THostContainer} element @see 파일경로: type/THostType.js
 * @description 버블 되는 이벤트를 trap(인터럽트)하도록 이벤트를 설정하는 함수입니다.
 * @description 이벤트 위임에서는 element가 document로 들어와서 위임에 사용되고
 * @description 해당부분에 직접적으로 넣어야되는 이벤트들은 해당 element로 들어옵니다.
 */
export const trapBubbledEvent = (topLevelType, element) => {
    trapEventForPluginEventSystem(element, topLevelType, false);
};
/**
 *
 * @param {TDOMTopLevelType} topLevelType
 * @param {THostInstance|THostContainer} element @see 파일경로: type/THostType.js
 * @description 캡쳐되는 이벤트를 trap(인터럽트)하도록 이벤트를 설정하는 함수입니다.
 * @description 기본적으로 스크롤과 관련된 버블되지 않는 이벤트들을 이벤트 위임으로 다루기 위해 사용되거나
 * @description 캡쳐링 이벤트를 처리하기 위해 사용됩니다.
 */
export const trapCapturedEvent = (topLevelType, element) => {
    trapEventForPluginEventSystem(element, topLevelType, true);
};
