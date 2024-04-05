import SyntheticMouseEvent from "./syntheticMouseEvent";

/**
 * @description 휠 이벤트를 나타내는 SyntheticEvent 확장.
 */
const SyntheticWheelEvent = SyntheticMouseEvent.extend({
    //     SyntheticWheelEvent는 마우스 휠 또는 트랙패드를 사용한 스크롤링 같은 "휠" 이벤트를 나타내기 위한 rfs SyntheticEvent 확장입니다. 사용자가 마우스 휠을 사용하거나 트랙패드를 스와이프할 때 발생하는 이벤트를 추상화하여, 브라우저 간의 일관된 인터페이스를 제공합니다.

    // 프로퍼티 설명
    // deltaX: 수평 방향으로의 스크롤 양을 나타냅니다. 기본적으로 deltaX 값을 사용하지만, Webkit 기반 브라우저에서는 wheelDeltaX를 사용하고, 이 값을 음수로 변환하여 오른쪽 스크롤을 양수로 나타냅니다.

    // deltaY: 수직 방향으로의 스크롤 양을 나타냅니다. deltaY 값을 기본으로 사용하며, wheelDeltaY나 wheelDelta를 대체로 사용하여 아래로 스크롤할 때 양수 값을 가집니다.

    // deltaZ: 스크롤의 Z축 양을 나타냅니다. 현재는 null로 설정되어 있으며, 3D 스크롤링 이벤트에서 사용될 수 있습니다.

    // deltaMode: 스크롤 단위를 나타냅니다. 예를 들어, 픽셀 단위인지 라인 단위인지를 나타냅니다.

    deltaX(event) {
        return "deltaX" in event
            ? event.deltaX
            : // Fallback to `wheelDeltaX` for Webkit and normalize (right is positive).
              "wheelDeltaX" in event
              ? -event.wheelDeltaX
              : 0;
    },
    deltaY(event) {
        return "deltaY" in event
            ? event.deltaY
            : // Fallback to `wheelDeltaY` for Webkit and normalize (down is positive).
              "wheelDeltaY" in event
              ? -event.wheelDeltaY
              : // Fallback to `wheelDelta` for IE<9 and normalize (down is positive).
                "wheelDelta" in event
                ? -event.wheelDelta
                : 0;
    },
    deltaZ: null,

    deltaMode: null,
});
// class MyComponent extends React.Component {
//     handleWheel = (event) => {
//       console.log(`수평 스크롤: ${event.deltaX}, 수직 스크롤: ${event.deltaY}`);
//     };

//     render() {
//       return <div onWheel={this.handleWheel}>여기에 마우스 휠을 사용해보세요</div>;
//     }
//   }

export default SyntheticWheelEvent;
