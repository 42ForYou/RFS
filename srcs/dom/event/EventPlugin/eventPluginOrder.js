//NOTE:
// DOMEventPluginOrder 배열은  이벤트 플러그인 시스템 내에서
// EventPlugin들의 실행 순서를 결정합니다.
// 이 배열은 EventPluginHub에 주입될 수 있으며, 이를 통해 플러그인이 처리될 순서를 명시적으로 지정할 수 있습니다. 이 순서는 이벤트가 처리되는 방식에 영향을 미치며,
// 특정 이벤트 플러그인이 다른 이벤트 플러그인보다 먼저 실행되어야 할 때 중요합니다.

//SimpleEventPlugin: 간단한 이벤트(예: 클릭, 입력)를 처리합니다.
// EnterLeaveEventPlugin: 컴포넌트 간의 마우스 진입(enter) 및 떠남(leave) 이벤트를 처리합니다.
// ChangeEventPlugin: 입력 필드의 값이 변경될 때 발생하는 변경(change) 이벤트를 처리합니다.
// SelectEventPlugin: 사용자가 텍스트를 선택(select)할 때 발생하는 이벤트를 처리합니다.
// BeforeInputEventPlugin: 입력 이벤트가 발생하기 직전(before input)에 처리됩니다.
const DOMEventPluginOrder = [
    "SimpleEventPlugin",
    "EnterLeaveEventPlugin",
    "ChangeEventPlugin",
    "SelectEventPlugin",
    "BeforeInputEventPlugin",
];

export default DOMEventPluginOrder;
