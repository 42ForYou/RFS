/**
 * @typedef {Object} THookObject
 * @property {any} memoizedState
 * @property {Object} queue
 * @property {Hook} next
 */
const THookObject = Object.freeze({
    memoizedState: null,
    queue: null,
    next: null,
});

export default THookObject;
