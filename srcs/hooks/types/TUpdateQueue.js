/**
 * @typedef {Object} TUpdateQueue
 * @property {TUpdate} pending
 * @property {function} dispatch
 * @property {function | baseicStateReducer} lastRenderedReducer
 * @property {any} lastRenderedState
 */
const TUpdateQueue = Object.freeze({
    pending: null,
    dispatch: null,
    lastRenderedReducer: null,
    lastRenderedState: null,
});
