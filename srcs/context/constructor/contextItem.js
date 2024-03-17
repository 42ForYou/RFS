/**
 * @module contextItem
 * @description - ContextItem Constructor
 */

/**
 *
 * @param {TContext} context
 * @param {import("../../../type/TContextItem").TContextItem | null} next
 */
const contextItem = class {
    constructor(context, next) {
        this.context = context;
        this.next = next;
    }
};

/**
 *
 * @param {TContext} context
 * @param {number, * @param {import("../../../type/TContextItem").TContextItem | null}} next
 */
const createContextItem = (context, next) => {
    return new contextItem(context, next);
};

export default createContextItem;
