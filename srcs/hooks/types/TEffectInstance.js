/**
 * @typedef {Object} TEffectInstance
 * @description - Effect Instance
 * @property {Function} destroy - This function is used to destroy an effect instance.
 * destroy function은 effect객체와 사용되는 시점이 다를 수 있습니다.
 * 다시말하면, effect객체가 소멸되었어도 destroy함수를 사용할 수 있는데
 * 이 때를 위한 객체가 바로 EffectInstance입니다.
 * 추후 그 문맥과 시점을 정확히 할 예정입니다.
 */
const TEffectInstacne = {
    destroy: undefined | Function,
};
