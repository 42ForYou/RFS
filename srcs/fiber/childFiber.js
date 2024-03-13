import { createWorkInProgress } from "../fiber/fiber.js";

/**
 * @param {TFiber|null} current @see 파일경로: [TFiber.js](srcs/type/TFiber.js)
 * @param {TFiber} workInProgress @see 파일경로: [TFiber.js](srcs/type/TFiber.js)
 * @returns {void}
 * @description 현재의 workInProgress의 child를 복사합니다.
 */
export const cloneChildFibers = (current, workInProgress) => {
    //자식이 없는 경우 -> early return
    if (workInProgress.child === null) {
        return;
    }
    //새로운 자식을 만들어 wip에 연결합니다.
    let currentChild = workInProgress.child;
    let newChild = createWorkInProgress(currentChild, currentChild.pendingProps, currentChild.expirationTime);
    workInProgress.child = newChild;
    newChild.return = workInProgress;

    //모든 자식의 wip를 만들어서 연결합니다.
    while (currentChild.sibling !== null) {
        currentChild = currentChild.sibling;
        newChild = createWorkInProgress(currentChild, currentChild.pendingProps, currentChild.expirationTime);
        newChild.return = workInProgress;
    }
    //마지막 자식의 sibling을 null로 만들어줍니다.
    newChild.sibling = null;
};
