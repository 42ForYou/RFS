/**
 * @module EffectInstance
 * @description - This class is used to create an destroy Object for effect instance.
 * @see https://github.com/facebook/react/pull/26561
 * @property {Function} destroy - The cleanup function of the effect.
 */
class EffectInstance {
    constructor(destroy) {
        this.destroy = destroy;
    }
}

/**
 * @description - This function creates an effect instance.
 * @returns {Object} - An effect instance includes destroy function.
 */
const createEffectInstance = (destroy) => {
    return new EffectInstance(destroy);
};

export default createEffectInstance;
