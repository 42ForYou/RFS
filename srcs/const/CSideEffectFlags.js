/**
 *@file TSideEffectFlags.js
 *@description 파이버는 덕타이핑 방식으로 파이버 그자체가 될수도, 사이드 이펙트가 될 수 있는데
 *사이드 이펙트로 작동될때 어떠한 사이드 이펙트인지 식별하기 위해 사용된다
 *Work에서 파이버를 후위순위 하면서 다시 부모로 올라갈때 어떠한 사이드 이펙트를 부모로 전달하고
 *결국 FiberRoot까지 전달하게 된다
 *이를 보고 Commit단계에서 어떠한 사이드 이펙트를 처리할지 결정하게 된다
 */

// 해당 파이버가 일을 안하고 있는것을 의미한다
export const NoEffect = /*              */ 0b0000000000000;

//해당 파이버가 일을 하고 있는것을 의미한다
export const PerformedWork = /*         */ 0b0000000000001;

//파이버는 Fiber.js에서 언급한것처럼 덕타이핑 방식으로 파이버 그자체가 될수도, 사이드 이펙트가 될 수 있는데
//사이드 이펙트로 작동될때 사용되는 플래그이다

//해당 파이버의 배치를 나타낸다. 이는 해당 파이버가 새로 그 자리에 배치되었음을 나타낸다
export const Placement = /*             */ 0b0000000000010;

//해당 파이버의 업데이트를 나타낸다
export const Update = /*                */ 0b0000000000100;

//해당 파이버의 배치과 업데이트를 나타낸다->Or연산으로 사용된다
export const PlacementAndUpdate = /*    */ 0b0000000000110;

//해당 파이버의 삭제를 나타낸다
export const Deletion = /*              */ 0b0000000001000;

//컨텐트를 리셋해야하는것을 나타낸다
export const ContentReset = /*          */ 0b0000000010000;

//callback-> updaete가 되었을떄 sideEffect로 나중에 처리해야되는데, 그것을 나타낸다
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

//TODO:정확히 확인이 필요하다
//완수가 되지 않은것을 나타낸다 throw랑 관련있는데 구현하지 않을것이다
// export const Incomplete = /*            */ 0b0100000000000;

//suspense와 관련되는 플래그로 예측된다
//TODO:좀더 정확한 정보가 필요하다
// export const ShouldCapture = /*         */ 0b1000000000000;
