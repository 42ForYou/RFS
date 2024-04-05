import { registrationNameModules } from "../event/eventPluginRegistry.js";
import endsWith from "./endsWith.js";
import { setValueForProperty } from "./domPropertyOperation.js";
import { getFiberCurrentPropsFromNode } from "./domComponentConnection.js";
import { getToStringValue, toString } from "./toStringValue.js";
import { updateValueIfChanged } from "../core/element/inputValueTracking.js";

/**
 *
 * @param {*} props
 * @returns {boolean}
 * @description props의 checked, value가 있는지 확인하는 함수입니다.
 */
const isControlled = (props) => {
    const usesChecked = props.type === "checkbox" || props.type === "radio";
    return usesChecked ? props.checked !== null : props.value !== null;
};

{
    /* <input> 호스트 컴포넌트를 구현하는데, 이 컴포넌트는 checked, value, defaultChecked, 그리고 defaultValue와 같은 선택적인 프로퍼티를 설정할 수 있습니다.

checked나 value가 제공되지 않거나 (null/undefined인 경우), 사용자의 동작이 체크 상태나 값에 영향을 주어 요소를 업데이트하게 합니다.

제공되고 (null/undefined가 아닌 경우)에는, 렌더링된 요소가 요소를 업데이트하지 않습니다. 대신, 프로퍼티가 변경될 때 렌더링된 요소가 업데이트됩니다.

렌더링된 요소는 체크되지 않은 상태(또는 defaultChecked)와 빈 값(또는 defaultValue)으로 초기화됩니다.

자세한 정보는 http://www.w3.org/TR/2012/WD-html5-20121025/the-input-element.html 참조. */
}

/**
 *
 * @param {*} element
 * @param {*} props
 * @returns {Object}
 * @description 호스트 프로퍼티를 가져오는 함수입니다. -여기서 host란 nativeBrowserElement를 의미합니다.
 */
export const getHostProps = (element, props) => {
    const node = element;
    const checked = props.checked;

    const hostProps = Object.assign({}, props, {
        defaultChecked: undefined,
        defaultValue: undefined,
        value: undefined,
        checked: checked !== null ? checked : node._wrapperState.initialChecked,
    });

    return hostProps;
};

/**
 *
 * @param {*} element
 * @param {*} props
 * @description wrapperState를 초기화하는 함수입니다.
 */
export const initWrapperState = (element, props) => {
    const node = element;
    const defaultValue = props.defaultValue === null ? "" : props.defaultValue;

    node._wrapperState = {
        initialChecked: props.checked !== null ? props.checked : props.defaultChecked,
        initialValue: getToStringValue(props.value !== null ? props.value : defaultValue),
        controlled: isControlled(props),
    };
};

/**
 *
 * @param {*} element
 * @param {*} props
 * @description checked를 업데이트하는 함수입니다.= wrapperState를 업데이트하는 함수입니다.
 */
export const updateChecked = (element, props) => {
    const node = element;
    const checked = props.checked;
    if (checked !== null) {
        setValueForProperty(node, "checked", checked, false);
    }
};

/**
 *
 * @param {*} element
 * @param {*} props
 * @description wrapper를 업데이트하는 함수입니다.
 */
export const updateWrapper = (element, props) => {
    const node = element;

    updateChecked(element, props);

    const value = getToStringValue(props.value);
    const type = props.type;

    if (value !== null) {
        if (type === "number") {
            if (
                (value === 0 && node.value === "") ||
                // We explicitly want to coerce to number here if possible.
                // eslint-disable-next-line
          node.value != (value)
            ) {
                node.value = toString(value);
            }
        } else if (node.value !== toString(value)) {
            node.value = toString(value);
        }
    } else if (type === "submit" || type === "reset") {
        // Submit/reset inputs need the attribute removed completely to avoid
        // blank-text buttons.
        node.removeAttribute("value");
        return;
    }

    // When syncing the value attribute, the value comes from a cascade of
    // properties:
    //  1. The value React property
    //  2. The defaultValue React property
    //  3. Otherwise there should be no change
    if (props.hasOwnProperty("value")) {
        setDefaultValue(node, props.type, value);
    } else if (props.hasOwnProperty("defaultValue")) {
        setDefaultValue(node, props.type, getToStringValue(props.defaultValue));
    }

    // When syncing the checked attribute, it only changes when it needs
    // to be removed, such as transitioning from a checkbox into a text input
    if (props.checked === null && props.defaultChecked !== null) {
        node.defaultChecked = !!props.defaultChecked;
    }
};

export const postMountWrapper = (element, props, isHydrating) => {
    const node = element;

    // Do not assign value if it is already set. This prevents user text input
    // from being lost during SSR hydration.
    if (props.hasOwnProperty("value") || props.hasOwnProperty("defaultValue")) {
        const type = props.type;
        const isButton = type === "submit" || type === "reset";

        // Avoid setting value attribute on submit/reset inputs as it overrides the
        // default value provided by the browser. See: #12872
        if (isButton && (props.value === undefined || props.value === null)) {
            return;
        }

        const initialValue = toString(node._wrapperState.initialValue);

        // Do not assign value if it is already set. This prevents user text input
        // from being lost during SSR hydration.
        if (!isHydrating) {
            if (disableInputAttributeSyncing) {
                const value = getToStringValue(props.value);

                // When not syncing the value attribute, the value property points
                // directly to the React prop. Only assign it if it exists.
                if (value !== null) {
                    // Always assign on buttons so that it is possible to assign an
                    // empty string to clear button text.
                    //
                    // Otherwise, do not re-assign the value property if is empty. This
                    // potentially avoids a DOM write and prevents Firefox (~60.0.1) from
                    // prematurely marking required inputs as invalid. Equality is compared
                    // to the current value in case the browser provided value is not an
                    // empty string.
                    if (isButton || value !== node.value) {
                        node.value = toString(value);
                    }
                }
            } else {
                // When syncing the value attribute, the value property should use
                // the wrapperState._initialValue property. This uses:
                //
                //   1. The value React property when present
                //   2. The defaultValue React property when present
                //   3. An empty string
                if (initialValue !== node.value) {
                    node.value = initialValue;
                }
            }
        }

        // Otherwise, the value attribute is synchronized to the property,
        // so we assign defaultValue to the same thing as the value property
        // assignment step above.
        node.defaultValue = initialValue;
    }

    // Normally, we'd just do `node.checked = node.checked` upon initial mount, less this bug
    // this is needed to work around a chrome bug where setting defaultChecked
    // will sometimes influence the value of checked (even after detachment).
    // Reference: https://bugs.chromium.org/p/chromium/issues/detail?id=608416
    // We need to temporarily unset name to avoid disrupting radio button groups.
    const name = node.name;
    if (name !== "") {
        node.name = "";
    }

    // When syncing the checked attribute, both the checked property and
    // attribute are assigned at the same time using defaultChecked. This uses:
    //
    //   1. The checked React property when present
    //   2. The defaultChecked React property when present
    //   3. Otherwise, false
    node.defaultChecked = !node.defaultChecked;
    node.defaultChecked = !!node._wrapperState.initialChecked;

    if (name !== "") {
        node.name = name;
    }
};
const updateNamedCousins = (rootNode, props) => {
    const name = props.name;
    if (props.type === "radio" && name !== null) {
        let queryRoot = rootNode;

        while (queryRoot.parentNode) {
            queryRoot = queryRoot.parentNode;
        }

        // If `rootNode.form` was non-null, then we could try `form.elements`,
        // but that sometimes behaves strangely in IE8. We could also try using
        // `form.getElementsByName`, but that will only return direct children
        // and won't include inputs that use the HTML5 `form=` attribute. Since
        // the input might not even be in a form. It might not even be in the
        // document. Let's just use the local `querySelectorAll` to ensure we don't
        // miss anything.
        const group = queryRoot.querySelectorAll(`input[name=${JSON.stringify("" + name)}][type="radio"]`);

        for (let i = 0; i < group.length; i++) {
            const otherNode = group[i];
            if (otherNode === rootNode || otherNode.form !== rootNode.form) {
                continue;
            }
            // This will throw if radio buttons rendered by different copies of React
            // and the same name are rendered into the same form (same as #1939).
            // That's probably okay; we don't support it just as we don't support
            // mixing React radio buttons with non-React ones.
            const otherProps = getFiberCurrentPropsFromNode(otherNode);

            // We need update the tracked value on the named cousin since the value
            // was changed but the input saw no event or value set
            updateValueIfChanged(otherNode);

            // If this is a controlled radio button group, forcing the input that
            // was previously checked to update will cause it to be come re-checked
            // as appropriate.
            updateWrapper(otherNode, otherProps);
        }
    }
};

// In Chrome, assigning defaultValue to certain input types triggers input validation.
// For number inputs, the display value loses trailing decimal points. For email inputs,
// Chrome raises "The specified value <x> is not a valid email address".
//
// Here we check to see if the defaultValue has actually changed, avoiding these problems
// when the user is inputting text
//
// https://github.com/facebook/react/issues/7253
export const setDefaultValue = (node, type, value) => {
    if (
        // Focused number inputs synchronize on blur. See ChangeEventPlugin.js
        type !== "number" ||
        node.ownerDocument.activeElement !== node
    ) {
        if (value === null) {
            node.defaultValue = toString(node._wrapperState.initialValue);
        } else if (node.defaultValue !== toString(value)) {
            node.defaultValue = toString(value);
        }
    }
};

export const restoreControlledState = (element, props) => {
    const node = element;
    updateWrapper(node, props);
    updateNamedCousins(node, props);
};
