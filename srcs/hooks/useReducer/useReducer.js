/**
 * @module useReducer
 * @description This module defines the useReducer function.
 */

import c from "../core/core";

/**
 * @description This function is useReducer hook.
 * @argument {Function} reducer
 * @argument {any} initialArg
 * @returns {Array} [state, dispatch]
 */
export const useReducer = (reducer, initialArg) => {
    return c.RfsCurrentDispatcher.current.useReducer(reducer, initialArg);
};
