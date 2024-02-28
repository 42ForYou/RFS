export const TSideEffectFlags = Number;

// 해당 파이버가 일을 안하고 있는것을 의미한다
export const NoEffect = /*              */ 0b0000000000000;

//해당 파이버가 일을 하고 있는것을 의미한다
export const PerformedWork = /*         */ 0b0000000000001;

//파이버는 Fiber.js에서 언급한것처럼 덕타이핑 방식으로 파이버 그자체가 될수도, 사이드 이펙트가 될 수 있는데
//사이드 이펙트로 작동될때 사용되는 플래그이다

//해당 파이버의 이동을 나타낸다
export const Placement = /*             */ 0b0000000000010;

//해당 파이버의 업데이트를 나타낸다
export const Update = /*                */ 0b0000000000100;

//해당 파이버의 이동과 업데이트를 나타낸다->Or연산으로 사용된다
export const PlacementAndUpdate = /*    */ 0b0000000000110;

//해당 파이버의 삭제를 나타낸다
export const Deletion = /*              */ 0b0000000001000;

//컨텐트를 리셋해야하는것을 나타낸다
export const ContentReset = /*          */ 0b0000000010000;

//Todo:아직 정확히 어떤것을 나타내는지 모르겠다
export const Callback = /*              */ 0b0000000100000;

//Suspense에 사용되는 플래그이다.(정확하진 않음 )
// export const DidCapture = /*            */ 0b0000001000000;

//Ref를 관리하기 위한 플래그로 추측된다
//Todo:좀더 정확한 정보가 필요하다
export const Ref = /*                   */ 0b0000010000000;

//클래스 파이버의 경우에만 사용되는 플래그이다
//생애주기 매서드와 연관되어 있다.classCOmponent의 getSnapshotBeforeUpdate에서 사용된다
// export const Snapshot = /*              */ 0b0000100000000;

//useEffect에 의해 생성되는 사이드 이펙트의 플래그이다
export const Passive = /*               */ 0b0001000000000;

// Passive & Update & Callback & Ref  우리 리액트는 이것을 사용한다
export const LifecycleEffectMask = /*   */ 0b000100100100;

// Passive & Update & Callback & Ref & Snapshot 본리액트는 이것을 사용한다
// export const LifecycleEffectMask = /*   */ 0b000110100100;
// export const Snapshot = /*              */ 0b0000100000000;

//서버사이드 렌더링을 위한 플래그로 사용된다
//RFS에서는 사용되지 않는다
// export const Hydrating = /*             */ 0b0010000000000;
// export const HydratingAndUpdate = /*    */ 0b0010000000100;

//본 리액트에서 사용되는 HostEffectMask이다
// export const HostEffectMask = /*        */ 0b0011111111111; //본 리액트
// export const Snapshot = /*              */ 0b0000100000000;
// export const DidCapture = /*            */ 0b0000001000000;
// export const Hydrating = /*             */ 0b0010000000000;
// 위에 구현하지 않은 플래그를 사용하지 않는다 RFs에서는
// export const HostEffectMask = /*        */ 0b0001010111111;
export const HostEffectMask = /*        */ 0b0001010111111;

//Todo:아직 정확히 어떤것을 나타내는지 모르겠다
export const Incomplete = /*            */ 0b0100000000000;

//suspense와 관련되는 플래그로 예측된다
//Todo:좀더 정확한 정보가 필요하다
// export const ShouldCapture = /*         */ 0b1000000000000;
