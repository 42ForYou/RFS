/**
 * @typedef {Object} TContextItem
 *
 * @property {TContext} context
 * @property {number} observedBits
 * @property {TContextItem | null} next
 */
const TContextItem = {
    context,
    observedBits: 0,
    next: null,
};

export default TContextItem;
