import {
    LayoutStatic as LayoutStaticEffect,
    Update as UpdateEffect,
} from "../../fiber/type";

import { Layout as HookLayout } from "../types/THookEffectFlags";
import { mountEffectImpl, updateEffectImpl } from "../useEffect/useEffectImpl";

/**
 *
 * @param {Function} create
 * @param {Array} deps
 * @description Mount Layout Effect
 * 중요한 점은 mount시 Layout Effect는 UpdateEffect와 Layout"Static"Effect를 사용한다는 점입니다.
 * 하지만 아직 Static에 대한 것은 알지 못합니다.
 * Update Flag는 useEffect를 제외한 다른 Effect훅들은 모두 Fiber에 UpdateEffect를 사용합니다.
 * 정확한 이유는 아직 모르겠습니다.
 * @see mountEffectImpl
 * @returns
 */
export const mountLayoutEffect = (create, deps) => {
    return mountEffectImpl(
        UpdateEffect | LayoutStaticEffect,
        HookLayout,
        create,
        deps
    );
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
    return updateEffectImpl(UpdateEffect, HookLayout, create, deps);
};
