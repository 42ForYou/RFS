/**
 * @module CExecutaionContext
 * @description 현재 Rfs의 실행스택에 어디에 위치하는지를 나타낸다.
 */

//실행을 아무것도 안하고 있음
export const NoContext = /*                    */ 0b000000;

//배치를 하고있는 상태
export const BatchedContext = /*               */ 0b000001;

//이벤트를 처리하고 있는 상태
//TODO: 이부분에 대한 더 자세한 설명이 필요하다
export const EventContext = /*                 */ 0b000010;
// DiscreteEvent (이산 이벤트)는 우선 순위가 0으로 가장 높다. 이산 이벤트는 사용자의 직접적인 상호작용에 응답해야 하는 이벤트이며, 예를 들어, 클릭(onClick), 키 입력(onKeyPress) 등이 여기에 해당한다. 사용자의 행동에 대한 즉각적인 피드백이 필요하기 때문에 가장 높은 우선 순위를 갖는다.

// UserBlockingEvent (사용자 차단 이벤트)는 우선 순위가 1이다. 사용자 차단 이벤트는 애플리케이션의 반응성을 유지하기 위해 신속하게 처리되어야 하지만, 이산 이벤트만큼 즉각적인 반응을 요구하지 않는 이벤트이다. 예를 들어, 입력 필드에서의 텍스트 입력과 같이 사용자가 연속적인 행동을 취할 때 발생하는 이벤트가 이에 해당할 수 있다.

// ContinuousEvent (연속 이벤트)는 우선 순위가 2로 가장 낮다. 연속 이벤트는 사용자와의 상호작용 중 연속적으로 발생할 수 있는 이벤트이며, 예를 들어, 스크롤(onScroll), 마우스 이동(onMouseMove), 윈도우 리사이징(onResize) 등이 여기에 해당한다. 이러한 이벤트는 애플리케이션의 성능에 영향을 미칠 수 있으므로, 필요에 따라 업데이트 빈도를 조절하여 처리된다.

export const DiscreteEventContext = /*         */ 0b000100;
//Legacy Render와 관련된걸로 보임 TODO: 확정되면 완전히 제거
// export const LegacyUnbatchedContext = /*       */ 0b001000;
//렌더를 하는중
export const RenderContext = /*                */ 0b010000;
//커밋을 하는중
export const CommitContext = /*                */ 0b100000;
