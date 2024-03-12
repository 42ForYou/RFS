/**
 * @module TSchedulerPriority
 * @description 스케쥴러의 우선순위를 정의하는 타입
 */

/**
 * @typedef {number} TSchedulerPriority
 */
const TSchedulerPriority = Number;

const NoPriority = 0;
const ImmediatePriority = 1;
const UserBlockingPriority = 2;
const NormalPriority = 3;
const LowPriority = 4;
const IdlePriority = 5;
