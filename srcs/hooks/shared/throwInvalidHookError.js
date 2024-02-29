/**
 * @module throwInvalidHookError
 * @description This module defines the throwInvalidHookError function.
 * hook이 불리지 말아야할 상황에서 불렸을 경우 (e.g. 모든 렌더 과정이 끝났을 때) 에러를 발생시키는 함수입니다.
 */
const throwInvalidHookError = () => {
    throw new Error("Invalid hook Call. Hooks can only be called inside of the body of a function component.");
};

export default throwInvalidHookError;
