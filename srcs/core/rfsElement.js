import RFS_ELEMENT_TYPE from "./rfSymbol.js";

const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * @description 리액트(rfs)는 하나의 ui런타임으로써 제어 할 수 있는 input을 받는다.
 * @description 그러한 input은 ui를 나타내기 위한 jsx문법을 통해 받고, 이를 rfs내부에서 js객체로 변환한다.
 * @description 해당 객체를 RfsElement라고 하고 렌더를 하기위한 객체인 파이버로 변환되어 실제 사용되어진다.
 * @description ui를 정의하기 위 한 기본정보인 type(해당 ui의 타입), key(해당 ui의 고유 키값), ref(해당 ui의 참조값), props(해당 ui의 속성값)을 가지고 있다.
 * @description $$typeof는 보안을 위해서 사용되는데 이는 RfsSymbol.js에 정의되어 있다.
 * @type {import("../type/TRfsType").TRfsElement} rfsElement
 */
export const RfsElement = class {
    constructor(type, key, ref, props, symbol = RFS_ELEMENT_TYPE) {
        this.$$typeof = symbol;
        this.type = type;
        this.key = key;
        this.ref = ref;
        this.props = props;
    }
};

const RESERVED_PROPS = {
    key: true,
    ref: true,
};
/**
 *
 * @param {string | lambda} type
 * @param {object} config
 * @param  {...any} children
 * @returns {import("../type/TRfsType").TRfsElement|} rfsElement
 * @description jsx문법을 통해 객체를 생성하기 위한 함수이다. 이는 ui를 정의하는 기본적인 선언적 수단을 제공한다.
 */
export const createElement = (type, config, ...children) => {
    // Reserved names are extracted
    const { ref, key, ...others } = config || {};

    const props = { ...others };

    // Children are assigned to props object
    if (children.length === 1) {
        props.children = children[0];
    } else if (children.length > 1) {
        props.children = children;
    }

    // Resolve default props
    if (type && type.defaultProps) {
        const defaultProps = type.defaultProps;
        for (const propName in defaultProps) {
            if (props[propName] === undefined) {
                props[propName] = defaultProps[propName];
            }
        }
    }
    return new RfsElement(type, key, ref, props);
};

/**
 *
 * @param {import("../type/TRfsType").TRfsElement} element
 * @param {property} key
 * @returns {import("../type/TRfsType").TRfsElement}
 * @description 해당 객체의 key를 변경하기 위한 함수이다.
 */
export const cloneAndReplaceKey = (oldElement, newKey) => {
    return new RfsElement(oldElement.type, newKey, oldElement.ref, oldElement.props);
};

/**
 *
 * @param {import("../type/TRfsType").TRfsElement} element
 * @param {object} config
 * @param  {...any} children
 * @returns {import("../type/TRfsType").TRfsElement}
 * @description 해당 객체를 복사하기 위한 함수이다. 만약 config에 기본으로 적혀있어야 하는 값이 없다면 element의 값을 아니면 config의 값을 사용한다.
 */
export const cloneElement = (element, config, ...children) => {
    // Original props are copied using Object Spread Syntax
    const props = { ...element.props };

    // Reserved names are extracted with default values
    let { key, ref } = element;

    if (config !== null) {
        if (config.ref !== undefined) {
            ref = config.ref;
        }
        if (config.key !== undefined) {
            key = "" + config.key;
        }
        // Override existing props with new props from config and resolve default props
        const defaultProps = element.type && element.type.defaultProps;
        Object.keys(config).forEach((propName) => {
            if (!RESERVED_PROPS.hasOwnProperty(propName)) {
                props[propName] =
                    config[propName] === undefined && defaultProps ? defaultProps[propName] : config[propName];
            }
        });
    }

    // Handle children
    if (children.length === 1) {
        props.children = children[0];
    } else if (children.length > 1) {
        props.children = children;
    }

    return new RfsElement(element.type, key, ref, props);
};

/**
 *
 * @param {any} object
 * @returns {boolean}
 * @description 해당 객체가 RfsElement인지 확인하기 위한 함수이다.
 */
export const isValidElement = (object) => {
    return typeof object === "object" && object !== null && object.$$typeof === RFS_ELEMENT_TYPE;
};
