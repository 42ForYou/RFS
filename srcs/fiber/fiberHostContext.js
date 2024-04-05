/**
 * @file ReactFiberHostContext.js
 * @description // reactFiberHostContext.js는 React Fiber 아키텍처에서 호스트 환경(예: DOM, React Native 등)에 관한 컨텍스트를 관리하기 위해 사용됩니다. 이 파일의 핵심 기능은 호스트 환경의 특정한 정보를 컴포넌트 트리 전반에 걸쳐 유지하고 전달하는 것입니다. 이를 통해 React는 다양한 호스트 환경에서 효율적으로 작동할 수 있습니다.

// reactFiberHostContext.js가 중요한 이유:
// 호스트 환경의 차이점 관리: React는 웹(DOM)과 모바일(React Native)을 포함하여 다양한 환경에서 작동할 수 있습니다. 각 환경은 자체적인 API와 요구 사항을 가지고 있으므로, React는 이러한 차이점을 추상화하고 일관된 개발 경험을 제공해야 합니다. reactFiberHostContext.js는 이러한 환경별 차이점을 관리하고, 호스트 환경에 적합한 동작을 수행할 수 있도록 합니다.

// 컴포넌트 트리 내 컨텍스트 전달: 컴포넌트가 렌더링될 때, 부모 컴포넌트로부터 자식 컴포넌트로 필요한 정보(예: 현재 DOM 노드의 참조)가 전달됩니다. reactFiberHostContext.js는 이러한 정보를 컴포넌트 트리 내에서 적절히 전달하고 관리합니다.

// 예시: DOM 환경에서의 컨텍스트 관리
// 웹 애플리케이션에서, reactFiberHostContext.js는 DOM 트리 내에서 현재의 DOM 노드 참조를 관리할 수 있습니다. 예를 들어, React가 <table> 내부에 <div>를 렌더링하려고 할 때, HTML 표준에 따라 <div>는 <table>, <tbody>, <tr> 등의 자식으로 직접 포함될 수 없습니다. 이때 reactFiberHostContext.js는 현재 렌더링 컨텍스트가 <table> 내부임을 알고 있으므로, React는 이 정보를 바탕으로 경고를 출력하거나 적절한 대처를 할 수 있습니다.

// 구현:
// pushHostContext와 popHostContext 함수는 렌더링 중인 컴포넌트의 컨텍스트를 스택에 푸시하거나 팝하는 역할을 합니다. 예를 들어, React가 컴포넌트 트리를 내려가면서 렌더링을 수행할 때, 각 단계에서 현재 호스트 환경에 관한 정보(예: 현재 DOM 노드)를 스택에 푸시합니다. 그리고 렌더링이 완료되면, 이 정보를 다시 팝하여 이전 상태로 복원합니다.
// 이 과정을 통해 React는 어느 시점에서든 현재의 호스트 환경에 관한 정확한 정보를 알 수 있으며, 이 정보를 사용하여 렌더링을 최적화하거나 특정 호스트 환경에 맞는 조치를 취할 수 있습니다.
// 요약하면, reactFiberHostContext.js는 React가 다양한 호스트 환경에서 효과적으로 작동하도록 돕는 중요한 역할을 합니다. 이를 통해 React는 호스트 환경의 특성을 고려한 렌더링을 수행하고, 컴포넌트 트리 전반에 걸쳐 필요한 정보를 전달할 수 있습니다.

//실제 그냥 자바스크립트 동작과 비슷하다고 보면됨
//우리가 hostRoot를 실행시킬거면 hostRoot의 콘텍스트가 있을거고 그걸 넣고
//hostRootfiber에 대한 context를 넣어주고
//그리고 host에 대한 context를 넣어준다음에 이 환경 내에서 처리를 하게끔 하는거임
 */

import { createCursor, push, pop } from "./fiberStack.js";
import { getRootHostContext, getChildHostContext } from "../dom/core/domHost.js";
/**
 * @type {TNoContextT} @see ../type/TContext.js
 */
const NO_CONTEXT = {};

/**
 * @type {TStackCursor<THostContext | TNoContextT>} @see ../type/TStackCursor.js
 */
const contextStackCursor = createCursor(NO_CONTEXT);

/**
 * @type {TStackCursor<TFiber | TNoContextT>} @see ../type/TStackCursor.js
 * @see {TFiber} @see ../type/TFiber.js
 * @see {TNoContextT} @see ../type/TContext.js
 
 */
const contextFiberStackCursor = createCursor(NO_CONTEXT);

/**
 * @type {TStackCursor<TContainer | TNoContextT>} @see ../type/TStackCursor.js
 */
const rootInstanceStackCursor = createCursor(NO_CONTEXT);

/**
 *
 * @param {TNoContextT | Value} c
 * @returns {Value}
 * @description - c가 NO_CONTEXT일 경우 에러를 발생시킵니다. 아니면 context의 value를 반환합니다.
 */
const requiredContext = (c) => {
    if (c === NO_CONTEXT) {
        console.error(
            "Expected host context to exist. This error is likely caused by a bug in rfs. Please file an issue. In RequiredContext"
        );
        throw new Error(
            "Expected host context to exist. This error is likely caused by a bug in rfs. Please file an issue. In RequiredContext"
        );
    }
    return c;
};

/**
 *
 * @returns {TContainer}
 * @description 현재 파이버 스택에서의 RootInstanceContext에서의 값(RootInstance(container))을 반환합니다.
 */
export const getRootHostContainer = () => {
    const rootInstance = requiredContext(rootInstanceStackCursor.current);
    return rootInstance;
};

//NOTE: 돔 모듈에서 정확히 필요한지 정의될것 같음. 지금 현재로썬 의미론 상
//NOTE: 타당해보임
/**
 *
 * @param {TFiber} fiber
 * @param {TContainer} nextRootInstance
 * @description 현재 파이버 스택의 다음 RootInstance와 해당 파이버의 context를 스택에 푸시합니다.
 */
export const pushHostContainer = (fiber, nextRootInstance) => {
    //current Root Instance를 스택에 넣는다.
    //NOTE:  portal과 관련된 것으로 보임
    push(rootInstanceStackCursor, nextRootInstance);

    // 컨텍스트와 컨텍스트를 제공한 파이버를 추적합니다.
    // 이렇게 하면 고유한 컨텍스트를 제공하는 파이버만 팝업할 수 있습니다.
    push(contextFiberStackCursor, fiber);

    // 마지막으로 호스트 컨텍스트를 스택에 푸시해야 합니다.
    // 하지만 getRootHostContext()를 호출해서 푸시할 수는 없습니다.
    // 스택의 항목 수가 달라질 수 있기 때문입니다.
    //   렌더러 코드의 어딘가에 getRootHostContext()가 던지는지 여부에 따라 // 스택의 항목 수가 달라지기 때문입니다.
    // 그래서 빈 값을 먼저 푸시합니다. 이렇게 하면 오류를 안전하게 처리할 수 있습니다.
    push(contextStackCursor, NO_CONTEXT);
    const nextRootContext = getRootHostContext(nextRootInstance);

    // 마지막으로 실제 값을 푸시합니다.
    pop(contextStackCursor);
    push(contextStackCursor, nextRootContext);
};

/**
 * @description - 현재의 호스트 컨텍스트를 스택에서 팝합니다.
 */
export const popHostContainer = () => {
    pop(contextStackCursor);
    pop(contextFiberStackCursor);
    pop(rootInstanceStackCursor);
};

/**
 * @description - 현재의 호스트 컨텍스트를 반환합니다.
 * @returns {THostContext}
 */
export const getHostContext = () => {
    const context = requiredContext(contextStackCursor.current);
    return context;
};

/**
 *
 * @param {TFiber} fiber
 * @description - 현재의 호스트 컨텍스트를 스택에 푸시합니다.(현재 호스트 컨텍스트 기반으로 다음 컨텍스트를 가져와서 푸시한다.)
 * @description
 */
export const pushHostContext = (fiber) => {
    const rootInstance = requiredContext(rootInstanceStackCursor.current);
    const context = requiredContext(contextStackCursor.current);
    const nextContext = getChildHostContext(context, fiber.type, rootInstance);

    //nextContext와 같다면 푸시하지 않는다.
    if (context === nextContext) {
        return;
    }

    push(contextFiberStackCursor, fiber);
    push(contextStackCursor, nextContext);
};

/**
 *
 * @param {TFiber} fiber
 * @description - 현재의 호스트 컨텍스트를 스택에서 팝합니다.
 */
export const popHostContext = (fiber) => {
    // 이 파이버가 현재 컨텍스트를 제공하지 않으면 팝업하지 않습니다.
    // pushHostContext()는 고유한 컨텍스트를 제공하는 파이버만 푸시합니다.
    if (contextFiberStackCursor.current !== fiber) {
        return;
    }
    pop(contextStackCursor);
    pop(contextFiberStackCursor);
};
