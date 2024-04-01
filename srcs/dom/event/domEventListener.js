/**
 * @description: 리액트는 commit중에는 이벤트 관련된 시스템을 끄는데 그것을 관리하는 변수입니다.
 */
export let _enabled = true;

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
 * @param {THostInstance|THostContainer} element @see 파일경로: type/THostType.js
 * @param {TDOMTopLevelType} topLevelType @see 파일경로: type/TDOMTopLevelType.js TODO: TDOMTopLevelType.js파일 생성
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
    //TODO: getEventPriority구현
    //NOTE: topLevelType에 따라서 이벤트의 우선순위를 결정하고 그거에 맞는 디스패치 함수를 이벤트 핸들러로 등록합니다.
    switch (getEventPriority(topLevelType)) {
        //TODO: DiscreteEvent, UserBlockingEvent, ContinuousEvent에 대한 이벤트 디스패치 함수 구현
        case DiscreteEvent:
            //TODO: dispatchDiscreteEvent구현
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

    //TODO: getRawEventName구현
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
 * @param {TDOMTopLevelType} topLevelType @see 파일경로: type/TDOMTopLevelType.js TODO: TDOMTopLevelType.js파일 생성
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
 * @param {TDOMTopLevelType} topLevelType @see 파일경로: type/TDOMTopLevelType.js TODO: TDOMTopLevelType.js파일 생성
 * @param {THostInstance|THostContainer} element @see 파일경로: type/THostType.js
 * @description 캡쳐되는 이벤트를 trap(인터럽트)하도록 이벤트를 설정하는 함수입니다.
 * @description 기본적으로 스크롤과 관련된 버블되지 않는 이벤트들을 이벤트 위임으로 다루기 위해 사용되거나
 * @description 캡쳐링 이벤트를 처리하기 위해 사용됩니다.
 */
export const trapCapturedEvent = (topLevelType, element) => {
    trapEventForPluginEventSystem(element, topLevelType, true);
};
