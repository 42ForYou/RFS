import SyntheticUIEvent from "./syntheticUIEvent.js";

/**
 * @description 포커스 이벤트를 위한 SyntheticEvent 확장. 관련 대상을 포함합니다.
 */
const SyntheticFocusEvent = SyntheticUIEvent.extend({
    relatedTarget: null,
});
// function MyComponent() {
//     const handleFocus = (event) => {
//       console.log("Focused on: ", event.target);
//       console.log("Previously focused: ", event.relatedTarget);
//     };

//     const handleBlur = (event) => {
//       console.log("Lost focus from: ", event.target);
//       console.log("Next focused: ", event.relatedTarget);
//     };

//     return (
//       <>
//         <input type="text" onFocus={handleFocus} onBlur={handleBlur} />
//         <input type="text" onFocus={handleFocus} onBlur={handleBlur} />
//       </>
//     );
//   }
// 이 예시에서는 두 개의 <input> 요소 사이에서 포커스가 이동할 때마다
//  해당 이벤트의 발생 요소(event.target)와 이전 또는 다음으로 포커스가
//   이동한 요소(event.relatedTarget)에 대한 정보를 콘솔에 출력합니다.
//    예를 들어, 첫 번째 입력 필드에서 두 번째 입력 필드로 포커스를 이동시키면,
//    첫 번째 입력 필드의 onBlur 이벤트에서 event.relatedTarget은
//    두 번째 입력 필드를 가리킵니다. 반대로 두 번째 입력 필드의 onFocus
//    이벤트에서 event.relatedTarget은 첫 번째 입력 필드를 가리키게 됩니다.
export default SyntheticFocusEvent;
