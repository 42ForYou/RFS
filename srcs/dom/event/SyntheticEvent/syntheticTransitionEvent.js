import SyntheticEvent from "./syntheticEvent";

/**
 * @description CSS 트랜지션 이벤트를 나타내는 SyntheticEvent 확장.
 */
const SyntheticTransitionEvent = SyntheticEvent.extend({
    //     SyntheticTransitionEvent는 CSS 트랜지션 이벤트에 대한 rfs 추상화입니다. CSS 트랜지션은 요소의 스타일을 시간에 따라 변경하려고 할 때 사용되며, 시작점과 끝점 사이의 중간 상태를 부드럽게 전환합니다. 이러한 트랜지션은 애니메이션 효과를 생성하기 위해 주로 사용됩니다. SyntheticTransitionEvent는 트랜지션 이벤트 발생 시 유용한 정보를 포함하는 SyntheticEvent의 확장입니다.

    // 프로퍼티 설명
    // propertyName: 트랜지션이 적용된 CSS 속성의 이름입니다. 예를 들어, opacity나 height와 같은 특정 스타일 속성에 대한 트랜지션이 완료되었을 때 이를 식별할 수 있습니다.

    // elapsedTime: 트랜지션이 시작된 이후 경과된 시간(초 단위)입니다. 이는 트랜지션의 지속 시간과 일치하지 않을 수 있으며, 딜레이 등의 영향을 받을 수 있습니다.

    // pseudoElement: 트랜지션이 적용된 가상 요소의 선택자입니다. 예를 들어, ::before나 ::after와 같은 가상 요소에 대한 트랜지션 정보를 얻을 수 있습니다.
    propertyName: null,
    elapsedTime: null,
    pseudoElement: null,
});

//css
// .myElement {
//     transition: opacity 1s ease-in-out;
//     opacity: 0;
//   }

//   .myElement.active {
//     opacity: 1;
//   }
//react
//   class MyComponent extends React.Component {
//   handleTransitionEnd = (event) => {
//     console.log(`${event.propertyName} 트랜지션이 ${event.elapsedTime}초 만에 완료되었습니다.`);
//   };

//   render() {
//     return (
//       <div
//         className="myElement active"
//         onTransitionEnd={this.handleTransitionEnd}
//       >
//         트랜지션 테스트
//       </div>
//     );
//   }
// }

export default SyntheticTransitionEvent;
