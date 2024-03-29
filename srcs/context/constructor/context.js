/**
 * @module context
 * @description - Context Constructor
 */

/**
 *
 * @param {Symbol} $$typeof
 * @param {any} _currentValue
 * @param {any} _currentValue2
 * @param {TProvider} Provider
 * @param {TConsumer} Consumer
 */
const context = class {
    constructor($$typeof, _currentValue, _currentValue2, Provider, Consumer) {
        this.$$typeof = $$typeof;
        this._currentValue = _currentValue;
        this._currentValue2 = _currentValue2;
        this.Provider = Provider;
        this.Consumer = Consumer;
    }
};

/**
 *
 * @param {Symbol} $$typeof
 * @param {any} _currentValue
 * @param {any} _currentValue2
 * @param {TProvider} Provider
 * @param {TConsumer} Consumer
 */
const createContextInst = ($$typeof, currentValue, currentValue2, threadCount, Provider, Consumer) => {
    return new context($$typeof, currentValue, currentValue2, threadCount, Provider, Consumer);
};

export default createContextInst;
