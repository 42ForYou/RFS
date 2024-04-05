import { needsStateRestore, restoreStateIfNeeded } from "./controlledComponent.js";
//default
let batchedUpdatesImpl = (fn, bookkeeping) => {
    return fn(bookkeeping);
};
let discreteUpdatesImpl = (fn, a, b, c) => {
    return fn(a, b, c);
};
let flushDiscreteUpdatesImpl = () => {};
let batchedEventUpdatesImpl = batchedUpdatesImpl;

let isInsideEventHandler = false;
let isBatchingEventUpdates = false;

/**
 * @description eventHandler를 마무리하는 함수
 */
export const finishEventHandler = () => {
    // Here we wait until all updates have propagated, which is important
    // when using controlled components within layers:
    //
    const controlledComponentsHavePendingUpdates = needsStateRestore();
    if (controlledComponentsHavePendingUpdates) {
        //폼 요소(<input>, <textarea>, <select> 등)의 상태를 리액트 컴포넌트의 state를 통해 관리하는 방식
        //이러한 제어 컴포넌트의 state가 예상대로 업데이트 되었는지 확인하고, 필요한 경우 DOM 노드의 상태를 제어된 값으로 복원하는 것
        flushDiscreteUpdatesImpl();
        restoreStateIfNeeded();
    }
};

//NOTE:안에서 계속 batchUpdate가(이벤트들이)계속 불리면서 finishEventHandler를 미룸
/**
 *
 * @param {lambda} fn
 * @param {*} bookkeeping
 * @returns {}
 * @description 이벤트 시스템에서 이벤트를 배치로 처리하는 함수->bookkeeping객체를
 * @description 받아서 fn을 실행한다.
 */
export const batchedUpdates = (fn, bookkeeping) => {
    if (isInsideEventHandler) {
        // If we are currently inside another batch, we need to wait until it
        // fully completes before restoring state.
        return fn(bookkeeping);
    }
    isInsideEventHandler = true;
    try {
        return batchedUpdatesImpl(fn, bookkeeping);
    } finally {
        isInsideEventHandler = false;
        finishEventHandler();
    }
};

/**
 *
 * @param {lambda} fn
 * @param {*} a
 * @param {*} b
 * @description 이벤트 업데이트를 배치로 처리하는 함수
 * @description 다시 해당 함수의 흐름이 다시 batchedCall들을 부르더라도
 * @description finishEventHandler를 실행하지 않고 미루게고 단순히 fn을 실행하게 됩니다.
 * @description 그리고 다 마무리 된 후에 finishEventHandler를 실행합니다.
 */
export const batchedEventUpdates = (fn, a, b) => {
    if (isBatchingEventUpdates) {
        // If we are currently inside another batch, we need to wait until it
        // fully completes before restoring state.
        return fn(a, b);
    }
    isBatchingEventUpdates = true;
    try {
        return batchedEventUpdatesImpl(fn, a, b);
    } finally {
        isBatchingEventUpdates = false;
        finishEventHandler();
    }
};

export const discreteUpdates = (fn, a, b, c) => {
    const prevIsInsideEventHandler = isInsideEventHandler;
    isInsideEventHandler = true;
    try {
        return discreteUpdatesImpl(fn, a, b, c);
    } finally {
        isInsideEventHandler = prevIsInsideEventHandler;
        if (!isInsideEventHandler) {
            finishEventHandler();
        }
    }
};

let lastFlushedEventTimeStamp = 0;
/**
 *
 * @param {*} timeStamp
 * @description Discrete한 업데이트를 flush하는 함수 (필요하면)
 */
export const flushDiscreteUpdatesIfNeeded = (timeStamp) => {
    // timeStamp가 0이거나 마지막으로 flush된 이벤트의 타임스탬프와 다르면 flushDiscreteUpdatesImpl을 실행한다.
    if (!isInsideEventHandler && (timeStamp === 0 || lastFlushedEventTimeStamp !== timeStamp)) {
        lastFlushedEventTimeStamp = timeStamp;
        flushDiscreteUpdatesImpl();
    }
};

/**
 *
 * @param {*} batchedUpdates
 * @param {*} discreteUpdates
 * @param {*} flushDiscreteUpdates
 * @param {*} batchedEventUpdates
 * @description 배칭 관련된 update 함수들을 설정하는 함수
 */
export const setBatchingImplementation = (
    batchedUpdates,
    discreteUpdates,
    flushDiscreteUpdates,
    batchedEventUpdates
) => {
    batchedUpdatesImpl = batchedUpdates;
    discreteUpdatesImpl = discreteUpdates;
    flushDiscreteUpdatesImpl = flushDiscreteUpdates;
    batchedEventUpdatesImpl = batchedEventUpdates;
};
