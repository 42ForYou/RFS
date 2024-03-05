/**
 * @typedef TRfsPriorityLevel = ImmediatePriority | UserBlockingPriority | NormalPriority | LowPriority | IdlePriority;
 */
export const TRfsPriorityLevel = Number;
/**
 * @type {TRfsPriorityLevel}
 */
export const ImmediatePriority = 99;
/**
 * @type {TRfsPriorityLevel}
 */
export const UserBlockingPriority = 98;
/**
 * @type {TRfsPriorityLevel}
 */
export const NormalPriority = 97;
/**
 * @type {TRfsPriorityLevel}
 */
export const LowPriority = 96;
/**
 * @type {TRfsPriorityLevel}
 */
export const IdlePriority = 95;

//오직 리액트 문맥에서만 존재함-> 만약 이게 interface에 의해 불린다면
//에러
/**
 * @type {TRfsPriorityLevel}
 */
export const NoPriority = 90;
