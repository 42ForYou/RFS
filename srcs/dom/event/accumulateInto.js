/**
 * @description
 * `current`에 `null`이나 `undefined`가 아닌 항목들을 축적합니다. 이는 배열 할당을 피하여 메모리를 절약하기 위한 목적으로 사용되므로,
 * API의 명확성이 희생됩니다. `current`가 이 함수로 전달되기 전에는 `null`일 수 있지만, 함수 실행 후에는 `null`이 아닌 값이 될 수 있으므로,
 * 함수 사용 후에는 결과를 `current`에 다시 할당해야 합니다:
 *
 * `a = accumulateInto(a, b);`
 *
 * 이 API는 깨끗하게 사용하고 싶다면 `accumulate`를 시도해보세요. 이 함수는 드물게 사용되어야 합니다.
 *
 * @return {*|array<*>} 축적된 항목들의 집합입니다.
 */
const accumulateInto = (current, next) => {
    if (next === null) {
        console.error("accumulateInto(...): Accumulated items must not be null or undefined.");
        throw new Error("accumulateInto(...): Accumulated items must not be null or undefined.");
    }

    if (current === null) {
        return next;
    }

    // 둘 다 비어있지 않습니다. 주의: x가 배열인지 확실하지 않을 때는 x.concat(y)를 호출하지 마십시오 (x가 concat 메서드를 가진 문자열일 수 있습니다).
    if (Array.isArray(current)) {
        if (Array.isArray(next)) {
            current.push(...next);
            return current;
        }
        current.push(next);
        return current;
    }

    if (Array.isArray(next)) {
        // `next`를 변형하는 것은 조금 위험합니다.
        return [current].concat(next);
    }

    return [current, next];
};

export default accumulateInto;
