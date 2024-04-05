import { TEXT_NODE } from "../../const/CDomNodeType.js";

/**
 * Set the textContent property of a node. For text updates, it's faster
 * to set the `nodeValue` of the Text node directly instead of using
 * `.textContent` which will remove the existing node and create a new one.
 *
 * @param {DOMElement} node
 * @param {string} text
 * @internal
 */
const setTextContent = (node, text) => {
    if (text) {
        const firstChild = node.firstChild;

        if (firstChild && firstChild === node.lastChild && firstChild.nodeType === TEXT_NODE) {
            firstChild.nodeValue = text;
            return;
        }
    }
    node.textContent = text;
};

export default setTextContent;
