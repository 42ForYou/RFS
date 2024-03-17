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
     * @param {TFiber} newFiber
     * @param {number} lastPlacedIndex -> 마지막으로 배치를 이동하지 않고 가만히 있는 파이버의 인덱스를 가르키는 변수
     * @param {number} newIndex
     * @description 자식을 정확한 위치에 배치 시키는 함수이다.
     * @description 기본적으로 index를 바꾸는 행위를 하며, placeMentTag(사이드 이팩트를 가함)을 할지 안할지를 정한다
     * @description 여기서 배치란 list구조 내에서의 배치를 의미한다(fiber가 list구조 임을 기억하자)
     * @description 실제 리스트내에서 배치가 바뀌는 친구만 placementTag를 붙인다(sideEffect)
     * @description 이 리스트 구조내에서 자리를 바꿈에 있어서 해당 알고리즘은 가장 많은 방향이 같은 그룹(연속된)을 남겨서 적게 이동을 시키길 원한다.
     * @description 그것에 대한 해답으로, newChild배열의 처음을 기준으로 가장 길게 진행 방향으로 방향이 같은 그룹은 이동을 하지 않아도 된다
     * @description 라고 보고 나머지 그룹을 이동시킨다.
     * @description 예 1) 1->2->3->4->5 ==> 3->4->5->1->2로 바뀌는 경우인 새 첫자식인 3으로 부터 (3,4,5)가 방향이 일치함으로 이동을
     * @description 하지 않아도 된다라고 보고 1,2를 새로 배치시킨다.
     * @description 예 2) 1->2->3->4->5 ==> 3->5->4->1->2로 바뀌는 경우 (3,5)까지가 방향이 같은 그룹으로 보고 (3,5)를 이동시키지 않고
     * @description (4,1,2)를 이동시킨다.
     * @description 해당 알고리즘은 특성상 반전에 취약하다
     * @description 예 3) 1->2->3->4->5 ==> 5->4->3->2->1로 바뀌는 경우 (5로)부터 방향이 같은 그룹이 하나도 없음으로 5만 이동을 시키지 않고
     * @description 나머지를 이동시킨다. ==> 이는 반전과 같은 구조보다는 방향을 일치 시키는 구조가 좀 더 많이 일어난다라고 가정한 것이다.
     */
    //TODO: 배치 설명 가장 list내에서 인접한 그룹을 많이 남겨서 적게 이동한다라는 식으로 설명바꾸기
    const placeChild = (newFiber, lastPlacedIndex, newIndex) => {
        newFiber.index = newIndex;
        if (!shouldTrackSideEffects) {
            return lastPlacedIndex;
        }
        const current = newFiber.alternate;
        if (current !== null) {
            const oldIndex = current.index;
            //NOTE: 현재 리스트 노드가 가르키고 있는 친구가 바뀌었을때 placementTag를 달아주는것을 가능하게 하는이유는
            //NOTE: lastPlacedIndex가 마지막으로 가만히 있던 친구의 인덱스 인데
            //NOTE: 여기 부분에 들어 온다라는것은 배치가 index가 바뀌었다라는 것이고, 그런데 마지막으로 움직인 친구보다
            //NOTE: 뒤에 있던 친구라면 그전에 있던 친구들이 가만히있는 상태로 list구조를 유지하면서 인접자리를
            //NOTE: 유지할 수 없음으로 바뀌어야 된다라고 할 수 있다.
            //NOTE: 예) 1->2->3 => 2->3->1로 바뀌는 경우
            //NOTE: 바깥에서 이터레이팅을 돌기 떄문에 2,3,1순으로확인을 하게되는데 (1<0)->false임으로 가만히 있고
            //NOTE: lastPlacedIndex는 1이되고, 3을확인할떄는 (2<1)->false임으로 가만히 있고 lastPlacedIndex는 2가되고
            //NOTE: 1을 확인할떄는 (0<2)=>true임으로 이동을 해야됨으로 placementTag를 달아줘야됨
            if (oldIndex < lastPlacedIndex) {
                // This is a move.
                newFiber.effectTag = Placement;
                return lastPlacedIndex;
            } else {
                //NOTE:오직 여기서만 마지막으로 배치를 이동하지 않고 가만히 있는 파이버의 인덱스를 가르키는 변수가 변한다.
                // This item can stay in place.
                return oldIndex;
            }
        } else {
            //NOTE: 새롭게 만들어진 파이버에 대해서는 열로 들어옴
            //NOTE: alternate가 없으니까 -> 그런경우에는 바로 placeMent를 달아줌
            // This is an insertion.
            newFiber.effectTag = Placement;
            //NOTE: 마지막으로 배치를 이동하지 않은 친구는 변하지 않는다.
            return lastPlacedIndex;
        }
    };
    /**
     *
     * @param {TFiber} returnFiber
     * @param {TFiber | null} currentFirstChild
     * @param {string} textContent
     * @param {TExpirationTime} expirationTime
     * @returns {TFiber} fiber
     * @description 모든 자식을 삭제하고 새로운 hostText를 생성하는 함수이다.
     * @description 만약 첫번쨰 자식이 hostText인 경우에는 첫번쨰 자식을 제외하고 나머지 자식들을 다 삭제하고 첫번쨰 자식을 재사용한다.
     */
    const reconcileSingleTextNode = (returnFiber, currentFirstChild, textContent, expirationTime) => {
        //hostRoot파이버의 경우 key를 확인할 필요가 없음
        //현재 상황에서 재상황할 수 있는 경우는 첫번쨰 자식이 hostText인 경우이다.
        if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
            //첫번쨰 자식을 제외하고 나머지 자식들을 다 삭제한다.
            deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
            //첫번쨰 자식을 재사용한다.
            const existing = useFiber(currentFirstChild, textContent, expirationTime);
            existing.return = returnFiber;
            return existing;
        }
        //첫번쨰 자식이 hostText가 아닌경우
        //모든 자식을 삭제하고 새로운 hostText를 생성한다.
        deleteRemainingChildren(returnFiber, currentFirstChild);
        const created = createFiberFromText(textContent, returnFiber.mode, expirationTime);
        created.return = returnFiber;
        return created;
    };
    /**
     *
     * @param {TFiber} returnFiber
     * @param {TFiber|null} current
     * @param {string} textContent
     * @param {TExpirationTime} expirationTime
     * @returns {TFiber} fiber
     * @description 현재가 null이거나 현재의 태그가 HostText가 아니라면 새로운 textFiber를 생성하고 아니면 재사용한다.
     */
    const updateTextNode = (returnFiber, current, textContent, expirationTime) => {
        if (current === null || current.tag !== HostText) {
            //현재가 null이거나 현재의 태그가 HostText가 아니라면
            //새로운 textFiber를 생성한다.
            const created = createFiberFromText(textContent, returnFiber.mode, expirationTime);
            created.return = returnFiber;
            return created;
        } else {
            //현재가 null이 아니고 현재의 태그가 HostText인 경우
            //현재의 textNOde를 재사용한다.->textNode를 재사용하려면 textContent와 expirationTime을 갈아끼워줘야됨
            const existing = useFiber(current, textContent, expirationTime);
            existing.return = returnFiber;
            return existing;
        }
    };

    /**
     *
     * @param {TFiber} returnFiber
     * @param {TFiber|null} current
     * @param {import("../../type/TRfsType.js").TRfsElement} element
     * @param {TExpirationTime} expirationTime
     * @returns {TFiber} fiber
     * @description 현재 파이버를 업데이트해야됨 -> 재사용할 수 있는 경우 재사용(type일치)
     * @description 아닌경우 새로 만들어서 반환한다.
     */
    const updateElement = (returnFiber, current, element, expirationTime) => {
        if (current !== null && current.elementType === element.type) {
            //type이 일치해서 재사용할 수 있는 경우
            const existing = useFiber(current, element.props, expirationTime);
            existing.ref = element.ref;
            existing.return = returnFiber;
            return existing;
        } else {
            //새로 파이버 생성해서 반환
            const created = createFiberFromElement(element, returnFiber.mode, expirationTime);
            created.ref = element.ref;
            created.return = returnFiber;
            return created;
        }
    };
    /**
     *
     * @param {TFiber} returnFiber
     * @param {TFiber|null} current
     * @param {Iterable<any>} fragment
     * @param {TExpirationTime} expirationTime
     * @param {null|string} key
     */
    const updateFragment = (returnFiber, current, fragment, expirationTime, key) => {
        if (current === null || current.tag !== Fragment) {
            //현재가 null이거나 현재의 태그가 Fragment가 아니라면
            //새로운 fragmentFiber를 생성한다.
            const created = createFiberFromFragment(fragment, returnFiber.mode, expirationTime, key);
            created.return = returnFiber;
            return created;
        } else {
            //현재가 null이 아니고 현재의 태그가 Fragment인 경우
            //현재의 fragment를 재사용한다.->fragment를 재사용하려면 fragment와 expirationTime을 갈아끼워줘야됨
            const existing = useFiber(current, fragment, expirationTime);
            existing.return = returnFiber;
            return existing;
        }
    };

    /**
     *
     * @param {TFiber} returnFiber
     * @param {any} newChild
     * @param {TExpirationTime} expirationTime
     * @returns {TFiber|null} fiber
     * @description 새로운 자식을 생성하는 함수이다. 이때 새로운 자식이 스트링이거나 number이면 TextNode로 처리해야된다
     * @description 그리고 object인 경우는 상황에 맞게 알맞은 파이버를 생성하여 반환한다.
     * @description NOTE: newChild가 없는 경우는 null을 반환한다.
     */
    const createChild = (returnFiber, newChild, expirationTime) => {
        //text case
        if (typeof newChild === "string" || typeof newChild === "number") {
            //newChild가 스트링이거나 number이면 TextNode로 처리해야된다
            const created = createFiberFromText("" + newChild, returnFiber.mode, expirationTime);
            created.return = returnFiber;
            return created;
        }

        //objectcase
        if (typeof newChild === "object" && newChild !== null) {
            switch (newChild.$$typeof) {
                case RFS_ELEMENT_TYPE: {
                    const created = createFiberFromElement(newChild, returnFiber.mode, expirationTime);
                    created.ref = newChild.ref;
                    created.return = returnFiber;
                    return created;
                }
            }

            if (isArray(newChild) || getIteratorFn(newChild)) {
                const created = createFiberFromFragment(newChild, returnFiber.mode, expirationTime, null);
                created.return = returnFiber;
                return created;
            }

            console.error("Unknown child type in createChild. This is a bug in Rfs.");
            throw new Error("Unknown child type in createChild. This is a bug in Rfs.");
        }
        return null;
    };
    /**
     *
     * @param {TFiber} returnFiber
     * @param {TFiber|null} oldFiber
     * @param {any} newChild
     * @param {TExpirationTime} expirationTime
     * @returns {TFiber|null} fiber
     * @description 재조정을 새로운 자식배열을 기반으로 할때 수행하는 함수이다.
     * @description 좀더 정확히는 해당 알고리즘에서 phase1: 기존의 파이버리스트의 위치를 변화
     * @description 시키지 않고 업데이트할떄 해당 리스트의 slot을 업데이트하는 함수이다.
     * @description 일반적으로 재사용한 파이버나, 새로운 파이버를 생성하여 반환한다.
     * @description NOTE:null을 반환하는 경우는 key가 다르거나 newChild가 null인 경우이다.==>phase2로 넘어가야됨
     */
    const updateSlot = (returnFiber, oldFiber, newChild, expirationTime) => {
        //기존의 자식의 key를 세팅하는데 만약에 key가 oldFiber에 없다면 null을 세팅한다.
        const key = oldFiber !== null ? oldFiber.key : null;

        if (typeof newChild === "string" || typeof newChild === "number") {
            //newChild가 스트링이거나 null이면 TextNode로 처리해야된다
            //그런데 만약 이전의 자식의 key가 null이 아니라면 textNode같은 경우에는 key가 없음으로
            //이전의 자식을 업데이트할 수는 없다->자리가 바뀐상황 ->null
            if (key !== null) {
                return null;
            }
            return updateTextNode(returnFiber, oldFiber, "" + newChild, expirationTime);
        }

        if (typeof newChild === "object" && newChild !== null) {
            switch (newChild.$$typeof) {
                case RFS_ELEMENT_TYPE: {
                    //자식의 key와 oldFiber의 key가 같다면 update가능하다.
                    if (newChild.key === key) {
                        //NOTE: <>...<>=><Rfs.Fragment>...</Rfs.Fragment>를 의미함
                        //NOTE: 이는 Rfs.createElement(Rfs.Fragment, null, ...children)을 의미함
                        //NOTE: 이는 rfsElement의 type에 RFS_FRAGMENT_TYPE을 넣어주는것을 의미함
                        //두가지 경우 fragment와 element로 나뉜다.
                        if (newChild.type === RFS_FRAGMENT_TYPE) {
                            return updateFragment(returnFiber, oldFiber, newChild.props.children, expirationTime, key);
                        }
                        return updateElement(returnFiber, oldFiber, newChild, expirationTime);
                    } else {
                        //key가 다르다면 자식의 위치가 바꼈다라는 의미 임으로 null을 반환한다.
                        return null;
                    }
                }
            }

            if (isArray(newChild) || getIteratorFn(newChild)) {
                //배열이나 이터레이터인 경우는 key를 가질수가 없는 경우인데
                //이전 친구가 키를 가졌으면 자리가 바뀐것이다.->null
                if (key !== null) {
                    return null;
                }

                //내부적으로는 배열를 모아두는것을 fragment로 처리함
                return updateFragment(returnFiber, oldFiber, newChild, expirationTime, null);
            }

            console.error("Unknown child type in updateSlot. This is a bug in Rfs.");
            throw new Error("Unknown child type in updateSlot. This is a bug in Rfs.");
        }

        return null;
    };

    /**
     *
     * @param {Map<string|number, TFiber>} existingChildren
     * @param {TFiber} returnFiber
     * @param {number} newIdx
     * @param {any} newChild
     * @param {TExpirationTime} expirationTime
     * @returns {TFiber|null} fiber
     */
    const updateFromMap = (existingChildren, returnFiber, newIdx, newChild, expirationTime) => {
        //NOTE: 기본적으로 맵을 조회할떄 키로 조회하거나, 현재 자식의 자리로 조회하는데 이는
        //NOTE: 키가 없는 경우 자리가 파이버의 신원을 의미한다라는 것을 의미한디.
        if (typeof newChild === "string" || typeof newChild === "number") {
            //newChild가 스트링이거나 number이면 TextNode로 처리해야된다

            //TextNode이면 키가 존재하지 않고, map에 index로 넣었을것이니 index로 찾아서 업데이트한다.
            //이 말은 키가 없는 경우는 자리가 파이버의 신원을 의미한다라는 것을 의미한디.
            const matchedFiber = existingChildren.get(newIdx) || null;
            return updateTextNode(returnFiber, matchedFiber, "" + newChild, expirationTime);
        }

        if (typeof newChild === "object" && newChild !== null) {
            switch (newChild.$$typeof) {
                case RFS_ELEMENT_TYPE: {
                    const matchedFiber = existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;
                    if (newChild.type === RFS_FRAGMENT_TYPE) {
                        return updateFragment(
                            returnFiber,
                            matchedFiber,
                            newChild.props.children,
                            expirationTime,
                            newChild.key
                        );
                    }
                    return updateElement(returnFiber, matchedFiber, newChild, expirationTime);
                }
            }

            if (isArray(newChild) || getIteratorFn(newChild)) {
                //array나 이터레이터는 키가 존재할 수없음->자리가 파이버의 신원을 의미한다.
                const matchedFiber = existingChildren.get(newIdx) || null;
                return updateFragment(returnFiber, matchedFiber, newChild, expirationTime, null);
            }

            console.error("Unknown child type in updateFromMap. This is a bug in Rfs.");
            throw new Error("Unknown child type in updateFromMap. This is a bug in Rfs.");
        }

        return null;
    };
    /**
     *
     * @param {TFiber} returnFiber
     * @param {TFiber} currentFirstChild
     * @description currentFirstChild로부터 마지막 형제까지 map에 다가 밀어넣고 맵을 반환하는 함수이다.
     * @returns {Map<string | number, TFiber>} map
     */
    const mapRemainingChildren = (returnFiber, currentFirstChild) => {
        // 나머지 자식을 임시 맵에 추가하여 다음, 키로 빠르게 찾을 수 있도록 합니다.
        const existingChildren = new Map();

        let existingChild = currentFirstChild;
        while (existingChild !== null) {
            // NOTE: map에 키가 되는 것은 해당 child가 key를 가지고 있으면 map == child.key
            // NOTE: key를 가지고 있지 않으면 map == child.index가 됩니다.
            // NOTE: 이뜻은 찾을떄도 key가 없는 경우에 해당해서는 같은 자리에 있어야 같다라는 것을 의미합니다.
            if (existingChild.key !== null) {
                existingChildren.set(existingChild.key, existingChild);
            } else {
                existingChildren.set(existingChild.index, existingChild);
            }
            existingChild = existingChild.sibling;
        }
        return existingChildren;
    };

    /**
     *
     * @param {TFiber} returnFiber
     * @param {TFiber|null} currentFirstChild
     * @param {Array<any>} newChildren
     * @param {TExpirationTime} expirationTime
     * @returns {TFiber|null} fiber
     * @description 기본적으로 현재의 파이버 리스트를 -> newChildren으로 재조정하는 함수이다.
     * @description 여기엔 알고리즘이 작동하는데 이 알고리즘은 양쪽 끝에서 검색하여 최적화할 수 없습니다.
     * @description 파이버에 백포인터가 없기 때문입니다.
     * @description 기본적인 알고리즘은 list(파이버)와 array를 비교하여 위치를 결정하려먼 o(n^2)인데
     * @description 최적화를 수행하여 진행한다. 일단 list의 위치가 수정이 안되어있다 가정하고 o(n)방식으로
     * @description 전방으로 진행하고, 만약 key나 그런것이 달라서 현재 list의(파이버)의 배치가 달라져야 하는것이
     * @description 존재하면 그떄부터 map을 이용한 모드로 변경되어 해당 위치부터 끝까지를 map에 넣고
     * @description map을 통해 list의 배치를 바꾸고, 새로운 array에 맞게 재조정하는 방식으로 수행된다.
     */
    const reconcileChildrenArray = (returnFiber, currentFirstChild, newChildren, expirationTime) => {
        // 양단 최적화를 사용하더라도 변경 사항이 거의 없는 경우
        // 변경 사항이 거의 없는 케이스에 대해서, map을 통한 비교보다 브루투포스 비교가 더 효율적입니다.
        //해당 알고리즘은 두단계의 페이즈로 진행되는데 일단 첫번쨰로 전방모드로 쭉 진행하다가 맵을 사용할 필요가
        //맵을 이용하게 된다 ->맵을 사용할 필요가 있는경우: current친구의 위치가 바뀐경우
        // 이것은 반전을 처리하지 못하며 두 개의 끝이 있는
        // 검색만큼 잘 처리하지 못하지만 이는 드문 경우입니다. 게다가, 이터러블에 대한 양단 최적화를
        // 이터러블에서 작동하려면 전체 세트를 복사해야 합니다.
        //첫 페이즈에서는 두번쨰(맵을통한 검색)을 해야되기 전까지 삽입/배치을 순회할떄마다 실행합니다.

        //첫번쨰 자식을 리턴해야됨으로 이것을 기억하는 변수가 존재해야함
        let resultingFirstChild = null;
        //첫번쨰 자식 세팅하기 위한 변수+ 새로운 파이버와의 연결을 위한 변수
        let previousNewFiber = null;

        //이터레이팅 하면서 보고 있던 이전 파이버를 가르키고 있는 변수
        let oldFiber = currentFirstChild;

        //마지막으로 배치를 옮기지 않고 가만히 있는 파이버의 인덱스를 가르키는 변수
        //뒤에서 설명하겠지만 파이버는 리스트고, 해당 배치의 사이드 이펙트를 키고 끔은
        //리스트 기반 배치를 통해 이뤄지는데 그것과 관련있다.
        const lastPlacedIndex = 0;

        //새로운 children의 인덱스를 가르키는 변수
        let newIdx = 0;

        //다음 oldFiber로 이터레이팅 시킬 참조를 가르키는 변수
        let nextOldFiber = null;

        //phase 1: 이전에 있던 친구들의 위치가 다 일정하다고 가정하고 한번 쭉 돌면서 최적화하는 로직
        //새로운 차일드의 배열까지 순회
        for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
            //NOTE: [NULL,NULL,a]와 같은 경우 currentFirstChild가 a로 시작하는데 파이버 내부에는 null이라는것이 없어서
            //NOTE: 판별이 불가-> 여기서 추가로 판별하고 처리해야됨
            //이떄 2라서 이 index가 newIdx보다 클 수 있음-> NOTE B를 참고하면 알 수 있음
            //NOTE A: oldFiber.index > newIdx라면 앞서 주석과 같이 앞에 있는 친구들이 null인 경우인데
            //NOTE: 파이버구조에서는 확인할 수 없는 상황이다, 그런데 이걸 확인을 하게 해야되기 때문에
            //NOTE: 인위적으로 루프구조에서 oldFiber가 null이라는 의미를 넣어준다
            //다음 이터레이팅할 nextOldFiber를 설정한다. 여기서 고려해야될것은
            //위에 명시한 주석관련된 부분이다.
            if (oldFiber.index > newIdx) {
                nextOldFiber = oldFiber;
                oldFiber = null;
            } else {
                nextOldFiber = oldFiber.sibling;
            }
            //NOTE:oldFiber가 null인경우에는 새로운걸 추가해야되는 경우인거고 이는 자리를 안바뀐 상황으로
            //NOTE:여겨짐->-> oldFiber가 null인 상황에서
            //NOTE: 새로운 자식이 키가 없는경우, update~를 부르는데 여기서 current가 null이면
            //NOTE: 바로 새로운 파이버를 반환함
            //NOTE: slot의 의미는 배열의 원소를 의미
            //oldFiber를 재사용할 수 있으면 재사용하고, type이 다르면 새로운 파이버를 생성
            //fiber말고도 null반환할 수 있는데 이떄는 key가 다르거나 newChild가 null
            //key가 달라졌다면 현재 current배열내에서 위치가 달라진것임으로 해당 phase를 종료해야함
            //null인 경우도 마찬가지로 종료해야함
            const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx], expirationTime);
            if (newFiber === null) {
                //newFiber가 null인경우는 key가 달르거나 newChild가 null인 경우인데
                //이떄는 해당 phase를 종료해야함
                // 이것은 널 자식처럼 빈 슬롯에서 중단됩니다. 이는
                // 느린 경로를 항상 트리거하기 때문에 불행한 일입니다.
                // 미스인지 널인지 알려주는 더 나은 방법이 필요합니다
                // 부울, 정의되지 않음 등을 // 전달하는 더 나은 방법이 필요합니다. --> 이 말은
                // [a,b,c] -> [null, null, null]같은 경우는 그냥 사실 한번 순회 하면서 처리할 수 있는데 위치가 바뀐
                // 경우가 아니니까 그런데 어쩔수 없이 슬롯의 구조상 이런식으로 처리해야됨
                //key가 달라진 경우뿐만아니라 그냥 newChild가 null인 경우에도 null을 반환해버리는데 이게 구분을
                //안해놔서 이런케이스에 대해서 느려지는데 나중에..
                //NOTE:앞서 NOTE A와 관련 있는 부분으로 mapPhase로 가야되는데 NOTE A에서 순회를 위해
                //NOTE:수정한 부분을 돌려놓아야됨
                if (oldFiber === null) {
                    oldFiber = nextOldFiber;
                }
                break;
            }
            if (shouldTrackSideEffects) {
                //이전에 파이버가 있었고,
                // newFIber.alternate===null->useFiber(createWorkInprogress)에의해서 생긴경우는 null이 아니여야함
                //재사용이 아닌경우에는 이전에 있던 친구를 삭제해야함
                if (oldFiber && newFiber.alternate === null) {
                    //oldFiber지워야함
                    deleteChild(returnFiber, oldFiber);
                }
            }

            //새로운 파이버를 위치에 맞게 넣어주고 배치 관련 sideEffect를 가해줘야됨
            //그리고 마지막으로 배치가 바뀌지 않은 파이버의 인덱스를 가르키는 변수를 업데이트해야됨
            //NOTE: place-배치란 list에서의 배치를 의미함-> 이것은 array에서 index를 바꾸는 것이
            //NOTE:아닌 인접한것을 기준을 의미함 (fiber 자체가 list구조이므로)
            //NOTE: placeChild의 알고리즘은 placeChild를 참고하면 
          
            lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

            //딱 한번만 resultFirstFiber를 세팅해야됨
            if (previousNewFiber === null) {
                resultingFirstChild = newFiber;
            } else {
                //이전 파이버를 새로운파이버와 연결해줘야됨
                previousNewFiber.sibling = newFiber;
            }

            //순회
            previousNewFiber = newFiber;
            oldFiber = nextOldFiber;
        }

        //NewIdx가 newChildren.length에 도달했다라는것은 다 돌았다라는 것이고 새로운 자식배열을 다 처리했다라는것 ->
        //old부분은 남아 있는거니까 거기부터 지워주고 리턴
        if (newIdx === newChildren.length) {
            deleteRemainingChildren(returnFiber, oldFiber);
            return resultingFirstChild;
        }

        //oldFiber==null인경우는 기존 파이버 리스트를 다 처리한거고, 새로운 자식배열만 남았는데
        //단순히 삽입하면됨으로 삽입하고 리턴
        if (oldFiber === null) {
            for (; newIdx < newChildren.length; newIdx++) {
                //NOTE B: 여기에 의해서 만약 newChild가 null인 경우 건너띄어져서 파이버리스트엔 안들어가있음
                const newFiber = createChild(returnFiber, newChildren[newIdx], expirationTime);
                if (newFiber === null) {
                    continue;
                }
                lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
                if (previousNewFiber === null) {
                    resultingFirstChild = newFiber;
                } else {
                    previousNewFiber.sibling = newFiber;
                }
                previousNewFiber = newFiber;
            }
            return resultingFirstChild;
        }

        //phase 2:  이제 map을 이용한 phase를 시작. 처리하지 않은 모든 것을 map에 넣고 이터레이팅을함
        //처리하지 않은것을 map넣음
        const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

        //map을 통한 순회를 통해 자리를 결정
        for (; newIdx < newChildren.length; newIdx++) {
            //맵을 통해 자리를 결정하고, 앞서 updateSlot과 마찬가지로 재사용할 수 있으면 재사용하고 없으면
            //새로운 파이버를 생성 여기서 재사용은 map을 통해 결정된 파이버를 재사용하는것을 의미한다.
            const newFiber = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx], expirationTime);
            if (newFiber !== null) {
                if (shouldTrackSideEffects) {
                    //재사용이 아닌 경우에는 이전에 있던 친구를 삭제해야함
                    if (newFiber.alternate !== null) {
                        existingChildren.delete(newFiber.key === null ? newIdx : newFiber.key);
                    }
                }

                //새롭게 등장한 친구들을 배치를 해준다
                lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
                if (previousNewFiber === null) {
                    resultingFirstChild = newFiber;
                } else {
                    previousNewFiber.sibling = newFiber;
                }
                previousNewFiber = newFiber;
            }
            //fiber가 null인경우 계속 진행
        }

        if (shouldTrackSideEffects) {
            //남아있는것들을 삭제해야됨
            existingChildren.forEach((child) => deleteChild(returnFiber, child));
        }

        return resultingFirstChild;
    };

    /**
     *
     * @param {TFiber} returnFiber
     * @param {TFiber|null} currentFirstChild
     * @param {Iterable<any>} newChildrenIterable
     * @param {TExpirationTime} expirationTime
     * @description 이 함수는 reconcileChildrenArray의 이터러블 버전 함수입니다.
     * @description 해당 로직을 더 자세히 이해하려면 reconcileChildrenArray를 보면 됩니다.
     * @description 해당 로직을 단순히 Iterable에서 수행할 뿐입니다.
     */
    const reconcileChildrenIterator = (returnFiber, currentFirstChild, newChildrenIterable, expirationTime) => {
        //이터러블을 배열로 만들어서 reconcileChildrenArray를 호출합니다.

        const iteratorFn = getIteratorFn(newChildrenIterable);
        if (typeof iteratorFn !== "function") {
            console.error("An object is not an iterable. In reconcileChildrenIterator");
            throw new Error("An object is not an iterable. In reconcileChildrenIterator");
        }

        const newChilden = iteratorFn.call(newChildrenIterable);
        if (newChilden === null) {
            console.error("an iterable object provided no iterator. In reconcileChildrenIterator");
            throw new Error("an iterable object provided no iterator. In reconcileChildrenIterator");
        }

        let resultFirstChild = null;
        let previousNewFiber = null;

        let oldFiber = currentFirstChild;
        let lastPlacedIndex = 0;
        let newIdx = 0;
        let nextOldFiber = null;

        let step = newChilden.next();
        for (; oldFiber !== null && !step.done; newIdx++, step = newChilden.next()) {
            if (oldFiber.index > newIdx) {
                nextOldFiber = oldFiber;
                oldFiber = null;
            } else {
                nextOldFiber = oldFiber.sibling;
            }
            const newFiber = updateSlot(returnFiber, oldFiber, step.value, expirationTime);
            if (newFiber === null) {
                if (oldFiber === null) {
                    oldFiber = nextOldFiber;
                }
                break;
            }
            if (shouldTrackSideEffects) {
                if (oldFiber && newFiber.alternate === null) {
                    deleteChild(returnFiber, oldFiber);
                }
            }
            lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
            if (previousNewFiber === null) {
                resultFirstChild = newFiber;
            } else {
                previousNewFiber.sibling = newFiber;
            }
            previousNewFiber = newFiber;
            oldFiber = nextOldFiber;
        }

        if (step.done) {
            deleteRemainingChildren(returnFiber, oldFiber);
            return resultFirstChild;
        }

        if (oldFiber === null) {
            for (; !step.done; newIdx++, step = newChilden.next()) {
                const newFiber = createChild(returnFiber, step.value, expirationTime);
                if (newFiber === null) {
                    continue;
                }
                lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
                if (previousNewFiber === null) {
                    resultFirstChild = newFiber;
                } else {
                    previousNewFiber.sibling = newFiber;
                }
                previousNewFiber = newFiber;
            }
            return resultFirstChild;
        }

        const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

        for (; !step.done; newIdx++, step = newChilden.next()) {
            const newFiber = updateFromMap(existingChildren, returnFiber, newIdx, step.value, expirationTime);
            if (newFiber !== null) {
                if (shouldTrackSideEffects) {
                    if (newFiber.alternate !== null) {
                        existingChildren.delete(newFiber.key === null ? newIdx : newFiber.key);
                    }
                }
                lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
                if (previousNewFiber === null) {
                    resultFirstChild = newFiber;
                } else {
                    previousNewFiber.sibling = newFiber;
                }
                previousNewFiber = newFiber;
            }
        }

        if (shouldTrackSideEffects) {
            existingChildren.forEach((child) => deleteChild(returnFiber, child));
        }

        return resultFirstChild;
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

                    existing.ref = element.ref;
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

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
