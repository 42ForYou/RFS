/**
 * @file dom.js
 * @description 해당 파일은 dom에 파이버를 연결해주기 위한 함수들을 정의하고 있습니다.
 * 단 방향(파이버에서 -> dom으로)으로만의 연결이 아니라 양방향으로 연결하는 이유는
 * 이벤트 핸들러를 등록하고 실행시킬 때 파이버로 부터 필요한 정보를 얻기 위함입니다.
 * 나중의 이벤트 작업을 위하여 파이버와 의 돔간의 양방향 통신을 체결하였습니다.
 * 기존의 jsx에서 onClick하는 방식으로 useState와 같은 훅이 제공하는 disPatcher를 클로저로
 * 캡처하여 eventHandler가 관련된 Component와 관련된 문맥을 다 캐치할 수 있지만
 * 이벤트 위임과 이벤트 캡처링시 부모가 자식의 이벤트를 인터럽트 할 수 있어야 하기 때문에
 * 필요할 수 있다
 */

import { HostComponent, HostText, HostRoot } from "../../const/CWorkTag.js";

/**
 * @description 랜덤한 문자열 키를 생성합니다
 * 처음 초기화될 때 한번만 호출되며, 이후에는 해당 키를 사용합니다.
 * order
 * 숫자로 랜덤을 만듬(math.random()을 통해서 0~1사이의 랜덤한 숫자만듬)
 *->toString(36)을 통해서 숫자를 36진수로 바꿈 [0-9a-z]까지의 문자로 표현됨- 원하는 숫자와 문자열 조합을 만드는데 사용
 *->랜덤한 숫자는 0.~~임으로 slice(2)를 통해서 0.을 제거함
 * ->랜덤한 문자열을 만들어냄
 */
const randomKey = Math.random().toString(36).slice(2);
const connectInstanceKey = "__rfsInternalInstance$" + randomKey;
const connectEventHandlersKey = "__rfsEventHandlers$" + randomKey;
const connectContainerInstanceKey = "__rfsContainere$" + randomKey;

/**
 *
 * @param {TFiber} hostInst hostComponentFiber인스턴스를 의미
 * @param {TDOMElem} node domElement를 의미
 * @description 해당함수는 미리 hostFiber와 domElement를 연결해주는 함수입니다.
 */
export const precacheFiberNode = (hostInst, node) => {
    node[connectInstanceKey] = hostInst;
};

/**
 *
 * @param {TDOMElem} node
 * @param {THostProps} props @see 파일경로: type/THostType.js
 * @description rfs내부에서 관리하는 props객체를 domElement에 연결->
 * 이벤트 핸들러 키에다가 넣어두고 나중에 여길 통로로 위에서 라우팅해서 쓰는듯
 */
export const updateFiberProps = (node, props) => {
    node[connectEventHandlersKey] = props;
};

/**
 *
 * @param {ThostRoot} @type TFiberRoot  @description hostRoot -> 파이버루트에 해당하는 파이버인스턴스가 들어온다
 * @param {TDOMElem} @type HTMLElement @description Dom인스턴스가 들어온다- 해당 파이버와 연결될
 */
export const markContainerAsRoot = (hostRoot, node) => {
    node[connectContainerInstanceKey] = hostRoot;
};

/**
 *
 * @param {THostInstance} targetNode
 * @returns {TFiber|null}
 * @description 해당 domInstance와 연결된 파이버를 가져오는 함수입니다.
 * @description 만약 연결이 안되 있다라면 부모 노드중 가장 가까운 노드를 찾아서 연결된 파이버를 가져옵니다.
 */
export const getClosestInstanceFromNode = (targetNode) => {
    let targetInst = targetNode[connectInstanceKey];
    if (targetInst) {
        // Don't return HostRoot or SuspenseComponent here.
        return targetInst;
    }
    //targetNode에 연결된 파이버가 없다면 부모노드로 이동
    let parentNode = targetNode.parentNode;
    while (parentNode) {
        targetInst = parentNode[connectContainerInstanceKey] || parentNode[connectInstanceKey];
        if (targetInst) {
            return targetInst;
        }
        targetNode = parentNode;
        parentNode = targetNode.parentNode;
    }
    return null;
};

/**
 *
 * @param {*} targetNode
 * @returns {TFiber|null}
 * @description 해당 domElementd와 연결된 파이버를 가져오는 함수입니다.
 * @description 만약 연결이 안되있음 null을 반환합니다.
 */
export const getFiberCurrentPropsFromNode = (targetNode) => {
    return targetNode[connectEventHandlersKey] || null;
};

/**
 *
 * @param {*} targetNode
 * @returns {TFiber|null}
 * @description 해당 노드로 부터 대응 되는 파이버를 가져오는데 HostFiber류만 가져옵니다.
 */
export const getInstanceFromNode = (targetNode) => {
    const inst = targetNode[connectInstanceKey] || targetNode[connectContainerInstanceKey];
    if (inst) {
        if (inst.tag === HostComponent || inst.tag === HostText || inst.tag === HostRoot) {
            return inst;
        } else {
            return null;
        }
    }
    return null;
};

/**
 *
 * @param {TFiber} inst
 * @returns {THostInstance}
 * @description 해당 파이버에 대응되는 hostInstance를 가져오는 함수입니다.
 */
export const getNodeFromInstance = (inst) => {
    if (inst.tag === HostComponent || inst.tag === HostText) {
        return inst.stateNode;
    }
    console.error("getNodeFromInstance: Invalid argument.");
    throw new Error("getNodeFromInstance: Invalid argument.");
};
