import is from "./objectIs.js";

const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 *
 * @param {any} objA
 * @param {any} objB
 * @returns {boolean}
 * @description  객체의 키를 반복하고 거짓을 반환하여 같음을 수행합니다.
 * @description 인자 간에 값이 엄격하게 같지 않은 키가 있을 때 반환합니다.
 * @description 모든 키의 값이 엄격하게 같으면 참을 반환합니다.
 */
export const shallowEqual = (objA, objB) => {
    if (is(objA, objB)) {
        return true;
    }

    if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
        return false;
    }

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    if (keysA.length !== keysB.length) {
        return false;
    }

    for (let i = 0; i < keysA.length; i++) {
        if (!hasOwnProperty.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
            return false;
        }
    }

    return true;
};
