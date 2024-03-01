import isArray from "../shared/isArray.js";

const RfsElement = (type, props, children) => {
    return {
        type: type === Fragment ? "fragment" : type,
        key: props?.key,
        ref: props?.ref,
        props: {
            ...props,
            children,
        },
    };
};
const isNoValue = (val) => val === null || val === undefined;

const flatten = (arr) => {
    return arr.reduce((acc, val) => {
        if (isNoValue(val)) return acc;
        return isArray(val) ? acc.concat(flatten(val)) : acc.concat(val);
    }, []);
};

export const createElement = (type, props = {}, ...children) => {
    return RfsElement(type, props, flatten(children));
};

export const Fragment = (props) => {
    return props.children;
};
