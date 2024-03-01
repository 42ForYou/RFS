import { HostRoot } from "../type/TWorkTag.js";
import { NoEffect } from "../type/TSideEffectFlags.js";
import { NoWork } from "../type/TExpirationTime.js";
import { ConcurrentMode } from "../type/TTypeOfMode.js";
import { ConcurrentRoot } from "../type/TRootTag.js";
/**
 * 
 * @param {tag} TWorkTag 
 * @param {pendingProps} pendingProps -> props of the fiber will be rendered
 * @param {key} key = null | string -> conceptual identifier
 * @property {*} ->TFiber
 * @param {mode} TTypeOfMode
 * @returns {TFiber}
 @description constructor for FiberNode
@description 자세한 설명은 TFiber.js에 참조
 */
const FiberNode = class {
    constructor(tag, pendingProps, key, mode) {
        //Instance begin
        this.tag = tag;
        this.key = key;
        this.elementType = null;
        this.type = null;
        this.stateNode = null;
        //Instance end

        //Tree begin
        this.return = null;
        this.child = null;
        this.sibling = null;
        this.index = 0;
        //Tree end

        //ref begin
        this.ref = null;
        //ref end

        //파이버의 상태를 기록하고, 업데이트를 관리하기 위한 것들
        this.pendingProps = pendingProps;
        this.memoizedProps = null;
        this.updateQueue = null;
        this.memoizedState = null;

        this.mode = mode;
        //파이버의 비교를 위한 것
        this.alternate = null;

        //side effect를 위한 것
        this.effectTag = NoEffect;

        //effects
        this.firstEffect = null;
        this.lastEffect = null;
        this.nextEffect = null;

        this.expirationTime = NoWork;
        this.childExpirationTime = NoWork;

        this.alternate = null;
    }
};

/**
 *
 * @param {tag} TWorkTag
 * @param {pendingProps} pendingProps -> props of the fiber will be rendered
 * @param {key} key = null | string -> conceptual identifier
 * @param {mode} TTypeOfMode
 * @returns {TFiber}
 * @description createFiber function will create a new FiberNode
 * @description this is because that seperate Constructor's implementation from the create function
 */
const createFiber = (tag, pendingProps, key, mode) => {
    return new FiberNode(tag, pendingProps, key, mode);
};

/**
 *
 * @param {tag} TRootTag ->/type/TRootTag.js
 * @returns fiber @type TFiber
 * @description HostRoot에 대응되는 FiberNode를 생성하는 함수
 */
export const createHostRootFiber = (tag) => {
    return createFiber(HostRoot, null, null, ConcurrentMode);
};
