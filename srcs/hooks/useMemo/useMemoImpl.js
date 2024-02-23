import createMemoizedValueAndDeps from "../constructor/MemoizedValueAndDeps";
import {
    mountWorkInProgressHook,
    updateWorkInProgressHook,
} from "../core/workInProgressHook";
import { areHookDepsEqual } from "../shared/areHookDepsEqual";

/**
 * @function mountMemo
 * @param {Function} nextCreate
 * @param {Array} deps
 * 초기 Hook과 해당 Object를 mount하는 함수입니다.
 * 값을 생성하고 memoizedState에 저장합니다.
 * @returns {nextValue}
 */
export const mountMemo = (nextCreate, deps) => {
    const hook = mountWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    const nextValue = nextCreate();
    const memoizedState = createMemoizedValueAndDeps(nextValue, nextDeps);

    hook.memoizedState = memoizedState;
    return nextValue;
};

/**
 * @function updateMemo
 * @param {Function} nextCreate
 * @param {Array} deps
 * @description This function updates the memo hook.
 * 이전 deps와 비교해서 같다면 이전 state를 반환하고, 다르다면 새로운 state를 반환합니다.
 * 새로운 state는 nextcreate()로 생성합니다.
 * Client가 만든 callBack Function 이 deps에 의존하고 있다면, 이 동작이 타당해 보입니다.
 * @returns {nextValue}
 */
export const updateMemo = (nextCreate, deps) => {
    const hook = updateWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    const prevState = hook.memoizedState;

    if (nextDeps !== null) {
        const prevDeps = prevState[1];
        if (areHookDepsEqual(nextDeps, prevDeps)) {
            return prevState[0];
        }
    }

    const nextValue = nextCreate();
    const memoizedState = createMemoizedValueAndDeps(nextValue, nextDeps);

    hook.memoizedState = memoizedState;
    return nextValue;
};
