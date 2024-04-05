import SyntheticEvent from "./syntheticEvent.js";

/**
 * @description 클립보드 이벤트를 위한 SyntheticEvent 확장. 클립보드 데이터 접근을 가능하게 합니다.
 */
const SyntheticClipboardEvent = SyntheticEvent.extend({
    clipboardData: (event) => {
        return "clipboardData" in event ? event.clipboardData : window.clipboardData;
    },
});

export default SyntheticClipboardEvent;

// 예시: 사용자가 텍스트를 복사하거나 붙여넣을 때, 클립보드 데이터를 로그로 출력합니다.
// CSS는 필요하지 않습니다.
// // React 코드:
// class MyComponent extends React.Component {
//   handleCopy = (event) => {
//     console.log('Copied text:', event.clipboardData.getData('text'));
//   };

//   handlePaste = (event) => {
//     console.log('Pasted text:', event.clipboardData.getData('text'));
//   };

//   render() {
//     return (
//       <div onCopy={this.handleCopy} onPaste={this.handlePaste}>
//         Copy or paste something here.
//       </div>
//     );
//   }
// }
