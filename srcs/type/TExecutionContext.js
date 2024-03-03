/**
 * @description 현재 Rfs의 실행스택에 어디에 위치하는지를 나타낸다.
 */
const TExecutionContext = Number;

//실행을 아무것도 안하고 있음
export const NoContext = /*                    */ 0b000000;

//배치를 하고있는 상태
export const BatchedContext = /*               */ 0b000001;

//이벤트를 처리하고 있는 상태
//TODO: 이부분에 대한 더 자세한 설명이 필요하다
export const EventContext = /*                 */ 0b000010;
//TODO: 이부분에 대한 더 자세한 설명이 필요하다
// export const DiscreteEventContext = /*         */ 0b000100;
export const LegacyUnbatchedContext = /*       */ 0b001000;
//렌더를 하는중
export const RenderContext = /*                */ 0b010000;
//커밋을 하는중
export const CommitContext = /*                */ 0b100000;
