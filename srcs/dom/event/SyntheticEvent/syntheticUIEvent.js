import SyntheticEvent from "./syntheticEvent.js";

/**
 * @description UI 이벤트를 위한 SyntheticEvent 확장. 뷰와 디테일을 포함합니다.
 
 */
const SyntheticUIEvent = SyntheticEvent.extend({
    view: null,
    detail: null,
});
// view: 이벤트와 연관된 window 객체입니다. 예를 들어, 브라우저 창이나 탭입니다.
// detail: 이벤트와 관련된 추가 정보를 나타내며, 이벤트 유형에 따라 다를 수 있습니다. 예를 들어, click 이벤트의 경우 클릭 횟수를 나타낼 수 있습니다.

export default SyntheticUIEvent;
