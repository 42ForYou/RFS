import hookCore from "../../../srcs/hooks/core/hookCore.js";
import { mountReducer, updateReducer } from "../../../srcs/hooks/useReducer/useReducerImpl.js";

window.__DEV__ = true;

hookCore.currentlyRenderingFiber = {
    tag: null,
    key: null,
    type: null,
    stateNode: null,
    return: null,
    child: null,
    sibling: null,
    index: 0,
    props: null,
    ref: null,
    memoizedState: null,
    dependencies: null,
    nextEffect: null,
    firstEffect: null,
    lastEffect: null,
    alternate: null,
};

const init = (count) => {
    return count;
};

const initialState = { count: 0 };

const reducer = (state, action) => {
    switch (action.type) {
        case "up":
            return { count: state.count + 1 };
        case "down":
            return { count: state.count - 1 };
        case "reset":
            return init(action.payload || { count: 0 });
        default:
            throw new Error("Unexpected action type", action.type);
    }
};

let first = true;
let state, dispatcher;

const app = () => {
    if (first) {
        [state, dispatcher] = mountReducer(reducer, initialState, init);
        first = false;
    } else {
        [state, dispatcher] = updateReducer(reducer, initialState, init);
    }

    const handleUpButtonClick = () => {
        state = dispatcher({ type: "up" });
        $app.innerHTML = `<h1>${state.count}</h1>`;
    };

    const handleDownButtonClick = () => {
        state = dispatcher({ type: "down" });
        $app.innerHTML = `<h1>${state.count}</h1>`;
    };

    const handleResetButtonClick = () => {
        state = dispatcher({ type: "reset", payload: { count: 1 } });
        $app.innerHTML = `<h1>${state.count}</h1>`;
    };

    const $app = document.querySelector("#app");
    const $upButton = document.querySelector("#up");
    const $downButton = document.querySelector("#down");
    const $resetButton = document.querySelector("#reset");

    $app.innerHTML = `<h1>${state.count}</h1>`;
    $upButton.addEventListener("click", handleUpButtonClick);
    $downButton.addEventListener("click", handleDownButtonClick);
    $resetButton.addEventListener("click", handleResetButtonClick);
};

app();
