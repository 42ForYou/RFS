import createMemoizedValueAndDeps from "../constructor/MemoizedValueAndDeps";
import { mountWorkInProgressHook, updateWorkInProgressHook } from "../core/workInProgressHook";
import areHookDepsEqual from "../shared/areHookDepsEqual";

/**
 *
 * @param {Function} callback
 * @param {Array} deps
 * @description - useMemo와 동일한 코드입니다.
 * 하나 다른 점은 callback을 실행하지 않고 callback그 자체를 저장한다는 것입니다.
 * @returns
 */
export const mountCallback = (callback, deps) => {
    const hook = mountWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    const memoizedState = createMemoizedValueAndDeps(callback, nextDeps);

    hook.memoizedState = memoizedState;
    return callback;
};

/**
 *
 * @param {Function} callback
 * @param {Array} deps
 * @description - 만약 deps가 같다면, 이전에 저장된 callback을 반환합니다.
 * 만약 deps가 다르다면, 새로운 callback을 저장하고 반환합니다.
 * 이때 callback은 deps에 의존하기 때문에 deps가 변경되었을 때,
 * 해당 deps를 반영한 새로운 callback을 반환합니다.
 * @returns
 */
export const updateCallback = (callback, deps) => {
    const hook = updateWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    const prevState = hook.memoizedState;

    if (nextDeps !== null) {
        const prevDeps = prevState[1];
        if (prevDeps !== null) {
            if (areHookDepsEqual(nextDeps, prevDeps)) {
                return prevState[0];
            }
        }
    }
    const memoizedState = createMemoizedValueAndDeps(callback, nextDeps);
    hook.memoizedState = memoizedState;

    return callback;
};
