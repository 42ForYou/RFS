/**
 * @module useRef
 * @description This module defines the useRef function.
 */

import hookCore from "../core/hookCore";

/**
 * @description This function is useRef hook.
 * @argument {any} initialValue
 * @returns {Object} {current: initialValue}
 */
const useRef = (initialValue) => {
    return hookCore.RfsCurrentDispatcher.current.useRef(initialValue);
};

export default useRef;
