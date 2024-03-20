/**
 *
 * @param {import("../../fiber/type").TEffectTags} effectTag
 * @param {Function} create
 * @param {Function} destroy
 * @param {Array} deps
 * @param {TEffect} next
 * @see TEffectInstance
 */
const effect = class {
    constructor(effectTag, create, destroy, deps, next) {
        this.effectTag = effectTag;
        this.create = create;
        this.destroy = destroy;
        this.deps = deps;
        this.next = next;
    }
};

/**
 *
 * @param {import("../../fiber/type").TEffectTags} effectTag
 * @param {Function} create
 * @param {Function} destroy
 * @param {Array} deps
 * @param {TEffect} next
 * @returns {TEffect}
 * @see TEffectInstance
 */
const createEffect = (effectTag, create, destroy, deps, next) => {
    return new effect(effectTag, create, destroy, deps, next);
};

export default createEffect;
