/**
 * @module useMemo
 * @description This module defines the useMemo function.
 */

import hookCore from "../core/hookCore";

/**
 * @description This function is useMemo hook.
 * @argument {Function} create
 * @argument {Array} deps
 * @returns {any}
 */
const useMemo = (create, deps) => {
    return hookCore.RfsCurrentDispatcher.current.useMemo(create, deps);
};

export default useMemo;
