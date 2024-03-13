/**
 * @module fiberStack
 * @description
 * NOTE
 * 항상 cursor가 최신값을 가지고 있고
 * valueStack은 최신 이전값을 가지고 있습니다.
 */

//*NOTE: 파이버 스택은 valueCursor만 보관하는 데 사용되지 않습니다.
//valueCursor의외에도 RootInstanceCursor, HostContextcursor, Fibercursor가
//존재합니다. 이는 자바스크립트의 call stack과 유사하게 동작합니다.
//valueCursor이외의 자세한 설명은 FiberhostContext.js를 참조하십시오
//관련 멘탈 모델은 notion의 추가할 예정입니다. TODO: notion에 추가할 예정입니다.
/**
 * @property {Array<any>} valueStack
 * @property {number} index
 *
 * @description - fiberStack을 구현하기 위해 필요한 변수들입니다.

 */
const fiberStackCore = {
    valueStack: [],
    index: -1,
};

/**
 *
 * @param {any} defaultValue
 *
 * @description - cursor를 생성합니다.
 * @see TStackCursor
 * @returns {TStackCursor}
 */
const createCursor = (defaultValue) => ({
    current: defaultValue,
});

/**
 *
 * @description - 현재 stack이 비어있는지 확인합니다.
 *
 * @returns {boolean}
 */
const isEmpty = () => fiberStackCore.index === -1;

/**
 *
 * @param {TStackCursor} cursor
 * ~~@param {TFiber} fiber~~ -> 사용하지 않는다. react source에서는 dev mode에서만 사용한다.
 *
 * @description - stack에서 pop합니다.
 * 일반적인 pop동작과 달리 현재 가리키는 cursor의 값을 stack에서 꺼내어 cursor에 저장합니다.
 *
 * @returns
 */
const pop = (cursor) => {
    if (fiberStackCore.index < 0) {
        return;
    }

    cursor.current = fiberStackCore.valueStack[fiberStackCore.index];
    fiberStackCore.valueStack[fiberStackCore.index] = null;
    fiberStackCore.index--;
};

/**
 *
 * @param {TStackCursor} cursor
 * @param {any} value
 *
 * @description - stack에 push합니다.
 * valueStack에 현재 cursor의 값을 저장하고 cursor에 새로운 값을 저장합니다.
 */
const push = (cursor, value) => {
    fiberStackCore.index++;

    fiberStackCore.valueStack[fiberStackCore.index] = cursor.current;

    cursor.current = value;
};

export { createCursor, isEmpty, pop, push };
