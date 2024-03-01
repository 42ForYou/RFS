/**
 *
 * @param {import("../../fiber/type").TEffectTags} effectTag
 * @param {Function} create
 * @param {import("../types/THookEffectFlags").THookEffectFlags} inst
 * @param {Array} deps
 * @param {TEffect} next
 * @see TEffectInstance
 */
const effect = class {
    constructor(effectTag, create, inst, deps, next) {
        this.effectTag = effectTag;
        this.create = create;
        this.inst = inst;
        this.deps = deps;
        this.next = next;
    }
};

/**
 *
 * @param {import("../../fiber/type").TEffectTags} effectTag
 * @param {Function} create
 * @param {import("../types/THookEffectFlags").THookEffectFlags}
 * @param {Array} deps
 * @param {TEffect} next
 * @returns {TEffect}
 * @see TEffectInstance
 */
const createEffect = (effectTag, create, inst, deps, next) => {
    return new effect(effectTag, create, inst, deps, next);
};

export default createEffect;
