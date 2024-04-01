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
            //TODO: trapBubbledEvent, TOP_LOAD구현
            trapBubbledEvent(TOP_LOAD, domElement);
            props = rawProps;
            break;
        case "video":
        case "audio":
            //TODO: trapBubbledEvent, mediaEventTypes구현
            //TODO: for문 문맥 파악
            for (let i = 0; i < mediaEventTypes.length; i++) {
                trapBubbledEvent(mediaEventTypes[i], domElement);
            }
            props = rawProps;
            break;
        case "source":
            //TODO: trapBubbledEvent, TOP_ERROR, TOP_LOAD구현
            trapBubbledEvent(TOP_ERROR, domElement);
            props = rawProps;
            break;
        case "img":
        case "image":
        case "link":
            //TODO: trapBubbledEvent, TOP_ERROR, TOP_LOAD구현
            trapBubbledEvent(TOP_ERROR, domElement);
            trapBubbledEvent(TOP_LOAD, domElement);
            props = rawProps;
            break;
        case "form":
            //TODO: trapBubbledEvent, TOP_RESET, TOP_SUBMIT구현
            //TODO: 문맥 파악
            trapBubbledEvent(TOP_RESET, domElement);
            trapBubbledEvent(TOP_SUBMIT, domElement);
            props = rawProps;
            break;
        case "details":
            //TODO: trapBubbledEvent, TOP_TOGGLE구현
            trapBubbledEvent(TOP_TOGGLE, domElement);
            props = rawProps;
            break;
        case "input":
            //TODO: input문맥 파악
            //TODO: ReactDOMInputInitWrapperState구현
            ReactDOMInputInitWrapperState(domElement, rawProps);
            //TODO: ReactDOMInputGetHostProps구현
            props = ReactDOMInputGetHostProps(domElement, rawProps);

            ensureListeningTo(rootContainerElement, "onChange");
            break;
        case "option":
            //TOdO: ReactDOMOptionInitWrapperState구현
            ReactDOMOptionInitWrapperState(domElement, rawProps);
            //TODO: ReactDOMOptionGetHostProps구현
            props = ReactDOMOptionGetHostProps(domElement, rawProps);
            //TODO: trapBubbledEvent, TOP_INVALID구현
            trapBubbledEvent(TOP_INVALID, domElement);
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
