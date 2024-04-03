import { HostRoot } from "../const/CWorkTag.js";
import { Placement, NoEffect } from "../const/CSideEffectFlags.js";
/**
 *
 * @param {TFiber} fiber
 * @returns {TFiber|null}
 * @description 해당 파이버의 가장 가까운 마운트된 파이버를 반환합니다.
 */
export const getNearestMountedFiber = (fiber) => {
    let node = fiber;
    let nearestMounted = fiber;
    if (!fiber.alternate) {
        let nextNode = node;
        do {
            node = nextNode;
            //placement가 있는경우 해당 노드가 마운트 될 노드이니까 그것에 부모를 마운트된 노드로 설정
            if ((node.effectTag & Placement) !== NoEffect) {
                nearestMounted = node.return;
            }
            nextNode = node.return;
        } while (nextNode);
    } else {
        while (node.return) {
            node = node.return;
        }
    }
    if (node.tag === HostRoot) {
        return nearestMounted;
    }
    return null;
};
