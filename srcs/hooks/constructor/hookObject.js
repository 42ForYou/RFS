/**
 *
 * @param {any} memoizedState
 * @param {TUpdateQueue} queue
 * @param {THookObject} next
 */
const hookObject = class {
    constructor(memoizedState, queue, next) {
        this.memoizedState = memoizedState;
        this.queue = queue;
        this.next = next;
    }
};

/**
 *
 * @param {any} memoizedState
 * @param {TUpdateQueue} queue
 * @param {THookObject} next
 * @returns
 */
const createHookObject = (memoizedState, queue, next) => {
    return new hookObject(memoizedState, queue, next);
};

export default createHookObject;
