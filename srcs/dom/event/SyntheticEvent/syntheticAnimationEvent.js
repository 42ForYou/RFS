import SyntheticEvent from "./syntheticEvent.js";
/**
 * @description SyntheticEvent를 확장한 SyntheticAnimationEvent
 */
const SyntheticAnimationEvent = SyntheticEvent.extend({
    animationName: null,
    elapsedTime: null,
    pseudoElement: null,
});

// animationName: 발생한 애니메이션의 이름을 나타냅니다. CSS에서 @keyframes로 정의한 애니메이션 이름과 일치합니다.

// elapsedTime: 애니메이션이 시작된 후 경과한 시간(초 단위)을 나타냅니다.
// 이 값은 애니메이션이 완료되거나 animationiteration 이벤트가 발생했을 때,
// 애니메이션의 한 사이클이 얼마나 걸렸는지 알려줍니다.

// pseudoElement: 애니메이션이 적용된 가상 요소의 선택자를 나타냅니다.
// 예를 들어, ::before나 ::after와 같은 가상 요소에 애니메이션이 적용되었을 경우,
// 해당 가상 요소의 선택자를 이 필드를 통해 알 수 있습니다.

//NOTE: ex)
//NOTE: css
// @keyframes example {
//   from { background-color: red; }
//   to { background-color: yellow; }
// }

// .animated-element {
//   animation-name: example;
//   animation-duration: 2s;
// }

// class MyComponent extends React.Component {
//   handleAnimationStart = (event) => {
//       console.log(`Animation named ${event.animationName} started, will last ${event.elapsedTime} seconds.`);
//   };

//   handleAnimationEnd = (event) => {
//       console.log(`Animation named ${event.animationName} ended after ${event.elapsedTime} seconds.`);
//   };

//   render() {
//       return <div
//           className="animated-element"
//           onAnimationStart={this.handleAnimationStart}
//           onAnimationEnd={this.handleAnimationEnd}>
//               This element will be animated.
//           </div>;
//   }
// }

export default SyntheticAnimationEvent;
