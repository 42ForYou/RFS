import { NoEffect, Passive } from "../const/CSideEffectFlags.js";
import { FunctionComponent, SimpleMemoComponent } from "../const/CWorkTag.js";
import { NoHookEffect, UnmountPassive, MountPassive } from "../const/CHookEffectTag.js";

/**
 *
 * @param {THookEffectTag} unmountTag
 * @param {THookEffectTag} mountTag
 * @param {TFiber} finishedWork
 * @description 해당 함수는 hookEffectList를 커밋하는 함수이다.
 * @description NOTE: 주의 해야 될점은 여기서 updateQueue에 있는 effect들을 처리한 다라는 것이다.
 * @description 이 함수는 unmount할 tag와 mount할 tag를 인자로 받음으로 써
 * @description 좀 더 일반적으로 각각의 상황에서 unmount할 상황(tag)과 mount할 상황(tag)을
 * @description 지정하여 처리할 수 있도록 일반화 했다.
 * @description 기본적으로 destroy는 undefined로써 create가 동작하고 나서야 destroy들어가서
 * @description 다음 호출 부터 destroy가 동작하게 하는 방식으로 동작한다.
 */
const commitHookEffectList = (unmountTag, mountTag, finishedWork) => {
    const updateQueue = finishedWork.updateQueue;
    const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
    if (lastEffect !== null) {
        const firstEffect = lastEffect.next;
        let effect = firstEffect;
        do {
            if ((effect.tag & unmountTag) !== NoHookEffect) {
                //Unmount
                //NOTE :unmount를 소비해야되는데 소비했다라는 명시로 undefined로 처리한다
                //NOTE: 그리고 소비할 것이 undefined가 아니라면 destroy(cleanup)을 호출한다
                const destroy = effect.destroy;
                effect.destroy = undefined;
                if (destroy !== undefined) {
                    destroy();
                }
            }
            if ((effect.tag & mountTag) !== NoHookEffect) {
                // Mount
                //NOTE: mount될떄는 cleanUp을 부르지 않게 하기 위해
                //NOTE: effect.destroy를 undefined로 생성하는데
                //NOTE: create가 하고 나서는 destroy를 보관하고 있어야한다
                const create = effect.create;
                effect.destroy = create();
            }
            effect = effect.next;
        } while (effect !== firstEffect);
    }
};
/**
 *
 * @param {TFiber} finishedWork
 * @description passiveHookEffect를 커밋하는 함수이다
 * @description 이말은 해당 fiber(sideEffect)의 updateQueue(FunctionUpdateQueue)를 커밋하는 함수이다.
 * @description 만약 기존의 sync가 있다면 sync를 destroy하고
 * @description 새로운 sync를 create하는 방식으로 동작한다.
 */
export const commitPassiveHookEffects = (finishedWork) => {
    if ((finishedWork.effectTag & Passive) !== NoEffect) {
        switch (finishedWork.tag) {
            case FunctionComponent:
            case SimpleMemoComponent: {
                //HookEffect를 커밋하는 방식은 unMount할 HookEffectTag와, mount할 HookEffect를 지정하여 호출하는 방식이다.
                //기본적으로 commitPassiveHookEffect란, UnMountPassive가 마킹되어 있는 effect를 대상으로
                //처리하여, destroy(cleanup)을 수행시키고, MountPassive가 마킹되어 있는 effect에 대해서 create(sync)를
                //수행시킨후 cleanup을 destroy에 넣어두는것이 원하는 useEffect의 동작이다.
                //기본적으로 useEffect를 통해서 외부시스템과 새로운 sync를 시작하기전에 이전 sync를 끊는 작업이 필요한데 이는
                //sync(create)가 수행된 작업만 수행되는것이 타당하다.
                //commithookEffectList는 그러한 동작을 좀더 일반적으로 사용할 수 있도록 추상화한 함수이다.
                //해당 함수는 unMount하고 싶은 tag와  mount하고 싶은 tag를 인자로 받아서 처리하는 방식으로 일반화된 함수이다.
                commitHookEffectList(UnmountPassive, NoHookEffect, finishedWork);
                commitHookEffectList(NoHookEffect, MountPassive, finishedWork);
                break;
            }
            default:
                break;
        }
    }
};
