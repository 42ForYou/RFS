/**
 * @file types.js
 * @description This file defines the types of the core object.
 */

// workTag
// const HostRoot /**                 */ = 0
// const FunctionComponent /**        */ = 1
// const HostComponent /**            */ = 2
// const HostText /**                 */ = 3

// effectTag
// const ONCE = Symbol.for("ONCE");
// const EXEC_EFFECT = Symbol.for("USEEFFECT");
// const NO_CHANGES = Symbol.for("NOCHANGES");

/**
 * @property {Symbol} tag
 * @property {Function} create
 * @property {Function} destroy
 * @property {Array} deps
 * @property {effectValue} next
 */
const TEffect = Object.freeze({
    effectTag: null,
    create: null,
    destroy: null,
    deps: null,
    next: null,
});

/**
 * @property {any} memoizedState
 * @property {Object} queue
 * @property {Hook} next
 */
const THookObject = Object.freeze({
    memoizedState: null,
    queue: null,
    next: null,
});

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
    // Tag identifying the type of fiber.
    tag: TWorkTag,
    // Unique identifier of this child. ex) <li>
    key: null | String | Number,
    // This property can seperate between HTML elements and Component
    type: null | String | Function,
    // The local state associated with this fiber.
    stateNode: any | null,

    // The Fiber to return to after finishing processing this one.
    // This is effectively the parent, but there can be multiple parents (two)
    // so this is only the parent of the thing we're currently processing.
    // It is conceptually the same as the return address of a stack frame.
    return: TFiber | null,
    // Singly Linked List Tree Structure.
    child: TFiber | null,
    sibling: TFiber | null,
    index: Number,

    // Input is the data coming into process this fiber. Arguments. Props.
    props: any | null,
    // The ref last used to attach this node.
    ref: any | null,

    // The hook state used to create the output
    memoizedState: THookObject | null,

    // Dependencies (contexts, events) for this fiber, if it has any
    dependencies: TDependencies | null,

    // Singly linked list fast path to the next fiber with side-effects.
    nextEffect: TFiber | null,

    // The first and last fiber with side-effect within this subtree. This allows
    // us to reuse a slice of the linked list when we reuse the work done within
    // this fiber.
    firstEffect: TFiber | null,
    lastEffect: TFiber | null,

    // This is a pooled version of a Fiber. Every fiber that gets updated will
    // eventually have a pair. There are cases when we can clean up pairs to save
    // memory if we need to.
    alternate: TFiber | null,
};
