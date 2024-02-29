import { NoWork } from "../../type/TExpirationTime.js";
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

    if (
        fiber === hookCore.currentlyRenderingFiber ||
        (alternate !== null && alternate === hookCore.currentlyRenderingFiber)
    ) {
        // This is a render phase update.

        hookRenderPhase.didScheduleRenderPhaseUpdate = true;

        const update = createHookUpdate(hookExpirationTime.renderExpirationTime, null, action, null, null, null);

        if (hookRenderPhase.renderPhaseUpdates === null) {
            hookRenderPhase.renderPhaseUpdates = new Map();
        }

        const firstRenderPhaseUpdate = hookRenderPhase.renderPhaseUpdates.get(queue);
        if (firstRenderPhaseUpdate === undefined) {
            // create new Map for restore update during render phase
            hookRenderPhase.renderPhaseUpdates.set(queue, update);
        } else {
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
        // TODO: Implement this function. requestCurrentSuspenseConfig
        const suspenseConfig = requestCurrentSuspenseConfig();
        // TODO: Implement this function. computeExpirationForFiber
        // hookupdate에서 suspenseConfig를 사용하고 있는데 이후 updateReducer의 markRenderEventTimeAndConfig에서만 사용된다
        const expirationTime = computeExpirationForFiber(currentTime, fiber, suspenseConfig);

        const update = createHookUpdate(expirationTime, suspenseConfig, action, null, null, null);
        enqueueRenderPhaseUpdate(queue, update);

        if (fiber.expirationTime === NoWork && (alternate === null || alternate.expirationTime === NoWork)) {
            // The queue is currently empty, which means we can eagerly compute the
            // next state before entering the render phase. If the new state is the
            // same as the current state, we may be able to bail out entirely.
            const lastRenderedReducer = queue.lastRenderedReducer;
            if (lastRenderedReducer !== null) {
                try {
                    const currentState = queue.lastRenderedState;
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
