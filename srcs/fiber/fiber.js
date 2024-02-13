import { HostRoot } from "./type";
/**
 * 
 * @param {tag} TWorkTag 
 * @param {pendingProps} pendingProps -> props of the fiber will be rendered
 * @param {key} key = null | string -> conceptual identifier
 * @property {*} ->TFiber
 * @returns {TFiber}
 @description constructor for FiberNode
*/
const FiberNode = class {
    constructor(tag, pendingProps, key) {
        this.tag = tag;
        this.key = key;
        this.elementType = null;
        this.type = null;
        this.stateNode = null;

        //related with Tree
        this.return = null;
        this.child = null;
        this.sibling = null;
        this.index = 0;

        this.ref = null;

        //related with Props
        this.pendingProps = pendingProps;
        this.memoizedProps = null;

        this.updateQueue = null;

        this.alternate = null;

        //related with Effect
        //flags will be noflags
        this.flags = null;
        this.subtreeFlags = null;
        this.deletions = null;
    }
};

/**
 *
 * @param {tag} TWorkTag
 * @param {pendingProps} pendingProps -> props of the fiber will be rendered
 * @param {key} key = null | string -> conceptual identifier
 * @returns {TFiber}
 * @description createFiber function will create a new FiberNode
 * @description this is because that seperate Constructor's implementation from the create function
 */
const createFiber = (tag, pendingProps, key) => {
    return new FiberNode(tag, pendingProps, key);
};

/**
 *
 * @param {tag} RootTag -> core/const.js
 * @returns TFiber
 * @description createHostRootFiber function will create a new FiberNode with HostRoot tag
 */
export const createHostRootFiber = (tag) => {
    return createFiber(HostRoot, null, null);
};
