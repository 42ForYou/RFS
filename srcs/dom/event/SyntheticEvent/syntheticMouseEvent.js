import SyntheticUIEvent from "./syntheticUIEvent.js";
import getEventModifierState from "./getEventModifierState.js";

let previousScreenX = 0;
let previousScreenY = 0;
let isMovementXSet = false;
let isMovementYSet = false;
// creenX와 screenY
// screenX와 screenY는 전체 스크린(모니터) 기준으로 마우스의 위치를 나타냅니다. 즉, 모니터의 왼쪽 상단 모서리가 (0, 0)이 됩니다. 여러 모니터 설정에서도 마찬가지로 전체 확장된 화면에 대한 위치를 나타냅니다.
// clientX와 clientY
// clientX와 clientY는 브라우저의 뷰포트(현재 보이는 영역)를 기준으로 한 마우스의 위치를 나타냅니다. 뷰포트의 왼쪽 상단 모서리가 (0, 0)입니다. 스크롤을 내리거나 오른쪽으로 이동해도, 뷰포트 기준의 좌표는 변하지 않습니다.
// pageX와 pageY
// pageX와 pageY는 전체 문서를 기준으로 한 마우스의 위치를 나타냅니다. 만약 문서가 스크롤될 수 있다면, pageX와 pageY는 스크롤된 양을 포함하여 마우스 위치를 나타냅니다. 따라서, 스크롤을 내릴수록 pageY 값은 증가합니다.
/**
 * @description 마우스 이벤트를 나타내는 SyntheticEvent 확장.
 */
const SyntheticMouseEvent = SyntheticUIEvent.extend({
    // screenX, screenY: 마우스 이벤트가 발생한 화면의 X, Y 좌표입니다.
    screenX: null,
    screenY: null,

    // clientX, clientY: 뷰포트(브라우저 화면) 기준의 X, Y 좌표입니다.
    clientX: null,
    clientY: null,

    //pageX, pageY: 전체 문서 기준의 X, Y 좌표입니다.
    pageX: null,
    pageY: null,

    //ctrlKey, shiftKey, altKey, metaKey: 각각 Ctrl, Shift, Alt(Option), Meta(Command/Windows) 키가 이벤트 발생 시 눌려있는지의 여부입니다.
    ctrlKey: null,
    shiftKey: null,
    altKey: null,
    metaKey: null,

    //getModifierState 메서드는 특정 키(예: 'Shift', 'Control' 등)가 이벤트 발생 시 눌려있는지를 확인하는 함수입니다.
    // handleKeyPress = (e) => {
    //     if (e.getModifierState('Shift')) {
    //       console.log('Shift key is pressed.');
    //     }
    //   }
    //   위 예시와 같이, SyntheticMouseEvent에서 getModifierState를 사용하여 이벤트 처리 시 특정 보조 키의 상태를 확인할 수 있습니다. 이를 통해 보다 복잡한 입력 상호작용을 처리하는 로직을 구현할 수 있습니다.
    getModifierState: getEventModifierState,
    //     button, buttons: 마우스 버튼의 상태를 나타냅니다. button은 클릭된 버튼을, buttons는 동시에 눌린 버튼을 비트마스크 형태로 나타냅니다.
    // relatedTarget: 특정 이벤트(예: mouseover, mouseout)에서 이벤트 대상과 관련된 대상 요소입니다.
    button: null,
    buttons: null,
    // relatedTarget: 특정 이벤트(예: mouseover, mouseout)에서 이벤트 대상과 관련된 대상 요소입니다.
    relatedTarget: (event) => {
        return event.relatedTarget || (event.fromElement === event.srcElement ? event.toElement : event.fromElement);
    },
    // movementX, movementY: 마지막 이벤트 이후 마우스의 이동 거리를 나타냅니다. 페이지나 요소가 이동한 경우 이 값을 사용하여 상대적인 마우스 위치를 파악할 수 있습니다.
    movementX: (event) => {
        if ("movementX" in event) {
            return event.movementX;
        }

        const screenX = previousScreenX;
        previousScreenX = event.screenX;

        if (!isMovementXSet) {
            isMovementXSet = true;
            return 0;
        }

        return event.type === "mousemove" ? event.screenX - screenX : 0;
    },
    movementY: (event) => {
        if ("movementY" in event) {
            return event.movementY;
        }

        const screenY = previousScreenY;
        previousScreenY = event.screenY;

        if (!isMovementYSet) {
            isMovementYSet = true;
            return 0;
        }

        return event.type === "mousemove" ? event.screenY - screenY : 0;
    },
});
// class MouseEventComponent extends React.Component {
//     handleMouseMove = (e) => {
//       console.log(`Mouse moved: ${e.movementX}, ${e.movementY}`);
//     };

//     render() {
//       return (
//         <div onMouseMove={this.handleMouseMove} style={{ width: "100%", height: "100vh" }}>
//           Move your mouse around.
//         </div>
//       );
//     }
//   }

export default SyntheticMouseEvent;
