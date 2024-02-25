/**
 * @typedef {Object} THookObject
 * @property {any} memoizedState
 * @property {any} baseState
 * @property {THookUpdate} baseUpdate
 * @property {THookUpdateQueue} queue
 * @property {Hook} next
 */
const THookObject = {
    memoizedState: null,
    baseState: null,
    baseUpdate: null,
    queue: null,
    next: null,
};
