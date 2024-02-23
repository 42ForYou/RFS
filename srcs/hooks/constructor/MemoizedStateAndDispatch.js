/**
 * MemoizedStateAndDispatch
 * @description - useReducer와 useState에서 사용되는 memoizedState와 dispatch를 생성하는 함수입니다.
 */
class MemoizedStateAndDispatch {
    constructor(state, dispatch) {
        this.state = state;
        this.dispatch = dispatch;
    }

    toArray() {
        return [this.state, this.dispatch];
    }
}

/**
 *
 * @param {any} state
 * @param {Function} dispatch
 * @returns
 */
const createMemoizedStateAndDispatch = (state, dispatch) => {
    return new MemoizedStateAndDispatch(state, dispatch).toArray();
};

export default createMemoizedStateAndDispatch;
