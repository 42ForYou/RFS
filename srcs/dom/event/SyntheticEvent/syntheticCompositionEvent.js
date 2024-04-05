import SyntheticEvent from "./syntheticEvent.js";

/**
 * @description 입력 이벤트 도중 문자열 조합을 위한 SyntheticEvent 확장.
 * 일본어 입력과 같이 여러 키 입력으로 문자를 조합할 때 사용됩니다.
 */
const SyntheticCompositionEvent = SyntheticEvent.extend({
    // 조합 중인 문자열
    data: null,
});

export default SyntheticCompositionEvent;

// 예시: 사용자가 입력 중인 문자열을 로그로 출력합니다.
// React 코드:
// class MyComponent extends React.Component {
//   handleCompositionUpdate = (event) => {
//     console.log('Currently composing characters:', event.data);
//   };

//   render() {
//     return <input onCompositionUpdate={this.handleCompositionUpdate} />;
//   }
// }
