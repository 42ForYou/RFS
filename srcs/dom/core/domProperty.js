import warning from "shared/warning";

// 예약된 속성입니다.
// rfs에서 별도로 처리되며, DOM에 작성되어서는 안됩니다.
export const RESERVED = 0;

// 간단한 문자열 속성입니다.
// 화이트리스트에 없는 속성들은 이 타입을 가지고  있다고 가정합니다.
export const STRING = 1;

// rfs에서 boolean을 받아들이는 문자열 속성입니다. HTML에서는
// "true"와 "false"를 가능한 값으로 가지는 "열거형" 속성이라고 부릅니다.
// true일 때는 "true" 문자열로 설정되어야 합니다.
// false일 때는 "false" 문자열로 설정되어야 합니다.
export const BOOLEANISH_STRING = 2;

// 실제 boolean 속성입니다.
// true일 때는 존재해야 합니다(빈 문자열이나 이름으로 설정).
// false일 때는 생략되어야 합니다.
export const BOOLEAN = 3;

// 플래그로 사용될 수 있으며 값과 함께 사용할 수 있는 속성입니다.
// true일 때는 존재해야 합니다(빈 문자열이나 이름으로 설정).
// false일 때는 생략되어야 합니다.
// 다른 값에 대해서는 그 값으로 존재해야 합니다.
export const OVERLOADED_BOOLEAN = 4;

// 숫자이거나 숫자로 파싱될 수 있는 속성입니다.
// 거짓인 경우 제거되어야 합니다.
export const NUMERIC = 5;

// 양의 숫자이거나 양의 숫자로 파싱될 수 있는 속성입니다.
// 거짓인 경우 제거되어야 합니다.
export const POSITIVE_NUMERIC = 6;

export const ATTRIBUTE_NAME_START_CHAR =
    ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
export const ATTRIBUTE_NAME_CHAR = ATTRIBUTE_NAME_START_CHAR + "\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040";

export const ID_ATTRIBUTE_NAME = "data-rfsid";
export const ROOT_ATTRIBUTE_NAME = "data-rfsroot";
export const VALID_ATTRIBUTE_NAME_REGEX = new RegExp(
    "^[" + ATTRIBUTE_NAME_START_CHAR + "][" + ATTRIBUTE_NAME_CHAR + "]*$"
);

const hasOwnProperty = Object.prototype.hasOwnProperty;
const illegalAttributeNameCache = {};
const validatedAttributeNameCache = {};

export const isAttributeNameSafe = (attributeName) => {
    if (hasOwnProperty.call(validatedAttributeNameCache, attributeName)) {
        return true;
    }
    if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) {
        return false;
    }
    if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
        validatedAttributeNameCache[attributeName] = true;
        return true;
    }
    illegalAttributeNameCache[attributeName] = true;
    return false;
};

export const shouldIgnoreAttribute = (name, propertyInfo, isCustomComponentTag) => {
    if (propertyInfo !== null) {
        return propertyInfo.type === RESERVED;
    }
    if (isCustomComponentTag) {
        return false;
    }
    if (name.length > 2 && (name[0] === "o" || name[0] === "O") && (name[1] === "n" || name[1] === "N")) {
        return true;
    }
    return false;
};

export const shouldRemoveAttributeWithWarning = (name, value, propertyInfo, isCustomComponentTag) => {
    if (propertyInfo !== null && propertyInfo.type === RESERVED) {
        return false;
    }
    switch (typeof value) {
        case "function":
        case "symbol":
            return true;
        case "boolean": {
            if (isCustomComponentTag) {
                return false;
            }
            if (propertyInfo !== null) {
                return !propertyInfo.acceptsBooleans;
            } else {
                const prefix = name.toLowerCase().slice(0, 5);
                return prefix !== "data-" && prefix !== "aria-";
            }
        }
        default:
            return false;
    }
};

export const shouldRemoveAttribute = (name, value, propertyInfo, isCustomComponentTag) => {
    if (value === null || typeof value === "undefined") {
        return true;
    }
    if (shouldRemoveAttributeWithWarning(name, value, propertyInfo, isCustomComponentTag)) {
        return true;
    }
    if (isCustomComponentTag) {
        return false;
    }
    if (propertyInfo !== null) {
        switch (propertyInfo.type) {
            case BOOLEAN:
                return !value;
            case OVERLOADED_BOOLEAN:
                return value === false;
            case NUMERIC:
                return isNaN(value);
            case POSITIVE_NUMERIC:
                return isNaN(value) || value < 1;
        }
    }
    return false;
};

// 속성 정보를 가져오는 함수
export const getPropertyInfo = (name) => {
    return properties.hasOwnProperty(name) ? properties[name] : null;
};

class PropertyInfoRecord {
    constructor(name, type, mustUseProperty, attributeName, attributeNamespace, sanitizeURL) {
        this.acceptsBooleans = type === BOOLEANISH_STRING || type === BOOLEAN || type === OVERLOADED_BOOLEAN;
        this.attributeName = attributeName;
        this.attributeNamespace = attributeNamespace;
        this.mustUseProperty = mustUseProperty;
        this.propertyName = name;
        this.type = type;
        this.sanitizeURL = sanitizeURL;
    }
}
// 속성 목록
const properties = {};

// rfs에 의해 예약된 속성입니다. DOM에 작성되어서는 안됩니다.
// These props are reserved by React. They shouldn't be written to the DOM.
[
    "children",
    "dangerouslySetInnerHTML",
    // elements (not just inputs). Now that ReactDOMInput assigns to the
    // defaultValue property -- do we need this?
    "defaultValue",
    "defaultChecked",
    "innerHTML",
    "suppressContentEditableWarning",
    "suppressHydrationWarning",
    "style",
].forEach((name) => {
    properties[name] = new PropertyInfoRecord(
        name,
        RESERVED,
        false, // mustUseProperty
        name, // attributeName
        null, // attributeNamespace
        false // sanitizeURL
    );
});

// A few React string attributes have a different name.
// This is a mapping from React prop names to the attribute names.
[
    ["acceptCharset", "accept-charset"],
    ["className", "class"],
    ["htmlFor", "for"],
    ["httpEquiv", "http-equiv"],
].forEach(([name, attributeName]) => {
    properties[name] = new PropertyInfoRecord(
        name,
        STRING,
        false, // mustUseProperty
        attributeName, // attributeName
        null, // attributeNamespace
        false // sanitizeURL
    );
});

// These are "enumerated" HTML attributes that accept "true" and "false".
// In React, we let users pass `true` and `false` even though technically
// these aren't boolean attributes (they are coerced to strings).
["contentEditable", "draggable", "spellCheck", "value"].forEach((name) => {
    properties[name] = new PropertyInfoRecord(
        name,
        BOOLEANISH_STRING,
        false, // mustUseProperty
        name.toLowerCase(), // attributeName
        null, // attributeNamespace
        false // sanitizeURL
    );
});

// These are "enumerated" SVG attributes that accept "true" and "false".
// In React, we let users pass `true` and `false` even though technically
// these aren't boolean attributes (they are coerced to strings).
// Since these are SVG attributes, their attribute names are case-sensitive.
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach((name) => {
    properties[name] = new PropertyInfoRecord(
        name,
        BOOLEANISH_STRING,
        false, // mustUseProperty
        name, // attributeName
        null, // attributeNamespace
        false // sanitizeURL
    );
});

// These are HTML boolean attributes.
[
    "allowFullScreen",
    "async",
    // Note: there is a special case that prevents it from being written to the DOM
    // on the client side because the browsers are inconsistent. Instead we call focus().
    "autoFocus",
    "autoPlay",
    "controls",
    "default",
    "defer",
    "disabled",
    "disablePictureInPicture",
    "formNoValidate",
    "hidden",
    "loop",
    "noModule",
    "noValidate",
    "open",
    "playsInline",
    "readOnly",
    "required",
    "reversed",
    "scoped",
    "seamless",
    // Microdata
    "itemScope",
].forEach((name) => {
    properties[name] = new PropertyInfoRecord(
        name,
        BOOLEAN,
        false, // mustUseProperty
        name.toLowerCase(), // attributeName
        null, // attributeNamespace
        false // sanitizeURL
    );
});

// These are the few React props that we set as DOM properties
// rather than attributes. These are all booleans.
[
    "checked",
    // Note: `option.selected` is not updated if `select.multiple` is
    // disabled with `removeAttribute`. We have special logic for handling this.
    "multiple",
    "muted",
    "selected",

    // NOTE: if you add a camelCased prop to this list,
    // you'll need to set attributeName to name.toLowerCase()
    // instead in the assignment below.
].forEach((name) => {
    properties[name] = new PropertyInfoRecord(
        name,
        BOOLEAN,
        true, // mustUseProperty
        name, // attributeName
        null, // attributeNamespace
        false // sanitizeURL
    );
});

// These are HTML attributes that are "overloaded booleans": they behave like
// booleans, but can also accept a string value.
[
    "capture",
    "download",

    // NOTE: if you add a camelCased prop to this list,
    // you'll need to set attributeName to name.toLowerCase()
    // instead in the assignment below.
].forEach((name) => {
    properties[name] = new PropertyInfoRecord(
        name,
        OVERLOADED_BOOLEAN,
        false, // mustUseProperty
        name, // attributeName
        null, // attributeNamespace
        false // sanitizeURL
    );
});

// These are HTML attributes that must be positive numbers.
[
    "cols",
    "rows",
    "size",
    "span",

    // NOTE: if you add a camelCased prop to this list,
    // you'll need to set attributeName to name.toLowerCase()
    // instead in the assignment below.
].forEach((name) => {
    properties[name] = new PropertyInfoRecord(
        name,
        POSITIVE_NUMERIC,
        false, // mustUseProperty
        name, // attributeName
        null, // attributeNamespace
        false // sanitizeURL
    );
});

// These are HTML attributes that must be numbers.
["rowSpan", "start"].forEach((name) => {
    properties[name] = new PropertyInfoRecord(
        name,
        NUMERIC,
        false, // mustUseProperty
        name.toLowerCase(), // attributeName
        null, // attributeNamespace
        false // sanitizeURL
    );
});

const CAMELIZE = /[\-\:]([a-z])/g;
const capitalize = (token) => token[1].toUpperCase();

// This is a list of all SVG attributes that need special casing, namespacing,
// or boolean value assignment. Regular attributes that just accept strings
// and have the same names are omitted, just like in the HTML whitelist.
// Some of these attributes can be hard to find. This list was created by
// scrapping the MDN documentation.
[
    "accent-height",
    "alignment-baseline",
    "arabic-form",
    "baseline-shift",
    "cap-height",
    "clip-path",
    "clip-rule",
    "color-interpolation",
    "color-interpolation-filters",
    "color-profile",
    "color-rendering",
    "dominant-baseline",
    "enable-background",
    "fill-opacity",
    "fill-rule",
    "flood-color",
    "flood-opacity",
    "font-family",
    "font-size",
    "font-size-adjust",
    "font-stretch",
    "font-style",
    "font-variant",
    "font-weight",
    "glyph-name",
    "glyph-orientation-horizontal",
    "glyph-orientation-vertical",
    "horiz-adv-x",
    "horiz-origin-x",
    "image-rendering",
    "letter-spacing",
    "lighting-color",
    "marker-end",
    "marker-mid",
    "marker-start",
    "overline-position",
    "overline-thickness",
    "paint-order",
    "panose-1",
    "pointer-events",
    "rendering-intent",
    "shape-rendering",
    "stop-color",
    "stop-opacity",
    "strikethrough-position",
    "strikethrough-thickness",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-opacity",
    "stroke-width",
    "text-anchor",
    "text-decoration",
    "text-rendering",
    "underline-position",
    "underline-thickness",
    "unicode-bidi",
    "unicode-range",
    "units-per-em",
    "v-alphabetic",
    "v-hanging",
    "v-ideographic",
    "v-mathematical",
    "vector-effect",
    "vert-adv-y",
    "vert-origin-x",
    "vert-origin-y",
    "word-spacing",
    "writing-mode",
    "xmlns:xlink",
    "x-height",

    // NOTE: if you add a camelCased prop to this list,
    // you'll need to set attributeName to name.toLowerCase()
    // instead in the assignment below.
].forEach((attributeName) => {
    const name = attributeName.replace(CAMELIZE, capitalize);
    properties[name] = new PropertyInfoRecord(
        name,
        STRING,
        false, // mustUseProperty
        attributeName,
        null, // attributeNamespace
        false // sanitizeURL
    );
});

// String SVG attributes with the xlink namespace.
[
    "xlink:actuate",
    "xlink:arcrole",
    "xlink:role",
    "xlink:show",
    "xlink:title",
    "xlink:type",

    // NOTE: if you add a camelCased prop to this list,
    // you'll need to set attributeName to name.toLowerCase()
    // instead in the assignment below.
].forEach((attributeName) => {
    const name = attributeName.replace(CAMELIZE, capitalize);
    properties[name] = new PropertyInfoRecord(
        name,
        STRING,
        false, // mustUseProperty
        attributeName,
        "http://www.w3.org/1999/xlink",
        false // sanitizeURL
    );
});

// String SVG attributes with the xml namespace.
[
    "xml:base",
    "xml:lang",
    "xml:space",

    // NOTE: if you add a camelCased prop to this list,
    // you'll need to set attributeName to name.toLowerCase()
    // instead in the assignment below.
].forEach((attributeName) => {
    const name = attributeName.replace(CAMELIZE, capitalize);
    properties[name] = new PropertyInfoRecord(
        name,
        STRING,
        false, // mustUseProperty
        attributeName,
        "http://www.w3.org/XML/1998/namespace",
        false // sanitizeURL
    );
});

// These attribute exists both in HTML and SVG.
// The attribute name is case-sensitive in SVG so we can't just use
// the React name like we do for attributes that exist only in HTML.
["tabIndex", "crossOrigin"].forEach((attributeName) => {
    properties[attributeName] = new PropertyInfoRecord(
        attributeName,
        STRING,
        false, // mustUseProperty
        attributeName.toLowerCase(), // attributeName
        null, // attributeNamespace
        false // sanitizeURL
    );
});

// These attributes accept URLs. These must not allow javascript: URLS.
// These will also need to accept Trusted Types object in the future.
const xlinkHref = "xlinkHref";
properties[xlinkHref] = new PropertyInfoRecord(
    "xlinkHref",
    STRING,
    false, // mustUseProperty
    "xlink:href",
    "http://www.w3.org/1999/xlink",
    true // sanitizeURL
);

["src", "href", "action", "formAction"].forEach((attributeName) => {
    properties[attributeName] = new PropertyInfoRecord(
        attributeName,
        STRING,
        false, // mustUseProperty
        attributeName.toLowerCase(), // attributeName
        null, // attributeNamespace
        true // sanitizeURL
    );
});
