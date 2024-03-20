import { Update as UpdateEffect } from "../../const/CSideEffectFlags.js";

import { MountLayout, UnmountMutation } from "../../const/CHookEffectFlags.js";
import { mountEffectImpl, updateEffectImpl } from "../useEffect/useEffectImpl.js";

/**
 *
 * @param {Function} create
 * @param {Array} deps
 * @description Mount Layout Effect
 * 중요한 점은 mount시 Layout Effect는 UpdateEffect와 Layout"Static"Effect를 사용한다는 점입니다.
 * 하지만 아직 Static에 대한 것은 알지 못합니다.
 * Update Flag는 useEffect를 제외한 다른 Effect훅들은 모두 Fiber에 UpdateEffect를 사용합니다.
 * 정확한 이유는 아직 모르겠습니다.
 * // NOTE: 16.12.0 version에서는 Static Flag가 사라졌습니다.
 * // 다른 플래그에 대한 조사를 Notion에 적어 놓겠습니다.
 * @see mountEffectImpl
 * @returns
 */
export const mountLayoutEffect = (create, deps) => {
    //NOTE: passiveEffect가 아님으로 sideEffectTag에 UpdateEffect만을 추가하고
    //NOTE: 해당 작업은 mutation이 unmount될떄 unmount되어야 함으로 UnmountMutation을 추가합니다.
    //NOTE: mount는 mountLayout입니다.
    return mountEffectImpl(UpdateEffect, UnmountMutation | MountLayout, create, deps);
};

/**
 *
 * @param {Function} create
 * @param {Array} deps
 * @description Update Layout Effect
 * UpdateEffect는 해당 fiber가 Browser의 render에 영향을 준다는 의미.
 * @see updateEffectImpl
 * @returns
 */
export const updateLayoutEffect = (create, deps) => {
    //NOTE: passiveEffect가 아님으로 sideEffectTag에 UpdateEffect만을 추가하고
    //NOTE: 해당 작업은 mutation이 unmount될떄 unmount되어야 함으로 UnmountMutation을 추가합니다.
    //NOTE: mount는 mountLayout입니다.
    return updateEffectImpl(UpdateEffect, UnmountMutation | MountLayout, create, deps);
};
