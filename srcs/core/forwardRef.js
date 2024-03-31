import { RFS_FORWARD_REF_TYPE } from "./rfsSymbol.js";

//예시)
// import React, { forwardRef, useRef, useEffect } from 'react';

// const FancyButton = forwardRef((props, ref) => (
//   <button ref={ref} className="FancyButton">
//     {props.children}
//   </button>
// ));

// function App() {
//   const fancyButtonRef = useRef();

//   useEffect(() => {
//     console.log(fancyButtonRef.current); // DOM 노드에 접근하여 콘솔에 출력
//   }, []);

//   return (
//     <div>
//       <FancyButton ref={fancyButtonRef}>Click me!</FancyButton>
//     </div>
//   );
// }

// export default App;

// 작동 방식
// forwardRef 사용: FancyButton은 forwardRef를 사용하여 정의된 컴포넌트입니다. forwardRef는 두 번째 인자로 ref를 받고, 이 ref를 컴포넌트 내부에서 사용할 수 있게 합니다.

// ref 전달: App 컴포넌트에서 useRef를 사용해 fancyButtonRef라는 참조(ref)를 생성하고, 이를 <FancyButton ref={fancyButtonRef}>을 통해 FancyButton 컴포넌트에 전달합니다.

// DOM 요소에 ref 연결: FancyButton 컴포넌트 내에서 받은 ref를 <button> 요소의 ref 속성에 할당합니다. 이로써 fancyButtonRef는 button 요소를 직접 가리키게 됩니다.

// 스타일 적용: <button> 요소에는 "FancyButton"이라는 클래스 이름이 적용되어 있어, 해당 클래스에 대한 CSS 스타일링이 적용되면 버튼의 스타일을 변경할 수 있습니다.

//그냥 ref
//import React, { useRef, useEffect } from 'react';

// function MyFunctionComponent() {
//     const myRef = useRef();

//     useEffect(() => {
//       console.log(myRef.current); // DOM 요소에 접근
//     }, []);

//     return <div ref={myRef}>Hello, World!</div>;
//   }
// 이런식으로 실제 dom에만 접근할 수 있습니다.

// 결과
// App 컴포넌트는 FancyButton 컴포넌트를 렌더링하면서 fancyButtonRef를 ref로 전달합니다.
// FancyButton 컴포넌트는 이 ref를 내부의 button 요소에 연결합니다.
// 따라서 App 컴포넌트에서는 fancyButtonRef.current를 통해 button 요소에 직접 접근할 수 있게 됩니다. 예를 들어, 버튼에 자동으로 포커스를 주거나, 버튼의 DOM 속성을 직접 조작할 수 있습니다.
// 또한, button 요소에 "FancyButton" 클래스가 적용되어 있으므로, CSS를 통해 해당 클래스를 스타일링할 수 있습니다. 이를 통해 개발자는 보다 유연하게 UI를 디자인할 수 있습니다.

//내부 디테일:
//<Component a={1} ref={() => {}}/>, 는 다음과 같이 컴파일 되는데
// {
//     $$typeof: Symbol("react.element"),
//     key: null,
//     props: {a: 1},
//     ref: () => {},
//   See that ref is besides props

//     type: function Component(props) {...},
//     _owner: ...,
//     _store: ...,
//   }

//해당 ref는 props바깥에 있음으로 탐색이 불가능합니다. 이를 해결하기 위해서 forwardRef를 사용합니다.
/**
 *
 * @param {Lambda((props, ref) => TRfsNode)} render
 * @returns {}
 * @description Rfs에서 ref를 하위 컴포넌트로 전달하기 위한 함수입니다.
 * @description 부모의 ref를 하위 컴포넌트와 연결할 수 있게 해줍니다.
 * @description 정확히는 함수형 컴포넌트와 연결할 수 있게 해줍니다.
 */
export const forwardRef = (render) => {
    return {
        $$typeof: RFS_FORWARD_REF_TYPE,
        render,
    };
};
