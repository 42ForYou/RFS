/**
 * @file createRoot.js
 * @description This file defines the function related to the root of the application.
 * @description Order
 * createRoot
 * -*-isValidContainer
 * -*-ReactDOMRoot Constructor
 * -*--*--*-createRootImpl
 * -*--*--*--*-createContainer
 * -*--*--*--*--*-createFiberRoot
 * -*--*--*--*--*--*-FiberRootNode Constructor
 * -*--*--*--*--*--*-bindFiberRootToHostRootFiber
 * -*--*--*--*--*-markContainerAsRoot
 **/

//todo: updateContainer
//todo: ReactDOMRoot.render
//todo: ReactDOMRoot.unmount

import {
    ELEMENT_NODE,
    DOCUMENT_NODE,
    DOCUMENT_FRAGMENT_NODE,
} from "./const.js";
import { ConcurrentRoot } from "../type/TRootTag.js";
import { createFiberRoot } from "../fiber/fiberRoot.js";
//todo: dom.js
import { markContainerAsRoot } from "../dom/dom.js";
import { TFiberRoot } from "../type/TFiberRoot.js";
import { TDOMRootType, DOMContainer } from "../type/TDomType.js";
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
 * @param {RootTag} RootTag -> Refer to const.js @type {TRootTag}
 * @returns {fiberRootNode} -> fiberRoot에 대해 globalScope로 역할을 하는 객체를 반환합니다.
 * @description container = fiberRoot인건데 이렇게 래핑하는 이유는, 일반적인 프론트엔드 프레임워크에서
 * spa의 짐입점을 나타내는 것을 container라고 합니다. 이 함수는 그 짐입점을 만들어주는 것을 의미합니다.
 * 내부 구현이 FiberRoot를 생성하는걸로 되어 있을 뿐입니다. 이는 interface와 구현을 분리하기 위해서입니다.
 */
const createContainer = (container, tag) => {
    return createFiberRoot(container, tag);
};

/**
 * @param {container} container -> Element|Document|DocumentFragment -> 파이버 루트에 대응되는 돔 노드
 * @param {tag} TRootTag -> Refer srcs/shared/type/TRootTag.js
 * @returns {root}  @type {TFiberRoot}-> fiberRoot에 대해 globalScope로 역할을 하는 객체를 반환합니다.
 */
const createRootImpl = (container, tag) => {
    const root = createContainer(container, tag);
    //마크를 하는 이유는 돔 노드에 해당 파이버와 연결을 해주기 위해서입니다
    markContainerAsRoot(root.current, container);
    return root;
};

const ReactDOMRoot = class {
    /**
     *
     * @param {container} 파이버의 루트노드를 할 DOM노드를 인자로 받는다
     * @description ReactDOMRoot는 전역관리 공간인 FiberRootNode를 래핑합니다
     * @description 이 래핑은 render와 unmount의 원할한 공유를 위하여 이루어집니다
     * @returns {TDOMRootType} -> @type {TDOMRootType}
     */
    constructor(container) {
        this._internalRoot = createRootImpl(container, ConcurrentRoot);
    }

    /**
     * @param {children} children -> RFSNodeList -> ReactNodeList
     *
     */
    render(children) {
        const root = this._internalRoot;
        updateContainer(children, root, null, null);
    }
};
/**
 *
 * @param {container} @type {DOMContainer} container -> host Instance를 인자로 받는다-> Element|Document|DocumentFragment
 * @description // createRoot는 해당 Fiber에 대해서 관리를 위한 그 스코프내의 전역관리 공간이라고 생각할 수 있습니다.
 * @description // 이 전역공간은 ReactDOMRoot에 의해 래핑되어 있습니다.
 */
export const createRoot = (container) => {
    if (!isValidContainer(container)) {
        throw new Error(
            "createRoot: container is not a valid DOM element -RFS error"
        );
    }
    return new ReactDOMRoot(container);
};
