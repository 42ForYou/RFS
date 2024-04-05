import { DOCUMENT_NODE, DOCUMENT_FRAGMENT_NODE } from "../../const/CDomNodeType.js";
import { Namespaces, getIntrinsicNamespace } from "./domNamepsace.js";

import { setValueForProperty } from "./domPropertyOperation.js";
import { toStringOrTrustedType } from "./toStringValue.js";
import {
    initWrapperState as rfsDOMInputInitWrapperState,
    getHostProps as rfsDOMInputGetHostProps,
    postMountWrapper as rfsDOMInputPostMountWrapper,
    updateChecked as rfsDOMInputUpdateChecked,
    updateWrapper as rfsDOMInputUpdateWrapper,
    restoreControlledState as rfsDOMInputRestoreControlledState,
} from "./domInput.js";
import {
    getHostProps as rfsDOMOptionGetHostProps,
    postMountWrapper as rfsDOMOptionPostMountWrapper,
} from "./domOption.js";
import {
    initWrapperState as rfsDOMSelectInitWrapperState,
    getHostProps as rfsDOMSelectGetHostProps,
    postMountWrapper as rfsDOMSelectPostMountWrapper,
    restoreControlledState as rfsDOMSelectRestoreControlledState,
    postUpdateWrapper as rfsDOMSelectPostUpdateWrapper,
} from "./domSelect.js";
import {
    initWrapperState as rfsDOMTextareaInitWrapperState,
    getHostProps as rfsDOMTextareaGetHostProps,
    postMountWrapper as rfsDOMTextareaPostMountWrapper,
    updateWrapper as rfsDOMTextareaUpdateWrapper,
    restoreControlledState as rfsDOMTextareaRestoreControlledState,
} from "./domTextarea.js";
import { track } from "../core/element/inputValueTracking.js";
import setInnerHTML from "./setInnerHTML.js";
import setTextContent from "./setTextContent.js";
import { setValueForStyles } from "./cssPropertyOperation.js";
import {
    TOP_ERROR,
    TOP_INVALID,
    TOP_LOAD,
    TOP_RESET,
    TOP_SUBMIT,
    TOP_TOGGLE,
    mediaEventTypes,
} from "../event/domTopLevelEventType.js";
import { listenTo, trapBubbledEvent, getListeningSetForElement } from "../event/eventEmmiter.js";
const HTML_NAMESPACE = Namespaces.html;
const AUTOFOCUS = "autoFocus";
const DANGEROUSLY_SET_INNER_HTML = "dangerouslySetInnerHTML";
const CHILDREN = "children";
const STYLE = "style";
const HTML = "__html";
const LISTENERS = "listeners";
const noop = () => {};

export const trapClickOnNonInteractiveElement = (node) => {
    // 모바일 Safari에서 버블 클릭 이벤트가 제대로 발생하지 않습니다.
    // 비대화형 요소, 즉 위임된 클릭 리스너에서 버블 클릭 이벤트가
    // 실행되지 않습니다. 이 버그의 해결 방법은 대상 노드에 빈 클릭 리스너를 첨부하는 것입니다.
    // 리스너를 대상 노드에 첨부하는 것입니다.
    // http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
    // 클릭 속성을 사용하여 설정하기만 하면 됩니다.
    // 북키핑을 관리할 필요가 없습니다. 리스너가 제거되었을 때 이를 지워야 하는지 확실하지 않습니다.
    // 제거해야 하는지 잘 모르겠습니다.
    // 할 일: 관련 Safari에만 이 작업을 수행하면 될까요?
    node.onclick = noop;
};

const ensureListeningTo = (rootContainerElement, registrationName) => {
    const isDocumentOrFragment =
        rootContainerElement.nodeType === DOCUMENT_NODE || rootContainerElement.nodeType === DOCUMENT_FRAGMENT_NODE;
    const doc = isDocumentOrFragment ? rootContainerElement : rootContainerElement.ownerDocument;
    listenTo(registrationName, doc);
};
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

const setInitialDOMProperties = (tag, domElement, rootContainerElement, nextProps, isCustomComponentTag) => {
    for (const propKey in nextProps) {
        if (!nextProps.hasOwnProperty(propKey)) {
            continue;
        }
        const nextProp = nextProps[propKey];
        if (propKey === STYLE) {
            // Relies on `updateStylesByID` not mutating `styleUpdates`.
            setValueForStyles(domElement, nextProp);
        } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
            const nextHtml = nextProp ? nextProp[HTML] : undefined;
            if (nextHtml !== null) {
                setInnerHTML(domElement, nextHtml);
            }
        } else if (propKey === CHILDREN) {
            if (typeof nextProp === "string") {
                // Avoid setting initial textContent when the text is empty. In IE11 setting
                // textContent on a <textarea> will cause the placeholder to not
                // show within the <textarea> until it has been focused and blurred again.
                // https://github.com/facebook/rfs/issues/6731#issuecomment-254874553
                const canSetTextContent = tag !== "textarea" || nextProp !== "";
                if (canSetTextContent) {
                    setTextContent(domElement, nextProp);
                }
            } else if (typeof nextProp === "number") {
                setTextContent(domElement, "" + nextProp);
            }
        } else if (propKey === AUTOFOCUS) {
            // We polyfill it separately on the client during commit.
            // We could have excluded it in the property list instead of
            // adding a special case here, but then it wouldn't be emitted
            // on server rendering (but we *do* want to emit it in SSR).
        } else if (registrationNameModules.hasOwnProperty(propKey)) {
            if (nextProp !== null) {
                ensureListeningTo(rootContainerElement, propKey);
            }
        } else if (nextProp !== null) {
            setValueForProperty(domElement, propKey, nextProp, isCustomComponentTag);
        }
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
            rfsDOMInputInitWrapperState(domElement, rawProps);
            props = rfsDOMInputGetHostProps(domElement, rawProps);
            trapBubbledEvent(TOP_INVALID, domElement);
            // For controlled components we always need to ensure we're listening
            // to onChange. Even if there is no listener.
            ensureListeningTo(rootContainerElement, "onChange");
            break;
        case "option":
            props = rfsDOMOptionGetHostProps(domElement, rawProps);
            break;
        case "select":
            rfsDOMSelectInitWrapperState(domElement, rawProps);
            props = rfsDOMSelectGetHostProps(domElement, rawProps);
            trapBubbledEvent(TOP_INVALID, domElement);
            // For controlled components we always need to ensure we're listening
            // to onChange. Even if there is no listener.
            ensureListeningTo(rootContainerElement, "onChange");
            break;
        case "textarea":
            rfsDOMTextareaInitWrapperState(domElement, rawProps);
            props = rfsDOMTextareaGetHostProps(domElement, rawProps);
            trapBubbledEvent(TOP_INVALID, domElement);
            // For controlled components we always need to ensure we're listening
            // to onChange. Even if there is no listener.
            ensureListeningTo(rootContainerElement, "onChange");
            break;
        default:
            props = rawProps;
    }

    setInitialDOMProperties(tag, domElement, rootContainerElement, props, isCustomComponentTag);
    switch (tag) {
        case "input":
            // up necessary since we never stop tracking anymore.
            track(domElement);
            rfsDOMInputPostMountWrapper(domElement, rawProps, false);
            break;
        case "textarea":
            // up necessary since we never stop tracking anymore.
            track(domElement);
            rfsDOMTextareaPostMountWrapper(domElement, rawProps);
            break;
        case "option":
            rfsDOMOptionPostMountWrapper(domElement, rawProps);
            break;
        case "select":
            rfsDOMSelectPostMountWrapper(domElement, rawProps);
            break;
        default:
            if (typeof props.onClick === "function") {
                trapClickOnNonInteractiveElement(domElement);
            }
            break;
    }
};

const updateDOMProperties = (domElement, updatePayload, wasCustomComponentTag, isCustomComponentTag) => {
    for (let i = 0; i < updatePayload.length; i += 2) {
        const propKey = updatePayload[i];
        const propValue = updatePayload[i + 1];
        if (propKey === STYLE) {
            setValueForStyles(domElement, propValue);
        } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
            setInnerHTML(domElement, propValue);
        } else if (propKey === CHILDREN) {
            setTextContent(domElement, propValue);
        } else {
            setValueForProperty(domElement, propKey, propValue, isCustomComponentTag);
        }
    }
};

export const diffProperties = (domElement, tag, lastRawProps, nextRawProps, rootContainerElement) => {
    let updatePayload = null;

    let lastProps;
    let nextProps;
    switch (tag) {
        case "input":
            lastProps = rfsDOMInputGetHostProps(domElement, lastRawProps);
            nextProps = rfsDOMInputGetHostProps(domElement, nextRawProps);
            updatePayload = [];
            break;
        case "option":
            lastProps = rfsDOMOptionGetHostProps(domElement, lastRawProps);
            nextProps = rfsDOMOptionGetHostProps(domElement, nextRawProps);
            updatePayload = [];
            break;
        case "select":
            lastProps = rfsDOMSelectGetHostProps(domElement, lastRawProps);
            nextProps = rfsDOMSelectGetHostProps(domElement, nextRawProps);
            updatePayload = [];
            break;
        case "textarea":
            lastProps = rfsDOMTextareaGetHostProps(domElement, lastRawProps);
            nextProps = rfsDOMTextareaGetHostProps(domElement, nextRawProps);
            updatePayload = [];
            break;
        default:
            lastProps = lastRawProps;
            nextProps = nextRawProps;
            if (typeof lastProps.onClick !== "function" && typeof nextProps.onClick === "function") {
                trapClickOnNonInteractiveElement(domElement);
            }
            break;
    }

    let propKey;
    let styleName;
    let styleUpdates = null;
    for (propKey in lastProps) {
        if (nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey) || lastProps[propKey] === null) {
            continue;
        }
        if (propKey === STYLE) {
            const lastStyle = lastProps[propKey];
            for (styleName in lastStyle) {
                if (lastStyle.hasOwnProperty(styleName)) {
                    if (!styleUpdates) {
                        styleUpdates = {};
                    }
                    styleUpdates[styleName] = "";
                }
            }
        } else if (propKey === DANGEROUSLY_SET_INNER_HTML || propKey === CHILDREN) {
            // Noop. This is handled by the clear text mechanism.
        } else if (propKey === AUTOFOCUS) {
            // Noop. It doesn't work on updates anyway.
        } else if (registrationNameModules.hasOwnProperty(propKey)) {
            // This is a special case. If any listener updates we need to ensure
            // that the "current" fiber pointer gets updated so we need a commit
            // to update this element.
            if (!updatePayload) {
                updatePayload = [];
            }
        } else {
            // For all other deleted properties we add it to the queue. We use
            // the whitelist in the commit phase instead.
            (updatePayload = updatePayload || []).push(propKey, null);
        }
    }
    for (propKey in nextProps) {
        const nextProp = nextProps[propKey];
        const lastProp = lastProps !== null ? lastProps[propKey] : undefined;
        if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp || (nextProp === null && lastProp === null)) {
            continue;
        }
        if (propKey === STYLE) {
            if (lastProp) {
                // Unset styles on `lastProp` but not on `nextProp`.
                for (styleName in lastProp) {
                    if (lastProp.hasOwnProperty(styleName) && (!nextProp || !nextProp.hasOwnProperty(styleName))) {
                        if (!styleUpdates) {
                            styleUpdates = {};
                        }
                        styleUpdates[styleName] = "";
                    }
                }
                // Update styles that changed since `lastProp`.
                for (styleName in nextProp) {
                    if (nextProp.hasOwnProperty(styleName) && lastProp[styleName] !== nextProp[styleName]) {
                        if (!styleUpdates) {
                            styleUpdates = {};
                        }
                        styleUpdates[styleName] = nextProp[styleName];
                    }
                }
            } else {
                // Relies on `updateStylesByID` not mutating `styleUpdates`.
                if (!styleUpdates) {
                    if (!updatePayload) {
                        updatePayload = [];
                    }
                    updatePayload.push(propKey, styleUpdates);
                }
                styleUpdates = nextProp;
            }
        } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
            const nextHtml = nextProp ? nextProp[HTML] : undefined;
            const lastHtml = lastProp ? lastProp[HTML] : undefined;
            if (nextHtml !== null) {
                if (lastHtml !== nextHtml) {
                    (updatePayload = updatePayload || []).push(propKey, toStringOrTrustedType(nextHtml));
                }
            } else {
                // TODO: It might be too late to clear this if we have children
                // inserted already.
            }
        } else if (propKey === CHILDREN) {
            if (lastProp !== nextProp && (typeof nextProp === "string" || typeof nextProp === "number")) {
                (updatePayload = updatePayload || []).push(propKey, "" + nextProp);
            }
        } else if (registrationNameModules.hasOwnProperty(propKey)) {
            if (nextProp !== null) {
                // We eagerly listen to this even though we haven't committed yet.
                ensureListeningTo(rootContainerElement, propKey);
            }
            if (!updatePayload && lastProp !== nextProp) {
                // This is a special case. If any listener updates we need to ensure
                // that the "current" props pointer gets updated so we need a commit
                // to update this element.
                updatePayload = [];
            }
        } else {
            // For any other property we always add it to the queue and then we
            // filter it out using the whitelist during the commit.
            (updatePayload = updatePayload || []).push(propKey, nextProp);
        }
    }
    if (styleUpdates) {
        (updatePayload = updatePayload || []).push(STYLE, styleUpdates);
    }
    return updatePayload;
};

/**
 *
 * @param {*} domElement
 * @param {*} updatePayload
 * @param {*} tag
 * @param {*} lastRawProps
 * @param {*} nextRawProps
 * @description domElement의 프로퍼티를 업데이트하는 함수입니다.
 */
export const updateProperties = (domElement, updatePayload, tag, lastRawProps, nextRawProps) => {
    // 업데이트 *before*  확인.
    // 업데이트 도중에 여러 개를 체크할 수 있습니다.
    // 체크된 라디오가 이름을 변경하려고 하면 브라우저는 다른 라디오의 체크를 거짓으로 만듭니다.
    if (tag === "input" && nextRawProps.type === "radio" && nextRawProps.name !== null) {
        rfsDOMInputUpdateChecked(domElement, nextRawProps);
    }

    const wasCustomComponentTag = isCustomComponent(tag, lastRawProps);
    const isCustomComponentTag = isCustomComponent(tag, nextRawProps);
    // Apply the diff.
    updateDOMProperties(domElement, updatePayload, wasCustomComponentTag, isCustomComponentTag);

    // changed.
    switch (tag) {
        case "input":
            // 소품을 업데이트한 *후* 입력 주위의 래퍼를 업데이트합니다. 이것은
            // `updateDOMProperties` 이후에 발생해야 합니다. 그렇지 않으면 HTML5 입력 유효성 검사
            // 경고를 발생시키고 새 값이 할당되지 않도록 합니다.
            rfsDOMInputUpdateWrapper(domElement, nextRawProps);
            break;
        case "textarea":
            rfsDOMTextareaUpdateWrapper(domElement, nextRawProps);
            break;
        case "select":
            // <select> value update needs to occur after <option> children
            // reconciliation
            rfsDOMSelectPostUpdateWrapper(domElement, nextRawProps);
            break;
    }
};
