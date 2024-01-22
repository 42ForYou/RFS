import { isArray as isArr } from "../shared/isArray";

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

const flatten = (arr) => {
    return arr.reduce((acc, val) => {
        if (val === null || val === undefined) {
            return acc;
        }
        return isArray(val) ? acc.concat(flatten(val)) : acc.concat(val);
    }, []);
};

export const createElement = (type, props = {}, ...children) => {
    return RfsElement(type, props, flatten(children));
};

export const Fragment = (props) => {
    return props.children;
};
