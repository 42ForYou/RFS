/**
 * @typedef {Number} TEventPriority를 정의
 * @description discrete event는 0, user blocking event는 1, continuous event는 2로 정의한다.
 */
const TEventPriority = Number;

export const DiscreteEvent = 0;
export const UserBlockingEvent = 1;
export const ContinuousEvent = 2;
