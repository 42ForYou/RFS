export const Style = ((_) => {
    const prop = new Map(),
        prefix = "webkit,moz,ms,chrome,o,khtml".split(",");
    const NONE = Symbol();
    const BASE = document.body.style;
    const getKey = (key) => {
        if (prop.has(key)) return prop.get(key);
        if (key in BASE) {
            prop.set(key, key);
        } else {
            const found = prefix.some((v) => {
                const newKey = v + key[0].toUpperCase() + key.substr(1);
                if (newKey in BASE) {
                    prop.set(key, newKey);
                    key = newKey;
                    return true;
                }
                return false;
            });
            if (!found) prop.set(key, NONE);
        }
        return prop.get(key);
    };
    return class {
        constructor(style) {
            this._style = style;
        }
        get(key) {
            key = getKey(key);
            if (key === NONE) return null;
            return this._style[key];
        }
        set(key, val) {
            key = getKey(key);
            if (key !== NONE) this._style[key] = val;
            return this;
        }
    };
})();

const Rule = class {
    constructor(rule) {
        this._rule = rule;
        this._style = new Style(rule.style);
    }
    get(key) {
        return this._style.get(key);
    }
    set(key, val) {
        this._style.set(key, val);
        return this;
    }
};

export const Sheet = class {
    constructor(sheet) {
        this._sheet = sheet;
        this._rules = new Map();
    }
    add(selector) {
        const index = this._sheet.cssRules.length;
        this._sheet.insertRule(`${selector}{}`, index);
        const cssRule = this._sheet.cssRules[index];
        let rule;
        if (selector.startsWith("@keyframes")) {
            rule = new KeyFramesRule(cssRule);
        } else {
            rule = new Rule(cssRule);
        }
        this._rules.set(selector, rule);
        return rule;
    }
    remove(selector) {
        if (!this._rules.has(selector)) return;
        const rule = this._rules.get(selector)._rule;
        Array.from(this._sheet.cssRules).some((cssRule, index) => {
            if (cssRule === rule._rule) {
                this._sheet.deleteRule(index);
                return true;
            }
            return false;
        });
    }
    get(selector) {
        return this._rules.get(selector);
    }
};

const KeyFramesRule = class {
    constructor(rule) {
        this._keyframe = rule;
        this._rules = new Map();
    }
    add(selector) {
        const index = this._keyframe.cssRules.length;
        this._keyframe.appendRule(`${selector}{}`);
        const cssRule = this._keyframe.cssRules[index];
        const rule = new Rule(cssRule);
        this._rules.set(selector, rule);
        return rule;
    }
    remove(selector) {
        if (!this._rules.has(selector)) return;
        const rule = this._rules.get(selector)._rule;
        Array.from(this._keyframe.cssRules).some((cssRule, index) => {
            if (cssRule === rule._rule) {
                this._keyframe.deleteRule(index);
                return true;
            }
            return false;
        });
    }
};
