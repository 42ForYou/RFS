/**
 *
 * @param {any} action
 * @param {boolean} hasEagerState
 * @param {any} eagerState
 * @param {THookUpdate} next
 */
const hookUpdate = class {
    constructor(expirationTime, suspenseConfig, action, eagerReducer, eagerState, next) {
        this.expirationTime = expirationTime;
        this.suspenseConfig = suspenseConfig;
        this.action = action;
        this.eagerReducer = eagerReducer;
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
const createHookUpdate = (expirationTime, suspenseConfig, action, eagerReducer, eagerState, next) => {
    return new hookUpdate(expirationTime, suspenseConfig, action, eagerReducer, eagerState, next);
};

export default createHookUpdate;
