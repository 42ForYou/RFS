/**
 * @typedef {Object} THookUpdateQueue
 * @property {THookUpdate} pending -> circular list of updates pointing to the last update
 * @property {function} dispatch -> dispatch function
 * @property {function | baseicStateReducer} lastRenderedReducer -> last rendered reducer
 * @property {any} lastRenderedState -> last rendered state
 */
const THookUpdateQueue = Object.freeze({
    pending: null,
    dispatch: null,
    lastRenderedReducer: null,
    lastRenderedState: null,
});
