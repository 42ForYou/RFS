/**
 * @module contextItem
 * @description - ContextItem Constructor
 */

/**
 *
 * @param {TContext} context
 * @param {number} observedBits
 * @param {import("../../../type/TContextItem").TContextItem | null} next
 */
const contextItem = class {
    constructor(context, observedBits, next) {
        this.context = context;
        this.observedBits = observedBits;
        this.next = next;
    }
};

/**
 *
 * @param {TContext} context
 * @param {number} observedBits
 * @param {import("../../../type/TContextItem").TContextItem | null} next
 */
const createContextItem = (context, observedBits, next) => {
    return new contextItem(context, observedBits, next);
};

export default createContextItem;
