import { createHostRootFiber } from "./fiber.js";
import { NoWork } from "../const/CExpirationTime.js";

/**
    @description FiberRoot는 해당 Fiber에 대해서 관리를 위한 그 스코프내의 전역관리 공간이라고 생각할 수 있습니다. 
    그 전역관리 공간의 설정은 해당 Class에 의해 관리됩니다
    @return {TFiberRoot} -> 생성된 FiberRootNode를 반환합니다.
 */
const FiberRootNode = class {
    /**
     * @description 생성자
     * @return {TFiberRoot} -> 생성된 FiberRootNode를 반환합니다.
     * @description 정확한 명세는 TFiberRoot를 참조하십시오.
     */
    constructor(containerInfo, tag) {
        this.tag = tag;
        this.containerInfo = containerInfo;
        this.pendingChildren = null;
        this.current = null;
        this.finishedExpirationTime = NoWork;
        this.finishedWork = null;
        //Todo: TimeoutHandle의 정확한 명세가 필요합니다.
        this.timeoutHandle = null;
        this.context = null;
        //NOTE: disableLegacyContext와 그리고 getContextForSubtree관련있는데 이건 서브트리에서 받아와서
        //NOTE: 렌더하는거랑 관련있는듯 => 구현 x
        // this.pendingContext = null;
        this.callbackNode = null;
        this.callbackPriority = null;
        this.callbackExpirationTime = NoWork;
        /**
         * @description 해당 FiberRootNode의 첫번째 pendingTime을 설정합니다.
         * @description 해당 파이버 루트내에서 가장 빨리 처리되어야할 우선순위(expirationTime)을 설정합니다.
         */
        this.firstPendingTime = NoWork;
        this.lastExpiredTime = NoWork;
    }
};

/**
 * @param {containerinfo} container -> host Instance를 인자로 받는다-> Element|Document|DocumentFragment
 * @param {tag} TRootTag -> Refer shred/type/TRootTag.js
 * @description FiberRoot는 해당 Fiber에 대해서 관리를 위한 그 스코프내의 전역관리 공간이라고 생각할 수 있습니다. 그 전역관리 공간의 설정은 해당 Class
 * 에 의해서 생성되며 그렇게 생성된 객체에 실제 대응될 Fiber를 생성하여 연결을 시켜줍니다. 그리고 conatiner를 생성된 파이버와 연결시켜줍니다.
 * 이후에 memoizedState를 초기화 시켜주고, updateQueue를 초기화 시켜줍니다.-> Todo: implement this functions
 * @returns {fiberRootNode} -> fiberRoot에 대해 globalScope로 역할을 하는 객체를 반환합니다.
 */
export const createFiberRoot = (containerInfo, tag) => {
    const root = new FiberRootNode(containerInfo, tag);

    /**
 * @param {tag} RootTag -> Refer to const.js
 * @param {FiberRoot} FiberRoot -> FiberRoot
 * @description    fiberRoot에 대응되는 HostRootFiber를 생성시키고
    // FiberRoot에 연결하며
    // 그 Fiber에 대해서 Root의 Container를 연결시켜줍니다.
    @return {Fiber} -> hostRootFiber를 반환합니다.
    */
    const bindFiberRootToHostRootFiber = (tag, FiberRoot) => {
        //현재 FiberRoot의 rootTag기반으로 호스트RootFiber를 생성합니다.
        const FiberBoundedRoot = createHostRootFiber(tag);
        //현재 FiberRoot의 activeFiber를 호스트RootFiber로 설정합니다.
        FiberRoot.current = FiberBoundedRoot;
        //호스트루트 파이버의 현재 로컬 상태로는 파이버루트가 설정되어야합니다.
        //fiberRoot와 호스트루트파이버가 양방향으로 연결되어야합니다.
        FiberBoundedRoot.stateNode = FiberRoot;
    };
    bindFiberRootToHostRootFiber(tag, root);
    return root;
};

export const markRootUpdatedAtTime = (root, expirationTime) => {
    const firstPendingTime = root.firstPendingTime;

    //만약 현재 expirationTime이 firstPendingTime보다 크다면
    //즉 우선순위가 높은 (이벤트로 치면 좀더 예전에 발생한) expirationTime이라면
    //가장 먼저 처리되어야하는 일임으로 firstPendingTime을 expirationTime으로 설정합니다.
    if (expirationTime > firstPendingTime) {
        root.firstPendingTime = expirationTime;
    }
};

/**
 *
 * @param {TFiberRoot} root @see 파일경로: srcs/type/TFiberRoot.js
 * @param {TExpirationTime} expirationTime @see 파일경로: srcs/type/TExpirationTime.js
 * @description 현재 루트의 만료시간을 설정합니다. 이는 보통 타임아웃과 관련이 있습니다.
 */
export const markRootExpiredAtTime = (root, expirationTime) => {
    const lastExpiredTime = root.lastExpiredTime;
    //여기선 만료시간의 문맥이라 expirationTime보다 lastExpiredTime이 작다면 더 최근에 일어난 것
    //이라는 뜻이다. 그러므로 lastExpiredTime을 expirationTime으로 설정해준다.
    if (lastExpiredTime === NoWork || lastExpiredTime > expirationTime) {
        root.lastExpiredTime = expirationTime;
    }
};
