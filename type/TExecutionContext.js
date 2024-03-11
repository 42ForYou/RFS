/**
 * @module TExecutionContext
 * @description 현재 Rfs의 실행스택에 어디에 위치하는지를 나타낸다.
 */

/**
 * @typedef {Number} TExecutionContext
 */
const TExecutionContext = Number;

//실행을 아무것도 안하고 있음
const NoContext = /*                    */ 0b000000;

//배치를 하고있는 상태
const BatchedContext = /*               */ 0b000001;

//이벤트를 처리하고 있는 상태
//TODO: 이부분에 대한 더 자세한 설명이 필요하다
const EventContext = /*                 */ 0b000010;
//TODO: 이부분에 대한 더 자세한 설명이 필요하다
// const DiscreteEventContext = /*         */ 0b000100;
//Legacy Render와 관련된걸로 보임 TODO: 확정되면 완전히 제거
// const LegacyUnbatchedContext = /*       */ 0b001000;
//렌더를 하는중
const RenderContext = /*                */ 0b010000;
//커밋을 하는중
const CommitContext = /*                */ 0b100000;
