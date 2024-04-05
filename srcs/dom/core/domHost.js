import { precacheFiberNode, updateFiberProps } from "./domComponentConnection.js";
import { createElement, setInitialProperties, updateProperties } from "./domComponent.js";
import setTextContent from "./setTextContent.js";
import {
    ELEMENT_NODE,
    DOCUMENT_NODE,
    DOCUMENT_FRAGMENT_NODE,
    COMMENT_NODE,
    TEXT_NODE,
} from "../../const/CDomNodeType.js";
import {
    isEnabled as rfsBrowserEventEmitterIsEnabled,
    setEnabled as rfsBrowserEventEmitterSetEnabled,
} from "../event/eventEmmiter.js";
import { getSelectionInformation, restoreSelection } from "../core/element/inputSelection.js";

import { trapClickOnNonInteractiveElement, diffProperties } from "./domComponent.js";
import { getChildNamespace } from "../core/domNamepsace.js";

let eventsEnabled = null;
let selectionInformation = null;
const shouldAutoFocusHostComponent = (type, props) => {
    switch (type) {
        case "button":
        case "input":
        case "select":
        case "textarea":
            return !!props.autoFocus;
    }
    return false;
};
export const getRootHostContext = (rootContainerInstance) => {
    let type;
    let namespace;
    const nodeType = rootContainerInstance.nodeType;
    switch (nodeType) {
        case DOCUMENT_NODE:
        case DOCUMENT_FRAGMENT_NODE: {
            type = nodeType === DOCUMENT_NODE ? "#document" : "#fragment";
            const root = rootContainerInstance.documentElement;
            namespace = root ? root.namespaceURI : getChildNamespace(null, "");
            break;
        }
        default: {
            const container = nodeType === COMMENT_NODE ? rootContainerInstance.parentNode : rootContainerInstance;
            const ownNamespace = container.namespaceURI || null;
            type = container.tagName;
            namespace = getChildNamespace(ownNamespace, type);
            break;
        }
    }
    return namespace;
};

export const getChildHostContext = (parentHostContext, type, rootContainerInstance) => {
    const parentNamespace = parentHostContext;
    return getChildNamespace(parentNamespace, type);
};
/**
 *
 * @param {THostType} type @see 파일경로: type/THostType.js
 * @param {THostProps} props @see 파일경로: type/THostType.js
 * @param {THostContainer} rootContainerInstance @see 파일경로: type/THostType.js
 * @param {THostContext} hostContext @see 파일경로: type/THostType.js
 * @param {Object} internalInstanceHandle
 * @description 실제 domInstance를 생성하는 함수입니다.
 */
export const createInstance = (type, props, rootContainerInstance, hostContext, internalInstanceHandle) => {
    const parentNamespace = hostContext;
    const domElement = createElement(type, props, rootContainerInstance, parentNamespace);
    //새롭게 만들떄 돔에서 파이버로 향하는 연결을 만듬
    precacheFiberNode(internalInstanceHandle, domElement);
    //rfs내부에서 관리하는 props객체를 domElement에 연결
    updateFiberProps(domElement, props);
    return domElement;
};

/**
 *
 * @param {THostInstance} parentInstance @see 파일경로: type/THostType.js
 * @param {THostInstance|THostTextInstance} child @see 파일경로: type/THostType.js
 * @description 부모에 자식을 추가하는 함수입니다.
 */
export const appendInitialChild = (parentInstance, child) => {
    parentInstance.appendChild(child);
};

/**
 *
 * @param {THostInstance} domElement @see 파일경로: type/THostType.js
 * @param {THostType} type @see 파일경로: type/THostType.js
 * @param {THostProps} props @see 파일경로: type/THostType.js
 * @param {THostContainer} rootContainerInstance @see 파일경로: type/THostType.js
 * @returns {boolean}
 * @description children의 호스트 세팅관련된 모든것들을 마무리하는 함수입니다.
 * @description event관련 세팅, domProperty세팅등을 마무리합니다.
 */
export const finalizeInitialChildren = (domElement, type, props, rootContainerInstance) => {
    //hotsInstance의 이벤트, property등 기초적인 세팅을 진행
    setInitialProperties(domElement, type, props, rootContainerInstance);
    return shouldAutoFocusHostComponent(type, props);
};

export const prepareUpdate = (domElement, type, oldProps, newProps, rootContainerInstance, hostContext) => {
    return diffProperties(domElement, type, oldProps, newProps, rootContainerInstance);
};
/**
 *
 * @param {*} instance
 * @description 공개 인스턴스를 반환하는 함수
 */
export const getPublicInstance = (instance) => {
    return instance;
};

/**
 * 
 * @param {*} domElement 
 * @param {*} type 
 * @param {*} newProps 
 * @param {*} internalInstanceHandle
 * @description 컴포넌트가 화면에 추가되었을 때 필요한 추가적인 처리를 하기 위한 것입니다. 
 * 주석에서 언급한 바와 같이, 
 * 이 함수의 이름은 다소 오해의 소지가 있을 수 있는데, 
 * 실제로 이 함수는 마운트 과정에서 Update 이펙트가 예약되어 있는 경우에만 실행됩니다. 
 * 함수 내부에서는 finalizeInitialChildren 함수가 true를 반환하는 경우에만 실행되는데, 
 * 이는 주로 autoFocus 속성과 같은 클라이언트 측에서만 구현되는 기능을 활성화할 때 발생합니다. 예를 들어, 폼 입력 필드나 버튼 등에 autoFocus 속성이 지정된 경우, 해당 요소가 화면에 마운트되자마자 자동으로 포커스를 받게 됩니다.

commitMount 함수는 shouldAutoFocusHostComponent 함수를 사용하여,
 주어진 타입의 호스트 컴포넌트(HTML 엘리먼트)와 새로운 속성에 기반하여 해당 컴포넌트가 자동 포커스를 받아야 하는지 여부를 결정합니다. 이 조건이 충족되면, 즉 shouldAutoFocusHostComponent 함수가 true를 반환하면, DOM 요소에 focus() 메서드를 호출하여 해당 요소에 포커스를 줍니다.
 */
export const commitMount = (domElement, type, newProps, internalInstanceHandle) => {
    // 다른 것을 암시할 수 있는 이름에도 불구하고 이 메서드는 오직
    // 마운트하는 동안 '업데이트' 이펙트가 예약된 경우에만 호출됩니다.
    // 이 메서드는 `finalizeInitialChildren`이 `true`를 반환하는 경우 발생합니다.
    // 클라이언트에서 `autoFocus` 속성을 구현하기 위해 수행합니다). 하지만
    // 이런 일이 발생할 수 있는 다른 경우도 있습니다

    if (shouldAutoFocusHostComponent(type, newProps)) {
        domElement.focus();
    }
};

export const commitUpdate = (domElement, updatePayload, type, oldProps, newProps, internalInstanceHandle) => {
    // Update the props handle so that we know which props are the ones with
    // with current event handlers.
    updateFiberProps(domElement, newProps);
    // DOM 노드에 diff를 적용합니다.
    updateProperties(domElement, updatePayload, type, oldProps, newProps);
};

export const resetTextContent = (domElement) => {
    setTextContent(domElement, "");
};

export const commitTextUpdate = (textInstance, oldText, newText) => {
    textInstance.nodeValue = newText;
};

export const appendChild = (parentInstance, child) => {
    parentInstance.appendChild(child);
};

export const appendChildToContainer = (container, child) => {
    let parentNode;
    if (container.nodeType === COMMENT_NODE) {
        parentNode = container.parentNode;
        parentNode.insertBefore(child, container);
    } else {
        parentNode = container;
        parentNode.appendChild(child);
    }
    // 이 컨테이너는 포털에 사용될 수 있습니다.
    // 포털 내부의 무언가를 클릭하면 해당 클릭은 버블을 발생시켜야 합니다.
    // rfs 트리를 통해 발생해야 합니다. 하지만 모바일 사파리에서는 클릭이
    // onclick 이벤트가 있는 조상이 존재하지 않는 한 *DOM* 트리를 통해 버블링되지 않습니다.
    // 이벤트가 있는 조상이 존재하지 않는 한 그래서 우리는 그것을 보지 못하고 디스패치하지 않을 것입니다.
    // 이것이 바로 rfs 루트 컨테이너가 아닌 다른 컨테이너에 인라인 onclick
    //가 정의되어 있는지 확인해야 합니다.
    // https://github.com/facebook/rfs/issues/11918
    const rfsRootContainer = container._rfsRootContainer;
    if ((rfsRootContainer === null || rfsRootContainer === undefined) && parentNode.onclick === null) {
        trapClickOnNonInteractiveElement(parentNode);
    }
};

export const insertBefore = (parentInstance, child, beforeChild) => {
    parentInstance.insertBefore(child, beforeChild);
};

export const insertInContainerBefore = (container, child, beforeChild) => {
    if (container.nodeType === COMMENT_NODE) {
        container.parentNode.insertBefore(child, beforeChild);
    } else {
        container.insertBefore(child, beforeChild);
    }
};

export const removeChild = (parentInstance, child) => {
    parentInstance.removeChild(child);
};

export const removeChildFromContainer = (container, child) => {
    if (container.nodeType === COMMENT_NODE) {
        container.parentNode.removeChild(child);
    } else {
        container.removeChild(child);
    }
};

export const shouldSetTextContent = (type, props) => {
    return (
        type === "textarea" ||
        type === "option" ||
        type === "noscript" ||
        typeof props.children === "string" ||
        typeof props.children === "number" ||
        (typeof props.dangerouslySetInnerHTML === "object" &&
            props.dangerouslySetInnerHTML !== null &&
            props.dangerouslySetInnerHTML.__html !== null)
    );
};

export const prepareForCommit = (containerInfo) => {
    eventsEnabled = rfsBrowserEventEmitterIsEnabled();
    selectionInformation = getSelectionInformation();
    rfsBrowserEventEmitterSetEnabled(false);
};

export const resetAfterCommit = (containerInfo) => {
    restoreSelection(selectionInformation);
    selectionInformation = null;
    rfsBrowserEventEmitterSetEnabled(eventsEnabled);
    eventsEnabled = null;
};

export const cancelTimeout = typeof clearTimeout === "function" ? clearTimeout : undefined;
export const noTimeout = -1;
export const isPrimaryRenderer = true;
