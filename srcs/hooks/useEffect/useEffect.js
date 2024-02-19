/**
 * @module useEffect
 * @description This module defines the useEffect function.
 */

import hookCore from "../core/hookCore";

/**
 * @description This function is useEffect hook.
 * @argument {Function} create
 * @argument {Array} deps
 * @returns {undefined}
 */
export const useEffect = (create, deps) => {
    return hookCore.RfsCurrentDispatcher.current.useEffect(create, deps);
};
