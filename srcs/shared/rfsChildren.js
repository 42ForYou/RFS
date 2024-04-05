import { getIteratorFn, RFS_ELEMENT_TYPE } from "../core/rfsSymbol.js";

const SEPARATOR = ".";
const SUBSEPARATOR = ":";

const POOL_SIZE = 10;
const traverseContextPool = [];
/**
 * Escape and wrap key so it is safe to use as a reactid
 *
 * @param {string} key to be escaped.
 * @return {string} the escaped key.
 */
const escape = (key) => {
    const escapeRegex = /[=:]/g;
    const escaperLookup = {
        "=": "=0",
        ":": "=2",
    };
    const escapedString = ("" + key).replace(escapeRegex, function (match) {
        return escaperLookup[match];
    });

    return "$" + escapedString;
};
/**
 * Generate a key string that identifies a component within a set.
 *
 * @param {*} component A component that could contain a manual key.
 * @param {number} index Index that is used if a manual key is not provided.
 * @return {string}
 */
const getComponentKey = (component, index) => {
    // Do some typechecking here since we call this blindly. We want to ensure
    // that we don't block potential future ES APIs.
    if (typeof component === "object" && component !== null && component.key !== null) {
        // Explicit key
        return escape(component.key);
    }
    // Implicit key determined by the index in the set
    return index.toString(36);
};
//o
const getPooledTraverseContext = (mapResult, keyPrefix, mapFunction, mapContext) => {
    if (traverseContextPool.length) {
        const traverseContext = traverseContextPool.pop();
        traverseContext.result = mapResult;
        traverseContext.keyPrefix = keyPrefix;
        traverseContext.func = mapFunction;
        traverseContext.context = mapContext;
        traverseContext.count = 0;
        return traverseContext;
    } else {
        return {
            result: mapResult,
            keyPrefix: keyPrefix,
            func: mapFunction,
            context: mapContext,
            count: 0,
        };
    }
};

//o
const releaseTraverseContext = (traverseContext) => {
    traverseContext.result = null;
    traverseContext.keyPrefix = null;
    traverseContext.func = null;
    traverseContext.context = null;
    traverseContext.count = 0;
    if (traverseContextPool.length < POOL_SIZE) {
        traverseContextPool.push(traverseContext);
    }
};

/**
 * @param {?*} children Children tree container.
 * @param {!string} nameSoFar Name of the key path so far.
 * @param {!function} callback Callback to invoke with each child found.
 * @param {?*} traverseContext Used to pass information throughout the traversal
 * process.
 * @return {!number} The number of children in this subtree.
 */
//o
const traverseAllChildrenImpl = (children, nameSoFar, callback, traverseContext) => {
    const type = typeof children;

    if (type === "undefined" || type === "boolean") {
        // All of the above are perceived as null.
        children = null;
    }

    let invokeCallback = false;

    if (children === null) {
        invokeCallback = true;
    } else {
        switch (type) {
            case "string":
            case "number":
                invokeCallback = true;
                break;
            case "object":
                switch (children.$$typeof) {
                    case RFS_ELEMENT_TYPE:
                        invokeCallback = true;
                }
        }
    }

    if (invokeCallback) {
        callback(
            traverseContext,
            children,
            // If it's the only child, treat the name as if it was wrapped in an array
            // so that it's consistent if the number of children grows.
            nameSoFar === "" ? SEPARATOR + getComponentKey(children, 0) : nameSoFar
        );
        return 1;
    }

    let child;
    let nextName;
    let subtreeCount = 0; // Count of children found in the current subtree.
    const nextNamePrefix = nameSoFar === "" ? SEPARATOR : nameSoFar + SUBSEPARATOR;

    if (Array.isArray(children)) {
        for (let i = 0; i < children.length; i++) {
            child = children[i];
            nextName = nextNamePrefix + getComponentKey(child, i);
            subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
        }
    } else {
        const iteratorFn = getIteratorFn(children);
        if (typeof iteratorFn === "function") {
            const iterator = iteratorFn.call(children);
            let step;
            let ii = 0;
            while (!(step = iterator.next()).done) {
                child = step.value;
                nextName = nextNamePrefix + getComponentKey(child, ii++);
                subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
            }
        }
    }

    return subtreeCount;
};

/**
 * Traverses children that are typically specified as `props.children`, but
 * might also be specified through attributes:
 *
 * - `traverseAllChildren(this.props.children, ...)`
 * - `traverseAllChildren(this.props.leftPanelChildren, ...)`
 *
 * The `traverseContext` is an optional argument that is passed through the
 * entire traversal. It can be used to store accumulations or anything else that
 * the callback might find relevant.
 *
 * @param {?*} children Children tree object.
 * @param {!function} callback To invoke upon traversing each child.
 * @param {?*} traverseContext Context for traversal.
 * @return {!number} The number of children in this subtree.
 */
//o
const traverseAllChildren = (children, callback, traverseContext) => {
    if (children === null) {
        return 0;
    }

    return traverseAllChildrenImpl(children, "", callback, traverseContext);
};

/**
 * Iterates through children that are typically specified as `props.children`.
 *
 * See https://reactjs.org/docs/react-api.html#reactchildrenforeach
 *
 * The provided forEachFunc(child, index) will be called for each
 * leaf child.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} forEachFunc
 * @param {*} forEachContext Context for forEachContext.
 */
//o
const forEachChildren = (children, forEachFunc, forEachContext) => {
    if (children === null) {
        return children;
    }
    const traverseContext = getPooledTraverseContext(null, null, forEachFunc, forEachContext);
    traverseAllChildren(children, forEachSingleChild, traverseContext);
    releaseTraverseContext(traverseContext);
};

export { forEachChildren as forEach };
