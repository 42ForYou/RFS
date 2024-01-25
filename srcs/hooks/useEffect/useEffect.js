/**
 * @module useEffect
 * @description This module defines the useEffect function.
 */

import c from "../core/core";

/**
 * @description This function is useEffect hook.
 * @argument {Function} create
 * @argument {Array} deps
 * @returns {undefined}
 */
export const useEffect = (create, deps) => {
    return c.RfsCurrentDispatcher.current.useEffect(create, deps);
};
