/**
 * @module useEffectImpl
 * @description This module contains the implementation of the useEffect hook.
 */

import { Passive as PassiveEffect, PassiveStatic as PassiveStaticEffect } from "../../fiber/type";

import { HasEffect as HookHasEffect, Passive as HookPassive } from "../types/THookEffectFlags";
import areHookDepsEqual from "../shared/areHookDepsEqual";

import { mountWorkInProgressHook, updateWorkInProgressHook } from "../core/workInProgressHook";
import hookCore from "../core/hookCore";

import createEffect from "../constructor/effect";
import createEffectInstance from "../constructor/EffectInstance";
import createFunctionComponentUpdateQueue from "../constructor/FunctionComponentUpdateQueue";

/**
 *
 * @param {TFiberTag} tag
 * @param {Function} create
 * @param {Function} inst
 * @param {Array} deps
 * @description - This function push an effect on fiber updateQueue.
 * fiber의 updateQueue에 effect를 push합니다. 만약 updateQueue가 존재하지 않는다면 새로운 updateQueue를 생성합니다.
 * @see createFunctionComponentUpdateQueue
 * @returns
 */
const pushEffect = (tag, create, inst, deps) => {
    const effect = createEffect(tag, create, inst, deps, null);
    let componentUpdateQueue = hookCore.currentlyRenderingFiber.updateQueue;

    if (componentUpdateQueue === null) {
        componentUpdateQueue = createFunctionComponentUpdateQueue(null);
        hookCore.currentlyRenderingFiber.updateQueue = componentUpdateQueue;
        componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
        const lastEffect = componentUpdateQueue.lastEffect;
        // fiber에 updateQueue가 존재하지만, lastEffect가 null인 경우
        // 즉, updateQueue에 effect가 존재하지 않는 경우
        if (lastEffect === null) {
            componentUpdateQueue.lastEffect = effect.next = effect;
        } else {
            const firstEffect = lastEffect.next;
            lastEffect.next = effect;
            effect.next = firstEffect;
            componentUpdateQueue.lastEffect = effect;
        }
    }
    return effect;
};

/**
 *
 * @param {import("../../fiber/type").TEffectFlags} fiberFlags
 * @param {import("../types/THookEffectFlags").THookEffectFlags} hookFlags
 * @param {Function} create
 * @param {Function} deps
 * @description - This function updates an effect.
 * 만약 deps가 변하지 않았다면 기존 effect를 재사용하여 memoizedState를 업데이트합니다.
 * 만약 deps가 변했다면 HookHasEffect (<- important)를 추가하여 새로운 effect를 생성합니다.
 * 이후 해당 flag는 commitPassiveMountOnFiber에서 passive effect를 처리할 때 사용됩니다.
 * @see commitPassiveMountOnFiber
 * @see commitHookPasssiveMountEffects
 * @returns
 * // TODO: move to separate file becasue of shared function
 */
export const updateEffectImpl = (fiberFlags, hookFlags, create, deps) => {
    const hook = updateWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    const effect = hook.memoizedState;
    const inst = effect.inst;

    if (hookCore.currentHook !== null && nextDeps !== null) {
        const prevEffect = hookCore.currentHook.memoizedState;
        const prevDeps = prevEffect.deps;
        // if deps "[]" when mounted, and the prevDeps is "[]" -> true
        // so run the effect ONCE
        // Why not just use the memoizedState from current hook?
        // -> https://jser.dev/react/2022/01/19/lifecycle-of-effect-hook/#deps-are-compared
        if (areHookDepsEqual(nextDeps, prevDeps)) {
            // 태그를 바꾸기 위해 이전 effect를 사용하지 않고 새로운 effect를 tag만 변경하여
            // 사용.
            // 1. effect는 기본적으로 circular니, 이전 effect
            // 즉, currentHook.memoizedState(prevEffect)는 본인을 next로 가리키거나 다른 effect를 가리켜야하기 때문에
            // 이번 renderPhase에서는 새로운 effect를 가리켜야 하기 때문에 pushEffect를 사용해서 새로운 Effect를 생성한다.
            // 이 경우 이전 effect와 상태가 같기 때문에 effect를 재사용한다.

            //가정 1. 여기선 업데이트큐에다가 데이터밀고 커밋단계에서 처리한다. 그리고 그건 hookFlags를 보고 처리한다
            // 가정 2. updateEffectImpl에서 바뀌지 않았으면 처리되진 않지만 그 전 데이터를 복사해서 유지할 필요가 있다.
            //가정 3. 그것을 위하여 기존에 있는거에서 flag만 처리하지않는다를 붙여서 복사해서 붙여넣는다
            //가정4. 지우지 못하는 이유는 circularlist
            //가정4. (모름) 가르키는 곳을 바꿔서 거기부터 처리한다.
            hook.memoizedState = pushEffect(hookFlags, create, inst, nextDeps);
            return;
        }
    }

    hookCore.currentlyRenderingFiber.flags |= fiberFlags;

    hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, inst, nextDeps);
};

/**
 *
 * @param {Function} create
 * @param {Array<any>} deps
 * @see updateEffectImpl
 * @description - This function updates an effect.
 */
export const updateEffect = (create, deps) => {
    updateEffectImpl(PassiveEffect, HookPassive, create, deps);
};

/**
 *
 * @param {import("../../fiber/type").TEffectFlags} fiberFlags
 * @param {import("../types/THookEffectFlags").THookEffectFlags} hookFlags
 * @param {Function} create
 * @param {Function} deps
 * @description - This function mounts an effect.
 * mount시 effect는 항상 실행되어야 하기 때문에 HookHasEffect flag를 추가하여 effect를 생성합니다.
 * // TODO: move to separate file becasue of shared function
 */
export const mountEffectImpl = (fiberFlags, hookFlags, create, deps) => {
    const hook = mountWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    hookCore.currentlyRenderingFiber.flags |= fiberFlags;
    hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, createEffectInstance(undefined), nextDeps);
};

/**
 *
 * @param {Function} create
 * @param {Function} deps
 * @description - This function mounts an effect.
 * give the fiber flag PassiveEffect and PassiveStaticEffect
 * @see mountEffectImpl
 */
export const mountEffect = (create, deps) => {
    mountEffectImpl(PassiveEffect | PassiveStaticEffect, HookPassive, create, deps);
};
