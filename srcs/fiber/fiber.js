import { HostRoot } from "../const/CWorkTag.js";
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
 * @returns {TFiber} 
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
 * @param {tag} TRootTag ->/type/TRootTag.js
 * @returns fiber @type TFiber
 * @description HostRoot에 대응되는 FiberNode를 생성하는 함수
 */
export const createHostRootFiber = (tag) => {
    return createFiber(HostRoot, null, null, ConcurrentMode);
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
