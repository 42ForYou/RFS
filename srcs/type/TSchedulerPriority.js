/**
 * @typedef {number} TSchedulerPriority
 * @description 스케쥴러의 우선순위를 정의하는 타입
 */
const TSchedulerPriority = Number;

export const NoPriority = 0;
export const ImmediatePriority = 1;
export const UserBlockingPriority = 2;
export const NormalPriority = 3;
export const LowPriority = 4;
export const IdlePriority = 5;
