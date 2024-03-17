import { pop, push } from "../fiber/fiberStack.js";
import { markWorkInProgressReceivedUpdate } from "../work/beginWork.js";
import createContextItem from "./constructor/contextItem.js";
import contextCore from "./core/contextCore.js";
// TODO: import { isPrimaryRenderer } from "react-dom";
// RFS의 ReactDOMHostConfig에서 isPrimaryRenderer를 가져옵니다.

/**
 *
 * @param {TFiber} providerFiber - Provider의 fiber
 * @param {any} nextValue
 *
 * @description - pushProvider의 목표는 provider가 사용하는 값 fiber stack에 push하는 것입니다.
 *
 * @see fiberStack
 */
const pushProvider = (providerFiber, nextValue) => {
    const context = providerFiber.type._context;
    // react에서는 renderer가 여러개일 수 있습니다.
    // 현재 저희 프로젝트에서는 browser에서만 사용하기 때문에 isPrimaryRenderer는 항상 true입니다
    // 그래서 context._currentValue와 context._currentValue2를 사용하지 않습니다.
    // 하지만 rfs에서 다른 renderer를 사용할 수 있기 때문에 우선 남겨 두겠습니다.
    if (isPrimaryRenderer) {
        push(contextCore.valueCursor, context._currentValue, providerFiber);

        context._currentValue = nextValue;
        context._currentRenderer = contextCore.rendererSigil;
    } else {
        push(contextCore.valueCursor, context._currentValue2, providerFiber);

        context._currentValue2 = nextValue;
        context._currentRenderer2 = contextCore.rendererSigil;
    }
};

/**
 *
 * @param {TFiber} providerFiber - Provider의 fiber
 *
 * @description - popProvider의 목표는 provider가 사용하는 값 fiber stack에서 pop하는 것입니다.
 * 이때의 컨텍스트는 현재 fiber가 Provider의 sibling이거나 parent일 때 사용하는 함수입니다.
 *
 * 해당 함수는 completeWork에서 호출됩니다.
 * @see completeWork
 */
const popProvider = (providerFiber) => {
    const currentValue = contextCore.valueCursor.current;

    pop(contextCore.valueCursor, providerFiber);

    const context = providerFiber.type._context;
    if (isPrimaryRenderer) {
        context._currentValue = currentValue;
    } else {
        context._currentValue2 = currentValue;
    }
};

/**
 *
 * @param {TFiber} parent
 * @param {TexpirationTime} renderExpirationTime
 *
 * @description - scheduleWorkOnParentPath의 목표는 모든 조상의 childExpirationTime을 renderExpirationTime으로 변경하는 것입니다.
 * alternate도 함께 변경합니다.
 */
const scheduleWorkOnParentPath = (parent, renderExpirationTime) => {
    // Update the child expiration time of all the ancestors, including
    // the alternates.
    let node = parent;
    while (node !== null) {
        const alternate = node.alternate;
        if (node.childExpirationTime < renderExpirationTime) {
            node.childExpirationTime = renderExpirationTime;
            if (alternate !== null && alternate.childExpirationTime < renderExpirationTime) {
                alternate.childExpirationTime = renderExpirationTime;
            }
        } else if (alternate !== null && alternate.childExpirationTime < renderExpirationTime) {
            alternate.childExpirationTime = renderExpirationTime;
        } else {
            // Neither alternate was updated, which means the rest of the
            // ancestor path already has sufficient priority.
            // alternate까지 update되었다는 것은 남은 조상은 이미 충분한 우선순위를
            // 가지고 있음을 의미합니다. 그러므로 더이상 진행할 필요가 없습니다.
            break;
        }
        node = node.return;
    }
};

/**
 *
 * @param {TFiber} workInProgress
 * @param {Tcontext} context
 * @param {number} changedBits
 * @param {TexpirationTime} renderExpirationTime
 *
 * @description - propagateContextChange의 목표는 Provider의 값(context)이 변경되었을 때, 해당 context를 사용하는
 * consumer들에게 변경되었다는 것을 알리는 것입니다.
 *
 * // 이때 변경되었다는 것을 알리는 용도로 해당 fiber의 expirationTime을 변경합니다.
 * @returns
 */
const propagateContextChange = (workInProgress, context, renderExpirationTime) => {
    let fiber = workInProgress.child;
    if (fiber !== null) {
        // Set the return pointer of the child to the work-in-progress fiber.
        fiber.return = workInProgress;
    }
    while (fiber !== null) {
        let nextFiber;

        // Visit this fiber;
        // fiber의 context list를 확인합니다.
        const list = fiber.dependencies;
        if (list !== null) {
            nextFiber = fiber.child;

            let dependency = list.firstContext;
            while (dependency !== null) {
                // Check if the context matches.
                // 현재 fiber의 context list중에서 현재 변경된 context와 일치하는 context가 있는지 확인합니다.
                // 만약에 일치하면서 변경되었다면 해당 fiber를 re-render해야합니다.
                if (dependency.context === context) {
                    // Match! Schedule an update on this fiber.

                    // fiber를 re-render하기 때문에 해당 fiber의 expirationTime을 변경합니다.
                    if (fiber.expirationTime < renderExpirationTime) {
                        fiber.expirationTime = renderExpirationTime;
                    }
                    // manipulate the alternate property
                    // alternate fiber도 함께 expirationTime을 변경합니다.
                    // 현재 fiber만 변경하면 지금 시점의 render가 반영이 되지 않기 때문.
                    const alternate = fiber.alternate;
                    if (alternate !== null && alternate.expirationTime < renderExpirationTime) {
                        alternate.expirationTime = renderExpirationTime;
                    }

                    // 현재 fiber의 parent의 childExpirationTime을 변경합니다.
                    scheduleWorkOnParentPath(fiber.return, renderExpirationTime);

                    // Mark the expiration time on the list, too.
                    // 해당 fiber의 context list의 expirationTime을 변경합니다.
                    if (list.expirationTime < renderExpirationTime) {
                        list.expirationTime = renderExpirationTime;
                    }

                    // Since we already found a match, we can skip the rest of the dep list.
                    // 해당 함수에서는 하나의 context가 변경한 상황에서만 진입하기 때문에
                    // 다른 context들은 볼 필요가 없습니다.
                    break;
                }
                dependency = dependency.next;
            }
        } else if (fiber.tag === ContextProvider) {
            // Don't scan deeper if this is a matching provider
            nextFiber = fiber.type === workInProgress.type ? null : fiber.child;
        } else {
            nextFiber = fiber.child;
        }
        // NOTE: we don't implement DehydreatedFragment.

        // nextFier가 null이라는 것은 더이상 child가 없다는 것.
        // 그러면 sibling을 확인하고 그마저도 존재하지 않는다면 parent로 올라갑니다.
        if (nextFiber !== null) {
            // Set the return pointer of the child to the work-in-progress fiber.
            nextFiber.return = fiber;
        } else {
            // No child. Traverse to next sibling.
            nextFiber = fiber;
            while (nextFiber !== null) {
                if (nextFiber === workInProgress) {
                    // We're back to the root of this subtree. Exit.
                    nextFiber = null;
                    break;
                }
                // manipulate the sibling property
                const sibling = nextFiber.sibling;
                if (sibling !== null) {
                    sibling.return = nextFiber.return;
                    nextFiber = sibling;
                    break;
                }
                // No more siblings. Traverse up.
                nextFiber = nextFiber.return;
            }
        }
        fiber = nextFiber;
    }
};

/**
 *
 * @param {TFiber} workInProgress
 * @param {TexpirationTime} renderExpirationTime
 *
 * @description - prepareToReadContext의 목표는 context를 읽기 전에 준비하는 것입니다.
 * 해당 함수는 주로 updateContextConsumer에서 호출되지만. 다른 곳에서도 호출될 수 있습니다.
 *
 * 새로운 Context를 읽어야 하기 때문에 관련된 변수들을 초기화하는 과정을 수행합니다.
 */
const prepareToReadContext = (workInProgress, renderExpirationTime) => {
    contextCore.currentlyRenderingFiber = workInProgress;
    contextCore.lastContextDependency = null;
    contextCore.lastFullyObservedContext = null;

    // component는 여러개의 context를 사용할 수 있습니다.
    // dependencies는 해당 fiber에서 사용되는 컨텍스트의 리스트입니다.
    const dependencies = workInProgress.dependencies;
    if (dependencies !== null) {
        const firstContext = dependencies.firstContext;
        if (firstContext !== null) {
            if (dependencies.expirationTime >= renderExpirationTime) {
                // Context list has a pending update. Mark that this fiber performed work.
                markWorkInProgressReceivedUpdate();
            }
            // Reset the work-in-progress list
            // 이제 새로운 context들을 읽을 것이기 때문에 이전에 사용한 context들을 초기화합니다.
            // https://jser.dev/react/2021/07/28/how-does-context-work#41-preparetoreadcontext
            // useContext에서는 더 유용하다고 하는데 아직 잘 모르겠음.
            dependencies.firstContext = null;
        }
    }
};

/**
 *
 * @param {Tcontext} context
 * @param {number} observedBits
 *
 * @description - readContext의 목표는 context 값을 읽는 것입니다.
 * 이 함수에서 context의 값을 읽습니다.
 * @returns
 */
const readContext = (context) => {
    if (contextCore.lastFullyObservedContext === context) {
        // Nothing to do. We already observe everything in this context.
    } else {
        const contextItem = createContextItem(context, null);

        if (contextCore.lastContextDependency === null) {
            // this is the first dependency for this component. Create a new list.
            contextCore.lastContextDependency = contextItem;
            contextCore.currentlyRenderingFiber.dependencies = {
                expirationTime: NoWork,
                firstContext: contextItem,
                responders: null,
            };
        } else {
            // append a new context item.
            contextCore.lastContextDependency = contextCore.lastContextDependency.next = contextItem;
        }
    }
    return isPrimaryRenderer ? context._currentValue : context._currentValue2;
};

export { pushProvider, popProvider, prepareToReadContext, readContext, propagateContextChange };
