// TWorkTag Type begins
/**
 *@typedef TWorkTag
 */
export const TWorkTag = Number; // 파이버의 작동방식을 결정하는 타입으로 숫자형으로 정의한다.
export const FunctionComponent = 0; //함수형 컴포넌트를 위한 Fiber
// export const ClassComponent = X; //클래스형 컴포넌트를 위한 Fiber-현 리액트에선 구현하지 않는다
export const HostRoot = 1; // 호스트의 루트를 위한 Fiber-> 이 부분에서는 따로 처리해야되는 부분이 많다.
export const HostComponent = 2; // 실제 돔에 표현되는 컴포넌트를 위한 Fiber
export const HostText = 3; // 호스트 Text->즉 돔에 텍스트를 표현하기 위한 Fiber
export const Fragment = 4; // 단순이 컴포넌트를 그룹핑하기위한 Fiber-> div그루핑을 막는다
export const ContextProvider = 5; // 컨텍스트를 제공하는 Fiber
// export const MemoComponent = X; // 본 리액트에서는 해당 타입을 통해서 함수형과 클래스형 메모 컴포넌트를 구분하지만
// 우리의 리액트는 함수형 컴포넌트만을 지원하므로 해당 타입은 필요하지 않다.
export const SimpleMemoComponent = 6; // 함수형 컴포넌트를 위한 메모 컴포넌트
