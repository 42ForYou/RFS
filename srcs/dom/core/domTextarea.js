import { getToStringValue, toString } from "./toStringValue.js";

/**
 * Implements a <textarea> host component that allows setting `value`, and
 * `defaultValue`. This differs from the traditional DOM API because value is
 * usually set as PCDATA children.
 *
 * If `value` is not supplied (or null/undefined), user actions that affect the
 * value will trigger updates to the element.
 *
 * If `value` is supplied (and not null/undefined), the rendered element will
 * not trigger updates to the element. Instead, the `value` prop must change in
 * order for the rendered element to be updated.
 *
 * The rendered element will be initialized with an empty value, the prop
 * `defaultValue` if specified, or the children content (deprecated).
 */

export const getHostProps = (element, props) => {
    const node = element;

    // Always set children to the same thing. In IE9, the selection range will
    // get reset if `textContent` is mutated.  We could add a check in setTextContent
    // to only set the value if/when the value differs from the node value (which would
    // completely solve this IE9 bug), but Sebastian+Sophie seemed to like this
    // solution. The value can be a boolean or object so that's why it's forced
    // to be a string.
    const hostProps = {
        ...props,
        value: undefined,
        defaultValue: undefined,
        children: toString(node._wrapperState.initialValue),
    };

    return hostProps;
};

export const initWrapperState = (element, props) => {
    const node = element;

    let initialValue = props.value;

    // Only bother fetching default value if we're going to use it
    if (initialValue === null) {
        let defaultValue = props.defaultValue;
        let children = props.children;
        if (children !== null) {
            if (Array.isArray(children)) {
                children = children[0];
            }

            defaultValue = children;
        }
        if (defaultValue === null) {
            defaultValue = "";
        }
        initialValue = defaultValue;
    }

    node._wrapperState = {
        initialValue: getToStringValue(initialValue),
    };
};

export const updateWrapper = (element, props) => {
    const node = element;
    const value = getToStringValue(props.value);
    const defaultValue = getToStringValue(props.defaultValue);
    if (value !== null) {
        // Cast `value` to a string to ensure the value is set correctly. While
        // browsers typically do this as necessary, jsdom doesn't.
        const newValue = toString(value);
        // To avoid side effects (such as losing text selection), only set value if changed
        if (newValue !== node.value) {
            node.value = newValue;
        }
        if (props.defaultValue === null && node.defaultValue !== newValue) {
            node.defaultValue = newValue;
        }
    }
    if (defaultValue !== null) {
        node.defaultValue = toString(defaultValue);
    }
};

export const postMountWrapper = (element, props) => {
    const node = element;
    // This is in postMount because we need access to the DOM node, which is not
    // available until after the component has mounted.
    const textContent = node.textContent;

    // Only set node.value if textContent is equal to the expected
    // initial value. In IE10/IE11 there is a bug where the placeholder attribute
    // will populate textContent as well.
    // https://developer.microsoft.com/microsoft-edge/platform/issues/101525/
    if (textContent === node._wrapperState.initialValue) {
        if (textContent !== "" && textContent !== null) {
            node.value = textContent;
        }
    }
};

export const restoreControlledState = (element, props) => {
    // DOM component is still mounted; update
    updateWrapper(element, props);
};
