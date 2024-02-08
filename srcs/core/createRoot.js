/**
 * @file createRoot.js
 * @description This file defines the function related to the root of the application.
 */

//todo: implement this function
const isValidContainer = (container) => {};
//todo: implement this function
const createContainer = (container, RootTag) => {};
//todo: implement this class
const ReactDOMRoot = class {
    constructor(container) {}
};
/**
 *
 * @param {container} container -> host Instance를 인자로 받는다-> Element|Document|DocumentFragment
 */
// createRoot는 해당 Fiber에 대해서 관리를 위한 그 스코프내의 전역관리 공간이라고 생각할 수 있습니다. 그 전역관리 공간의 설정은 해당
// 짐입점으로 부터 시작하는 createContainer에 의해서 만들어지고, render와 Unmount의 원할한 공유를 위하여 한번 ReactDOMRoot에 의해서 랩핑되어서 반환되어집니다
export const createRoot = (container) => {
    if (!isValidContainer(container)) {
        throw new Error(
            "createRoot: container is not a valid DOM element -RFS error"
        );
    }
    //TODO: implement this functions
    const root = createContainer(container, ConcurrentRoot);
    //Todo: this will be imported from the event module
    //listenToAllSupportedEvents();
    //
    return new ReactDOMRoot(root);
};

/**
 * @param {container} container
 * @param {rootTag} RootTag // refer to const.js
 */
