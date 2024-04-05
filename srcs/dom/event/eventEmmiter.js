import { setEnabled, isEnabled, trapBubbledEvent, trapCapturedEvent } from "./domEventListener.js";
import {
    TOP_BLUR,
    TOP_CANCEL,
    TOP_CLOSE,
    TOP_FOCUS,
    TOP_INVALID,
    TOP_RESET,
    TOP_SCROLL,
    TOP_SUBMIT,
    getRawEventName,
    mediaEventTypes,
} from "./domTopLevelEventType.js";
import isEventSupported from "./isEventSupported.js";
/**
 * rfs event system 요약:
 *
 * Summary - rfsEventEmmiter- Rfs이벤트 처리 시스템
 *
 * - in main thread
 * - 기본적으로 네이티브 브라우저 이벤트에 Top-level위임이 사용된다.(trap)
 * - 이것은 메인스레드에서 일어나며, 해당 부분은 DomEventListener에 의해 처리된다.(여기서 플러그인 이벤트 소스를 삽입)
 *
 * - in worker thread
 * - 우리는 브라우저 특징을 고려하여 이벤트를 정규화하고 중복을 제거한다.- 이것은 워커스레드에서 수행될 수 있다.
 *
 * - 이러한 네이티브 이벤트들을 (trap된 상위 수준 타입과 함께) `EventPluginHub`로 전달하고, 
 * - 이것은 플러그인에게 합성 이벤트(synthetic events)를 추출할 것인지 물어본다.
 *
 * - 이벤트 플러그인 허브는 이벤트를 처리하고, 이벤트에 대한 관심을 가지는 "디스패치(dispatches)"라는 시퀀스를 부여한다.

 *
 * Overview of rfs and the event system:
 *
 * +------------+    .
 * |    DOM     |    .
 * +------------+    .
 *       |           .
 *       v           .
 * +------------+    .
 * | domEvent |    .
 * |  Listener  |    .
 * +------------+    .                         +-----------+
 *       |           .               +--------+|SimpleEvent|
 *       |           .               |         |Plugin     |
 * +-----|------+    .               v         +-----------+
 * |     |      |    .    +--------------+                    +------------+
 * |     +-----------.--->|EventPluginHub|                    |    Event   |
 * |            |    .    |              |     +-----------+  | Propagators|
 * | RfsEvent |    .    |              |     |TapEvent   |  |------------|
 * |  Emitter   |    .    |              |<---+|Plugin     |  |other plugin|
 * |            |    .    |              |     +-----------+  |  utilities |
 * |     +-----------.--->|              |                    +------------+
 * |     |      |    .    +--------------+
 * +-----|------+    .                ^        +-----------+
 *       |           .                |        |Enter/Leave|
 *       +           .                +-------+|Plugin     |
 * +-------------+   .                         +-----------+
 * | application |   .
 * |-------------|   .
 * |             |   .
 * |             |   .
 * +-------------+   .
 *                   .
 *    Rfs Core     .  General Purpose Event Plugin System
 */

// Map
// Map 객체는 임의의 키와 값을 매핑할 수 있습니다. 이는 키로 객체뿐만 아니라 원시 값을 (문자열, 숫자 등) 사용할 수 있다는 것을 의미합니다.
// Map의 키와 값에 대한 참조는 강력하게 유지되므로, Map 내의 키와 값은 가비지 컬렉션의 대상이 되지 않습니다. 즉, Map에 저장된 객체는 Map이 존재하는 한 메모리에서 제거되지 않습니다.
// Map은 이터러블(iterable)이므로, for...of 루프를 사용해 직접 순회할 수 있습니다.
// WeakMap
// WeakMap 객체는 오직 객체만 키로 사용할 수 있으며, 이 객체들에 대한 참조는 약하게(weakly) 유지됩니다. 이는 가비지 컬렉션이 해당 객체에 대한 다른 참조가 없을 경우 WeakMap의 키로 사용된 객체를 메모리에서 제거할 수 있음을 의미합니다. 즉, WeakMap 내의 객체는 그 객체를 키로 사용하는 WeakMap만 참조하고 있다면 가비지 컬렉션의 대상이 될 수 있습니다.
// WeakMap은 이터러블이 아니기 때문에 for...of 루프로 순회할 수 없고, WeakMap의 모든 키나 값을 한 번에 가져올 방법이 없습니다. 이는 메모리 관리 측면에서 유리하게 작용할 수 있지만, 사용성 측면에서는 제한적입니다.
// WeakMap은 주로 메모리 누수를 방지하기 위해 객체에 대한 추가적인 데이터를 저장할 때 사용됩니다. 객체가 가비지 컬렉션으로 수집될 때, WeakMap에 저장된 관련 데이터도 자동으로 제거되므로, 메모리를 효율적으로 관리할 수 있습니다.
// 간단히 말해서, Map은 더 일반적인 사용 사례에 적합하며, 객체뿐만 아니라 원시 값을 키로 사용할 수 있습니다. 반면, WeakMap은 특정 객체와 연결된 데이터를 메모리 누수 없이 관리할 필요가 있을 때 유용합니다.
const isPossibleWeakMap = typeof WeakMap === "function";
const ourMap = isPossibleWeakMap ? WeakMap : Map;
/**
 * @type {WeakMap<Document | Element | Node, Set<TTopLevelEventType | string>>}
 * @description 이벤트 핸들러가 실제로 달려있는(탑레벨이벤트) 요소들을 저장하는 맵
 * @description 그리고 이건 value로 set을 가지고 있는데 해당 이벤트 핸들러가 어떠한 이벤트타입들을
 * @description 위임하고 있는지를 저장한다.
 */
const elementListeningSets = new ourMap();
const getListeningSetForElement = (element) => {
    let listeningSet = elementListeningSets.get(element);
    if (!listeningSet) {
        listeningSet = new Set();
        elementListeningSets.set(element, listeningSet);
    }
    return listeningSet;
};
/**
 *
 * @param {TTopLevelType} topLevelType
 * @param {THostInstance} mountAt
 * @param {*} listeningSet
 * @description 탑레벨 이벤트를 해당 mountAt에 등록을 하는데-> 기존적으로
 * @description 이벤트 위임에서 버블링을 이용함으로 버블링을 이용하나 캡처링으로 처리해야되는
 * @description 특수한 케이스나, 앞서 targetDOM에 직접 이벤트를 달아야 하는 특수한 케이스들을
 * @description 따로 핸들하는 함수이다. 기본적으로 버블링으로 이벤트 위임을 처리한다.
 */
export const listenToTopLevel = (topLevelType, mountAt, listeningSet) => {
    //이미 탑레벨에 대한 이벤트가 달려있으면 달지 않는다
    if (!listeningSet.has(topLevelType)) {
        switch (topLevelType) {
            //NOTE: 기본적으로 이벤트를 버블링으로 처리하는데
            //NOTE: 캡처링으로 처리해야 되는 특수한 케이스들만 따로 캡처로 처리하고 나머지는
            //NOTE: default로 버블링으로 처리한다.
            case TOP_SCROLL:
                trapCapturedEvent(TOP_SCROLL, mountAt);
                break;
            case TOP_FOCUS:
            case TOP_BLUR:
                trapCapturedEvent(TOP_FOCUS, mountAt);
                trapCapturedEvent(TOP_BLUR, mountAt);
                listeningSet.add(TOP_BLUR);
                listeningSet.add(TOP_FOCUS);
                break;
            case TOP_CANCEL:
            case TOP_CLOSE:
                //앞선 두개는 지원하지 않는 브라우저도 존재해서 확인해야한다.
                if (isEventSupported(getRawEventName(topLevelType))) {
                    trapCapturedEvent(topLevelType, mountAt);
                }
                break;
            case TOP_INVALID:
            case TOP_SUBMIT:
            case TOP_RESET:
                // 이 이벤트들은 직접접으로 타겟 dom 엘리먼트에 리스닝하는데
                // 두번 버블 되면 안됨으로 건너뛴다.
                break;
            default:
                //기본적으로 탑레벨에서 이벤트를 듣는데 mediaEvent같은 경우는 타겟 엘리먼트에서 직접 처리됨으로
                //이벤트를 추가하지 않는다.
                const isMediaEvent = mediaEventTypes.indexOf(topLevelType) !== -1;
                if (!isMediaEvent) {
                    trapBubbledEvent(topLevelType, mountAt);
                }
                break;
        }
        //set에 이 이벤트를 추가한것에 대한 플래그를 추가한다.
        listeningSet.add(topLevelType);
    }
};
/**
 *
 * @param {string} registrationName
 * @param {THostInstance|THostContainer} mountAt
 * @description mountAt에 해당 타입(registrationName)에 대한 리스닝을 추가한다
 */
export const ListenTo = (registrationName, mountAt) => {
    //해당 엘리먼트에 대한 리스닝셋을 가져온다.
    const listeningSet = getListeningSetForElement(mountAt);
    //TODO: registrationNameDependencies 구현
    const dependencies = registrationNameDependencies[registrationName];
    //이벤트 플러그인 마다 종속성이 걸려있는 이벤트들이 있는데 simpleEventPlugin->그냥 자기자신(topLevelType)만
    //그것들을 다 듣도록 해야한다.-> 예를 들어 onChange같은걸 하면 -> input,keydown,keyup,click이런걸 가능하게해야됨
    for (let i = 0; i < dependencies.length; i++) {
        const dependency = dependencies[i];
        listenToTopLevel(dependency, mountAt, listeningSet);
    }
};

/**
 *
 * @param {*} registrationName
 * @param {*} mountAt
 * @returns {boolean}
 * @description registrationName에 대한 모든 종속성을 듣고 있는지 확인한다.
 */
export const isListeningToAllDependencies = (registrationName, mountAt) => {
    const listeningSet = getListeningSetForElement(mountAt);
    const dependencies = registrationNameDependencies[registrationName];
    for (let i = 0; i < dependencies.length; i++) {
        if (!listeningSet.has(dependencies[i])) {
            return false;
        }
    }
    return true;
};
export { setEnabled, isEnabled, trapBubbledEvent, trapCapturedEvent };
