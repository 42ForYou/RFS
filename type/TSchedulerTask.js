/**
 * @typedef {Object} TSchedulerTask
 * @description 스케쥴러의 태스크를 정의하는 타입
 */

import { TSchedulerPriority } from "./TSchedulerPriority.js";
import { TExpirationTime } from "./TExpirationTime.js";
const TSchedulerTask = {
    id: Number,
    callback: Function,
    priorityLevel: TExpirationTime,
    startTime: TExpirationTime,
    expirationTime: TExpirationTime,
    sortIndex: Number,
};
