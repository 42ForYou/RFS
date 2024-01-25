/**
 * @module useMemo
 * @description This module defines the useMemo function.
 */

import c from "../core/core";

/**
 * @description This function is useMemo hook.
 * @argument {Function} create
 * @argument {Array} deps
 * @returns {any}
 */
export const useMemo = (create, deps) => {
    return c.RfsCurrentDispatcher.current.useMemo(create, deps);
};
