/**
 * @typedef {Object} TUpdate
 * @property {any} action
 * @property {boolean} hasEagerState
 * @property {any} eagerState
 * @property {TUpdate | null} next
 */
const TUpdate = Object.freeze({
    action: null,
    hasEagerState: null,
    eagerState: null,
    next: null,
});
