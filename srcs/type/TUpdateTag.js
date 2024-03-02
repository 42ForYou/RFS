export const TUpdateTag = Number;
//TODO: 정확히 명세를 설명할 필요가 있음
//해당 관련된 업데이트는 사실 밑에 UpdateState는 일반적으로 클래스컴포넌트의
//SetState와 관련되 있으며 함수형 컴포넌트랑은 별로 관련이 없음
export const UpdateState = 0;
export const ReplaceState = 1;

//리액트의 forceUpdate API와 관련 있음
export const ForceUpdate = 2;
//리액트 내부의 에러 관리 업데이트 시스템이 이런 방식으로 업데이트를 관리함
export const CaptureUpdate = 3;

//TODO: 만약 HostRoot쪽 코드를 이걸 이용하는게 아니라 수정이 가능하면 수정 하는게 좀더 좋은 방안일 수 있음
//TODO: 하지만 아직은 이걸 이용하기로 함
