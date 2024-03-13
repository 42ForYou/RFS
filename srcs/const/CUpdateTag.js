/**
 * @module TUpdateTag
 */

/**
 * @typedef {number} TUpdateTag
 */
//TODO: 정확히 명세를 설명할 필요가 있음
//해당 관련된 업데이트는 사실 밑에 UpdateState는 일반적으로 클래스컴포넌트의
//SetState와 관련되 있으며 함수형 컴포넌트랑은 별로 관련이 없음
export const UpdateState = 0;
//TODO:이것도 classCOmponent를 위한것같긴한데 확인 해야됨 -->뺼것같음
export const ReplaceState = 1;

//NOTE: 확실하진 않지만 forceUpdate와 throw를 위한 update시스템은 구현안함
//리액트의 forceUpdate API와 관련 있음
// export const ForceUpdate = 2;
// forceUpdate는 주로 클래스 컴포넌트에서 사용되는 API입니다.
// 이 메소드는 React에게 컴포넌트의 render 메소드를 다시 실행하도록 강제하며,
// 이를 통해 컴포넌트를 강제로 리렌더링할 수 있습니다.
//  forceUpdate는 컴포넌트의 state나 props가 변경되지 않았을 때에도 리렌더링을 실행할 수 있게 해줍니다.
// 하지만, 이 메소드는 React의 선언적인 데이터 흐름 패러다임과는 거리가 있기 때문에,
// 가능한 사용을 피하는 것이 좋습니다. 대신, 컴포넌트의 상태나 속성이 변경될 때
// 리렌더링이 발생하도록 설계하는 것이 권장됩니다.
//리액트 내부의 에러 관리 업데이트 시스템이 이런 방식으로 업데이트를 관리함
// export const CaptureUpdate = 3;

//TODO: 만약 HostRoot쪽 코드를 이걸 이용하는게 아니라 수정이 가능하면 수정 하는게 좀더 좋은 방안일 수 있음
//TODO: 하지만 아직은 이걸 이용하기로 함
