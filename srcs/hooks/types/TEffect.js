/**
 * @typedef {Object} TEffect
 * @property {Symbol} tag
 * @property {Function} create
 * @property {Function} destroy
 * @property {Array} deps
 * @property {effectValue} next
 */
const TEffect = Object.freeze({
    effectTag: null,
    create: null,
    destroy: null,
    deps: null,
    next: null,
});
