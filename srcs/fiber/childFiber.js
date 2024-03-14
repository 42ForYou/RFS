import { isArray } from "../shared/isArray.js";
import { RFS_ELEMENT_TYPE, RFS_FRAGMENT_TYPE } from "../core/rfsSymbol.js";
import { createWorkInProgress } from "../fiber/fiber.js";
import { getIteratorFn } from "../core/rfsSymbol.js";
//Reconcile
//하나의 트리를 가지고 다른 트리로 변환하기 위한 최소한의 연산 수를 구하는 알고리즘 문제를 풀기 위한 일반적인 해결책들이 있습니다.
// 하지만 이러한 최첨단의 알고리즘도 n개의 엘리먼트가 있는 트리에 대해 O(n3)의 복잡도를 가집니다.
// React에 이 알고리즘을 적용한다면,
// 1000개의 엘리먼트를 그리기 위해 10억 번의 비교 연산을 수행해야 합니다.
// 너무나도 비싼 연산이죠. React는 대신, 두 가지 가정을 기반하여 O(n) 복잡도의 휴리스틱 알고리즘을 구현했습니다.
// 서로 다른 타입의 두 엘리먼트는 서로 다른 트리를 만들어낸다.
// 개발자가 key prop을 통해,
// 여러 렌더링 사이에서 어떤 자식 엘리먼트가 변경되지 않아야 할지 표시해 줄 수 있다.
//https://ko.reactjs.org/docs/reconciliation.html

/**
 *
 * @param {boolean} shouldTrackSideEffects - sideEffect를 가졌는지를 뜻함, 이게 켜져있으면 update로 아니면 mount로
 * @description 자식을 재조정하기 위한 래퍼 함수로써 내부적으로 이 로직을 진행하기 위한 헬퍼들을 내재화합니다.
 * @description 인자로 받는 boolean 값에 따라서 sideEffect를 가졌는지를 뜻하는 shouldTrackSideEffects가 켜져있으면 update로 아니면 mount로 작동합니다.
 * @description 내부적인 작동방식은 reconcileChildFibers를 리턴하는데, 이것이 내부 헬퍼를 호출하여 작동합니다.
 * @description 재조정을 하면서 해당 파이버에 대한 사이드 이펙트도 정의해야 되기 떄문에 일반적인 구조가 reconcile을 통해
 * @description 파이버를 끄집어 낸후 외부의 place~~의 헬퍼함수와 같이 사이드 이펙트를 가해주는 함수와 함께 작동합니다.
 */
const ChildReconciler = (shouldTrackSideEffects) => {
    /**
     *
     * @param {import('../../type/TFiber.js').TFiber} returnFiber
     * @param {import('../../type/TFiber.js').TFiber} currentFirstChild
     * @param {any} newChildren
     * @param {import('../../type/TExpirationTime.js').TExpirationTime} expirationTime
     * @returns {import('../../type/TFiber.js').TFiber} fiber | null
     * @description 재조정과 동시에 사이드 이펙트의 태그 또한 이 api에서 정의합니다.
     * @description 이 사이드이펙트는 자식에서부터 부모로 이후에 전달됩니다.
     */
    const reconcileChildFibers = (returnFiber, currentFirstChild, newChild, expirationTime) => {
        // 이 함수는 재귀적이지 않습니다.
        // 최상위 항목이 배열인 경우 자식 집합으로 처리합니다,
        // 조각이 아닌 자식 집합으로 취급합니다. 반면에 중첩된 배열은
        // 조각 노드로 취급됩니다. 재귀는 일반적인 흐름에서 발생합니다.

        // top level unkeyed fragment을 배열인 것처럼 처리합니다.
        // 이로 인해 <>{[...]}</>와 <>...</> 같은것들의 모호성이 생깁니다.
        // 위와 같은 경우들 동등하게 처리됩니다.(createElement에 의해 동등한 객체로 만들어지기 때문입니다.)
        // 이 설명은 React가 키가 없는 최상위 조각을 배열처럼 취급함으로써 이러한 모호함을 해결한다고 설명합니다.
        // 즉, 조정의 관점에서 보면 요소의 배열을 반환하는 것과 해당 요소를 포함하는 키가 없는 fragment을 반환하는 것
        // 사이에 차이가 없다는 뜻입니다.
        const isUnkeyedTopLevelFragment =
            typeof newChild === "object" &&
            newChild !== null &&
            newChild.$$typeof === RFS_FRAGMENT_TYPE &&
            newChild.key === null;
        if (isUnkeyedTopLevelFragment) {
            newChild = newChild.props.children;
        }

        //new Child가 object타입일떄
        const isObject = typeof newChild === "object" && newChild !== null;

        //new Child가 object타입이고 RfsElement일때
        if (isObject) {
            switch (newChild.$$typeof) {
                case RFS_ELEMENT_TYPE: {
                    //새로운 fiber을 재조정시킨 파이버를 singleChild로 배치합니다.
                    //TODO: placeSingleChild구현
                    //TODO: reconcileSingleElement구현
                    return placeSingleChild(
                        reconcileSingleElement(returnFiber, currentFirstChild, newChild, expirationTime)
                    );
                }
            }
        }

        //new Child가 스트링이여야 할때
        if (typeof newChild === "string" || typeof newChild === "number") {
            //새로운 텍스트 노드를 재조정시킨 파이버를 singleChild로 배치합니다.
            //NOTE: ""+ newChild는 newChild를 문자열로 변환합니다.
            //TODO: placeSingleChild구현
            //TODO: reconcileSingleTextNode구현
            return placeSingleChild(
                reconcileSingleTextNode(returnFiber, currentFirstChild, "" + newChild, expirationTime)
            );
        }

        //newChild가 배열일때
        if (isArray(newChild)) {
            return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, expirationTime);
        }

        //newChild가 iterable일때
        if (getIteratorFn(newChild)) {
            return reconcileChildrenIterator(returnFiber, currentFirstChild, newChild, expirationTime);
        }

        //에러처리

        //처리되지 않는 object일때
        if (isObject) {
            console.error("처리되지 않는 object입니다. in reconcileChildFibers");
            throw new Error("처리되지 않는 object입니다.");
        }

        //newChild가 fragment가 아닌데, 함수 인자로 해당 변수가 주어지지 않았을때
        if (typeof newChild === "undefined" && !isUnkeyedTopLevelFragment) {
            console.error("newChild가 fragment가 아닌데, 비어있습니다. in reconcileChildFibers");
            throw new Error("newChild가 fragment가 아닌데, 비어있습니다.");
        }

        // 나머지의 케이스 같은 경우는 비어있게 된 경우로 다 남은 children을 삭제한다
        //여기선 명시적으로 newChild를 null로 넣어준 경우-> 자식을 다 초기화한다
        //위에 case에경우는 인자로 안주어진 경우에 속한다
        //또한 처리되지 않은 케이스중 에러가 아닌 경우 기존의 자식들을 다 삭제한다.
        return deleteRemainingChildren(returnFiber, currentFirstChild);
    };

    return reconcileChildFibers;
};

/**
 * @param {TFiber|null} current @see 파일경로: [TFiber.js](srcs/type/TFiber.js)
 * @param {TFiber} workInProgress @see 파일경로: [TFiber.js](srcs/type/TFiber.js)
 * @returns {void}
 * @description 현재의 workInProgress의 child를 복사합니다.
 */
export const cloneChildFibers = (current, workInProgress) => {
    if (current === null) {
        console.error("current가 null입니다. in cloneChildFibers");
        throw new Error("current가 null입니다.");
    }
    //자식이 없는 경우 -> early return
    if (workInProgress.child === null) {
        return;
    }
    //새로운 자식을 만들어 wip에 연결합니다.
    let currentChild = workInProgress.child;
    let newChild = createWorkInProgress(currentChild, currentChild.pendingProps, currentChild.expirationTime);
    workInProgress.child = newChild;
    newChild.return = workInProgress;

    //모든 자식의 wip를 만들어서 연결합니다.
    while (currentChild.sibling !== null) {
        currentChild = currentChild.sibling;
        newChild = createWorkInProgress(currentChild, currentChild.pendingProps, currentChild.expirationTime);
        newChild.return = workInProgress;
    }
    //마지막 자식의 sibling을 null로 만들어줍니다.
    newChild.sibling = null;
};
