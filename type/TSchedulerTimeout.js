/**
 * @tyedef {Number} TSchedulerTimeout
 * @description 스케쥴러의 타임아웃을 정의하는 타입
 */

const TSchedulerTimeout = Number;

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
const maxSigned31BitInt = 1073741823;
const IMMEDIATE_PRIORITY_TIMEOUT = -1;
const USER_BLOCKING_PRIORITY_TIMEOUT = 250;
const NORMAL_PRIORITY_TIMEOUT = 5000;
const LOW_PRIORITY_TIMEOUT = 10000;
//타임아웃이 일어나지 않음
const IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;
