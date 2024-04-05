import SyntheticUIEvent from "./syntheticUIEvent";
import getEventModifierState from "./getEventModifierState";

/**
 * @description SyntheticTouchEvent 는 SyntheticUIEvent 를 확장한 인터페이스이다.
 */
const SyntheticTouchEvent = SyntheticUIEvent.extend({
    //   syntheticTouchEvent는 터치 이벤트에 대한 rfs 추상화로, 웹 애플리케이션에서 터치 입력을 다룰 때 일관된 인터페이스를 제공합니다. 이는 다양한 브라우저에서 발생하는 터치 이벤트의 차이점을 줄이기 위해 설계되었습니다. 각 프로퍼티에 대한 설명과 사용 예시는 다음과 같습니다:

    // touches: 현재 화면에 닿아 있는 모든 터치 포인트의 리스트입니다. 예를 들어, 사용자가 화면에 두 손가락을 올렸다면, 이 리스트에는 두 개의 터치 포인트 정보가 포함됩니다.

    // targetTouches: 현재 이벤트가 발생한 DOM 요소에 닿아 있는 터치 포인트들의 리스트입니다. 만약 터치 이벤트가 특정 요소에서 발생했다면, 그 요소 위에 있는 터치 포인트들만이 이 리스트에 포함됩니다.

    // changedTouches: 이벤트 발생에 직접 관련된 터치 포인트들의 리스트입니다. 예를 들어, 사용자가 손가락을 들어 올렸다면, 그 손가락에 해당하는 터치 포인트만이 이 리스트에 포함됩니다.

    // altKey, metaKey, ctrlKey, shiftKey: 이벤트가 발생했을 때 각각 Alt, Meta(Command나 Windows 키), Ctrl, Shift 키가 눌려져 있었는지를 나타냅니다. 각각 true 또는 false 값을 가질 수 있습니다.

    // getModifierState: 주어진 키가 활성화되어 있는지의 상태를 확인하는 함수입니다. 예를 듩면, event.getModifierState('Shift')는 사용자가 Shift 키를 누르고 있는지를 확인할 때 사용됩니다.
    touches: null,
    targetTouches: null,
    changedTouches: null,
    altKey: null,
    metaKey: null,
    ctrlKey: null,
    shiftKey: null,
    getModifierState: getEventModifierState,
});
// class MyComponent extends React.Component {
//   handleTouchMove = (event) => {
//     console.log('터치 포인트 수:', event.touches.length);
//     if (event.getModifierState('Shift')) {
//       console.log('Shift 키가 눌려져 있습니다.');
//     }
//   };

//   render() {
//     return <div onTouchMove={this.handleTouchMove}>터치하여 이동하세요</div>;
//   }
// }

export default SyntheticTouchEvent;
