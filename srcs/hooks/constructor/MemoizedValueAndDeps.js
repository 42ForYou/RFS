/**
 * MemoizedValueAndDeps
 * @description - useMemo와 useCallback에서 사용되는 memoizedState를 생성하는 클래스입니다.
 */
class MemoizedValueAndDeps {
    constructor(value, deps) {
        this.value = value;
        this.deps = deps;
    }

    toArray() {
        return [this.value, this.deps];
    }
}

/**
 *
 * @param {any} value
 * @param {Array} deps
 * @returns
 */
const createMemoizedValueAndDeps = (value, deps) => {
    return new MemoizedValueAndDeps(value, deps).toArray();
};

export default createMemoizedValueAndDeps;
