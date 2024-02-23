import is from "../../shared/objectIs";

/**
 *
 * @param {Array<any>} prevDeps
 * @param {Array<any>} nextDeps
 * @description - This function checks if the deps are equal.
 * useEffect의 deps 배열을 비교하여 같다면 true, 다르다면 false를 반환합니다.
 * @returns
 */
export const areHookDepsEqual = (prevDeps, nextDeps) => {
    // NOTE: 해당 함수는 prevDeps와 nextDeps의 길이가 같다고 가정합니다.
    // https://github.com/facebook/react/pull/14594
    // react-reconciler -> src -> ReactFiberHooks.js -> areHookInputsEqual 450번째 줄 참고.

    for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
        if (is(prevDeps[i], nextDeps[i])) {
            continue;
        }
        return false;
    }
    return true;
};
