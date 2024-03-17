/**
 * @module context
 * @description - Context Constructor
 */

/**
 *
 * @param {Symbol} $$typeof
 * @param {any} _currentValue
 * @param {any} _currentValue2
 * @param {Number} _threadCount
 * @param {TProvider} Provider
 * @param {TConsumer} Consumer
 */
const context = class {
    constructor($$typeof, _currentValue, _currentValue2, _threadCount, Provider, Consumer) {
        this.$$typeof = $$typeof;
        this._currentValue = _currentValue;
        this._currentValue2 = _currentValue2;
        this._threadCount = _threadCount;
        this.Provider = Provider;
        this.Consumer = Consumer;
    }
};

/**
 *
 * @param {Symbol} $$typeof
 * @param {any} _currentValue
 * @param {any} _currentValue2
 * @param {Number} _threadCount
 * @param {TProvider} Provider
 * @param {TConsumer} Consumer
 */
const createContextInst = ($$typeof, currentValue, currentValue2, threadCount, Provider, Consumer) => {
    return new context($$typeof, currentValue, currentValue2, threadCount, Provider, Consumer);
};

export default createContextInst;
