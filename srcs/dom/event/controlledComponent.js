// 제어 컴포넌트(Controlled Components)
// 제어 컴포넌트는 리액트에서 입력 폼 요소(<input>, <textarea>, <select> 등)의 상태를 리액트 컴포넌트의 state를 통해 관리하는 방식입니다. 이 방식을 사용하면, 폼 요소의 값(value)이나 체크 상태(checked)가 리액트 컴포넌트의 상태(state)에 의해 결정됩니다. 사용자 입력에 응답하여 컴포넌트의 상태를 업데이트하는 핸들러 함수를 구현함으로써, 폼 요소의 상태를 프로그래밍 방식으로 제어할 수 있습니다.

// finishEventHandler 함수의 역할
// 이 함수는 이벤트 처리가 완료된 후에 호출됩니다. 함수의 목적은, 리액트가 이벤트를 처리하는 동안에 "제어 컴포넌트"의 상태가 예상대로 업데이트 되었는지 확인하고, 필요한 경우 DOM 노드의 상태를 "제어"된 값으로 복원하는 것입니다. 이 과정은 다음 두 가지 주요 단계로 구성됩니다:

// needsStateRestore 호출: 이 함수는 제어 컴포넌트가 보류중인 업데이트를 가지고 있는지 확인합니다. 즉, 이벤트 핸들링 과정에서 상태가 변경되었지만, 아직 DOM에 반영되지 않은 변경사항이 있는지 검사합니다.

// 상태 복원: 만약 제어 컴포넌트가 보류중인 업데이트를 가지고 있다면 (controlledComponentsHavePendingUpdates가 true인 경우), flushDiscreteUpdatesImpl 함수를 호출하여 보류중인 업데이트를 처리하고, restoreStateIfNeeded 함수를 통해 필요한 경우 DOM 노드의 상태를 제어된 값으로 복원합니다.

// 이러한 과정은 제어 컴포넌트가 예상대로 정확하게 동작하도록 보장하는 데 중요합니다. 특히, 리액트가 업데이트를 "건너뛰어(bail out)" 최적화를 수행할 때, DOM 상태가 리액트의 상태와 불일치할 수 있는 문제를 방지합니다. 이는 사용자 경험을 일관되게 유지하고, 예상치 못한 동작을 방지하는 데 도움이 됩니다.
let restoreImpl = null;
let restoreTarget = null;
let restoreQueue = null;

const restoreStateOfTarget = (target) => {
    //TODO: getInstanceFromNode->정확히는 연결
    const internalInstance = getInstanceFromNode(target);
    if (!internalInstance) {
        // Unmounted
        return;
    }
    //TODO: getFiberCurrentPropsFromNode->정확히는 연결
    const props = getFiberCurrentPropsFromNode(internalInstance.stateNode);
    restoreImpl(internalInstance.stateNode, internalInstance.type, props);
};

export const setRestoreImplementation = (impl) => {
    restoreImpl = impl;
};

export const enqueueStateRestore = (target) => {
    if (restoreTarget) {
        if (restoreQueue) {
            restoreQueue.push(target);
        } else {
            restoreQueue = [target];
        }
    } else {
        restoreTarget = target;
    }
};

export const needsStateRestore = () => {
    return restoreTarget !== null || restoreQueue !== null;
};

export const restoreStateIfNeeded = () => {
    if (!restoreTarget) {
        return;
    }
    const target = restoreTarget;
    const queuedTargets = restoreQueue;
    restoreTarget = null;
    restoreQueue = null;

    restoreStateOfTarget(target);
    if (queuedTargets) {
        for (let i = 0; i < queuedTargets.length; i++) {
            restoreStateOfTarget(queuedTargets[i]);
        }
    }
};
