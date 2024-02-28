import { TWorkTag } from "./TWorkTag";
import { TExpirationTime } from "./TExpirationTime";
const TRefObject = {
    current: any,
};

const TSideEffectFlags = {}; // Todo: implement this type, shoulde import from detail file
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
 * @description 1. to represent the fiber node
 * @description 2. Duck Typing- side Effect and Fiber Node
 */
const TFiber = {
    tag: TWorkTag,
    key: null | String, // conceptual identifier
    elementType: String | Function, // to represent Defined Type of Component, to Preserve Original Type for High Order Component
    type: String | Function, // to represent Instance Type of Component
    stateNode: any, // to represent local state of the fiber(if hostCompoent== DOM, Root==RootNode, FunctionComponent==null, Fragment==null, ContextProvider==null, MemoComponent==null, HostText==null)

    //related with Tree
    return: TFiber | null, // to represent the parent of the fiber
    child: TFiber | null, // to represent the first child of the fiber
    sibling: TFiber | null, // to represent the next sibling of the fiber
    index: Number, // to represent the index of the child in the parent's children array

    ref: TRefObject | null, // to represent the ref of the fiber

    //related with Props
    pendingProps: any, // to represent the props of the fiber
    memoizedProps: any, // to represent the memoized props of the fiber

    updateQueue: any, // to represent queue of state updates and callbacks

    memoizedState: any, //   // The state used to create the output
    //if the fiber is a function component-> hook, hostRoot-> RootState ,..so on

    alternate: TFiber | null, // to represent the old version of the fiber

    //Effect
    effectTag: TSideEffectFlags, // to represent the type of effect

    //Effect with prefix ->to Deliver effect(sideeffect) to parent
    firstEffect: TFiber | null, // TOdo: to determine this type
    lastEffect: TFiber | null, // Todo: to determine this type
    nextEffect: TFiber | null, // Todo: to determine this type

    // Represents a time in the future by which this work should be completed.
    // Does not include work found in its subtree.
    expirationTime: TExpirationTime, // to represent the expiration time of the fiber

    // This is used to quickly determine if a subtree has no pending changes.
    childExpirationTime: TExpirationTime, // to represent the expiration time of the child
};
