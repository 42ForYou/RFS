import { createCursor } from "../../fiber/fiberStack";

/**
 * @property {Cursor} valueCursor - fiberStack을 가리키고 있으며, 현재 context의 value를 가리킨다.
 * @property {undefined | string} rendererSigil - 해당 변수는 여러개의 renderer가 동시에 동작할 때,
 * 같은 context를 공유하는지 확인하기 위한 변수이다. 현재 react 16.12.0은 해당기능을 지원하지 않기 때문에
 * 개발 모드에서 warning을 출력하기 위해 사용된다.
 * @property {Fiber | null} currentlyRenderingFiber - 현재 렌더링 중인 fiber를 가리킨다.
 * @property {TContextItem | null} lastContextDependency - 마지막으로 의존성을 가진 contextItem를 가리킨다.
 * @property {TContext | null} lastContextWithAllBitsObserved - 마지막으로 모든 bit를 관찰한 context를 가리킨다.
 */
export default {
    valueCursor: createCursor(null),
    rendererSigil: undefined,
    currentlyRenderingFiber: null,
    lastContextDependency: null,
    lastContextWithAllBitsObserved: null,
};
