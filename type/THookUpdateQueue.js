/**
 * @typedef {Object} THookUpdateQueue
 * @property {THookUpdate} last -> circular list of updates pointing to the last update
 * @property {function} dispatch -> dispatch function
 * @property {function | baseicStateReducer} lastRenderedReducer -> last rendered reducer
 * @property {any} lastRenderedState -> last rendered state
 * @description 16.12.0 version에서는 pending을 last라 말하고 있습니다.
 */
const THookUpdateQueue = {
    last: null,
    dispatch: null,
    lastRenderedReducer: null,
    lastRenderedState: null,
};
