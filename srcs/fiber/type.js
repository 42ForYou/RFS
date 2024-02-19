// TWorkTag Type begins
/**
 *@typedef TWorkTag
 */
const TWorkTag = {}; // only for editor to recognize the type
export const FunctionComponent = 0; //to represent the function component
export const HostRoot = 1; // to represent the HostTree Root Node
export const HostComponent = 2; // to represent the Host Component
export const HostText = 3; // to represent the Host Text
export const Fragment = 4; // to represent the Fragment
export const ContextProvider = 5; // to represent the Context Provider
export const MemoComponent = 6; // to represent the HighOrderComponent created by memo

const TRefObject = {
    current: any,
};

/**
 * @typedef TEffectFlags
 * @description Fiber Effect Flags
 * Passive present the effect is passive
 * simply you can think about useEffect hook
 */
const TEffectFlags = {};
export const Passive = /*                      */ 0b0000000000000000100000000000;

// for insertion, layout
export const Update = /*                       */ 0b0000000000000000000000000100;

// Static Flags i've no idea....
export const PassiveStatic = /*                */ 0b0000100000000000000000000000;

// TWorkTag Type ends
/**
 * @typedef {Object} Tfiber
 * @property {TWorkTag} tag
 * @property {null | string | number?} key
 * @property {string | function} type
 * @property {any} stateNode
 * @property {TFiber | null} return
 * @property {TFiber | null} child
 * @property {TFiber | null} sibling
 * @property {number} index
 * @property {any} props
 * @property {any} ref
 * @property {THookObject | null} memoizedState
 * @property {TDependencies | null} dependencies
 * @property {TFiber | null} nextEffect
 * @property {TFiber | null} firstEffect
 * @property {TFiber | null} lastEffect
 * @property {TFiber | null} alternate
 */
const TFiber = {
    tag: TWorkTag,
    key: null | String, // conceptual identifier
    elementType: String | Function, // to represent Defined Type of Component, to Preserve Original Type for High Order Component
    type: String | Function, // to represent Instance Type of Component
    stateNode: any, // to represent host instance.

    //related with Tree
    return: TFiber | null, // to represent the parent of the fiber
    child: TFiber | null, // to represent the first child of the fiber
    sibling: TFiber | null, // to represent the next sibling of the fiber
    index: Number, // to represent the index of the child in the parent's children array

    ref: TRefObject | null, // to represent the ref of the fiber

    //related with Props
    pendingProps: any, // to represent the props of the fiber
    memoizedProps: any, // to represent the memoized props of the fiber

    updateQueue: any, // to saving effect information

    alternate: TFiber | null, // to represent the old version of the fiber

    //related with Effect
    flags: TEffectFlags | null, // to represent the flags of the fiber
    subtreeFlags: TEffectFlags | null, // to represent the subtree flags of the fiber
    deletions: [], // to represent the deletions of the fiber, to tracks for child node to be deleted

    //Effect with prefix ->to Deliver effect(sideeffect) to parent
    firstEffect: TFiber | null, // TOdo: to determine this type
    lastEffect: TFiber | null, // Todo: to determine this type
    nextEffect: TFiber | null, // Todo: to determine this type
};
