import { createElement } from "path/to/createElement";
import isEqual from "lodash/isEqual";

describe("createElement", () => {
    it("should create a simple element", () => {
        const element = createElement("div", { className: "test" }, "Hello");
        const expected = {
            type: "div",
            props: { className: "test", children: "Hello" },
            key: null,
            ref: null,
        };
        expect(isEqual(element, expected)).toBe(true);
    });

    it("should handle reserved props", () => {
        const element = createElement("div", {
            key: "unique-key",
            ref: () => {},
            className: "test",
        });
        const expected = {
            type: "div",
            props: { className: "test" },
            key: "unique-key",
            ref: expect.any(Function),
        };
        expect(isEqual(element, expected)).toBe(true);
    });

    it("should handle defaultProps", () => {
        const MyComponent = () => {};
        MyComponent.defaultProps = { defaultProp: "defaultValue" };

        const element = createElement(MyComponent, { prop: "value" });
        const expected = {
            type: MyComponent,
            props: { prop: "value", defaultProp: "defaultValue" },
            key: null,
            ref: null,
        };
        expect(isEqual(element, expected)).toBe(true);
    });

    it("should handle multiple children", () => {
        const element = createElement("div", null, "First", "Second");
        const expected = {
            type: "div",
            props: { children: ["First", "Second"] },
            key: null,
            ref: null,
        };
        expect(isEqual(element, expected)).toBe(true);
    });

    // 추가적인 테스트 케이스...
});
