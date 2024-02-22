/**
 * @module useState
 * @description This module defines the useState function.
 */

import hookCore from "../core/hookCore";

/**
 * @description This function is useState hook.
 * @param {any} initialState
 * @returns {Array} [state, setState]
 */
const useState = (initialState) => {
    return hookCore.RfsCurrentDispatcher.current.useState(initialState);
};

export default useState;
