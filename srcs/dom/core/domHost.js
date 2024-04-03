import { precacheFiberNode, updateFiberProps } from "./domComponentConnection.js";
import { createElement } from "./domComponent.js";
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
