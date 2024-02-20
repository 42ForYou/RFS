/**
 * @module useEffectImpl
 * @description This module contains the implementation of the useEffect hook.
 */

import {
    Passive as PassiveEffect,
    PassiveStatic as PassiveStaticEffect,
} from "../../fiber/type";

import {
    HasEffect as HookHasEffect,
    Passive as HookPassive,
} from "../types/THookEffectFlags";

import {
    mountWorkInProgressHook,
    updateWorkInProgressHook,
} from "../core/workInProgressHook";

import createEffect from "../constructor/effect";
import hookCore from "../core/hookCore";
import is from "../../shared/objectIs";

/**
 * @description - This function creates an effect instance.
 * @returns {Object} - An effect instance includes destroy function.
 */
const createEffectInstance = () => {
    return { destroy: undefined };
};

/**
 * @description - This function creates an update queue for function component.
 * stores와  events, memocache는 각각 다른 hook들에서 사용됩니다.
 * 각각 [useSyncExternalStore, useEffectEvent, useMemoCache]에서 사용.
 * 그래서 위의 property들은 제거되었습니다.
 * @returns {Object} - An update queue for function component.
 */
const createFunctionComponentUpdateQueue = () => {
    return {
        lastEffect: null,
    };
};

/**
 *
 * @param {Array<any>} prevDeps
 * @param {Array<any>} nextDeps
 * @description - This function checks if the deps are equal.
 * useEffect의 deps 배열을 비교하여 같다면 true, 다르다면 false를 반환합니다.
 * @returns
 */
const areHookDepsEqual = (prevDeps, nextDeps) => {
    for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
        if (is(prevDeps[i], nextDeps[i])) {
            continue;
        }
        return false;
    }
    return true;
};

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
        componentUpdateQueue = createFunctionComponentUpdateQueue();
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
        const prevEffect = currentHook.memoizedState;
        const prevDeps = prevEffect.deps;
        // if deps "[]" when mounted, and the prevDeps is "[]" -> true
        // so run the effect ONCE
        // Why not just use the memoizedState from current hook?
        // -> https://jser.dev/react/2022/01/19/lifecycle-of-effect-hook/#deps-are-compared
        if (areHookDepsEqual(nextDeps, prevDeps)) {
            hook.memoizedState = pushEffect(hookFlags, create, inst, nextDeps);
            return;
        }
    }

    hookCore.currentlyRenderingFiber.flags |= fiberFlags;

    hook.memoizedState = pushEffect(
        HookHasEffect | hookFlags,
        create,
        inst,
        nextDeps
    );
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
    hook.memoizedState = pushEffect(
        HookHasEffect | hookFlags,
        create,
        createEffectInstance(),
        nextDeps
    );
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
    mountEffectImpl(
        PassiveEffect | PassiveStaticEffect,
        HookPassive,
        create,
        deps
    );
};
