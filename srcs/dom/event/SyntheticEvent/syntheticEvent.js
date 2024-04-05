const EVENT_POOL_SIZE = 10;
const functionThatReturnsTrue = () => true;
const functionThatReturnsFalse = () => false;
const EventInterface = {
    //이벤트 타입
    type: null,
    //이벤트 타겟이 들어감
    target: null,
    // currentTarget is set when dispatching; no use in copying it here
    currentTarget: () => null,
    //캡처링단계->1, 타겟단계 ->2, 버블링단계 ->3, 0-> 어느 전파단계에도 속하지 않음
    eventPhase: null,
    //boolean값으로 이벤트가 버블링이 가능한지 여부를 나타냅니다.
    bubbles: null,
    cancelable: null,
    timeStamp: (event) => event.timeStamp || Date.now(),
    defaultPrevented: null,
    //이벤트가 사용자에 의해 생성되었으면 true, 아니면 코드에 의해 (element.click()같은) 생성되었으면 false
    isTrusted: null,
};
const SyntheticEvent = class {
    //this.constructor.Interface == static Interface
    //dispatchConfig 이벤트 마다 이벤트의 특성을 config를 통해 각각 특성을 보관하는데 그 객체
    //targetInst 이벤트가 발생한 타겟의 인스턴스(fiber)
    /**
     *
     * @param {TDispatchConfig} dispatchConfig ->이벤트 마다 이벤트의 특성을 config를 통해 각각 특성을 보관하는데 그 객체
     * @param {TFiber}  targetInst 이벤트가 발생한 타겟의 인스턴스(fiber)
     * @param {*} nativeEvent 실제 브라우저에 의해 발생한 이벤트
     * @param {*} nativeEventTarget 실제 브라우저가 이벤트를 발생시킨 타겟
     * @description syntheticEvent를 생성하는 생성자
     * @description 해당 event는 내부에서 rfs내부에서 관리되는 이벤트 시스템으로 내부에서 관리되는
     * @description 데 필요한 기본 속성이 생성자에서 초기화 되며 param에서 받은 것들을 내부적으로 보관하고 이용함
     */
    constructor(dispatchConfig, targetInst, nativeEvent, nativeEventTarget) {
        this.dispatchConfig = dispatchConfig;
        this._targetInst = targetInst;
        this.nativeEvent = nativeEvent;

        //기본적으로 SyntheticEvent의 인터페이스를 따르는 속성을 nativeEvent를 가지고 초기화
        const Interface = this.constructor.Interface;
        for (const propName in Interface) {
            if (!Interface.hasOwnProperty(propName)) {
                continue;
            }
            const normalize = Interface[propName];
            //만약 함수라면 nativeEvent를 통해 해당 원하는 속성을 만들어냄
            //예) timeStamp를 통해 event.timestamp속성을 가져오거나 Date.now()로 현재시간을가져옴
            //예) currentTarget은 디스패처에 의해 세팅됨으로 처음엔 null로 초기화
            if (normalize) {
                this[propName] = normalize(nativeEvent);
            } else {
                if (propName === "target") {
                    //target인 경우는  nativeEventTarget그 자체를 넣어줌
                    this.target = nativeEventTarget;
                } else {
                    //아닌경우 nativeEvent의 속성을 그대로 넣어줌
                    this[propName] = nativeEvent[propName];
                }
            }
        }

        const defaultPrevented =
            nativeEvent.defaultPrevented !== null ? nativeEvent.defaultPrevented : nativeEvent.returnValue === false;
        //lambda를 넣어줘서 이벤트가 발생했을때 함수를 부르도록 함.
        this.isDefaultPrevented = defaultPrevented ? functionThatReturnsTrue : functionThatReturnsFalse;
        this.isPropagationStopped = functionThatReturnsFalse;
    }

    //이벤트 자체를 default행동을 막음
    /**
     *
     * @description 내부 rfs이벤트 시스템에서 이벤트의 기본 행동을 막는 함수
     */
    preventDefault() {
        //내부 defaultPrevented를 true로 바꿔줌
        this.defaultPrevented = true;
        const event = this.nativeEvent;
        if (!event) {
            return;
        }

        //nativeEvent가 preventDefault 함수를 가지고 있으면 실행
        if (event.preventDefault) {
            event.preventDefault();
        } else if (typeof event.returnValue !== "unknown") {
            //Legacy브라우저의 preventDefault방지 방식
            event.returnValue = false;
        }
        //내부 rfs이벤트에서 defaultPrevented를 확인하는 lambda함수를 true로 바꿔줌
        this.isDefaultPrevented = functionThatReturnsTrue;
    }

    /**
     *
     * @description 내부 rfs이벤트 시스템에서 이벤트의 전파를 막는 함수
     */
    stopPropagation() {
        const event = this.nativeEvent;
        if (!event) {
            return;
        }

        //nativeEvent가 stopPropagation 함수를 가지고 있으면 실행
        if (event.stopPropagation) {
            event.stopPropagation();
        } else if (typeof event.cancelBubble !== "unknown") {
            //Legacy브라우저의 stopPropagation방지 방식
            event.cancelBubble = true;
        }

        //내부 rfs이벤트에서 stopPropagation을 확인하는 lambda함수를 true로 바꿔줌
        this.isPropagationStopped = functionThatReturnsTrue;
    }
    /**
     * @description 각 이벤트 루프가 끝날 때마다 파견된 모든 `SyntheticEvent`를 event Pool로 다 복귀시키는데
     * @description 복귀 시키지 않을 이벤트를 지정하는 함수
     * @description 풀에 다시 복귀 않는 참조를 보유할 수 있습니다.
     * @description async관련된 동작을 할때 이벤트가 참조가 안되는 부분을 고칠때 사용
     */
    persist() {
        this.isPersistent = functionThatReturnsTrue;
    }

    /**
     *
     * @returns {boolean} -> 이벤트가 풀에 다시 복귀하지 않는지 여부를 반환
     * @description 이벤트가 풀에 다시 복귀하지 않는지 여부를 반환-> 기본적으로는 false를 반환
     */
    isPersistent() {
        return functionThatReturnsFalse();
    }

    /**
     * @description SyntheticEvent를 소멸 시키는 함수
     * @description 내부적으로 pool시스템을 쓰기 떄문에 가비지 콜렉터가 아니라 재활용을 하기 위해서
     * @description 해당 부분의 참조 및 property 부분을 모두 소멸시켜줘야함
     */
    destructor() {
        const Interface = this.constructor.Interface;
        for (const propName in Interface) {
            this[propName] = null;
        }
        this.dispatchConfig = null;
        this._targetInst = null;
        this.nativeEvent = null;
        this.isDefaultPrevented = functionThatReturnsFalse;
        this.isPropagationStopped = functionThatReturnsFalse;
        //해당 부분은 dispatch에 의해 들어감
        this._dispatchListeners = null;
        this._dispatchInstances = null;
    }
};

//NOTE: 기본적으로 껍데기 들은 재 활용하고 싶은게 이벤트 풀 시스템의 존재 의미이다.
//NOTE: 새로 할당할필요 없이 사용한 껍데기(SynthecticEvent)를 다시 사용하게 하기 위함
/**
 *
 * @param {*} dispatchConfig
 * @param {*} targetInst
 * @param {*} nativeEvent
 * @param {*} nativeEventTarget
 * @description 내부적으로 여러 synthectic Event를 상속받은 EventConstructor에 의해 이벤트를 만드는데
 * @description 이벤트 풀이 존재하면 이벤트에서 해당 껍대기를 가져와서 사용한다.
 */
const getPooledEvent = (dispatchConfig, targetInst, nativeEvent, nativeEventTarget) => {
    const EventConstructor = this;
    if (EventConstructor.eventPool.length) {
        const instance = EventConstructor.eventPool.pop();
        EventConstructor.call(instance, dispatchConfig, targetInst, nativeEvent, nativeEventTarget);
        return instance;
    }
    return new EventConstructor(dispatchConfig, targetInst, nativeEvent, nativeEventTarget);
};

/**
 *
 * @param {*} event
 * @description 현재 이벤트 객체를 소멸시키고 이벤트 풀로 껍데기(syntheticEvent)를 다시 넣어주는 함수
 */
const releasePooledEvent = (event) => {
    const EventConstructor = this;
    event.destructor();
    if (EventConstructor.eventPool.length < EVENT_POOL_SIZE) {
        EventConstructor.eventPool.push(event);
    }
};
const addEventPoolingTo = (EventConstructor) => {
    EventConstructor.eventPool = [];
    EventConstructor.getPooled = getPooledEvent;
    EventConstructor.release = releasePooledEvent;
};
// Static properties and methods
//syntacticEvent의 인터페이스는 EventInterface를 따르고 있음
//생성자 함수의(클래스)의 interface property를 정의해주는 부분
//생성자 함수에 property로 직접 정의 하는 이유는 static으로 관리해야 되는 부분을 외부적으로 공룡으로 addEventPoolingTo라는
//함수라 외부에서 관리할 수 있게 하기 위함이다. 이는 내부적으로 쓰는 static방식보다 컨트롤 할 수 있는 방식으로 구현한다.
SyntheticEvent.Interface = EventInterface;
addEventPoolingTo(SyntheticEvent);

//NOTE: 중간 객체 생성하는 방식으로 만드는 이유 :
// class Super {
//     constructor() {
//       console.log('Super의 생성자 호출');
//       this.isSuperInstance = true;
//     }

//     superMethod() {
//       return 'superMethod 호출됨';
//     }
//   }

//   // 중간 객체 생성 방식
//   function E() {}
//   E.prototype = Super.prototype;

//   const prototype = new E();
//   console.log('중간 객체 생성 방식');
//   console.log(prototype.superMethod());  // "superMethod 호출됨"
//   console.log(prototype.isSuperInstance);  // undefined, Super의 생성자는 호출되지 않았음

//   // 직접 Super 인스턴스 생성 방식
//   const superInstance = new Super();
//   console.log('\n직접 인스턴스 생성 방식');
//   console.log(superInstance.superMethod());  // "superMethod 호출됨"
//   console.log(superInstance.isSuperInstance);  // true, Super의 생성자가 호출되었음

SyntheticEvent.extend = function (Interface) {
    // 현재 클래스를 Super로 참조. 확장하려는 base 클래스입니다.
    const Super = this;

    // E 함수는 중간 객체를 생성하기 위해 사용. 이는 프로토타입 체인을 복제.
    // 순수하게 프로토타입을 복제하기 위해 Super.prototype을 상속합니다.-super객체 생성x
    const E = () => {};
    E.prototype = Super.prototype;
    const prototype = new E();

    // Class 함수는 새로운 클래스의 생성자 함수입니다. 여기서 Super.apply를 사용하여
    // Super의 생성자를 현재 인스턴스의 컨텍스트에서 호출합니다.
    // arguments 대신 rest 문법을 사용하여 모든 인자를 배열로 받습니다.
    const Class = function (...args) {
        return Super.apply(this, args);
    };
    // Class의 프로토타입을 복제한 객체에 Super 클래스의 프로토타입을 복사합니다.
    // 이를 통해 Class 인스턴스는 Super의 모든 메소드와 속성을 상속받게 됩니다.
    Object.assign(prototype, Class.prototype);
    Class.prototype = prototype;

    // 생성자를 명시적으로 설정합니다. 이는 인스턴스 생성 시 new 연산자와 함께 호출됩니다.
    Class.prototype.constructor = Class;

    // Interface 객체를 통해 제공된 추가 속성을 Class의 Interface에 할당합니다.
    // 이는 Class가 특정 인터페이스를 구현하도록 확장하는 데 사용됩니다.
    // 이는 property(interface)를 머지하는 방식으로 확장을 하게 됨
    Class.Interface = Object.assign({}, Super.Interface, Interface);
    // extend 메서드 자체도 상속하여, 생성된 클래스에서도 서브클래스를 만들 수 있도록 합니다.
    Class.extend = Super.extend;
    // 이벤트 풀링 기능을 추가합니다. 이는 이벤트 객체의 재사용을 가능하게 해 성능을 향상시킵니다.
    addEventPoolingTo(Class);

    // 확장된 새 클래스를 반환합니다.
    return Class;
};

export default SyntheticEvent;
