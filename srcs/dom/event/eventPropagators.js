import { traverseTwoPhase, traverseEnterLeave } from "./rfsTreeTraversal.js";
import { getListener } from "./eventPluginHub.js";
import accumulateInto from "./accumulateInto.js";
import forEachAccumulated from "./forEachAccumulated.js";

/**
/**
 * @description * 이벤트 리스너를 가져옵니다.
 * 일부 이벤트 유형에는 전파 단계에 따라 등록 이름이 다른 개념이 있습니다.
 * 전파의 "단계"에 대한 등록 이름이 다릅니다. 이것은 주어진 단계별로 리스너를 찾습니다.
 */
const listenerAtPhase = (inst, event, propagationPhase) => {
    const registrationName = event.dispatchConfig.phasedRegistrationNames[propagationPhase];
    return getListener(inst, registrationName);
};

/**
 * @description
 * 전파 패턴의 작은 집합으로, 각 패턴은 소량의 정보를 받아들이고
 * 소량의 정보를 받아들이고 "디스패치 준비 이벤트 객체" 집합을 생성합니다.
 * 이미 파견된 이벤트 집합으로 주석을 단 이벤트 집합입니다.
 * 리스너 함수/ID가 이미 주석 처리된 이벤트 세트입니다. API는 이러한 방식으로 설계되어 실제로는 이러한
 * 전파 전략이 실제로 디스패치를 실행하지 못하도록 설계되었습니다.
 * 항상 하나의 디스패치를 실행하기 전에 전체 디스패치 집합을 수집하고 싶기 때문입니다.
 * 하나의 디스패치를 실행하기 전에
 * 디스패치된 리스너로 `SyntheticEvent`에 태그를 지정합니다. 이 함수를 만들면
 * 를 생성하면 각 이벤트에 대해 바인딩하거나 함수를 만들 필요가 없습니다.
 * 이벤트의 멤버를 변경하면 래핑을 생성할 필요가 없습니다.
 * 이벤트를 리스너와 쌍을 이루는 "dispatch" 객체를 만들 필요가 없습니다.
 */
const accumulateDirectionalDispatches = (inst, phase, event) => {
    const listener = listenerAtPhase(inst, event, phase);
    if (listener) {
        event._dispatchListeners = accumulateInto(event._dispatchListeners, listener);
        event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
    }
};

/**
 *
 * @description /**
 * 디스패치 수집(디스패치 전에 완전히 수집해야 함 - 단위
 * 테스트 참조). 메모리를 절약하기 위해 배열을 느리게 할당합니다.  각 이벤트를
 * 각 이벤트를 반복하고 각 이벤트에 대해 트래버스를 수행해야 합니다. 전체 이벤트에 대해
 * 전체 이벤트 컬렉션에 대해 단일 트래버스를 수행할 수 없습니다.
 * 다른 대상을 가질 수 있기 때문입니다.
 */
const accumulateTwoPhaseDispatchesSingle = (event) => {
    if (event && event.dispatchConfig.phasedRegistrationNames) {
        traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event);
    }
};

/**
 * @description
 *  * 방향에 관계없이 누적되며 단계적으로 찾지 않습니다.
 * 등록 이름을 찾지 않습니다. accumulateDirectDispatchesSingle`과 동일하지만 다음 사항은 제외됩니다.
 * 디스패치 마커`가 디스패치된 ID와 동일해야 합니다.
 */
const accumulateDispatches = (inst, ignoredDirection, event) => {
    if (inst && event && event.dispatchConfig.registrationName) {
        const registrationName = event.dispatchConfig.registrationName;
        const listener = getListener(inst, registrationName);
        if (listener) {
            event._dispatchListeners = accumulateInto(event._dispatchListeners, listener);
            event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
        }
    }
};

/**
 * @description
 * 합성 이벤트`에 대한 디스패치를 누적하지만, 오직
 * 디스패치 마커`에 대해서만 누적합니다.
 * @param {SyntheticEvent} event
 */
const accumulateDirectDispatchesSingle = (event) => {
    if (event && event.dispatchConfig.registrationName) {
        accumulateDispatches(event._targetInst, null, event);
    }
};

/**
 *
 * @param {*} events
 * @description 이벤트 집합을 2phase로 누적합니다.
 */
export const accumulateTwoPhaseDispatches = (events) => {
    forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
};

/**
 *
 * @param {\} leave
 * @param {*} enter
 * @param {*} from
 * @param {*} to
 * @description 이벤트 집합을 누적합니다.(Enter, Leave)
 */
export const accumulateEnterLeaveDispatches = (leave, enter, from, to) => {
    traverseEnterLeave(from, to, accumulateDispatches, leave, enter);
};

/**
 *
 * @param {*} events
 * @description 직접 디스패치를 누적합니다.
 */
export const accumulateDirectDispatches = (events) => {
    forEachAccumulated(events, accumulateDirectDispatchesSingle);
};
