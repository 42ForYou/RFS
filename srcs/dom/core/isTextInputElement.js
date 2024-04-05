// supportedInputTypes 객체: HTML5에서 지원하는 <input> 요소의 여러 타입들을 나열하고 있으며,
// 텍스트 입력을 받을 수 있는 타입에 대해서는 true를 값으로 가집니다.
// 이 객체는 <input> 요소의 타입이 텍스트 입력을 위한 타입인지를 확인하는 데 사용됩니다.
const supportedInputTypes = {
    color: true,
    date: true,
    datetime: true,
    "datetime-local": true,
    email: true,
    month: true,
    number: true,
    password: true,
    range: true,
    search: true,
    tel: true,
    text: true,
    time: true,
    url: true,
    week: true,
};

/**
 *
 * @param {*} elem
 * @description isTextInputElement 함수: 주어진 HTML 요소가 텍스트를 입력받을 수 있는 요소인지를 판단합니다.
 * 요소가 <input>인 경우, 그 타입이 supportedInputTypes에 정의된 텍스트 입력 가능한 타입 중
 * 하나인지를 확인하고, <textarea>인 경우 항상 true를 반환합니다.
 * 이는 <textarea> 요소가 텍스트 입력을 위한 요소임이 명백하기 때문입니다.
 */
const isTextInputElement = (elem) => {
    const nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();

    if (nodeName === "input") {
        return !!supportedInputTypes[elem.type];
    }

    if (nodeName === "textarea") {
        return true;
    }

    return false;
};

export default isTextInputElement;
