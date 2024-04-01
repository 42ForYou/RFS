import { DOCUMENT_NODE } from "../../const/CDomNodeType.js";
import { Namespaces, getIntrinsicNamespace } from "./domNamepsace.js";

const HTML_NAMESPACE = Namespaces.html;
/**
 *
 * @param {THostContainer} rootContainerElement @see 파일경로: type/THostType.js
 * @description rootContainerElement로 부터 ownerDocument를 가져오는 함수입니다.
 * @description 기본적으로 domElement는 nodeType속성으로 분류되고
 * @description document.createElement로 생성된 domElement는 property에 ownerDocument
 * @description 로참조를 가지고 있음 document객체의 참조를 가지고 있는데 그 참조를 통해서 document객체를 가져올수 있는데 그걸 가져오는 함수입니다.
 */
const getOwnerDocumentFromRootContainer = (rootContainerElement) => {
    return rootContainerElement.nodeType === DOCUMENT_NODE ? rootContainerElement : rootContainerElement.ownerDocument;
};
/**
 *
 * @param {THostType} type @see 파일경로: type/THostType.js
 * @param {THostProps} props @see 파일경로: type/THostType.js
 * @param {THostContainer} rootContainerInstance @see 파일경로: type/THostType.js
 * @param {THostContext} hostContext @see 파일경로: type/THostType.js
 */
export const createElement = (type, props, rootContainerInstance, parentNamespace) => {
    //기본적으로 document.createElement와 같이 domElement를 생성하려면 ownerDocument를 가져와야함
    const ownerDocument = getOwnerDocumentFromRootContainer(rootContainerInstance);

    let domElement;
    let currentNamespace;
    //TODO: HTML_NAMESPACE, getIntrinsicNamespace구현
    //부모가 HTMLNAMESPAC라면 type을보고 현재 namespace를 결정
    if (parentNamespace === HTML_NAMESPACE) {
        currentNamespace = getIntrinsicNamespace(type);
    } else {
        //부모가 HTMLNAMESPACE가 아니라면 부모의 namespace를 그대로 사용
        currentNamespace = parentNamespace;
    }
    if (currentNamespace === HTML_NAMESPACE) {
    } else {
        //namespace가 HTML이 아닐때는 namespace를 지정해서 domElement를 생성
        domElement = ownerDocument.createElementNS(currentNamespace, type);
    }

    return domElement;
};
