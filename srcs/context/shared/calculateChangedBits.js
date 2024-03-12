import { MAX_SIGNED_31_BIT_INT } from "../../const/CExpirationTime.js";
import is from "../../shared/objectIs.js";

/**
 *
 * @param {TContext} context
 * @param {any} newValue
 * @param {any} oldValue
 *
 * @description - context의 변경된 bit를 계산하는 함수입니다.
 * 만약 oldValue와 newValue가 같다면 0을 반환하고
 *
 * 그렇지 않다면, useContext에서 두번째 인자로 넘긴 함수가 있다면 해당 함수를 호출합니다.
 * 만약 해당 함수가 없다면 MAX_SIGNED_31_BIT_INT를 반환합니다.
 *
 * @see CExpirationTime.js
 * @returns {number}
 */
const calculateChangedBits = (context, newValue, oldValue) => {
    if (is(oldValue, newValue)) {
        return 0;
    } else {
        // 만약 _calculateChangedBits가 존재하고 그것이 함수라면 해당 함수를 호출합니다.
        // 이 함수는 처음에 createContext에서 두번째 인자로 클라이언트가 넘겨준 함수입니다.
        const changedBits =
            context._calculateChangedBits === "function"
                ? context._calculateChangedBits(oldValue, newValue)
                : MAX_SIGNED_31_BIT_INT;
        return changedBits | 0;
    }
};

export default calculateChangedBits;
