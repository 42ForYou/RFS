/**
 * @typedef {Object} TContextDependency
 *
 * @property {TExpirationTime} expirationTime
 * @property {import("./TContextItem.js").TContextItem} context
 * @property {Map} responders - NOTE: event에서 사용하는 것 같다.
 */
const TDependencies = {
    expirationTime: TExpirationTime,
    firstContext: TContextItem | null,
    responders: Map(ReactEventResponder, ReactEventResponderInstance | null),
};
