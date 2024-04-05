import { HostComponent } from "../../const/CWorkTag.js";

/**
 *
 * @param {*} inst
 * @returns {TFiber|null}
 * @description 부모 인스턴스를 반환합니다.
 * HostComponent 태그가 아닌 경우 계속해서 부모를 찾습니다.
 */
const getParent = (inst) => {
    do {
        inst = inst.return;
    } while (inst && inst.tag !== HostComponent);
    if (inst) {
        return inst;
    }
    return null;
};

/**
 *
 * @param {*} instA
 * @param {*} instB
 * @returns {TFiber|null}
 * @description A와 B의 가장 낮은 공통 조상을 반환하거나, 두 인스턴스가 다른 트리에 있으면 null을 반환합니다.
 */
export const getLowestCommonAncestor = (instA, instB) => {
    let depthA = 0;
    for (let tempA = instA; tempA; tempA = getParent(tempA)) {
        depthA++;
    }
    let depthB = 0;
    for (let tempB = instB; tempB; tempB = getParent(tempB)) {
        depthB++;
    }

    // A가 더 깊다면, 위로 올라갑니다.
    while (depthA - depthB > 0) {
        instA = getParent(instA);
        depthA--;
    }

    // If B is deeper, crawl up.
    // B가 더 깊다면, 위로 올라갑니다.
    while (depthB - depthA > 0) {
        instB = getParent(instB);
        depthB--;
    }

    // 일치하는 것을 찾을 때까지 함께 걸어갑니다.
    let depth = depthA;
    while (depth--) {
        if (instA === instB || instA === instB.alternate) {
            return instA;
        }
        instA = getParent(instA);
        instB = getParent(instB);
    }
    return null;
};

/**
 * @returns {boolean}
 * @description A가 B의 조상인지 반환합니다.
 */
export const isAncestor = (instA, instB) => {
    while (instB) {
        if (instA === instB || instA === instB.alternate) {
            return true;
        }
        instB = getParent(instB);
    }
    return false;
};

/**
 *
 * @param {*} inst
 * @returns {TFiber|null}
 * @description 전달된 인스턴스의 부모 인스턴스를 반환합니다.
 */
export const getParentInstance = (inst) => {
    return getParent(inst);
};

/**
 * @param {*} inst
 * @param {*} fn
 * @param {*} arg
 * @description 두 단계의 이벤트 전파를 traverse합니다.
 * capture 단계에서는 상위에서 하위로 이동하며,
 * bubble 단계에서는 하위에서 상위로 이동합니다.
 */
export const traverseTwoPhase = (inst, fn, arg) => {
    const path = [];
    while (inst) {
        path.push(inst);
        inst = getParent(inst);
    }
    let i;
    for (i = path.length; i-- > 0; ) {
        fn(path[i], "captured", arg);
    }
    for (i = 0; i < path.length; i++) {
        fn(path[i], "bubbled", arg);
    }
};

/**
 * Traverses the ID hierarchy and invokes the supplied `cb` on any IDs that
 * should would receive a `mouseEnter` or `mouseLeave` event.
 *
 * Does not invoke the callback on the nearest common ancestor because nothing
 * "entered" or "left" that element.
 */
/**
 *
 * @param {*} from
 * @param {*} to
 * @param {*} fn
 * @param {*} argFrom
 * @param {*} argTo
 * @description ID 계층구조를 탐색하고 제공된 `cb`를 `마우스 입력` 또는 `마우스 종료` 이벤트를 수신해야 하는 모든 ID에 대해 호출합니다.
 * 마우스 입력` 또는 `마우스 종료` 이벤트를 수신해야 하는 모든 ID에서 제공된 `cb`를 호출합니다.
 *
 * 가장 가까운 공통 조상에 대한 콜백을 호출하지 않습니다.
 * 해당 요소를 "입력"하거나 "떠난" 것이 없기 때문에 가장 가까운 공통 조상에서는 콜백을 호출하지 않습니다.
 */
export const traverseEnterLeave = (from, to, fn, argFrom, argTo) => {
    const common = from && to ? getLowestCommonAncestor(from, to) : null;
    const pathFrom = [];
    while (true) {
        if (!from) {
            break;
        }
        if (from === common) {
            break;
        }
        const alternate = from.alternate;
        if (alternate !== null && alternate === common) {
            break;
        }
        pathFrom.push(from);
        from = getParent(from);
    }
    const pathTo = [];
    while (true) {
        if (!to) {
            break;
        }
        if (to === common) {
            break;
        }
        const alternate = to.alternate;
        if (alternate !== null && alternate === common) {
            break;
        }
        pathTo.push(to);
        to = getParent(to);
    }
    for (let i = 0; i < pathFrom.length; i++) {
        fn(pathFrom[i], "bubbled", argFrom);
    }
    for (let i = pathTo.length; i-- > 0; ) {
        fn(pathTo[i], "captured", argTo);
    }
};
