/**
 * @module useCallback
 * @description This module defines the useCallback function.
 */

import c from "../core/core";

/**
 * @description This function is useCallback hook.
 * @argument {Function} callback
 * @argument {Array} deps
 * @returns {Function}
 */
export const useCallback = (callback, deps) => {
    return c.RfsCurrentDispatcher.current.useMemo(() => callback, deps);
};
