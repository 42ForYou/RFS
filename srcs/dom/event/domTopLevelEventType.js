import { getVendorPrefixedEventName } from "./getVendorPrefixedEventName.js";
/**
 *
 * @param {string} topLevelType
 * @returns {TTopLevelType}
 * @description 둘다 똑같은 스트링이지만 추상화 속에선 다른 타입으로 취급되기 때문에 string을 top level type으로 변환하는 함수입니다.
 */
export const castStringToDOMTopLevelType = (topLevelType) => {
    return topLevelType;
};

//   export function castDOMTopLevelTypeToString(
//     topLevelType: DOMTopLevelEventType,
//   ): string {
//     return topLevelType;
//   }
/**
 *
 * @param {TTopLevelType} topLevelType
 * @returns {string}
 * @description 둘다 똑같은 스트링이지만 추상화 속에선 다른 타입으로 취급되기 때문에 top level type을 string으로 변환하는 함수입니다.
 */
export const castDOMTopLevelTypeToString = (topLevelType) => {
    return topLevelType;
};

// 1. 기본 이벤트:
// TOP_ABORT: 데이터 전송이 중단됐을 때 발생합니다.
// TOP_BLUR: 요소가 포커스를 잃었을 때 발생합니다.
// TOP_CANCEL: 사용자가 대화 상자를 취소했을 때 발생합니다.
// TOP_CHANGE: 입력 필드의 내용이 바뀌었을 때 발생합니다.
// TOP_CLICK: 요소를 클릭했을 때 발생합니다.
// TOP_CLOSE: 웹 소켓 연결이 닫히거나, <dialog> 요소가 닫혔을 때 발생합니다.
// TOP_CONTEXT_MENU: 사용자가 컨텍스트 메뉴를 열려고 할 때 발생합니다.
// TOP_COPY: 사용자가 내용을 복사할 때 발생합니다.
// TOP_CUT: 사용자가 내용을 잘라내려고 할 때 발생합니다.
// TOP_DOUBLE_CLICK: 요소를 더블 클릭했을 때 발생합니다.
// TOP_AUX_CLICK: 보조 클릭(일반적으로 마우스 오른쪽 버튼 클릭)이 발생했을 때입니다.
// TOP_DRAG: 요소를 드래그할 때 발생합니다.
// TOP_DRAG_END: 드래그 작업이 끝났을 때 발생합니다.
// TOP_DRAG_ENTER: 드래그하는 요소나 텍스트 블록이 드롭 타겟 위로 들어갔을 때 발생합니다.
// TOP_DRAG_EXIT: 드래그하는 요소나 텍스트 블록이 드롭 타겟을 벗어났을 때 발생합니다.
// TOP_DRAG_LEAVE: 드래그하는 요소나 텍스트 블록이 드롭 타겟 위에서 벗어났을 때 발생합니다.
// TOP_DRAG_OVER: 드래그하는 요소나 텍스트 블록이 드롭 타겟 위에 있을 때 발생합니다.
// TOP_DRAG_START: 사용자가 요소나 텍스트 블록을 드래그하기 시작했을 때 발생합니다.
// TOP_DROP: 드래그 중인 요소나 텍스트 블록이 드롭 타겟에 드롭됐을 때 발생합니다.
// TOP_ERROR: 자바스크립트 오류가 발생하거나 리소스 로딩 실패 같은 에러 상황에서 발생합니다.
// 2. 미디어 관련 이벤트:
// TOP_CAN_PLAY: 미디어가 재생될 준비가 됐지만, 끝까지 재생하기에 충분한 데이터가 로드되지 않았을 때 발생합니다.
// TOP_CAN_PLAY_THROUGH: 미디어가 끝까지 재생될 수 있을 만큼 충분한 데이터가 로드됐을 때 발생합니다.
// TOP_DURATION_CHANGE: 미디어의 지속 시간이 변경됐을 때 발생합니다.
// TOP_EMPTIED: 미디어 요소가 비워졌을 때 발생합니다.
// TOP_ENCRYPTED: 미디어가 암호화된 데이터를 발견했을 때 발생합니다.
// TOP_ENDED: 미디어의 재생이 끝났을 때 발생합니다.
// TOP_LOAD:  이벤트는 웹 페이지의 요소가 완전히 로드되었을 때 발생합니다
// TOP_LOADED_DATA: 미디어의 현재 재생 위치에서 프레임을 표시할 수 있을 만큼 데이터가 로드됐을 때 발생합니다.
// TOP_LOADED_METADATA: 미디어의 메타데이터 로딩이 완료됐을 때 발생합니다.
// TOP_LOAD_START: 미디어 로딩이 시작될 때 발생합니다.
// TOP_PASTE: 사용자가 붙여넣기를 할 때 발생합니다.
// TOP_PAUSE: 미디어 재생이 일시 정지됐을 때 발생합니다.
// TOP_PLAY: 미디어 재생이 시작됐을 때 발생합니다.
// TOP_PLAYING: 미디어가 재생될 준비가 되었거나, 재생이 지연된 후 다시 시작됐을 때 발생합니다.
// TOP_PROGRESS: 브라우저가 미디어를 다운로드하는 동안 주기적으로 발생합니다.
// TOP_RATE_CHANGE: 미디어의 재생 속도가 변경됐을 때 발생합니다.
// TOP_SEEKED: 사용자가 미디어 재생 위치를 변경했을 때 발생합니다.
// TOP_SEEKING: 사용자가 미디어 재생 위치를 변경하려 할 때 발생합니다.
// TOP_STALLED: 미디어 데이터의 다운로드가 멈췄지만, 네트워크 상태에 문제가 없을 때 발생합니다.
// TOP_SUSPEND: 미디어 데이터의 로딩이 일시적으로 중단됐을 때 발생합니다.
// TOP_VOLUME_CHANGE: 미디어의 볼륨이 변경되거나 음소거 되었을 때 발생합니다.
// TOP_WAITING: 미디어 재생이 버퍼링 때문에 멈췄을 때 발생합니다.
// 3. 입력 및 인터랙션 관련 이벤트:
// TOP_COMPOSITION_END: IME(Input Method Editor)의 입력이 완료되었을 때 발생합니다. 예를 들어, 한글 입력이 완료된 후입니다.
// TOP_COMPOSITION_START: 사용자가 IME를 통해 텍스트 입력을 시작했을 때 발생합니다.
// TOP_COMPOSITION_UPDATE: IME 입력 중에 텍스트가 변경될 때마다 발생합니다.
// TOP_INPUT: 사용자 입력으로 인해 요소의 값이 바뀌었을 때 발생합니다.
// TOP_INVALID: 폼 필드의 데이터 검증이 실패했을 때 발생합니다.
// TOP_RESET: 폼 리셋 버튼이 클릭되었을 때 발생합니다.
// TOP_SUBMIT: 폼 제출 버튼이 클릭되었을 때 발생합니다.
// TOP_TEXT_INPUT: 사용자가 텍스트를 입력했을 때 발생합니다.
// 4. 키보드 관련 이벤트:
// TOP_KEY_DOWN: 키보드의 키를 누를 때 발생합니다.
// TOP_KEY_PRESS: 키보드의 키를 누르고 있을 때 발생합니다. (주로 문자, 숫자 키에 한해)
// TOP_KEY_UP: 키보드의 키에서 손을 뗄 때 발생합니다.
// 5. 포커스 관련 이벤트:
// TOP_FOCUS: 요소가 포커스를 받았을 때 발생합니다.
// 6. 마우스 및 포인터 관련 이벤트:
// TOP_MOUSE_DOWN: 마우스 버튼을 누를 때 발생합니다.
// TOP_MOUSE_MOVE: 마우스를 움직일 때 발생합니다.
// TOP_MOUSE_OUT: 마우스 포인터가 요소 밖으로 나갈 때 발생합니다.
// TOP_MOUSE_OVER: 마우스 포인터가 요소 위로 올라갈 때 발생합니다.
// TOP_MOUSE_UP: 마우스 버튼에서 손을 떼었을 때 발생합니다.
// TOP_POINTER_CANCEL: 포인터 입력이 갑자기 중단되었을 때 발생합니다.
// TOP_POINTER_DOWN: 포인터가 요소 위에서 활성화되었을 때 발생합니다.
// TOP_POINTER_MOVE: 포인터가 요소 위에서 움직였을 때 발생합니다.
// TOP_POINTER_ENTER: 포인터가 요소 위로 처음 진입했을 때 발생합니다.
// TOP_POINTER_LEAVE: 포인터가 요소 위에서 벗어났을 때 발생합니다.
// TOP_POINTER_OUT: 포인터가 요소 밖으로 나갈 때 발생합니다.
// TOP_POINTER_OVER: 포인터가 요소 위로 처음 진입했을 때 발생합니다.
// TOP_POINTER_UP: 포인터가 비활성화될 때 발생합니다.
// 7. 기타 이벤트:
// TOP_SCROLL: 사용자가 스크롤할 때 발생합니다.
// TOP_WHEEL: 마우스 휠 또는 트랙패드를 사용하여 스크롤할 때 발생합니다.
// TOP_SELECTION_CHANGE: 사용자가 텍스트 선택을 변경했을 때 발생합니다. 일반적으로 <input>이나 <textarea>에서 사용됩니다.
// TOP_TOGGLE: <details> 요소가 토글될 때 발생합니다.
// 8. 애니메이션 및 전환 관련 이벤트(추가 설명):
// TOP_ANIMATION_END: CSS 애니메이션이 종료되었을 때 발생합니다.
// TOP_ANIMATION_ITERATION: CSS 애니메이션이 반복될 때마다 발생합니다.
// TOP_ANIMATION_START: CSS 애니메이션이 시작될 때 발생합니다.
// TOP_TRANSITION_END: CSS 전환(transition)이 완료됐을 때 발생합니다.
// TOP_GOT_POINTER_CAPTURE: gotpointercapture 이벤트는 요소가 포인터 이벤트의 캡처를 성공적으로 획득했을 때 발생합니다. 포인터 이벤트 캡처는 특정 요소가 포인터 이벤트(예: 마우스, 터치)를 독점적으로 수신하도록 할 때 사용됩니다. 이는 주로 드래그 앤 드롭과 같은 상호작용에서 드래그하는 동안 요소가 포인터 이벤트를 계속 수신해야 하는 경우에 유용합니다.
// TOP_LOST_POINTER_CAPTURE: lostpointercapture 이벤트는 요소가 포인터 캡처를 잃었을 때 발생합니다. 이는 다른 요소가 포인터 캡처를 가져갔거나, 사용자가 상호작용을 중단(예: 마우스 버튼을 떼는 등)하는 등의 이유로 발생할 수 있습니다.

/**
 * @description 데이터 전송이 중단되었을 때 발생합니다.
 */
export const TOP_ABORT = castStringToDOMTopLevelType("abort");

/**
 * @description CSS 애니메이션이 종료되었을 때 발생합니다.
 */
export const TOP_ANIMATION_END = castStringToDOMTopLevelType(getVendorPrefixedEventName("animationend"));

/**
 * @description CSS 애니메이션이 반복될 때마다 발생합니다.
 */
export const TOP_ANIMATION_ITERATION = castStringToDOMTopLevelType(getVendorPrefixedEventName("animationiteration"));

/**
 * @description CSS 애니메이션이 시작될 때 발생합니다.
 */
export const TOP_ANIMATION_START = castStringToDOMTopLevelType(getVendorPrefixedEventName("animationstart"));

/**
 * @description 요소가 포커스를 잃었을 때 발생합니다.
 */
export const TOP_BLUR = castStringToDOMTopLevelType("blur");

/**
 * @description 미디어가 재생될 준비가 됐지만, 끝까지 재생하기에 충분한 데이터가 로드되지 않았을 때 발생합니다.
 */
export const TOP_CAN_PLAY = castStringToDOMTopLevelType("canplay");

/**
 * @description 미디어가 끝까지 재생될 수 있을 만큼 충분한 데이터가 로드됐을 때 발생합니다.
 */
export const TOP_CAN_PLAY_THROUGH = castStringToDOMTopLevelType("canplaythrough");

/**
 * @description 사용자가 대화 상자를 취소했을 때 발생합니다.
 */
export const TOP_CANCEL = castStringToDOMTopLevelType("cancel");

/**
 * @description 입력 필드의 내용이 바뀌었을 때 발생합니다.
 */
export const TOP_CHANGE = castStringToDOMTopLevelType("change");

/**
 * @description 요소를 클릭했을 때 발생합니다.
 */
export const TOP_CLICK = castStringToDOMTopLevelType("click");

/**
 * @description 웹 소켓 연결이 닫히거나, <dialog> 요소가 닫혔을 때 발생합니다.
 */
export const TOP_CLOSE = castStringToDOMTopLevelType("close");

/**
 * @description IME(Input Method Editor)의 입력이 완료되었을 때 발생합니다. 예를 들어, 한글 입력이 완료된 후입니다.
 * @description IME(Input Method Editor)는 키보드로 직접 입력하기 어려운 문자를 입력할 수 있게 도와주는 소프트웨어 도구입니다. 예를 들어, 한글, 중국어, 일본어와 같은 언어를 입력할 때 IME를 사용합니다.
 * @description 사용자가 여러 키 입력을 통해 한 글자나 단어를 조합하고, 이 조합이 완성될 때 해당 문자가 입력됩니다.
 */
export const TOP_COMPOSITION_END = castStringToDOMTopLevelType("compositionend");

/**
 * @description 사용자가 IME를 통해 텍스트 입력을 시작했을 때 발생합니다.
 */
export const TOP_COMPOSITION_START = castStringToDOMTopLevelType("compositionstart");

/**
 * @description IME 입력 중에 텍스트가 변경될 때마다 발생합니다.
 */
export const TOP_COMPOSITION_UPDATE = castStringToDOMTopLevelType("compositionupdate");

/**
 * @description 사용자 컨텍스트 메뉴를 열려고 할 때 발생합니다.
 * @description 컨텍스트 메뉴란 사용자가 웹 페이지에서 마우스 오른쪽 버튼을 클릭했을 때 나타나는 메뉴입니다.
 * @description 일반적으로 웹 페이지의 내용을 복사하거나 붙여넣기, 이미지 저장 등의 작업을 수행할 수 있습니다.
 */
export const TOP_CONTEXT_MENU = castStringToDOMTopLevelType("contextmenu");

/**
 * @description 사용자가 내용을 복사할 때 발생합니다.
 */
export const TOP_COPY = castStringToDOMTopLevelType("copy");

/**
 * @description 사용자가 내용을 잘라내려고 할 때 발생합니다.
 */
export const TOP_CUT = castStringToDOMTopLevelType("cut");

/**
 * @description 요소를 더블 클릭했을 때 발생합니다.
 */
export const TOP_DOUBLE_CLICK = castStringToDOMTopLevelType("dblclick");

/**
 * @description 보조 클릭(일반적으로 마우스 오른쪽 버튼 클릭)이 발생했을 때입니다.
 */
export const TOP_AUX_CLICK = castStringToDOMTopLevelType("auxclick");

/**
 * @description 요소를 드래그할 때 발생합니다.
 */
export const TOP_DRAG = castStringToDOMTopLevelType("drag");

/**
 * @description 드래그 작업이 끝났을 때 발생합니다.
 */
export const TOP_DRAG_END = castStringToDOMTopLevelType("dragend");

/**
 * @description 드래그하는 요소나 텍스트 블록이 드롭 타겟 위로 들어갔을 때 발생합니다.
 */
export const TOP_DRAG_ENTER = castStringToDOMTopLevelType("dragenter");

/**
 * @description 드래그하는 요소나 텍스트 블록이 드롭 타겟을 벗어났을 때 발생합니다.
 */
export const TOP_DRAG_EXIT = castStringToDOMTopLevelType("dragexit");

/**
 * @description 드래그하는 요소나 텍스트 블록이 드롭 타겟 위에서 벗어났을 때 발생합니다.
 */
export const TOP_DRAG_LEAVE = castStringToDOMTopLevelType("dragleave");

/**
 * @description 드래그하는 요소나 텍스트 블록이 드롭 타겟 위에 있을 때 발생합니다.
 */
export const TOP_DRAG_OVER = castStringToDOMTopLevelType("dragover");

/**
 * @description 사용자가 요소나 텍스트 블록을 드래그하기 시작했을 때 발생합니다.
 */
export const TOP_DRAG_START = castStringToDOMTopLevelType("dragstart");

/**
 * @description 드래그 중인 요소나 텍스트 블록이 드롭 타겟에 드롭됐을 때 발생합니다.
 */
export const TOP_DROP = castStringToDOMTopLevelType("drop");

/**
 * @description 미디어의 지속 시간이 변경됐을 때 발생합니다.
 */
export const TOP_DURATION_CHANGE = castStringToDOMTopLevelType("durationchange");

/**
 * @description 미디어 요소가 비워졌을 때 발생합니다.
 */
export const TOP_EMPTIED = castStringToDOMTopLevelType("emptied");

/**
 * @description 미디어가 암호화된 데이터를 발견했을 때 발생합니다.
 */
export const TOP_ENCRYPTED = castStringToDOMTopLevelType("encrypted");

/**
 * @description 미디어의 재생이 끝났을 때 발생합니다.
 */
export const TOP_ENDED = castStringToDOMTopLevelType("ended");

/**
 * @description 자바스크립트 오류가 발생하거나 리소스 로딩 실패 같은 에러 상황에서 발생합니다.
 */
export const TOP_ERROR = castStringToDOMTopLevelType("error");

/**
 * @description 요소가 포커스를 받았을 때 발생합니다.
 */
export const TOP_FOCUS = castStringToDOMTopLevelType("focus");

/**
 * @description 포인터 입력이 갑자기 중단되었을 때 발생합니다TOP_GOT_POINTER_CAPTURE.
 */
export const TOP_GOT_POINTER_CAPTURE = castStringToDOMTopLevelType("gotpointercapture");

/**
 * @description 사용자가 입력으로 인해 요소의 값이 바뀌었을 때 발생합니다.
 */
export const TOP_INPUT = castStringToDOMTopLevelType("input");

/**
 * @description 폼 필드의 데이터 검증이 실패했을 때 발생합니다.
 
 */
export const TOP_INVALID = castStringToDOMTopLevelType("invalid");

/**
 * @description 키보드의 키를 누를 때 발생합니다.->어떤 키를 누를 때나 발생
 
 */
export const TOP_KEY_DOWN = castStringToDOMTopLevelType("keydown");

/**
 * @description 키보드의 키를 누르고 있을 때 발생합니다. (주로 문자, 숫자 키에 한해)
 */
export const TOP_KEY_PRESS = castStringToDOMTopLevelType("keypress");

/**
 * @description 키보드의 키에서 손을 뗄 때 발생합니다.
 */
export const TOP_KEY_UP = castStringToDOMTopLevelType("keyup");

/**
 * @description 웹 페이지의 요소가 완전히 로드되었을 때 발생합니다(미디어))
 */
export const TOP_LOAD = castStringToDOMTopLevelType("load");

/**
 * @description 미디어 로딩이 시작될 때 발생합니다.
 */
export const TOP_LOAD_START = castStringToDOMTopLevelType("loadstart");

/**
 * @description 미디어의 현재 재생 위치에서 프레임을 표시할 수 있을 만큼 데이터가 로드됐을 때 발생합니다.
 */
export const TOP_LOADED_DATA = castStringToDOMTopLevelType("loadeddata");

/**
 * @description 미디어의 메타데이터 로딩이 완료됐을 때 발생합니다.
 */
export const TOP_LOADED_METADATA = castStringToDOMTopLevelType("loadedmetadata");

/**
 * @description lostpointercapture 이벤트는 요소가 포인터 캡처를 잃었을 때 발생합니다.
 */
export const TOP_LOST_POINTER_CAPTURE = castStringToDOMTopLevelType("lostpointercapture");

/**
 * @description 마우스 버튼을 누를 때 발생합니다.
 */
export const TOP_MOUSE_DOWN = castStringToDOMTopLevelType("mousedown");

/**
 * @description 마우스를 움직일 때 발생합니다.
 */
export const TOP_MOUSE_MOVE = castStringToDOMTopLevelType("mousemove");

/**
 * @description 마우스 포인터가 요소 밖으로 나갈 때 발생합니다.
 */
export const TOP_MOUSE_OUT = castStringToDOMTopLevelType("mouseout");

/**
 * @description 마우스 포인터가 요소 위로 올라갈 때 발생합니다.
 */
export const TOP_MOUSE_OVER = castStringToDOMTopLevelType("mouseover");

/**
 * @description 마우스 버튼에서 손을 떼었을 때 발생합니다.
 */
export const TOP_MOUSE_UP = castStringToDOMTopLevelType("mouseup");

/**
 * @description 사용자가 붙여넣기를 할 때 발생합니다.
 */
export const TOP_PASTE = castStringToDOMTopLevelType("paste");

/**
 * @description 미디어 재생이 일시 정지됐을 때 발생합니다.
 */
export const TOP_PAUSE = castStringToDOMTopLevelType("pause");

/**
 * @description 미디어 재생이 시작됐을 때 발생합니다.
 */
export const TOP_PLAY = castStringToDOMTopLevelType("play");

/**
 * @description 미디어가 재생될 준비가 되었거나, 재생이 지연된 후 다시 시작됐을 때 발생합니다.
 */
export const TOP_PLAYING = castStringToDOMTopLevelType("playing");

/**
 * @description 포인터 입력이 갑자기 중단되었을 때 발생합니다.
 */
export const TOP_POINTER_CANCEL = castStringToDOMTopLevelType("pointercancel");

/**
 * @description 포인터가 요소 위에서 활성화되었을 때 발생합니다.
 */
export const TOP_POINTER_DOWN = castStringToDOMTopLevelType("pointerdown");

/**
 * @description 포인터가 요소 위로 처음 진입했을 때 발생합니다.
 */
export const TOP_POINTER_ENTER = castStringToDOMTopLevelType("pointerenter");

/**
 * @description 포인터가 요소 위에서 벗어났을 때 발생합니다.
 */
export const TOP_POINTER_LEAVE = castStringToDOMTopLevelType("pointerleave");

/**
 * @description 포인터가 요소 위에서 움직였을 때 발생합니다.
 */
export const TOP_POINTER_MOVE = castStringToDOMTopLevelType("pointermove");

/**
 * @description 포인터가 요소 위에서 벗어나려 할 때 발생합니다. 버블링이 일어납니다.
 */
export const TOP_POINTER_OUT = castStringToDOMTopLevelType("pointerout");

/**
 * @description 포인터가 요소 위로 올라왔을 때 발생합니다. 버블링이 일어납니다.
 */
export const TOP_POINTER_OVER = castStringToDOMTopLevelType("pointerover");

/**
 * @description 포인터 버튼이 떼어졌을 때 발생합니다.
 */
export const TOP_POINTER_UP = castStringToDOMTopLevelType("pointerup");

/**
 * @description 로딩 중인 리소스의 진행 상태가 업데이트될 때 발생합니다.
 */
export const TOP_PROGRESS = castStringToDOMTopLevelType("progress");

/**
 * @description 미디어 재생 속도가 변경되었을 때 발생합니다.
 */
export const TOP_RATE_CHANGE = castStringToDOMTopLevelType("ratechange");

/**
 * @description 폼이 리셋될 때 발생합니다.
 */
export const TOP_RESET = castStringToDOMTopLevelType("reset");

/**
 * @description 요소가 스크롤될 때 발생합니다.
 */
export const TOP_SCROLL = castStringToDOMTopLevelType("scroll");

/**
 * @description 미디어 탐색이 완료됐을 때 발생합니다. 예를 들어, 사용자가 탐색 슬라이더를 드래그한 후 떼었을 때입니다.
 */
export const TOP_SEEKED = castStringToDOMTopLevelType("seeked");

/**
 * @description 미디어 탐색을 시작할 때 발생합니다.
 */
export const TOP_SEEKING = castStringToDOMTopLevelType("seeking");

/**
 * @description 선택된 텍스트 또는 요소의 변경이 있을 때 발생합니다.
 */
export const TOP_SELECTION_CHANGE = castStringToDOMTopLevelType("selectionchange");

/**
 * @description 미디어 재생이 예상치 못하게 멈췄을 때 발생합니다.
 */
export const TOP_STALLED = castStringToDOMTopLevelType("stalled");

/**
 * @description 폼이 제출될 때 발생합니다.
 */
export const TOP_SUBMIT = castStringToDOMTopLevelType("submit");

/**
 * @description 미디어 로딩이 일시적으로 중단되었을 때 발생합니다.
 */
export const TOP_SUSPEND = castStringToDOMTopLevelType("suspend");

/**
 * @description 텍스트 입력이 완료되었을 때 발생합니다. 예를 들어, 사용자가 키보드로 입력을 마쳤을 때입니다.
 */
export const TOP_TEXT_INPUT = castStringToDOMTopLevelType("textInput");

/**
 * @description 미디어의 재생 시간이 업데이트될 때 발생합니다.
 */
export const TOP_TIME_UPDATE = castStringToDOMTopLevelType("timeupdate");

/**
 * @description 사용자 인터페이스에서 토글 작업이 발생할 때 발생합니다.
 */
export const TOP_TOGGLE = castStringToDOMTopLevelType("toggle");

/**
 * @description 터치가 취소되었을 때 발생합니다.
 */
export const TOP_TOUCH_CANCEL = castStringToDOMTopLevelType("touchcancel");

/**
 * @description 터치가 끝났을 때 발생합니다.
 */
export const TOP_TOUCH_END = castStringToDOMTopLevelType("touchend");

/**
 * @description 터치 포인트가 움직였을 때 발생합니다.
 */
export const TOP_TOUCH_MOVE = castStringToDOMTopLevelType("touchmove");

/**
 * @description 새로운 터치가 시작됐을 때 발생합니다.
 */
export const TOP_TOUCH_START = castStringToDOMTopLevelType("touchstart");

/**
 * @description CSS 전환(transition)이 끝났을 때 발생합니다.
 */
export const TOP_TRANSITION_END = castStringToDOMTopLevelType(getVendorPrefixedEventName("transitionend"));

/**
 * @description 미디어의 볼륨이 변경되었을 때 또는 음소거 되었을 때 발생합니다.
 */
export const TOP_VOLUME_CHANGE = castStringToDOMTopLevelType("volumechange");

/**
 * @description 미디어 재생이 지연되었을 때 발생합니다.
 */
export const TOP_WAITING = castStringToDOMTopLevelType("waiting");

/**
 * @description 사용자가 마우스 휠을 돌릴 때 발생합니다.
 */
export const TOP_WHEEL = castStringToDOMTopLevelType("wheel");

// List of events that need to be individually attached to media elements.
// Note that events in this list will *not* be listened to at the top level
// unless they're explicitly whitelisted in `ReactBrowserEventEmitter.listenTo`.
// 미디어 요소에 개별적으로 첨부해야 하는 이벤트 목록입니다.
// 이 목록의 이벤트는 최상위 레벨에서 수신되지 않습니다.
// ReactBrowserEventEmitter.listenTo`에 명시적으로 화이트리스트에 등록되어 있지 않는 한 // 최상위 레벨에서 수신되지 않습니다.
// 즉 이벤트 위임으로 처리 되지 않는 친구들을 모아둠->예)이유: 이벤트 버블링이 안되는 이벤트들 존재. 그리고 기본적으로
// 버블링이 안되는 이유 뿐만아니라 해당 이벤트들은 미디어 서브시트템에 개별적으로 첨부되어야 하기 때문에 이와 같은 목록이 필요하다.
export const mediaEventTypes = [
    TOP_ABORT,
    TOP_CAN_PLAY,
    TOP_CAN_PLAY_THROUGH,
    TOP_DURATION_CHANGE,
    TOP_EMPTIED,
    TOP_ENCRYPTED,
    TOP_ENDED,
    TOP_ERROR,
    TOP_LOADED_DATA,
    TOP_LOADED_METADATA,
    TOP_LOAD_START,
    TOP_PAUSE,
    TOP_PLAY,
    TOP_PLAYING,
    TOP_PROGRESS,
    TOP_RATE_CHANGE,
    TOP_SEEKED,
    TOP_SEEKING,
    TOP_STALLED,
    TOP_SUSPEND,
    TOP_TIME_UPDATE,
    TOP_VOLUME_CHANGE,
    TOP_WAITING,
];

/**
 *
 * @param {TTopLevelType} topLevelType
 * @returns {string}
 * @description 이벤트 이름을 string으로 반환하는 함수입니다.
 */
export const getRawEventName = (topLevelType) => {
    return castDOMTopLevelTypeToString(topLevelType);
};
