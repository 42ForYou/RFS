/**
 * @file schedulerMinHeap.js
 * @description 스케쥴러는 기본적으로 우선순위큐를 minHeap으로 구현하고 있다.
 * @description 그에 대한 구현이다.
 */
//https://en.wikipedia.org/wiki/Heap_(data_structure) 기반구현

export const getParentIndex = (i) => Math.floor((i - 1) / 2);
export const getLeftChildIndex = (i) => i * 2 + 1;
export const getRightChildIndex = (i) => i * 2 + 2;

/**
 * @description 첫번쨰에서 두번쨰를 뺸값을 반환하는데 같은경우 태스크의 차를 반환한다.
 * @description 현재 구조에서는 id가 작은것이 먼저 실행되어야 하기 때문이다.
 */
export const compare = (a, b) => {
    const diff = a.sortIndex - b.sortIndex;
    return diff !== 0 ? diff : a.id - b.id;
};

/**
 * @param {import("../type/THeapType").THeapType} heap
 * @param {import("../type/THeapType").THeapNode} node
 * @param {number} i
 * @description minHeap에 의 기본 구조인 부모 보다 자식이 커야한다라는 조건을 만족하도록 하는 함수이다.
 */
export const siftUp = (heap, node, i) => {
    let index = i;
    while (true) {
        const parentIndex = getParentIndex(index);
        const parent = heap[parentIndex];
        if (parent !== undefined && compare(parent, node) > 0) {
            //스왑하고 한칸 위로 전진해서 반복한다.
            [heap[parentIndex], heap[index]] = [node, parent];
            index = parentIndex;
        } else {
            return;
        }
    }
};

/**
 * @param {import("../type/THeapType").THeapType} heap
 * @param {import("../type/THeapType").THeapNode} node
 * @param {number} i
 * @description minHeap에 의 기본 구조인 부모 보다 자식이 커야한다라는 조건을 만족하도록 하는 함수이다.
 * @description 내려가면서 현재 자신의 자리에 적합한 자식을 고르고 스왑하면서 내려가고 적합한 자리에 도달하면 종료한다.
 */

const siftDown = (heap, node, i) => {
    let index = i;
    const length = heap.length;

    const compareNodes = (childIndex, node) => heap[childIndex] !== undefined && compare(heap[childIndex], node) < 0;

    while (index < length) {
        const leftIndex = getLeftChildIndex(index);
        const rightIndex = getRightChildIndex(index);
        let smallestIndex = index;

        if (compareNodes(leftIndex, node)) {
            smallestIndex = leftIndex;
        }

        if (compareNodes(rightIndex, heap[smallestIndex])) {
            smallestIndex = rightIndex;
        }

        if (smallestIndex !== index) {
            [heap[index], heap[smallestIndex]] = [heap[smallestIndex], node]; // Swap nodes
            index = smallestIndex;
        } else {
            break; // Node is in correct position
        }
    }
};
/**
 *
 * @param {import("../type/THeapType").THeapType} heap
 * @param {import("../type/THeapType").THeapNode} node
 * @description minHeap에 node를 추가하고 siftUp을 호출한다.
 */
export const push = (heap, node) => {
    const index = heap.length;
    heap.push(node);
    siftUp(heap, node, index);
};

/**
 * @param {import("../type/THeapType").THeapType} heap
 * @returns {import("../type/THeapType").THeapNode | null} heap의 첫번째 값을 반환한다.
 * @description minHeap의 첫번째 값을 반환한다.
 */
export const pop = (heap) => {
    const first = heap[0];
    if (first !== undefined) {
        const last = heap.pop();
        //힙의 마지막값을 첫번째로 옮기고 siftDown을 호출한다.
        //만약 마지막값이 첫번쨰와 같다면 마지막 노드임으로 재조정할 필요가 없다.
        if (last !== first) {
            heap[0] = last;
            siftDown(heap, last, 0);
        }
        return first;
    } else {
        return null;
    }
};
/**
 * @param {import("../type/THeapType").THeapType} heap
 * @returns {import("../type/THeapType").THeapNode | null} heap의 첫번째 값을 반환한다.
 * @description minHeap의 첫번째 값을 반환한다.
 */
export const peek = (heap) => {
    const first = heap[0];
    return first === undefined ? null : first;
};
