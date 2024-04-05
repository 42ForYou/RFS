import { getToStringValue, toString } from "./toStringValue.js";
import { forEach } from "../../shared/rfsChildren.js";

const flattenChildren = (children) => {
    let content = "";

    // Flatten children. We'll warn if they are invalid
    // during validateProps() which runs for hydration too.
    // Note that this would throw on non-element objects.
    // Elements are stringified (which is normally irrelevant
    // but matters for <fbt>).
    forEach(children, function (child) {
        if (child === null) {
            return;
        }
        content += child;
        // Note: we don't warn about invalid children here.
        // Instead, this is done separately below so that
        // it happens during the hydration codepath too.
    });

    return content;
};

/**
 * Implements an <option> host component that warns when `selected` is set.
 */

export const postMountWrapper = (element, props) => {
    // value="" should make a value attribute (#6219)
    if (props.value !== null) {
        element.setAttribute("value", toString(getToStringValue(props.value)));
    }
};

export const getHostProps = (element, props) => {
    const hostProps = { children: undefined, ...props };
    const content = flattenChildren(props.children);

    if (content) {
        hostProps.children = content;
    }

    return hostProps;
};
