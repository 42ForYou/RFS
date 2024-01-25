/**
 * @module useRef
 * @description This module defines the useRef function.
 */

import c from "../core/core";

/**
 * @description This function is useRef hook.
 * @argument {any} initialValue
 * @returns {Object} {current: initialValue}
 */
export const useRef = (initialValue) => {
    return c.RfsCurrentDispatcher.current.useMemo(
        () => ({
            current: initialValue,
        }),
        []
    );
};
