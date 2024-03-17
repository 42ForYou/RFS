/**
 * @module useContext
 * @description This module defines the useContext function.
 */

import hookCore from "../core/hookCore.js";

/**
 * @description This function is useContext hook.
 *
 * @param {TContext} context
 * @param {number | undefined} observedBits
 */
const useContext = (context) => {
    return hookCore.RfsCurrentDispatcher.current.useContext(context);
};

export default useContext;
