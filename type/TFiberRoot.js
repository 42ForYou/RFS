import { TRootTag } from "./TRootTag.js";
import { TExpirationTime } from "./TExpirationTime.js";
import { TFiber } from "./TFiber.js";

/**
 * @typedef {Object} TFiberRoot
 * @description 렌더를 하는 파이버의 루트를 나타내는 객체이다
 * @description 이 해당 객체는 전역적으로 사용되는 정보를 저장하는 Global 공간같은 객체이다
 */
const TFiberRoot = {
    tag: TRootTag, //파이버의 루트의 태그를 나타냅니다
    //ConcurrenRoot만 존재하지만 의미를 위하여 기록합니다.

    //일반적으로 현재 컨테이너가 가르키고 있는 돔 노드를 나타냅니다
    containerInfo: any,

    //아직 처리되지 않은 컴포넌트 임시저장소
    pendingChildren: any,

    //현재 활성화된 Fiber Tree에대한 참조
    current: any,

    //커밋할 준비가 완료된 wip의 expirationTime
    finishedExpirationTime: TExpirationTime,

    //커밋할 준비가 완료된 wip HostRoot
    // A finished work-in-progress HostRoot that's ready to be committed.
    finishedWork: TFiber | null,

    //Todo: 정말로 필요한가?
    //비동기적 요청의 순서를 보장하기 위한 정보
    timeoutHandle: any,

    //가장 Top Cop Context입니다 현재 렌더에 사용되고있는
    context: Object | null,
    //바뀔거지만 아직 확정되진 않은 context value-> 나중에 context랑 교환
    pendingContext: Object | null,

    //Scheduling에 사용 되는 callBackNode
    //Todo: 정확한 설명 필요
    //실행될 함수를 바인드 해놓은 노드
    callbackNode: any,
    callbackExpirationTime: TExpirationTime,
    callbackPriority: any,

    //이전 렌더의 첫번째 Pending Time
    /**
     * @description 해당 FiberRootNode의 첫번째 pendingTime을 설정합니다.
     * @description 해당 파이버 루트내에서 가장 빨리 처리되어야할 우선순위(expirationTime)을 설정합니다.
     */
    firstPendingTime: TExpirationTime,

    lastExpiredTime: TExpirationTime,
};
