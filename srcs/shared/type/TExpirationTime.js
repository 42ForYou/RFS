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
export const TExpirationTime = Number; // only for editor to recognize the type
export const NoWork = 0;
// Todo : to implement the type
