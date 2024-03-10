/**
 *
 * @description - hasContextChanged는 context가 변했는지 확인합니다.
 * fiberStack의 cursor를 확인하여 context가 변했는지 확인합니다.
 * @see fiberStack
 *
 * leagcy context를 비활성화하면 false를 반환합니다.
 * @see https://legacy.reactjs.org/docs/legacy-context.html
 *
 * RFS에서는 LegacyContextAPI를 사용하지 않기 때문에 항상 false를 반환합니다.
 * @returns
 */
const hasContextChanged = () => {
    return false;
    // if (disableLegacyContext) {
    //     return false;
    // } else {
    //     return didPerformWorkStackCursor.current;
    // }
};

export default hasContextChanged;
