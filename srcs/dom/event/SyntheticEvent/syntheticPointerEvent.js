import SyntheticMouseEvent from "./syntheticMouseEvent";

/**
 * @description SyntheticEvent를 확장한 SyntheticPointerEvent
 */
const SyntheticPointerEvent = SyntheticMouseEvent.extend({
    //     pointerId: 포인터의 고유 식별자입니다. 동시에 여러 포인터(예: 멀티 터치)가 활성화될 수 있으며, 각각의 포인터를 구분할 때 사용됩니다.

    // width: 포인터의 접촉 영역 너비입니다. 예를 들어, 터치 스크린에서 손가락이 화면에 닿는 영역의 너비를 의미할 수 있습니다.

    // height: 포인터의 접촉 영역 높이입니다.

    // pressure: 포인터의 압력 정도입니다. 펜이나 터치 스크린에서 얼마나 강하게 누르고 있는지를 나타냅니다.

    // tangentialPressure: 펜과 같은 포인터 장치의 접선 방향 압력을 나타냅니다.

    // tiltX: X축을 기준으로 한 포인터의 기울기 각도입니다.

    // tiltY: Y축을 기준으로 한 포인터의 기울기 각도입니다.

    // twist: 회전 입력 장치(예: 펜)의 회전 각도입니다.

    // pointerType: 포인터의 유형을 나타냅니다. 예를 들어, "mouse", "pen", "touch" 등이 될 수 있습니다.

    // isPrimary: 이 포인터가 주 포인터(첫 번째 터치나 주 마우스 버튼 클릭)인지 여부를 나타냅니다.
    pointerId: null,
    width: null,
    height: null,
    pressure: null,
    tangentialPressure: null,
    tiltX: null,
    tiltY: null,
    twist: null,
    pointerType: null,
    isPrimary: null,
});
// class MyComponent extends React.Component {
//     handlePointerDown = (event) => {
//       console.log(`Pointer ${event.pointerId} is down`);
//       console.log(`Pressure: ${event.pressure}`);
//     };

//     render() {
//       return <div onPointerDown={this.handlePointerDown}>Click or touch here</div>;
//     }
//   }

export default SyntheticPointerEvent;
