/**
 * @module FunctionComponentUpdateQueue
 * @description - This class is used to create an update queue for function component.
 * @property {TEffect} lastEffect - The last effect in the circular update queue.
 */
class FunctionComponentUpdateQueue {
    constructor(lastEffect) {
        this.lastEffect = lastEffect;
    }
}

/**
 * @description - This function creates an update queue for function component.
 * stores와  events, memocache는 각각 다른 hook들에서 사용됩니다.
 * 각각 [useSyncExternalStore, useEffectEvent, useMemoCache]에서 사용.
 * 그래서 위의 property들은 제거되었습니다.
 * @returns {Object} - An update queue for function component.
 */
const createFunctionComponentUpdateQueue = (lastEffect) => {
    return new FunctionComponentUpdateQueue(lastEffect);
};

export default createFunctionComponentUpdateQueue;
