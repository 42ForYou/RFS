/**
 * @module useState
 * @description This module defines the useState function.
 */

import c from "../core/core";

/**
 * @description This function is useState hook.
 * @param {any} initialState
 * @returns {Array} [state, setState]
 */
export const useState = (initialState) => {
    return c.RfsCurrentDispatcher.current.useState(initialState);
};
