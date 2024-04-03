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

export const finishEventHandler = () => {
    // Here we wait until all updates have propagated, which is important
    // when using controlled components within layers:
    //
    const controlledComponentsHavePendingUpdates = needsStateRestore();
    if (controlledComponentsHavePendingUpdates) {
        // If a controlled event was fired, we may need to restore the state of
        // the DOM node back to the controlled value. This is necessary when React
        // bails out of the update without touching the DOM.
        flushDiscreteUpdatesImpl();
        restoreStateIfNeeded();
    }
};

//NOTE:안에서 계속 batchUpdate가(이벤트들이)계속 불리면서 finishEventHandler를 미룸
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
export const flushDiscreteUpdatesIfNeeded = (timeStamp) => {
    // event.timeStamp isn't overly reliable due to inconsistencies in
    // how different browsers have historically provided the time stamp.
    // Some browsers provide high-resolution time stamps for all events,
    // some provide low-resolution time stamps for all events. FF < 52
    // even mixes both time stamps together. Some browsers even report
    // negative time stamps or time stamps that are 0 (iOS9) in some cases.
    // Given we are only comparing two time stamps with equality (!==),
    // we are safe from the resolution differences. If the time stamp is 0
    // we bail-out of preventing the flush, which can affect semantics,
    // such as if an earlier flush removes or adds event listeners that
    // are fired in the subsequent flush. However, this is the same
    // behaviour as we had before this change, so the risks are low.
    // 이벤트 타임스탬프는 서로 다른 브라우저의
    // 브라우저마다 타임스탬프 제공 방식이 다르기 때문입니다.
    // 일부 브라우저는 모든 이벤트에 대해 고해상도 타임스탬프를 제공합니다,
    // 일부는 모든 이벤트에 대해 저해상도 타임스탬프를 제공합니다. FF < 52
    // 심지어 두 타임스탬프를 혼합하기도 합니다. 일부 브라우저는 심지어
    // 음수 타임스탬프 또는 0(iOS9)인 타임스탬프를 보고하기도 합니다.
    // 두 타임스탬프가 동일(!==)한 것만 비교한다고 가정하면
    // 해상도 차이로부터 안전합니다. 타임스탬프가 0인 경우
    // 의미론에 영향을 줄 수 있는 플러시를 방지하지 않습니다,
    // 예를 들어, 이전 플러시가 이벤트 리스너를 제거하거나 추가하는 경우와 같이
    // 후속 플러시에서 발생하는 경우와 같이 의미에 영향을 미칠 수 있습니다. 그러나 이것은 이전과 동일한
    // 동작이므로 위험성은 낮습니다.
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
