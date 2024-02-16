/**
 * @typedef {Object} THookUpdate
 * @property {any} action
 * @property {boolean} hasEagerState
 * @property {any} eagerState
 * @property {THookUpdate | null} next
 */
const ThookUpdate = Object.freeze({
    action: null,
    hasEagerState: null,
    eagerState: null,
    next: null,
});
