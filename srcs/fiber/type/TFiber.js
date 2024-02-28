import { TWorkTag } from "./TWorkTag";
import { TExpirationTime } from "./TExpirationTime";
const TRefObject = {
    current: any,
};

const TSideEffectFlags = {}; // Todo: implement this type, shoulde import from detail file
// TWorkTag Type ends
/**
 * @typedef {Object} Tfiber
 * @property {TWorkTag} tag
 * @property {null | string | number?} key
 * @property {string | function} type
 * @property {any} stateNode
 * @property {TFiber | null} return
 * @property {TFiber | null} child
 * @property {TFiber | null} sibling
 * @property {number} index
 * @property {any} props
 * @property {any} ref
 * @property {THookObject | null} memoizedState
 * @property {TDependencies | null} dependencies
 * @property {TFiber | null} nextEffect
 * @property {TFiber | null} firstEffect
 * @property {TFiber | null} lastEffect
 * @property {TFiber | null} alternate
 * @description 1. to represent the fiber node
 * @description 2. Duck Typing- side Effect and Fiber Node
 */
const TFiber = {
    tag: TWorkTag,
    key: null | String, // 개념적 식별자를 위함이다. 기본적으로 파이버 diff는 타입으로 구별되는데
    // li와 같은 경우는 key를 통해 구별해야 개별요소의 식별이 가능하다

    //타입
    elementType: String | Function, // 정의 타입을 의미한다->본 타입을 유지하기 위해 사용한다
    //예를 들어 고차 컴포넌트와 같은 경우는 고차 컴포넌트가 인스턴스화되면서 고차 컴포넌트 자체를 나타낼 타입과
    //고차 컴포넌트가 실제로 인자로 받아서 나타내는 타입이 다른데 이를 구분하기 위해 사용한다
    //여기서 정의 타입은 사용되는(인자로) 타입을 의미한다(정확히는 반환하는)
    type: String | Function, // 인스턴스 타입을 의미한다. 고차함수에 이용되지 않는 경우는 elementType과 같은 값이다

    stateNode: any, // 파이버의 상태를 나타내는 객체이다.
    //예를 들어 호스트 컴포넌트의 경우는 실제 돔 노드를 나타내어야하고
    //호스트 루트 같은경우는 실제 현재 파이버루트(렌더관련된 전역환경)을 나타내어야한다

    //related with Tree
    return: TFiber | null, //부모 파이버를 나타낸다
    child: TFiber | null, //자식 파이버를 나타낸다
    sibling: TFiber | null, //형제 파이버를 나타낸다
    index: Number, //형제 파이버의 인덱스를 나타낸다

    ref: TRefObject | null, // 파이버의 Ref관리객체를 나타낸다

    //related with Props
    //일반적으로 리액트는 계속 이전에 렌더될떄 사용되었던 값과, 이제 사용될 값을 구별하는데 그를 위함이다
    pendingProps: any, //이제 새로 컴포넌트에 전달될 props를 나타낸다
    memoizedProps: any, //이전 레더링시 사용되었던 props를 나타낸다

    updateQueue: any, // to represent queue of state updates and callbacks
    //리액트 본 소스에서는 현재 파이버에 대한 상태 업데이트와 콜백을 나타낸다
    //여기서 예외처리 throw suspense,등등 여러가지를 나타내는데 현재 지금까지 RFS구현 모델에서는
    //함수형 컴포넌트 인경우에 함수형 컴포넌트에 대해서 업데이트를 해야되는 큐 인 PassiveEffect(useEffect)의
    //리스트를 나타낸다.->해당이유는 너무 타당하다  파이버에 관련해서 업데이트 해야되는 것들에 대해서 나타낸다,
    //useState와 같은 update가 들어가지 않는 이유는 이는 렌더 도중에 다 처리되고 따로 업데이트가 필요없기 때문이다
    //Todo: 다른 곳에서 사용되는 곳이 더 있으면 추가해야한다

    memoizedState: any, //   //현 상태에서 아웃풋을 만들어 낼수 있는 객체의 리스트를 나타낸다
    //함수형 컴포넌트의 경우에는 훅 객체의 리스트가 이것에 해당한다.
    //파이버의 아웃풋을 만들어낼 수 있는거는 useState에의한 업데이트와 useEffect에의한 업데이트가 있다
    //호스트루트 같은 경우는 전역관리공간의 상태를 나타내어야한다

    //앞서 말한거와 같이 리액트는 계속 이전 렌더와 현 렌더에 적용될것을 구별하는데
    //각각의 파이버는 참조에 의해 연결되어야하는데 이를 위해 사용된다
    alternate: TFiber | null,

    //Effect
    //파이버는 덕타이핑으로 파이버 그자체가 될수도, 사이드 이펙트가 될 수 있는데
    //사이드 이펙트로 작동될떄 사용되는 플래그이다
    // 해당 파이버가 이동되어야하는지, 업데이트되어야하는지, 삭제되어야하는지등등을 나타낸다
    effectTag: TSideEffectFlags,

    //Effect List
    //WorkLoop가 진행되면서 어떤 파이버들이 실제로 업데이트가 되어야하는지를 부모로 전달해야하는데
    //이때 사용되는 List이다. 커밋전에 이 리스트가 호스트루트 까지 전달되고
    //커밋과정에서 이것을 소비한다.
    firstEffect: TFiber | null, // 리스트 헤드
    lastEffect: TFiber | null, // 리스트 테일
    nextEffect: TFiber | null, // 다음 파이버

    //Expiration Time
    //기본적으로 scheduler와 reconciler에서 사용되는 Context가 다르다.
    //scheduler에서는 Task의 만료시간을 의미하고
    //reconciler에서는 이벤트가 발생한 시간, 즉 dispatcher에 의해 트리거 된 시간을 의미한다.
    //이는 해당 이벤트를 구분하는 기준으로 쓰일 수 있다.
    //이에 reconciler에서는 expiratonTime에서 발생한 연속적인 이벤트를 하나의 이벤트로 간주한다.
    //Todo: implement ExpirationTime
    //좀더 자세한 내용은 해당 파일에 명세할 예정.
    //자식과 현재 파이버의 만료시간이 분리되어 bailOut에 사용된다.
    expirationTime: TExpirationTime, // to represent the expiration time of the fiber

    //서브트리의 펜딩 변경사항이 없는지 빠르게 확인하기 위해 사용된다
    childExpirationTime: TExpirationTime, // to represent the expiration time of the child
};
