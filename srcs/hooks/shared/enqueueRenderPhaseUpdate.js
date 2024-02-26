/**
 *
 * @param {THookUpdateQueue} queue
 * @param {THookUpdate} update
 * @description - This function enqueues an update.
 * hook.queue에 update를 추가합니다.
 * 만약 어떤 update도 없다면, pending에 update를 추가하고, circular list를 만듭니다.
 * pending이 존재한다면 update를 enqueue하고 현재 queue.pending을 해당 update로 변경합니다.
 * 즉, pending은 circular list의 마지막 update를 가리키게 됩니다.
 * // TODO: move to this function to a separate file for shared use
 */
const enqueueRenderPhaseUpdate = (queue, update) => {
    const last = queue.last;
    if (last === null) {
        // This is the first update. Create a circular list.
        update.next = update;
    } else {
        const first = last.next;
        if (first !== null) {
            update.next = first;
        }
        last.next = update;
    }
    queue.last = update;
};

export default enqueueRenderPhaseUpdate;
