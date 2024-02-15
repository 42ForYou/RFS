/**
 *
 * @param {any} action
 * @param {boolean} hasEagerState
 * @param {any} eagerState
 * @param {THookUpdate} next
 */
const hookUpdate = class {
    constructor(action, hasEagerState, eagerState, next) {
        this.action = action;
        this.hasEagerState = hasEagerState;
        this.eagerState = eagerState;
        this.next = next;
    }
};

/**
 *
 * @param {any} action
 * @param {boolean} hasEagerState
 * @param {any} eagerState
 * @param {THookUpdate} next
 * @returns hookUpdate
 */
const createHookUpdate = (action, hasEagerState, eagerState, next) => {
    return new hookUpdate(action, hasEagerState, eagerState, next);
};

export default createHookUpdate;
