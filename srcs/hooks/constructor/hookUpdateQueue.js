/**
 *
 * @param {THookUpdate} last
 * @param {Function} dispatch
 * @param {Function} lastRenderedReducer
 * @param {any} lastRenderedState
 */
const hookUpdateQueue = class {
    constructor(last, dispatch, lastRenderedReducer, lastRenderedState) {
        this.last = last;
        this.dispatch = dispatch;
        this.lastRenderedReducer = lastRenderedReducer;
        this.lastRenderedState = lastRenderedState;
    }
};

/**
 *
 * @param {THookUpdate}last
 * @param {Function} dispatch
 * @param {Function} lastRenderedReducer
 * @param {any} lastRenderedState
 * @returns
 */
const createHookUpdateQueue = (last, dispatch, lastRenderedReducer, lastRenderedState) => {
    return new hookUpdateQueue(last, dispatch, lastRenderedReducer, lastRenderedState);
};

export default createHookUpdateQueue;
