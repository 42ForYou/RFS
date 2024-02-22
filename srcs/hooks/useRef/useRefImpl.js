/**
 * @module useRefImpl
 * @description This module defines the useRef function.
 * useRef훅은 단순히 hook.memoizedState에 ref Object를 저장하는 것에 불과합니다.
 * fiber가 hostInstance에 ref property를 연결함으로써 fiber의 stateNode를 ref로 사용할 수 있게 됩니다.
 * 즉 browser라면 Dom Note에 연결 할 수 있습니다.
 * 혹은 render를 일으키지 않고 컴포넌트의 라이프사이클동안 변경될 수 있는 값을 사용할 때도 유용합니다.
 */

/**
 *
 * @param {any} initialValue
 * @description This function is useRef hook.
 * @returns {Object} {current: initialValue}
 */
export const mountRef = (initialValue) => {
    const hook = mountWorkInProgressHook();
    const ref = { current: initialValue };
    hook.memoizedState = ref;
    return ref;
};

/**
 *
 * @param {Any} initialValue
 * @returns {Object} {current: initialValue}
 */
export const updateRef = (_) => {
    const hook = updateWorkInProgressHook();
    return hook.memoizedState;
};
