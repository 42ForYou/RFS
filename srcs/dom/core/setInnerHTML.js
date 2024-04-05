import { Namespaces } from "./domNamepsace.js";

// SVG temp container for IE lacking innerHTML
let reusableSVGContainer;

const createMicrosoftUnsafeLocalFunction = function (func) {
    if (typeof MSApp !== "undefined" && MSApp.execUnsafeLocalFunction) {
        return function (arg0, arg1, arg2, arg3) {
            MSApp.execUnsafeLocalFunction(function () {
                return func(arg0, arg1, arg2, arg3);
            });
        };
    } else {
        return func;
    }
};

/**
 * Set the innerHTML property of a node
 *
 * @param {DOMElement} node
 * @param {string} html
 * @internal
 */
const setInnerHTML = createMicrosoftUnsafeLocalFunction(function (node, html) {
    if (node.namespaceURI === Namespaces.svg) {
        if (!("innerHTML" in node)) {
            // IE does not have innerHTML for SVG nodes, so instead we inject the
            // new markup in a temp node and then move the child nodes across into
            // the target node
            reusableSVGContainer = reusableSVGContainer || document.createElement("div");
            reusableSVGContainer.innerHTML = "<svg>" + html.valueOf().toString() + "</svg>";
            const svgNode = reusableSVGContainer.firstChild;
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
            while (svgNode.firstChild) {
                node.appendChild(svgNode.firstChild);
            }
            return;
        }
    }
    node.innerHTML = html;
});

export default setInnerHTML;
