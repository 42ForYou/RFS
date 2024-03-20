/**
 * @module useEffectImpl
 * @description This module contains the implementation of the useEffect hook.
 * @note 16.12.0은 EffectInstance를 사용하지 않는다. 하지만 이전에 논의하였던 대로 rust의 refCell개념을 차용해서 현 RFS에서는 사용하도록 한다.
 */

import { Update as UpdateEffect, Passive as PassiveEffect } from "../../const/CSideEffectFlags.js";

import areHookDepsEqual from "../shared/areHookDepsEqual.js";

import { mountWorkInProgressHook, updateWorkInProgressHook } from "../core/workInProgressHook.js";
import hookCore from "../core/hookCore.js";

import createEffect from "../constructor/effect.js";
import createFunctionComponentUpdateQueue from "../constructor/FunctionComponentUpdateQueue.js";
import { NoEffect as NoHookEffect, MountPassive, UnmountPassive } from "../../const/CHookEffectFlags.js";

/**
 *
 * @param {THookEffectFlags} tag
 * @param {Function} create
 * @param {Function} destroy
 * @param {Array} deps
 * @description - This function push an effect on fiber updateQueue.
 * fiber의 updateQueue에 effect를 push합니다. 만약 updateQueue가 존재하지 않는다면 새로운 updateQueue를 생성합니다.
 * @see createFunctionComponentUpdateQueue
 * @returns
 */
const pushEffect = (tag, create, destroy, deps) => {
    const effect = createEffect(tag, create, destroy, deps, null);

    if (hookCore.componentUpdateQueue === null) {
        hookCore.componentUpdateQueue = createFunctionComponentUpdateQueue(null);
        hookCore.componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
        const lastEffect = hookCore.componentUpdateQueue.lastEffect;
        // fiber에 updateQueue가 존재하지만, lastEffect가 null인 경우
        // 즉, updateQueue에 effect가 존재하지 않는 경우
        if (lastEffect === null) {
            hookCore.componentUpdateQueue.lastEffect = effect.next = effect;
        } else {
            const firstEffect = lastEffect.next;
            lastEffect.next = effect;
            effect.next = firstEffect;
            hookCore.componentUpdateQueue.lastEffect = effect;
        }
    }
    return effect;
};

/**
 *
 * @param {import("../../type/TSideEffectFlags.js").TSideEffectFlags} fiberFlags
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
    let destroy = undefined;

    if (hookCore.currentHook !== null && nextDeps !== null) {
        const prevEffect = hookCore.currentHook.memoizedState;
        const prevDeps = prevEffect.deps;
        destroy = prevEffect.destroy;
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
            //NOTE: 일단 해당 effect가 아무 effect를 일으키지 않았다라는 effect를 밀어둔다
            //NOTE: 아무 effect도 하지 않는것이라는 update를 구지 밀어 두는 이유는
            //NOTE: 컴포넌트가 unmount될떄 destory를 호출해야되는데, 그것의 참조를 위해서이다.
            //NOTE: 기본적으로 업데이트큐에 있는걸 소비하는 식으로 하는데, component가 unmount될떄
            //NOTE: 클린업을 하려면 그것만을 위한 update가 존재해야되는데, 그것을 위해서이다.
            pushEffect(NoHookEffect, create, destroy, nextDeps);
            return;
        }
    }

    hookCore.sideEffectTag |= fiberFlags;
    hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
};

/**
 *
 * @param {Function} create
 * @param {Array<any>} deps
 * @see updateEffectImpl
 * @description - This function updates an effect.
 */
export const updateEffect = (create, deps) => {
    updateEffectImpl(UpdateEffect | PassiveEffect, UnmountPassive | MountPassive, create, deps);
};

/**
 *
 * @param {import("../../type/TSideEffectFlags.js").TSideEffectFlags} fiberFlags
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
    hookCore.sideEffectTag |= fiberFlags;
    hook.memoizedState = pushEffect(hookFlags, create, createEffectInstance(undefined), nextDeps);
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
    //NOTE: UpdateEffect | PassiveEffect 기본적으로 useEffect에 의해서 생겨지는 Effect
    //NOTE: 는 passiveEffect로 이건 내부적으로 생성되면서 뒤로 한 틱 뒤로 스케줄링되고 다음 틱에 해당이 안처리 되어 있으면(커밋단계)
    //NOTE: 그걸 처리하도록 하게 되는데. 일반적으로 update가 일어났고, passive하게 처리됨으로 이런식으로 달아짐

    //NOTE: 기본적으로 밀떄 내가 mount시키고 싶은 effect랑 unmount시키고 싶은 effect를 같이 지정해서 넘겨주는데
    //NOTE: useEffect같은거는 passiveEffect임으로 둘다 passive로 mount,unmount를 지정해주는것이다.
    mountEffectImpl(UpdateEffect | PassiveEffect, UnmountPassive | MountPassive, create, deps);
};
