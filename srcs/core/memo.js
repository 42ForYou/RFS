import { RFS_MEMO_TYPE } from "./rfsSymbol.js";
// 위 예제에서 areEqual 함수는 이전 props와 다음 props의 value가 같은 경우에만 true를 반환합니다.
// 따라서 value prop이 변경되지 않는 한, MyComponent의 업데이트는 건너뛰어집니다.
// function areEqual(prevProps, nextProps) {
//   /*
//     true를 반환하면 업데이트를 건너뛰고,
//     false를 반환하면 컴포넌트를 업데이트합니다.
//   */
//   return prevProps.value === nextProps.value;
// }

// function MyComponent({ value }) {
//   // 컴포넌트 구현
//   return <div>{value}</div>;
// }

// export default React.memo(MyComponent, areEqual);
/**
 *
 * @param {TRfsElementType} type @see 파일경로: type/TRfsType.js
 * @param {lambda} compare
 * @returns {Tmemo}
 * @description 렌더링을 최적화 할 수 있도록 memoization을 제공하는 HOC(Higher Order Component)입니다.
 * @description compare을 사용하여 건너뛸 업데이트를 결정할 수 있습니다.
 */
const memo = (type, compare) => {
    return {
        $$typeof: RFS_MEMO_TYPE,
        type,
        compare: compare === undefined ? null : compare,
    };
};

export default memo;
