import { createHostRootFiber } from "./fiber.js";

/**
    @description FiberRoot는 해당 Fiber에 대해서 관리를 위한 그 스코프내의 전역관리 공간이라고 생각할 수 있습니다. 
    그 전역관리 공간의 설정은 해당 Class에 의해 관리됩니다
 */
const FiberRootNode = class {
    /**
     * @param {containerinfo} container -> host Instance를 인자로 받는다-> Element|Document|DocumentFragment
     * @param {tag} RootTag -> Refer to const.js
     * @description 생성자
     * @property {tag} tag -> RootTag를 저장합니다.
     * @property {containerinfo} container를 저장 -> Element|Document|DocumentFragment
     * @property {pendingChildren} pendingChildren -> 아직 처리되지 않은 컴포넌트 임시저장소
     * @property {current} current -> 현재 활성화된 Fiber Tree에대한 참조
     * @property {finishedWork} finishedWork -> 렌더가 완료된 Fiber Nodes
     * @property {cancelPendingCommit} cancelPendingCommit -> 비동기적 요청의 순서를 보장하기 위한 정보
     * @property {context} context -> 현재 context value
     * @property {pendingContext} pendingContext -> 바뀔거지만 아직 확정되진 않은 context value-> 나중에 context랑 교환
     * @property {next} next -> scheduling에서 다음 작업에 대한 참조
     * @property {callbackNode} callbackNode -> 비동기 작업을 위한 callbackFunction의 참조
     */
    constructor(containerInfo, tag) {
        this.tag = tag;
        this.containerInfo = containerInfo;
        this.pendingChildren = null;
        this.current = null;
        this.finishedWork = null;
        this.cancelPendingCommit = null;
        this.context = null;
        this.pendingContext = null;
        this.next = null;
        this.callbackNode = null;
    }
};

/**
 * @param {tag} RootTag -> Refer to const.js
 * @param {FiberRoot} FiberRoot -> FiberRoot
 * @description    fiberRoot에 대응되는 HostRootFiber를 생성시키고
    // FiberRoot에 연결하며
    // 그 Fiber에 대해서 Root의 Container를 연결시켜줍니다.
    @description Note!! side effect를 가지고 있음으로 단순히 추상적 의미로만 사용하시길 바랍니다. 재사용불가능합니다
    @return {Fiber} -> hostRootFiber를 반환합니다.
    */
const bindFiberRootToHostRootFiber = (tag, FiberRoot) => {
    const FiberBoundedRoot = createHostRootFiber(tag);
    FiberRoot.current = FiberBoundedRoot;
    FiberBoundedRoot.stateNode = FiberRoot;
    return FiberBoundedRoot;
};
/**
 * @param {containerinfo} container -> host Instance를 인자로 받는다-> Element|Document|DocumentFragment
 * @param {tag} RootTag -> Refer to const.js
 * @description FiberRoot는 해당 Fiber에 대해서 관리를 위한 그 스코프내의 전역관리 공간이라고 생각할 수 있습니다. 그 전역관리 공간의 설정은 해당 Class
 * 에 의해서 생성되며 그렇게 생성된 객체에 실제 대응될 Fiber를 생성하여 연결을 시켜줍니다. 그리고 conatiner를 생성된 파이버와 연결시켜줍니다.
 * 이후에 memoizedState를 초기화 시켜주고, updateQueue를 초기화 시켜줍니다.-> Todo: implement this functions
 * @returns {fiberRootNode} -> fiberRoot에 대해 globalScope로 역할을 하는 객체를 반환합니다.
 */
export const createFiberRoot = (containerInfo, tag) => {
    const root = new FiberRootNode(containerInfo, tag);

    const FiberBoundedRoot = bindFiberRootToHostRootFiber(tag, root);
    //todo :: code for initializing the memoizedState

    //todo:: initilizing updateQueue into FiberBoundedRoot
    return root;
};
