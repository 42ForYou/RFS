/**
 * @file TWorkTag.js
 * @description 파이버라는 추상화 안에서
 * 그것이 함수형 컴포넌트건 , 호스트 컴포넌트건, 아니면 기타등등 다른 무엇이던
 * 하나의 래핑안에서 처리된다. 이를 구분하기위해서는 해당 파이버가 어떻게 처리 되어야 할지가 정의 되어야한다
 * 그를 의미한다..
 */

/**
 * @typedef {number} TWorkTag
 */
const TWorkTag = Number; // 파이버의 작동방식을 결정하는 타입으로 숫자형으로 정의한다.
const FunctionComponent = 0; //함수형 컴포넌트를 위한 Fiber
// const ClassComponent = X; //클래스형 컴포넌트를 위한 Fiber-현 리액트에선 구현하지 않는다
const HostRoot = 1; // 호스트의 루트를 위한 Fiber-> 이 부분에서는 따로 처리해야되는 부분이 많다.
const HostComponent = 2; // 실제 돔에 표현되는 컴포넌트를 위한 Fiber
const HostText = 3; // 호스트 Text->즉 돔에 텍스트를 표현하기 위한 Fiber
const Fragment = 4; // 단순이 컴포넌트를 그룹핑하기위한 Fiber-> div그루핑을 막는다
const ContextProvider = 5; // 컨텍스트를 제공하는 Fiber
// const MemoComponent = X; // 본 리액트에서는 해당 타입을 통해서 함수형과 클래스형 메모 컴포넌트를 구분하지만
// 우리의 리액트는 함수형 컴포넌트만을 지원하므로 해당 타입은 필요하지 않다.
const SimpleMemoComponent = 6; // 함수형 컴포넌트를 위한 메모 컴포넌트
const IndeterminateComponent = 7; // 원래 리액트에선 함수형인지 아닌지에 따라서 처리를 분리하기 위해서 되어 있는데,
//현 RFs에서는 함수형 컴포넌트의 마운트를 위한 타입으로 사용된다.
export const ForwardRef = 8; //ForwardRef --> 자식에게 ref를 전달하기 위한 타입
