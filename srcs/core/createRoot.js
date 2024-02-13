/**
 * @file createRoot.js
 * @description This file defines the function related to the root of the application.
 */

import { ELEMENT_NODE, DOCUMENT_NODE, DOCUMENT_FRAGMENT_NODE } from "./const";
import { ConcurrentRoot } from "./const";
import { createFiberRoot } from "../fiber/fiberRoot";
/**
 * @param {container} container-> Type은 노드 타입-> Element|Document|DocumentFragment
 * @returns {boolean} -> container가 유효한지 확인하는 함수
 * @description container가 유효한지 확인하는 함수
 */
// note: !!()-> implicit type conversion to boolean
// isValidContainer는 container가 유효한지 확인하는 함수 입니다. 기본적으로 유효한 것은 node여야 되며,
// 그 node는 ELEMENT_NODE, DOCUMENT_NODE, DOCUMENT_FRAGMENT_NODE 중에 하나여야 합니다.
const isValidContainer = (container) => {
    return !!(
        container &&
        (container.nodeType === ELEMENT_NODE ||
            container.nodeType === DOCUMENT_NODE ||
            container.nodeType === DOCUMENT_FRAGMENT_NODE)
    );
};

/**
 *
 * @param {container} container -> Element|Document|DocumentFragment
 * @param {RootTag} RootTag -> Refer to const.js
 * @returns {fiberRootNode} -> fiberRoot에 대해 globalScope로 역할을 하는 객체를 반환합니다.
 */
const createContainer = (container, tag) => {
    return createFiberRoot(containerinfo, tag);
};
const ReactDOMRoot = class {
    /**
     *
     * @param {inertnalRoot} FiberRootNode
     * @description ReactDOMRoot는 전역관리 공간인 FiberRootNode를 래핑합니다
     * @description 이 래핑은 render와 unmount의 원할한 공유를 위하여 이루어집니다
     */
    constructor(internalRoot) {
        this._internalRoot = internalRoot;
    }
    /**
     * @param {children} children -> ReactNodeList, jsx(reactelement) That want to display
     * @description render는 해당 ReactDOMRoot에 대한 래핑된 FiberRootNode에 대해서 render를 수행합니다
     * @description 이는 HostRoot의 Update를 Schedule하고, 그에 따른 작업을 수행하는걸 의미합니다
     */
    render(children) {
        updateContainer(children, this._internalRoot, null, null);
    }
};
/**
 *
 * @param {container} container -> host Instance를 인자로 받는다-> Element|Document|DocumentFragment
 * @description // createRoot는 해당 Fiber에 대해서 관리를 위한 그 스코프내의 전역관리 공간이라고 생각할 수 있습니다. 그 전역관리 공간의 설정은 해당
// 짐입점으로 부터 시작하는 createContainer에 의해서 만들어지고, render와 Unmount의 원할한 공유를 위하여 한번 ReactDOMRoot에 의해서 랩핑되어서 반환되어집니다
 */

export const createRoot = (container) => {
    if (!isValidContainer(container)) {
        throw new Error(
            "createRoot: container is not a valid DOM element -RFS error"
        );
    }
    const root = createContainer(container, ConcurrentRoot);
    //Todo: this will be imported from the event module
    //listenToAllSupportedEvents();
    //
    return new ReactDOMRoot(root);
};

/**
 * @param {container} container
 * @param {rootTag} RootTag // refer to const.js
 */
