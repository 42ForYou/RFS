// if element isn't HTMLElement, what should I do?
// const _check = (element) => {
//     return element instanceof HTMLElement;
// };
// // const _deco = (element) => {
//     if(!_check(element)) {
//         return element;
//     }
//     else fn(element);
// };

const _prev = (element) => {
    do {
        element = element.previousSibling;
    } while (element && element.nodeType !== 1);
    return element;
};

const _next = (element) => {
    do {
        element = element.nextSibling;
    } while (element && element.nodeType !== 1);
    return element;
};
const _first = (element) => {
    element = element.firstChild;
    return element && element.nodeType !== 1 ? _next(element) : element;
};

const _last = (element) => {
    element = element.lastChild;
    return element && element.nodeType !== 1 ? _prev(element) : element;
};

const _parent = (element, num) => {
    num = num || 1;
    while (num-- && element) {
        element = element.parentNode;
    }
    return element;
};

const _id = (name) => {
    return document.getElementById(name);
};

const _tag = (name, element) => {
    return (element || document).getElementsByTagName(name);
};

const _hasClass = (name, type, element) => {
    const r = [];

    const re = new RegExp("(^|\\s)" + name + "(\\s|$)");
    const e = _tag(type || "*", element);
    for (let i = 0; i < e.length; i++) {
        if (re.test(e[i].className)) {
            r.push(e[i]);
        }
    }
    return r;
};

const _text = (element) => {
    let text = "";

    element = element.childNodes || element;

    for (let i = 0; i < element.length; i++) {
        text +=
            element[i].nodeType !== 1
                ? element[i].nodeValue
                : _text(element[i].childNodes);
    }
    return text;
};

const _create = (name, fn, element) => {
    element = element || document;
    const r = element.createElement(name);
    fn && fn(r);
    return r;
};

const _remove = (element) => {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
};

const _empty = (element) => {
    while (element.firstChild) {
        _remove(element.firstChild);
    }
};

const _chain = (element, ...fns) => {
    return fns.reduce((acc, fn) => fn(acc), element);
};

export const domProxy = {
    prev: _prev,
    next: _next,
    first: _first,
    last: _last,
    parent: _parent,
    setText: _setText,
    id: _id,
    tag: _tag,
    chain: _chain,
};
