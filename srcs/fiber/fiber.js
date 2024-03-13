import { RFS_FRAGMENT_TYPE, RFS_MEMO_TYPE, RFS_PROVIDER_TYPE } from "../core/rfsSymbol.js";
import { Fragment, FunctionComponent, HostRoot, HostText, IndeterminateComponent } from "../const/CWorkTag.js";
import { NoEffect } from "../const/CSideEffectFlags.js";
import { NoWork } from "../const/CExpirationTime.js";
import { ConcurrentMode } from "../const/CTypeOfMode.js";

/**
 * 
 * @param {tag} TWorkTag 
 * @param {pendingProps} pendingProps -> props of the fiber will be rendered
 * @param {key} key = null | string -> conceptual identifier
 * @property {*} ->TFiber
 * @param {mode} TTypeOfMode
 * @returns {import ("../type/TFiber").TFiber}
 @description constructor for FiberNode
@description 자세한 설명은 TFiber.js에 참조
 */
const FiberNode = class {
    constructor(tag, pendingProps, key, mode) {
        //Instance begin
        this.tag = tag;
        this.key = key;
        this.elementType = null;
        this.type = null;
        this.stateNode = null;
        //Instance end

        //Tree begin
        this.return = null;
        this.child = null;
        this.sibling = null;
        this.index = 0;
        //Tree end

        //ref begin
        this.ref = null;
        //ref end

        //파이버의 상태를 기록하고, 업데이트를 관리하기 위한 것들
        this.pendingProps = pendingProps;
        this.memoizedProps = null;
        this.updateQueue = null;
        this.memoizedState = null;
        this.dependencies = null;

        this.mode = mode;
        //파이버의 비교를 위한 것
        this.alternate = null;

        //side effect를 위한 것
        this.effectTag = NoEffect;

        //effects
        this.firstEffect = null;
        this.lastEffect = null;
        this.nextEffect = null;

        this.expirationTime = NoWork;
        this.childExpirationTime = NoWork;

        this.alternate = null;
    }
};

/**
 *
 * @param {tag} TWorkTag
 * @param {pendingProps} pendingProps -> props of the fiber will be rendered
 * @param {key} key = null | string -> conceptual identifier
 * @param {mode} TTypeOfMode
 * @returns {TFiber}
 * @description createFiber function will create a new FiberNode
 * @description this is because that seperate Constructor's implementation from the create function
 */
const createFiber = (tag, pendingProps, key, mode) => {
    return new FiberNode(tag, pendingProps, key, mode);
};

/**
 *
 * @param {import ("../type/TRfsType").TRfsFragment} element
 * @param {import ("../type/TTypeOfMode").TTypeOfMode} mode
 * @param {import ("../type/TExpirationTime").TExpirationTime} expirationTime
 * @param {null | string} key
 * @returns {import ("../type/TFiber").TFiber} fiber
 * @description 해당 함수는 fragment를 위한 파이버를 생성하는 함수이다.
 */

//새로운 파이버를 생성할 때 props.children로 명시적으로 래핑하지 않고 (조각의 자식을 나타내는) 요소를 props 매개변수로 직접 사용하여 createFiberFromFragment를 구현하는 것은 React의 디자인 철학 및 조각의 특정 처리 방식에 부합합니다. 이렇게 직접 할당하면 React의 조정 및 렌더링 프로세스 내에서 조각 처리가 간소화됩니다.

//createFiberFromFragment(element.props.children..)
// 일반적인 컴포넌트 사용에서는 props.children를 통해 자식 컴포넌트를 전달하여
// 컴포넌트가 자식을 렌더링할 수 있도록 하는 전통적인 방식이 사용됩니다.
// 그러나 조각(<React.Fragment> 또는 <>...</>)은 조금 다릅니다.
// 조각은 DOM에 추가 노드를 추가하지 않고 자식 목록을 그룹화하는 데 사용됩니다.
//  React는 조각을 처리할 때 조각의 자식 자체에 관심을 가지며, 객체의 프로퍼티로 취급하지 않습니다.
//   엘리먼트를 파이버의 소품으로 직접 사용함으로써 React는 렌더링 및 조정 중에
//   추가 프로퍼티 액세스(props.children)의 오버헤드 없이 조각의 목적,
//   즉 자식을 위한 투명한 컨테이너를 효율적으로 표현합니다.
export const createFiberFromFragment = (elements, mode, expirationTime, key) => {
    //fragment는 component를 하나로 묶어주는 역할을 하는데,
    // 부를떄 createFiberFromFragment(element.props.children, returnFiber.mode, expirationTime, element.key);
    const fiber = createFiber(Fragment, elements, key, mode);
    fiber.expirationTime = expirationTime;
    return fiber;
};
/**
 *
 * @param {tag} TRootTag ->/type/TRootTag.js
 * @returns fiber @type TFiber
 * @description HostRoot에 대응되는 FiberNode를 생성하는 함수
 */
export const createHostRootFiber = (tag) => {
    return createFiber(HostRoot, null, null, ConcurrentMode);
};

/**
 *
 * @param {string} content
 * @param {import("../type/TTypeOfMode").TTypeOfMode} mode
 * @param {TExpirationTime} expirationTime
 * @returns
 */
export const createFiberFromText = (content, mode, expirationTime) => {
    //텍스트는 데이터 그 자체고 key가 따로 필요 없습니다. 그리고 그 자체가 데이터이기 떄문에 props에 Text
    //그 자체를 넣어주면 됩니다.
    const fiber = createFiber(HostText, content, null, mode);
    fiber.expirationTime = expirationTime;
    return fiber;
};
//TODO: 나중에 IndeterminateComponent로직 함수형으로 통일한거 확인

/**
 *
 * @param {any} type fiber의 타입
 * @param {any} key fiber Key
 * @param {any} pendingProps fiber의 props객체일 수도, props.children일 수도 있음
 * @param {import ("../type/TTypeOfMode").TTypeOfMode} mode
 * @param {import ("../type/TExpirationTime").TExpirationTime} expirationTime
 * @returns {import ("../type/TFiber").TFiber} fiber
 */
export const createFiberFromTypeAndProps = (type, key, pendingProps, mode, expirationTime) => {
    //FunctionComponent라고 가정하고 시작 그래서 type== function인것중에
    //클래스컴포넌트인거 따로 처리하지 않음-> classcomponent구현 x
    let fiberTag = IndeterminateComponent;

    if (typeof type === "string") {
        fiberTag = HostComponent;
    } else {
        getTag: switch (type) {
            case RFS_FRAGMENT_TYPE:
                //props의 children에 보관된 자식들을 통해서 바로 생성-> overHeadx
                return createFiberFromFragment(pendingProps.children, mode, expirationTime, key);
            default: {
                if (typeof type === "object" && type !== null) {
                    switch (type.$$typeof) {
                        case RFS_PROVIDER_TYPE:
                            fiberTag = ContextProvider;
                            break getTag;
                        case RFS_MEMO_TYPE:
                            fiberTag = MemoComponent;
                            break getTag;
                    }
                }
                throw new Error("Unknown Fiber Tag");
                console.error("Unknown Fiber Tag - createFiberFromTypeAndProps");
            }
        }
    }

    fiber = createFiber(fiberTag, pendingProps, key, mode);
    fiber.elementType = type;
    fiber.type = type;
    fiber.expirationTime = expirationTime;
};

/**
 *
 * @param {import("../type/TRfsType").TRfsElement} element
 * @param {import ("../type/TTypeOfMode").TTypeOfMode} mode
 * @param {import ("../type/TExpirationTime").TExpirationTime} expirationTime
 * @returns {import ("../type/TFiber").TFiber} fiber
 * @description rfsElement를 type에 맞는 파이버로 만들어주는 함수이다.
 */
export const createFiberFromElement = (element, mode, expirationTime) => {
    const type = element.type;
    const key = element.key;
    const pendingProps = element.props;
    const fiber = createFiberFromTypeAndProps(type, key, pendingProps, mode, expirationTime);
    return fiber;
};

/**
 * @param {TFiber} root @see 파일경로: [TFiber.js](srcs/type/TFiber.js)
 * @param {any} pendingProps
 * @param {TExpirationTime} expirationTime @see 파일경로: [TExpirationTime.js](srcs/type/TExpirationTime.js)
 * @returns {TFiber} @see 파일경로: [TFiber.js](srcs/type/TFiber.js)
 * @description 리액트는 더블버퍼링을 지원하면서 sharing을 통해서 메모리를 절약합니다.
 * @description 이를 위해서는 sharing하는 구조를 만드는 함수가 필요한데 해당 함수가 그 역할을 합니다.
 * @description 해당 함수로 생겨지는 fiber는 관련된 데이터를 참조(포인터)로 가지고 있으면서 필요한 경우(값을 변경할때) 새로운 객체를 만들어서 참조를 변경합니다.
 * @description 현재의 함수는 참조만 복사하고 있습니다.
 */
export const createWorkInProgress = (current, pendingProps, expirationTime) => {
    //지연 생성(지연평가)를 이용해서 shared랑 공유하는 구조를 만들어야합니다.
    const workInprogress = current.alternate;
    //이전 workInprogress가 없다면 새로운 workInprogress를 만듭니다.
    if (workInprogress === null) {
        workInProgress = createFiber(current.tag, pendingProps, current.key, current.mode);
        workInProgress.elementType = current.elementType;
        workInProgress.type = current.type;
        workInProgress.stateNode = current.stateNode;
        workInProgress.alternate = current;
        current.alternate = workInProgress;
    } else {
        //이미 workInprogress가 있다면 이전 값들을 중 영향을 미칠 것 들을 초기화합니다.
        //앞서 새로 만드는 부분에 생성했던 것들중
        // type, elementType, stateNode, key, mode는 변경되지 않는 값이기 때문에 재사용합니다.
        // 새로값을 바꿔줘야하는 것들은 이제 적용시켜야되는 pendingProps와 이전에 사용한 사이드 이펙트를 초기화합니다.
        workInProgress.pendingProps = pendingProps;

        //이전에 사용한 사이드 이펙트를 초기화합니다.
        workInProgress.effectTag = NoEffect;
        workInProgress.nextEffect = null;
        workInProgress.firstEffect = null;
        workInProgress.lastEffect = null;
    }

    //우선순위를 가져옵니다.
    workInProgress.childExpirationTime = current.childExpirationTime;
    workInProgress.expirationTime = expirationTime;

    //참조 형태로 가져와야 하는 것들을 가져옵니다.
    workInProgress.child = current.child;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.updateQueue = current.updateQueue;

    const currentDependencies = current.dependencies;
    //TODO: TDependencies관련 명세를 제대로 하면서 리팩
    workInProgress.dependencies =
        currentDependencies === null
            ? null
            : {
                  expirationTime: currentDependencies.expirationTime,
                  firstContext: currentDependencies.firstContext,
                  responders: currentDependencies.responders,
              };

    workInProgress.sibling = current.sibling;
    workInProgress.index = current.index;
    workInProgress.ref = current.ref;
    return workInProgress;
};
