/**
 * @typedef {Object} THookUpdate
 * @property {any} action
 * @property {boolean} hasEagerState
 * @property {any} eagerState
 * @property {THookUpdate | null} next
 */
const ThookUpdate = {
    expirationTime: 0,
    action: null,
    eagerReducer: null,
    eagerState: null,
    next: null,
};
