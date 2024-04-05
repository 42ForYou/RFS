const isCheckable = (elem) => {
    const type = elem.type;
    const nodeName = elem.nodeName;
    return nodeName && nodeName.toLowerCase() === "input" && (type === "checkbox" || type === "radio");
};

const getTracker = (node) => {
    return node._valueTracker;
};

const detachTracker = (node) => {
    node._valueTracker = null;
};

const getValueFromNode = (node) => {
    let value = "";
    if (!node) {
        return value;
    }

    if (isCheckable(node)) {
        value = node.checked ? "true" : "false";
    } else {
        value = node.value;
    }

    return value;
};

const trackValueOnNode = (node) => {
    const valueField = isCheckable(node) ? "checked" : "value";
    const descriptor = Object.getOwnPropertyDescriptor(node.constructor.prototype, valueField);

    let currentValue = "" + node[valueField];
    if (
        node.hasOwnProperty(valueField) ||
        typeof descriptor === "undefined" ||
        typeof descriptor.get !== "function" ||
        typeof descriptor.set !== "function"
    ) {
        return;
    }
    const { get, set } = descriptor;
    Object.defineProperty(node, valueField, {
        configurable: true,
        get: function () {
            return get.call(this);
        },
        set: function (value) {
            currentValue = "" + value;
            set.call(this, value);
        },
    });
    // We could've passed this the first time
    // but it triggers a bug in IE11 and Edge 14/15.
    // Calling defineProperty() again should be equivalent.
    // https://github.com/facebook/react/issues/11768
    Object.defineProperty(node, valueField, {
        enumerable: descriptor.enumerable,
    });

    const tracker = {
        getValue() {
            return currentValue;
        },
        setValue(value) {
            currentValue = "" + value;
        },
        stopTracking() {
            detachTracker(node);
            delete node[valueField];
        },
    };
    return tracker;
};

export const track = (node) => {
    if (getTracker(node)) {
        return;
    }

    node._valueTracker = trackValueOnNode(node);
};

export const updateValueIfChanged = (node) => {
    if (!node) {
        return false;
    }

    const tracker = getTracker(node);
    // if there is no tracker at this point it's unlikely
    // that trying again will succeed
    if (!tracker) {
        return true;
    }

    const lastValue = tracker.getValue();
    const nextValue = getValueFromNode(node);
    if (nextValue !== lastValue) {
        tracker.setValue(nextValue);
        return true;
    }
    return false;
};

export const stopTracking = (node) => {
    const tracker = getTracker(node);
    if (tracker) {
        tracker.stopTracking();
    }
};
