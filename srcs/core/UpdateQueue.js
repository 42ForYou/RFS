/**
 * @file UpdateQueue
 * @description
 * UpdateQueue는 우선 순위가 지정된 업데이트들의 연결 리스트입니다. React 내부에서, UpdateQueue는 화면에 보이는 상태를 나타내는 현재 큐(current queue)와, 커밋되기 전에 비동기적으로 변형되고 처리될 수 있는 작업 중 큐(work-in-progress queue)의 쌍으로 존재합니다. 이는 이중 버퍼링 형태의 일종으로, 작업 중인 렌더링이 완료되기 전에 폐기될 경우, 현재 큐를 복제하여 새로운 작업 중 큐를 생성합니다.

두 큐는 지속적인 단일 연결 리스트 구조를 공유합니다. 업데이트를 스케줄링하기 위해, 우리는 이를 두 큐의 끝에 추가합니다. 각 큐는 아직 처리되지 않은 지속적 리스트의 첫 번째 업데이트를 가리키는 포인터를 유지합니다. 작업 중 큐의 포인터는 항상 현재 큐보다 같거나 더 큰 위치에 있으며, 우리는 항상 그 큐에서 작업합니다. 현재 큐의 포인터는 커밋 단계에서만 업데이트되며, 이때 작업 중인 큐로 교체됩니다.

예를 들어, 현재 포인터가 A-B-C-D-E-F를 가리키고, 작업 중 포인터가 D-E-F를 가리키는 경우, 작업 중 큐는 현재 큐보다 더 많은 업데이트를 처리한 것입니다.

업데이트를 두 큐에 추가하는 이유는 그렇지 않으면 일부 업데이트를 영구적으로 놓칠 수 있기 때문입니다. 예를 들어, 작업 중 큐에만 업데이트를 추가하는 경우, 현재에서 복제하여 작업 중 렌더링이 재시작될 때 일부 업데이트가 손실될 수 있습니다. 마찬가지로, 현재 큐에만 업데이트를 추가하는 경우, 이미 진행 중인 큐가 커밋되어 현재 큐와 교체될 때 업데이트가 손실됩니다. 그러나 두 큐에 추가함으로써, 우리는 업데이트가 다음 작업 중 큐의 일부가 될 것임을 보장합니다.

우선 순위:
업데이트는 우선 순위에 따라 정렬되지 않고 삽입 순으로 배열됩니다. 렌더링 단계에서 업데이트 큐를 처리할 때, 충분한 우선 순위를 가진 업데이트만 결과에 포함됩니다. 우선 순위가 충분하지 않아 건너뛰는 경우, 해당 업데이트는 나중에 더 낮은 우선 순위의 렌더링 동안 처리될 수 있도록 큐에 남아 있습니다. 중요하게, 건너뛴 업데이트 이후의 모든 업데이트도 우선 순위에 관계없이 큐에 남아 있습니다. 이는 높은 우선 순위의 업데이트가 때로는 두 개의 별도 우선 순위에서 두 번 처리될 수 있음을 의미합니다. 또한, 큐에 적용되는 첫 번째 업데이트 이전의 상태를 나타내는 기본 상태도 유지됩니다.

예를 들어, 기본 상태가 ''이고 다음과 같은 업데이트 큐가 주어진 경우

A1 - B2 - C1 - D2

여기서 숫자는 우선 순위를 나타내며, 업데이트는 이전 상태에 문자를 추가하여 적용됩니다. React는 이 업데이트를 두 개의 별도 렌더링으로 처리합니다, 각각 고유한 우선 순위 레벨당 하나씩:

첫 번째 렌더링, 우선 순위 1에서:

기본 상태: ''
업데이트: [A1, C1]
결과 상태: 'AC'
두 번째 렌더링, 우선 순위 2에서:

기본 상태: 'A' (B2가 건너뛰어진 탓에 C1은 포함되지 않음)
업데이트: [B2, C1, D2] (C1이 B2 위에 재배치됨)
결과 상태: 'ABCD'
업데이트가 삽입 순으로 처리되고, 우선 순위가 높은 업데이트가 선행 업데이트가 건너뛰어질 때 재기반됨으로써, 최종 결과는 우선 순위에 관계없이 결정적입니다. 중간 상태는 시스템 자원에 따라 다를 수 있지만, 최종 상태는 항상 동일합니다.
 */
import { UpdateState } from "../type/TUpdateTag";

export class updateState {
    /**
     *
     * @see {TUpdateState} updateState @see :파일경로 srcs/type/TUpdateQueue.js
     */
    constructor(expirationTime) {
        this.expirationTime = expirationTime;
        this.tag = UpdateState;
        this.payload = null;
        this.callback = null;
        this.next = null;
        this.nextEffect = null;
    }
}

export class updateQueueState {
    /**
     * @param {any} baseState
     * @return {TUpdateQueueState} updateQueue @see :파일경로 srcs/type/TUpdateQueue.js
     */
    constructor(baseState) {
        this.baseState = baseState;
        this.firstUpdate = null;
        this.lastUpdate = null;
        this.firstCapturedUpdate = null;
        this.lastCapturedUpdate = null;
        this.firstEffect = null;
        this.lastEffect = null;
        this.firstCapturedEffect = null;
        this.lastCapturedEffect = null;
    }
}

/**
 *
 * @param {TExpirationTime} expirationTime @see :파일경로 srcs/type/TExpirationTime.js
 * @returns {TUpdateState} updateState @see :파일경로 srcs/type/TUpdateQueue.js
 * @description 파이버에 일반적인 상황 (현 상황에서는 호스트루트)의 업데이트 큐에 넣을 업데이트 객체를 생성합니다.
 */
export const createUpdate = (expirationTime) => {
    const update = new updateState(expirationTime);
    return update;
};

/**
 * @param {any} baseState
 * @returns {TUpdateQueueState} updateQueue @see :파일경로 srcs/type/TUpdateQueue.js
 * @description 주어진 baseState로 새로운 업데이트 큐를 생성합니다.
 * @description 이 BaseState는 이전 상태-다시 업데이트를 시작해야되는 상태를 나타냅니다
 * @description 자세한 설명은 @see :파일경로 srcs/type/TUpdateQueue.js
 */

export const createUpdateQueue = (baseState) => {
    return new updateQueueState(baseState);
};

/**
 * @param {TUpdateQueueState} queue @see :파일경로 srcs/type/TUpdateQueue.js
 * @returns {TUpdateQueueState} updateState @see :파일경로 srcs/type/TUpdateQueue.js
 * @description 업데이트큐를 복사합니다. 이는 현재 큐를 복제하여 작업 중 큐를 생성할 때 사용됩니다.
 * @description 여기서 복제란, circular list, base State를 복사하는 것을 의미합니다.
 *
 */
export const cloneUpdateQueue = (queue) => {
    const queueClone = new updateQueueState(queue.baseState);
    queueClone.firstUpdate = queue.firstUpdate;
    queueClone.lastUpdate = queue.lastUpdate;
    return queueClone;
};

/**
 *
 * @param {TUpdateQueueState} queue @see :파일경로 srcs/type/TUpdateQueue.js
 * @param {TUpdateState} update @see :파일경로 srcs/type/TUpdateQueue.js
 * @description 큐에 업데이트를 추가합니다. 이는 큐의 끝에 업데이트를 추가하는 것을 의미합니다.
 * @description 항상 큐는 circular list로 유지됩니다.
 */
export const appendUpdateToQueue = (queue, update) => {
    if (queue.lastUpdate === null) {
        queue.firstUpdate = queue.lastUpdate = update;
    } else {
        queue.lastUpdate.next = update;
        queue.lastUpdate = update;
    }
};

export const enqueueUpdate = (fiber, update) => {
    const alternate = fiber.alternate;
    let currentQueue;
    let alternateQueue;

    //초기 Queue 관리 로직 시작
    if (alternate === null) {
        //일반적으로 마운트 되는 상황 --> alternate가 없는 상황
        currentQueue = fiber.updateQueue;
        alternateQueue = null;
        if (currentQueue === null) {
            //현재 큐도 없는 상황에서는 fiber의 상태를 baseState로 설정하고 큐를 생성한다.
            currentQueue = fiber.updateQueue = createUpdateQueue(fiber.memoizedState);
        }
    } else {
        // 일반적으로 한번 렌더 한 상황이라면 커밋되고 스왑되어 currentQueue는 null이고 alternateQueue는 존재한다.
        // 그럼 이젠 걸 alternateQueue를 복제하여 currentQueue를 만들어야한다.
        // 이는 양방향으로 불릴 수 있기 때문에 양방향으로 그러한 코드가 존재해야한다 이제 그러한 코드부분을
        // A라고 한다
        // 둘다 없는 경우 -> 둘다 생성 //B
        currentQueue = fiber.updateQueue;
        alternateQueue = alternate.updateQueue;
        if (currentQueue === null) {
            if (alternateQueue === null) {
                //B
                currentQueue = fiber.updateQueue = createUpdateQueue(fiber.memoizedState);
                alternateQueue = alternate.updateQueue = createUpdateQueue(alternate.memoizedState);
            } else {
                //A
                currentQueue = fiber.updateQueue = cloneUpdateQueue(alternateQueue);
            }
        } else {
            if (alternateQueue === null) {
                //A
                alternateQueue = alternate.updateQueue = cloneUpdateQueue(currentQueue);
            }
        }
    }
    //초기 Queue 관리 로직 끝

    //enqueue에 핵심은 파일 초반에 설명하다 시피 updateQueue에는 파이버와 같이
    //동시에 update가 추가 되어야한다라는 것이다. 이에 되한 내용은 파일 맨위 주석에 있다.
    if (alternateQueue === null || currentQueue === alternateQueue) {
        //alternateQueue가 없거나 둘이 같은 경우에는 currentQueue에 update를 추가한다.
        appendUpdateToQueue(currentQueue, update);
    } else {
        if (alternateQueue.lastUpdate === null || currentQueue.lastUpdate === null) {
            //둘중 하나라도 비어 있는 경우 persistent structure가 깨져있는 경우 임으로 둘 모두에 추가한다.
            appendUpdateToQueue(currentQueue, update);
            appendUpdateToQueue(alternateQueue, update);
        } else {
            //공유 하고 있는 상태 임으로 둘중 하나에만 추가한다.
            appendUpdateToQueue(currentQueue, update);
            //둘중 하나만 추가하면 되지만 alternateQueue에 lastupdate
            //가 가르키고 있는 update는 변경되어야 한다.
            alternateQueue.lastUpdate = update;
        }
    }
};
