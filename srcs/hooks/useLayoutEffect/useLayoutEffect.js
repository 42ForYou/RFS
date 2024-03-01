/**
 * @module useLayoutEffect
 * @description This module defines the useLayoutEffect function.
 */

import hookCore from "../core/hookCore.js";

/**
 * @description This function is useLayoutEffect hook.
 * @argument {Function} create
 * @argument {Array} deps
 * @returns {undefined}
 */
const useLayoutEffect = (create, deps) => {
    return hookCore.RfsCurrentDispatcher.current.useLayoutEffect(create, deps);
};

export default useLayoutEffect;
