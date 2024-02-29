/**
 * @file TExpirationTime.js
 * @description
 *     //Expiration Time
    //기본적으로 scheduler와 reconciler에서 사용되는 Context가 다르다.
    //scheduler에서는 Task의 만료시간을 의미하고
    //reconciler에서는 이벤트가 발생한 시간, 즉 dispatcher에 의해 트리거 된 시간을 의미한다.
    //이는 해당 이벤트를 구분하는 기준으로 쓰일 수 있다.
    //이에 reconciler에서는 expiratonTime에서 발생한 연속적인 이벤트를 하나의 이벤트로 간주한다.
    //Todo: implement ExpirationTime
    //좀더 자세한 내용은 해당 파일에 명세할 예정.
    //자식과 현재 파이버의 만료시간이 분리되어 bailOut에 사용된다.
 */

//31비트인 이유 :
// VM(실제로는 대부분 V8)은 가능한 경우 정수 유형에 최적화하려고 하기 때문에 32비트 시스템에서 단일 32비트 단어에 맞추기를 원할 때가 있습니다.
// 이 숫자로 인해 이러한 가정을 포기하고 슬롯을 확장해야 할 수도 있습니다.
const MAX_SIGNED_31_BIT_INT = 1073741823;
export const TExpirationTime = Number; // only for editor to recognize the type
//만료시간 자체의 값 자체를 우선순위 값으로 바라볼 수 있다.
//Sync가 가장 우선순위가 크게 있음으로 가능한 가장 큰 수인 MAX_SIGNED_31_BIT_INT를 사용한다.
//그다음 우선순위는 Batched로 그다음으로 큰 수인 MAX_SIGNED_31_BIT_INT - 1을 사용한다.
//expiration Time의 계산식은 general하게는 Sync - performance.now()로
export const NoWork = 0;
export const Idle = 1;
export const Sync = MAX_SIGNED_31_BIT_INT;
export const Batched = Sync - 1;
export const MAGIC_NUMBER_OFFSET = Batched - 1;
