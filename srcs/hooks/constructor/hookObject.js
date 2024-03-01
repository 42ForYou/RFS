/**
 *
 * @param {any} memoizedState
 * @param {any} baseState
 * @param {any} baseUpdate
 * @param {TUpdateQueue} queue
 * @param {THookObject} next
 */
const hookObject = class {
    constructor(memoizedState, baseState, baseUpdate, queue, next) {
        this.memoizedState = memoizedState;
        this.baseState = baseState;
        this.baseUpdate = baseUpdate;
        this.queue = queue;
        this.next = next;
    }
};

/**
 *
 * @param {any} memoizedState
 * @param {any} baseState
 * @param {any} baseUpdate
 * @param {TUpdateQueue} queue
 * @param {THookObject} next
 * @returns
 */
const createHookObject = (memoizedState, baseState, baseUpdate, queue, next) => {
    return new hookObject(memoizedState, baseState, baseUpdate, queue, next);
};

export default createHookObject;
