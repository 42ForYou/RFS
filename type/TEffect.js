/**
 * @typedef {Object} TEffect
 * @property {import("../../fiber/type").TEffectFlags} tag - Fiber Effect Tag
 * @property {Function} create - callback Function the first Args in Effect Hooks
 * @property {Function} destroy - callback Function the return of create
 * @property {Array<any>} deps - dependency Array
 * @property {TEffect} next - next Effect
 */
const TEffect = {
    effectTag: null,
    create: null,
    destroy: null,
    deps: null,
    next: null,
};
