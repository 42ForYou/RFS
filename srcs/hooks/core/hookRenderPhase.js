/**
 * @module hookRenderCore
 * @description - This module contains the core asset of the hook rendering.
 */

/**
 * @constant {number} RE_RENDER_LIMIT - The number of re-renders. prevent infinite loops.
 * @description pair with hookRenderCore.numberOfReRenders
 */
export const RE_RENDER_LIMIT = 25;

/**
 * @typedef {Object} HookRenderCore
 *
 * @property {boolean} didScheduleRenderPhaseUpdate - Whether the render phase update is scheduled or not.
 * @property {Map<THookUpdateQueue, THookUpdate>} renderPhaseUpdates - Lazily created map of render-phase updates.
 * // key: hook.queue , value: firstUpdate
 * // key Object
 * // Key Object Map밖에 없음. 다른 자료구조는 Object를 key로 사용을 못함.
 * // 이 변수가 있어야하는이유는 렌더 페이즈에 일어난 update들을 저장할 필요가 있기 때문.
 * @property {number} numberOfReRenders - The number of re-renders. prevent infinite loops.
 */
export default {
    didScheduleRenderPhaseUpdate: false, // renderWithHooks()에게 컴포넌트 재실행을 알려줄 플래그 dispatchAction에서 true로 변경됨.
    renderPhaseUpdates: null, // update 임시 저장소 Map의 형태로 저장한다.
    numberOfReRenders: 0, // 무한 루프 방지와 업데이트 구현체에게 Render phase update를 알려주는 플래그
};
