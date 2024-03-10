/**
 * @typedef {Object} TConsumer
 * @property {Symbol} $$typeof
 * @property {TContext} _context
 * @property {Function} _calculateChangedBits
 */
const TConsumer = {
    $$typeof: Symbol,
    _context: TContext,
    _calculateChangedBits: Function,
};
