import { MAGIC_NUMBER_OFFSET, Idle, Sync } from "../const/CExpirationTime.js";
import { ImmediatePriority, IdlePriority, UserBlockingPriority, NormalPriority } from "../const/CRfsPriorityLevel.js";
//(ms / UNIT_SIZE) | 0 == Floor(ms / UNIT_SIZE)
//자바 스크립트는 |0->비트Or연산자-> 피연산자 32비트 정수로 변환
//앞선 피 연산자가 32비트 정수로 변환됨 그리고 | 0을 하면 원하는 정수 나옴 -> 더 빠름
//음수에는 적용 안되는게 단점
//10ms이유 : Reference: https://web.dev/articles/rail?hl=ko#%EC%82%AC%EC%9A%A9%EC%9E%90%EC%97%90%EA%B2%8C-%EC%A7%91%EC%A4%91
//
// 0~16밀리초영역
//	사용자는 모션을 추적하는 데 매우 능숙하며, 애니메이션이 매끄럽지 않으면 싫어합니다. 초당 60개의 새로운 프레임이 렌더링된다면 애니메이션을 부드럽게 인식합니다.
// 프레임당 16ms이며 브라우저에서 새 프레임을 화면에 그리는 데 걸리는 시간을 포함하여 앱에서 프레임을 생성하는 데 약 10ms가 걸립니다.
// 하나의 앱에서 프레임을 생성하는데 약 10ms가 걸림으로 1유닛의 만료시간은 10ms이다.
// 1 unit of expiration time represents 10ms.
const UNIT_SIZE = 10;
export const msToExpirationTime = (ms) => {
    return MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0);
};

export const expirationTimeToMs = (expirationTime) => {
    return (MAGIC_NUMBER_OFFSET - expirationTime) * UNIT_SIZE;
};

// 앞서서 와 같은원리로 number | 0 으로 floor를 구하고 + 1을 해서 올림을 구함
// 정밀도란 정밀도를 기준으로 올림을 할지 안할것을 정하는 것임으로 수에 정밀도를 나눠서 올림을 하고 다시
// 정밀도를 곱해서 수를 복원함
const ceiling = (num, precision) => {
    return (((num / precision) | 0) + 1) * precision;
};
// https://github.com/facebook/react/pull/10426
//버킷에 잘 담아서 묶어서 처리하는 것
// 업 만료 시간은 React가 어떤 작업을 언제 처리해야 할지 결정하는 데 사용되는 값입니다.

// computeExpirationBucket 함수는 현재 시간, 만료까지의 시간(ms 단위), 그리고 버킷 크기(ms 단위)를 입력으로 받아 만료 시간을 계산합니다.
// 이 함수는 주어진 만료 시간을 버킷화하여 작업의 우선 순위를 결정합니다.
// 버킷화는 작업을 특정 우선 순위 그룹에 할당하여 비슷한 우선 순위의 작업을 함께 처리할 수 있게 합니다.

// computeAsyncExpiration 함수는 비동기 작업의 만료 시간을 계산하는 데 사용됩니다.
// 이 함수는 computeExpirationBucket을 사용하여 현재 시간에 기반한 만료 시간을 계산합니다.
//  여기서 LOW_PRIORITY_EXPIRATION은 비동기 작업의 기본 만료 시간(5000ms)을 나타내고,
// LOW_PRIORITY_BATCH_SIZE는 버킷 크기(250ms)를 나타냅니다.

// 왜 5000ms와 250ms인가?
// 5000ms (LOW_PRIORITY_EXPIRATION): 이 값은 비동기 작업에 대해 상대적으로 낮은 우선 순위를 설정합니다.
// React는 이러한 작업을 가능한 한 빨리 처리하려고 하지만, 사용자 상호작용이나 다른 중요한 작업을 방해하지 않는 선에서 처리합니다. 5000ms는 사용자 경험에 큰 영향을 주지 않으면서도 백그라운드에서 충분히 빠르게 처리될 수 있는 합리적인 기본값을 제공합니다.

// 250ms (LOW_PRIORITY_BATCH_SIZE): 이 값은 비동기 작업을 처리할 때 사용되는 버킷의 크기를 설정합니다.
// 250ms는 작업을 적절한 크기로 그룹화하여, 이벤트 루프가 다른 중요 작업을 방해받지 않으면서도 여러 비동기 작업을 효율적으로 처리할 수 있게 합니다.

// computeExpirationBucket 함수의 계산 방식
// computeExpirationBucket 함수는 현재 시간에 만료까지의 시간을 더한 후, 이를 버킷 크기로 나누어 만료 시간을 계산합니다.
// 이 과정은 작업의 우선 순위를 결정하고, 비슷한 만료 시간을 가진 작업을 함께 처리할 수 있도록 버킷에 그룹화하는 데 도움을 줍니다.
// 천장 함수(ceiling)는 결과값을 버킷 크기의 배수로 올림하여, 작업이 속할 버킷을 결정합니다.
// 이 방식은 작업이 특정 버킷에 균일하게 분포되도록 하여, 작업 처리의 효율성을 최적화합니다.
/**
 * @param {TExpirationTime} currentTime @see 파일경로: srcs/type/TExpirationTime.js
 * @param {TExpirationTime} expirationInMs
 * @param {number} bucketSizeMs
 * @returns {TExpirationTime}
 */
const computeExpirationBucket = (currentTime, expirationInMs, bucketSizeMs) => {
    return (
        MAGIC_NUMBER_OFFSET -
        ceiling(MAGIC_NUMBER_OFFSET - currentTime + expirationInMs / UNIT_SIZE, bucketSizeMs / UNIT_SIZE)
    );
};

export const NORMAL_PRIORITY_EXPIRATION = 5000;
export const NORMAL_PRIORITY_BATCH_SIZE = 250;

/**
 *
 * @param {TExpirationTime} currentTime @see 파일경로: srcs/type/TExpirationTime.js
 * @returns {TExpirationTime}
 */
export const computeAsyncExpiration = (currentTime) => {
    return computeExpirationBucket(currentTime, NORMAL_PRIORITY_EXPIRATION, NORMAL_PRIORITY_BATCH_SIZE);
};

//https://dev.to/deanius/the-thresholds-of-perception-in-ux-435g
//앞선 Ux를 기반으로 ux에 대해서 150ms이하로 반응을 해야함 NormalPriority에 대해서
export const HIGH_PRIORITY_EXPIRATION = 150;
export const HIGH_PRIORITY_BATCH_SIZE = 100;

/**
 *
 * @param {TExpirationTime} currentTime
 * @returns {TExpirationTime}
 * @description Interative한 작업을 위한 만료시간을 계산합니다.
 * @description 해당 근거는 앞선 근거에서 ineractive한 작업을 위한 ux에 대해서 150ms이하로 반응을 해야함으로
 * @description 이를 기반으로 만료시간을 계산합니다.
 */
export const computeInteractiveExpiration = (currentTime) => {
    return computeExpirationBucket(currentTime, HIGH_PRIORITY_EXPIRATION, HIGH_PRIORITY_BATCH_SIZE);
};
/**
 *
 * @param {TExpirationTime} currentTime @see 파일경로: `srcs/type/TExpirationTime.js`
 * @param {TExpirationTime} expirationTime @see 파일경로: `srcs/type/TExpirationTime.js`
 * @description currentTime과 expirationTime으로 우선순위를 추론합니다.
 * @returns {TRfsPriorityLevel}
 */
export const inferPriorityFromExpirationTime = (currentTime, expirationTime) => {
    if (expirationTime === Sync) {
        return ImmediatePriority;
    }
    if (expirationTime === Idle) {
        return IdlePriority;
    }
    const msUntil = expirationTimeToMs(expirationTime) - expirationTimeToMs(currentTime);
    if (msUntil <= 0) {
        return ImmediatePriority;
    }
    if (msUntil <= HIGH_PRIORITY_EXPIRATION + HIGH_PRIORITY_BATCH_SIZE) {
        return UserBlockingPriority;
    }
    if (msUntil <= NORMAL_PRIORITY_EXPIRATION + NORMAL_PRIORITY_BATCH_SIZE) {
        return NormalPriority;
    }
};
