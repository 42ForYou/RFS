/**
 * @module useReducer
 * @description This module defines the useReducer function.
 */

import hookCore from "../core/hookCore";

/**
 * @description This function is useReducer hook.
 * @argument {Function} reducer
 * @argument {any} initialArg
 * @argument {Function} init
 * @returns {Array} [state, dispatch]
 */
export const useReducer = (reducer, initialArg, init) => {
    return hookCore.RfsCurrentDispatcher.current.useReducer(
        reducer,
        initialArg,
        init
    );
};
