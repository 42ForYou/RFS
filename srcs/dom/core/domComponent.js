import { DOCUMENT_NODE } from "../../const/CDomNodeType.js";
import { Namespaces, getIntrinsicNamespace } from "./domNamepsace.js";
import {
    TOP_ERROR,
    TOP_INVALID,
    TOP_LOAD,
    TOP_RESET,
    TOP_SUBMIT,
    TOP_TOGGLE,
    mediaEventTypes,
} from "../event/domTopLevelEventType.js";
import { trapBubbledEvent } from "../event/eventEmmiter.js";
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

//NOTE: 웹 컴포넌트를 확장할떄 기존의 dom태그를 사용하려면 무조건 is를 사용해야되고
//NOTE: 그게아니라면 -를 무조건 붙여야됨 그중에서 기본적으로 확장이 아닌 -가 들어가는
//NOTE: tag이면 false를 리턴하고 그외에는 true를 리턴함
/**
 *
 * @param {string} tagName
 * @param {TProps} props
 * @returns {boolean}
 * @description 웹컴포넌트는 확장이 가능(element)그걸 사용하려면 두가지 방법이 존재하는데
 * @description 하나는 props.is를 쓰면서 기존의 tag를 이용하는 방식과
 * @description 다른하나는 -를 붙여서 확장하는 방식이 있는데 그것을 판별하는 함수입니다.
 * @description -가 들어가있는 tag중에 몇몇은 예외로 두고 customComponent로 판별합니다.
 */
const isCustomComponent = (tagName, props) => {
    if (tagName.indexOf("-") === -1) {
        return typeof props.is === "string";
    }
    switch (tagName) {
        // https://w3c.github.io/webcomponents/spec/custom/#custom-elements-core-concepts
        case "annotation-xml":
        case "color-profile":
        case "font-face":
        case "font-face-src":
        case "font-face-uri":
        case "font-face-format":
        case "font-face-name":
        case "missing-glyph":
            return false;
        default:
            return true;
    }
};

/**
 *
 * @param {THostInstance} domElement @see 파일경로: type/THostType.js
 * @param {THostType} tag -> THostType을 넣는 방식으로 진행되지만 추상화 안에선, dom의 tag를 의미함으로 이름이 다음과 같음. @see 파일경로: type/THostType.js
 * @param {THostProps} rawProps -> rfs내부의 TProps를 넣는 방식으로 진행되지만 추상화 안에선, dom의 rawProps를 의미 @see 파일경로: type/THostType.js
 * @param {THostContainer} rootContainerInstance @see 파일경로: type/THostType.js
 * @description 초기 hostInstance(dominstance)의 초기 세팅-프로퍼티 세팅및 이벤트 세팅등을 진행하는 함수입니다.
 */
export const setInitialProperties = (domElement, tag, rawProps, rootContainerElement) => {
    const isCustomComponentTag = isCustomComponent(tag, rawProps);

    let props;
    //TODO: props관리 로직 문맥파악
    //NOTE: 이부분은 특수하게 처리해야 되서 이벤트 위임이 아니라 해당 domElement에 이벤트를 등록해야 하는 경우에 대한 부분
    switch (tag) {
        case "iframe":
        case "object":
        case "embed":
            trapBubbledEvent(TOP_LOAD, domElement);
            props = rawProps;
            break;
        case "video":
        case "audio":
            //TODO: for문 문맥파악
            for (let i = 0; i < mediaEventTypes.length; i++) {
                trapBubbledEvent(mediaEventTypes[i], domElement);
            }
            props = rawProps;
            break;
        case "source":
            trapBubbledEvent(TOP_ERROR, domElement);
            props = rawProps;
            break;
        case "img":
        case "image":
        case "link":
            trapBubbledEvent(TOP_ERROR, domElement);
            trapBubbledEvent(TOP_LOAD, domElement);
            props = rawProps;
            break;
        case "form":
            trapBubbledEvent(TOP_RESET, domElement);
            trapBubbledEvent(TOP_SUBMIT, domElement);
            props = rawProps;
            break;
        case "details":
            trapBubbledEvent(TOP_TOGGLE, domElement);
            props = rawProps;
            break;
        case "input":
            //TODO: ReactDOMInputInitWrapperState구현
            ReactDOMInputInitWrapperState(domElement, rawProps);
            //TODO: ReactDOMInputValidateProps구현
            props = ReactDOMInputGetHostProps(domElement, rawProps);
            trapBubbledEvent(TOP_INVALID, domElement);
            // For controlled components we always need to ensure we're listening
            // to onChange. Even if there is no listener.
            //TODO: ensureListeningTo구현
            ensureListeningTo(rootContainerElement, "onChange");
            break;
        case "option":
            //TODO: ReactDOMOptionValidateProps구현
            ReactDOMOptionValidateProps(domElement, rawProps);
            //TODO: ReactDOMOptionGetHostProps구현
            props = ReactDOMOptionGetHostProps(domElement, rawProps);
            break;
        case "select":
            //TODO: ReactDOMSelectInitWrapperState구현
            ReactDOMSelectInitWrapperState(domElement, rawProps);
            //TODO: ReactDOMSelectValidateProps구현
            props = ReactDOMSelectGetHostProps(domElement, rawProps);
            trapBubbledEvent(TOP_INVALID, domElement);
            // For controlled components we always need to ensure we're listening
            // to onChange. Even if there is no listener.
            //TODO: ensureListeningTo구현
            ensureListeningTo(rootContainerElement, "onChange");
            break;
        case "textarea":
            //TODO: ReactDOMTextareaInitWrapperState구현
            ReactDOMTextareaInitWrapperState(domElement, rawProps);
            //TODO: ReactDOMTextareaValidateProps구현
            props = ReactDOMTextareaGetHostProps(domElement, rawProps);
            trapBubbledEvent(TOP_INVALID, domElement);
            // For controlled components we always need to ensure we're listening
            // to onChange. Even if there is no listener.
            //TODO: ensureListeningTo구현
            ensureListeningTo(rootContainerElement, "onChange");
            break;
        default:
            props = rawProps;
    }

    //TODO: setInitialDOMProperties문맥 부터 구현
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
    //TODO: setInitialProperties구현
    //hotsInstance의 이벤트, property등 기초적인 세팅을 진행
    setInitialProperties(domElement, type, props, rootContainerInstance);
    //TODO: shouldAutoFocusHostComponent구현
    return shouldAutoFocusHostComponent(type, props);
};
