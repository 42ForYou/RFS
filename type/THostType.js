/**
 * @typedef {Object} THostProps
 * @description `Props` 타입은 React 요소에 전달될 수 있는 다양한 속성을 정의합니다. 여기에는 일반적인 HTML 속성 외에도 React와 관련된 몇 가지 특수 속성이 포함됩니다:
 * @description `autoFocus`: 컴포넌트가 마운트될 때 자동으로 포커스를 받을지 여부.
 * @description `children`: 컴포넌트가 렌더링할 자식 요소.
 * @description `hidden`: 요소를 숨길지 여부를 결정하는 불리언 속성.
 * @description `dangerouslySetInnerHTML`: 직접적인 HTML을 컴포넌트 내에 설정할 수 있게 하는 속성 (보안 위험을 고려해야 함).
 * @description `style`: 인라인 스타일을 정의하는 객체.
 * @description `bottom`, `left`, `right`, `top`: 위치를 지정하는 스타일 속성.
 */
const THostProps = {
    autoFocus: boolean,
    children: mixed,
    hidden: boolean,
    dangerouslySetInnerHTML: mixed,
    style: {
        display: string,
    },
    bottom: null | number,
    left: null | number,
    right: null | number,
    top: null | number,
};

/**
 * @typedef {String} THostType
 * @description domHost의 type을 정의= string
 */
const THostType = String;
/**
 * @typedef {HTMLElement|Document} THostContainer
 * @description domHost의 container를 정의= HTMLElement | Document
 */
const THostContainer = HTMLElement | Document;

/**
 * @typedef {String} THostContext
 * @description domHost의 context를 정의->이는 hostContext의 문맥을 의미하는데 이는 namespace여야합니다.
 * @description 생성되고 있는 문맥이 일반 문맥 dom문맥이냐 svg와 같이 다른 네임스페이스를 가지냐에 따라 다릅니다.
 */
const THostContext = String;

const THostInstance = HTMLElement;
const THostTextInstance = Text;
