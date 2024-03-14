import { isArray } from "../shared/isArray.js";
import { RFS_ELEMENT_TYPE, RFS_FRAGMENT_TYPE } from "../core/rfsSymbol.js";
import { createWorkInProgress } from "../fiber/fiber.js";
import { getIteratorFn } from "../core/rfsSymbol.js";
import { TFiber } from "../../type/TFiber.js";
import { createFiberFromElement, createFiberFromFragment, createFiberFromText } from "../fiber/fiber.js";
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
//NOTE: update하는 상황은 newFiber.alternate 가 있는 상황이고
//NOTE: 새로 배치하는 상황은 일반적으로 newFiber.alternate가 null인 상황인데 이는 type이 다르거나, key가 그 위치에 새로운 파이버를 배치하는 상황입니다.
const ChildReconciler = (shouldTrackSideEffects) => {
    /**
     *
     * @param {TFiber} returnFiber
     * @param {TFiber} childToDelete
     * @description 해당 파이버에 대한 자식을 삭제하는 함수이다.
     * @description 여기서 삭제란 사이드 이펙트를 남겨두는 것을 의미한다. 이는 여기서 실제
     * @description 삭제가 일어나는 것을 의미하지 않는다.
     */
    const deleteChild = (returnFiber, childToDelete) => {
        if (!shouldTrackSideEffects) {
            return;
        }
        //삭제도 여기서 진행하는것이 아니라 사이드 이펙트에서 처리됨으로
        //현재 리턴파이버에 사이드 이펙트 형식으로 넣어줘야 됨
        //그리고 현재 파이버는 effectTag에 Deletion을 달아서 삭제해야 되는 sideEffect임을 알게함
        //이 삭제는 completephase가 될때 까지 추가 되지 않음
        //삭제를 returnFIber의 sideEffect에 넣어줘야 됨
        const last = returnFiber.lastEffect;
        if (last !== null) {
            last.nextEffect = childToDelete;
            returnFiber.lastEffect = childToDelete;
        } else {
            returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
        }
        childToDelete.nextEffect = null;
        childToDelete.effectTag = Deletion;
    };

    /**
     *
     * @param {TFiber} returnFiber
     * @param {TFiber|null} currentFirstChild
     * @description currentFirstChild부터 child의 형제를 돌면서 마지막 형제까지 삭제하는 함수이다.
     */
    const deleteRemainingChildren = (returnFiber, currentFirstChild) => {
        if (!shouldTrackSideEffects) {
            return null;
        }
        let childToDelete = currentFirstChild;
        while (childToDelete !== null) {
            deleteChild(returnFiber, childToDelete);
            childToDelete = childToDelete.sibling;
        }
        return null;
    };

    /**
     *
     * @param {TFiber} fiber
     * @param {any} pendingProps
     * @param {TExpirationTime} expirationTime
     * @returns {TFiber}
     * @description 해당 파이버를 재사용할 수 있도록 하는 함수이다. 재사용을 하기 위해서 기본의 형제와의 연결을 모두 끊어준다.
     */
    const useFiber = (fiber, pendingProps, expirationTime) => {
        //wip를 먼저 만들고
        const clone = createWorkInProgress(fiber, pendingProps, expirationTime);
        //기존의 clone의 형제와의 연결을 모두 끊어준다.
        clone.index = 0;
        clone.sibling = null;
        return clone;
    };
    /**
     *
     * @param {TFiber} newFiber
     * @description 단순히 파이버를 배치했음을 사이드 이펙트에 가해주는 함수다
     * @description 이렇게 해줘야 뒤에서 사이드이펙트를 처리하면서 해당 파이버에 대한 domNode를 삽입가능하다.
     */
    const placeSingleChild = (newFiber) => {
        //단순히 single child 케이스를 처리하는 케이스에는 단순히
        //sideEffect에 placeMent(배치를함)을 켜주면 된다.

        //shouldTrackSideEffects-> update상황 즉 current가 있는 상황
        //useFiber를 통해서 재사용하게 끔하면 createWorkInProgress를 통해 있는것을
        //재사용하게 되는데 이 재사용이 됬다라는 의미는 alternate를 가지는 것을 의미한다.
        //update하는 상황이고 재사용하는 상황이 아니면 새로운 파이버를 배치하는 상황이다.->sideEffect에 Placement를 켜준다.
        if (shouldTrackSideEffects && newFiber.alternate === null) {
            newFiber.effectTag = "Placement";
        }
    };

    /**
     *
     * @param {TFiber} returnFiber
     * @param {TFiber | null} currentFirstChild
     * @param {import('../../type/TRfsType.js').TRfsElement} element
     * @param {import('../../type/TExpirationTime.js').TExpirationTime} expirationTime
     * @returns {TFiber} fiber
     * @description 해당 파이버에 대해서 단하나의 element로 재조정 해주는 함수이다.
     * @description 결론적으로 이 함수는 currentChild가 여러개 있을건데
     * @description 그걸 다 없애면서, newChild를 넣어줘야 되는 함수이다.
     * @description 그런데 만약 현재 차일드 중에 key도 같고, 타입도 같은게 있으면
     * @description 재사용한다. 재사용하는 경우에는 alternate가 존재한다.
     */
    const reconcileSingleElement = (returnFiber, currentFirstChild, element, expirationTime) => {
        const key = element.key;
        let child = currentFirstChild;

        //목표: 모든 자식들을 삭제하되, key도 같고, 타입도 같은것이 있으면
        //재사용하고, 나머지 뒤에 부분을 다 삭제한다.
        while (child !== null) {
            if (child.key === key) {
                if (child.tag === Fragment ? element.type === RFS_FRAGMENT_TYPE : child.elementType === element.type) {
                    //현 파이버 이후의 파이버들을 다 삭제한다.
                    deleteRemainingChildren(returnFiber, child.sibling);
                    const existing = useFiber(
                        child,
                        element.type === RFS_FRAGMENT_TYPE ? element.props.children : element.props,
                        expirationTime
                    );
                    existing.ref = elemnt.ref;
                    existing.return = returnFiber;
                    return existing;
                } else {
                    //아니면 현재 child랑 키는 같으나 타입이 바뀐것임으로
                    //모든 child를 삭제하고 순회의 바깥 과정에서
                    //알맞는 파이버를 생성한다.
                    deleteRemainingChildren(returnFiber, child);
                    break;
                }
            } else {
                //현재 파이버를 제거하고 이후의 파이버를 순회한다.
                deleteChild(returnFiber, child);
            }
            child = child.sibling;
        }

        //파이버가 다 삭제 됬음으로 새로운 파이버를 생성한다.
        //RfsElement아니면 RfsFragment이다.
        if (element.type === RFS_FRAGMENT_TYPE) {
            const created = createFiberFromFragment(
                //NOTE: fragment는 rfs내부적으로는 array로 묶어주는 것을 의미함으로
                //NOTE: props도 children array로 들어가게 되는데, 이를 위해 element.props.children을 넣어준다.
                element.props.children,
                returnFiber.mode,
                expirationTime,
                element.key
            );
            created.return = returnFiber;
            return created;
        } else {
            const created = createFiberFromElement(element, returnFiber.mode, expirationTime);
            created.ref = element.ref;
            created.return = returnFiber;
            return created;
        }
    };
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
            //TODO: reconcileSingleTextNode구현
            return placeSingleChild(
                reconcileSingleTextNode(returnFiber, currentFirstChild, "" + newChild, expirationTime)
            );
        }

        //newChild가 배열일때
        if (isArray(newChild)) {
            //TODO: reconcileChildrenArray구현
            return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, expirationTime);
        }

        //newChild가 iterable일때
        if (getIteratorFn(newChild)) {
            //TODO: reconcileChildrenIterator구현
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
