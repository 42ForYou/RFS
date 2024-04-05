// eventPluginUtils는 rfs 이벤트 시스템의 핵심 부분으로, 이벤트를 처리하고, 디스패치하며, 이벤트 리스너들을 관리하는 데 필요한 유틸리티 함수들을 제공합니다. 이 모듈은 rfs가 자체적인 이벤트 핸들링 로직을 구현하는 데 사용되며, 네이티브 DOM 이벤트를 rfs의 합성 이벤트(SyntheticEvent)로 추상화하고, 이벤트 리스너를 이벤트에 효율적으로 연결하고 실행하는 메커니즘을 제공합니다.

// 주요 기능과 구성요소:

// 컴포넌트 트리 설정 (setComponentTree):
// rfs의 내부 인스턴스와 DOM 노드 간의 매핑을 설정합니다. 이는 이벤트 핸들러를 올바른 컴포넌트에 연결하는 데 필수적입니다.

// 이벤트 실행 (executeDispatch):
// 주어진 이벤트 리스너를 실행합니다. 이 과정에서 현재 이벤트의 대상 컴포넌트 인스턴스를 기반으로 currentTarget을 설정합니다.

// 순차적 이벤트 실행 (executeDispatchesInOrder):
// 이벤트 리스너들을 순차적으로 실행합니다. 이는 버블링이나 캡처링 단계에서 여러 리스너가 등록된 경우에 사용됩니다.

// 조건부 순차적 이벤트 실행 (executeDispatchesInOrderStopAtTrue):
// 리스너를 순차적으로 실행하되, 어떤 리스너가 true를 반환하면 나머지 실행을 중단합니다. 이는 특정 조건을 만족하는 첫 번째 리스너를 찾는 데 사용됩니다.

// 직접적 이벤트 실행 (executeDirectDispatch):
// 단일 리스너에 대해 이벤트를 직접 실행합니다. 이는 event 객체가 단일 디스패치만 가질 경우에 사용됩니다.

// 이벤트 디스패치 여부 확인 (hasDispatches):
// 주어진 이벤트에 디스패치(리스너)가 존재하는지 여부를 확인합니다.
export let getFiberCurrentPropsFromNode = null;
export let getInstanceFromNode = null;
export let getNodeFromInstance = null;

/**
 *
 * @param {*} getFiberCurrentPropsFromNodeImpl
 * @param {*} getInstanceFromNodeImpl
 * @param {*} getNodeFromInstanceImpl
 * @description 이벤트 핸들러를 올바른 컴포넌트에 연결하는 데 필요한 컴포넌트 트리를 설정합니다.
 */
export const setComponentTree = (
    getFiberCurrentPropsFromNodeImpl,
    getInstanceFromNodeImpl,
    getNodeFromInstanceImpl
) => {
    getFiberCurrentPropsFromNode = getFiberCurrentPropsFromNodeImpl;
    getInstanceFromNode = getInstanceFromNodeImpl;
    getNodeFromInstance = getNodeFromInstanceImpl;
};

/**
 *
 * @param {*} event
 * @param {*} listener
 * @param {*} inst
 * @description 이벤트를 리스너에 디스패치합니다. - 이벤트 리스너를 실행하고, currentTarget을 설정하고, 에러를 처리합니다.
 */
export const executeDispatch = (event, listener, inst) => {
    const type = event.type || "unknown-event";
    event.currentTarget = getNodeFromInstance(inst);

    try {
        // 이벤트 리스너 직접 호출
        listener(event);
    } catch (error) {
        // 에러 처리 로직
        // 예: 콘솔에 에러 로깅, 에러를 상위로 전파, 에러 리포팅 서비스에 기록 등
        console.error(error);
        throw error instanceof Error ? error : new Error(error);
    } finally {
        // 이벤트 처리 후에는 currentTarget을 null로 재설정
        event.currentTarget = null;
    }
};

/**
 *
 * @param {*} event
 * @description 이벤트를 순차적으로 실행합니다. - 이벤트 리스너들을 순차적으로 실행하고, 이벤트를 초기화합니다.
 */
export const executeDispatchesInOrder = (event) => {
    //propagator에서 설정한 리스너와 인스턴스를 가져옴
    const dispatchListeners = event._dispatchListeners;
    const dispatchInstances = event._dispatchInstances;

    if (Array.isArray(dispatchListeners)) {
        for (let i = 0; i < dispatchListeners.length; i++) {
            if (event.isPropagationStopped()) {
                break;
            }
            executeDispatch(event, dispatchListeners[i], dispatchInstances[i]);
        }
    } else if (dispatchListeners) {
        executeDispatch(event, dispatchListeners, dispatchInstances);
    }
    event._dispatchListeners = null;
    event._dispatchInstances = null;
};

/**
 *
 * @param {*} event
 * @returns {boolean}
 * @description 주어진 이벤트에 디스패치(리스너)가 존재하는지 여부를 확인합니다.
 */
export const hasDispatches = (event) => {
    return !!event._dispatchListeners;
};
