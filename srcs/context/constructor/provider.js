/**
 * @module provider
 * @description - Provider Constructor
 */

/**
 *
 * @param {Symbol} $$typeof
 * @param {TContext} _context
 */
const provider = class {
    constructor($$typeof, _context) {
        this.$$typeof = $$typeof;
        this._context = _context;
    }
};

/**
 *
 * @param {Symbol} $$typeof
 * @param {TContext} _context
 * @returns
 */
const createProvider = ($$typeof, _context) => {
    return new provider($$typeof, _context);
};

export default createProvider;
