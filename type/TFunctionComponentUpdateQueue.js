/**
 * TFunctionComponentUpdateQueue
 * @type {Object} TFunctionComponentUpdateQueue
 * @property {TEffect} lastEffect - last effect the end of circular linked list
 */
const TFunctionComponentUpdateQueue = {
    lastEffect: TEffect | null,
};
