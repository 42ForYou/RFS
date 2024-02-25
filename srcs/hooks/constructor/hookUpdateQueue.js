/**
 *
 * @param {THookUpdate} pending
 * @param {Function} dispatch
 * @param {Function} lastRenderedReducer
 * @param {any} lastRenderedState
 */
const hookUpdateQueue = class {
    constructor(pending, dispatch, lastRenderedReducer, lastRenderedState) {
        this.pending = pending;
        this.dispatch = dispatch;
        this.lastRenderedReducer = lastRenderedReducer;
        this.lastRenderedState = lastRenderedState;
    }
};

/**
 *
 * @param {THookUpdate} pending
 * @param {Function} dispatch
 * @param {Function} lastRenderedReducer
 * @param {any} lastRenderedState
 * @returns
 */
const createHookUpdateQueue = (pending, dispatch, lastRenderedReducer, lastRenderedState) => {
    return new hookUpdateQueue(pending, dispatch, lastRenderedReducer, lastRenderedState);
};

export default createHookUpdateQueue;
