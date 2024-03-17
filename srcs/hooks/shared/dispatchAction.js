import { NoWork } from "../../const/CExpirationTime.js";
import is from "../../shared/objectIs.js";
import createHookUpdate from "../constructor/hookUpdate.js";
import hookCore from "../core/hookCore.js";
import hookExpirationTime from "../core/hookExpirationTime.js";
import hookRenderPhase from "../core/hookRenderPhase.js";
import enqueueRenderPhaseUpdate from "./enqueueRenderPhaseUpdate.js";

/**
 * @param {TFiber} fiber currentlyRenderingFiber
 * @param {THookUpdateQueue} queue
 * @param {any} action
 * @description - This function dispatches an action to the reducer.
 * 다음과 같은 이유로, useReducer에서는 eagerState를 사용하지 않습니다.
 * useReducer는 보다 복잡한 상태 로직을 관리할 때 사용되며,
 * 상태 업데이트 로직이 useState보다 더 복잡하거나 조건부 로직을 포함할 수 있기 때문에,
 * 선제적 계산을 기본 동작으로 사용하지 않습니다.
 *
 * 하지만 해당 dispatchReducerAction은 useState와 함께 사용할 예정이기 때문에
 * eagerState를 추가하여 useState에서 선제적 계산(eager)을 사용하도록 하였습니다.
 *
 *  현재 RFS의 schedule logic을 포괄적으로 파악하지 못하였기 때문에
 *  dispatch로 인해 scheduleUpdateOnFiber를 호출하는 것으로 대체하였습니다.
 *  해당 65번째 줄의 함수는 이후 구현에 따라 변경될 수 있습니다. react Source에서 render phase일 시에
 *  enqueueRenderPhaseUpdate를 호출하고 있습니다.
 */

const dispatchAction = (fiber, queue, action) => {
    const alternate = fiber.alternate;

    // TODO: isRenderPhaseUpdate 함수로 Refactor
    if (
        fiber === hookCore.currentlyRenderingFiber ||
        (alternate !== null && alternate === hookCore.currentlyRenderingFiber)
    ) {
        // This is a render phase update.

        hookRenderPhase.didScheduleRenderPhaseUpdate = true;

        const update = createHookUpdate(hookExpirationTime.renderExpirationTime, null, action, null, null, null);

        //NOTE: 컴포넌트 내의 여러 useState와 useReducer가 존재 할 수 있는데
        //NOTE: 안내를 할라면 map이 필요한가 ?
        //NOTE: 위의 주석이 맞다. 정확이는 일단 dispatchAction은 hook을 인자로 안받아서
        //NOTE: 훅에 대한 신원 확인을 하려면, hook과 대응되는 hook.queue를 통해 신원확인을 해야됨
        //NOTE: 그리고 나중에 useReducer에서 빠르게 자신의 현재 hook에 대한 update를 찾기 위해서
        //NOTE: 이렇게 진행
        if (hookRenderPhase.renderPhaseUpdates === null) {
            hookRenderPhase.renderPhaseUpdates = new Map();
        }

        const firstRenderPhaseUpdate = hookRenderPhase.renderPhaseUpdates.get(queue);
        if (firstRenderPhaseUpdate === undefined) {
            // create new Map for restore update during render phase
            // Map을 쓰는 이유는 hook.queue를 key로 사용하기 위함이다.
            hookRenderPhase.renderPhaseUpdates.set(queue, update);
        } else {
            // 원형 큐가 아니라 그냥 큐입니다.
            let lastRenderPhaseUpdate = firstRenderPhaseUpdate;
            while (lastRenderPhaseUpdate.next !== null) {
                lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
            }
            lastRenderPhaseUpdate.next = update;
        }
    } else {
        // this is an idle status update

        // TODO: Implement this function. requestCurrentTimeForUpdate
        const currentTime = requestCurrentTimeForUpdate();
        // TODO: Implement this function. requestCurrentSuspenseConfig 사용하지 않을 수 있음
        const suspenseConfig = requestCurrentSuspenseConfig();
        // TODO: Implement this function. computeExpirationForFiber
        // hookupdate에서 suspenseConfig를 사용하고 있는데 이후 updateReducer의 markRenderEventTimeAndConfig에서만 사용된다
        const expirationTime = computeExpirationForFiber(currentTime, fiber, suspenseConfig);

        const update = createHookUpdate(expirationTime, suspenseConfig, action, null, null, null);
        enqueueRenderPhaseUpdate(queue, update);

        // TODO: refactor this statement, isNoWorkOnBothFiber
        //NOTE: 이게 굉장히 복잡한데 처음생성될 때는 fiberExpirationTime이 Nowork임 정확히는
        //NOTE: 처음 바인드 될떄는, 이유는 beginwork에서 beginPhase넘어가기 전에 wip.expirtationTime을 NoWork로 설정하는데
        //NOTE: 이게 hookcore.currentlyRenderingFiber으로 전달되고
        //NOTE: 바인드할떄 currentRenderingFiber를 바인드하기 떄문에 처음에는 ExpirtationTime이 NoWork임
        //NOTE: 그리고 마운트가 막 된상황이면 alternate가 null이기 떄문에 이것도 NoWork임.
        //NOTE: 그리고 이 파이버가 update(expirationTime갱신)이 없으면 만족

        //NOTE:주석 의미 그대로 update가 들어왔으면 expirationTime이 들어왔을건데 둘다 없으니까 없다라고 하는듯
        //NOTE:해당 파이버에 대해서 가해진 사이드 이펙트가 없을거니까 신경 안쓰고 선제적으로 계산을 가할 수 있따라는것 같다.
        //NOTE:좀더 정확히는 클릭해서 이벤트를 가했는데, 해당 친구가 업데이트가 없는 상황이면, 선제적으로 계산해서 그 결과가
        //NOTE:상태를 바꾸지 않았다면 렌더링을 할 필요가 없다는 것이다.
        //NOTE:달라졌으면 나중에 사용할 수 있게 eagerState에다가 저장해놓고 나중에 하나씩 꺼내서 그 결과를 사용할 수 있게 한다.
        //NOTE:만약 렌더 도중에 reducer가 조건문에 의해서 바뀌면 이것을 사용하지 못함으로 eageReducer === reducer를 비교하는듯
        if (fiber.expirationTime === NoWork && (alternate === null || alternate.expirationTime === NoWork)) {
            // The queue is currently empty, which means we can eagerly compute the
            // next state before entering the render phase. If the new state is the
            // same as the current state, we may be able to bail out entirely.
            //NOTE:여기서의 Bailout은 scheduleWork를 호출하지 않는다는 것인듯.
            const lastRenderedReducer = queue.lastRenderedReducer;
            if (lastRenderedReducer !== null) {
                try {
                    const currentState = queue.lastRenderedState;
                    // 사용자가 만든 Reducer이기 때문에 어떤 에러가 발생할지 모름.
                    // 때문에, try catch로 감싼다.
                    const eagerState = lastRenderedReducer(currentState, action);

                    update.eagerReducer = lastRenderedReducer;
                    update.eagerState = eagerState;
                    if (is(eagerState, currentState)) {
                        return;
                    }
                } catch (error) {
                    // Suppress the error. It will throw again in the render phase.
                }
            }
        }
        // TODO: Implement this function. scheduleWork
        scheduleWork(fiber, expirationTime);
    }
};

export default dispatchAction;
