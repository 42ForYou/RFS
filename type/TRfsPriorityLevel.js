/**
 * @typedef TRfsPriorityLevel = ImmediatePriority | UserBlockingPriority | NormalPriority | LowPriority | IdlePriority;
 */
const TRfsPriorityLevel = Number;
/**
 * @type {TRfsPriorityLevel}
 */
const ImmediatePriority = 99;
/**
 * @type {TRfsPriorityLevel}
 */
const UserBlockingPriority = 98;
/**
 * @type {TRfsPriorityLevel}
 */
const NormalPriority = 97;
/**
 * @type {TRfsPriorityLevel}
 */
const LowPriority = 96;
/**
 * @type {TRfsPriorityLevel}
 */
const IdlePriority = 95;

//오직 리액트 문맥에서만 존재함-> 만약 이게 interface에 의해 불린다면
//에러
/**
 * @type {TRfsPriorityLevel}
 */
const NoPriority = 90;
