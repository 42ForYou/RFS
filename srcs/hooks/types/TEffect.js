/**
 * @typedef {Object} TEffect
 * @property {import("../../fiber/type").TEffectFlags} tag - Fiber Effect Tag
 * @property {Function} create - callback Function the first Args in Effect Hooks
 * @property {import("./TEffectInstance").TEffectInstance} inst - cleanup Function the return of create Function
 * @property {Array<any>} deps - dependency Array
 * @property {TEffect} next - next Effect
 */
const TEffect = Object.freeze({
    effectTag: null,
    create: null,
    inst: null,
    deps: null,
    next: null,
});
