import { prepareToReadContext, propagateContextChange, pushProvider, readContext } from "../context/newContext.js";
import calculateChangedBits from "../context/shared/calculateChangedBits.js";
import hasContextChanged from "../context/shared/hasContextChanged.js";

// TODO: 다른 파일로 옮기기
let didReceiveUpdate = false;

/**
 * @description - markWorkInProgressReceivedUpdate는 workInProgress가 update를 받았다는 것을 표시합니다.
 * 변수 didReceiveUpdate는 이후 frunction component를 update할 때 사용됩니다.
 *
 */
const markWorkInProgressReceivedUpdate = () => {
    didReceiveUpdate = true;
};

/**
 *
 * @param {TFiber} current
 * @param {TFiber} workInProgress
 * @param {TExpirationTime} renderExpirationTime
 *
 * @description - updateContextProvider의 목표는 consumer가 사용하는 값을 설정하는 것입니다.
 * 위의 목표를 달성하기 위해 Provider의 값을 update하는 과정을 수행합니다.
 * @returns
 */
const updateContextProvider = (current, workInProgress, renderExpirationTime) => {
    const providerType = workInProgress.type;
    const context = providerType._context;

    const newProps = workInProgress.pendingProps;
    const oldProps = workInProgress.memoizedProps;

    const newValue = newProps.value;

    // fiberStack에 새로운 value를 push합니다.
    pushProvider(workInProgress, newValue);

    if (oldProps !== null) {
        const oldValue = oldProps.value;

        // calculateChangedBits를 통해 이전 값과 새로운 값이 변하였는지 계산합니다.
        const changedBits = calculateChangedBits(context, newValue, oldValue);
        if (changedBits === 0) {
            // No change. Bailout early if children are the same.
            if (oldProps.children === newProps.children && !hasContextChanged()) {
                // TODO: implement this function.
                return bailoutOnAlreadyFinishedWork(current, workInProgress, renderExpirationTime);
            }
        } else {
            // The context value changed. Search for matching consumers and schedule
            // them to update.
            // changedBits가 0이 아니라면, context가 변했다는 것을 의미합니다.
            // Provider의 값이 변경되었기 때문에 해당 Provider의 값을 사용하는 Consumer를 찾아서
            // re-render를 해야합니다.
            propagateContextChange(workInProgress, context, changedBits, renderExpirationTime);
        }
    }

    const newChildren = newProps.children;
    // TODO: implement this function.
    reconcileChildren(current, workInProgress, newChildren, renderExpirationTime);
    return workInProgress.child;
};

/**
 *
 * @param {TFiber} current
 * @param {TFiber} workInProgress
 * @param {TExpirationTime} renderExpirationTime
 *
 * @description - beginWork에서 호출됩니다.
 * updateContextConsumer의 목표는 context 값을 읽어서 child component를 호출하여 re-render하는 것입니다.
 * @returns
 */
const updateContextConsumer = (current, workInProgress, renderExpirationTime) => {
    // wip fiber의 type에 context
    const context = workInProgress.type;

    const newProps = workInProgress.pendingProps;
    const render = newProps.children;

    // prepareToReadContext를 통해 context를 읽을 준비를 합니다.
    prepareToReadContext(workInProgress, renderExpirationTime);

    // readContext를 통해 context 값을 가져옵니다.
    const newValue = readContext(context, newProps.unstable_observedBits);

    // child component를 context의 값을 넣어 호출합니다.
    const newChildren = render(newValue);

    // TODO: implement this function.
    // reconcileChildren을 통해 child component를 재조정합니다.
    reconcileChildren(current, workInProgress, newChildren, renderExpirationTime);
    return workInProgress.child;
};

export { markWorkInProgressReceivedUpdate, updateContextProvider, updateContextConsumer };
