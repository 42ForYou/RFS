/**
 * @module useCallback
 * @description This module defines the useCallback function.
 */

import hookCore from "../core/hookCore";

/**
 * @description This function is useCallback hook.
 * @argument {Function} callback
 * @argument {Array} deps
 * @returns {Function}
 */
const useCallback = (callback, deps) => {
    return hookCore.RfsCurrentDispatcher.current.useCallback(callback, deps);
};

export default useCallback;
