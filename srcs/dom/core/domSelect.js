import { getToStringValue, toString } from "./toStringValue.js";

const valuePropNames = ["value", "defaultValue"];

const updateOptions = (node, multiple, propValue, setDefaultSelected) => {
    const options = node.options;

    if (multiple) {
        const selectedValues = propValue;
        const selectedValue = {};
        for (let i = 0; i < selectedValues.length; i++) {
            // Prefix to avoid chaos with special keys.
            selectedValue["$" + selectedValues[i]] = true;
        }
        for (let i = 0; i < options.length; i++) {
            const selected = selectedValue.hasOwnProperty("$" + options[i].value);
            if (options[i].selected !== selected) {
                options[i].selected = selected;
            }
            if (selected && setDefaultSelected) {
                options[i].defaultSelected = true;
            }
        }
    } else {
        // Do not set `select.value` as exact behavior isn't consistent across all
        // browsers for all cases.
        const selectedValue = toString(getToStringValue(propValue));
        let defaultSelected = null;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === selectedValue) {
                options[i].selected = true;
                if (setDefaultSelected) {
                    options[i].defaultSelected = true;
                }
                return;
            }
            if (defaultSelected === null && !options[i].disabled) {
                defaultSelected = options[i];
            }
        }
        if (defaultSelected !== null) {
            defaultSelected.selected = true;
        }
    }
};

/**
 * Implements a <select> host component that allows optionally setting the
 * props `value` and `defaultValue`. If `multiple` is false, the prop must be a
 * stringable. If `multiple` is true, the prop must be an array of stringables.
 *
 * If `value` is not supplied (or null/undefined), user actions that change the
 * selected option will trigger updates to the rendered options.
 *
 * If it is supplied (and not null/undefined), the rendered options will not
 * update in response to user actions. Instead, the `value` prop must change in
 * order for the rendered options to update.
 *
 * If `defaultValue` is provided, any options with the supplied values will be
 * selected.
 */

export const getHostProps = (element, props) => {
    return Object.assign({}, props, {
        value: undefined,
    });
};

export const initWrapperState = (element, props) => {
    const node = element;

    node._wrapperState = {
        wasMultiple: !!props.multiple,
    };
};

export const postMountWrapper = (element, props) => {
    const node = element;
    node.multiple = !!props.multiple;
    const value = props.value;
    if (value !== null) {
        updateOptions(node, !!props.multiple, value, false);
    } else if (props.defaultValue !== null) {
        updateOptions(node, !!props.multiple, props.defaultValue, true);
    }
};

export const postUpdateWrapper = (element, props) => {
    const node = element;
    const wasMultiple = node._wrapperState.wasMultiple;
    node._wrapperState.wasMultiple = !!props.multiple;

    const value = props.value;
    if (value !== null) {
        updateOptions(node, !!props.multiple, value, false);
    } else if (wasMultiple !== !!props.multiple) {
        // For simplicity, reapply `defaultValue` if `multiple` is toggled.
        if (props.defaultValue !== null) {
            updateOptions(node, !!props.multiple, props.defaultValue, true);
        } else {
            // Revert the select back to its default unselected state.
            updateOptions(node, !!props.multiple, props.multiple ? [] : "", false);
        }
    }
};

export const restoreControlledState = (element, props) => {
    const node = element;
    const value = props.value;

    if (value !== null) {
        updateOptions(node, !!props.multiple, value, false);
    }
};
