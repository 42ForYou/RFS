import SyntheticEvent from "./syntheticEvent.js";
/**
 * @description 입력 이벤트를 위한 SyntheticEvent 확장. 데이터를 포함합니다.
 */
const SyntheticInputEvent = SyntheticEvent.extend({
    // 현 입력된 값
    data: null,
});
// function MyComponent() {
//     const handleInputChange = (event) => {
//       console.log(event.data); // 현재 입력된 값
//     };

//     return <input type="text" onInput={handleInputChange} />;
//   }

export default SyntheticInputEvent;
